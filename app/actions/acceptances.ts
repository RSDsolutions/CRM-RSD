'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

export async function createAcceptanceAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectId = formData.get('project_id') as string;
  const deliveryId = (formData.get('delivery_id') as string) || null;
  const status = formData.get('status') as string;

  const payload = {
    project_id:              projectId,
    delivery_id:             deliveryId,
    status:                  status,
    accepted_by_client_name: (formData.get('accepted_by_client_name') as string)?.trim() || null,
    observations:            (formData.get('observations') as string)?.trim() || null,
    created_by:              user?.id || null,
  };

  const { error } = await supabase.from('project_acceptances').insert([payload]);
  if (error) throw new Error(error.message);

  // Lógica transaccional: Si se acepta, actualizamos el estado del proyecto y de la entrega
  if (status === 'Aceptada' || status === 'Aceptada con observaciones') {
    await supabase.from('projects').update({ status: 'Completado' }).eq('id', projectId);
    
    if (deliveryId) {
      await supabase.from('project_deliveries').update({ status }).eq('id', deliveryId);
    }
  } else if (status === 'Rechazada' && deliveryId) {
    await supabase.from('project_deliveries').update({ status: 'Rechazada' }).eq('id', deliveryId);
  }

  revalidatePath(`/proyectos/${projectId}`);
}
