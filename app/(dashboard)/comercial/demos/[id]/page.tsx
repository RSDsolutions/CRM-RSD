import { createClient } from '@/utils/supabase/server';
import { Demo, DemoFeedback, DemoFile, AIUsageWindow } from '@/types/database.types';
import { DemoDetailView } from '@/components/demos/demo-detail-view';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getUserRole } from '@/utils/auth/roles';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('demos').select('name').eq('id', params.id).single();
  return { title: data ? `${data.name} | Demos | RSD Solutions` : 'Demo | RSD Solutions' };
}

export default async function DemoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = getUserRole(user);

  const [
    { data: demo, error: demoError },
    { data: feedback },
    { data: files },
    { data: aiWindows }
  ] = await Promise.all([
    supabase
      .from('demos')
      .select('*, leads(company_name, contact_name), clients(company_name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('demo_feedback')
      .select('*')
      .eq('demo_id', params.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('demo_files')
      .select('*')
      .eq('demo_id', params.id)
      .order('version', { ascending: false }),
    supabase
      .from('ai_usage_windows')
      .select('*')
      .eq('demo_id', params.id)
      .order('window_number', { ascending: false }),
  ]);

  if (demoError || !demo) notFound();

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <DemoDetailView
        demo={demo as any}
        feedback={(feedback || []) as DemoFeedback[]}
        initialFiles={(files || []) as DemoFile[]}
        initialAIWindows={(aiWindows || []) as AIUsageWindow[]}
        isAdmin={role === 'admin'}
        userEmail={user?.email || ''}
      />
    </main>
  );
}
