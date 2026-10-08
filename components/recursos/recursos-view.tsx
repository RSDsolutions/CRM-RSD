'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { 
  FileText, Upload, Trash2, Download, AlertCircle, Loader2, 
  CheckCircle2, Lock, FolderOpen, Search, Sparkles, Layers,
  Check, FileUp
} from 'lucide-react';
import { uploadResourceAction, getResourcesAction, deleteResourceAction } from '@/app/actions/resources';

interface KitItemDef {
  id: string;
  number: number;
  title: string;
}

interface KitDef {
  id: string;
  title: string;
  description: string;
  items: KitItemDef[];
}

const RESOURCE_KITS: KitDef[] = [
  {
    id: '01',
    title: 'Identidad y Presentación Corporativa',
    description: 'Bases institucionales y presentación formal de la empresa.',
    items: [
      { id: '#1', number: 1, title: 'Ficha Institucional' },
      { id: '#2', number: 2, title: 'Presentación Corporativa' },
    ]
  },
  {
    id: '02',
    title: 'Kit Comercial del Asesor',
    description: 'Guías de venta, objeciones, demos y operación comercial.',
    items: [
      { id: '#4', number: 4, title: 'Guiones y Atención Comercial' },
      { id: '#5', number: 5, title: 'Calificación de Prospectos' },
      { id: '#6', number: 6, title: 'Manejo de Objeciones' },
      { id: '#7', number: 7, title: 'Seguimiento Comercial' },
      { id: '#8', number: 8, title: 'Reunión de Diagnóstico' },
      { id: '#22', number: 22, title: 'CRM Grow Level' },
      { id: '#24', number: 24, title: 'Prospección y Reactivación' },
      { id: '#25', number: 25, title: 'Presentación de Demos' },
    ]
  },
  {
    id: '03',
    title: 'Kit de Propuestas y Cierre',
    description: 'Políticas, cotizaciones, plantillas e informes de diagnóstico.',
    items: [
      { id: '#9', number: 9, title: 'Política de Demos' },
      { id: '#10', number: 10, title: 'Propuestas Comerciales' },
      { id: '#11', number: 11, title: 'Plantillas de Propuestas' },
      { id: '#26', number: 26, title: 'Informe de Diagnóstico' },
      { id: '#27', number: 27, title: 'Análisis de Viabilidad' },
    ]
  },
  {
    id: '04',
    title: 'Kit de Levantamiento y Proyecto',
    description: 'Definición de requerimientos, inicio de proyecto y alcance.',
    items: [
      { id: '#12', number: 12, title: 'Requerimientos y Alcance' },
      { id: '#13', number: 13, title: 'Aprobación e Inicio' },
      { id: '#28', number: 28, title: 'Cambios de Alcance' },
    ]
  },
  {
    id: '05',
    title: 'Kit de Entrega y Experiencia',
    description: 'Control de calidad, manuales de usuario y satisfacción.',
    items: [
      { id: '#14', number: 14, title: 'Acta de Entrega' },
      { id: '#15', number: 15, title: 'Control de Calidad' },
      { id: '#16', number: 16, title: 'Manual del Cliente' },
      { id: '#18', number: 18, title: 'Satisfacción y Testimonio' },
    ]
  },
  {
    id: '06',
    title: 'Kit de Soporte y Postventa',
    description: 'Protocolos de atención técnica, incidentes y renovaciones.',
    items: [
      { id: '#17', number: 17, title: 'Soporte e Incidencias' },
      { id: '#19', number: 19, title: 'Registro de Incidencias' },
      { id: '#33', number: 33, title: 'Retención y Renovación' },
    ]
  },
  {
    id: '07',
    title: 'Kit de Crecimiento y Referidos',
    description: 'Estrategias de recomendaciones y socios comerciales.',
    items: [
      { id: '#34', number: 34, title: 'Referidos' },
      { id: '#35', number: 35, title: 'Alianzas y Partners' },
    ]
  },
  {
    id: '08',
    title: 'Kit de Recuperación Comercial',
    description: 'Reactivación y análisis de oportunidades perdidas.',
    items: [
      { id: '#36', number: 36, title: 'Oportunidades Perdidas' },
    ]
  },
  {
    id: '09',
    title: 'Kit de Gestión Comercial',
    description: 'Métricas, supervisión del equipo y esquema de incentivos.',
    items: [
      { id: '#21', number: 21, title: 'Indicadores' },
      { id: '#30', number: 30, title: 'Supervisión y Evaluación' },
      { id: '#31', number: 31, title: 'Comisiones e Incentivos' },
    ]
  },
  {
    id: '10',
    title: 'Kit de Formación',
    description: 'Capacitación e integración de nuevos asesores comerciales.',
    items: [
      { id: '#29', number: 29, title: 'Onboarding de Asesores' },
    ]
  },
  {
    id: '11',
    title: 'Kit de Calidad y Gestión Interna',
    description: 'Biblioteca de documentos y políticas de privacidad y datos.',
    items: [
      { id: '#20', number: 20, title: 'Biblioteca Comercial' },
      { id: '#32', number: 32, title: 'Calidad de Datos y Privacidad' },
    ]
  }
];

