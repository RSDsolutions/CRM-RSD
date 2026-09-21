'use client';

import { useState } from 'react';
import { Project } from '@/types/database.types';
import { updateProjectStatusAction } from '@/app/actions/projects';
import { ArrowLeft, Loader2, FolderKanban } from 'lucide-react';
import Link from 'next/link';

interface ProjectDetailViewProps {
  project: Project & { clients?: { company_name: string }; proposals?: { proposal_number: string } };
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="space-y-6">
      <div>
        <Link href="/proyectos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Proyectos
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">{project.project_code}</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.name}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Cliente: {project.clients?.company_name || 'Sin empresa'}
              {project.proposals?.proposal_number && ` • Propuesta: ${project.proposals.proposal_number}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={project.status} 
              onChange={handleStatusChange}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {[
                'Pendiente de inicio', 'Planificación', 'Diseño', 'Desarrollo',
                'Pruebas internas', 'Revisión del cliente', 'Correcciones',
                'Listo para entrega', 'Entregado', 'Aceptado',
                'Pendiente de pago', 'Pagado', 'Mantenimiento', 'Finalizado', 'Cancelado'
              ].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
          <FolderKanban className="w-4 h-4" /> Resumen del Proyecto
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <p><span className="text-slate-500 mr-2">Tipo de Software:</span> <span className="text-slate-200">{project.software_type || 'N/A'}</span></p>
            <p><span className="text-slate-500 mr-2">Precio:</span> <span className="text-emerald-400 font-semibold">{project.price ? `$${project.price.toFixed(2)}` : 'N/A'}</span></p>
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
    </div>
  );
}
