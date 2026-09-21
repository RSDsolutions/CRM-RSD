import { createClient } from '@/utils/supabase/server';
import { Proposal } from '@/types/database.types';
import { ProposalsTable } from '@/components/proposals/proposals-table';
import { FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Propuestas | RSD Solutions CRM',
  description: 'Gestión de Propuestas comerciales',
};

export const revalidate = 0;

export default async function ProposalsPage() {
  const supabase = createClient();
  const { data: proposals } = await supabase
    .from('proposals')
    .select(`
      *,
      leads ( company_name ),
      clients ( company_name )
    `)
    .order('created_at', { ascending: false });

  const activeProposals = (proposals || []).filter(p => 
    !['Rechazada', 'Vencida', 'Cancelada', 'Aceptada'].includes(p.status)
  ).length;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Propuestas Comerciales</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {activeProposals} en curso
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión y seguimiento de propuestas enviadas.
          </p>
        </div>
        <Link
          href="/comercial/propuestas/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Nueva Propuesta
        </Link>
      </div>

      {!proposals || proposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-slate-300 font-semibold text-sm">Sin propuestas registradas</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Crea propuestas desde leads o demostraciones comerciales.
          </p>
        </div>
      ) : (
        <ProposalsTable proposals={proposals as any[]} />
      )}
    </main>
  );
}
