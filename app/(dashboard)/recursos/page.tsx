import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { RecursosView } from '@/components/recursos/recursos-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recursos | CRM-RSD',
  description: 'Documentos y recursos para asesores',
};

export default async function RecursosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'asesor';

  return (
    <div className="p-6">
      <RecursosView role={role} />
    </div>
  );
}
