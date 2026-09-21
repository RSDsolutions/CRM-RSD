'use client';

import { Proposal } from '@/types/database.types';
import { FileText, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ProposalsTableProps {
  proposals: (Proposal & { leads?: { company_name: string }; clients?: { company_name: string } })[];
}

export function ProposalsTable({ proposals }: ProposalsTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3 text-left font-semibold">Nº Propuesta</th>
              <th className="px-4 py-3 text-left font-semibold">Empresa</th>
              <th className="px-4 py-3 text-left font-semibold">Total</th>
              <th className="px-4 py-3 text-left font-semibold">Estado</th>
              <th className="px-4 py-3 text-left font-semibold hidden md:table-cell">Fecha</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {proposals.map((proposal) => (
              <tr key={proposal.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="font-semibold text-slate-200">{proposal.proposal_number}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-300">
                  {proposal.clients?.company_name || proposal.leads?.company_name || 'Sin empresa'}
                </td>
                <td className="px-4 py-3 text-emerald-400 font-semibold">
                  {proposal.total ? `$${proposal.total.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    {proposal.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                  {format(parseISO(proposal.created_at), "dd MMM yyyy", { locale: es })}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/comercial/propuestas/${proposal.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white text-[10px] font-medium transition-all"
                  >
                    Ver <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
