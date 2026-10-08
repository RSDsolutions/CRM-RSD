'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, Upload, Trash2, Download, AlertCircle, Loader2, CheckCircle2, Lock, FolderOpen } from 'lucide-react';
import { uploadResourceAction, getResourcesAction, deleteResourceAction } from '@/app/actions/resources';

const RESOURCE_KITS = [
  {
    id: '01',
    title: 'Identidad y Presentación Corporativa',
    items: [
      { id: '#1', title: 'Ficha Institucional', expectedMatch: 'Ficha Institucional' },
      { id: '#2', title: 'Presentación Corporativa', expectedMatch: 'Presentaci' },
    ]
  },
  {
    id: '02',
    title: 'Kit Comercial del Asesor',
    items: [
      { id: '#4', title: 'Guiones y Atención Comercial', expectedMatch: 'Guiones' },
      { id: '#5', title: 'Calificación de Prospectos', expectedMatch: 'Calificaci' },
      { id: '#6', title: 'Manejo de Objeciones', expectedMatch: 'Objeciones' },
      { id: '#7', title: 'Seguimiento Comercial', expectedMatch: 'Seguimiento' },
      { id: '#8', title: 'Reunión de Diagnóstico', expectedMatch: 'Diagn' },
      { id: '#22', title: 'CRM Grow Level', expectedMatch: 'Grow Level' },
      { id: '#24', title: 'Prospección y Reactivación', expectedMatch: 'Reactivaci' },
      { id: '#25', title: 'Presentación de Demos', expectedMatch: 'Demos' },
    ]
  },
  {
    id: '03',
    title: 'Kit de Propuestas y Cierre',
    items: [
      { id: '#9', title: 'Política de Demos', expectedMatch: 'Pol' },
      { id: '#10', title: 'Propuestas Comerciales', expectedMatch: 'Propuestas' },
      { id: '#11', title: 'Plantillas de Propuestas', expectedMatch: 'Plantillas' },
      { id: '#26', title: 'Informe de Diagnóstico', expectedMatch: 'Informe' },
      { id: '#27', title: 'Análisis de Viabilidad', expectedMatch: 'Viabilidad' },
    ]
  },
  {
    id: '04',
    title: 'Kit de Levantamiento y Proyecto',
    items: [
      { id: '#12', title: 'Requerimientos y Alcance', expectedMatch: 'Requerimientos' },
      { id: '#13', title: 'Aprobación e Inicio', expectedMatch: 'Aprobaci' },
      { id: '#28', title: 'Cambios de Alcance', expectedMatch: 'Cambios' },
    ]
  },
  {
    id: '05',
    title: 'Kit de Entrega y Experiencia',
    items: [
      { id: '#14', title: 'Acta de Entrega', expectedMatch: 'Acta' },
      { id: '#15', title: 'Control de Calidad', expectedMatch: 'Control de Calidad' },
      { id: '#16', title: 'Manual del Cliente', expectedMatch: 'Manual del Cliente' },
      { id: '#18', title: 'Satisfacción y Testimonio', expectedMatch: 'Testimonio' },
    ]
  },
  {
    id: '06',
    title: 'Kit de Soporte y Postventa',
    items: [
      { id: '#17', title: 'Soporte e Incidencias', expectedMatch: 'Soporte' },
      { id: '#19', title: 'Registro de Incidencias', expectedMatch: 'Registro de Incidencias' },
      { id: '#33', title: 'Retención y Renovación', expectedMatch: 'Renovaci' },
    ]
  },
  {
    id: '07',
    title: 'Kit de Crecimiento y Referidos',
    items: [
      { id: '#34', title: 'Referidos', expectedMatch: 'Referidos' },
      { id: '#35', title: 'Alianzas y Partners', expectedMatch: 'Alianzas' },
    ]
  },
  {
    id: '08',
    title: 'Kit de Recuperación Comercial',
    items: [
      { id: '#36', title: 'Oportunidades Perdidas', expectedMatch: 'Perdidas' },
    ]
  },
  {
    id: '09',
    title: 'Kit de Gestión Comercial',
    items: [
      { id: '#21', title: 'Indicadores', expectedMatch: 'Indicadores' },
      { id: '#30', title: 'Supervisión y Evaluación', expectedMatch: 'Supervisi' },
      { id: '#31', title: 'Comisiones e Incentivos', expectedMatch: 'Comisiones' },
    ]
  },
  {
    id: '10',
    title: 'Kit de Formación',
    items: [
      { id: '#29', title: 'Onboarding de Asesores', expectedMatch: 'Onboarding' },
    ]
  },
  {
    id: '11',
    title: 'Kit de Calidad y Gestión Interna',
    items: [
      { id: '#20', title: 'Biblioteca Comercial', expectedMatch: 'Biblioteca' },
      { id: '#32', title: 'Calidad de Datos y Privacidad', expectedMatch: 'Privacidad' },
    ]
  }
];

