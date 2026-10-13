'use client';

import { useState } from 'react';
import { 
  Demo, 
  DemoFeedback, 
  DemoFile, 
  AIUsageWindow, 
  DemoApprovalStatus 
} from '@/types/database.types';
import { 
  updateDemoStatusAction, 
  addDemoFeedbackAction, 
  convertDemoToProposalAction,
  reviewDemoAction,
  submitDemoForApprovalAction,
  uploadDemoMarkdownAction,
  deleteDemoFileAction,
  registerAIUsageWindowAction,
  recordDemoPresentationResultAction,
  updateDemoUrlsAction
} from '@/app/actions/demos';
import { 
  ArrowLeft, 
  MessageSquare, 
  Loader2, 
  FileText, 
  ShieldCheck, 
  FileCode, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Upload, 
  Download, 
  Eye, 
  Plus, 
  Clock, 
  Sparkles,
  ExternalLink,
  Presentation,
  Github,
  Database,
  Globe,
  UploadCloud,
  Edit3,
  Copy,
  Check
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface DemoDetailViewProps {
  demo: Demo & { leads?: { company_name: string; contact_name?: string }; clients?: { company_name: string } };
  feedback: DemoFeedback[];
  initialFiles: DemoFile[];
  initialAIWindows: AIUsageWindow[];
  isAdmin: boolean;
  userEmail: string;
}

export function DemoDetailView({ 
  demo, 
  feedback, 
  initialFiles, 
  initialAIWindows, 
  isAdmin,
  userEmail 
}: DemoDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'md_files' | 'ai_tokens' | 'aprobacion' | 'feedback'>('info');
  const [files, setFiles] = useState<DemoFile[]>(initialFiles);
  const [aiWindows, setAIWindows] = useState<AIUsageWindow[]>(initialAIWindows);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [viewingFile, setViewingFile] = useState<DemoFile | null>(null);

  // Formulario nuevo archivo .md
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isReadingDetailFile, setIsReadingDetailFile] = useState(false);

  // Estado para gestión de Enlaces Técnicos (Vercel, GitHub, DB, Demo)
  const [urls, setUrls] = useState({
    demo_url: demo.demo_url || '',
    vercel_url: demo.vercel_url || '',
    github_url: demo.github_url || '',
    database_url: demo.database_url || '',
  });
  const [isEditingUrls, setIsEditingUrls] = useState(false);
  const [savingUrls, setSavingUrls] = useState(false);
  const [copiedDb, setCopiedDb] = useState(false);

  // Guardar enlaces técnicos
  const handleSaveUrls = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingUrls(true);
    try {
      const res = await updateDemoUrlsAction(demo.id, urls);
      if (res.success) {
        demo.demo_url = urls.demo_url || null;
        demo.vercel_url = urls.vercel_url || null;
        demo.github_url = urls.github_url || null;
        demo.database_url = urls.database_url || null;
        setIsEditingUrls(false);
      } else {
        alert('Error al guardar enlaces: ' + (res.error || 'Desconocido'));
      }
    } catch (err: any) {
      alert('Error inesperado: ' + err.message);
    } finally {
      setSavingUrls(false);
    }
  };

  // Selector de archivo .md
  const handleDetailFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingDetailFile(true);
    try {
      const text = await file.text();
      setNewFileName(file.name);
      setNewFileContent(text);
    } catch (err) {
      console.error('Error al leer el archivo .md:', err);
      alert('No se pudo leer el archivo seleccionado.');
    } finally {
      setIsReadingDetailFile(false);
      e.target.value = '';
    }
  };

  // Formulario nueva ventana de IA
  const [newAIWindow, setNewAIWindow] = useState({
    provider: 'Claude',
    model: 'Claude 3.5 Sonnet',
    window_number: (initialAIWindows.length || 0) + 1,
    percentage_consumed: 30,
    work_summary: '',
    notes: '',
  });

  // Formulario de aprobación de Robinson
  const [approvalDecision, setApprovalDecision] = useState<'Aprobada internamente' | 'Observada / requiere ajustes' | 'Rechazada por el cliente'>('Aprobada internamente');
  const [approvalNotes, setApprovalNotes] = useState('');

  // Formulario de resultado de presentación
  const [presentationResult, setPresentationResult] = useState({
    presented_at: new Date().toISOString().slice(0, 16),
    decision: 'Aceptada' as 'Aceptada' | 'Aceptada con ajustes' | 'Pendiente' | 'Rechazada',
    notes: '',
  });

  const approvalStatus: DemoApprovalStatus = demo.approval_status || 'Borrador';

  // Subir archivo Markdown
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim() || !newFileContent.trim()) return;

    setIsSubmitting(true);
    const res = await uploadDemoMarkdownAction(
      demo.id,
      newFileName.endsWith('.md') ? newFileName : `${newFileName}.md`,
      newFileContent
    );
    setIsSubmitting(false);

    if (res.success && res.file) {
      setFiles([res.file, ...files]);
      setNewFileName('');
      setNewFileContent('');
      alert('Archivo .md cargado y vinculado a la demo.');
    }
  };

  // Registrar ventana de consumo de IA
  const handleRegisterAIWindow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAIWindow.work_summary.trim()) return;

    setIsSubmitting(true);
    const res = await registerAIUsageWindowAction({
      demo_id: demo.id,
      provider: newAIWindow.provider,
      model: newAIWindow.model,
      window_number: newAIWindow.window_number,
      percentage_consumed: Number(newAIWindow.percentage_consumed),
      work_summary: newAIWindow.work_summary,
      notes: newAIWindow.notes,
    });
    setIsSubmitting(false);

    if (res.success && res.window) {
      setAIWindows([res.window, ...aiWindows]);
      setNewAIWindow({
        provider: 'Claude',
        model: 'Claude 3.5 Sonnet',
        window_number: aiWindows.length + 2,
        percentage_consumed: 30,
        work_summary: '',
        notes: '',
      });
      alert('Ventana de uso de IA declarada correctamente.');
    }
  };

  // Enviar a revisión
  const handleSubmitForApproval = async () => {
    setIsSubmitting(true);
    try {
      await submitDemoForApprovalAction(demo.id);
      alert('Solicitud enviada a Robinson para su revisión.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Decisión de Robinson
  const handleReviewDemo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reviewDemoAction(demo.id, approvalDecision, approvalNotes);
      alert(`Decisión registrada: ${approvalDecision}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guardar resultado de presentación
  const handleSavePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await recordDemoPresentationResultAction(demo.id, {
        presented_at: new Date(presentationResult.presented_at).toISOString(),
        decision: presentationResult.decision,
        notes: presentationResult.notes,
      });
      alert('Resultado de presentación registrado en CRM.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToProposal = async () => {
    if (!confirm('¿Convertir esta demo en una propuesta comercial formal?')) return;
    setIsConverting(true);
    try {
      await convertDemoToProposalAction(demo.id);
    } catch (err: any) {
      alert('Error al convertir: ' + err.message);
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/comercial/demos" className="inline-flex items-center text-xs text-slate-400 hover:text-white mb-3">
          <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Volver a Demos
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                approvalStatus === 'Aprobada internamente' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                approvalStatus === 'Observada / requiere ajustes' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                approvalStatus === 'En revisión' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                {approvalStatus}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">v{demo.demo_version || 1}.0</span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{demo.name}</h1>
            <p className="text-xs text-slate-400">
              Cliente / Prospecto: <span className="text-slate-200 font-medium">{demo.clients?.company_name || demo.leads?.company_name || 'Sin empresa'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {demo.demo_url && (
              <a
                href={demo.demo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Ver Demo Online
              </a>
            )}

            {approvalStatus === 'Borrador' && (
              <button
                onClick={handleSubmitForApproval}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
              >
                Enviar a Revisión de Robinson
              </button>
            )}

            {demo.status !== 'Convertida a proyecto' && (
              <button
                onClick={handleConvertToProposal}
                disabled={isConverting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md disabled:opacity-50"
              >
                {isConverting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Crear Propuesta
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── BARRA DE ENLACES TÉCNICOS Y DESPLIEGUES ─── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            Entornos:
          </span>

          {/* Vercel */}
          {urls.vercel_url ? (
            <a
              href={urls.vercel_url.startsWith('http') ? urls.vercel_url : `https://${urls.vercel_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-950 text-white text-xs border border-slate-700 hover:border-slate-500 font-medium transition-all shadow-sm group"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>Vercel App</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 text-slate-500 text-xs border border-slate-800/80">
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              Vercel: No asignado
            </span>
          )}

          {/* GitHub */}
          {urls.github_url ? (
            <a
              href={urls.github_url.startsWith('http') ? urls.github_url : `https://${urls.github_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-100 text-xs border border-slate-700 hover:border-slate-500 font-medium transition-all shadow-sm group"
            >
              <Github className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
              <span>Repositorio GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 text-slate-500 text-xs border border-slate-800/80">
              <Github className="w-3.5 h-3.5 text-slate-600" />
              GitHub: No asignado
            </span>
          )}

          {/* Database */}
          {urls.database_url ? (
            urls.database_url.startsWith('http') ? (
              <a
                href={urls.database_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 text-xs border border-emerald-500/30 hover:border-emerald-500/50 font-medium transition-all shadow-sm group"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Base de Datos</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </a>
            ) : (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(urls.database_url);
                  setCopiedDb(true);
                  setTimeout(() => setCopiedDb(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-300 text-xs border border-emerald-500/30 font-medium transition-all shadow-sm"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>{copiedDb ? 'Copiado!' : 'Copiar URL BD'}</span>
                {copiedDb ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-emerald-400" />}
              </button>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/60 text-slate-500 text-xs border border-slate-800/80">
              <Database className="w-3.5 h-3.5 text-slate-600" />
              BD: No asignada
            </span>
          )}

          {/* Demo URL */}
          {urls.demo_url && (
            <a
              href={urls.demo_url.startsWith('http') ? urls.demo_url : `https://${urls.demo_url}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-950/70 text-indigo-300 text-xs border border-indigo-500/30 hover:border-indigo-500/50 font-medium transition-all shadow-sm group"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Sala / Demo</span>
            </a>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsEditingUrls(!isEditingUrls)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors self-start md:self-auto"
        >
          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
          <span>{isEditingUrls ? 'Cerrar Edición' : 'Editar Enlaces'}</span>
        </button>
      </div>

      {/* Panel Desplegable para Editar Enlaces Técnicos */}
      {isEditingUrls && (
        <form onSubmit={handleSaveUrls} className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" />
              Actualizar Enlaces Técnicos del Proyecto
            </h3>
            <span className="text-[11px] text-slate-400">Robinson Solórzano / Dev Team</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                Link de Despliegue en Vercel
              </label>
              <input
                type="url"
                placeholder="https://mi-demo.vercel.app"
                value={urls.vercel_url}
                onChange={e => setUrls({ ...urls, vercel_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-slate-200" />
                Link del Repositorio en GitHub
              </label>
              <input
                type="url"
                placeholder="https://github.com/RSD-Solutions/demo-cliente"
                value={urls.github_url}
                onChange={e => setUrls({ ...urls, github_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                URL de Base de Datos / Supabase Dashboard
              </label>
              <input
                type="text"
                placeholder="https://supabase.com/dashboard/project/... o postgresql://..."
                value={urls.database_url}
                onChange={e => setUrls({ ...urls, database_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                URL del Prototipo / Sala de Presentación
              </label>
              <input
                type="url"
                placeholder="https://meet.google.com/... o https://demo.rsd.app"
                value={urls.demo_url}
                onChange={e => setUrls({ ...urls, demo_url: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditingUrls(false)}
              className="px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingUrls}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingUrls ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Guardar Enlaces
            </button>
          </div>
        </form>
      )}

      {/* Barra de progreso de Aprobación */}
      <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Ciclo de Aprobación Interna (Robinson Solórzano)
        </div>
        <div className="flex items-center justify-between text-xs font-medium">
          <span className={approvalStatus === 'Borrador' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>1. Borrador</span>
          <span className="text-slate-600">→</span>
          <span className={approvalStatus === 'En revisión' || approvalStatus === 'Solicitud enviada' ? 'text-indigo-400 font-bold' : 'text-slate-400'}>2. En Revisión</span>
          <span className="text-slate-600">→</span>
          <span className={approvalStatus === 'Aprobada internamente' ? 'text-emerald-400 font-bold' : 'text-slate-400'}>3. Aprobada por Robinson</span>
          <span className="text-slate-600">→</span>
          <span className={approvalStatus === 'Presentada al cliente' ? 'text-sky-400 font-bold' : 'text-slate-400'}>4. Presentada</span>
          <span className="text-slate-600">→</span>
          <span className={demo.client_feedback_decision === 'Aceptada' ? 'text-teal-400 font-bold' : 'text-slate-400'}>5. Aceptada por Cliente</span>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-t-xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'info' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Requerimientos y Alcance
        </button>
        <button
          onClick={() => setActiveTab('md_files')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'md_files' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-4 h-4" />
          Archivos .md ({files.length})
        </button>
        <button
          onClick={() => setActiveTab('ai_tokens')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'ai_tokens' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Tokens IA / Ventanas 5h ({aiWindows.length})
        </button>
        <button
          onClick={() => setActiveTab('aprobacion')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'aprobacion' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Revisión & Decisión
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex items-center gap-2 px-5 py-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'feedback' ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Presentation className="w-4 h-4" />
          Presentación al Cliente
        </button>
      </div>

      {/* PESTAÑA 1: DETALLES Y ALCANCE */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Especificaciones Funcionales</h2>
            <div>
              <span className="text-slate-500 block">Tipo de Software:</span>
              <span className="text-slate-200 font-semibold">{demo.software_type}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Objetivo de la Demo:</span>
              <p className="text-slate-300 mt-0.5">{demo.objective || 'Sin objetivo especificado'}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Descripción Funcional:</span>
              <p className="text-slate-300 mt-0.5">{demo.description || demo.functional_description || 'Sin descripción'}</p>
            </div>
            {demo.modules_included && (
              <div>
                <span className="text-slate-500 block">Módulos Incluidos:</span>
                <p className="text-slate-300 mt-0.5">{demo.modules_included}</p>
              </div>
            )}
            {demo.main_flows && (
              <div>
                <span className="text-slate-500 block">Flujos Principales a Demostrar:</span>
                <p className="text-slate-300 mt-0.5 whitespace-pre-line">{demo.main_flows}</p>
              </div>
            )}
            {demo.target_roles && (
              <div>
                <span className="text-slate-500 block">Roles de Usuario:</span>
                <p className="text-slate-300 mt-0.5">{demo.target_roles}</p>
              </div>
            )}
            {demo.scheduled_at && (
              <div>
                <span className="text-slate-500 block">Fecha y Hora Programada:</span>
                <span className="text-indigo-300 font-medium">
                  {format(parseISO(demo.scheduled_at), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                </span>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Diseño y Criterios de Aceptación</h2>
            <div>
              <span className="text-slate-500 block">Identidad Visual y Referencias:</span>
              <p className="text-slate-300 mt-0.5">{demo.visual_identity_received || demo.design_references || 'No especificadas'}</p>
            </div>
            {demo.test_data_used && (
              <div>
                <span className="text-slate-500 block">Datos de Prueba / Mocking:</span>
                <p className="text-slate-300 mt-0.5">{demo.test_data_used}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500 block">Criterios de Aceptación:</span>
              <p className="text-slate-300 mt-0.5">{demo.acceptance_criteria || 'Revisión por Robinson y validación de flujos clave'}</p>
            </div>
            <div>
              <span className="text-slate-500 block">Limitaciones Conocidas:</span>
              <p className="text-slate-300 mt-0.5">{demo.known_limitations || 'Datos ficticios de prueba'}</p>
            </div>
            {demo.lead_id && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-semibold mb-1">Lead Asociado</span>
                <Link
                  href="/leads"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/30 transition-colors"
                >
                  <span>Ver Lead en Tablero Kanban</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Enlaces Técnicos Registrados</span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-cyan-400" /> Vercel:
                  </span>
                  {urls.vercel_url ? (
                    <a href={urls.vercel_url.startsWith('http') ? urls.vercel_url : `https://${urls.vercel_url}`} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline truncate max-w-[200px]">
                      {urls.vercel_url}
                    </a>
                  ) : (
                    <span className="text-slate-600 italic">No configurado</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Github className="w-3 h-3 text-slate-300" /> GitHub:
                  </span>
                  {urls.github_url ? (
                    <a href={urls.github_url.startsWith('http') ? urls.github_url : `https://${urls.github_url}`} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline truncate max-w-[200px]">
                      {urls.github_url}
                    </a>
                  ) : (
                    <span className="text-slate-600 italic">No configurado</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-emerald-400" /> Base de Datos:
                  </span>
                  {urls.database_url ? (
                    urls.database_url.startsWith('http') ? (
                      <a href={urls.database_url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline truncate max-w-[200px]">
                        Ver Dashboard
                      </a>
                    ) : (
                      <span className="text-emerald-300/80 font-mono truncate max-w-[200px]">
                        {urls.database_url}
                      </span>
                    )
                  ) : (
                    <span className="text-slate-600 italic">No configurado</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PESTAÑA 2: ARCHIVOS .MD */}
      {activeTab === 'md_files' && (
        <div className="space-y-6 text-xs">
          {/* Formulario para añadir archivo .md */}
          <form onSubmit={handleUploadFile} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  Cargar Archivo Markdown (.md)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Puedes seleccionar un archivo .md de tu equipo o redactarlo directamente a continuación.
                </p>
              </div>
            </div>

            {/* Selector Directo de Archivo desde el Equipo */}
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500/70 bg-slate-950/60 hover:bg-slate-950 rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
              <input
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                onChange={handleDetailFileSelect}
                className="sr-only"
              />
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 group-hover:bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-2 transition-colors">
                {isReadingDetailFile ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300">
                {isReadingDetailFile ? 'Cargando contenido...' : 'Haz clic para seleccionar un archivo .md o arrástralo aquí'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">
                Al seleccionar un archivo, el nombre y contenido se cargarán automáticamente en el editor.
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nombre del Archivo *</label>
                <input
                  type="text"
                  placeholder="ej. arquitectura_demo.md"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                <span>Contenido Markdown *</span>
                {newFileContent && (
                  <span className="text-[10px] text-indigo-300 font-mono">
                    {newFileContent.split('\n').length} líneas cargadas
                  </span>
                )}
              </label>
              <textarea
                rows={7}
                placeholder="# Arquitectura de la Demo&#10;&#10;## Flujos Principales..."
                value={newFileContent}
                onChange={e => setNewFileContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              {newFileContent && (
                <button
                  type="button"
                  onClick={() => {
                    setNewFileName('');
                    setNewFileContent('');
                  }}
                  className="px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg font-medium text-xs transition-colors"
                >
                  Limpiar
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !newFileName.trim() || !newFileContent.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs shadow-md disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> + Guardar Archivo .md
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Lista de Archivos .md */}
          <div className="space-y-3">
            <h3 className="font-bold text-white">Archivos Vinculados a la Demo</h3>
            {files.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                No hay archivos .md subidos aún.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map(file => (
                  <div key={file.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300 flex items-center gap-1.5 truncate">
                        <FileCode className="w-4 h-4 text-indigo-400" />
                        {file.file_name}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400">
                        {Math.round(file.file_size_bytes / 1024)} KB
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                      <button
                        onClick={() => setViewingFile(file)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm(`¿Eliminar ${file.file_name}?`)) {
                            await deleteDemoFileAction(file.id, demo.id);
                            setFiles(files.filter(f => f.id !== file.id));
                          }
                        }}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: TOKENS IA (VENTANAS DE 5 HORAS) */}
      {activeTab === 'ai_tokens' && (
        <div className="space-y-6 text-xs">
          {/* Banner aclaratorio mandatorio */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200">
            <span className="font-bold block text-white mb-0.5">
              Declaración Manual de Consumo de IA (Ventana de 5 Horas)
            </span>
            El asesor registra manualmente el porcentaje que considera utilizado en cada ventana de 5 horas de desarrollo. El CRM no realiza conexiones automáticas ni inferencias de tokens. Si se supera el 100%, se abre un nuevo registro para la siguiente ventana.
          </div>

          {/* Formulario de registro de ventana */}
          <form onSubmit={handleRegisterAIWindow} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Declarar Consumo para Ventana #{newAIWindow.window_number}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Proveedor de IA</label>
                <input
                  type="text"
                  value={newAIWindow.provider}
                  onChange={e => setNewAIWindow({ ...newAIWindow, provider: e.target.value })}
                  placeholder="ej. Claude / OpenAI / Antigravity"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Modelo (opcional)</label>
                <input
                  type="text"
                  value={newAIWindow.model}
                  onChange={e => setNewAIWindow({ ...newAIWindow, model: e.target.value })}
                  placeholder="ej. Claude 3.5 Sonnet"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Porcentaje Consumido: <span className="text-indigo-400 font-bold">{newAIWindow.percentage_consumed}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={newAIWindow.percentage_consumed}
                  onChange={e => setNewAIWindow({ ...newAIWindow, percentage_consumed: Number(e.target.value) })}
                  className="w-full accent-indigo-500 mt-2"
                />
              </div>
            </div>

            {/* Botones de selección rápida */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Selección Rápida:</span>
              <div className="flex flex-wrap gap-1.5">
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setNewAIWindow({ ...newAIWindow, percentage_consumed: pct })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                      newAIWindow.percentage_consumed === pct
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Trabajo Realizado en esta Ventana</label>
              <input
                type="text"
                placeholder="ej. Generación de estructura de módulos y lógica de base de datos..."
                value={newAIWindow.work_summary}
                onChange={e => setNewAIWindow({ ...newAIWindow, work_summary: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl font-semibold shadow-md"
              >
                + Registrar Ventana de IA
              </button>
            </div>
          </form>

          {/* Historial de Ventanas de IA */}
          <div className="space-y-3">
            <h3 className="font-bold text-white">Historial de Ventanas Declaradas ({aiWindows.length})</h3>
            {aiWindows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-2xl">
                Sin registros de ventanas de IA para esta demo.
              </div>
            ) : (
              <div className="space-y-3">
                {aiWindows.map(win => (
                  <div key={win.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-2">
                        <span>Ventana #{win.window_number} (5 Horas)</span>
                        <span className="text-[10px] text-slate-400 font-normal">({win.provider} {win.model && `• ${win.model}`})</span>
                      </span>
                      <span className="font-bold text-indigo-400">{win.percentage_consumed}%</span>
                    </div>

                    {/* Barra de progreso */}
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          win.percentage_consumed >= 90 ? 'bg-rose-500' :
                          win.percentage_consumed >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${win.percentage_consumed}%` }}
                      />
                    </div>

                    <p className="text-slate-300 text-xs mt-1">{win.work_summary}</p>
                    <span className="text-[10px] text-slate-500 block">
                      Registrado el {format(parseISO(win.created_at), 'd MMM yyyy, HH:mm', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 4: APROBACIÓN DE ROBINSON */}
      {activeTab === 'aprobacion' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Estado de Aprobación de Robinson Solórzano
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  El asesor no puede auto-aprobar la demo. Se requiere dictamen expreso de dirección.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-800 font-semibold text-white">
                {approvalStatus}
              </span>
            </div>

            {demo.approval_notes && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Observaciones de Dirección:</span>
                <p className="text-white text-xs">{demo.approval_notes}</p>
                {demo.approved_at && (
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Dictaminado el {format(parseISO(demo.approved_at), 'd MMM yyyy, HH:mm', { locale: es })}
                  </span>
                )}
              </div>
            )}

            {isAdmin ? (
              <form onSubmit={handleReviewDemo} className="space-y-4 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-white">Panel de Decisión (Solo Robinson / Admin)</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="Aprobada internamente"
                      checked={approvalDecision === 'Aprobada internamente'}
                      onChange={() => setApprovalDecision('Aprobada internamente')}
                      className="text-emerald-500"
                    />
                    <span className="text-emerald-400 font-bold">✓ Aprobar Demo</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="Observada / requiere ajustes"
                      checked={approvalDecision === 'Observada / requiere ajustes'}
                      onChange={() => setApprovalDecision('Observada / requiere ajustes')}
                      className="text-amber-500"
                    />
                    <span className="text-amber-400 font-bold">⚠ Solicitar Ajustes</span>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="Rechazada por el cliente"
                      checked={approvalDecision === 'Rechazada por el cliente'}
                      onChange={() => setApprovalDecision('Rechazada por el cliente')}
                      className="text-rose-500"
                    />
                    <span className="text-rose-400 font-bold">✕ Rechazar</span>
                  </label>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Notas y Observaciones para el Asesor</label>
                  <textarea
                    rows={3}
                    placeholder="Indica qué flujos revisar, correcciones requeridas o visto bueno..."
                    value={approvalNotes}
                    onChange={e => setApprovalNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                  >
                    Registrar Dictamen de Aprobación
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 bg-slate-950/60 rounded-xl text-slate-400 text-xs">
                ℹ️ Como Asesor Comercial, puedes cargar los archivos .md y registrar el consumo de IA. Robinson revisará estos datos para aprobar o emitir observaciones antes de presentar la demo al cliente.
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 5: PRESENTACIÓN AL CLIENTE Y RESULTADO */}
      {activeTab === 'feedback' && (
        <div className="space-y-6 text-xs">
          <form onSubmit={handleSavePresentation} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Presentation className="w-4 h-4 text-indigo-400" />
              Resultado de la Presentación de Demo al Prospecto
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Fecha de Presentación</label>
                <input
                  type="datetime-local"
                  value={presentationResult.presented_at}
                  onChange={e => setPresentationResult({ ...presentationResult, presented_at: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Decisión del Cliente</label>
                <select
                  value={presentationResult.decision}
                  onChange={e => setPresentationResult({ ...presentationResult, decision: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="Aceptada">Aceptada (Pasa a Propuesta)</option>
                  <option value="Aceptada con ajustes">Aceptada con Ajustes Menores</option>
                  <option value="Pendiente">Pendiente de Decisión Interna</option>
                  <option value="Rechazada">Rechazada por el Cliente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Comentarios, Funcionalidades Mostradas y Acuerdos</label>
              <textarea
                rows={3}
                placeholder="Detalla qué le gustó al cliente, qué ajustes pidió y cuál es el siguiente paso..."
                value={presentationResult.notes}
                onChange={e => setPresentationResult({ ...presentationResult, notes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
              >
                Guardar Resultado de Presentación
              </button>
            </div>
          </form>

          {/* Historial previo de feedback */}
          <div className="space-y-3">
            <h4 className="font-bold text-white">Comentarios y Feedback Histórico ({feedback.length})</h4>
            <div className="space-y-2">
              {feedback.map(fb => (
                <div key={fb.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-indigo-300">{fb.feedback_type}</span>
                    <span className="text-slate-500">{format(parseISO(fb.created_at), 'd MMM yyyy, HH:mm', { locale: es })}</span>
                  </div>
                  <p className="text-white text-xs">{fb.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISOR DE ARCHIVO .MD */}
      {viewingFile && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">{viewingFile.file_name}</h3>
              </div>
              <button onClick={() => setViewingFile(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {viewingFile.file_content || '(Archivo sin contenido de texto)'}
            </div>

            <div className="flex justify-end pt-4 mt-2 border-t border-slate-800">
              <button
                onClick={() => setViewingFile(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
