'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ─── Generar número de propuesta ──────────────────────────────
async function generateProposalNumber(supabase: ReturnType<typeof createClient>): Promise<string> {
  const year = new Date().getFullYear();
  // Contar propuestas del año actual para generar correlativo
  const { count } = await supabase
    .from('proposals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`)
    .lte('created_at', `${year}-12-31`);

  const seq = (count ?? 0) + 1;
  return `RSD-PROP-${year}-${String(seq).padStart(3, '0')}`;
}

// ─── Crear Propuesta ──────────────────────────────────────────
export async function createProposalAction(formData: FormData) {
  const supabase = createClient();
  const proposalNumber = await generateProposalNumber(supabase);

  const priceRaw = formData.get('price') as string;
  const discountRaw = formData.get('discount') as string;
  const price    = priceRaw    ? parseFloat(priceRaw)    : null;
  const discount = discountRaw ? parseFloat(discountRaw) : 0;
  const total    = price !== null ? price - discount : null;

  const payload = {
    proposal_number: proposalNumber,
    lead_id:         (formData.get('lead_id') as string) || null,
    demo_id:         (formData.get('demo_id') as string) || null,
    client_id:       (formData.get('client_id') as string) || null,
    title:           (formData.get('title') as string).trim(),
    description:     (formData.get('description') as string)?.trim() || null,
    scope:           (formData.get('scope') as string)?.trim() || null,
    price,
    discount,
    total,
    currency:        'USD',
    valid_until:     (formData.get('valid_until') as string) || null,
    status:          'Borrador',
    notes:           (formData.get('notes') as string)?.trim() || null,
  };

  const { data, error } = await supabase.from('proposals').insert([payload]).select().single();
  if (error) throw new Error(error.message);

  revalidatePath('/comercial/propuestas');
  redirect(`/comercial/propuestas/${data.id}`);
}

// ─── Actualizar estado de Propuesta ───────────────────────────
export async function updateProposalStatusAction(id: string, status: string) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };

  if (status === 'Enviada' && !updates.sent_at) updates.sent_at = new Date().toISOString();
  if (status === 'Aceptada') updates.accepted_at = new Date().toISOString();

  const { error } = await supabase.from('proposals').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/propuestas/${id}`);
  revalidatePath('/comercial/propuestas');
}

// ─── Actualizar datos de Propuesta ────────────────────────────
export async function updateProposalAction(id: string, formData: FormData) {
  const supabase = createClient();

  const priceRaw    = formData.get('price') as string;
  const discountRaw = formData.get('discount') as string;
  const price       = priceRaw    ? parseFloat(priceRaw)    : null;
  const discount    = discountRaw ? parseFloat(discountRaw) : 0;
  const total       = price !== null ? price - discount : null;

  const payload = {
    title:            (formData.get('title') as string).trim(),
    description:      (formData.get('description') as string)?.trim() || null,
    scope:            (formData.get('scope') as string)?.trim() || null,
    price,
    discount,
    total,
    valid_until:      (formData.get('valid_until') as string) || null,
    rejection_reason: (formData.get('rejection_reason') as string)?.trim() || null,
    document_url:     (formData.get('document_url') as string)?.trim() || null,
    notes:            (formData.get('notes') as string)?.trim() || null,
  };

  const { error } = await supabase.from('proposals').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/propuestas/${id}`);
}

// ─── Propuesta Aceptada → Crear Cliente + Proyecto ────────────
export async function acceptProposalAndCreateProjectAction(
  proposalId: string,
  projectName: string
): Promise<{ clientId: string; projectId: string }> {
  const supabase = createClient();

  // 1. Obtener la propuesta completa
  const { data: proposal, error: propError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single();

  if (propError || !proposal) throw new Error('Propuesta no encontrada');

  let clientId = proposal.client_id as string | null;

  // 2. Si no tiene cliente, crearlo desde el lead vinculado
  if (!clientId && proposal.lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('*')
      .eq('id', proposal.lead_id)
      .single();

    if (lead) {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert([{
          company_name: lead.company_name,
          email:        lead.email || null,
          phone:        lead.phone || null,
          lead_id:      lead.id,
          converted_at: new Date().toISOString(),
          status:       'Activo',
        }])
        .select()
        .single();

      if (clientError || !newClient) throw new Error('Error al crear cliente: ' + clientError?.message);

      clientId = newClient.id as string;

      // Actualizar lead
      await supabase.from('leads').update({
        client_id:    clientId,
        converted_at: new Date().toISOString(),
        status:       'Convertido',
      }).eq('id', lead.id);

      // Actualizar propuesta con el nuevo client_id
      await supabase.from('proposals').update({ client_id: clientId }).eq('id', proposalId);
    }
  }

  if (!clientId) throw new Error('No se pudo determinar el cliente para este proyecto');

  // 3. Generar código de proyecto
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);
  const projectSeq = (count ?? 0) + 1;
  const projectCode = `RSD-${year}-${String(projectSeq).padStart(3, '0')}`;

  // 4. Crear el proyecto
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([{
      project_code: projectCode,
      name:         projectName,
      client_id:    clientId,
      proposal_id:  proposalId,
      demo_id:      proposal.demo_id || null,
      price:        proposal.total || proposal.price || null,
      currency:     'USD',
      status:       'Pendiente de inicio',
    }])
    .select()
    .single();

  if (projectError || !project) throw new Error('Error al crear proyecto: ' + projectError?.message);

  // 5. Marcar propuesta como Aceptada
  await supabase.from('proposals').update({
    status:      'Aceptada',
    accepted_at: new Date().toISOString(),
  }).eq('id', proposalId);

  revalidatePath('/proyectos');
  revalidatePath('/comercial/propuestas');
  revalidatePath('/clientes');

  return { clientId, projectId: project.id as string };
}
