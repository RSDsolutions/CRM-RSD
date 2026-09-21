'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function createDeliveryAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectId = formData.get('project_id') as string;

  // Determinar número de entrega autoincremental por proyecto
  const { count } = await supabase
    .from('project_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);
    
  const deliveryNumber = (count ?? 0) + 1;

  const payload = {
    project_id:      projectId,
    delivery_number: deliveryNumber,
    title:           (formData.get('title') as string).trim(),
    description:     (formData.get('description') as string)?.trim() || null,
    version:         (formData.get('version') as string)?.trim() || null,
    status:          'En revisión',
    delivery_url:    (formData.get('delivery_url') as string)?.trim() || null,
    repository_url:  (formData.get('repository_url') as string)?.trim() || null,
    notes:           (formData.get('notes') as string)?.trim() || null,
    created_by:      user?.id || null,
  };

  const { error } = await supabase.from('project_deliveries').insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function updateDeliveryStatusAction(deliveryId: string, projectId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from('project_deliveries').update({ status }).eq('id', deliveryId);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}
