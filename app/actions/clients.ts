'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ─── Crear Cliente ────────────────────────────────────────────
export async function createClientAction(formData: FormData) {
  const supabase = createClient();

  const payload = {
    company_name: (formData.get('company_name') as string).trim(),
    trade_name:   (formData.get('trade_name') as string)?.trim() || null,
    tax_id:       (formData.get('tax_id') as string)?.trim() || null,
    industry:     (formData.get('industry') as string)?.trim() || null,
    website:      (formData.get('website') as string)?.trim() || null,
    phone:        (formData.get('phone') as string)?.trim() || null,
    whatsapp:     (formData.get('whatsapp') as string)?.trim() || null,
    email:        (formData.get('email') as string)?.trim() || null,
    address:      (formData.get('address') as string)?.trim() || null,
    city:         (formData.get('city') as string)?.trim() || null,
    country:      (formData.get('country') as string)?.trim() || 'Ecuador',
    notes:        (formData.get('notes') as string)?.trim() || null,
    status:       'Activo',
  };

  const { error } = await supabase.from('clients').insert([payload]);

  if (error) {
    // En producción se manejaría con un state/error boundary
    throw new Error(error.message);
  }

  revalidatePath('/clientes');
  redirect('/clientes');
}

// ─── Actualizar Cliente ───────────────────────────────────────
export async function updateClientAction(id: string, formData: FormData) {
  const supabase = createClient();

  const payload = {
    company_name: (formData.get('company_name') as string).trim(),
    trade_name:   (formData.get('trade_name') as string)?.trim() || null,
    tax_id:       (formData.get('tax_id') as string)?.trim() || null,
    industry:     (formData.get('industry') as string)?.trim() || null,
    website:      (formData.get('website') as string)?.trim() || null,
    phone:        (formData.get('phone') as string)?.trim() || null,
    whatsapp:     (formData.get('whatsapp') as string)?.trim() || null,
    email:        (formData.get('email') as string)?.trim() || null,
    address:      (formData.get('address') as string)?.trim() || null,
    city:         (formData.get('city') as string)?.trim() || null,
    country:      (formData.get('country') as string)?.trim() || 'Ecuador',
    status:       (formData.get('status') as string) || 'Activo',
    notes:        (formData.get('notes') as string)?.trim() || null,
  };

  const { error } = await supabase.from('clients').update(payload).eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/clientes/${id}`);
  revalidatePath('/clientes');
}

// ─── Convertir Lead a Cliente ─────────────────────────────────
export async function convertLeadToClientAction(leadId: string) {
  const supabase = createClient();

  // 1. Obtener los datos del lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (leadError || !lead) {
    throw new Error('Lead no encontrado');
  }

  // 2. Crear el cliente con los datos del lead
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert([{
      company_name:  lead.company_name,
      email:         lead.email || null,
      phone:         lead.phone || null,
      lead_id:       lead.id,
      converted_at:  new Date().toISOString(),
      status:        'Activo',
      notes:         `Convertido desde lead. Bitácora original:\n${lead.interaction_log}`,
    }])
    .select()
    .single();

  if (clientError || !newClient) {
    throw new Error('Error al crear el cliente: ' + clientError?.message);
  }

  // 3. Actualizar el lead con el client_id y la fecha de conversión
  const { error: updateError } = await supabase
    .from('leads')
    .update({
      client_id:    newClient.id,
      converted_at: new Date().toISOString(),
      status:       'Cerrado-Ganado',  // Se actualizará a 'Convertido' en Fase 3 con el ENUM
    })
    .eq('id', leadId);

  if (updateError) {
    throw new Error('Error al actualizar el lead: ' + updateError.message);
  }

  revalidatePath('/clientes');
  revalidatePath('/');

  return newClient.id as string;
}
