import { createClient } from '@/utils/supabase/server';
import { Lead } from '@/types/database.types';
import { LeadsView } from '@/components/leads/leads-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leads & Prospectos | RSD Solutions CRM',
  description: 'Directorio y seguimiento comercial de prospectos en curso de RSD Solutions',
};

export const revalidate = 0; // Dynamic server rendering for real-time CRM updates

export default async function LeadsPage() {
  let leads: Lead[] = [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      leads = data as Lead[];
    }
  } catch (e) {
    console.warn('Advertencia al consultar leads:', e);
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <LeadsView initialLeads={leads} />
    </main>
  );
}
