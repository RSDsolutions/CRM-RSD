import { createClient } from '@/utils/supabase/server';
import { createProjectAction } from '@/app/actions/projects';
import { ArrowLeft, FolderKanban, Save } from 'lucide-react';
import Link from 'next/link';

export default async function NuevoProyectoPage({
  searchParams,
}: {
  searchParams: { client_id?: string; proposal_id?: string; demo_id?: string };
}) {
  const supabase = createClient();
  
  // Obtener lista de clientes activos para el select (si no viene client_id predefinido)
  const { data: clients } = await supabase
    .from('clients')
    .select('id, company_name')
    .eq('status', 'Activo')
    .order('company_name');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/proyectos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Proyectos
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Crear Proyecto</h1>
          <p className="text-xs text-slate-400 mt-1">Registrar un nuevo proyecto manualmente.</p>
        </div>

        <form action={createProjectAction} className="bg-slate-900 border border-slate-800/80 shadow-2xl rounded-2xl p-6 space-y-6">
          <input type="hidden" name="proposal_id" value={searchParams.proposal_id || ''} />
          <input type="hidden" name="demo_id" value={searchParams.demo_id || ''} />

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Nombre del Proyecto *</label>
              <input name="name" required placeholder="Ej. E-commerce B2B" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Cliente *</label>
              {searchParams.client_id ? (
                // Si viene de una propuesta aceptada, normalmente se crea auto, pero por si acaso.
                <input type="hidden" name="client_id" value={searchParams.client_id} />
              ) : (
                <select name="client_id" required className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seleccione un cliente...</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Tipo de Software</label>
              <select name="software_type" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500">
                <option value="Web App">Web App</option>
                <option value="Mobile App">Mobile App</option>
                <option value="E-commerce">E-commerce</option>
                <option value="ERP/CRM">ERP/CRM</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Precio Acordado (USD)</label>
              <input name="price" type="number" step="0.01" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Fecha de Inicio</label>
              <input name="start_date" type="date" className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Descripción General</label>
              <textarea name="description" rows={3} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg">
              <Save className="w-3.5 h-3.5" /> Crear Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
