'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { DemoApprovalStatus, DemoFile, AIUsageWindow } from '@/types/database.types';

// ─── Crear / Solicitar Demo ───────────────────────────────────
export async function createDemoAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    lead_id:                  (formData.get('lead_id') as string) || null,
    client_id:                (formData.get('client_id') as string) || null,
    name:                     (formData.get('name') as string).trim(),
    software_type:            (formData.get('software_type') as string) || 'Web App',
    description:              (formData.get('description') as string)?.trim() || null,
    objective:                (formData.get('objective') as string)?.trim() || null,
    demo_url:                 (formData.get('demo_url') as string)?.trim() || null,
    functional_description:   (formData.get('functional_description') as string)?.trim() || null,
    modules_included:         (formData.get('modules_included') as string)?.trim() || null,
    main_flows:               (formData.get('main_flows') as string)?.trim() || null,
    target_roles:             (formData.get('target_roles') as string)?.trim() || null,
    visual_identity_received: (formData.get('visual_identity_received') as string)?.trim() || null,
    design_references:        (formData.get('design_references') as string)?.trim() || null,
    test_data_used:           (formData.get('test_data_used') as string)?.trim() || null,
    known_limitations:        (formData.get('known_limitations') as string)?.trim() || null,
    acceptance_criteria:      (formData.get('acceptance_criteria') as string)?.trim() || null,
    status:                   'Pendiente',
    approval_status:          'Solicitud enviada' as DemoApprovalStatus,
    demo_version:             1,
    assigned_to:              user?.id || null,
  };

  const { data, error } = await supabase.from('demos').insert([payload]).select().single();
  if (error) throw new Error(error.message);

  // Notificar o registrar actividad si hay lead asociado
  if (payload.lead_id) {
    await supabase.from('activities').insert([
      {
        lead_id: payload.lead_id,
        activity_type: 'Nota interna',
        user_id: user?.id || null,
        summary: `Solicitud de demo generada para revisión de Robinson: ${payload.name}`,
        result: 'Pendiente de aprobación interna',
        visibility: 'Interno',
        status: 'Realizada',
      },
    ]);
  }

  revalidatePath('/comercial/demos');
  redirect(`/comercial/demos/${data.id}`);
}

// ─── Actualizar estado de Demo ────────────────────────────────
export async function updateDemoStatusAction(id: string, status: string) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };
  if (status === 'Presentada') updates.presented_at = new Date().toISOString();

  const { error } = await supabase.from('demos').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/demos/${id}`);
  revalidatePath('/comercial/demos');
}

// ─── Agregar Feedback a Demo ──────────────────────────────────
export async function addDemoFeedbackAction(demoId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    demo_id:          demoId,
    feedback_type:    formData.get('feedback_type') as string,
    comment:          (formData.get('comment') as string).trim(),
    requested_change: (formData.get('requested_change') as string)?.trim() || null,
    outcome:          (formData.get('outcome') as string) || null,
    created_by:       user?.id || null,
  };

  const { error } = await supabase.from('demo_feedback').insert([payload]);
  if (error) throw new Error(error.message);

  revalidatePath(`/comercial/demos/${demoId}`);
}

// ─── Enviar a Revisión de Robinson ────────────────────────────
export async function submitDemoForApprovalAction(demoId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('demos')
    .update({
      approval_status: 'En revisión',
      updated_at: new Date().toISOString(),
    })
    .eq('id', demoId);

  if (error) throw new Error(error.message);
  revalidatePath(`/comercial/demos/${demoId}`);
}

// ─── Decisión de Aprobación de Robinson (Admin) ───────────────
export async function reviewDemoAction(
  demoId: string,
  decision: 'Aprobada internamente' | 'Observada / requiere ajustes' | 'Rechazada por el cliente',
  notes: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const updates: Record<string, unknown> = {
    approval_status: decision,
    approval_notes: notes.trim(),
    approved_by: user?.id || null,
    approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (decision === 'Aprobada internamente') {
    updates.status = 'Programada';
  }

  const { data: demo, error } = await supabase
    .from('demos')
    .update(updates)
    .eq('id', demoId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Registrar en bitácora de actividades
  if (demo?.lead_id) {
    await supabase.from('activities').insert([
      {
        lead_id: demo.lead_id,
        activity_type: 'Nota interna',
        user_id: user?.id || null,
        summary: `Revisión de demo por Robinson: ${decision}. Notas: ${notes}`,
        result: decision,
        visibility: 'Interno',
        status: 'Realizada',
      },
    ]);
  }

  revalidatePath(`/comercial/demos/${demoId}`);
  revalidatePath('/comercial/demos');
  return { success: true };
}

// ─── Subir Archivo Markdown (.md) Requerido ───────────────────
export async function uploadDemoMarkdownAction(
  demoId: string,
  fileName: string,
  content: string
) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const sizeBytes = new TextEncoder().encode(content).length;

  const { data, error } = await supabase
    .from('demo_files')
    .insert([
      {
        demo_id: demoId,
        file_name: fileName.trim(),
        file_type: 'markdown',
        file_content: content,
        file_size_bytes: sizeBytes,
        status: 'Recibido',
        uploaded_by: user?.id || null,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/comercial/demos/${demoId}`);
  return { success: true, file: data };
}

