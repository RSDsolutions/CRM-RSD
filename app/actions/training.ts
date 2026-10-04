'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { TrainingSession } from '@/types/database.types';

export async function recordTrainingSessionAction(payload: {
  project_id: string;
  client_id: string;
  session_date: string;
  modality: 'Virtual' | 'Presencial';
  attendees: string;
  topics_covered: string;
  delivered_materials?: string;
  client_questions?: string;
  pending_items?: string;
  client_confirmed?: boolean;
  confirmation_notes?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('training_sessions')
    .insert([
      {
        project_id: payload.project_id,
        client_id: payload.client_id,
        session_date: payload.session_date,
        modality: payload.modality,
        attendees: payload.attendees.trim(),
        topics_covered: payload.topics_covered.trim(),
        delivered_materials: payload.delivered_materials?.trim() || null,
        client_questions: payload.client_questions?.trim() || null,
        pending_items: payload.pending_items?.trim() || null,
        instructor_id: user?.id || null,
        client_confirmed: payload.client_confirmed || false,
        confirmation_notes: payload.confirmation_notes?.trim() || null,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${payload.project_id}`);
  revalidatePath(`/clientes/${payload.client_id}`);
  return { success: true, session: data };
}

export async function getProjectTrainingSessionsAction(projectId: string): Promise<TrainingSession[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('project_id', projectId)
    .order('session_date', { ascending: false });

  if (error) {
    console.error('Error fetching training sessions:', error);
    return [];
  }
  return data || [];
}
