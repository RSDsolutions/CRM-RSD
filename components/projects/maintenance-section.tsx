'use client';

import { useState } from 'react';
import { MaintenanceContract, MaintenanceEvent } from '@/types/database.types';
import { createMaintenanceEventAction, updateMaintenanceEventStatusAction } from '@/app/actions/maintenance';
import { ShieldCheck, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { differenceInDays } from 'date-fns';

interface MaintenanceSectionProps {
  projectId: string;
  maintenanceContract: (MaintenanceContract & { maintenance_events: MaintenanceEvent[] }) | null;
}

export function MaintenanceSection({ projectId, maintenanceContract }: MaintenanceSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewEventForm, setShowNewEventForm] = useState(false);

  if (!maintenanceContract) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 text-center">
        <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-slate-400">Sin Mantenimiento Activo</h3>
        <p className="text-xs text-slate-500 mt-1">El mantenimiento se activa automáticamente al confirmar pagos de un proyecto completado.</p>
      </div>
    );
  }

  const daysLeft = maintenanceContract.end_date 
    ? differenceInDays(new Date(maintenanceContract.end_date), new Date()) 
    : 0;

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createMaintenanceEventAction(new FormData(e.currentTarget));
      setShowNewEventForm(false);
    } catch (err) {
      alert('Error al registrar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveEvent = async (eventId: string) => {
    setIsSubmitting(true);
    try {
      await updateMaintenanceEventStatusAction(eventId, projectId, 'Resuelto');
    } catch (err) {
      alert('Error al actualizar evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Mantenimiento & Soporte
        </h3>
        <div className="flex items-center gap-3">
          <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${daysLeft > 0 ? 'bg-cyan-900/50 text-cyan-400' : 'bg-rose-900/50 text-rose-400'}`}>
            {daysLeft > 0 ? `${daysLeft} DÍAS RESTANTES` : 'VENCIDO'}
          </span>
          {!showNewEventForm && (
            <button onClick={() => setShowNewEventForm(true)} className="text-[10px] bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1 rounded">
              + Registrar Actividad
            </button>
          )}
        </div>
      </div>

      <div className="p-4 bg-slate-800/20 border-b border-slate-800 flex gap-6 text-xs text-slate-300">
        <p><strong className="text-slate-500 mr-1">Tipo:</strong> {maintenanceContract.type}</p>
        <p><strong className="text-slate-500 mr-1">Inicio:</strong> {new Date(maintenanceContract.start_date || '').toLocaleDateString()}</p>
        <p><strong className="text-slate-500 mr-1">Fin:</strong> {new Date(maintenanceContract.end_date || '').toLocaleDateString()}</p>
      </div>

      {showNewEventForm && (
        <form onSubmit={handleCreateEvent} className="p-4 bg-slate-800/30 border-b border-slate-800 space-y-3">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="maintenance_contract_id" value={maintenanceContract.id} />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select name="type" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" required>
              <option value="Soporte">Soporte</option>
              <option value="Corrección">Corrección</option>
              <option value="Preventivo">Preventivo</option>
              <option value="Incidencia">Incidencia</option>
            </select>
            <select name="priority" className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" required>
              <option value="Media">Prioridad Media</option>
              <option value="Alta">Prioridad Alta</option>
              <option value="Baja">Prioridad Baja</option>
            </select>
            <input name="title" required placeholder="Título del evento" className="col-span-2 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" />
          </div>
          <textarea name="description" placeholder="Descripción de la actividad o reporte..." className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white" rows={2} required />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowNewEventForm(false)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-1.5 rounded flex items-center">
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null} Registrar
            </button>
          </div>
        </form>
      )}

      <div className="p-0">
        {(!maintenanceContract.maintenance_events || maintenanceContract.maintenance_events.length === 0) ? (
          <p className="text-xs text-slate-500 p-6 text-center">No hay actividades registradas en este periodo.</p>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {maintenanceContract.maintenance_events.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-800/20 transition-colors flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <strong className="text-sm text-slate-200">{evt.title}</strong>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                      evt.priority === 'Alta' ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-800 text-slate-400'
                    }`}>{evt.priority}</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{evt.description}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(evt.created_at).toLocaleDateString()} • {evt.type}
                    {evt.resolved_at && ` • Resuelto: ${new Date(evt.resolved_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                    evt.status === 'Resuelto' || evt.status === 'Cerrado' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-amber-900/50 text-amber-400'
                  }`}>
                    {evt.status}
                  </span>
                  {evt.status !== 'Resuelto' && evt.status !== 'Cerrado' && (
                    <button 
                      onClick={() => handleResolveEvent(evt.id)}
                      disabled={isSubmitting}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Marcar Resuelto
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
