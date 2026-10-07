'use client';

import { useState, useEffect } from 'react';
import { Lead, Activity, Task, LeadStatus } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import { convertLeadToClientAction } from '@/app/actions/clients';
import { getLeadActivitiesAction, createActivityAction } from '@/app/actions/activities';
import { getLeadTasksAction, createTaskAction, updateTaskStatusAction } from '@/app/actions/tasks';
import { recordLostOpportunityAction } from '@/app/actions/retention-referrals';
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
  ArrowRight,
  Phone,
  Mail,
  Building2,
  Clock,
  CheckSquare,
  Plus,
  MessageSquare,
  Tag,
  UserX
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface LeadDetailSheetProps {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => void;
}

export function LeadDetailSheet({ lead, onClose, onLeadUpdated }: LeadDetailSheetProps) {
  const supabase = createClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'info' | 'actividades' | 'tareas' | 'bitacora'>('info');
  const [logText, setLogText] = useState(lead?.interaction_log || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Actividades
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'WhatsApp' as any,
    summary: '',
    result: '',
    next_step: '',
  });

  // Tareas
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Oportunidad Perdida (Fase E)
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState('Precio fuera de presupuesto');
  const [competitor, setCompetitor] = useState('');
  const [mainObjection, setMainObjection] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [reactivationDate, setReactivationDate] = useState('');
  const [doNotContact, setDoNotContact] = useState(false);
  const [isSavingLoss, setIsSavingLoss] = useState(false);

  useEffect(() => {
    if (lead) {
      setLogText(lead.interaction_log);
      setStatusMessage(null);
      loadActivities(lead.id);
      loadTasks(lead.id);
    }
  }, [lead]);

  const loadActivities = async (leadId: string) => {
    setLoadingActivities(true);
    const acts = await getLeadActivitiesAction(leadId);
    setActivities(acts);
    setLoadingActivities(false);
  };

  const loadTasks = async (leadId: string) => {
    setLoadingTasks(true);
    const ts = await getLeadTasksAction(leadId);
    setTasks(ts);
    setLoadingTasks(false);
  };

  if (!lead) return null;

  const alreadyConverted = !!lead.client_id;
  const eligibleForConversion = 
    lead.status === 'Cerrado-Ganado' ||
    lead.status === 'Propuesta' ||
    lead.status === 'Negociación' ||
    lead.status === 'Aprobado';

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
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar la bitácora' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (!lead || newStatus === lead.status) return;
    
    setIsChangingStatus(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', lead.id);

      if (error) throw new Error(error.message);

      const updatedLead: Lead = { ...lead, status: newStatus };
      onLeadUpdated(updatedLead);
      setStatusMessage({ type: 'success', text: 'Estado actualizado correctamente' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar estado' });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivity.summary.trim()) return;

    const res = await createActivityAction({
      lead_id: lead.id,
      activity_type: newActivity.activity_type,
      summary: newActivity.summary,
      result: newActivity.result || null,
      next_step: newActivity.next_step || null,
    });

    if (res.success && res.activity) {
      setActivities(prev => [res.activity as Activity, ...prev]);
      setNewActivity({ activity_type: 'WhatsApp', summary: '', result: '', next_step: '' });
      setStatusMessage({ type: 'success', text: 'Actividad registrada en el seguimiento' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const res = await createTaskAction({
      lead_id: lead.id,
      title: newTaskTitle.trim(),
      category: 'Comercial',
      priority: 'Media',
    });

    if (res.success && res.task) {
      setTasks(prev => [res.task as Task, ...prev]);
      setNewTaskTitle('');
    }
  };

  const handleConvertToClient = async () => {
    if (!confirm(`¿Confirmas convertir a "${lead.company_name}" en cliente formal de RSD Solutions?`)) return;

    setIsConverting(true);
    setStatusMessage(null);

    try {
      const clientId = await convertLeadToClientAction(lead.id);
      setStatusMessage({ type: 'success', text: '✅ Lead convertido a cliente correctamente. Redirigiendo...' });
      
      const updatedLead: Lead = { 
        ...lead, 
        status: 'Convertido',
        client_id: clientId,
        converted_at: new Date().toISOString(),
      };
      onLeadUpdated(updatedLead);

      setTimeout(() => {
        onClose();
        router.push(`/clientes/${clientId}`);
      }, 1200);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al convertir el lead' });
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeclareLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLoss(true);
    try {
      const res = await recordLostOpportunityAction({
        lead_id: lead.id,
        loss_reason: lossReason,
        stage_lost: lead.status,
        competitor_chosen: competitor,
        main_objection: mainObjection,
        price_or_scope_reason: priceReason,
        next_reactivation_date: reactivationDate || undefined,
        do_not_contact: doNotContact,
      });
      if (res.success) {
        const updatedLead: Lead = { ...lead, status: 'Perdido' };
        onLeadUpdated(updatedLead);
        setShowLossModal(false);
        onClose();
      } else {
        alert('Error: ' + res.error);
      }
    } finally {
      setIsSavingLoss(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  Ficha del Prospecto
                </span>
                {lead.priority && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    lead.priority === 'Alta' ? 'bg-rose-500/20 text-rose-300' :
                    lead.priority === 'Media' ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {lead.priority}
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5 truncate max-w-[340px]">
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

          {/* Modal de Declaración de Oportunidad Perdida */}
          {showLossModal && (
            <div className="p-5 bg-rose-950/20 border-b border-rose-500/30">
              <form onSubmit={handleDeclareLoss} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <UserX className="w-4 h-4" /> Declarar Oportunidad Perdida
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowLossModal(false)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Motivo Principal *</label>
                    <select
                      value={lossReason}
                      onChange={e => setLossReason(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option value="Precio fuera de presupuesto">Precio fuera de presupuesto</option>
                      <option value="Eligió otra alternativa / competidor">Eligió otra alternativa</option>
                      <option value="Proyecto cancelado internamente">Proyecto cancelado internamente</option>
                      <option value="No responde / Incontactable">No responde / Incontactable</option>
                      <option value="No viable técnicamente">No viable técnicamente</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Competidor / Alternativa</label>
                    <input
                      type="text"
                      value={competitor}
                      onChange={e => setCompetitor(e.target.value)}
                      placeholder="Ej. Software enlatado / Excel"
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Objeción o Justificación Detallada</label>
                    <input
                      type="text"
                      value={mainObjection}
                      onChange={e => setMainObjection(e.target.value)}
                      placeholder="Ej. Presupuesto disponible era de $500 y requerían app nativa..."
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold">Fecha para Reactivar</label>
                    <input
                      type="date"
                      value={reactivationDate}
                      onChange={e => setReactivationDate(e.target.value)}
                      className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="doNotContact"
                      checked={doNotContact}
                      onChange={e => setDoNotContact(e.target.checked)}
                      className="rounded border-slate-700 text-rose-600 focus:ring-rose-500"
                    />
                    <label htmlFor="doNotContact" className="text-xs text-rose-300 font-semibold cursor-pointer">
                      Solicitud expresa de No Contacto
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLossModal(false)}
                    className="px-3 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLoss}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {isSavingLoss && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Confirmar Pérdida
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Selector de pestañas */}
          <div className="flex border-b border-slate-800 bg-slate-950/80 text-xs">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'info' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              General
            </button>
            <button
              onClick={() => setActiveTab('actividades')}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'actividades' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Actividades ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('tareas')}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'tareas' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Tareas ({tasks.filter(t => t.status !== 'Completada').length})
            </button>
            <button
              onClick={() => setActiveTab('bitacora')}
              className={`flex-1 py-2.5 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'bitacora' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Bitácora
            </button>
          </div>

          {/* Contenido */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
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

            {/* PESTAÑA 1: INFO GENERAL */}
            {activeTab === 'info' && (
              <div className="space-y-4 text-xs">
                {/* Cambiar Estado / Ubicación en Kanban */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                      Ubicación en el Tablero Kanban
                      {isChangingStatus && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                    </label>
                    <select
                      value={lead.status}
                      disabled={isChangingStatus}
                      onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white disabled:opacity-50"
                    >
                      <option value="Nuevo">Nuevo</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Diagnóstico">Diagnóstico</option>
                      <option value="Demo">Demo</option>
                      <option value="Feedback Demo">Feedback Demo</option>
                      <option value="Propuesta">Propuesta</option>
                      <option value="Negociación">Negociación</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Convertido">Convertido</option>
                      <option value="Cerrado-Perdido">Cerrado-Perdido</option>
                    </select>
                  </div>
                </div>

                {/* Contacto directo */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                      <User className="w-3.5 h-3.5 text-indigo-400" /> Contacto Principal
                    </span>
                    <span className="text-white font-bold">{lead.contact_name}</span>
                  </div>

                  {lead.contact_role && (
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Cargo / Rol:</span>
                      <span className="text-slate-200">{lead.contact_role}</span>
                    </div>
                  )}

                  {lead.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-indigo-400" /> Teléfono
                      </span>
                      <a href={`tel:${lead.phone}`} className="text-indigo-400 hover:underline font-mono">
                        {lead.phone}
                      </a>
                    </div>
                  )}

                  {lead.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo
                      </span>
                      <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                  )}
                </div>

                {/* Negocio y requerimiento */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Nicho Empresarial:</span>
                    <span className="text-slate-200 font-semibold">{lead.niche || 'No especificado'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Solución:</span>
                    <span className="text-indigo-300 font-semibold">{lead.software_type}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Método Actual:</span>
                    <span className="text-slate-300">{lead.current_management_method || 'Excel'}</span>
                  </div>

                  {lead.team_size && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tamaño Equipo:</span>
                      <span className="text-slate-300">{lead.team_size}</span>
                    </div>
                  )}

                  {lead.reference_budget && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Presupuesto Referencial:</span>
                      <span className="text-emerald-400 font-medium">{lead.reference_budget}</span>
                    </div>
                  )}
                </div>

                {/* Próxima Acción Comercial */}
                <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                    Próximo Paso & Seguimiento
                  </span>
                  <p className="text-slate-200 font-medium text-xs">
                    {lead.next_action || 'Contactar para diagnóstico'}
                  </p>
                  {lead.next_followup_date && (
                    <div className="text-[11px] text-indigo-300 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5" />
                      Fecha: {format(parseISO(lead.next_followup_date), "d 'de' MMMM, HH:mm 'hrs'", { locale: es })}
                    </div>
                  )}
                </div>

                {/* Botón de Agendar en Agenda de Robinson */}
                <div className="pt-2">
                  <Link
                    href="/agenda"
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    Abrir Agenda y Reservar con Robinson
                  </Link>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: ACTIVIDADES Y SEGUIMIENTO */}
            {activeTab === 'actividades' && (
              <div className="space-y-4">
                {/* Formulario rápido de actividad */}
                <form onSubmit={handleAddActivity} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5 text-xs">
                  <span className="font-bold text-white block">Registrar Seguimiento</span>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newActivity.activity_type}
                      onChange={e => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                      className="col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Llamada">Llamada</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Correo">Correo</option>
                      <option value="Diagnóstico">Diagnóstico</option>
                      <option value="Nota interna">Nota interna</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Resumen de la conversación..."
                      value={newActivity.summary}
                      onChange={e => setNewActivity({ ...newActivity, summary: e.target.value })}
                      className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Resultado obtenido..."
                      value={newActivity.result}
                      onChange={e => setNewActivity({ ...newActivity, result: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                    />
                    <input
                      type="text"
                      placeholder="Próximo paso acordado..."
                      value={newActivity.next_step}
                      onChange={e => setNewActivity({ ...newActivity, next_step: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white placeholder-slate-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                    >
                      + Añadir Actividad
                    </button>
                  </div>
                </form>

                {/* Línea de tiempo de actividades */}
                <div className="space-y-2.5">
                  {loadingActivities ? (
                    <div className="py-6 text-center text-xs text-slate-500">Cargando actividades...</div>
                  ) : activities.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">Sin actividades registradas aún.</div>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                            <Tag className="w-3 h-3" /> {act.activity_type}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {format(parseISO(act.activity_date), 'd MMM yyyy, HH:mm', { locale: es })}
                          </span>
                        </div>
                        <p className="text-white text-xs">{act.summary}</p>
                        {act.result && (
                          <p className="text-slate-400 text-[11px]"><span className="text-slate-500">Resultado:</span> {act.result}</p>
                        )}
                        {act.next_step && (
                          <p className="text-emerald-400 text-[11px]"><span className="text-slate-500">Próximo paso:</span> {act.next_step}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: TAREAS VINCULADAS */}
            {activeTab === 'tareas' && (
              <div className="space-y-4">
                {/* Formulario rápido de tarea */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva tarea para este prospecto..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    + Crear
                  </button>
                </form>

                {/* Lista de tareas */}
                <div className="space-y-2">
                  {loadingTasks ? (
                    <div className="py-6 text-center text-xs text-slate-500">Cargando tareas...</div>
                  ) : tasks.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">Sin tareas pendientes.</div>
                  ) : (
                    tasks.map(t => (
                      <div key={t.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={t.status === 'Completada'}
                            onChange={e => {
                              const newSt = e.target.checked ? 'Completada' : 'Pendiente';
                              setTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: newSt } : item));
                              updateTaskStatusAction(t.id, newSt);
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600"
                          />
                          <span className={`text-xs ${t.status === 'Completada' ? 'line-through text-slate-500' : 'text-white font-medium'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{t.priority}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: BITÁCORA EDITABLE */}
            {activeTab === 'bitacora' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Bitácora de Notas & Requerimientos
                </label>
                <textarea
                  rows={8}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Añade actualizaciones de la llamada o nuevos requerimientos..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveLog}
                    disabled={isSaving || logText === lead.interaction_log}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Bitácora
                  </button>
                </div>
              </div>
            )}

            {/* Conversión o Cierre de Oportunidad */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {!alreadyConverted && eligibleForConversion && (
                <button
                  onClick={handleConvertToClient}
                  disabled={isConverting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Convirtiendo...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Convertir a Cliente Formal
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {!alreadyConverted && lead.status !== 'Perdido' && (
                <button
                  onClick={() => setShowLossModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
                >
                  <UserX className="w-3.5 h-3.5" /> Declarar Oportunidad Perdida
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
