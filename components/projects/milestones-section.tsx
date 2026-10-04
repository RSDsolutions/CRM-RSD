'use client';

import { useState } from 'react';
import { ProjectMilestone } from '@/types/database.types';
import { createMilestoneAction, updateMilestoneStatusAction } from '@/app/actions/milestones';
import { CheckCircle2, Clock, AlertTriangle, Plus, Loader2, Calendar } from 'lucide-react';

interface MilestonesSectionProps {
  projectId: string;
  milestones: ProjectMilestone[];
  isLocked?: boolean;
}

export function MilestonesSection({ projectId, milestones, isLocked }: MilestonesSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [orderIndex, setOrderIndex] = useState(milestones.length + 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const completedCount = milestones.filter(m => m.status === 'Completado').length;
  const progressPercent = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;
    setIsSubmitting(true);
    try {
      const res = await createMilestoneAction({
        project_id: projectId,
        title,
        description,
        target_date: targetDate,
        order_index: orderIndex,
      });
      if (res.success) {
        setTitle('');
        setDescription('');
        setTargetDate('');
        setShowAddForm(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (milestoneId: string, newStatus: 'Pendiente' | 'En progreso' | 'Completado' | 'Atrasado') => {
    setUpdatingId(milestoneId);
    try {
      const res = await updateMilestoneStatusAction(milestoneId, projectId, newStatus);
      if (!res.success) {
        alert('Error: ' + res.error);
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Progreso de Hitos */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Hitos y Cronograma Técnico ({completedCount}/{milestones.length})
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Control de fases de desarrollo y entregas intermedias pactadas.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-indigo-400">{progressPercent}%</span>
          {!isLocked && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" /> Nuevo Hito
            </button>
          )}
        </div>
      </div>

      {/* Formulario nuevo hito */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900/90 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">Registrar Nuevo Hito</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Título del Hito *</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Configuración de Base de Datos y Auth"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Fecha Objetivo *</label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Descripción / Criterio de Aceptación</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalle de entregable o alcance de este hito..."
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar Hito
            </button>
          </div>
        </form>
      )}

      {/* Lista de Hitos */}
      {milestones.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay hitos técnicos registrados para este proyecto.</p>
          <p className="text-[11px] text-slate-500 mt-1">Registra los hitos clave para dar seguimiento al cronograma de entrega.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((m, idx) => {
            const isCompleted = m.status === 'Completado';
            const isBlocked = m.status === 'Atrasado';
            const isInProgress = m.status === 'En progreso';

            return (
              <div
                key={m.id}
                className={`bg-slate-900 border rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${
                  isCompleted ? 'border-emerald-500/20 bg-emerald-950/5' : isBlocked ? 'border-red-500/30 bg-red-950/5' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-slate-500 bg-slate-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-xs font-bold ${isCompleted ? 'text-emerald-300 line-through' : 'text-white'}`}>
                        {m.title}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : isBlocked
                            ? 'bg-red-500/10 text-red-400'
                            : isInProgress
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                    {m.description && <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>}
                    <div className="flex items-center gap-4 text-[10px] text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> Objetivo: {m.target_date}
                      </span>
                      {m.completed_date && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completado: {new Date(m.completed_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  {updatingId === m.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <select
                      value={m.status}
                      onChange={e => handleStatusChange(m.id, e.target.value as any)}
                      className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En progreso">En progreso</option>
                      <option value="Completado">Completado</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
