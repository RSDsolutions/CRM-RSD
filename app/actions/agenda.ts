'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { AvailabilityBlock, Meeting, MeetingStatus, WeeklySchedule } from '@/types/database.types';

/**
 * Obtiene los bloques de disponibilidad y los horarios ya reservados.
 */
export async function getAgendaScheduleAction(startDate: string, endDate: string) {
  const supabase = createClient();

  // 1. Obtener usuario Robinson / Admin
  const { data: adminProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('role', 'admin')
    .limit(1);

  const robinsonId = adminProfiles?.[0]?.id || null;

  // 2. Obtener bloques de disponibilidad
  const { data: blocks } = await supabase
    .from('availability_blocks')
    .select('*')
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .order('start_time', { ascending: true });

  // 3. Obtener reuniones programadas
  const { data: meetings } = await supabase
    .from('meetings')
    .select(`
      *,
      host_profile:host_id(full_name, email),
      advisor_profile:advisor_id(full_name, email),
      leads:lead_id(company_name, contact_name, phone)
    `)
    .gte('start_time', startDate)
    .lte('end_time', endDate)
    .neq('status', 'Cancelada')
    .order('start_time', { ascending: true });

  // 4. Obtener horario semanal configurado
  const { data: weeklySchedules } = await supabase
    .from('weekly_schedules')
    .select('*')
    .eq('user_id', robinsonId || '')
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  return {
    robinson: adminProfiles?.[0] || null,
    blocks: (blocks as AvailabilityBlock[]) || [],
    meetings: (meetings as Meeting[]) || [],
    weeklySchedules: (weeklySchedules as WeeklySchedule[]) || [],
  };
}

/**
 * Crea un bloque de disponibilidad o un bloqueo de no disponibilidad (solo Admin/Robinson).
 */
export async function createAvailabilityBlockAction(payload: {
  title: string;
  slot_type: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes?: string;
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert([
      {
        user_id: userData.user.id,
        title: payload.title,
        slot_type: payload.slot_type,
        start_time: payload.start_time,
        end_time: payload.end_time,
        is_available: payload.is_available,
        notes: payload.notes || null,
      },
    ])
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/agenda');
  return { success: true, block: data };
}

/**
 * Elimina un bloque de disponibilidad.
 */
export async function deleteAvailabilityBlockAction(blockId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('availability_blocks').delete().eq('id', blockId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/agenda');
  return { success: true };
}

/**
 * RESERVA ATÓMICA DE CITA (Anti Doble Reserva)
 * Ejecuta la función RPC book_meeting_slot con bloqueo transaccional pesimista.
 */
export async function bookMeetingSlotAction(payload: {
  title: string;
  meeting_type: string;
  host_id: string;
  lead_id?: string | null;
  client_id?: string | null;
  project_id?: string | null;
  start_time: string;
  end_time: string;
  modality?: string;
  meeting_url?: string;
  objective?: string;
  notes?: string;
}) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) {
    return { success: false, error: 'Usuario no autenticado.' };
  }

  try {
    // Opcional: Validar disponibilidad semanal en servidor (simplificado). 
    // Para no complicar con zonas horarias en SQL, validamos aquí en TS o confiamos en el cliente y la función SQL (que detecta solapamientos).
    // Nota: El RPC `book_meeting_slot` solo revisa `is_available = false` y reuniones traslapadas.
    // Si queremos obligar horario semanal, lo verificamos:
    
    const { data: weeklyData } = await supabase
      .from('weekly_schedules')
      .select('*')
      .eq('user_id', payload.host_id);
    
    if (weeklyData && weeklyData.length > 0) {
      // Tiene horarios semanales configurados. Verificar si el horario solicitado cae dentro.
      const startDate = new Date(payload.start_time);
      const endDate = new Date(payload.end_time);
      
      // Convertir a zona horaria local de Colombia/Ecuador (UTC-5) para comparar con la BD
      const getBogotaParts = (date: Date) => {
        const str = new Intl.DateTimeFormat('en-US', {
          timeZone: 'America/Bogota',
          hour: 'numeric',
          minute: 'numeric',
          hour12: false,
          weekday: 'short',
        }).format(date);
        // str "Wed, 15:30" or "15:30"
        const dayMap: Record<string, number> = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
        const dayMatch = str.match(/([a-zA-Z]+)/);
        const dayOfWeek = dayMatch ? dayMap[dayMatch[1]] || 7 : 7;
        
        const timeMatch = str.match(/(\d+):(\d+)/);
        let h = 0, m = 0;
        if (timeMatch) {
          h = parseInt(timeMatch[1], 10);
          if (h === 24) h = 0; // Fix edge case
          m = parseInt(timeMatch[2], 10);
        }
        return { dayOfWeek, minutes: h * 60 + m };
      };

      const startParts = getBogotaParts(startDate);
      const endParts = getBogotaParts(endDate);

      const dayOfWeek = startParts.dayOfWeek;
      const startMinutes = startParts.minutes;
      const endMinutes = endParts.minutes;

      let isWithinWeekly = false;
      for (const schedule of weeklyData) {
        if (schedule.day_of_week === dayOfWeek) {
          const [sH, sM] = schedule.start_time.split(':').map(Number);
          const [eH, eM] = schedule.end_time.split(':').map(Number);
          const blockStartMinutes = sH * 60 + sM;
          const blockEndMinutes = eH * 60 + eM;
          
          if (startMinutes >= blockStartMinutes && endMinutes <= blockEndMinutes) {
            isWithinWeekly = true;
            break;
          }
        }
      }
      
      // Si no está en el horario semanal, verificamos si hay un bloque explícito 'is_available = true'
      if (!isWithinWeekly) {
        const { data: availBlock } = await supabase
          .from('availability_blocks')
          .select('id')
          .eq('user_id', payload.host_id)
          .eq('is_available', true)
          .lte('start_time', payload.start_time)
          .gte('end_time', payload.end_time)
          .limit(1);
          
        if (!availBlock || availBlock.length === 0) {
          return { success: false, error: 'El horario seleccionado está fuera del horario semanal de disponibilidad configurado.' };
        }
      }
    }

    const { data: meetingId, error } = await supabase.rpc('book_meeting_slot', {
      p_title: payload.title,
      p_meeting_type: payload.meeting_type || 'Diagnóstico',
      p_host_id: payload.host_id,
      p_advisor_id: userData.user.id,
      p_lead_id: payload.lead_id || null,
      p_client_id: payload.client_id || null,
      p_project_id: payload.project_id || null,
      p_start_time: payload.start_time,
      p_end_time: payload.end_time,
      p_modality: payload.modality || 'Virtual',
      p_meeting_url: payload.meeting_url || null,
      p_objective: payload.objective || null,
      p_notes: payload.notes || null,
    });

    if (error) {
      if (error.message.includes('CONFLICTO_HORARIO')) {
        return {
          success: false,
          error: 'El horario seleccionado ya ha sido reservado por otro asesor. Por favor selecciona otro intervalo libre.',
        };
      }
      if (error.message.includes('HORARIO_BLOQUEADO')) {
        return {
          success: false,
          error: 'Robinson tiene un bloqueo de no disponibilidad programado en este horario.',
        };
      }
      return { success: false, error: error.message };
    }

    // Registrar actividad automática de la cita agendada
    if (payload.lead_id) {
      await supabase.from('activities').insert([
        {
          lead_id: payload.lead_id,
          activity_type: 'Reunión',
          user_id: userData.user.id,
          summary: `Reunión agendada con Robinson: ${payload.title} (${payload.meeting_type})`,
          activity_date: payload.start_time,
          next_step: 'Preparar reunión y validar asistencia del cliente',
          visibility: 'Interno',
          status: 'Planificada',
        },
      ]);
    }

    revalidatePath('/');
    revalidatePath('/agenda');
    return { success: true, meetingId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error inesperado al reservar cita.';
    return { success: false, error: message };
  }
}

/**
 * Actualiza el resultado o estado de una reunión (Confirmada, Realizada, Cancelada, etc.)
 */
export async function updateMeetingStatusAction(
  meetingId: string,
  payload: {
    status: MeetingStatus;
    result?: string;
    next_steps?: string;
    notes?: string;
  }
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('meetings')
    .update({
      status: payload.status,
      result: payload.result || undefined,
      next_steps: payload.next_steps || undefined,
      notes: payload.notes || undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', meetingId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Si se marcó como Realizada o Cancelada y tiene lead asociado, registrar actividad
  if (data?.lead_id && (payload.status === 'Realizada' || payload.status === 'Cancelada')) {
    await supabase.from('activities').insert([
      {
        lead_id: data.lead_id,
        activity_type: data.meeting_type === 'Diagnóstico' ? 'Diagnóstico' : 'Reunión',
        summary: `Reunión ${payload.status.toLowerCase()}: ${data.title}`,
        result: payload.result || `Estado: ${payload.status}`,
        next_step: payload.next_steps || null,
        visibility: 'Interno',
        status: payload.status === 'Realizada' ? 'Realizada' : 'Cancelada',
      },
    ]);
  }

  revalidatePath('/agenda');
  revalidatePath('/');
  return { success: true, meeting: data };
}

/**
 * Guarda o actualiza los horarios semanales de un usuario.
 */
export async function saveWeeklySchedulesAction(
  userId: string,
  schedules: { day_of_week: number; start_time: string; end_time: string }[]
) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user || userData.user.id !== userId) {
    // Si no es el propio usuario, verificamos si es admin
    const { data: adminProfiles } = await supabase.from('profiles').select('role').eq('id', userData?.user?.id || '').single();
    if (adminProfiles?.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para modificar este horario.' };
    }
  }

  // Borrar horarios actuales
  await supabase.from('weekly_schedules').delete().eq('user_id', userId);

  if (schedules.length > 0) {
    // Insertar los nuevos
    const { error } = await supabase.from('weekly_schedules').insert(
      schedules.map(s => ({
        user_id: userId,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
      }))
    );

    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath('/agenda');
  return { success: true };
}
