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
  Activity,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface ExecutiveDashboardViewProps {
  metrics: ComprehensiveDashboardMetrics;
}

export function ExecutiveDashboardView({ metrics }: ExecutiveDashboardViewProps) {
  return (
    <div className="space-y-8 pb-16">
      
      {/* ─── BANNER SUPERIOR DE DIRECCIÓN ─── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Dirección General
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Monitoreo Operativo en Tiempo Real
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Panel de Control Ejecutivo & Métricas Clave
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl">
            Visión 360° del ciclo comercial: prospección de leads, diagnósticos técnicos, entregas de desarrollo y cartera de clientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <span>Ver Pipeline Kanban</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ─── 1. NIVEL 1: PIPELINE COMERCIAL & ATENCIÓN URGENTE ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> 1. Pipeline Comercial & Atención de Leads
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Embudo y conversión directa</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Leads"
            value={metrics.leads.total}
            subtitle={`${metrics.leads.newCount} nuevos en embudo`}
            icon={Users}
            color="indigo"
            href="/"
          />
          <MetricCard
            title="Leads Sin Contacto"
            value={metrics.leads.unattendedCount}
            subtitle={metrics.leads.unattendedCount > 0 ? 'Requieren contacto inmediato' : 'Todos al día'}
            icon={AlertTriangle}
            color={metrics.leads.unattendedCount > 0 ? 'rose' : 'emerald'}
            urgency={metrics.leads.unattendedCount > 0}
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

      {/* ─── 2. NIVEL 2: DEMOS, REVISIÓN ROBINSON & CONSUMO IA ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-violet-400" /> 2. Demos, Aprobaciones & Declaración de Tokens IA
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Auditoría de prototipos y cuota</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Demos Solicitadas"
            value={metrics.demos.total}
            subtitle={`${metrics.demos.inPreparationCount} en preparación activa`}
            icon={Monitor}
            color="indigo"
            href="/comercial/demos"
          />
          <MetricCard
            title="Pendientes Aprobación"
            value={metrics.demos.pendingApprovalCount}
            subtitle="Revisión directa de Robinson"
            icon={AlertTriangle}
            color={metrics.demos.pendingApprovalCount > 0 ? 'amber' : 'indigo'}
            href="/comercial/demos"
          />
          <MetricCard
            title="Demos Aprobadas"
            value={metrics.demos.approvedCount}
            subtitle={`${metrics.demos.presentedCount} ya presentadas al cliente`}
            icon={ShieldCheck}
            color="emerald"
            href="/comercial/demos"
          />
          <MetricCard
            title="Consumo IA Declarado"
            value={`${metrics.demos.aiAvgPercentage}%`}
            subtitle={`${metrics.demos.aiWindowsCount} ventanas 5h registradas`}
            icon={Cpu}
            color="purple"
            href="/comercial/demos"
          />
        </div>
      </section>

      {/* ─── 3. NIVEL 3: PROPUESTAS & CONTROL OPERATIVO ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-emerald-400" /> 3. Propuestas Económicas & Proyectos
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Volumen financiero y desarrollo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Propuestas Comerciales"
            value={metrics.proposals.total}
            subtitle={`$${Number(metrics.proposals.totalAmount).toLocaleString('es-EC', { minimumFractionDigits: 2 })} en cotizaciones`}
            icon={FileText}
            color="emerald"
            href="/comercial/propuestas"
          />
          <MetricCard
            title="Propuestas Aprobadas"
            value={metrics.proposals.approvedCount}
            subtitle={`${metrics.proposals.pendingApprovalCount} pendientes por Robinson`}
            icon={ShieldCheck}
            color={metrics.proposals.pendingApprovalCount > 0 ? 'amber' : 'emerald'}
            href="/comercial/propuestas"
          />
          <MetricCard
            title="Proyectos en Desarrollo"
            value={metrics.projects.activeCount}
            subtitle={`${metrics.projects.completedCount} entregados con éxito`}
            icon={FolderKanban}
            color="indigo"
            href="/proyectos"
          />
          <MetricCard
            title="Proyectos Bloqueados"
            value={metrics.projects.blockedCount}
            subtitle={metrics.projects.blockedCount > 0 ? 'Requieren intervención' : 'Flujo normal sin trabas'}
            icon={AlertTriangle}
            color={metrics.projects.blockedCount > 0 ? 'rose' : 'emerald'}
            urgency={metrics.projects.blockedCount > 0}
            href="/proyectos"
          />
        </div>
      </section>

      {/* ─── 4. CARTERA DE CLIENTES & SOPORTE ─── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> 4. Cartera de Clientes, Soporte & Alianzas
          </h2>
          <span className="text-[11px] text-slate-500 font-medium">Relación postventa y retención</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Clientes Activos"
            value={metrics.clients.activeCount}
            subtitle={`${metrics.clients.maintenanceActiveCount} con mantenimiento activo`}
            icon={Users}
            color="cyan"
            href="/clientes"
          />
          <MetricCard
            title="Mantenimientos por Vencer"
            value={metrics.clients.expiringSoonCount}
            subtitle="Menos de 30 días para renovar"
            icon={Calendar}
            color={metrics.clients.expiringSoonCount > 0 ? 'amber' : 'cyan'}
          />
          <MetricCard
            title="Incidencias Abiertas"
            value={metrics.support.openTicketsCount}
            subtitle={`${metrics.support.criticalTicketsCount} con prioridad crítica`}
            icon={LifeBuoy}
            color={metrics.support.criticalTicketsCount > 0 ? 'rose' : 'indigo'}
          />
          <MetricCard
            title="Red de Referidos"
            value={metrics.retention.referralsCount}
            subtitle={`${metrics.retention.lostOpportunitiesCount} oportunidades perdidas`}
            icon={Share2}
            color="emerald"
          />
        </div>
      </section>

      {/* ─── 5. DISTRIBUCIÓN POR ETAPAS DEL EMBUDO COMERCIAL ─── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Distribución de Oportunidades por Etapa
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Volumen por estado de prospección</span>
        </div>

        {Object.keys(metrics.leads.byStage).length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Sin oportunidades registradas actualmente.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Object.entries(metrics.leads.byStage).map(([stage, count]) => (
              <div 
                key={stage} 
                className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block truncate" title={stage}>
                  {stage}
                </span>
                <span className="text-2xl font-black text-white mt-1.5 block tracking-tight">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── 6. BITÁCORA DE AUDITORÍA RECIENTE (Trazabilidad y Seguridad) ─── */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" /> Registro de Auditoría Reciente (Trazabilidad)
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold">Eventos de seguridad y mutaciones</span>
        </div>

        {metrics.recentAudits.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center">Sin eventos de auditoría registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] uppercase text-slate-500 border-b border-slate-800">
                  <th className="pb-3 font-semibold">Acción</th>
                  <th className="pb-3 font-semibold">Tabla</th>
                  <th className="pb-3 font-semibold">Usuario</th>
                  <th className="pb-3 font-semibold">Fecha y Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {metrics.recentAudits.map(audit => (
                  <tr key={audit.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-bold">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase font-bold ${
                          audit.action === 'INSERT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : audit.action === 'UPDATE'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {audit.action}
                      </span>
                    </td>
                    <td className="py-2.5 font-mono text-slate-400">{audit.table_name}</td>
                    <td className="py-2.5 text-slate-300">{audit.user_email || 'Sistema'}</td>
                    <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                      {new Date(audit.created_at).toLocaleString('es-EC')}
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
