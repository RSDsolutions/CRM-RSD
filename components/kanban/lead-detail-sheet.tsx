'use client';

import { useState, useEffect } from 'react';
import { Lead, Activity, Task } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import { convertLeadToClientAction } from '@/app/actions/clients';
import { getLeadActivitiesAction, createActivityAction } from '@/app/actions/activities';
import { getLeadTasksAction, createTaskAction, updateTaskStatusAction } from '@/app/actions/tasks';
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
  Tag
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

            {/* Conversión a Cliente (Fijo abajo si es elegible) */}
            {!alreadyConverted && eligibleForConversion && (
              <div className="pt-4 border-t border-slate-800">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
