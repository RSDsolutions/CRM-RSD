import { createClient } from '@/utils/supabase/server';
import { Demo } from '@/types/database.types';
import { DemosTable } from '@/components/demos/demos-table';
import { Monitor, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demos | RSD Solutions CRM',
  description: 'Gestión de Demos comerciales',
};

export const revalidate = 0;

export default async function DemosPage() {
  const supabase = createClient();
  const { data: demos } = await supabase
    .from('demos')
    .select(`
      *,
      leads ( company_name ),
      clients ( company_name )
    `)
    .order('created_at', { ascending: false });

  const activeDemos = (demos || []).filter(d => 
    !['Cancelada', 'Convertida a proyecto', 'No interesado'].includes(d.status)
  ).length;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Demos Comerciales</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {activeDemos} activas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de demostraciones de software para prospectos y clientes.
          </p>
        </div>
        <Link
          href="/comercial/demos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Demo
        </Link>
      </div>

      {!demos || demos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Monitor className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-slate-300 font-semibold text-sm">Sin demos registradas</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Programa demostraciones desde los leads o regístralas directamente.
          </p>
        </div>
      ) : (
        <DemosTable demos={demos as any[]} />
      )}
    </main>
  );
}
