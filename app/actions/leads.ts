'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Lead } from '@/types/database.types';

export interface DuplicateCheckResult {
  hasDuplicate: boolean;
  duplicateField?: 'phone' | 'email';
  existingLead?: {
    id: string;
    company_name: string;
    contact_name: string;
    created_at: string;
  };
}

/**
 * Obtiene la lista única de asesores comerciales y administradores (sin duplicados).
 */
export async function getComercialAdvisorsAction() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name')
    .in('role', ['admin', 'comercial'])
    .order('full_name', { ascending: true });

  if (error) {
    return { success: false, error: error.message };
  }

  // Deduplicar nombres ignorando espacios y valores nulos
  const uniqueAdvisors = Array.from(
    new Set(data.map(d => d.full_name?.trim()).filter(Boolean))
  ) as string[];

  return { success: true, advisors: uniqueAdvisors };
}

/**
 * Obtiene el nombre del asesor comercial o usuario actualmente autenticado.
 */
export async function getCurrentUserAdvisorAction() {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, name: 'Robinson Solórzano', email: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  const name = profile?.full_name?.trim() || user.email?.split('@')[0] || 'Robinson Solórzano';
  return { success: true, name, email: user.email, userId: user.id };
}

/**
 * Verifica duplicados por teléfono o correo electrónico antes de crear un prospecto.
 */
export async function checkLeadDuplicatesAction(
  phone?: string | null,
  email?: string | null
): Promise<DuplicateCheckResult> {
  const supabase = createClient();

  if (phone && phone.trim().length >= 7) {
    const cleanPhone = phone.trim();
    const { data: phoneMatch } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, created_at')
      .eq('phone', cleanPhone)
      .limit(1)
      .maybeSingle();

    if (phoneMatch) {
      return {
        hasDuplicate: true,
        duplicateField: 'phone',
        existingLead: phoneMatch,
      };
    }
  }

  if (email && email.trim().length >= 5) {
    const cleanEmail = email.trim().toLowerCase();
    const { data: emailMatch } = await supabase
      .from('leads')
      .select('id, company_name, contact_name, created_at')
      .ilike('email', cleanEmail)
      .limit(1)
      .maybeSingle();

    if (emailMatch) {
      return {
        hasDuplicate: true,
        duplicateField: 'email',
        existingLead: emailMatch,
      };
    }
  }

  return { hasDuplicate: false };
}

/**
 * Crea un lead enriquecido con todos los campos de prospección comercial.
 */
export async function createEnrichedLeadAction(payload: Partial<Lead>) {
  const supabase = createClient();

  const { data: userData } = await supabase.auth.getUser();

  const insertData = {
    company_name: payload.company_name?.trim() || '',
    contact_name: payload.contact_name?.trim() || '',
    software_type: payload.software_type || 'Web App',
    interaction_log: payload.interaction_log?.trim() || 'Ingreso inicial del prospecto.',
    appointment_scheduled: Boolean(payload.appointment_scheduled),
    appointment_date: payload.appointment_date || null,
    status: payload.status || 'Nuevo',
    assigned_to: payload.assigned_to || (userData?.user?.email ? userData.user.email.split('@')[0] : 'Asesor'),
    assigned_to_user_id: userData?.user?.id || null,
    phone: payload.phone?.trim() || null,
    email: payload.email?.trim() || null,
    lead_source: payload.lead_source || 'Directo',
    priority: payload.priority || 'Media',
    legal_name: payload.legal_name?.trim() || null,
    tax_id: payload.tax_id?.trim() || null,
    city: payload.city?.trim() || null,
    province: payload.province?.trim() || null,
    website: payload.website?.trim() || null,
    social_media: payload.social_media?.trim() || null,
    contact_role: payload.contact_role?.trim() || null,
    niche: payload.niche || 'Otro',
    campaign: payload.campaign?.trim() || null,
    main_need: payload.main_need?.trim() || null,
    problem_description: payload.problem_description?.trim() || null,
    current_management_method: payload.current_management_method || 'Excel',
    team_size: payload.team_size || null,
    reference_budget: payload.reference_budget || null,
    next_action: payload.next_action?.trim() || 'Primer contacto y validación de necesidades',
    next_followup_date: payload.next_followup_date || null,
    contact_preference: payload.contact_preference || 'WhatsApp',
  };

  const { data, error } = await supabase.from('leads').insert([insertData]).select().single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Registrar actividad inicial automática
  if (data?.id) {
    await supabase.from('activities').insert([
      {
        lead_id: data.id,
        activity_type: 'Nota interna',
        user_id: userData?.user?.id || null,
        summary: `Prospecto registrado en el CRM con origen: ${insertData.lead_source}`,
        result: 'Pendiente de primera atención',
        next_step: insertData.next_action,
        next_followup_date: insertData.next_followup_date,
        visibility: 'Interno',
        status: 'Realizada',
      },
    ]);
  }

  revalidatePath('/');
  return { success: true, lead: data };
}

