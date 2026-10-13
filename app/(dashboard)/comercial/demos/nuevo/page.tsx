import { createClient } from '@/utils/supabase/server';
import { NuevaDemoForm } from '@/components/demos/nueva-demo-form';
import { ArrowLeft, Monitor } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Registrar Demo | RSD Solutions CRM',
  description: 'Vincular y programar demostración técnica para prospectos o clientes',
};

export const revalidate = 0;

export default async function NuevaDemoPage({
  searchParams,
}: {
  searchParams: { lead_id?: string; client_id?: string };
}) {
  const supabase = createClient();

  const [
    { data: leads },
    { data: clients },
    diagRes,
    dnaRes
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, company_name, contact_name, phone, email, status, niche, software_type, main_need, problem_description')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, company_name, contact_name')
      .order('company_name', { ascending: true }),
    searchParams.lead_id
      ? supabase
          .from('diagnostics')
          .select('*')
          .eq('lead_id', searchParams.lead_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    searchParams.lead_id
      ? supabase
          .from('company_dna')
          .select('*')
          .eq('lead_id', searchParams.lead_id)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Link
            href="/comercial/demos"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Demos
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white">Registrar Demo Comercial</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Programa una sesión técnica vinculada al lead, con alcance funcional y validación de criterios.
              </p>
            </div>
          </div>
        </div>

        <NuevaDemoForm
          leads={leads || []}
          clients={clients || []}
          initialLeadId={searchParams.lead_id}
          initialClientId={searchParams.client_id}
          initialDiagnostic={diagRes.data}
          initialDna={dnaRes.data}
        />
      </div>
    </div>
  );
}
