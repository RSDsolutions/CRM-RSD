'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { FeasibilityReview } from '@/types/database.types';

export async function saveFeasibilityReviewAction(payload: Partial<FeasibilityReview>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData = {
    lead_id: payload.lead_id || null,
    client_id: payload.client_id || null,
    problem_to_solve: payload.problem_to_solve?.trim() || null,
    preliminary_scope: payload.preliminary_scope?.trim() || null,
    estimated_complexity: payload.estimated_complexity || 'Media',
    required_modules: payload.required_modules?.trim() || null,
    integrations: payload.integrations?.trim() || null,
    external_dependencies: payload.external_dependencies?.trim() || null,
    technical_risks: payload.technical_risks?.trim() || null,
    operational_risks: payload.operational_risks?.trim() || null,
    estimated_timeline: payload.estimated_timeline?.trim() || null,
    preliminary_price_range: payload.preliminary_price_range?.trim() || null,
    technical_notes: payload.technical_notes?.trim() || null,
    commercial_notes: payload.commercial_notes?.trim() || null,
    recommendation: payload.recommendation || 'Viable',
    robinson_decision: payload.robinson_decision || null,
    conditions_justification: payload.conditions_justification?.trim() || null,
    reviewed_by: user?.id || null,
    reviewed_at: new Date().toISOString(),
  };

  let result;
  if (payload.id) {
    result = await supabase
      .from('feasibility_reviews')
      .update({ ...insertData, updated_at: new Date().toISOString() })
      .eq('id', payload.id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('feasibility_reviews')
      .insert([insertData])
      .select()
      .single();
  }

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  revalidatePath('/');
  return { success: true, review: result.data };
}

export async function getFeasibilityReviewAction(leadId: string): Promise<FeasibilityReview | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('feasibility_reviews')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching feasibility review:', error);
    return null;
  }
  return data;
}
