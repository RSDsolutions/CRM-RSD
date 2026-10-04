'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { ScopeChangeRequest } from '@/types/database.types';

export async function createScopeChangeRequestAction(payload: {
  project_id: string;
  description: string;
  reason: string;
  expected_benefit?: string;
  affected_modules?: string;
  technical_impact?: string;
  schedule_impact_days?: number;
  commercial_impact_amount?: number;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generar código de cambio
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('scope_change_requests')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', payload.project_id);

  const changeCode = `CR-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('scope_change_requests')
    .insert([
      {
        project_id: payload.project_id,
        change_code: changeCode,
        requested_by: user?.id || null,
        description: payload.description.trim(),
        reason: payload.reason.trim(),
        expected_benefit: payload.expected_benefit?.trim() || null,
        affected_modules: payload.affected_modules?.trim() || null,
        technical_impact: payload.technical_impact?.trim() || null,
        schedule_impact_days: payload.schedule_impact_days || 0,
        commercial_impact_amount: payload.commercial_impact_amount || 0,
        status: 'Solicitado',
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${payload.project_id}`);
  return { success: true, scopeChange: data };
}

export async function reviewScopeChangeAction(
  changeId: string,
  projectId: string,
  decision: 'Aprobado por Robinson' | 'Rechazado',
  notes: string
) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('scope_change_requests')
    .update({
      status: decision,
      robinson_decision: decision,
      robinson_notes: notes.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', changeId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${projectId}`);
  return { success: true, scopeChange: data };
}

export async function clientAcceptScopeChangeAction(changeId: string, projectId: string) {
  const supabase = createClient();

  // 1. Marcar cambio como Aprobado por cliente
  const { data: change, error } = await supabase
    .from('scope_change_requests')
    .update({
      status: 'Aprobado por cliente',
      client_acceptance_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', changeId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // 2. Incrementar versión del alcance del proyecto
  const { data: project } = await supabase
    .from('projects')
    .select('scope_version, price')
    .eq('id', projectId)
    .single();

  const newVersion = (project?.scope_version || 1) + 1;
  const newPrice = (project?.price || 0) + (change.commercial_impact_amount || 0);

  await supabase
    .from('projects')
    .update({
      scope_version: newVersion,
      price: newPrice,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  revalidatePath(`/proyectos/${projectId}`);
  return { success: true, scopeChange: change };
}

export async function getProjectScopeChangesAction(projectId: string): Promise<ScopeChangeRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('scope_change_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching scope changes:', error);
    return [];
  }
  return data || [];
}
