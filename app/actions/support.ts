'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/database.types';

export async function createSupportTicketAction(payload: {
  client_id: string;
  project_id?: string;
  requester_name: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  impact: string;
  description: string;
  evidence_url?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generar código TICK-YYYY-NNN
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('support_tickets')
    .select('*', { count: 'exact', head: true });

  const ticketCode = `TICK-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from('support_tickets')
    .insert([
      {
        ticket_code: ticketCode,
        client_id: payload.client_id,
        project_id: payload.project_id || null,
        requester_name: payload.requester_name.trim(),
        category: payload.category,
        priority: payload.priority,
        impact: payload.impact.trim(),
        description: payload.description.trim(),
        evidence_url: payload.evidence_url?.trim() || null,
        assigned_to: user?.id || null,
        status: 'Abierto',
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${payload.client_id}`);
  if (payload.project_id) revalidatePath(`/proyectos/${payload.project_id}`);
  return { success: true, ticket: data };
}

export async function updateSupportTicketStatusAction(payload: {
  ticket_id: string;
  client_id: string;
  status: SupportTicketStatus;
  diagnosis?: string;
  solution?: string;
  commercial_followup_notes?: string;
  client_confirmed?: boolean;
}) {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    status: payload.status,
    updated_at: new Date().toISOString(),
  };

  if (payload.status === 'Resuelto' || payload.status === 'Cerrado') {
    updates.resolved_at = new Date().toISOString();
  }
  if (payload.diagnosis !== undefined) updates.diagnosis = payload.diagnosis.trim();
  if (payload.solution !== undefined) updates.solution = payload.solution.trim();
  if (payload.commercial_followup_notes !== undefined) {
    updates.commercial_followup_notes = payload.commercial_followup_notes.trim();
  }
  if (payload.client_confirmed !== undefined) {
    updates.client_confirmed = payload.client_confirmed;
  }

  const { data, error } = await supabase
    .from('support_tickets')
    .update(updates)
    .eq('id', payload.ticket_id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/clientes/${payload.client_id}`);
  return { success: true, ticket: data };
}

export async function getClientSupportTicketsAction(clientId: string): Promise<SupportTicket[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching support tickets:', error);
    return [];
  }
  return data || [];
}
