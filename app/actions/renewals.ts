'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { addYears } from 'date-fns';

export async function createRenewalFollowupAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectId = formData.get('project_id') as string;
  const targetDateRaw = formData.get('renewal_date_target') as string;
  const amountRaw = formData.get('amount') as string;

  const payload = {
    client_id:               formData.get('client_id') as string,
    project_id:              projectId || null,
    maintenance_contract_id: (formData.get('maintenance_contract_id') as string) || null,
    status:                  'Contactar',
    renewal_date_target:     targetDateRaw || new Date().toISOString(),
    amount:                  amountRaw ? parseFloat(amountRaw) : null,
    notes:                   (formData.get('notes') as string)?.trim() || null,
    created_by:              user?.id || null,
  };

  const { error } = await supabase.from('renewals').insert([payload]);
  if (error) throw new Error(error.message);

  if (projectId) {
    revalidatePath(`/proyectos/${projectId}`);
  }
}

export async function updateRenewalStatusAction(renewalId: string, projectId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from('renewals').update({ status }).eq('id', renewalId);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function generateAutoRenewalsAction() {
  // Función reservada para automatizaciones futuras (Cron Job / Edge Function)
  // Detecta mantenimientos 'Activos' a punto de vencer (ej. en los próximos 30 días)
  // y auto-crea un registro en 'renewals' con estado 'Contactar'.
}
