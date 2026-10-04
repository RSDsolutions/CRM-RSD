'use client';

import { ComprehensiveDashboardMetrics } from '@/app/actions/dashboard';
import { MetricCard } from './metric-card';
import {
  Users,
  Monitor,
  FolderKanban,
  FileText,
  Calendar,
  CheckSquare,
  LifeBuoy,
  Share2,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  History,
  TrendingUp,
  UserX,
} from 'lucide-react';

interface ExecutiveDashboardViewProps {
  metrics: ComprehensiveDashboardMetrics;
}

export function ExecutiveDashboardView({ metrics }: ExecutiveDashboardViewProps) {
  return (
    <div className="space-y-8 pb-16">
      {/* 1. SECCIÓN COMERCIAL & CONVERSIÓN */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Pipeline Comercial & Atención de Leads
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Leads"
            value={metrics.leads.total}
            subtitle={`${metrics.leads.newCount} nuevos`}
            icon={Users}
            color="indigo"
            href="/"
          />
          <MetricCard
            title="Leads Sin Atención"
            value={metrics.leads.unattendedCount}
            subtitle={metrics.leads.unattendedCount > 0 ? 'Requieren contacto' : 'Al día'}
            icon={AlertTriangle}
            color={metrics.leads.unattendedCount > 0 ? 'rose' : 'emerald'}
            href="/"
          />
          <MetricCard
            title="Diagnósticos Robinson"
            value={metrics.diagnostics.completedCount}
            subtitle={`${metrics.diagnostics.scheduledCount} agendados`}
            icon={Calendar}
            color="cyan"
            href="/agenda"
          />
          <MetricCard
            title="Tareas Pendientes"
            value={metrics.tasks.pendingCount}
            subtitle={`${metrics.tasks.overdueCount} atrasadas`}
            icon={CheckSquare}
            color={metrics.tasks.overdueCount > 0 ? 'amber' : 'emerald'}
            href="/tareas"
          />
        </div>
      </section>

      {/* 2. SECCIÓN DEMOS, APROBACIÓN DE ROBINSON Y TOKENS IA */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <Cpu className="w-4 h-4 text-violet-400" /> Demos, Aprobaciones & Declaración de Tokens IA
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Demos Solicitadas"
            value={metrics.demos.total}
            subtitle={`${metrics.demos.inPreparationCount} en preparación`}
            icon={Monitor}
            color="indigo"
            href="/comercial/demos"
          />
          <MetricCard
            title="Pendientes Aprobación"
            value={metrics.demos.pendingApprovalCount}
            subtitle="Revisión de Robinson"
            icon={AlertTriangle}
            color={metrics.demos.pendingApprovalCount > 0 ? 'amber' : 'indigo'}
            href="/comercial/demos"
          />
          <MetricCard
            title="Demos Aprobadas"
            value={metrics.demos.approvedCount}
            subtitle={`${metrics.demos.presentedCount} presentadas`}
            icon={ShieldCheck}
            color="emerald"
            href="/comercial/demos"
          />
          <MetricCard
            title="Consumo IA Declarado"
            value={`${metrics.demos.aiAvgPercentage}%`}
            subtitle={`${metrics.demos.aiWindowsCount} ventanas 5h manuales`}
            icon={Cpu}
            color="cyan"
            href="/comercial/demos"
          />
        </div>
      </section>

      {/* 3. SECCIÓN PROPUESTAS Y PROYECTOS */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <FolderKanban className="w-4 h-4 text-emerald-400" /> Propuestas, Desarrollo & Alcance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Propuestas Comerciales"
            value={metrics.proposals.total}
            subtitle={`$${Number(metrics.proposals.totalAmount).toLocaleString('es-EC', { minimumFractionDigits: 2 })} total`}
            icon={FileText}
            color="emerald"
            href="/comercial/propuestas"
          />
          <MetricCard
            title="Propuestas Aprobadas"
            value={metrics.proposals.approvedCount}
            subtitle={`${metrics.proposals.pendingApprovalCount} pendientes Robinson`}
            icon={ShieldCheck}
            color={metrics.proposals.pendingApprovalCount > 0 ? 'amber' : 'emerald'}
            href="/comercial/propuestas"
          />
          <MetricCard
            title="Proyectos en Desarrollo"
            value={metrics.projects.activeCount}
            subtitle={`${metrics.projects.completedCount} entregados`}
            icon={FolderKanban}
            color="indigo"
            href="/proyectos"
          />
          <MetricCard
            title="Proyectos Bloqueados"
            value={metrics.projects.blockedCount}
            subtitle={metrics.projects.blockedCount > 0 ? 'Alerta crítica activa' : 'Flujo normal'}
            icon={AlertTriangle}
            color={metrics.projects.blockedCount > 0 ? 'rose' : 'emerald'}
            href="/proyectos"
          />
        </div>
      </section>

      {/* 4. SECCIÓN CLIENTES, SOPORTE, RETENCIÓN Y REFERIDOS */}
      <section>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> Clientes, Soporte, Retención y Alianzas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Clientes Activos"
            value={metrics.clients.activeCount}
            subtitle={`${metrics.clients.maintenanceActiveCount} en mantenimiento`}
            icon={Users}
            color="cyan"
            href="/clientes"
          />
          <MetricCard
            title="Mantenimientos por Vencer"
            value={metrics.clients.expiringSoonCount}
            subtitle="< 30 días para renovación"
            icon={Calendar}
            color={metrics.clients.expiringSoonCount > 0 ? 'amber' : 'cyan'}
          />
          <MetricCard
            title="Incidencias Abiertas"
            value={metrics.support.openTicketsCount}
            subtitle={`${metrics.support.criticalTicketsCount} críticas`}
            icon={LifeBuoy}
            color={metrics.support.criticalTicketsCount > 0 ? 'rose' : 'indigo'}
          />
          <MetricCard
            title="Red de Referidos"
            value={metrics.retention.referralsCount}
            subtitle={`${metrics.retention.lostOpportunitiesCount} perdidas`}
            icon={Share2}
            color="emerald"
          />
        </div>
      </section>

      {/* 5. DISTRIBUCIÓN POR ETAPAS DEL EMBUDO COMERCIAL */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" /> Distribución de Oportunidades por Etapa
        </h3>

        {Object.keys(metrics.leads.byStage).length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Sin oportunidades registradas</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(metrics.leads.byStage).map(([stage, count]) => (
              <div key={stage} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate" title={stage}>
                  {stage}
                </span>
                <span className="text-xl font-extrabold text-white mt-1 block">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. BITÁCORA DE AUDITORÍA RECIENTE (Trazabilidad y Seguridad) */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" /> Registro de Auditoría Reciente (Trazabilidad)
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">Últimos eventos sensibles</span>
        </div>

        {metrics.recentAudits.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Sin eventos de auditoría registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-semibold">Acción</th>
                  <th className="pb-2 font-semibold">Tabla</th>
                  <th className="pb-2 font-semibold">Usuario</th>
                  <th className="pb-2 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.recentAudits.map(audit => (
                  <tr key={audit.id} className="text-slate-300 hover:bg-slate-800/30">
                    <td className="py-2.5 font-bold">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                          audit.action === 'INSERT'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : audit.action === 'UPDATE'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {audit.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">{audit.table_name}</td>
                    <td className="py-2.5 text-slate-300">{audit.user_email || 'Sistema'}</td>
                    <td className="py-2.5 text-slate-500">
                      {new Date(audit.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
