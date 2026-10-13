'use client';

import { useState, useEffect } from 'react';
import { createDemoAction, getLeadContextForDemoAction } from '@/app/actions/demos';
import { 
  Monitor, 
  Save, 
  ArrowLeft, 
  Building2, 
  User, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Workflow, 
  Palette, 
  ShieldAlert, 
  Clock, 
  Search,
  ExternalLink,
  Loader2,
  FileText,
  FileCode,
  Github,
  Database,
  Globe,
  UploadCloud,
  Trash2
} from 'lucide-react';
import Link from 'next/link';

interface LeadItem {
  id: string;
  company_name: string;
  contact_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  niche: string | null;
  software_type: string;
  main_need: string | null;
  problem_description: string | null;
}

interface ClientItem {
  id: string;
  company_name: string;
  contact_name: string;
}

interface NuevaDemoFormProps {
  leads: LeadItem[];
  clients: ClientItem[];
  initialLeadId?: string;
  initialClientId?: string;
  initialDiagnostic?: any;
  initialDna?: any;
}

export function NuevaDemoForm({
  leads,
  clients,
  initialLeadId,
  initialClientId,
  initialDiagnostic,
  initialDna,
}: NuevaDemoFormProps) {
  const [targetType, setTargetType] = useState<'lead' | 'client'>(initialClientId ? 'client' : 'lead');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || '');
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId || '');
  const [leadSearch, setLeadSearch] = useState('');
  
  const [diagnostic, setDiagnostic] = useState<any>(initialDiagnostic || null);
  const [dna, setDna] = useState<any>(initialDna || null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Campos del formulario
  const [formData, setFormData] = useState({
    name: '',
    software_type: 'Web App',
    demo_version: 1,
    status: 'Pendiente',
    approval_status: 'Solicitud enviada',
    scheduled_at: '',
    demo_url: '',
    vercel_url: '',
    github_url: '',
    database_url: '',
    objective: '',
    description: '',
    functional_description: '',
    modules_included: '',
    main_flows: '',
    target_roles: '',
    visual_identity_received: '',
    design_references: '',
    test_data_used: '',
    known_limitations: '',
    acceptance_criteria: '',
    update_lead_status: true,
  });

  // Estado para archivos Markdown (.md)
  interface UploadedMdFile {
    name: string;
    content: string;
    size: number;
  }
  const [uploadedMdFiles, setUploadedMdFiles] = useState<UploadedMdFile[]>([]);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedMdFile | null>(null);

  const handleMdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsReadingFiles(true);
    const newFiles: UploadedMdFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const text = await file.text();
        newFiles.push({
          name: file.name,
          content: text,
          size: file.size,
        });
      } catch (err) {
        console.error('Error al leer archivo:', file.name, err);
      }
    }

    setUploadedMdFiles(prev => [...prev, ...newFiles]);
    setIsReadingFiles(false);
    e.target.value = '';
  };

  const handleRemoveMdFile = (index: number) => {
    setUploadedMdFiles(prev => prev.filter((_, i) => i !== index));
  };

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const selectedClient = clients.find(c => c.id === selectedClientId);

  // Cargar diagnóstico y DNA cuando cambia el lead
  useEffect(() => {
    if (selectedLeadId && targetType === 'lead') {
      const loadContext = async () => {
        setLoadingContext(true);
        try {
          const res = await getLeadContextForDemoAction(selectedLeadId);
          setDiagnostic(res.diagnostic || null);
          setDna(res.dna || null);

          // Si el nombre está vacío o por defecto, sugerir uno
          const currentLead = leads.find(l => l.id === selectedLeadId);
          if (currentLead) {
            setFormData(prev => ({
              ...prev,
              name: prev.name || `Demo ${currentLead.software_type || 'Software'} - ${currentLead.company_name}`,
              software_type: ['Web App', 'Mobile App', 'ERP/CRM', 'E-commerce', 'Landing Page', 'Otro'].includes(currentLead.software_type)
                ? currentLead.software_type
                : prev.software_type,
            }));
          }
        } catch (err) {
          console.error('Error fetching lead context:', err);
        } finally {
          setLoadingContext(false);
        }
      };
      loadContext();
    } else {
      setDiagnostic(null);
      setDna(null);
    }
  }, [selectedLeadId, targetType, leads]);

  // Autocompletar inteligente desde Diagnóstico y DNA
  const handleAutoFillFromContext = () => {
    if (!selectedLead) return;

    const modules = dna?.desired_modules || diagnostic?.potential_modules || '';
    const flows = dna?.operational_flow || diagnostic?.current_workflow || '';
    const roles = dna?.user_roles || diagnostic?.user_roles || '';
    const visual = dna?.visual_identity_notes || diagnostic?.internal_notes || '';
    const references = dna?.reference_systems || '';
    const pain = diagnostic?.main_problem || selectedLead.problem_description || selectedLead.main_need || '';

    setFormData(prev => ({
      ...prev,
      name: `Demo Operativa - ${selectedLead.company_name}`,
      software_type: (['Web App', 'Mobile App', 'ERP/CRM', 'E-commerce', 'Landing Page', 'Otro'].includes(selectedLead.software_type)
        ? selectedLead.software_type
        : prev.software_type),
      objective: prev.objective || `Demostrar solución operativa para resolver: ${pain.slice(0, 150)}`,
      description: prev.description || `Demostración técnica y funcional personalizada para ${selectedLead.company_name}. Enfoque en resolver cuellos de botella en su operación diaria.`,
      functional_description: prev.functional_description || (diagnostic?.proposed_solution ? `Solución recomendada en diagnóstico: ${diagnostic.proposed_solution}` : ''),
      modules_included: prev.modules_included || modules,
      main_flows: prev.main_flows || flows,
      target_roles: prev.target_roles || roles,
      visual_identity_received: prev.visual_identity_received || visual,
      design_references: prev.design_references || references,
      test_data_used: prev.test_data_used || `Datos simulados adaptados al nicho ${selectedLead.niche || 'comercial'}.`,
      known_limitations: prev.known_limitations || 'Prototipo interactivo navegable para validación de arquitectura y UX. Integraciones de pago y facturación electrónica simuladas en esta fase.',
      acceptance_criteria: prev.acceptance_criteria || 'Aprobación del flujo de usuario por el tomador de decisión y validación de módulos requeridos para avanzar a propuesta formal.',
    }));
  };

  const filteredLeads = leads.filter(l => 
    l.company_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.contact_name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.niche && l.niche.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  return (
    <form action={createDemoAction} onSubmit={() => setIsSubmitting(true)} className="space-y-8">
      {/* ─── 1. VINCULACIÓN CON PROSPECTO / CLIENTE ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              1. Prospecto / Lead a Vincular (Obligatorio)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cada demo debe estar vinculada al Lead creado para trazabilidad comercial y aprobación interna.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setTargetType('lead'); setSelectedClientId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                targetType === 'lead'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Prospecto (Lead)
            </button>
            <button
              type="button"
              onClick={() => { setTargetType('client'); setSelectedLeadId(''); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                targetType === 'client'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cliente Convertido
            </button>
          </div>
        </div>

        {targetType === 'lead' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
                Seleccionar Lead del Pipeline *
              </label>

              {/* Buscador de leads */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filtrar por empresa, contacto o nicho..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                name="lead_id"
                required={targetType === 'lead'}
                value={selectedLeadId}
                onChange={e => setSelectedLeadId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Selecciona un Lead ({leads.length} disponibles) --</option>
                {filteredLeads.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.company_name} — {l.contact_name} ({l.status}) {l.niche ? `[${l.niche}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Tarjeta de contexto del Lead seleccionado */}
            {selectedLead && (
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white text-sm">{selectedLead.company_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                      Etapa: {selectedLead.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {diagnostic ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Diagnóstico Detectado
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        Sin Diagnóstico Formal
                      </span>
                    )}

                    {dna && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        DNA v{dna.version || 1}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Contacto:</span>
                    <strong className="text-slate-200">{selectedLead.contact_name}</strong>
                    {selectedLead.phone && <p className="text-[11px] text-slate-400">{selectedLead.phone}</p>}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Nicho / Software:</span>
                    <strong className="text-slate-200">{selectedLead.niche || 'General'}</strong>
                    <p className="text-[11px] text-indigo-300">{selectedLead.software_type}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Dolor / Necesidad Principal:</span>
                    <p className="text-[11px] text-slate-300 line-clamp-2">
                      {selectedLead.problem_description || selectedLead.main_need || 'No especificado'}
                    </p>
                  </div>
                </div>

                {/* Botón de autocompletado */}
                {(diagnostic || dna) && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAutoFillFromContext}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto-rellenar demo con datos del Diagnóstico & DNA
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-2">
              Seleccionar Cliente Existente *
            </label>
            <select
              name="client_id"
              required={targetType === 'client'}
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Selecciona un Cliente ({clients.length} disponibles) --</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.company_name} — {c.contact_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <input type="hidden" name="diagnostic_id" value={diagnostic?.id || ''} />
        <input type="hidden" name="dna_version_used" value={dna?.version || 1} />
      </div>

      {/* ─── 2. PARÁMETROS GENERALES DE LA DEMO ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Monitor className="w-4 h-4 text-purple-400" />
          2. Parámetros Generales de la Demostración
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Nombre de la Demo / Prototipo *
            </label>
            <input
              name="name"
              required
              placeholder="Ej. Demo Operativa ERP - Electrico Edison Pino"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Tipo de Software *
            </label>
            <select
              name="software_type"
              required
              value={formData.software_type}
              onChange={e => setFormData({ ...formData, software_type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Web App">Web App</option>
              <option value="Mobile App">Mobile App</option>
              <option value="E-commerce">E-commerce</option>
              <option value="ERP/CRM">ERP/CRM</option>
              <option value="Landing Page">Landing Page</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Versión del Prototipo
            </label>
            <input
              type="number"
              name="demo_version"
              min="1"
              value={formData.demo_version}
              onChange={e => setFormData({ ...formData, demo_version: Number(e.target.value) || 1 })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Fecha y Hora Programada de Presentación
            </label>
            <input
              type="datetime-local"
              name="scheduled_at"
              value={formData.scheduled_at}
              onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Enlaces Técnicos y Despliegue */}
          <div className="md:col-span-2 pt-3 border-t border-slate-800/80">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Enlaces Técnicos y Entornos de Despliegue
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  URL del Prototipo / Sala de Reunión
                </label>
                <input
                  type="url"
                  name="demo_url"
                  placeholder="https://meet.google.com/... o https://prototipo.rsd.app"
                  value={formData.demo_url}
                  onChange={e => setFormData({ ...formData, demo_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Link de Despliegue en Vercel
                </label>
                <input
                  type="url"
                  name="vercel_url"
                  placeholder="https://mi-demo-cliente.vercel.app"
                  value={formData.vercel_url}
                  onChange={e => setFormData({ ...formData, vercel_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Github className="w-3.5 h-3.5 text-slate-200" />
                  Link del Repositorio en GitHub
                </label>
                <input
                  type="url"
                  name="github_url"
                  placeholder="https://github.com/RSD-Solutions/demo-cliente"
                  value={formData.github_url}
                  onChange={e => setFormData({ ...formData, github_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  URL de Base de Datos / Supabase
                </label>
                <input
                  type="text"
                  name="database_url"
                  placeholder="https://supabase.com/dashboard/project/... o postgresql://..."
                  value={formData.database_url}
                  onChange={e => setFormData({ ...formData, database_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Estado Inicial
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Programada">Programada</option>
              <option value="Presentada">Presentada</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Aprobación Interna (Robinson)
            </label>
            <select
              name="approval_status"
              value={formData.approval_status}
              onChange={e => setFormData({ ...formData, approval_status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Solicitud enviada">Solicitud enviada (Revisión requerida)</option>
              <option value="Borrador">Borrador</option>
              <option value="En revisión">En revisión</option>
              <option value="Aprobada internamente">Aprobada internamente</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── 3. ALCANCE FUNCIONAL Y MÓDULOS ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Layers className="w-4 h-4 text-emerald-400" />
          3. Alcance Funcional, Módulos y Flujos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Objetivo Comercial y Técnico de la Demo
            </label>
            <input
              name="objective"
              placeholder="Ej. Demostrar el flujo de agendamiento y proformas automáticas para cerrar dudas del cliente"
              value={formData.objective}
              onChange={e => setFormData({ ...formData, objective: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Módulos Incluidos en la Demostración
            </label>
            <input
              name="modules_included"
              placeholder="Ej. Control de agendamiento, Gestión de visitas técnicas, Emisión de cotizaciones/proformas"
              value={formData.modules_included}
              onChange={e => setFormData({ ...formData, modules_included: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Flujos Principales a Demostrar Paso a Paso
            </label>
            <textarea
              name="main_flows"
              rows={3}
              placeholder="1. Registro de llamada o cliente&#10;2. Asignación de técnico a orden de servicio&#10;3. Generación y exportación de proforma en PDF"
              value={formData.main_flows}
              onChange={e => setFormData({ ...formData, main_flows: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Roles de Usuario Involucrados
            </label>
            <textarea
              name="target_roles"
              rows={3}
              placeholder="Ej. Administrador general (visión gerencial) y Técnico en campo (interfaz móvil simplificada)"
              value={formData.target_roles}
              onChange={e => setFormData({ ...formData, target_roles: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Descripción General / Alcance Funcional Detallado
            </label>
            <textarea
              name="functional_description"
              rows={3}
              placeholder="Explicación del alcance funcional del software preparado para la sesión técnica..."
              value={formData.functional_description}
              onChange={e => setFormData({ ...formData, functional_description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 4. IDENTIDAD VISUAL, MOCKING Y LÍMITES ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
          <Palette className="w-4 h-4 text-pink-400" />
          4. Identidad Visual, Mocking y Expectativas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Identidad Visual Recibida / Paleta
            </label>
            <input
              name="visual_identity_received"
              placeholder="Ej. Colores azul y blanco, logo vectorizado en SVG..."
              value={formData.visual_identity_received}
              onChange={e => setFormData({ ...formData, visual_identity_received: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Referencias de Diseño / Benchmarks
            </label>
            <input
              name="design_references"
              placeholder="Ej. Similitud con dashboard de Stripe o interfaz limpia tipo Notion"
              value={formData.design_references}
              onChange={e => setFormData({ ...formData, design_references: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Datos de Prueba Utilizados (Mocking)
            </label>
            <textarea
              name="test_data_used"
              rows={2}
              placeholder="Ej. 15 clientes ficticios, 8 servicios eléctricos residenciales y 3 técnicos configurados"
              value={formData.test_data_used}
              onChange={e => setFormData({ ...formData, test_data_used: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
              Limitaciones Conocidas (Fuera de Alcance Demo)
            </label>
            <textarea
              name="known_limitations"
              rows={2}
              placeholder="Ej. El envío de emails y WhatsApp está simulado; los reportes analíticos están mockeados"
              value={formData.known_limitations}
              onChange={e => setFormData({ ...formData, known_limitations: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              Criterios de Aceptación del Cliente (Para avanzar a Propuesta)
            </label>
            <textarea
              name="acceptance_criteria"
              rows={2}
              placeholder="Ej. El cliente valida que el formulario de proforma sea rápido de llenar y que el calendario muestre las visitas del día"
              value={formData.acceptance_criteria}
              onChange={e => setFormData({ ...formData, acceptance_criteria: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ─── 5. ARCHIVOS DE ESPECIFICACIÓN Y ARQUITECTURA (.MD) ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              5. Cargar Archivos de Especificaciones (.md)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Adjunta las especificaciones funcionales, prompts, diagramas o bitácoras en Markdown (.md). Se guardarán vinculados a la demo.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold self-start sm:self-auto">
            {uploadedMdFiles.length} archivo(s) seleccionado(s)
          </span>
        </div>

        {/* Input Oculto con los archivos JSON para el server action */}
        <input
          type="hidden"
          name="initial_md_files"
          value={JSON.stringify(uploadedMdFiles)}
        />

        {/* Zona de Arrastrar o Seleccionar Archivo */}
        <label className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
          <input
            type="file"
            accept=".md,.markdown,text/markdown,text/plain"
            multiple
            onChange={handleMdFileUpload}
            className="sr-only"
          />
          <div className="w-12 h-12 rounded-xl bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 transition-colors">
            {isReadingFiles ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <UploadCloud className="w-6 h-6" />
            )}
          </div>
          <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
            {isReadingFiles ? 'Procesando archivos...' : 'Haz clic para explorar o arrastra archivos .md aquí'}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">
            Formatos aceptados: .md, .markdown. Puedes seleccionar varios archivos a la vez.
          </span>
        </label>

        {/* Lista de Archivos Cargados */}
        {uploadedMdFiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {uploadedMdFiles.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCode className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{file.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB • {file.content.split('\n').length} líneas
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                    title="Vista previa del contenido"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMdFile(idx)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Eliminar archivo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Vista Previa Rápida */}
        {previewFile && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-white text-xs flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  {previewFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1"
                >
                  Cerrar
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                {previewFile.content}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 6. ACCIONES Y PIPELINE ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
          <input
            type="checkbox"
            name="update_lead_status"
            value="true"
            checked={formData.update_lead_status}
            onChange={e => setFormData({ ...formData, update_lead_status: e.target.checked })}
            className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            Actualizar automáticamente la etapa del Lead a <strong className="text-white">"Demo"</strong> en el Kanban comercial
          </span>
        </label>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <Link
            href="/comercial/demos"
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || (targetType === 'lead' && !selectedLeadId)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Registrando Demo...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Registrar Demo & Vincular
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
