import { createClient } from '@/utils/supabase/server';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { Lead } from '@/types/database.types';

export const revalidate = 0; // Dynamic server rendering for real-time CRM updates

export default async function DashboardPage() {
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
    // Si aún no se configuraron las variables en .env.local, permitir que la app cargue
    console.warn('Advertencia al consultar Supabase:', e);
  }

  return (
    <div className="flex-1 w-full p-4 sm:p-6 flex flex-col">
      <KanbanBoard initialLeads={leads} />
    </div>
  );
}
