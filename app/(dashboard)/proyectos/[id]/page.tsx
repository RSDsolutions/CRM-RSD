import { createClient } from '@/utils/supabase/server';
import { ProjectDetailView } from '@/components/projects/project-detail-view';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const revalidate = 0;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase.from('projects').select('name, project_code').eq('id', params.id).single();
  return { title: data ? `${data.project_code} - ${data.name} | RSD Solutions` : 'Proyecto | RSD Solutions' };
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  // Obtener rol del usuario
  const { data: roles } = await supabase.rpc('get_user_role');
  const isAdmin = roles === 'admin';

  // Consultar todo el árbol de datos del proyecto (Phase 3 Lifecycle)
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, company_name),
      proposals(id, proposal_number),
      project_deliveries(
        *,
        project_acceptances(*)
      ),
      payments(*),
      maintenance_contracts(
        *,
        maintenance_events(*)
      )
    `)
    .eq('id', params.id)
    .single();

  if (error || !project) notFound();

  // Ordenar entregas y pagos
  const deliveries = (project.project_deliveries || []).sort((a: any, b: any) => b.delivery_number - a.delivery_number);
  const payments = (project.payments || []).sort((a: any, b: any) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  
  // Mantenimiento (asumimos 1 activo por simplificar el dashboard en esta fase)
  const maintenanceContract = project.maintenance_contracts && project.maintenance_contracts.length > 0
    ? project.maintenance_contracts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <ProjectDetailView 
        project={project as any} 
        deliveries={deliveries as any}
        payments={payments as any}
        maintenanceContract={maintenanceContract as any}
        isAdmin={isAdmin}
      />
    </main>
  );
}
