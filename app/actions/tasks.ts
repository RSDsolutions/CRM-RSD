'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Task, TaskStatus } from '@/types/database.types';

export async function createTaskAction(payload: Partial<Task>) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!payload.title?.trim()) {
    return { success: false, error: 'El título de la tarea es obligatorio.' };
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert([
      {
        title: payload.title.trim(),
        description: payload.description?.trim() || null,
        category: payload.category || 'Comercial',
        priority: payload.priority || 'Media',
        status: payload.status || 'Pendiente',
        assigned_to: payload.assigned_to || userData?.user?.id || null,
        created_by: userData?.user?.id || null,
        due_date: payload.due_date || null,
        lead_id: payload.lead_id || null,
        client_id: payload.client_id || null,
        project_id: payload.project_id || null,
      },
    ])
    .select(`
      *,
      assigned_profile:assigned_to(full_name, email),
      leads:lead_id(company_name, contact_name)
    `)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/tareas');
  if (payload.client_id) revalidatePath(`/clientes/${payload.client_id}`);
  if (payload.project_id) revalidatePath(`/proyectos/${payload.project_id}`);

  return { success: true, task: data };
}

export async function updateTaskStatusAction(
  taskId: string,
  newStatus: TaskStatus,
  cancelReason?: string
) {
  const supabase = createClient();

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'Completada') {
    updateData.completed_at = new Date().toISOString();
  } else if (newStatus === 'Cancelada' && cancelReason) {
    updateData.cancel_reason = cancelReason;
  }

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', taskId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/tareas');
  return { success: true };
}

export async function getTasksAction(filters?: {
  status?: string;
  assignedTo?: string;
  leadId?: string;
}): Promise<Task[]> {
  const supabase = createClient();

  let query = supabase
    .from('tasks')
    .select(`
      *,
      assigned_profile:assigned_to(full_name, email),
      leads:lead_id(company_name, contact_name)
    `)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.assignedTo) {
    query = query.eq('assigned_to', filters.assignedTo);
  }
  if (filters?.leadId) {
    query = query.eq('lead_id', filters.leadId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }

  return (data as Task[]) || [];
}

export async function getLeadTasksAction(leadId: string): Promise<Task[]> {
  return getTasksAction({ leadId });
}