function extractResourceNumber(str: string): number | null {
  if (!str) return null;
  // Matches "Recurso 04", "Recurso #4", "#04", "04 -", "04. ", "Recurso 4"
  const m = str.match(/(?:recurso\s*#?\s*|#\s*|^)0*(\d+)\b/i);
  return m ? parseInt(m[1], 10) : null;
}

const normalize = (text: string) => 
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export function RecursosView({ role }: { role: string }) {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [selectedFileCount, setSelectedFileCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'pending'>('all');

  useEffect(() => {
    loadResources();
  }, []);

  async function loadResources() {
    setIsLoading(true);
    const { data, error } = await getResourcesAction();
    if (error) {
      setError(error);
    } else if (data) {
      setResources(data);
    }
    setIsLoading(false);
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsUploading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll('file') as File[];
    const description = formData.get('description') as string;
    
    const validFiles = files.filter(f => f.size > 0);

    if (validFiles.length === 0) {
      setError('Selecciona al menos un archivo.');
      setIsUploading(false);
      return;
    }

    let hasErrors = false;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadProgress({ current: i + 1, total: validFiles.length, fileName: file.name });

      if (file.type !== 'application/pdf') {
        setError(`El archivo ${file.name} no es un PDF válido.`);
        hasErrors = true;
        break;
      }

      const singleFormData = new FormData();
      singleFormData.append('file', file);
      if (description) {
        singleFormData.append('description', description);
      }

      const { error: uploadError } = await uploadResourceAction(singleFormData);

      if (uploadError) {
        setError(`Error subiendo ${file.name}: ${uploadError}`);
        hasErrors = true;
        break;
      }
    }

    setUploadProgress(null);
    if (!hasErrors) {
      form.reset();
      setSelectedFileCount(0);
    }
    
    await loadResources();
    setIsUploading(false);
  }

  async function handleDelete(id: string, filePath: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) return;
    
    const { error } = await deleteResourceAction(id, filePath);
    if (error) {
      setError(error);
    } else {
      await loadResources();
    }
  }

  function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const isAdminOrRobinson = role === 'admin' || role === 'robinson';

  // Map resources to kits accurately using Resource Number as primary key
  const { mappedKits, otherResources, stats } = useMemo(() => {
    const matchedResourceIds = new Set<string>();

    const kitsWithResources = RESOURCE_KITS.map(kit => {
      const items = kit.items.map(item => {
        // 1) Match by exact resource number in title or file_name
        let found = resources.find(r => {
          if (matchedResourceIds.has(r.id)) return false;
          const numTitle = extractResourceNumber(r.title);
          const numFile = extractResourceNumber(r.file_name);
          return numTitle === item.number || numFile === item.number;
        });

        // 2) Fallback: match by normalized title text if no number matched
        if (!found) {
          found = resources.find(r => {
            if (matchedResourceIds.has(r.id)) return false;
            const normTitle = normalize(r.title);
            const normItem = normalize(item.title);
            return normTitle.includes(normItem);
          });
        }

        if (found) {
          matchedResourceIds.add(found.id);
        }

        return { ...item, resource: found };
      });

      return { ...kit, items };
    });

    const unassigned = resources.filter(r => !matchedResourceIds.has(r.id));

    let totalItems = 0;
    let availableItems = 0;
    kitsWithResources.forEach(k => {
      totalItems += k.items.length;
      availableItems += k.items.filter(i => !!i.resource).length;
    });

    return {
      mappedKits: kitsWithResources,
      otherResources: unassigned,
      stats: {
        totalKits: kitsWithResources.length,
        totalItems,
        availableItems,
        pendingItems: totalItems - availableItems,
        unassignedCount: unassigned.length,
      }
    };
  }, [resources]);

  // Filter items based on search and status
  const filteredKits = useMemo(() => {
    const query = normalize(searchQuery.trim());
    const searchNum = parseInt(searchQuery.replace(/\D/g, ''), 10);

    return mappedKits.map(kit => {
      const filteredItems = kit.items.filter(item => {
        // Status filter
        if (statusFilter === 'available' && !item.resource) return false;
        if (statusFilter === 'pending' && !!item.resource) return false;

        // Search query filter
        if (query) {
          const matchesTitle = normalize(item.title).includes(query);
          const matchesId = normalize(item.id).includes(query);
          const matchesNum = !isNaN(searchNum) && item.number === searchNum;
          const matchesUploadedTitle = item.resource && normalize(item.resource.title).includes(query);
          if (!matchesTitle && !matchesId && !matchesNum && !matchesUploadedTitle) {
            return false;
          }
        }

        return true;
      });

      return { ...kit, items: filteredItems };
    }).filter(kit => kit.items.length > 0);
  }, [mappedKits, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3 h-3" />
              Librería Oficial
            </span>
            <span className="text-xs text-slate-500">• RSD Solutions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Centro de Recursos y Kits
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Materiales, manuales operativos y guías comerciales estructuradas para el equipo.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[76px]">
            <span className="block text-[10px] uppercase font-semibold text-slate-500">Kits</span>
            <span className="text-sm font-bold text-white font-mono">{stats.totalKits}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[76px]">
            <span className="block text-[10px] uppercase font-semibold text-emerald-500/80">Listos</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{stats.availableItems}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-center min-w-[76px]">
            <span className="block text-[10px] uppercase font-semibold text-amber-500/80">Pendientes</span>
            <span className="text-sm font-bold text-amber-400 font-mono">{stats.pendingItems}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/40 text-red-400 p-3.5 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Section (Admin / Robinson only) */}
      {isAdminOrRobinson && (
        <Card className="bg-slate-900/80 border-slate-800/80 backdrop-blur shadow-none">
          <CardHeader className="py-3.5 px-4 sm:px-6 border-b border-slate-800/60 bg-slate-800/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-blue-400" />
                Subir Recursos en Lote
              </CardTitle>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Asignación automática por número (#1 al #36)
              </span>
            </div>
            <CardDescription className="text-slate-400 text-xs">
              Selecciona uno o varios PDFs desde tu equipo. El sistema detecta el número de recurso y lo vincula al kit correspondiente.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleUpload} className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1.5">
                  <label htmlFor="file" className="text-xs font-medium text-slate-300">
                    Archivos PDF a subir
                  </label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf"
                    multiple
                    required
                    onChange={(e) => setSelectedFileCount(e.target.files?.length || 0)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-colors cursor-pointer"
                  />
                  {selectedFileCount > 0 && (
                    <p className="text-[11px] text-blue-400 font-medium">
                      ✓ {selectedFileCount} archivo{selectedFileCount > 1 ? 's' : ''} seleccionado{selectedFileCount > 1 ? 's' : ''} para subir
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="text-xs font-medium text-slate-300">
                    Nota interna (opcional)
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    placeholder="Ej. Versión final aprobada 2026"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Upload Progress Indicator */}
              {isUploading && uploadProgress && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-300 font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Subiendo archivo {uploadProgress.current} de {uploadProgress.total}...
                    </span>
                    <span className="font-mono text-blue-400 text-[11px]">
                      {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate">
                    {uploadProgress.fileName}
                  </p>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end pt-1">
                <Button 
                  type="submit" 
                  disabled={isUploading} 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir Archivos
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar recurso por nombre o número (#4, Demos, Diagnóstico)..."
            className="w-full bg-slate-950/70 border border-slate-800/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-center sm:self-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Todos ({stats.totalItems})
          </button>
          <button
            onClick={() => setStatusFilter('available')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60'
            }`}
          >
            Listos ({stats.availableItems})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60'
            }`}
          >
            Pendientes ({stats.pendingItems})
          </button>
        </div>
      </div>

      {/* Main Kits Listing in Compact Boxes */}
      {isLoading ? (
        <div className="py-16 flex flex-col justify-center items-center gap-2">
          <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Cargando biblioteca de recursos...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredKits.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No se encontraron recursos</p>
              <p className="text-xs text-slate-500 mt-0.5">Prueba ajustando los filtros o el texto de búsqueda.</p>
            </div>
          ) : (
            filteredKits.map(kit => {
              const kitTotal = kit.items.length;
              const kitAvailable = kit.items.filter(i => !!i.resource).length;
              const isFullyAvailable = kitAvailable === kitTotal && kitTotal > 0;

              return (
                <div key={kit.id} className="space-y-3">
                  {/* Kit Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-blue-500/10 border border-blue-500/25 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                        {kit.id}
                      </span>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
                          {kit.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 hidden md:block">
                          {kit.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                          isFullyAvailable
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : kitAvailable > 0
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-slate-800 text-slate-500 border-slate-700/50'
                        }`}
                      >
                        {kitAvailable}/{kitTotal} {kitAvailable === 1 ? 'listo' : 'listos'}
                      </span>
                    </div>
                  </div>

                  {/* Compact Boxes Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
                    {kit.items.map(item => {
                      const isAvailable = !!item.resource;

                      return (
                        <div
                          key={item.id}
                          className={`group relative rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 min-h-[96px] ${
                            isAvailable
                              ? 'bg-slate-900/90 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 shadow-sm hover:shadow-md hover:shadow-blue-500/5'
                              : 'bg-slate-900/35 border-slate-800/50 opacity-70 hover:opacity-90'
                          }`}
                        >
                          <div>
                            {/* Top Bar: Number Badge & Status/Actions */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                                  isAvailable
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                                    : 'bg-slate-800/90 text-slate-500 border-slate-700/50'
                                }`}
                              >
                                {item.id}
                              </span>

                              {isAvailable ? (
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    Listo
                                  </span>
                                  {isAdminOrRobinson && (
                                    <button
                                      onClick={() => handleDelete(item.resource!.id, item.resource!.file_path)}
                                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                      title="Eliminar recurso"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-800/60 border border-slate-700/40 px-1.5 py-0.5 rounded">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                  Pendiente
                                </span>
                              )}
                            </div>

                            {/* Document Title */}
                            <h4
                              className={`text-xs sm:text-[13px] font-semibold mt-2 line-clamp-2 leading-snug transition-colors ${
                                isAvailable ? 'text-slate-100 group-hover:text-blue-300' : 'text-slate-400'
                              }`}
                              title={item.title}
                            >
                              {item.title}
                            </h4>
                          </div>

                          {/* Footer */}
                          <div
                            className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] ${
                              isAvailable ? 'border-slate-800/70' : 'border-slate-800/40'
                            }`}
                          >
                            {isAvailable ? (
                              <>
                                <span className="font-mono text-[10px] text-slate-500">
                                  {formatBytes(item.resource!.file_size_bytes)}
                                </span>
                                <a
                                  href={item.resource!.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors text-[11px]"
                                >
                                  <Download className="w-3 h-3" />
                                  PDF
                                </a>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] text-slate-600">Por subir</span>
                                <span className="text-slate-600 font-mono text-[10px]">—</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Otros Documentos Sueltos y Anexos */}
      {!isLoading && otherResources.length > 0 && statusFilter !== 'pending' && (
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Otros Documentos y Anexos
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              {otherResources.length} {otherResources.length === 1 ? 'archivo' : 'archivos'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {otherResources.map((resource) => (
              <div
                key={resource.id}
                className="group relative rounded-xl border border-slate-800 bg-slate-900/90 p-3 flex flex-col justify-between hover:border-slate-700 hover:bg-slate-900 transition-all duration-200 min-h-[96px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-mono text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                      EXTRA
                    </span>
                    {isAdminOrRobinson && (
                      <button
                        onClick={() => handleDelete(resource.id, resource.file_path)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <h4
                    className="text-xs sm:text-[13px] font-semibold text-slate-100 mt-2 line-clamp-2 leading-snug group-hover:text-blue-300 transition-colors"
                    title={resource.title}
                  >
                    {resource.title}
                  </h4>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/70 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-500">
                    {formatBytes(resource.file_size_bytes)}
                  </span>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors text-[11px]"
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

