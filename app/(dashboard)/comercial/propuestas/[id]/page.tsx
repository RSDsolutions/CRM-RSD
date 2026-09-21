import { createClient } from '@/utils/supabase/server';
import { Proposal } from '@/types/database.types';
import { ProposalDetailView } from '@/components/proposals/proposal-detail-view';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('proposals').select('proposal_number').eq('id', params.id).single();
  return { title: data ? `Propuesta ${data.proposal_number} | RSD Solutions` : 'Propuesta | RSD Solutions' };
}

export default async function ProposalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: proposal, error } = await supabase
    .from('proposals')
    .select('*, leads(company_name), clients(company_name), demos(name)')
    .eq('id', params.id)
    .single();

  if (error || !proposal) notFound();

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <ProposalDetailView proposal={proposal as any} />
    </main>
  );
}
