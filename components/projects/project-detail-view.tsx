'use client';

import { useState } from 'react';
import {
  Project,
  ProjectDelivery,
  ProjectAcceptance,
  Payment,
  MaintenanceContract,
  MaintenanceEvent,
  ProjectMilestone,
  ScopeChangeRequest,
} from '@/types/database.types';
import { updateProjectStatusAction } from '@/app/actions/projects';
import {
  ArrowLeft,
  Loader2,
  FolderKanban,
  Info,
  Box,
  CreditCard,
  ShieldCheck,
  Milestone,
  GitPullRequest,
  AlertOctagon,
  UserCheck,
  Code2,
} from 'lucide-react';
import Link from 'next/link';
import { DeliveriesSection } from './deliveries-section';
import { PaymentsSection } from './payments-section';
import { MaintenanceSection } from './maintenance-section';
import { MilestonesSection } from './milestones-section';
import { ScopeChangesSection } from './scope-changes-section';

interface ProjectDetailViewProps {
  project: Project & {
    clients?: { id: string; company_name: string };
    proposals?: { id: string; proposal_number: string };
  };
  deliveries: (ProjectDelivery & { project_acceptances: ProjectAcceptance[] })[];
  payments: Payment[];
  maintenanceContract: (MaintenanceContract & { maintenance_events: MaintenanceEvent[] }) | null;
  milestones?: ProjectMilestone[];
  scopeChanges?: ScopeChangeRequest[];
  isAdmin: boolean;
}

type TabType = 'resumen' | 'hitos' | 'cambios' | 'entregas' | 'pagos' | 'mantenimiento';

