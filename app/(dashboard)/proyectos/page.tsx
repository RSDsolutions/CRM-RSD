import { createClient } from '@/utils/supabase/server';
import { Project } from '@/types/database.types';
import { ProjectsTable } from '@/components/projects/projects-table';
import { FolderKanban, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Proyectos | RSD Solutions CRM',
  description: 'Gestión de Proyectos en ejecución',
};

export const revalidate = 0;

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      *,
      clients ( company_name )
    `)
    .order('created_at', { ascending: false });

  const activeProjects = (projects || []).filter(p => 
    !['Finalizado', 'Cancelado'].includes(p.status)
  ).length;

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Proyectos</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {activeProjects} activos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión y seguimiento de proyectos en ejecución.
          </p>
        </div>
        <Link
          href="/proyectos/nuevo"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo Proyecto
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <FolderKanban className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-slate-300 font-semibold text-sm">Sin proyectos activos</h3>
          <p className="text-slate-500 text-xs mt-1 max-w-xs">
            Los proyectos se crean automáticamente al aceptar una propuesta.
          </p>
        </div>
      ) : (
        <ProjectsTable projects={projects as any[]} />
      )}
    </main>
  );
}
