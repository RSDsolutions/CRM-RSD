'use client';

import { useState } from 'react';
import { Client } from '@/types/database.types';
import { 
  Building2, Globe, Phone, Mail, MapPin, 
  Laptop, Users, CheckCircle, XCircle, 
  Clock, Search, ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ClientsTableProps {
  clients: Client[];
}

const STATUS_CONFIG = {
  'Activo':     { dot: 'bg-emerald-500', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' },
  'Inactivo':   { dot: 'bg-slate-500',   badge: 'bg-slate-700/30 text-slate-400 border-slate-700' },
  'Suspendido': { dot: 'bg-rose-500',    badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30' },
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
    <div>
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por empresa, email o ciudad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
          <option value="Suspendido">Suspendido</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3 text-left font-semibold">Empresa</th>
                <th className="px-4 py-3 text-left font-semibold hidden sm:table-cell">Contacto</th>
                <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Ciudad</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold hidden lg:table-cell">Desde</th>
                <th className="px-4 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    {search || statusFilter ? 'Sin resultados para la búsqueda.' : 'Sin clientes registrados.'}
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const statusCfg = STATUS_CONFIG[client.status] ?? STATUS_CONFIG['Inactivo'];
                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Empresa */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-indigo-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-100 group-hover:text-white">
                              {client.company_name}
                            </p>
                            {client.industry && (
                              <p className="text-[10px] text-slate-500">{client.industry}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="space-y-0.5">
                          {client.email && (
                            <p className="text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {client.email}
                            </p>
                          )}
                          {client.phone && (
                            <p className="text-slate-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </p>
                          )}
                          {!client.email && !client.phone && (
                            <span className="text-slate-600">—</span>
                          )}
                        </div>
                      </td>

                      {/* Ciudad */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {client.city ? (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {client.city}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {client.status}
                        </span>
                      </td>

                      {/* Fecha */}
                      <td className="px-4 py-3 hidden lg:table-cell text-slate-500">
                        {format(parseISO(client.converted_at), "dd MMM yyyy", { locale: es })}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/clientes/${client.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-medium transition-all"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Ver perfil
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
          <div className="px-4 py-2.5 border-t border-slate-800 text-[10px] text-slate-500">
            Mostrando {filtered.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
