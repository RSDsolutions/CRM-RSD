'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { ProjectMilestone } from '@/types/database.types';

export async function createMilestoneAction(payload: {
  project_id: string;
  title: string;
  description?: string;
  target_date: string;
  order_index?: number;
}) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('project_milestones')
    .insert([
      {
        project_id: payload.project_id,
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        target_date: payload.target_date,
        order_index: payload.order_index || 1,
        status: 'Pendiente',
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${payload.project_id}`);
  return { success: true, milestone: data };
}

export async function updateMilestoneStatusAction(
  milestoneId: string,
  projectId: string,
  newStatus: 'Pendiente' | 'En progreso' | 'Completado' | 'Atrasado'
) {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'Completado') {
    updates.completed_date = new Date().toISOString();
  }

  const { error } = await supabase
    .from('project_milestones')
    .update(updates)
    .eq('id', milestoneId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${projectId}`);
  return { success: true };
}

export async function getProjectMilestonesAction(projectId: string): Promise<ProjectMilestone[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('Error fetching milestones:', error);
    return [];
  }
  return data || [];
}
