'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ─── Crear Demo ───────────────────────────────────────────────
export async function createDemoAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    lead_id:       (formData.get('lead_id') as string) || null,
    client_id:     (formData.get('client_id') as string) || null,
    name:          (formData.get('name') as string).trim(),
    software_type: formData.get('software_type') as string,
    description:   (formData.get('description') as string)?.trim() || null,
    objective:     (formData.get('objective') as string)?.trim() || null,
    demo_url:      (formData.get('demo_url') as string)?.trim() || null,
    status:        'Pendiente',
    assigned_to:   user?.id || null,
  };

  const { data, error } = await supabase.from('demos').insert([payload]).select().single();
  if (error) throw new Error(error.message);

  revalidatePath('/comercial/demos');
  redirect(`/comercial/demos/${data.id}`);
}

// ─── Actualizar estado de Demo ────────────────────────────────
export async function updateDemoStatusAction(id: string, status: string) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (status === 'Presentada') updates.presented_at = new Date().toISOString();

  const { error } = await supabase.from('demos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/demos/${id}`);
  revalidatePath('/comercial/demos');
}

// ─── Actualizar datos de Demo ─────────────────────────────────
export async function updateDemoAction(id: string, formData: FormData) {
  const supabase = createClient();

  const payload = {
    name:         (formData.get('name') as string).trim(),
    description:  (formData.get('description') as string)?.trim() || null,
    objective:    (formData.get('objective') as string)?.trim() || null,
    demo_url:     (formData.get('demo_url') as string)?.trim() || null,
    observations: (formData.get('observations') as string)?.trim() || null,
  };

  const { error } = await supabase.from('demos').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/demos/${id}`);
}

// ─── Agregar Feedback a Demo ──────────────────────────────────
export async function addDemoFeedbackAction(demoId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    demo_id:          demoId,
    feedback_type:    formData.get('feedback_type') as string,
    comment:          (formData.get('comment') as string).trim(),
    requested_change: (formData.get('requested_change') as string)?.trim() || null,
    outcome:          (formData.get('outcome') as string) || null,
    created_by:       user?.id || null,
  };

  const { error } = await supabase.from('demo_feedback').insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/demos/${demoId}`);
}

// ─── Convertir Demo en Propuesta ──────────────────────────────
export async function convertDemoToProposalAction(demoId: string): Promise<string> {
  const supabase = createClient();

  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .single();

  if (demoError || !demo) throw new Error('Demo no encontrada');

  // Generar número de propuesta
  const { data: seq } = await supabase.rpc('nextval', { sequence_name: 'proposal_number_seq' }).single();
  const year = new Date().getFullYear();
  const proposalNumber = `RSD-PROP-${year}-${String((seq as any) || 1).padStart(3, '0')}`;

  const { data: proposal, error: propError } = await supabase
    .from('proposals')
    .insert([{
      lead_id:         demo.lead_id,
      demo_id:         demoId,
      client_id:       demo.client_id,
      proposal_number: proposalNumber,
      title:           `Propuesta para ${demo.name}`,
      status:          'Borrador',
    }])
    .select()
    .single();

  if (propError || !proposal) throw new Error('Error al crear propuesta: ' + propError?.message);

  // Marcar demo como convertida
  await supabase.from('demos').update({ status: 'Convertida a proyecto' }).eq('id', demoId);

  revalidatePath('/comercial/propuestas');
  revalidatePath(`/comercial/demos/${demoId}`);

  return proposal.id as string;
}
