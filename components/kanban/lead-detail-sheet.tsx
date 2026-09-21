'use client';

import { useState, useEffect } from 'react';
import { Lead } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import { convertLeadToClientAction } from '@/app/actions/clients';
import { 
  X, 
  User, 
  Laptop, 
  Calendar, 
  UserCheck, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface LeadDetailSheetProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

export function LeadDetailSheet({ lead, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const supabase = createClient();
  const router = useRouter();
  const [logText, setLogText] = useState(lead?.interaction_log || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (lead) {
      setLogText(lead.interaction_log);
      setStatusMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  // Ya fue convertido si tiene client_id
  const alreadyConverted = !!lead.client_id;
  // Elegible para conversión si está en estados avanzados
  const eligibleForConversion = 
    lead.status === 'Cerrado-Ganado' ||
    lead.status === 'Propuesta' ||
    lead.status === 'Negociación';

  const handleSaveLog = async () => {
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ interaction_log: logText })
        .eq('id', lead.id);

      if (error) throw new Error(error.message);

      const updatedLead = { ...lead, interaction_log: logText };
      onLeadUpdated(updatedLead);
      setStatusMessage({ type: 'success', text: 'Bitácora guardada correctamente' });

      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Error al actualizar bitácora:', err);
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar la bitácora' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvertToClient = async () => {
    if (!confirm(`¿Confirmas convertir a "${lead.company_name}" en cliente de RSD Solutions?`)) return;

    setIsConverting(true);
    setStatusMessage(null);

    try {
      const clientId = await convertLeadToClientAction(lead.id);
      setStatusMessage({ type: 'success', text: '✅ Lead convertido a cliente correctamente. Redirigiendo...' });
      
      const updatedLead: Lead = { 
        ...lead, 
        status: 'Cerrado-Ganado',
        client_id: clientId,
        converted_at: new Date().toISOString(),
      };
      onLeadUpdated(updatedLead);

      setTimeout(() => {
        onClose();
        router.push(`/clientes/${clientId}`);
      }, 1500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al convertir el lead' });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                Detalle del Lead
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">
                {lead.company_name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Mensajes */}
            {statusMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Info Grid */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" /> Contacto
                </span>
                <span className="text-slate-200 font-medium">{lead.contact_name}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Laptop className="w-3.5 h-3.5 text-indigo-400" /> Tipo Software
                </span>
                <span className="text-slate-200 font-medium">{lead.software_type}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-800/70">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" /> Asignado a
                </span>
                <span className="text-slate-200 font-medium">{lead.assigned_to}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Fecha Cita
                </span>
                <span className="text-slate-200 font-medium">
                  {lead.appointment_date 
                    ? format(parseISO(lead.appointment_date), "dd/MM/yyyy HH:mm 'hrs'", { locale: es }) 
                    : 'Sin cita agendada'}
                </span>
              </div>
            </div>

            {/* Bitácora editable */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Bitácora de Interacción & Requerimientos
              </label>
              <textarea
                rows={7}
                value={logText}
                onChange={(e) => setLogText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Añade actualizaciones de la llamada o nuevos requerimientos..."
              />
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveLog}
                  disabled={isSaving || logText === lead.interaction_log}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Actualizar Bitácora
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Convertir a Cliente */}
            {!alreadyConverted && eligibleForConversion && (
              <div className="pt-4 border-t border-slate-800">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
                  Conversión
                </p>
                <button
                  onClick={handleConvertToClient}
                  disabled={isConverting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isConverting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Convirtiendo...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" />Convertir a Cliente<ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
                <p className="text-[10px] text-slate-500 text-center mt-2">
                  Se creará un perfil de cliente con los datos de este lead.
                </p>
              </div>
            )}

            {alreadyConverted && (
              <div className="pt-4 border-t border-slate-800">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Este lead ya fue convertido a cliente.</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
