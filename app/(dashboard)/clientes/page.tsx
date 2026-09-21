import { createClient } from '@/utils/supabase/server';
import { Client } from '@/types/database.types';
import { ClientsTable } from '@/components/clients/clients-table';
import { Users, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clientes | RSD Solutions CRM',
  description: 'Gestión de clientes activos de RSD Solutions',
};

export const revalidate = 0;

export default async function ClientesPage() {
  let clients: Client[] = [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      clients = data as Client[];
    }
  } catch (e) {
    console.warn('Error al consultar clientes:', e);
  }

  const activeCount    = clients.filter(c => c.status === 'Activo').length;
  const inactiveCount  = clients.filter(c => c.status === 'Inactivo').length;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Clientes</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {activeCount} activos
            </span>
            {inactiveCount > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700">
                {inactiveCount} inactivos
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Directorio de clientes convertidos de RSD Solutions.
          </p>
        </div>

        <Link
          href="/clientes/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Cliente
        </Link>
      </div>

      {/* Estado vacío */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-slate-300 font-semibold text-sm">Sin clientes registrados</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Los clientes aparecerán aquí cuando conviertas un lead o los registres manualmente.
          </p>
          <Link
            href="/clientes/nuevo"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Registrar primer cliente
          </Link>
        </div>
      ) : (
        <ClientsTable clients={clients} />
      )}
    </main>
  );
}
