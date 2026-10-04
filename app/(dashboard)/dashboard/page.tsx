import { getComprehensiveDashboardMetricsAction } from '@/app/actions/dashboard';
import { ExecutiveDashboardView } from '@/components/dashboard/executive-dashboard-view';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Dashboard Directivo | RSD Solutions CRM',
  description: 'Panel ejecutivo con métricas reales operativas, comerciales y auditoría.',
};

export default async function DashboardPage() {
  const supabase = createClient();

  // Verificación de autenticación y rol
  const { data: role } = await supabase.rpc('get_user_role');
  if (role !== 'admin') {
    redirect('/');
  }

  const metrics = await getComprehensiveDashboardMetricsAction();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded uppercase">
            Dirección Ejecutiva
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
            Datos Reales 100%
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1">
          Dashboard Directivo & Operativo
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Supervisión integral de leads, diagnósticos, demos, consumo de tokens IA, desarrollo y retención.
        </p>
      </div>

      <ExecutiveDashboardView metrics={metrics} />
    </main>
  );
}
