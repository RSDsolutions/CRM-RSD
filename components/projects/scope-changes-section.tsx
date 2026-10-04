'use client';

import { useState } from 'react';
import { ScopeChangeRequest } from '@/types/database.types';
import {
  createScopeChangeRequestAction,
  reviewScopeChangeAction,
  clientAcceptScopeChangeAction,
} from '@/app/actions/scope-changes';
import {
  ShieldAlert,
  Plus,
  Loader2,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';

interface ScopeChangesSectionProps {
  projectId: string;
  scopeChanges: ScopeChangeRequest[];
  isAdmin: boolean;
  currentScopeVersion?: number;
}

export function ScopeChangesSection({
  projectId,
  scopeChanges,
  isAdmin,
  currentScopeVersion = 1,
}: ScopeChangesSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [description, setDescription] = useState('');
  const [reason, setReason] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [affectedModules, setAffectedModules] = useState('');
  const [technicalImpact, setTechnicalImpact] = useState('');
  const [scheduleImpactDays, setScheduleImpactDays] = useState(0);
  const [commercialImpactAmount, setCommercialImpactAmount] = useState(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createScopeChangeRequestAction({
        project_id: projectId,
        description,
        reason,
        expected_benefit: expectedBenefit,
        affected_modules: affectedModules,
        technical_impact: technicalImpact,
        schedule_impact_days: scheduleImpactDays,
        commercial_impact_amount: commercialImpactAmount,
      });
      if (res.success) {
        setDescription('');
        setReason('');
        setExpectedBenefit('');
        setAffectedModules('');
        setTechnicalImpact('');
        setScheduleImpactDays(0);
        setCommercialImpactAmount(0);
        setShowAddModal(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReview = async (changeId: string, decision: 'Aprobado por Robinson' | 'Rechazado') => {
    if (!reviewNotes.trim()) {
      alert('Debes ingresar observaciones para la decisión');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await reviewScopeChangeAction(changeId, projectId, decision, reviewNotes);
      if (res.success) {
        setReviewingId(null);
        setReviewNotes('');
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClientAcceptance = async (changeId: string) => {
    if (!confirm('¿Confirmar que el cliente aceptó formalmente este cambio de alcance? Esto incrementará la versión del alcance del proyecto.')) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await clientAcceptScopeChangeAction(changeId, projectId);
      if (!res.success) {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Control de Alcance */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" /> Control de Cambios de Alcance
            </h3>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
              Versión Actual del Alcance: v{currentScopeVersion}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Ningún cambio de alcance se aplica en caliente. Toda modificación debe ser evaluada técnicamente y aprobada por Robinson y el cliente.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Solicitar Cambio
        </button>
      </div>

      {/* Modal / Formulario Nueva Solicitud */}
      {showAddModal && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Nueva Solicitud de Cambio de Alcance (Change Request)
            </h4>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Descripción del Cambio *</label>
              <textarea
                required
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe la funcionalidad adicional o modificación solicitada..."
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Motivo de la Solicitud *</label>
              <input
                type="text"
                required
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Ej. Solicitud del cliente por nueva ley / Requisito operativo"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Beneficio Esperado</label>
              <input
                type="text"
                value={expectedBenefit}
                onChange={e => setExpectedBenefit(e.target.value)}
                placeholder="Ej. Optimización de tiempos en cobros"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Módulos Afectados</label>
              <input
                type="text"
                value={affectedModules}
                onChange={e => setAffectedModules(e.target.value)}
                placeholder="Ej. Módulo Facturación, API WhatsApp"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Impacto Técnico</label>
              <input
                type="text"
                value={technicalImpact}
                onChange={e => setTechnicalImpact(e.target.value)}
                placeholder="Ej. Requiere migración de base de datos y webhook"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Impacto en Plazo (Días adicionales)</label>
              <input
                type="number"
                min={0}
                value={scheduleImpactDays}
                onChange={e => setScheduleImpactDays(Number(e.target.value))}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Impacto Comercial ($ USD adicionales)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={commercialImpactAmount}
                onChange={e => setCommercialImpactAmount(Number(e.target.value))}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Registrar Solicitud
            </button>
          </div>
        </form>
      )}

      {/* Lista de Cambios de Alcance */}
      {scopeChanges.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <ShieldAlert className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay solicitudes de cambio de alcance registradas.</p>
          <p className="text-[11px] text-slate-500 mt-1">El proyecto se mantiene con el alcance original v1.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {scopeChanges.map(change => {
            const isApprovedRobinson = change.status === 'Aprobado por Robinson';
            const isClientAccepted = change.status === 'Aprobado por cliente';
            const isRejected = change.status === 'Rechazado';
            const isPending = change.status === 'Solicitado' || change.status === 'En evaluación' || change.status === 'Pendiente aprobación interna';

            return (
              <div
                key={change.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-4 transition ${
                  isClientAccepted
                    ? 'border-emerald-500/20 bg-emerald-950/5'
                    : isApprovedRobinson
                    ? 'border-indigo-500/30 bg-indigo-950/5'
                    : isRejected
                    ? 'border-red-500/20 bg-red-950/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                      {change.change_code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isClientAccepted
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isApprovedRobinson
                          ? 'bg-indigo-500/10 text-indigo-400'
                          : isRejected
                          ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {change.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Solicitado: {new Date(change.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{change.description}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    <strong className="text-slate-500">Motivo:</strong> {change.reason}
                  </p>
                  {change.expected_benefit && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <strong className="text-slate-500">Beneficio:</strong> {change.expected_benefit}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 rounded-xl p-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Módulos</span>
                    <span className="font-semibold text-slate-300">{change.affected_modules || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Impacto Técnico</span>
                    <span className="font-semibold text-slate-300">{change.technical_impact || 'Bajo'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Días Extra</span>
                    <span className="font-semibold text-amber-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> +{change.schedule_impact_days} días
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Costo Extra</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> +${Number(change.commercial_impact_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Observaciones de Robinson */}
                {change.robinson_decision && (
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 text-xs">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Decisión Robinson Solórzano: {change.robinson_decision}
                    </p>
                    {change.robinson_notes && (
                      <p className="text-slate-300 mt-1 text-[11px]">{change.robinson_notes}</p>
                    )}
                  </div>
                )}

                {/* Acciones de Revisión de Robinson */}
                {isAdmin && isPending && (
                  <div className="border-t border-slate-800 pt-3">
                    {reviewingId === change.id ? (
                      <div className="space-y-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700">
                        <label className="text-[10px] uppercase font-bold text-slate-400">Observaciones Técnicas / Decisión</label>
                        <textarea
                          rows={2}
                          value={reviewNotes}
                          onChange={e => setReviewNotes(e.target.value)}
                          placeholder="Justificación técnica, condiciones y confirmación de impacto..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReviewingId(null)}
                            className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleReview(change.id, 'Rechazado')}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded text-xs font-semibold"
                          >
                            <XCircle className="w-3 h-3" /> Rechazar
                          </button>
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleReview(change.id, 'Aprobado por Robinson')}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Aprobar Internamente
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(change.id)}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                      >
                        Revisar y Decidir como Dirección →
                      </button>
                    )}
                  </div>
                )}

                {/* Aceptación del cliente (Asesor o Admin registra confirmación del cliente) */}
                {isApprovedRobinson && (
                  <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                    <p className="text-[11px] text-amber-300 flex items-center gap-1">
                      Aprobado internamente. Esperando confirmación comercial del cliente.
                    </p>
                    <button
                      onClick={() => handleClientAcceptance(change.id)}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registrar Aceptación del Cliente
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