/**
 * Actualiza la información inicial y de calificación de un lead o prospecto
 * a medida que avanza la venta y se descubren nuevos datos.
 */
export async function updateLeadDetailsAction(leadId: string, payload: Partial<Lead>) {
  if (!leadId) {
    return { success: false, error: 'ID de lead no válido' };
  }

  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payload.company_name !== undefined) updateData.company_name = payload.company_name?.trim() || '';
  if (payload.contact_name !== undefined) updateData.contact_name = payload.contact_name?.trim() || '';
  if (payload.contact_role !== undefined) updateData.contact_role = payload.contact_role?.trim() || null;
  if (payload.phone !== undefined) updateData.phone = payload.phone?.trim() || null;
  if (payload.email !== undefined) updateData.email = payload.email?.trim() || null;
  if (payload.contact_preference !== undefined) updateData.contact_preference = payload.contact_preference || 'WhatsApp';
  
  if (payload.software_type !== undefined) updateData.software_type = payload.software_type;
  if (payload.niche !== undefined) updateData.niche = payload.niche;
  if (payload.current_management_method !== undefined) updateData.current_management_method = payload.current_management_method;
  if (payload.team_size !== undefined) updateData.team_size = payload.team_size?.trim() || null;
  if (payload.reference_budget !== undefined) updateData.reference_budget = payload.reference_budget?.trim() || null;
  if (payload.main_need !== undefined) updateData.main_need = payload.main_need?.trim() || null;
  if (payload.problem_description !== undefined) updateData.problem_description = payload.problem_description?.trim() || null;

  if (payload.legal_name !== undefined) updateData.legal_name = payload.legal_name?.trim() || null;
  if (payload.tax_id !== undefined) updateData.tax_id = payload.tax_id?.trim() || null;
  if (payload.city !== undefined) updateData.city = payload.city?.trim() || null;
  if (payload.province !== undefined) updateData.province = payload.province?.trim() || null;
  if (payload.website !== undefined) updateData.website = payload.website?.trim() || null;
  if (payload.social_media !== undefined) updateData.social_media = payload.social_media?.trim() || null;

  if (payload.lead_source !== undefined) updateData.lead_source = payload.lead_source;
  if (payload.campaign !== undefined) updateData.campaign = payload.campaign?.trim() || null;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.assigned_to !== undefined) updateData.assigned_to = payload.assigned_to?.trim() || '';
  if (payload.status !== undefined) updateData.status = payload.status;
  if (payload.next_action !== undefined) updateData.next_action = payload.next_action?.trim() || null;
  if (payload.next_followup_date !== undefined) updateData.next_followup_date = payload.next_followup_date || null;
  if (payload.interaction_log !== undefined) updateData.interaction_log = payload.interaction_log;

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // Registrar actividad automática de actualización informativa
  try {
    await supabase.from('activities').insert([
      {
        lead_id: leadId,
        activity_type: 'Nota interna',
        user_id: userData?.user?.id || null,
        summary: 'Ficha comercial y datos del prospecto actualizados con nuevos avances de la venta.',
        visibility: 'Interno',
        status: 'Realizada',
      },
    ]);
  } catch (actErr) {
    console.warn('Advertencia al registrar actividad de actualización:', actErr);
  }

  revalidatePath('/');
  revalidatePath('/leads');
  revalidatePath('/dashboard');

  return { success: true, lead: data as Lead };
}

