'use client';

import { useState } from 'react';
import { Demo } from '@/types/database.types';
import { Monitor, ArrowRight, PlusCircle, Search, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface DemosTableProps {
  demos: (Demo & { leads?: { company_name: string }; clients?: { company_name: string } })[];
}

export function DemosTable({ demos }: DemosTableProps) {
  const [search, setSearch] = useState('');

  const filtered = demos.filter((d) => {
    const q = search.toLowerCase();
    const matchName = d.name?.toLowerCase().includes(q);
    const matchType = d.software_type?.toLowerCase().includes(q);
    const matchCompany = (d.clients?.company_name || d.leads?.company_name)?.toLowerCase().includes(q);
    return matchName || matchType || matchCompany;
  });

  return (
    <div className="space-y-4">
      {/* ─── FILTROS Y ACCIONES ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar demo por nombre, software o empresa..."
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
          href="/comercial/demos/nuevo"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all self-stretch sm:self-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nueva Demo</span>
        </Link>
      </div>

      {/* ─── TABLA DE DEMOS ─── */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5 text-left font-semibold">Demo / Prototipo</th>
                <th className="px-4 py-3.5 text-left font-semibold">Empresa / Lead</th>
                <th className="px-4 py-3.5 text-left font-semibold">Tipo de Solución</th>
                <th className="px-4 py-3.5 text-left font-semibold">Estado de Validación</th>
                <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">Fecha de Creación</th>
                <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Monitor}
                      title="Sin demos registradas"
                      description={search ? 'No hay demos que coincidan con la búsqueda.' : 'Aún no se han configurado prototipos o demos comerciales.'}
                      action={{
                        label: 'Crear Demo',
                        href: '/comercial/demos/nuevo',
                        icon: <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((demo) => (
                  <tr key={demo.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0 text-purple-400 group-hover:scale-105 transition-transform">
                          <Monitor className="w-4 h-4" />
                        </div>
                        <p className="font-bold text-white group-hover:text-purple-300 transition-colors text-xs">
                          {demo.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-300">
                      {demo.clients?.company_name || demo.leads?.company_name || 'Sin empresa vinculada'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-400 font-medium">
                      {demo.software_type}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {demo.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-slate-400 text-xs font-mono">
                      {format(parseISO(demo.created_at), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/comercial/demos/${demo.id}`}
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
            <span>Mostrando {filtered.length} demo{filtered.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-400 font-medium">Prototipos & Demos RSD</span>
          </div>
        )}
      </div>
    </div>
  );
}
