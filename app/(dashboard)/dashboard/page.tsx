import { getDashboardMetricsAction } from '@/app/actions/dashboard';
import { MetricCard } from '@/components/dashboard/metric-card';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { FolderKanban, ShieldCheck, DollarSign, RefreshCw, AlertCircle, Box } from 'lucide-react';
import type { Metadata } from 'next';

export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Operaciones | RSD Solutions',
};

export default async function DashboardPage() {
  const supabase = createClient();
  
  // Verificación estricta de admin
  const { data: role } = await supabase.rpc('get_user_role');
  if (role !== 'admin') {
    redirect('/');
  }

  const metrics = await getDashboardMetricsAction();

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Dashboard Operativo</h1>
        <p className="text-sm text-slate-400 mt-1">Visión global de proyectos, finanzas y mantenimiento.</p>
      </div>

      <div className="space-y-6">
        
        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" /> Estado de Proyectos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Proyectos Activos" 
              value={metrics.projects.activeCount} 
              icon={FolderKanban} 
              color="indigo" 
              href="/proyectos"
            />
            <MetricCard 
              title="Completados" 
              value={metrics.projects.completedCount} 
              icon={Box} 
              color="emerald" 
              href="/proyectos"
            />
            <MetricCard 
              title="Entregas en Revisión" 
              value={metrics.projects.deliveriesPendingReview} 
              icon={AlertCircle} 
              color="amber" 
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2 mt-8">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Finanzas y Flujo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Pagos por Confirmar" 
              value={metrics.finances.pendingPaymentsCount} 
              subtitle={`Total: $${metrics.finances.pendingPaymentsTotal.toLocaleString()}`}
              icon={AlertCircle} 
              color="amber" 
            />
            <MetricCard 
              title="Facturado (Confirmado)" 
              value={`$${metrics.finances.confirmedPaymentsTotal.toLocaleString()}`} 
              icon={DollarSign} 
              color="emerald" 
            />
            <MetricCard 
              title="Renovaciones Pendientes" 
              value={metrics.renewals.pendingCount} 
              icon={RefreshCw} 
              color="cyan" 
            />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2 mt-8">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> Mantenimiento y Soporte
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricCard 
              title="Contratos Activos" 
              value={metrics.maintenance.activeCount} 
              icon={ShieldCheck} 
              color="cyan" 
            />
            <MetricCard 
              title="Próximos a Vencer (< 15 días)" 
              value={metrics.maintenance.expiringSoonCount} 
              icon={AlertCircle} 
              color={metrics.maintenance.expiringSoonCount > 0 ? 'rose' : 'cyan'} 
            />
          </div>
        </section>

      </div>
    </main>
  );
}
