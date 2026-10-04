'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { AvailabilityBlock, Meeting, MeetingStatus } from '@/types/database.types';

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

  return {
    robinson: adminProfiles?.[0] || null,
    blocks: (blocks as AvailabilityBlock[]) || [],
    meetings: (meetings as Meeting[]) || [],
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
