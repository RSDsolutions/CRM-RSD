'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { LostOpportunity, Referral, RecoveryStatus, ReferralStatus } from '@/types/database.types';

// ─── Oportunidades Perdidas y Recuperación ────────────────────
export async function recordLostOpportunityAction(payload: {
  lead_id: string;
  loss_reason: string;
  stage_lost: string;
  competitor_chosen?: string;
  main_objection?: string;
  price_or_scope_reason?: string;
  next_reactivation_date?: string;
  do_not_contact?: boolean;
  notes?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('lost_opportunities')
    .insert([
      {
        lead_id: payload.lead_id,
        loss_reason: payload.loss_reason.trim(),
        stage_lost: payload.stage_lost,
        competitor_chosen: payload.competitor_chosen?.trim() || null,
        main_objection: payload.main_objection?.trim() || null,
        price_or_scope_reason: payload.price_or_scope_reason?.trim() || null,
        next_reactivation_date: payload.next_reactivation_date || null,
        do_not_contact: payload.do_not_contact || false,
        responsible_id: user?.id || null,
        notes: payload.notes?.trim() || null,
        recovery_status: payload.do_not_contact ? 'Definitivamente perdido' : 'En espera',
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Actualizar lead a etapa Perdido
  await supabase
    .from('leads')
    .update({ status: 'Perdido', updated_at: new Date().toISOString() })
    .eq('id', payload.lead_id);

  revalidatePath('/');
  revalidatePath('/dashboard');
  return { success: true, lostOpportunity: data };
}

export async function updateRecoveryAttemptAction(payload: {
  id: string;
  recovery_status: RecoveryStatus;
  notes?: string;
  next_reactivation_date?: string;
}) {
  const supabase = createClient();

  // Consultar conteo actual
  const { data: current } = await supabase
    .from('lost_opportunities')
    .select('recovery_attempts_count')
    .eq('id', payload.id)
    .single();

  const attempts = (current?.recovery_attempts_count || 0) + 1;

  const { data, error } = await supabase
    .from('lost_opportunities')
    .update({
      recovery_status: payload.recovery_status,
      recovery_attempts_count: attempts,
      last_recovery_date: new Date().toISOString(),
      next_reactivation_date: payload.next_reactivation_date || null,
      notes: payload.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/');
  return { success: true, lostOpportunity: data };
}

// ─── Referidos y Alianzas ─────────────────────────────────────
export async function createReferralAction(payload: {
  referrer_client_id?: string;
  referred_name: string;
  referred_company?: string;
  referred_phone?: string;
  referred_email?: string;
  incentive_authorized?: boolean;
  incentive_details?: string;
  followup_notes?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('referrals')
    .insert([
      {
        referrer_client_id: payload.referrer_client_id || null,
        referred_name: payload.referred_name.trim(),
        referred_company: payload.referred_company?.trim() || null,
        referred_phone: payload.referred_phone?.trim() || null,
        referred_email: payload.referred_email?.trim() || null,
        advisor_id: user?.id || null,
        incentive_authorized: payload.incentive_authorized || false,
        incentive_details: payload.incentive_details?.trim() || null,
        followup_notes: payload.followup_notes?.trim() || null,
        status: 'Registrado',
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  if (payload.referrer_client_id) {
    revalidatePath(`/clientes/${payload.referrer_client_id}`);
  }
  return { success: true, referral: data };
}

export async function updateReferralStatusAction(referralId: string, newStatus: ReferralStatus, notes?: string) {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (notes) updates.followup_notes = notes.trim();

  const { data, error } = await supabase
    .from('referrals')
    .update(updates)
    .eq('id', referralId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  return { success: true, referral: data };
}

export async function getClientReferralsAction(clientId: string): Promise<Referral[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching referrals:', error);
    return [];
  }
  return data || [];
}
