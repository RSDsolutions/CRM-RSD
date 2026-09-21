import { createClient } from '@/utils/supabase/server';
import { createDemoAction } from '@/app/actions/demos';
import { ArrowLeft, Monitor, Save } from 'lucide-react';
import Link from 'next/link';

export default async function NuevaDemoPage({
  searchParams,
}: {
  searchParams: { lead_id?: string; client_id?: string };
}) {
  const supabase = createClient();
  let contextName = '';

  if (searchParams.lead_id) {
    const { data } = await supabase.from('leads').select('company_name').eq('id', searchParams.lead_id).single();
    if (data) contextName = `para ${data.company_name} (Lead)`;
  } else if (searchParams.client_id) {
    const { data } = await supabase.from('clients').select('company_name').eq('id', searchParams.client_id).single();
    if (data) contextName = `para ${data.company_name} (Cliente)`;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/comercial/demos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Demos
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Programar Demo</h1>
          <p className="text-xs text-slate-400 mt-1">Registrar nueva demostración de software {contextName}.</p>
        </div>

        <form action={createDemoAction} className="bg-slate-900 border border-slate-800/80 shadow-2xl rounded-2xl p-6 space-y-6">
          <input type="hidden" name="lead_id" value={searchParams.lead_id || ''} />
          <input type="hidden" name="client_id" value={searchParams.client_id || ''} />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Nombre de la Demo *</label>
              <input name="name" required placeholder="Ej. Presentación CRM V2" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Tipo de Software *</label>
              <select name="software_type" required className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500">
                <option value="Web App">Web App</option>
                <option value="Mobile App">Mobile App</option>
                <option value="E-commerce">E-commerce</option>
                <option value="ERP/CRM">ERP/CRM</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Objetivo de la demo</label>
              <input name="objective" placeholder="Ej. Mostrar el módulo de inventario..." className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">URL de la reunión / entorno</label>
              <input name="demo_url" type="url" placeholder="https://meet.google.com/..." className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Descripción</label>
              <textarea name="description" rows={3} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg">
              <Save className="w-3.5 h-3.5" /> Registrar Demo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
