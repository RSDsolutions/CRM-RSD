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
