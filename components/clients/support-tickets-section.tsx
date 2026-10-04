'use client';

import { useState } from 'react';
import {
  SupportTicket,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/types/database.types';
import {
  createSupportTicketAction,
  updateSupportTicketStatusAction,
} from '@/app/actions/support';
import {
  LifeBuoy,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  FileQuestion,
} from 'lucide-react';

interface SupportTicketsSectionProps {
  clientId: string;
  tickets: SupportTicket[];
  projects?: { id: string; name: string }[];
}

export function SupportTicketsSection({
  clientId,
  tickets,
  projects = [],
}: SupportTicketsSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [requesterName, setRequesterName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<SupportTicketCategory>('Error en sistema');
  const [priority, setPriority] = useState<SupportTicketPriority>('Media');
  const [impact, setImpact] = useState('Medio');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // Update states
  const [status, setStatus] = useState<SupportTicketStatus>('En diagnóstico');
  const [diagnosis, setDiagnosis] = useState('');
  const [solution, setSolution] = useState('');
  const [commercialNotes, setCommercialNotes] = useState('');
  const [clientConfirmed, setClientConfirmed] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requesterName.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await createSupportTicketAction({
        client_id: clientId,
        project_id: projectId || undefined,
        requester_name: requesterName,
        category,
        priority,
        impact,
        description,
        evidence_url: evidenceUrl,
      });
      if (res.success) {
        setRequesterName('');
        setProjectId('');
        setDescription('');
        setEvidenceUrl('');
        setShowAddForm(false);
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (ticketId: string) => {
    setIsSubmitting(true);
    try {
      const res = await updateSupportTicketStatusAction({
        ticket_id: ticketId,
        client_id: clientId,
        status,
        diagnosis,
        solution,
        commercial_followup_notes: commercialNotes,
        client_confirmed: clientConfirmed,
      });
      if (res.success) {
        setEditingTicketId(null);
        setDiagnosis('');
        setSolution('');
        setCommercialNotes('');
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
              <LifeBuoy className="w-4 h-4 text-rose-400" /> Mesa de Ayuda, Soporte e Incidencias
            </h3>
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
              {tickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Resuelto').length} Activas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión técnica y seguimiento comercial continuo para todas las incidencias reportadas por el cliente.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo Ticket
        </button>
      </div>

      {/* Formulario Nuevo Ticket */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400">Registrar Incidencia / Ticket de Soporte</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Solicitante (Nombre / Cargo) *</label>
              <input
                type="text"
                required
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                placeholder="Ej. Ing. Sofía Morales (Gerente)"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Categoría *</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Error en sistema">Error en sistema (Bug)</option>
                <option value="Fallo de acceso">Fallo de acceso / Bloqueo</option>
                <option value="Consulta técnica">Consulta técnica / Duda</option>
                <option value="Solicitud de mejora">Solicitud de mejora</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Prioridad *</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica (Operación detenida)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">Impacto Operativo</label>
              <input
                type="text"
                value={impact}
                onChange={e => setImpact(e.target.value)}
                placeholder="Ej. No se pueden registrar pagos en sucursal norte"
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 uppercase font-semibold">URL Evidencia / Captura</label>
              <input
                type="url"
                value={evidenceUrl}
                onChange={e => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold">Descripción del Problema *</label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalle exacto del error, mensaje mostrado y pasos para reproducirlo..."
              className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
            />
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
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Crear Ticket
            </button>
          </div>
        </form>
      )}

      {/* Lista de Tickets */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl">
          <LifeBuoy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No hay tickets de soporte registrados para este cliente.</p>
          <p className="text-[11px] text-slate-500 mt-1">El cliente no presenta incidencias abiertas actualmente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => {
            const isResolved = ticket.status === 'Resuelto' || ticket.status === 'Cerrado';
            const isCritical = ticket.priority === 'Crítica';

            return (
              <div
                key={ticket.id}
                className={`bg-slate-900 border rounded-2xl p-5 space-y-3 transition ${
                  isResolved
                    ? 'border-emerald-500/20 bg-emerald-950/5'
                    : isCritical
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded">
                      {ticket.ticket_code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isCritical
                          ? 'bg-red-500/20 text-red-400'
                          : ticket.priority === 'Alta'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Prioridad: {ticket.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {ticket.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isResolved ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {ticket.status}
                    </span>
                    <button
                      onClick={() => {
                        setEditingTicketId(ticket.id);
                        setStatus(ticket.status);
                        setDiagnosis(ticket.diagnosis || '');
                        setSolution(ticket.solution || '');
                        setCommercialNotes(ticket.commercial_followup_notes || '');
                        setClientConfirmed(ticket.client_confirmed);
                      }}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                    >
                      Actualizar Estado
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white">{ticket.description}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    <strong className="text-slate-500">Reportado por:</strong> {ticket.requester_name} •{' '}
                    <strong className="text-slate-500">Impacto:</strong> {ticket.impact}
                  </p>
                </div>

                {ticket.solution && (
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700 text-xs">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Solución Aplicada:
                    </p>
                    <p className="text-slate-200 mt-1">{ticket.solution}</p>
                    {ticket.diagnosis && (
                      <p className="text-[11px] text-slate-400 mt-1">
                        <strong className="text-slate-500">Causa raíz:</strong> {ticket.diagnosis}
                      </p>
                    )}
                  </div>
                )}

                {ticket.commercial_followup_notes && (
                  <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-xl p-3 text-xs">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> Seguimiento Comercial del Asesor:
                    </p>
                    <p className="text-slate-300 mt-1 text-[11px]">{ticket.commercial_followup_notes}</p>
                  </div>
                )}

                {/* Formulario de resolución / actualización */}
                {editingTicketId === ticket.id && (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mt-3 space-y-3">
                    <h5 className="text-[11px] font-bold text-rose-300 uppercase">Actualizar Incidencia & Seguimiento</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Estado del Ticket</label>
                        <select
                          value={status}
                          onChange={e => setStatus(e.target.value as any)}
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        >
                          <option value="Abierto">Abierto</option>
                          <option value="En diagnóstico">En diagnóstico</option>
                          <option value="En resolución">En resolución</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400">Diagnóstico / Causa Raíz</label>
                        <input
                          type="text"
                          value={diagnosis}
                          onChange={e => setDiagnosis(e.target.value)}
                          placeholder="Ej. Error de formato en fecha enviado al backend"
                          className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-400">Solución Aplicada</label>
                      <textarea
                        rows={2}
                        value={solution}
                        onChange={e => setSolution(e.target.value)}
                        placeholder="Descripción técnica del fix o workaround entregado..."
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-indigo-400">
                        Seguimiento Comercial (Asesor)
                      </label>
                      <input
                        type="text"
                        value={commercialNotes}
                        onChange={e => setCommercialNotes(e.target.value)}
                        placeholder="Llamada de satisfacción realizada, cliente conforme con la respuesta..."
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`confirm-${ticket.id}`}
                        checked={clientConfirmed}
                        onChange={e => setClientConfirmed(e.target.checked)}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                      />
                      <label htmlFor={`confirm-${ticket.id}`} className="text-xs text-slate-300 cursor-pointer">
                        El cliente confirmó resolución satisfactoria
                      </label>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingTicketId(null)}
                        className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleUpdate(ticket.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                      >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Guardar
                      </button>
                    </div>
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
