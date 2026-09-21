'use client';

import { useState } from 'react';
import { Project, ProjectDelivery, ProjectAcceptance, Payment, MaintenanceContract, MaintenanceEvent } from '@/types/database.types';
import { updateProjectStatusAction } from '@/app/actions/projects';
import { ArrowLeft, Loader2, FolderKanban, Info, Box, CreditCard, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { DeliveriesSection } from './deliveries-section';
import { PaymentsSection } from './payments-section';
import { MaintenanceSection } from './maintenance-section';

interface ProjectDetailViewProps {
  project: Project & { clients?: { id: string; company_name: string }; proposals?: { id: string; proposal_number: string } };
  deliveries: (ProjectDelivery & { project_acceptances: ProjectAcceptance[] })[];
  payments: Payment[];
  maintenanceContract: (MaintenanceContract & { maintenance_events: MaintenanceEvent[] }) | null;
  isAdmin: boolean;
}

type TabType = 'resumen' | 'entregas' | 'pagos' | 'mantenimiento';

export function ProjectDetailView({ project, deliveries, payments, maintenanceContract, isAdmin }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados reducidos para el select del pipeline de desarrollo
  const developmentStatuses = [
    'Pendiente de inicio', 'Planificación', 'Diseño', 'Desarrollo',
    'Pruebas internas', 'Completado', 'Cancelado'
  ];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsSubmitting(true);
    try {
      await updateProjectStatusAction(project.id, e.target.value);
    } catch (err) {
      alert('Error al actualizar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded uppercase">{project.project_code}</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-2 flex items-center gap-2">
              <span className="bg-slate-800 px-2 py-1 rounded">Cliente: {project.clients?.company_name || 'Sin empresa'}</span>
              {project.proposals?.proposal_number && <span className="bg-slate-800 px-2 py-1 rounded">Propuesta: {project.proposals.proposal_number}</span>}
            </p>
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
                {/* Mostramos el estado actual aunque sea legado para no romper la vista, pero las opciones nuevas son limitadas */}
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

      {/* Tabs Nav */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        {[
          { id: 'resumen', label: 'Resumen', icon: <Info className="w-4 h-4" /> },
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
              <FolderKanban className="w-4 h-4" /> Detalles del Proyecto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-3">
                <p><span className="text-slate-500 mr-2">Tipo de Software:</span> <span className="text-slate-200">{project.software_type || 'N/A'}</span></p>
                <p><span className="text-slate-500 mr-2">Presupuesto (Base):</span> <span className="text-emerald-400 font-semibold">{project.price ? `$${project.price.toFixed(2)}` : 'N/A'}</span></p>
                <p><span className="text-slate-500 mr-2">Fecha Inicio:</span> <span className="text-slate-200">{project.start_date || 'No definida'}</span></p>
              </div>
              <div className="space-y-3">
                <p><span className="text-slate-500 mr-2">Repositorio:</span> {project.repository_url ? <a href={project.repository_url} target="_blank" className="text-indigo-400 hover:underline">Ver Repositorio</a> : 'N/A'}</p>
                <p><span className="text-slate-500 mr-2">URL Producción:</span> {project.production_url ? <a href={project.production_url} target="_blank" className="text-indigo-400 hover:underline">Ver Producción</a> : 'N/A'}</p>
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
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Alcance Definido</p>
                  <p className="text-xs text-slate-300">{project.scope}</p>
                </div>
              )}
            </div>
          </div>
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
