import { createClient } from '@/utils/supabase/server';
import { Client, ClientContact } from '@/types/database.types';
import { ClientProfileView } from '@/components/clients/client-profile-view';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from('clients')
    .select('company_name')
    .eq('id', params.id)
    .single();
  return {
    title: data ? `${data.company_name} | Clientes | RSD Solutions CRM` : 'Cliente | RSD Solutions CRM',
  };
}

export default async function ClienteDetailPage({ params }: Props) {
  const supabase = createClient();

  const [
    { data: client, error },
    { data: contacts },
    { data: tickets },
    { data: referrals },
    { data: projects },
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', params.id).single(),
    supabase.from('client_contacts').select('*').eq('client_id', params.id).order('is_primary', { ascending: false }),
    supabase.from('support_tickets').select('*').eq('client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('referrals').select('*').eq('referrer_client_id', params.id).order('created_at', { ascending: false }),
    supabase.from('projects').select('id, name, project_code, status').eq('client_id', params.id),
  ]);

  if (error || !client) {
    notFound();
  }

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <ClientProfileView
        client={client as Client}
        contacts={(contacts ?? []) as ClientContact[]}
        tickets={(tickets ?? []) as any}
        referrals={(referrals ?? []) as any}
        projects={(projects ?? []) as any}
      />
    </main>
  );
}