export function RecursosView({ role }: { role: string }) {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const formData = new FormData(e.currentTarget);
    const files = formData.getAll('file') as File[];
    const description = formData.get('description') as string;
    
    const validFiles = files.filter(f => f.size > 0);

    if (validFiles.length === 0) {
      setError('Selecciona al menos un archivo.');
      setIsUploading(false);
      return;
    }

    let hasErrors = false;

    for (const file of validFiles) {
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

    if (!hasErrors) {
      e.currentTarget.reset();
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

  function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  const isAdminOrRobinson = role === 'admin' || role === 'robinson';

  const normalize = (text: string) => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Find matches and track used IDs to isolate "other resources"
  const matchedResourceIds = new Set<string>();

  const mappedKits = RESOURCE_KITS.map(kit => {
    const mappedItems = kit.items.map(item => {
      // 1) Match by exact substring ID (e.g., "#4 ")
      // 2) Or match by our normalized substring
      const found = resources.find(r => {
        const titleNorm = normalize(r.title);
        const matchesId = titleNorm.includes(normalize(item.id) + ' ');
        const matchesText = titleNorm.includes(normalize(item.expectedMatch));
        return matchesId || matchesText;
      });

      if (found) {
        matchedResourceIds.add(found.id);
      }
      return { ...item, resource: found };
    });
    return { ...kit, items: mappedItems };
  });

  const otherResources = resources.filter(r => !matchedResourceIds.has(r.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Centro de Recursos</h2>
          <p className="text-slate-400 mt-1">Materiales, guías y documentos para el equipo comercial de RSD Solutions.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Section - Only visible to admin or robinson */}
      {isAdminOrRobinson && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Subir Recursos en Lote
            </CardTitle>
            <CardDescription className="text-slate-400">Selecciona varios PDFs a la vez. El sistema los asignará automáticamente a su categoría.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-slate-300">Archivos PDF</label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf"
                    multiple
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-slate-300">Descripción General (Opcional)</label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nota interna que aplicará a todos los PDFs en esta subida..."
                />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Procesando subida...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Subir Archivos
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Main Kits Listing */}
      <div>
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">
              LIBRERÍA Y KITS DE RSD SOLUTIONS
            </span>
          </h3>
          <p className="text-slate-400 text-sm mt-1">Estructura completa de todos nuestros manuales operativos y comerciales.</p>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mappedKits.map(kit => (
              <Card key={kit.id} className="bg-slate-900 border-slate-800 shadow-none">
                <CardHeader className="py-4 border-b border-slate-800/50 bg-slate-800/20">
                  <CardTitle className="text-base text-white flex items-center gap-2.5">
                    <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded text-xs font-bold font-mono">
                      {kit.id}
                    </span>
                    {kit.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-800/50">
                    {kit.items.map(item => (
                      <div key={item.id} className="p-3 sm:px-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors group">
                        <div className="flex items-center gap-3 overflow-hidden pr-2">
                          {item.resource ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm font-medium truncate ${item.resource ? 'text-slate-200' : 'text-slate-500'}`}>
                            <span className="text-slate-500 mr-1.5 font-mono text-xs">{item.id}</span>
                            {item.title}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {item.resource ? (
                            <>
                              <a
                                href={item.resource.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors"
                                title="Descargar"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {isAdminOrRobinson && (
                                <button
                                  onClick={() => handleDelete(item.resource!.id, item.resource!.file_path)}
                                  className="p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-600 bg-slate-800 px-2 py-0.5 rounded">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Otros Recursos */}
      {!isLoading && otherResources.length > 0 && (
        <div className="pt-8">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-slate-400" />
              Otros Documentos Sueltos
            </h3>
            <p className="text-slate-400 text-sm mt-1">Archivos y anexos que no pertenecen a ningún Kit estructurado.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {otherResources.map((resource) => (
              <div key={resource.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <FileText className="w-6 h-6 text-slate-500" />
                    {isAdminOrRobinson && (
                      <button
                        onClick={() => handleDelete(resource.id, resource.file_path)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white line-clamp-2" title={resource.title}>
                    {resource.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {formatBytes(resource.file_size_bytes)}
                  </span>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Bajar
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
