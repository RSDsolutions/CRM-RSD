'use client';

import { Project } from '@/types/database.types';
import { FolderKanban, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ProjectsTableProps {
  projects: (Project & { clients?: { company_name: string } })[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3 text-left font-semibold">Código / Proyecto</th>
              <th className="px-4 py-3 text-left font-semibold">Cliente</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Inicio</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <FolderKanban className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">{project.name}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-0.5">{project.project_code}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-300">
                  {project.clients?.company_name || 'Sin cliente'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {project.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                  {project.start_date ? format(parseISO(project.start_date), "dd MMM yyyy", { locale: es }) : 'Pendiente'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/proyectos/${project.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-medium transition-all"
                  >
                    Ver <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
