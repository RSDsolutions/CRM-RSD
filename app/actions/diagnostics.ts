'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { Diagnostic } from '@/types/database.types';

export async function saveDiagnosticAction(payload: Partial<Diagnostic>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData = {
    lead_id: payload.lead_id || null,
    client_id: payload.client_id || null,
    meeting_id: payload.meeting_id || null,
    advisor_id: payload.advisor_id || null,
    conducted_by: user?.id || null,
    status: payload.status || 'Borrador',
    business_activity: payload.business_activity?.trim() || null,
    business_model: payload.business_model?.trim() || null,
    products_services: payload.products_services?.trim() || null,
    team_size: payload.team_size?.trim() || null,
    branches: payload.branches?.trim() || null,
    current_tools: payload.current_tools?.trim() || null,
    digitalization_level: payload.digitalization_level || null,
    main_problem: payload.main_problem?.trim() || null,
    secondary_problems: payload.secondary_problems?.trim() || null,
    current_workflow: payload.current_workflow?.trim() || null,
    bottlenecks: payload.bottlenecks?.trim() || null,
    risks_losses: payload.risks_losses?.trim() || null,
    urgency_priority: payload.urgency_priority || 'Media',
    expected_outcome: payload.expected_outcome?.trim() || null,
    proposed_solution: payload.proposed_solution?.trim() || null,
    potential_modules: payload.potential_modules?.trim() || null,
    user_roles: payload.user_roles?.trim() || null,
    required_integrations: payload.required_integrations?.trim() || null,
    data_migration: payload.data_migration?.trim() || null,
    restrictions: payload.restrictions?.trim() || null,
    pending_validation: payload.pending_validation?.trim() || null,
    preliminary_feasibility: payload.preliminary_feasibility || 'Alta',
    technical_risks: payload.technical_risks?.trim() || null,
    client_pending_info: payload.client_pending_info?.trim() || null,
    next_action: payload.next_action?.trim() || 'Preparación de propuesta o demo',
    requires_demo: payload.requires_demo ?? true,
    internal_notes: payload.internal_notes?.trim() || null,
  };

  let result;
  if (payload.id) {
    result = await supabase
      .from('diagnostics')
      .update({ ...insertData, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('diagnostics')
      .insert([insertData])
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  // Si se completa y está asociado a un lead, actualizar estado del lead
  if (payload.status === 'Completado' && payload.lead_id) {
    await supabase
      .from('leads')
      .update({
        status: 'Diagnóstico',
        next_action: insertData.next_action,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payload.lead_id);
  }

  revalidatePath('/');
  revalidatePath('/agenda');
  return { success: true, diagnostic: result.data };
}

export async function getLeadDiagnosticAction(leadId: string): Promise<Diagnostic | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('diagnostics')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching diagnostic:', error);
    return null;
  }
  return data;
}
