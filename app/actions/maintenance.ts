'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function createMaintenanceEventAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectId = formData.get('project_id') as string;

  const payload = {
    maintenance_contract_id: formData.get('maintenance_contract_id') as string,
    type:                    formData.get('type') as string,
    title:                   (formData.get('title') as string).trim(),
    description:             (formData.get('description') as string)?.trim() || null,
    priority:                formData.get('priority') as string,
    status:                  'Abierto',
    created_by:              user?.id || null,
  };

  const { error } = await supabase.from('maintenance_events').insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateMaintenanceEventStatusAction(eventId: string, projectId: string, status: string) {
  const supabase = createClient();
  
  const updates: Record<string, unknown> = { status };
  if (status === 'Resuelto' || status === 'Cerrado') {
    updates.resolved_at = new Date().toISOString();
  }

  const { error } = await supabase.from('maintenance_events').update(updates).eq('id', eventId);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateMaintenanceContractStatusAction(contractId: string, projectId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from('maintenance_contracts').update({ status }).eq('id', contractId);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}
