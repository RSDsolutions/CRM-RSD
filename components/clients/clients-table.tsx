'use client';

import { useState } from 'react';
import { Client } from '@/types/database.types';
import { 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin, 
  Users, 
  Search, 
  ExternalLink,
  PlusCircle,
  X,
  Filter
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

interface ClientsTableProps {
  clients: Client[];
}

const STATUS_CONFIG: Record<string, { dot: string; badge: string }> = {
  'Activo':     { dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  'Inactivo':   { dot: 'bg-slate-400',   badge: 'bg-slate-800 text-slate-400 border-slate-700' },
  'Suspendido': { dot: 'bg-rose-400',    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
};

export function ClientsTable({ clients }: ClientsTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = clients.filter((c) => {
    const matchSearch =
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.city ?? '').toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter ? c.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-4">
      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl shadow-sm">
        <div className="flex flex-1 items-center gap-3 w-full">
          {/* Buscador */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente por empresa, correo o ciudad..."
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

          {/* Filtro estado */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="">Todos los Estados</option>
              <option value="Activo">Activos</option>
              <option value="Inactivo">Inactivos</option>
              <option value="Suspendido">Suspendidos</option>
            </select>
          </div>
        </div>

        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all self-stretch sm:self-auto justify-center"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Cliente</span>
        </Link>
      </div>

      {/* ─── TABLA DE CARTERA ─── */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-5 py-3.5 text-left font-semibold">Empresa / Razón</th>
                <th className="px-4 py-3.5 text-left font-semibold hidden sm:table-cell">Contacto Directo</th>
                <th className="px-4 py-3.5 text-left font-semibold hidden md:table-cell">Ciudad</th>
                <th className="px-4 py-3.5 text-left font-semibold">Estado de Cuenta</th>
                <th className="px-4 py-3.5 text-left font-semibold hidden lg:table-cell">Cliente Desde</th>
                <th className="px-5 py-3.5 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Users}
                      title="No se encontraron clientes"
                      description={search || statusFilter ? 'No hay resultados que coincidan con los filtros aplicados.' : 'Aún no tienes clientes formalizados en la cartera de RSD.'}
                      action={{
                        label: 'Registrar Cliente',
                        href: '/clientes/nuevo',
                        icon: <PlusCircle className="w-3.5 h-3.5 mr-1" />
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG['Inactivo'];
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Empresa */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 text-indigo-400 group-hover:scale-105 transition-transform">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-indigo-200 transition-colors text-xs">
                              {client.company_name}
                            </p>
                            {client.industry && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{client.industry}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <div className="space-y-1">
                          {client.email && (
                            <p className="text-slate-300 flex items-center gap-1.5 text-xs">
                              <Mail className="w-3 h-3 text-indigo-400" />
                              {client.email}
                            </p>
                          )}
                          {client.phone && (
                            <p className="text-slate-400 flex items-center gap-1.5 text-[11px] font-mono">
                              <Phone className="w-3 h-3 text-slate-500" />
                              {client.phone}
                            </p>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Ciudad */}
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        {client.city ? (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {client.city}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {client.status}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3.5 hidden lg:table-cell text-slate-400 text-xs font-mono">
                        {format(parseISO(client.converted_at), "dd MMM yyyy", { locale: es })}
                      </td>

                      {/* Acciones */}
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          href={`/clientes/${client.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-xs font-semibold transition-all shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Perfil 360</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Mostrando {filtered.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''} formalizados</span>
            <span className="text-slate-400 font-medium">Cartera RSD Solutions</span>
          </div>
        )}
      </div>
    </div>
  );
}
