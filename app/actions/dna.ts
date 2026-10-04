'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { CompanyDNA } from '@/types/database.types';

export async function saveCompanyDNAAction(payload: Partial<CompanyDNA>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData = {
    lead_id: payload.lead_id || null,
    client_id: payload.client_id || null,
    version: payload.version || 1,
    business_name: payload.business_name?.trim() || 'Empresa',
    industry_niche: payload.industry_niche || null,
    business_overview: payload.business_overview?.trim() || null,
    target_audience: payload.target_audience?.trim() || null,
    business_model: payload.business_model?.trim() || null,
    operational_flow: payload.operational_flow?.trim() || null,
    current_tools: payload.current_tools?.trim() || null,
    identified_pain_points: payload.identified_pain_points?.trim() || null,
    desired_modules: payload.desired_modules?.trim() || null,
    required_integrations: payload.required_integrations?.trim() || null,
    visual_identity_notes: payload.visual_identity_notes?.trim() || null,
    design_preferences: payload.design_preferences?.trim() || null,
    reference_systems: payload.reference_systems?.trim() || null,
    constraints_budget: payload.constraints_budget?.trim() || null,
    consolidated_context: payload.consolidated_context?.trim() || null,
    status: payload.status || 'Preliminar',
    updated_by: user?.id || null,
  };

  let result;
  if (payload.id) {
    result = await supabase
      .from('company_dna')
      .update({ ...insertData, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('company_dna')
      .insert([insertData])
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  revalidatePath('/');
  if (payload.client_id) revalidatePath(`/clientes/${payload.client_id}`);
  return { success: true, dna: result.data };
}

export async function getCompanyDNAAction(leadId?: string, clientId?: string): Promise<CompanyDNA | null> {
  const supabase = createClient();

  let query = supabase.from('company_dna').select('*');
  if (leadId) query = query.eq('lead_id', leadId);
  else if (clientId) query = query.eq('client_id', clientId);
  else return null;

  const { data, error } = await query.order('version', { ascending: false }).limit(1).maybeSingle();
  if (error) {
    console.error('Error fetching DNA:', error);
    return null;
  }
  return data;
}