export function ProjectDetailView({
  project,
  deliveries,
  payments,
  maintenanceContract,
  milestones = [],
  scopeChanges = [],
  isAdmin,
}: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados reducidos para el select del pipeline de desarrollo
  const developmentStatuses = [
    'Pendiente de inicio',
    'Planificación',
    'Diseño',
    'Desarrollo',
    'Pruebas internas',
    'Completado',
    'Cancelado',
  ];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsSubmitting(true);
    try {
      await updateProjectStatusAction(project.id, e.target.value);
    } catch {
      alert('Error al actualizar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingScopeChangesCount = scopeChanges.filter(
    s => s.status === 'Solicitado' || s.status === 'En evaluación' || s.status === 'Pendiente aprobación interna'
  ).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <Link href="/proyectos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Proyectos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded uppercase">
                {project.project_code}
              </span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded uppercase">
                Alcance v{project.scope_version || 1}
              </span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            </div>
            <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded">Cliente: {project.clients?.company_name || 'Sin empresa'}</span>
              {project.proposals?.proposal_number && (
                <span className="bg-slate-800 px-2 py-1 rounded">Propuesta: {project.proposals.proposal_number}</span>
              )}
              <span className="bg-indigo-950/60 border border-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                <Code2 className="w-3 h-3 text-indigo-400" /> Dirección Técnica: Robinson Solórzano
              </span>
              <span className="bg-emerald-950/60 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1 text-[11px]">
                <UserCheck className="w-3 h-3 text-emerald-400" /> Asesor Comercial Permanente
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 ml-2 mr-2">Desarrollo:</span>
              <select
                value={project.status}
                onChange={handleStatusChange}
                disabled={isSubmitting}
                className="bg-transparent text-white text-xs font-semibold focus:outline-none focus:ring-0 appearance-none disabled:opacity-50 min-w-[120px] cursor-pointer"
              >
                {!developmentStatuses.includes(project.status) && (
                  <option value={project.status}>{project.status}</option>
                )}
                {developmentStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin text-indigo-400 mr-2" />}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Bloqueo Activo */}
      {(project.has_blocker || project.active_blocker) && (
        <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">Proyecto Bloqueado / En Alerta Crítica</h4>
            <p className="text-xs text-red-200/90 mt-1">{project.active_blocker || 'Existe un impedimento técnico o comercial que detiene el avance.'}</p>
          </div>
        </div>
      )}

      {/* Tabs Nav */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'resumen', label: 'Resumen', icon: <Info className="w-4 h-4" /> },
          { id: 'hitos', label: `Hitos (${milestones.length})`, icon: <Milestone className="w-4 h-4" /> },
          {
            id: 'cambios',
            label: `Control de Cambios (${scopeChanges.length})${pendingScopeChangesCount > 0 ? ` [${pendingScopeChangesCount} Pend.]` : ''}`,
            icon: <GitPullRequest className="w-4 h-4" />,
          },
          { id: 'entregas', label: `Entregas (${deliveries.length})`, icon: <Box className="w-4 h-4" /> },
          { id: 'pagos', label: `Pagos (${payments.length})`, icon: <CreditCard className="w-4 h-4" /> },
          { id: 'mantenimiento', label: 'Mantenimiento', icon: <ShieldCheck className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'resumen' && (
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
              <FolderKanban className="w-4 h-4" /> Detalles del Proyecto & Arquitectura
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <p>
                  <span className="text-slate-500 mr-2">Tipo de Software:</span>{' '}
                  <span className="text-slate-200">{project.software_type || 'N/A'}</span>
                </p>
                <p>
                  <span className="text-slate-500 mr-2">Presupuesto (Base + Cambios):</span>{' '}
                  <span className="text-emerald-400 font-semibold">
                    {project.price ? `$${Number(project.price).toFixed(2)} ${project.currency || 'USD'}` : 'N/A'}
                  </span>
                </p>
                <p>
                  <span className="text-slate-500 mr-2">Versión de Alcance:</span>{' '}
                  <span className="text-amber-400 font-semibold">v{project.scope_version || 1}</span>
                </p>
                <p>
                  <span className="text-slate-500 mr-2">Fecha Inicio:</span>{' '}
                  <span className="text-slate-200">{project.start_date || 'No definida'}</span>
                </p>
              </div>
              <div className="space-y-3">
                <p>
                  <span className="text-slate-500 mr-2">Entrega Estimada:</span>{' '}
                  <span className="text-slate-200">{project.estimated_delivery_date || 'En planificación'}</span>
                </p>
                <p>
                  <span className="text-slate-500 mr-2">Repositorio:</span>{' '}
                  {project.repository_url ? (
                    <a href={project.repository_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Ver Repositorio
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
                <p>
                  <span className="text-slate-500 mr-2">URL Producción:</span>{' '}
                  {project.production_url ? (
                    <a href={project.production_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      Ver Producción
                    </a>
                  ) : (
                    'N/A'
                  )}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
              {project.description && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Descripción</p>
                  <p className="text-xs text-slate-300">{project.description}</p>
                </div>
              )}
              {project.scope && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Alcance Aprobado</p>
                  <div className="text-xs text-slate-300 bg-slate-800/40 p-3 rounded-xl border border-slate-800 whitespace-pre-line">
                    {project.scope}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hitos' && (
          <MilestonesSection projectId={project.id} milestones={milestones} isLocked={project.status === 'Completado'} />
        )}

        {activeTab === 'cambios' && (
          <ScopeChangesSection
            projectId={project.id}
            scopeChanges={scopeChanges}
            isAdmin={isAdmin}
            currentScopeVersion={project.scope_version || 1}
          />
        )}

        {activeTab === 'entregas' && (
          <DeliveriesSection
            projectId={project.id}
            deliveries={deliveries}
            isCompleted={project.status === 'Completado'}
          />
        )}

        {activeTab === 'pagos' && (
          <PaymentsSection
            projectId={project.id}
            clientId={project.clients?.id || ''}
            proposalId={project.proposals?.id}
            payments={payments}
            isAdmin={isAdmin}
          />
        )}

        {activeTab === 'mantenimiento' && (
          <MaintenanceSection
            projectId={project.id}
            maintenanceContract={maintenanceContract}
          />
        )}
      </div>
    </div>
  );
}
