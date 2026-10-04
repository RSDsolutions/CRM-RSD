'use client';

import { useState } from 'react';
import { TrainingSession } from '@/types/database.types';
import { recordTrainingSessionAction } from '@/app/actions/training';
import {
  GraduationCap,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  Users,
  BookOpen,
} from 'lucide-react';

interface TrainingSectionProps {
  projectId: string;
  clientId: string;
  sessions: TrainingSession[];
  isLocked?: boolean;
}

export function TrainingSection({
  projectId,
  clientId,
  sessions,
  isLocked,
}: TrainingSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [sessionDate, setSessionDate] = useState('');
  const [modality, setModality] = useState<'Virtual' | 'Presencial'>('Virtual');
  const [attendees, setAttendees] = useState('');
  const [topicsCovered, setTopicsCovered] = useState('');
  const [deliveredMaterials, setDeliveredMaterials] = useState('');
  const [clientQuestions, setClientQuestions] = useState('');
  const [pendingItems, setPendingItems] = useState('');
  const [clientConfirmed, setClientConfirmed] = useState(true);
  const [confirmationNotes, setConfirmationNotes] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionDate || !attendees.trim() || !topicsCovered.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await recordTrainingSessionAction({
        project_id: projectId,
        client_id: clientId,
        session_date: sessionDate,
        modality,
        attendees,
        topics_covered: topicsCovered,
        delivered_materials: deliveredMaterials,
        client_questions: clientQuestions,
        pending_items: pendingItems,
        client_confirmed: clientConfirmed,
        confirmation_notes: confirmationNotes,
      });
      if (res.success) {
        setSessionDate('');
        setAttendees('');
        setTopicsCovered('');
        setDeliveredMaterials('');
        setClientQuestions('');
        setPendingItems('');
        setConfirmationNotes('');
        setShowAddForm(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-emerald-400" /> Capacitaciones & Transferencia de Conocimiento
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {sessions.length} Sesiones Realizadas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Registro formal de inducción a los usuarios finales para garantizar la adopción exitosa del sistema.
          </p>
        </div>

        {!isLocked && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Capacitación
          </button>
        )}
      </div>

      {/* Formulario nueva capacitación */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Registrar Sesión de Capacitación</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Fecha y Hora *</label>
              <input
                type="datetime-local"
                required
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Modalidad *</label>
              <select
                value={modality}
                onChange={e => setModality(e.target.value as any)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Virtual">Virtual (Google Meet / Zoom)</option>
                <option value="Presencial">Presencial (Oficinas del cliente / RSD)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Participantes / Asistentes *</label>
              <input
                type="text"
                required
                value={attendees}
                onChange={e => setAttendees(e.target.value)}
                placeholder="Ej. Ing. Carlos Pérez, Dra. Laura Gómez (3 personas)"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Temas Cubiertos / Módulos Explicados *</label>
            <textarea
              required
              rows={2}
              value={topicsCovered}
              onChange={e => setTopicsCovered(e.target.value)}
              placeholder="Flujo de ventas, emisión de comprobantes, roles de usuario y permisos..."
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Material Entregado</label>
              <input
                type="text"
                value={deliveredMaterials}
                onChange={e => setDeliveredMaterials(e.target.value)}
                placeholder="Manual de usuario PDF, video tutorial Loom, credenciales"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Dudas o Preguntas Frecuentes del Cliente</label>
              <input
                type="text"
                value={clientQuestions}
                onChange={e => setClientQuestions(e.target.value)}
                placeholder="Consulta sobre exportación a Excel y respaldos"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs text-white cursor-pointer">
              <input
                type="checkbox"
                checked={clientConfirmed}
                onChange={e => setClientConfirmed(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold">El cliente confirmó conformidad con la capacitación</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar Capacitación
            </button>
          </div>
        </form>
      )}

      {/* Lista de Capacitaciones */}
      {sessions.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay sesiones de capacitación registradas.</p>
          <p className="text-[11px] text-slate-500 mt-1">Registra la sesión de inducción al entregar los accesos del sistema.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {s.modality}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {new Date(s.session_date).toLocaleString()}
                  </span>
                </div>
                {s.client_confirmed && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Conformidad Registrada
                  </span>
                )}
              </div>

              <div className="text-xs space-y-2">
                <p className="text-slate-300">
                  <strong className="text-slate-500 uppercase text-[10px] block">Temas Cubiertos:</strong>
                  {s.topics_covered}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-800/40 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold flex items-center gap-1">
                      <Users className="w-3 h-3" /> Participantes:
                    </span>
                    <span className="text-slate-300">{s.attendees}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Material Entregado:
                    </span>
                    <span className="text-slate-300">{s.delivered_materials || 'Ninguno registrado'}</span>
                  </div>
                </div>
                {s.client_questions && (
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-500">Dudas resueltas:</strong> {s.client_questions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
