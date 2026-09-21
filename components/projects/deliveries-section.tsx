'use client';

import { useState } from 'react';
import { ProjectDelivery, ProjectAcceptance } from '@/types/database.types';
import { createDeliveryAction, updateDeliveryStatusAction } from '@/app/actions/deliveries';
import { createAcceptanceAction } from '@/app/actions/acceptances';
import { FolderGit2, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface DeliveriesSectionProps {
  projectId: string;
  deliveries: (ProjectDelivery & { project_acceptances: ProjectAcceptance[] })[];
  isCompleted: boolean;
}

export function DeliveriesSection({ projectId, deliveries, isCompleted }: DeliveriesSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [showAcceptForm, setShowAcceptForm] = useState<string | null>(null);

  const handleCreateDelivery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createDeliveryAction(new FormData(e.currentTarget));
      setShowNewForm(false);
    } catch (err) {
      alert('Error al crear entrega');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAcceptance = async (e: React.FormEvent<HTMLFormElement>, deliveryId: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('delivery_id', deliveryId);
      await createAcceptanceAction(formData);
      setShowAcceptForm(null);
    } catch (err) {
      alert('Error al registrar aceptación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('Aceptada')) return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (status === 'Rechazada') return <XCircle className="w-4 h-4 text-rose-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FolderGit2 className="w-4 h-4 text-indigo-400" />
          Entregas y Aceptación
        </h3>
        {!isCompleted && !showNewForm && (
          <button onClick={() => setShowNewForm(true)} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded">
            + Nueva Entrega
          </button>
        )}
      </div>

      {showNewForm && (
        <form onSubmit={handleCreateDelivery} className="p-4 bg-slate-800/30 border-b border-slate-800 space-y-3">
          <input type="hidden" name="project_id" value={projectId} />
          <div className="grid grid-cols-2 gap-3">
            <input name="title" required placeholder="Título de entrega (Ej. Beta 1.0)" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
            <input name="version" placeholder="Versión (Opcional)" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
          </div>
          <input name="delivery_url" placeholder="URL de Entrega / Demo" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
          <textarea name="notes" placeholder="Notas adicionales..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" rows={2} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewForm(false)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded flex items-center">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null} Registrar Entrega
            </button>
          </div>
        </form>
      )}

      <div className="p-0">
        {deliveries.length === 0 ? (
          <p className="text-xs text-slate-500 p-6 text-center">No hay entregas registradas aún.</p>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="p-4 hover:bg-slate-800/20 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded mr-2">#{delivery.delivery_number}</span>
                    <strong className="text-sm text-slate-200">{delivery.title}</strong>
                    {delivery.version && <span className="text-xs text-slate-500 ml-2">v{delivery.version}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-slate-800 px-2 py-1 rounded">
                    {getStatusIcon(delivery.status)}
                    <span className={
                      delivery.status.includes('Aceptada') ? 'text-emerald-400' : 
                      delivery.status === 'Rechazada' ? 'text-rose-400' : 'text-amber-400'
                    }>{delivery.status}</span>
                  </div>
                </div>

                {delivery.delivery_url && (
                  <a href={delivery.delivery_url} target="_blank" className="text-xs text-indigo-400 hover:underline block mb-2">
                    Ver Entrega ↗
                  </a>
                )}
                
                {delivery.notes && <p className="text-xs text-slate-400 mb-3">{delivery.notes}</p>}

                {/* Aceptaciones de esta entrega */}
                {delivery.project_acceptances?.length > 0 ? (
                  <div className="mt-3 bg-slate-900/80 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-[10px] uppercase text-slate-500 mb-2 font-semibold">Historial de Aceptación</p>
                    {delivery.project_acceptances.map(acc => (
                      <div key={acc.id} className="text-xs text-slate-300 mb-1 last:mb-0">
                        <span className="font-semibold text-slate-200">{acc.status}</span>
                        {acc.accepted_by_client_name && ` por ${acc.accepted_by_client_name}`}
                        {acc.observations && <span className="block text-slate-500 italic mt-0.5">"{acc.observations}"</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3">
                    {showAcceptForm === delivery.id ? (
                      <form onSubmit={(e) => handleCreateAcceptance(e, delivery.id)} className="bg-slate-800/40 p-3 rounded-lg border border-slate-700">
                        <input type="hidden" name="project_id" value={projectId} />
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <select name="status" className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white" required>
                            <option value="">Seleccionar Estado...</option>
                            <option value="Aceptada">Aceptada</option>
                            <option value="Aceptada con observaciones">Aceptada con observaciones</option>
                            <option value="Rechazada">Rechazada</option>
                          </select>
                          <input name="accepted_by_client_name" placeholder="Nombre de quien acepta" className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                        </div>
                        <textarea name="observations" placeholder="Observaciones del cliente..." className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white mb-2" rows={2} />
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => setShowAcceptForm(null)} className="text-[10px] text-slate-400 hover:text-white px-2 py-1">Cancelar</button>
                          <button type="submit" disabled={isSubmitting} className="text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded flex items-center">
                            {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null} Guardar Respuesta
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button onClick={() => setShowAcceptForm(delivery.id)} className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-400/30 hover:border-emerald-400/50 rounded px-2 py-1 transition-colors">
                        Registrar Respuesta del Cliente
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
