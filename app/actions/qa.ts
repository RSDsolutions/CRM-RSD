'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { QATestCase, QATestStatus } from '@/types/database.types';

export async function createTestCaseAction(payload: {
  project_id: string;
  module_name: string;
  test_case_title: string;
  description?: string;
  expected_result: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('qa_test_cases')
    .insert([
      {
        project_id: payload.project_id,
        module_name: payload.module_name.trim(),
        test_case_title: payload.test_case_title.trim(),
        description: payload.description?.trim() || null,
        expected_result: payload.expected_result.trim(),
        status: 'Pendiente',
        responsible_id: user?.id || null,
      },
    ])
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${payload.project_id}`);
  return { success: true, testCase: data };
}

export async function updateTestCaseResultAction(payload: {
  test_id: string;
  project_id: string;
  status: QATestStatus;
  actual_result?: string;
  evidence_url?: string;
  observations?: string;
}) {
  const supabase = createClient();

  const updates: Record<string, unknown> = {
    status: payload.status,
    executed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (payload.actual_result !== undefined) updates.actual_result = payload.actual_result.trim();
  if (payload.evidence_url !== undefined) updates.evidence_url = payload.evidence_url.trim();
  if (payload.observations !== undefined) updates.observations = payload.observations.trim();

  const { data, error } = await supabase
    .from('qa_test_cases')
    .update(updates)
    .eq('id', payload.test_id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/proyectos/${payload.project_id}`);
  return { success: true, testCase: data };
}

export async function getProjectTestCasesAction(projectId: string): Promise<QATestCase[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('qa_test_cases')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching test cases:', error);
    return [];
  }
  return data || [];
}
