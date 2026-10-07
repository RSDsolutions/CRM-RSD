'use client';

import { useState, useEffect } from 'react';
import { Lead, Activity, Task, LeadStatus, BUSINESS_NICHES, BusinessNiche, SoftwareType } from '@/types/database.types';
import { createClient } from '@/utils/supabase/client';
import { convertLeadToClientAction } from '@/app/actions/clients';
import { getLeadActivitiesAction, createActivityAction } from '@/app/actions/activities';
import { getLeadTasksAction, createTaskAction, updateTaskStatusAction } from '@/app/actions/tasks';
import { recordLostOpportunityAction } from '@/app/actions/retention-referrals';
import { getCompanyDNAAction, saveCompanyDNAAction } from '@/app/actions/dna';
import { updateLeadDetailsAction, getComercialAdvisorsAction } from '@/app/actions/leads';
import { CompanyDNA } from '@/types/database.types';
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
  UserX,
  Dna,
  Wand2,
  CalendarCheck,
  Send,
  Sparkles,
  Briefcase,
  Pencil,
  Globe,
  MapPin,
  MessageCircle,
  ExternalLink
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
  
  const [activeTab, setActiveTab] = useState<'info' | 'dna' | 'actividades' | 'tareas' | 'bitacora'>('info');
  const [logText, setLogText] = useState(lead?.interaction_log || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modo Edición de Información del Prospecto/Cliente
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  const [advisors, setAdvisors] = useState<string[]>([]);
  const [infoForm, setInfoForm] = useState<Partial<Lead>>({});

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

  // Oportunidad Perdida
  const [showLossModal, setShowLossModal] = useState(false);
  const [lossReason, setLossReason] = useState('Precio fuera de presupuesto');
  const [competitor, setCompetitor] = useState('');
  const [mainObjection, setMainObjection] = useState('');
  const [priceReason, setPriceReason] = useState('');
  const [reactivationDate, setReactivationDate] = useState('');
  const [doNotContact, setDoNotContact] = useState(false);
  const [isSavingLoss, setIsSavingLoss] = useState(false);

  // DNA
  const [dna, setDna] = useState<Partial<CompanyDNA> | null>(null);
  const [loadingDna, setLoadingDna] = useState(false);
  const [savingDna, setSavingDna] = useState(false);

  useEffect(() => {
    if (lead) {
      setLogText(lead.interaction_log);
      setStatusMessage(null);
      setIsEditingInfo(false);
      setInfoForm({
        company_name: lead.company_name,
        legal_name: lead.legal_name || '',
        tax_id: lead.tax_id || '',
        niche: lead.niche || 'Distribuidora / mayorista',
        city: lead.city || '',
        province: lead.province || '',
        website: lead.website || '',
        social_media: lead.social_media || '',
        contact_name: lead.contact_name,
        contact_role: lead.contact_role || '',
        phone: lead.phone || '',
        email: lead.email || '',
        contact_preference: lead.contact_preference || 'WhatsApp',
        software_type: lead.software_type,
        current_management_method: lead.current_management_method || 'Excel',
        team_size: lead.team_size || '',
        reference_budget: lead.reference_budget || '',
        main_need: lead.main_need || '',
        problem_description: lead.problem_description || '',
        assigned_to: lead.assigned_to,
        priority: lead.priority || 'Media',
        next_action: lead.next_action || '',
        next_followup_date: lead.next_followup_date ? lead.next_followup_date.slice(0, 16) : '',
      });
      loadActivities(lead.id);
      loadTasks(lead.id);
      loadDna(lead.id);
      loadAdvisors();
    }
  }, [lead]);

  const loadAdvisors = async () => {
    const res = await getComercialAdvisorsAction();
    if (res.success && res.advisors) {
      setAdvisors(res.advisors);
    }
  };

  const loadDna = async (leadId: string) => {
    setLoadingDna(true);
    const data = await getCompanyDNAAction(leadId);
    if (data) {
      setDna(data);
    } else {
      setDna({
        lead_id: leadId,
        business_name: lead?.company_name || '',
        industry_niche: typeof lead?.niche === 'string' ? lead.niche : '',
        identified_pain_points: lead?.problem_description || lead?.main_need || '',
        current_tools: lead?.current_management_method || '',
      });
    }
    setLoadingDna(false);
  };

  const generateAIContext = () => {
    if (!dna) return;
    const prompt = `🎯 CONTEXTO DEL CLIENTE (DNA):
- Nombre del Negocio: ${dna.business_name || lead?.company_name || 'No especificado'}
- Nicho / Industria: ${dna.industry_niche || lead?.niche || 'No especificado'}
- Tamaño de Equipo: ${lead?.team_size || 'No especificado'}

📋 RESUMEN DEL NEGOCIO:
${dna.business_overview || 'No especificado'}

⚠️ DOLORES Y PROBLEMAS PRINCIPALES:
${dna.identified_pain_points || lead?.problem_description || lead?.main_need || 'No especificado'}

🛠️ HERRAMIENTAS ACTUALES Y FLUJO:
- Herramientas Actuales: ${dna.current_tools || lead?.current_management_method || 'No especificado'}
- Flujo Operativo Actual: ${dna.operational_flow || 'No especificado'}

✨ SOLUCIÓN ESPERADA:
- Tipo de Software: ${lead?.software_type || 'No especificado'}
- Módulos Deseados: ${dna.desired_modules || 'No especificado'}
- Presupuesto Referencial: ${lead?.reference_budget || 'No especificado'}`;

    setDna(prev => prev ? { ...prev, consolidated_context: prompt } : null);
  };

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

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;
    if (!infoForm.company_name?.trim() || !infoForm.contact_name?.trim()) {
      setStatusMessage({ type: 'error', text: 'El nombre de empresa y del contacto son obligatorios' });
      return;
    }

    setIsSavingInfo(true);
    setStatusMessage(null);

    try {
      const payload: Partial<Lead> = {
        company_name: infoForm.company_name?.trim(),
        legal_name: infoForm.legal_name?.trim() || null,
        tax_id: infoForm.tax_id?.trim() || null,
        niche: infoForm.niche,
        city: infoForm.city?.trim() || null,
        province: infoForm.province?.trim() || null,
        website: infoForm.website?.trim() || null,
        social_media: infoForm.social_media?.trim() || null,
        contact_name: infoForm.contact_name?.trim(),
        contact_role: infoForm.contact_role?.trim() || null,
        phone: infoForm.phone?.trim() || null,
        email: infoForm.email?.trim() || null,
        contact_preference: infoForm.contact_preference,
        software_type: infoForm.software_type,
        current_management_method: infoForm.current_management_method,
        team_size: infoForm.team_size?.trim() || null,
        reference_budget: infoForm.reference_budget?.trim() || null,
        main_need: infoForm.main_need?.trim() || null,
        problem_description: infoForm.problem_description?.trim() || null,
        assigned_to: infoForm.assigned_to?.trim(),
        priority: infoForm.priority,
        next_action: infoForm.next_action?.trim(),
        next_followup_date: infoForm.next_followup_date ? new Date(infoForm.next_followup_date).toISOString() : null,
      };

      const res = await updateLeadDetailsAction(lead.id, payload);
      if (!res.success || !res.lead) {
        throw new Error(res.error || 'Error al actualizar los datos del cliente/prospecto');
      }

      onLeadUpdated(res.lead);
      setStatusMessage({ type: 'success', text: '✅ Ficha comercial del cliente actualizada correctamente.' });
      setIsEditingInfo(false);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar los cambios' });
    } finally {
      setIsSavingInfo(false);
    }
  };

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

  const handleSaveDna = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dna) return;
    setSavingDna(true);
    setStatusMessage(null);
    const res = await saveCompanyDNAAction(dna);
    if (res.success && res.dna) {
      setDna(res.dna);
      setStatusMessage({ type: 'success', text: 'DNA del Cliente guardado correctamente.' });
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Error al guardar el DNA.' });
    }
    setSavingDna(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          
          {/* ─── HEADER: CENTRAL DE OPERACIONES DEL LEAD ─── */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/70">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Central de Operaciones
                  </span>
                  {lead.priority && (
                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase border ${
                      lead.priority === 'Alta' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                      lead.priority === 'Media' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      Prioridad {lead.priority}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400 font-medium">
                    Asignado: <strong className="text-white">{lead.assigned_to}</strong>
                  </span>
                </div>
                <h2 className="text-xl font-black text-white tracking-tight truncate">
                  {lead.company_name}
                </h2>
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lead.contact_name}</span>
                  {lead.contact_role && <span className="text-slate-500">({lead.contact_role})</span>}
                </p>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
                title="Cerrar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
              <Link
                href="/agenda"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Agendar Cita
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab('actividades')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                + Actividad
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tareas')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                + Tarea
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dna')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold whitespace-nowrap transition-colors"
              >
                <Dna className="w-3.5 h-3.5" />
                Client DNA
              </button>
            </div>
          </div>

          {/* Modal de Declaración de Oportunidad Perdida */}
          {showLossModal && (
            <div className="p-5 bg-rose-950/25 border-b border-rose-500/30">
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

          {/* ─── TABS DE NAVEGACIÓN ─── */}
          <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/80 text-xs no-scrollbar">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 whitespace-nowrap text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'info' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Resumen
            </button>
            <button
              onClick={() => setActiveTab('dna')}
              className={`px-4 py-3 whitespace-nowrap text-center font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'dna' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Dna className="w-3.5 h-3.5" /> Client DNA
            </button>
            <button
              onClick={() => setActiveTab('actividades')}
              className={`px-4 py-3 whitespace-nowrap text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'actividades' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Actividades ({activities.length})
            </button>
            <button
              onClick={() => setActiveTab('tareas')}
              className={`px-4 py-3 whitespace-nowrap text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'tareas' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Tareas ({tasks.filter(t => t.status !== 'Completada').length})
            </button>
            <button
              onClick={() => setActiveTab('bitacora')}
              className={`px-4 py-3 whitespace-nowrap text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'bitacora' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              Bitácora
            </button>
          </div>

          {/* ─── CONTENIDO DE PESTAÑAS ─── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {statusMessage && (
              <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
                statusMessage.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* PESTAÑA 1: RESUMEN GENERAL & EDICIÓN COMERCIAL */}
            {activeTab === 'info' && (
              <div className="space-y-4 text-xs">
                {/* Header de la Ficha con botón de Editar */}
                <div className="flex items-center justify-between pb-1">
                  <div>
                    <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      Ficha Comercial del Prospecto
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {isEditingInfo 
                        ? 'Actualiza los datos según los nuevos requerimientos descubiertos.'
                        : 'Información inicial y progreso de calificación de la venta.'}
                    </p>
                  </div>
                  {!isEditingInfo ? (
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Ficha</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditingInfo(false)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-[11px] font-medium transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>

                {isEditingInfo ? (
                  /* ─── FORMULARIO DE EDICIÓN COMPLETA ─── */
                  <form onSubmit={handleSaveInfo} className="space-y-4">
                    {/* Sección 1: Datos de la Empresa */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wider">1. Empresa & Negocio</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Nombre Comercial de la Empresa *</label>
                          <input
                            type="text"
                            required
                            value={infoForm.company_name || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, company_name: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Ej. Distribuidora del Pacífico S.A."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Razón Social (Legal)</label>
                          <input
                            type="text"
                            value={infoForm.legal_name || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, legal_name: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Ej. Dispacif Cía. Ltda."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">RUC / Cédula</label>
                          <input
                            type="text"
                            value={infoForm.tax_id || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, tax_id: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                            placeholder="0992345678001"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Nicho Empresarial</label>
                          <select
                            value={infoForm.niche || 'Distribuidora / mayorista'}
                            onChange={e => setInfoForm(prev => ({ ...prev, niche: e.target.value as BusinessNiche }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            {BUSINESS_NICHES.map(n => (
                              <option key={n} value={n}>{n}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Ciudad</label>
                          <input
                            type="text"
                            value={infoForm.city || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, city: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Ej. Guayaquil"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Sitio Web</label>
                          <input
                            type="url"
                            value={infoForm.website || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="https://empresa.com"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Redes Sociales / Perfil</label>
                          <input
                            type="text"
                            value={infoForm.social_media || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, social_media: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="@empresa_ec"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 2: Contacto Decisor */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80">
                        <User className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wider">2. Contacto Directo</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Nombre del Decisor *</label>
                          <input
                            type="text"
                            required
                            value={infoForm.contact_name || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, contact_name: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Ej. Ing. Carlos Mendoza"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Cargo / Rol</label>
                          <input
                            type="text"
                            value={infoForm.contact_role || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, contact_role: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Gerente General / Propietario"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Teléfono / WhatsApp Directo</label>
                          <input
                            type="text"
                            value={infoForm.phone || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                            placeholder="0991234567 / +593..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Correo Electrónico</label>
                          <input
                            type="email"
                            value={infoForm.email || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="gerencia@empresa.com"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Canal Preferido</label>
                          <select
                            value={infoForm.contact_preference || 'WhatsApp'}
                            onChange={e => setInfoForm(prev => ({ ...prev, contact_preference: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="WhatsApp">WhatsApp</option>
                            <option value="Llamada">Llamada Telefónica</option>
                            <option value="Correo">Correo Electrónico</option>
                            <option value="Reunión Virtual">Reunión Virtual (Meet)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Sección 3: Requerimiento de Software & Diagnóstico */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80">
                        <Laptop className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wider">3. Requerimiento & Diagnóstico</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Tipo de Software Previsto</label>
                          <select
                            value={infoForm.software_type || 'ERP/CRM'}
                            onChange={e => setInfoForm(prev => ({ ...prev, software_type: e.target.value as SoftwareType }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="ERP/CRM">ERP/CRM</option>
                            <option value="Web App">Web App</option>
                            <option value="Mobile App">Mobile App</option>
                            <option value="E-commerce">E-commerce</option>
                            <option value="Landing Page">Landing Page</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Método de Gestión Actual</label>
                          <input
                            type="text"
                            value={infoForm.current_management_method || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, current_management_method: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Excel, hojas de papel, software genérico..."
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Tamaño del Equipo / Usuarios</label>
                          <input
                            type="text"
                            value={infoForm.team_size || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, team_size: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="5 a 15 personas"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Presupuesto Referencial Estimado</label>
                          <input
                            type="text"
                            value={infoForm.reference_budget || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, reference_budget: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="$2,000 - $3,500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Necesidad Principal</label>
                          <input
                            type="text"
                            value={infoForm.main_need || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, main_need: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Control de stock en 2 sucursales y facturación automatizada"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Problema / Cuello de Botella Detallado</label>
                          <textarea
                            rows={3}
                            value={infoForm.problem_description || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, problem_description: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                            placeholder="Describe qué les duele hoy en la operación, tiempos perdidos o errores frecuentes..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sección 4: Gestión Comercial & Próximo Paso */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-800/80">
                        <UserCheck className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white text-xs uppercase tracking-wider">4. Gestión & Seguimiento</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Asesor Responsable</label>
                          {advisors.length > 0 ? (
                            <select
                              value={infoForm.assigned_to || ''}
                              onChange={e => setInfoForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            >
                              {advisors.map(adv => (
                                <option key={adv} value={adv}>{adv}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={infoForm.assigned_to || ''}
                              onChange={e => setInfoForm(prev => ({ ...prev, assigned_to: e.target.value }))}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Prioridad del Negocio</label>
                          <select
                            value={infoForm.priority || 'Media'}
                            onChange={e => setInfoForm(prev => ({ ...prev, priority: e.target.value as any }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                          >
                            <option value="Alta">Alta</option>
                            <option value="Media">Media</option>
                            <option value="Baja">Baja</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Próxima Acción Comercial</label>
                          <input
                            type="text"
                            value={infoForm.next_action || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, next_action: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                            placeholder="Llamar para confirmar asistencia a la demo técnica..."
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Fecha & Hora de Próximo Seguimiento</label>
                          <input
                            type="datetime-local"
                            value={infoForm.next_followup_date || ''}
                            onChange={e => setInfoForm(prev => ({ ...prev, next_followup_date: e.target.value }))}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Botones de acción del formulario */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setIsEditingInfo(false)}
                        className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingInfo}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
                      >
                        {isSavingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ─── MODO VISTA COMPLETO & ENRIQUECIDO ─── */
                  <div className="space-y-4">
                    {/* Cambiar Estado / Ubicación en Kanban */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-slate-400 uppercase font-semibold flex items-center justify-between">
                          <span>Etapa en Pipeline Kanban</span>
                          {isChangingStatus && <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />}
                        </label>
                        <select
                          value={lead.status}
                          disabled={isChangingStatus}
                          onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500 disabled:opacity-50 cursor-pointer"
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

                    {/* Datos de la Empresa */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" /> Empresa
                        </span>
                        <span className="text-white font-bold">{lead.company_name}</span>
                      </div>

                      {lead.legal_name && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Razón Social:</span>
                          <span className="text-slate-200">{lead.legal_name}</span>
                        </div>
                      )}

                      {lead.tax_id && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>RUC / Cédula:</span>
                          <span className="text-slate-200 font-mono">{lead.tax_id}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nicho Empresarial:</span>
                        <span className="text-slate-200 font-semibold">{lead.niche || 'No especificado'}</span>
                      </div>

                      {lead.city && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Ubicación:
                          </span>
                          <span className="text-slate-200">{lead.city}{lead.province ? `, ${lead.province}` : ''}</span>
                        </div>
                      )}

                      {lead.website && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Globe className="w-3.5 h-3.5 text-indigo-400" /> Web:
                          </span>
                          <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1">
                            {lead.website.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Contacto Directo */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
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
                            <Phone className="w-3.5 h-3.5 text-indigo-400" /> Teléfono:
                          </span>
                          <a href={`tel:${lead.phone}`} className="text-indigo-400 hover:underline font-mono">
                            {lead.phone}
                          </a>
                        </div>
                      )}

                      {lead.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Directo:
                          </span>
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:underline font-mono flex items-center gap-1"
                          >
                            {lead.phone}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {lead.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-indigo-400" /> Correo:
                          </span>
                          <a href={`mailto:${lead.email}`} className="text-indigo-400 hover:underline truncate max-w-[200px]">
                            {lead.email}
                          </a>
                        </div>
                      )}

                      {lead.contact_preference && (
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Preferencia de Contacto:</span>
                          <span className="text-slate-300 font-medium">{lead.contact_preference}</span>
                        </div>
                      )}
                    </div>

                    {/* Diagnóstico & Requerimiento de Software */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <Laptop className="w-3.5 h-3.5 text-indigo-400" /> Solución Prevista
                        </span>
                        <span className="text-indigo-300 font-bold">{lead.software_type}</span>
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
                          <span className="text-emerald-400 font-semibold">{lead.reference_budget}</span>
                        </div>
                      )}

                      {lead.main_need && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                            Necesidad Principal:
                          </span>
                          <p className="text-slate-200">{lead.main_need}</p>
                        </div>
                      )}

                      {lead.problem_description && (
                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-1">
                            Dolor / Cuello de Botella:
                          </span>
                          <p className="text-slate-300 leading-relaxed text-xs">{lead.problem_description}</p>
                        </div>
                      )}
                    </div>

                    {/* Próxima Acción Comercial & Asignación */}
                    <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1.5">
                          <Clock className="w-3 h-3" /> Próximo Paso Comercial
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Asesor: <strong className="text-white">{lead.assigned_to}</strong>
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium text-xs leading-relaxed">
                        {lead.next_action || 'Contactar para agendar diagnóstico gratuito'}
                      </p>
                      {lead.next_followup_date && (
                        <div className="text-[11px] text-indigo-300 flex items-center gap-1.5 mt-1 pt-2 border-t border-indigo-500/20">
                          <span>Fecha programada:</span>
                          <strong>{format(parseISO(lead.next_followup_date), "d 'de' MMMM, HH:mm 'hrs'", { locale: es })}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 2: CLIENT DNA */}
            {activeTab === 'dna' && (
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-emerald-400 font-bold flex items-center gap-2">
                      <Dna className="w-4 h-4" /> DNA Estratégico del Cliente
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                      Base de IA
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Captura el modelo de negocio, flujos y dolores para formular propuestas a medida y alimentar prompts de IA.
                  </p>
                </div>

                {loadingDna ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Cargando DNA estratégico...
                  </div>
                ) : (
                  <form onSubmit={handleSaveDna} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Nombre del Negocio</label>
                        <input
                          type="text"
                          value={dna?.business_name || ''}
                          onChange={e => setDna(prev => prev ? { ...prev, business_name: e.target.value } : null)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Nicho / Industria</label>
                        <input
                          type="text"
                          value={dna?.industry_niche || ''}
                          onChange={e => setDna(prev => prev ? { ...prev, industry_niche: e.target.value } : null)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Resumen del Negocio (A qué se dedican)</label>
                      <textarea
                        rows={2}
                        value={dna?.business_overview || ''}
                        onChange={e => setDna(prev => prev ? { ...prev, business_overview: e.target.value } : null)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Ej. Importadora de insumos médicos con 3 sucursales..."
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Dolores / Problemas Principales</label>
                      <textarea
                        rows={2}
                        value={dna?.identified_pain_points || ''}
                        onChange={e => setDna(prev => prev ? { ...prev, identified_pain_points: e.target.value } : null)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Ej. Pierden información en Excel, falta de sincronización multisede..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Herramientas Actuales</label>
                        <input
                          type="text"
                          value={dna?.current_tools || ''}
                          onChange={e => setDna(prev => prev ? { ...prev, current_tools: e.target.value } : null)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Excel, WhatsApp, Cuaderno"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Módulos Deseados</label>
                        <input
                          type="text"
                          value={dna?.desired_modules || ''}
                          onChange={e => setDna(prev => prev ? { ...prev, desired_modules: e.target.value } : null)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                          placeholder="Inventario, CRM, Facturación"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-semibold">Flujo Operativo Actual</label>
                      <textarea
                        rows={3}
                        value={dna?.operational_flow || ''}
                        onChange={e => setDna(prev => prev ? { ...prev, operational_flow: e.target.value } : null)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="El cliente escribe por WhatsApp, el vendedor anota en Excel, luego pasan la orden a bodega..."
                      />
                    </div>

                    {/* Botón de Generar Contexto IA */}
                    <div className="pt-2 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-emerald-400 font-bold flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5" /> Consolidar Contexto para IA
                          </label>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Genera un prompt estructurado para demos, propuestas o ChatGPT.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={generateAIContext}
                          className="text-[11px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          Generar Contexto
                        </button>
                      </div>
                      <textarea
                        rows={7}
                        value={dna?.consolidated_context || ''}
                        onChange={e => setDna(prev => prev ? { ...prev, consolidated_context: e.target.value } : null)}
                        className="w-full bg-slate-900 border border-emerald-500/20 focus:border-emerald-500 rounded-lg p-3 text-white font-mono text-[11px] leading-relaxed"
                        placeholder="Haz clic en 'Generar Contexto' para autocompletar el prompt..."
                      />
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-800">
                      <button
                        type="submit"
                        disabled={savingDna}
                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        {savingDna ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Guardar DNA Estratégico
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* PESTAÑA 3: ACTIVIDADES Y SEGUIMIENTO */}
            {activeTab === 'actividades' && (
              <div className="space-y-4">
                {/* Formulario rápido de actividad */}
                <form onSubmit={handleAddActivity} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-white block">Registrar Interacción o Llamada</span>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={newActivity.activity_type}
                      onChange={e => setNewActivity({ ...newActivity, activity_type: e.target.value })}
                      className="col-span-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white text-xs"
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
                      className="col-span-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Resultado obtenido..."
                      value={newActivity.result}
                      onChange={e => setNewActivity({ ...newActivity, result: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Próximo paso acordado..."
                      value={newActivity.next_step}
                      onChange={e => setNewActivity({ ...newActivity, next_step: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-xs"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-colors"
                    >
                      + Registrar Actividad
                    </button>
                  </div>
                </form>

                {/* Línea de tiempo de actividades */}
                <div className="space-y-2.5">
                  {loadingActivities ? (
                    <div className="py-6 text-center text-xs text-slate-500">Cargando actividades...</div>
                  ) : activities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Sin actividades registradas aún. Registra la primera llamada o mensaje arriba.
                    </div>
                  ) : (
                    activities.map(act => (
                      <div key={act.id} className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                            <Tag className="w-3 h-3 text-indigo-400" /> {act.activity_type}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {format(parseISO(act.activity_date), 'd MMM yyyy, HH:mm', { locale: es })}
                          </span>
                        </div>
                        <p className="text-white text-xs leading-relaxed">{act.summary}</p>
                        {act.result && (
                          <p className="text-slate-400 text-[11px]"><strong className="text-slate-500">Resultado:</strong> {act.result}</p>
                        )}
                        {act.next_step && (
                          <p className="text-emerald-400 text-[11px]"><strong className="text-slate-500">Próximo paso:</strong> {act.next_step}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 4: TAREAS VINCULADAS */}
            {activeTab === 'tareas' && (
              <div className="space-y-4">
                {/* Formulario rápido de tarea */}
                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nueva tarea para este prospecto..."
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20"
                  >
                    + Crear
                  </button>
                </form>

                {/* Lista de tareas */}
                <div className="space-y-2">
                  {loadingTasks ? (
                    <div className="py-6 text-center text-xs text-slate-500">Cargando tareas...</div>
                  ) : tasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                      Sin tareas pendientes para este prospecto.
                    </div>
                  ) : (
                    tasks.map(t => (
                      <div key={t.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={t.status === 'Completada'}
                            onChange={e => {
                              const newSt = e.target.checked ? 'Completada' : 'Pendiente';
                              setTasks(prev => prev.map(item => item.id === t.id ? { ...item, status: newSt } : item));
                              updateTaskStatusAction(t.id, newSt);
                            }}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={`text-xs ${t.status === 'Completada' ? 'line-through text-slate-500' : 'text-white font-medium'}`}>
                            {t.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                          {t.priority}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 5: BITÁCORA EDITABLE */}
            {activeTab === 'bitacora' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Bitácora de Notas & Requerimientos
                </label>
                <textarea
                  rows={8}
                  value={logText}
                  onChange={(e) => setLogText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Añade actualizaciones de la llamada o nuevos requerimientos..."
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveLog}
                    disabled={isSaving || logText === lead.interaction_log}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Guardar Bitácora
                  </button>
                </div>
              </div>
            )}

            {/* ─── FOOTER: CONVERSIÓN O DECLARACIÓN DE PÉRDIDA ─── */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              {!alreadyConverted && eligibleForConversion && (
                <button
                  onClick={handleConvertToClient}
                  disabled={isConverting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Convirtiendo a cliente...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Convertir a Cliente Formal de RSD
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}

              {!alreadyConverted && lead.status !== 'Perdido' && (
                <button
                  onClick={() => setShowLossModal(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 text-xs font-semibold transition"
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
