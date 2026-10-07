import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import { getUserRole } from '@/utils/auth/roles';
import { AgendaView } from '@/components/agenda/agenda-view';

export const metadata: Metadata = {
  title: 'Agenda y Citas | RSD Solutions CRM',
  description: 'Agenda compartida y disponibilidad de Robinson Solórzano para diagnósticos y reuniones.',
};

export default async function AgendaPage({
  searchParams,
}: {
  searchParams?: { lead_id?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const role = getUserRole(user);
  const email = user?.email || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AgendaView
        initialRole={role}
        userEmail={email}
        initialLeadId={searchParams?.lead_id}
      />
    </div>
  );
}
