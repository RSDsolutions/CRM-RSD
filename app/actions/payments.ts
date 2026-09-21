'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { addMonths } from 'date-fns';

export async function createPaymentAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projectId = formData.get('project_id') as string;

  const payload = {
    project_id:      projectId,
    client_id:       formData.get('client_id') as string,
    proposal_id:     (formData.get('proposal_id') as string) || null,
    amount:          parseFloat(formData.get('amount') as string),
    currency:        (formData.get('currency') as string) || 'USD',
    payment_type:    formData.get('payment_type') as string,
    status:          'Registrado',
    payment_date:    (formData.get('payment_date') as string) || new Date().toISOString(),
    payment_method:  (formData.get('payment_method') as string)?.trim() || null,
    reference:       (formData.get('reference') as string)?.trim() || null,
    notes:           (formData.get('notes') as string)?.trim() || null,
    created_by:      user?.id || null,
  };

  const { error } = await supabase.from('payments').insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}

export async function confirmPaymentAction(paymentId: string, projectId: string, clientId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Actualizar estado del pago a "Confirmado"
  const { error: updateError } = await supabase
    .from('payments')
    .update({ status: 'Confirmado' })
    .eq('id', paymentId);
    
  if (updateError) throw new Error(updateError.message);

  // 2. Verificar si el proyecto ya está "Completado" (entregado y aceptado)
  const { data: project } = await supabase
    .from('projects')
    .select('status')
    .eq('id', projectId)
    .single();

  if (project?.status === 'Completado') {
    // 3. Verificar si ya existe un contrato de mantenimiento activo para este proyecto
    const { data: existingMaintenance } = await supabase
      .from('maintenance_contracts')
      .select('id')
      .eq('project_id', projectId)
      .not('status', 'in', '("Cancelado")')
      .maybeSingle();

    if (!existingMaintenance) {
      // Auto-crear contrato de mantenimiento (3 meses por defecto)
      const startDate = new Date();
      const endDate = addMonths(startDate, 3);
      
      const maintenancePayload = {
        project_id: projectId,
        client_id: clientId,
        payment_id: paymentId,
        type: 'Incluido',
        status: 'Activo',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        duration_months: 3,
        created_by: user?.id || null,
      };

      await supabase.from('maintenance_contracts').insert([maintenancePayload]);
    }
  }

  revalidatePath(`/proyectos/${projectId}`);
}

export async function updatePaymentStatusAction(paymentId: string, projectId: string, status: string) {
  const supabase = createClient();
  const { error } = await supabase.from('payments').update({ status }).eq('id', paymentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${projectId}`);
}
