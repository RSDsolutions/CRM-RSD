'use client';

import { useState } from 'react';
import { Project } from '@/types/database.types';
import { FolderKanban, ArrowRight, PlusCircle, Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface ProjectsTableProps {
  projects: (Project & { clients?: { company_name: string } })[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const [search, setSearch] = useState('');

  const filtered = projects.filter((p) => {
    const q = search.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(q);
    const matchCode = p.project_code?.toLowerCase().includes(q);
    const matchClient = p.clients?.company_name?.toLowerCase().includes(q);
    return matchName || matchCode || matchClient;
  });

  return (
    <div className="space-y-4">
      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar proyecto por nombre, código o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Link
          href="/proyectos/nuevo"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all self-stretch sm:self-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </Link>
      </div>

      {/* ─── TABLA DE PROYECTOS ─── */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5 text-left font-semibold">Código / Proyecto</th>
                <th className="px-4 py-3.5 text-left font-semibold">Cliente Formal</th>
                <th className="px-4 py-3.5 text-left font-semibold">Estado de Producción</th>
                <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">Fecha de Inicio</th>
                <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8">
                    <EmptyState
                      icon={FolderKanban}
                      title="Sin proyectos encontrados"
                      description={search ? 'No hay proyectos que coincidan con la búsqueda.' : 'No tienes proyectos de software activos registrados aún.'}
                      action={{
                        label: 'Crear Proyecto',
                        href: '/proyectos/nuevo',
                        icon: <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-emerald-300 transition-colors text-xs">
                            {project.name}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-mono mt-0.5 tracking-wider font-semibold">
                            {project.project_code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-300">
                      {project.clients?.company_name || 'Sin cliente vinculado'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-slate-400 text-xs font-mono">
                      {project.start_date ? format(parseISO(project.start_date), "dd MMM yyyy", { locale: es }) : 'Pendiente'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/proyectos/${project.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                      >
                        <span>Detalles</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mostrando {filtered.length} proyecto{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-400 font-medium">Producción & Desarrollo RSD</span>
          </div>
        )}
      </div>
    </div>
  );
}
