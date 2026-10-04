'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Activity } from '@/types/database.types';

export async function createActivityAction(payload: Partial<Activity>) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!payload.summary?.trim()) {
    return { success: false, error: 'El resumen de la actividad es obligatorio.' };
  }

  const { data, error } = await supabase
    .from('activities')
    .insert([
      {
        lead_id: payload.lead_id || null,
        client_id: payload.client_id || null,
        project_id: payload.project_id || null,
        activity_type: payload.activity_type || 'Llamada',
        activity_date: payload.activity_date || new Date().toISOString(),
        user_id: userData?.user?.id || null,
        summary: payload.summary.trim(),
        result: payload.result?.trim() || null,
        next_step: payload.next_step?.trim() || null,
        next_followup_date: payload.next_followup_date || null,
        visibility: payload.visibility || 'Interno',
        status: payload.status || 'Realizada',
      },
    ])
    .select(`
      *,
      profiles:user_id(full_name, email)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Si tiene próxima acción y fecha, actualizar el lead correspondiente
  if (payload.lead_id && (payload.next_step || payload.next_followup_date)) {
    await supabase
      .from('leads')
      .update({
        next_action: payload.next_step || undefined,
        next_followup_date: payload.next_followup_date || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.lead_id);
  }

  revalidatePath('/');
  if (payload.client_id) revalidatePath(`/clientes/${payload.client_id}`);
  if (payload.project_id) revalidatePath(`/proyectos/${payload.project_id}`);

  return { success: true, activity: data };
}

export async function getLeadActivitiesAction(leadId: string): Promise<Activity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('activities')
    .select(`
      *,
      profiles:user_id(full_name, email)
    `)
    .eq('lead_id', leadId)
    .order('activity_date', { ascending: false });

  if (error) {
    console.error('Error fetching activities:', error);
    return [];
  }

  return (data as Activity[]) || [];
}
