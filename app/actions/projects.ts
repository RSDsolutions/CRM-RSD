'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// ─── Crear Proyecto ───────────────────────────────────────────
export async function createProjectAction(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Generar código de proyecto
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', `${year}-01-01`);
  const projectSeq = (count ?? 0) + 1;
  const projectCode = `RSD-${year}-${String(projectSeq).padStart(3, '0')}`;

  const priceRaw = formData.get('price') as string;

  const payload = {
    project_code:           projectCode,
    name:                   (formData.get('name') as string).trim(),
    description:            (formData.get('description') as string)?.trim() || null,
    scope:                  (formData.get('scope') as string)?.trim() || null,
    client_id:              formData.get('client_id') as string,
    proposal_id:            (formData.get('proposal_id') as string) || null,
    demo_id:                (formData.get('demo_id') as string) || null,
    software_type:          (formData.get('software_type') as string) || null,
    price:                  priceRaw ? parseFloat(priceRaw) : null,
    currency:               'USD',
    status:                 'Pendiente de inicio',
    start_date:             (formData.get('start_date') as string) || null,
    estimated_delivery_date: (formData.get('estimated_delivery_date') as string) || null,
    production_url:         (formData.get('production_url') as string)?.trim() || null,
    repository_url:         (formData.get('repository_url') as string)?.trim() || null,
    assigned_to:            user?.id || null,
    notes:                  (formData.get('notes') as string)?.trim() || null,
  };

  const { data, error } = await supabase.from('projects').insert([payload]).select().single();
  if (error) throw new Error(error.message);

  revalidatePath('/proyectos');
  redirect(`/proyectos/${data.id}`);
}

// ─── Actualizar estado de Proyecto ────────────────────────────
export async function updateProjectStatusAction(id: string, status: string) {
  const supabase = createClient();
  const updates: Record<string, unknown> = { status };

  if (status === 'Entregado') updates.actual_delivery_date = new Date().toISOString();

  const { error } = await supabase.from('projects').update(updates).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${id}`);
  revalidatePath('/proyectos');
}

// ─── Actualizar datos de Proyecto ─────────────────────────────
export async function updateProjectAction(id: string, formData: FormData) {
  const supabase = createClient();
  const priceRaw = formData.get('price') as string;

  const payload = {
    name:                    (formData.get('name') as string).trim(),
    description:             (formData.get('description') as string)?.trim() || null,
    scope:                   (formData.get('scope') as string)?.trim() || null,
    price:                   priceRaw ? parseFloat(priceRaw) : null,
    start_date:              (formData.get('start_date') as string) || null,
    estimated_delivery_date: (formData.get('estimated_delivery_date') as string) || null,
    production_url:          (formData.get('production_url') as string)?.trim() || null,
    repository_url:          (formData.get('repository_url') as string)?.trim() || null,
    notes:                   (formData.get('notes') as string)?.trim() || null,
  };

  const { error } = await supabase.from('projects').update(payload).eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath(`/proyectos/${id}`);
}
