import { createClient } from '@/utils/supabase/server';
import { Demo, DemoFeedback } from '@/types/database.types';
import { DemoDetailView } from '@/components/demos/demo-detail-view';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('demos').select('name').eq('id', params.id).single();
  return { title: data ? `${data.name} | Demos | RSD Solutions` : 'Demo | RSD Solutions' };
}

export default async function DemoDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [
    { data: demo, error: demoError },
    { data: feedback }
  ] = await Promise.all([
    supabase
      .from('demos')
      .select('*, leads(company_name), clients(company_name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('demo_feedback')
      .select('*')
      .eq('demo_id', params.id)
      .order('created_at', { ascending: false })
  ]);

  if (demoError || !demo) notFound();

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <DemoDetailView
        demo={demo as any}
        feedback={(feedback || []) as DemoFeedback[]}
      />
    </main>
  );
}
