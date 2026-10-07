'use client';

import { useState, useEffect } from 'react';
import { Lead, Diagnostic } from '@/types/database.types';
import { saveDiagnosticAction, getLeadDiagnosticAction } from '@/app/actions/diagnostics';
import { updateLeadDetailsAction } from '@/app/actions/leads';
import { 
  X, 
  Stethoscope, 
  Building2, 
  AlertTriangle, 
  Workflow, 
  Users, 
  CheckCircle2, 
  Save, 
  Loader2, 
  Sparkles, 
  Laptop, 
  Clock, 
  FileText,
  HelpCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DiagnosticModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onDiagnosticSaved: (diagnostic: Diagnostic, updatedLead?: Lead) => void;
}

export function DiagnosticModal({
  isOpen,
  lead,
  onClose,
  onDiagnosticSaved,
}: DiagnosticModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [existingDiagnostic, setExistingDiagnostic] = useState<Diagnostic | null>(null);

  // Form State
  const [form, setForm] = useState({
    business_name: '',
    business_activity: '',
    business_model: '',
    products_services: '',
    
    // Dolor comercial
    main_problem: '',
    bottlenecks: '',
    risks_losses: '',
    urgency_priority: 'Media' as 'Alta' | 'Media' | 'Baja',

    // Operación actual
    current_tools: 'Excel',
    current_workflow: '',
    digitalization_level: 'Bajo',

    // Equipo
    team_size: '5 a 15 personas',
    user_roles: '',

    // Solución planteada
    proposed_solution: '',
    potential_modules: '',
    requires_demo: true,
    next_action: 'Presentar prototipo interactivo / demo técnica',
    internal_notes: '',
  });

  // Cargar diagnóstico existente o precargar desde lead
  useEffect(() => {
    if (!isOpen || !lead) return;

    setErrorMessage(null);
    setLoading(true);

    async function loadData() {
      try {
        if (!lead) return;
        const diag = await getLeadDiagnosticAction(lead.id);
        if (diag) {
          setExistingDiagnostic(diag);
          setForm({
            business_name: lead.company_name,
            business_activity: diag.business_activity || '',
            business_model: diag.business_model || '',
            products_services: diag.products_services || '',
            main_problem: diag.main_problem || '',
            bottlenecks: diag.bottlenecks || '',
            risks_losses: diag.risks_losses || '',
            urgency_priority: (diag.urgency_priority as any) || 'Media',
            current_tools: diag.current_tools || lead.current_management_method || 'Excel',
            current_workflow: diag.current_workflow || '',
            digitalization_level: diag.digitalization_level || 'Bajo',
            team_size: diag.team_size || lead.team_size || '5 a 15 personas',
            user_roles: diag.user_roles || '',
            proposed_solution: diag.proposed_solution || (lead.software_type ? `${lead.software_type} a medida` : ''),
            potential_modules: diag.potential_modules || '',
            requires_demo: diag.requires_demo ?? true,
            next_action: diag.next_action || lead.next_action || 'Presentar prototipo interactivo / demo técnica',
            internal_notes: diag.internal_notes || '',
          });
        } else {
          setExistingDiagnostic(null);
          setForm({
            business_name: lead.company_name,
            business_activity: typeof lead.niche === 'string' ? lead.niche : '',
            business_model: 'Distribución / Venta directa',
            products_services: '',
            main_problem: lead.problem_description || lead.main_need || '',
            bottlenecks: '',
            risks_losses: '',
            urgency_priority: (lead.priority as any) || 'Media',
            current_tools: lead.current_management_method || 'Excel',
            current_workflow: '',
            digitalization_level: 'Bajo',
            team_size: lead.team_size || '5 a 15 personas',
            user_roles: 'Vendedores, Administrador, Bodeguero',
            proposed_solution: lead.software_type ? `${lead.software_type} a medida` : 'Sistema a medida',
            potential_modules: 'Control de inventario, Gestión comercial / pedidos, Facturación',
            requires_demo: true,
            next_action: lead.next_action || 'Presentar prototipo interactivo / demo técnica',
            internal_notes: '',
          });
        }
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const handleSubmit = async (complete: boolean) => {
    if (!form.business_activity.trim()) {
      setErrorMessage('Por favor especifica a qué se dedica la empresa (giro de negocio).');
      return;
    }
    if (!form.main_problem.trim()) {
      setErrorMessage('Por favor describe en detalle el dolor comercial o problema principal.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: Partial<Diagnostic> = {
        id: existingDiagnostic?.id,
        lead_id: lead.id,
        status: complete ? 'Completado' : 'Borrador',
        business_activity: form.business_activity.trim(),
        business_model: form.business_model.trim() || null,
        products_services: form.products_services.trim() || null,
        team_size: form.team_size.trim() || null,
        current_tools: form.current_tools.trim() || null,
        digitalization_level: form.digitalization_level,
        main_problem: form.main_problem.trim(),
        bottlenecks: form.bottlenecks.trim() || null,
        risks_losses: form.risks_losses.trim() || null,
        urgency_priority: form.urgency_priority,
        current_workflow: form.current_workflow.trim() || null,
        proposed_solution: form.proposed_solution.trim() || null,
        potential_modules: form.potential_modules.trim() || null,
        user_roles: form.user_roles.trim() || null,
        requires_demo: form.requires_demo,
        next_action: form.next_action.trim() || null,
        internal_notes: form.internal_notes.trim() || null,
      };

      const res = await saveDiagnosticAction(payload);
      if (!res.success || !res.diagnostic) {
        throw new Error(res.error || 'Error al guardar el diagnóstico');
      }

      // Si se completó, actualizar información en el lead también
      let updatedLead: Lead | undefined;
      if (complete) {
        const leadUpdateRes = await updateLeadDetailsAction(lead.id, {
          status: 'Diagnóstico',
          company_name: form.business_name.trim() || lead.company_name,
          problem_description: form.main_problem.trim(),
          current_management_method: form.current_tools.trim(),
          team_size: form.team_size.trim(),
          next_action: form.next_action.trim(),
        });
        if (leadUpdateRes.success && leadUpdateRes.lead) {
          updatedLead = leadUpdateRes.lead;
        }
      }

      onDiagnosticSaved(res.diagnostic, updatedLead);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el diagnóstico');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* ─── MODAL HEADER ─── */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Diagnóstico Comercial
                </span>
                {existingDiagnostic && (
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                    existingDiagnostic.status === 'Completado' 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}>
                    {existingDiagnostic.status}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
                Levantamiento de Necesidades — {lead.company_name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── MODAL BODY ─── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
              <span>Cargando antecedentes del diagnóstico...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECCIÓN 1: EMPRESA Y TIPO DE NEGOCIO */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    1. Identificación & ¿A qué se dedica la Empresa?
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Nombre de la Empresa *
                    </label>
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={e => setForm({ ...form, business_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Distribuidora Ferretera del Valle"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Modelo de Negocio
                    </label>
                    <input
                      type="text"
                      value={form.business_model}
                      onChange={e => setForm({ ...form, business_model: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Distribuidor mayorista B2B, Importador, Venta minorista"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Tipo de Empresa / Giro de Negocio (Explicado) *
                    </label>
                    <textarea
                      rows={2}
                      value={form.business_activity}
                      onChange={e => setForm({ ...form, business_activity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                      placeholder="Explica qué hacen: 'Importan repuestos automotrices, atienden a talleres y tienen 2 locales comerciales con 8 vendedores en calle...'"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Productos o Servicios Principales
                    </label>
                    <input
                      type="text"
                      value={form.products_services}
                      onChange={e => setForm({ ...form, products_services: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Filtros, baterías, lubricantes industriales, servicio de instalación"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: EL DOLOR COMERCIAL */}
              <div className="bg-slate-950/70 border border-rose-500/20 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-500/20">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <h3 className="font-bold text-rose-300 uppercase tracking-wider text-[11px]">
                    2. El Dolor Comercial (Explicado con Detalle)
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="text-[10px] text-rose-300/80 uppercase font-semibold block mb-1">
                      Dolor Comercial Principal / Problema Crítico *
                    </label>
                    <textarea
                      rows={3}
                      value={form.main_problem}
                      onChange={e => setForm({ ...form, main_problem: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-rose-500"
                      placeholder="Describe qué les duele hoy: 'Pierden ventas porque no saben el stock real entre locales al cotizar; los vendedores en la calle tardan horas en enviar pedidos y se cruzan ventas...'"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Cuellos de Botella Operativos
                      </label>
                      <textarea
                        rows={2}
                        value={form.bottlenecks}
                        onChange={e => setForm({ ...form, bottlenecks: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                        placeholder="Ej. Bodega no da abasto confirmando por teléfono; el área contable digita dos veces cada factura..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Riesgos o Pérdidas Actuales (Dinero, tiempo, clientes)
                      </label>
                      <textarea
                        rows={2}
                        value={form.risks_losses}
                        onChange={e => setForm({ ...form, risks_losses: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                        placeholder="Ej. Descuadre mensual de $1,200 en mercadería; clientes cancelan pedidos por demoras en despacho..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Nivel de Urgencia del Cliente
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Alta', 'Media', 'Baja'] as const).map(u => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setForm({ ...form, urgency_priority: u })}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all text-center ${
                            form.urgency_priority === u
                              ? u === 'Alta' 
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm' 
                                : u === 'Media'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Urgencia {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: ¿CÓMO LLEVAN HOY LA OPERACIÓN? */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Workflow className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    3. ¿Cómo Gestionan Hoy su Operación? (Herramientas & Flujo)
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Herramientas Actuales (Excel, Cuaderno, WhatsApp, Sistema contable, etc.) *
                      </label>
                      <input
                        type="text"
                        value={form.current_tools}
                        onChange={e => setForm({ ...form, current_tools: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="Ej. Excel compartido en Google Drive, Cuaderno físico, WhatsApp, Mónica"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Nivel de Digitalización Actual
                      </label>
                      <select
                        value={form.digitalization_level}
                        onChange={e => setForm({ ...form, digitalization_level: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Manual / Papel">Manual / Papel y Cuaderno</option>
                        <option value="Bajo (Excel / WhatsApp)">Bajo (Excel / WhatsApp)</option>
                        <option value="Medio (Software básico desactualizado)">Medio (Software básico desactualizado)</option>
                        <option value="Avanzado (Requiere integración / modernización)">Avanzado (Requiere integración / modernización)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Flujo Operativo Actual (Paso a Paso Explicado)
                    </label>
                    <textarea
                      rows={3}
                      value={form.current_workflow}
                      onChange={e => setForm({ ...form, current_workflow: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. 1) El cliente pide cotización por WhatsApp. 2) El vendedor abre un Excel y anota. 3) Llama a bodega para saber si hay stock. 4) Se emite la nota a mano..."
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: EQUIPO Y PERSONAS INVOLUCRADAS */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    4. Tamaño del Equipo & Roles Operativos
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Tamaño del Equipo (Cantidad de personas)
                    </label>
                    <input
                      type="text"
                      value={form.team_size}
                      onChange={e => setForm({ ...form, team_size: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. 8 personas (3 vendedores, 2 bodega, 1 admin, 2 gerencia)"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Roles que usarán el software
                    </label>
                    <input
                      type="text"
                      value={form.user_roles}
                      onChange={e => setForm({ ...form, user_roles: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Vendedor en calle, Administrador general, Despachador"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 5: SOLUCIÓN RECOMENDADA & PRÓXIMO PASO */}
              <div className="bg-slate-950/70 border border-indigo-500/20 rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-500/20">
                  <Laptop className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                    5. Solución Planteada & Siguiente Paso Comercial
                  </h3>
                </div>

                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Solución Propuesta
                      </label>
                      <input
                        type="text"
                        value={form.proposed_solution}
                        onChange={e => setForm({ ...form, proposed_solution: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="Ej. ERP / Web App a Medida multi-local"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                        Módulos Clave Recomendados
                      </label>
                      <input
                        type="text"
                        value={form.potential_modules}
                        onChange={e => setForm({ ...form, potential_modules: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="Ej. Facturación electrónica, Stock sincronizado, App pedidos"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">¿Requiere Demostración Técnica / Demo Interactiva?</span>
                      <span className="text-[10px] text-slate-400">Si se activa, el equipo comercial preparará una maqueta funcional de RSD para la venta.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.requires_demo}
                        onChange={e => setForm({ ...form, requires_demo: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Próxima Acción Acordada con el Prospecto *
                    </label>
                    <input
                      type="text"
                      value={form.next_action}
                      onChange={e => setForm({ ...form, next_action: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-indigo-500"
                      placeholder="Ej. Presentar prototipo interactivo en reunión virtual el martes 15:00"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">
                      Notas Internas / Observaciones de Robinson
                    </label>
                    <textarea
                      rows={2}
                      value={form.internal_notes}
                      onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
                      placeholder="Anotaciones confidenciales de viabilidad, objeciones esperadas o márgenes..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER ─── */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/70 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={submitting || loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Borrador</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={submitting || loading}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finalizar Diagnóstico</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
