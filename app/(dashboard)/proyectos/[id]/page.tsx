import { createClient } from '@/utils/supabase/server';
import { Project } from '@/types/database.types';
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

  const { data: project, error } = await supabase
    .from('projects')
    .select('*, clients(company_name), proposals(proposal_number)')
    .eq('id', params.id)
    .single();

  if (error || !project) notFound();

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      <ProjectDetailView project={project as any} />
    </main>
  );
}
