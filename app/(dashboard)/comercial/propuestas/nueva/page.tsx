import { createClient } from '@/utils/supabase/server';
import { createProposalAction } from '@/app/actions/proposals';
import { ArrowLeft, FileText, Save } from 'lucide-react';
import Link from 'next/link';

export default async function NuevaPropuestaPage({
  searchParams,
}: {
  searchParams: { lead_id?: string; client_id?: string; demo_id?: string };
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/comercial/propuestas" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Propuestas
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Crear Propuesta</h1>
          <p className="text-xs text-slate-400 mt-1">Registrar nueva propuesta comercial.</p>
        </div>

        <form action={createProposalAction} className="bg-slate-900 border border-slate-800/80 shadow-2xl rounded-2xl p-6 space-y-6">
          <input type="hidden" name="lead_id" value={searchParams.lead_id || ''} />
          <input type="hidden" name="client_id" value={searchParams.client_id || ''} />
          <input type="hidden" name="demo_id" value={searchParams.demo_id || ''} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Título de la Propuesta *</label>
              <input name="title" required placeholder="Ej. Desarrollo de App Móvil v1" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Precio Base (USD) *</label>
              <input name="price" type="number" step="0.01" required className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Descuento (USD)</label>
              <input name="discount" type="number" step="0.01" defaultValue="0" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Descripción y Alcance</label>
              <textarea name="description" rows={4} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg">
              <Save className="w-3.5 h-3.5" /> Registrar Propuesta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
