'use client';

import { useState } from 'react';
import { Demo, DemoFeedback } from '@/types/database.types';
import { updateDemoStatusAction, addDemoFeedbackAction, convertDemoToProposalAction } from '@/app/actions/demos';
import { ArrowLeft, MessageSquare, Loader2, Save, FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface DemoDetailViewProps {
  demo: Demo & { leads?: { company_name: string }; clients?: { company_name: string } };
  feedback: DemoFeedback[];
}

export function DemoDetailView({ demo, feedback }: DemoDetailViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsSubmitting(true);
    try {
      await updateDemoStatusAction(demo.id, e.target.value);
    } catch (err) {
      alert('Error al actualizar estado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFeedback = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDemoFeedbackAction(demo.id, new FormData(e.currentTarget));
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert('Error al agregar feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToProposal = async () => {
    if (!confirm('¿Convertir esta demo en una propuesta comercial?')) return;
    setIsConverting(true);
    try {
      await convertDemoToProposalAction(demo.id);
      // La action hace redirect
    } catch (err: any) {
      alert('Error al convertir: ' + err.message);
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/comercial/demos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Demos
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{demo.name}</h1>
            <p className="text-xs text-slate-400 mt-1">
              {demo.clients?.company_name || demo.leads?.company_name || 'Sin empresa asociada'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={demo.status} 
              onChange={handleStatusChange}
              disabled={isSubmitting}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              {['Pendiente', 'Programada', 'Presentada', 'Interesado', 'Solicita cambios', 'No interesado', 'Convertida a proyecto', 'Cancelada'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {demo.status !== 'Convertida a proyecto' && (
              <button
                onClick={handleConvertToProposal}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Crear Propuesta
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Info */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4">Detalles</h2>
          <div className="space-y-3 text-xs">
            <p><span className="text-slate-500 mr-2">Tipo de Software:</span> <span className="text-slate-200">{demo.software_type}</span></p>
            <p><span className="text-slate-500 mr-2">URL:</span> <a href={demo.demo_url || '#'} className="text-indigo-400 hover:underline" target="_blank">{demo.demo_url || 'N/A'}</a></p>
            <p><span className="text-slate-500 mr-2">Objetivo:</span> <span className="text-slate-200">{demo.objective || 'N/A'}</span></p>
            <p><span className="text-slate-500 mr-2">Creada:</span> <span className="text-slate-200">{format(parseISO(demo.created_at), "dd/MM/yyyy")}</span></p>
          </div>
          {demo.description && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-[10px] uppercase text-slate-500 mb-1">Descripción</p>
              <p className="text-xs text-slate-300">{demo.description}</p>
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 flex flex-col">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Feedback & Historial
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-64 pr-2">
            {feedback.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Sin feedback registrado</p>
            ) : (
              feedback.map(f => (
                <div key={f.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">{f.feedback_type}</span>
                    <span className="text-[10px] text-slate-500">{format(parseISO(f.created_at), "dd MMM HH:mm")}</span>
                  </div>
                  <p className="text-xs text-slate-300">{f.comment}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAddFeedback} className="mt-auto border-t border-slate-800 pt-4 space-y-3">
            <select name="feedback_type" className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500">
              <option value="Comentario">Comentario general</option>
              <option value="Solicitud de cambio">Solicitud de cambio</option>
              <option value="Objeción">Objeción</option>
              <option value="Confirmación">Confirmación de interés</option>
            </select>
            <textarea name="comment" required rows={2} placeholder="Agregar comentario..." className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar Feedback
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