// ─── Eliminar Archivo .md ─────────────────────────────────────
export async function deleteDemoFileAction(fileId: string, demoId: string) {
  const supabase = createClient();
  const { error } = await supabase.from('demo_files').delete().eq('id', fileId);
  if (error) return { success: false, error: error.message };

  revalidatePath(`/comercial/demos/${demoId}`);
  return { success: true };
}

// ─── Registro Manual de Consumo de Tokens IA (Ventana de 5 Horas) ─
export async function registerAIUsageWindowAction(payload: {
  demo_id: string;
  provider: string;
  model?: string;
  window_number: number;
  percentage_consumed: number;
  work_summary: string;
  notes?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (payload.percentage_consumed < 0 || payload.percentage_consumed > 100) {
    return { success: false, error: 'El porcentaje consumido debe estar entre 0% y 100% de la ventana.' };
  }

  const { data, error } = await supabase
    .from('ai_usage_windows')
    .insert([
      {
        demo_id: payload.demo_id,
        advisor_id: user?.id || null,
        provider: payload.provider || 'Claude',
        model: payload.model || null,
        window_number: payload.window_number || 1,
        window_duration_hours: 5.0,
        window_start_time: new Date().toISOString(),
        percentage_consumed: Math.round(payload.percentage_consumed),
        work_summary: payload.work_summary.trim(),
        notes: payload.notes || null,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/comercial/demos/${payload.demo_id}`);
  return { success: true, window: data };
}

// ─── Registrar Presentación y Decisión del Cliente ─────────────
export async function recordDemoPresentationResultAction(
  demoId: string,
  payload: {
    presented_at: string;
    decision: 'Aceptada' | 'Aceptada con ajustes' | 'Pendiente' | 'Rechazada';
    notes: string;
    next_step?: string;
  }
) {
  const supabase = createClient();

  const { data: demo, error } = await supabase
    .from('demos')
    .update({
      presented_at: payload.presented_at,
      status: payload.decision === 'Aceptada' || payload.decision === 'Aceptada con ajustes' ? 'Interesado' : 'Presentada',
      client_feedback_decision: payload.decision,
      client_feedback_notes: payload.notes.trim(),
      client_feedback_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', demoId)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  if (demo?.lead_id) {
    await supabase.from('activities').insert([
      {
        lead_id: demo.lead_id,
        activity_type: 'Presentación demo',
        summary: `Presentación de demo: Decisión del cliente: ${payload.decision}`,
        result: payload.notes,
        next_step: payload.next_step || 'Preparar propuesta o ajustes',
        visibility: 'Interno',
        status: 'Realizada',
      },
    ]);
  }

  revalidatePath(`/comercial/demos/${demoId}`);
  revalidatePath('/comercial/demos');
  return { success: true };
}

// ─── Convertir Demo en Propuesta ──────────────────────────────
export async function convertDemoToProposalAction(demoId: string): Promise<string> {
  const supabase = createClient();

  const { data: demo, error: demoError } = await supabase
    .from('demos')
    .select('*')
    .eq('id', demoId)
    .single();

  if (demoError || !demo) throw new Error('Demo no encontrada');

  const { data: seq } = await supabase.rpc('nextval', { sequence_name: 'proposal_number_seq' }).single();
  const year = new Date().getFullYear();
  const proposalNumber = `RSD-PROP-${year}-${String((seq as any) || 1).padStart(3, '0')}`;

  const { data: proposal, error: propError } = await supabase
    .from('proposals')
    .insert([
      {
        proposal_number: proposalNumber,
        demo_id:         demo.id,
        lead_id:         demo.lead_id,
        client_id:       demo.client_id,
        title:           `Propuesta: ${demo.name}`,
        scope_summary:   demo.description || demo.objective,
        deliverables:    demo.modules_included ? [demo.modules_included] : ['Software funcional a medida'],
        status:          'Borrador',
        amount:          0,
      },
    ])
    .select()
    .single();

  if (propError) throw new Error(propError.message);

  revalidatePath('/comercial/propuestas');
  return proposal.id;
}
