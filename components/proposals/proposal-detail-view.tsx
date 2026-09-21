'use client';

import { useState } from 'react';
import { Proposal } from '@/types/database.types';
import { updateProposalStatusAction, acceptProposalAndCreateProjectAction } from '@/app/actions/proposals';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ProposalDetailViewProps {
  proposal: Proposal & { leads?: { company_name: string }; clients?: { company_name: string }; demos?: { name: string } };
}

export function ProposalDetailView({ proposal }: ProposalDetailViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsSubmitting(true);
    try {
      await updateProposalStatusAction(proposal.id, e.target.value);
    } catch (err) {
      alert('Error al actualizar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptProposal = async () => {
    if (!confirm('¿Confirmar aceptación comercial y convertir a proyecto formal? Esto creará el cliente (si no existe) y el proyecto asociado.')) return;
    setIsConverting(true);
    try {
      await acceptProposalAndCreateProjectAction(proposal.id, proposal.title);
      // La action redirige a proyectos
    } catch (err: any) {
      alert('Error al aceptar la propuesta: ' + err.message);
      setIsConverting(false);
    }
  };

  const isAcceptedOrLater = ['Aceptada', 'Rechazada', 'Cancelada'].includes(proposal.status);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/comercial/propuestas" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Propuestas
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase">{proposal.proposal_number}</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{proposal.title}</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Para: {proposal.clients?.company_name || proposal.leads?.company_name || 'Sin empresa'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={proposal.status} 
              onChange={handleStatusChange}
              disabled={isSubmitting || isAcceptedOrLater}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {['Borrador', 'Enviada', 'Vista', 'En negociación', 'Aceptada', 'Rechazada', 'Vencida', 'Cancelada'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {!isAcceptedOrLater && (
              <button
                onClick={handleAcceptProposal}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Aceptar & Crear Proyecto
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Detalles Financieros</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Precio Base</p>
            <p className="text-lg font-bold text-slate-300">${proposal.price?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase mb-1">Descuento</p>
            <p className="text-lg font-bold text-rose-400">${proposal.discount?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/20 col-span-2 md:col-span-2">
            <p className="text-[10px] text-emerald-500 uppercase mb-1 font-bold">Total a Pagar</p>
            <p className="text-2xl font-black text-emerald-400">${proposal.total?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="space-y-4">
          {proposal.description && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Descripción</p>
              <p className="text-xs text-slate-300">{proposal.description}</p>
            </div>
          )}
          {proposal.scope && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Alcance</p>
              <p className="text-xs text-slate-300">{proposal.scope}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
