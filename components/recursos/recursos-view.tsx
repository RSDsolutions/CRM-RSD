'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, Upload, Trash2, Download, AlertCircle, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { uploadResourceAction, getResourcesAction, deleteResourceAction } from '@/app/actions/resources';

const KIT_ITEMS = [
  { id: '01', title: 'Atención', subtitle: 'Guiones y Atención Comercial', expectedMatch: 'Guiones y Atenci' },
  { id: '02', title: 'Calificación', subtitle: 'Guía de Calificación de Prospectos', expectedMatch: 'Calificaci' },
  { id: '03', title: 'Objeciones', subtitle: 'Guía de Manejo de Objeciones', expectedMatch: 'Manejo de Objeciones' },
  { id: '04', title: 'Seguimiento', subtitle: 'Proceso de Seguimiento Comercial', expectedMatch: 'Seguimiento Comercial' },
  { id: '05', title: 'Diagnóstico', subtitle: 'Guía para Reunión de Diagnóstico', expectedMatch: 'Diagn' },
  { id: '06', title: 'Demo', subtitle: 'Guía de Presentación de Demos', expectedMatch: 'Demos' },
  { id: '07', title: 'CRM', subtitle: 'Manual de Uso del CRM Grow Level', expectedMatch: 'Grow Level' },
  { id: '08', title: 'Reactivación', subtitle: 'Manual de Prospección y Reactivación de Leads', expectedMatch: 'Reactivaci' },
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

  // Helper para normalizar texto (quitar tildes y mayúsculas)
  const normalize = (text: string) => 
    text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Clasificar recursos
  const kitItemsMatched = KIT_ITEMS.map(item => {
    const found = resources.find(r => normalize(r.title).includes(normalize(item.expectedMatch)));
    return { ...item, resource: found };
  });

  const matchedResourceIds = kitItemsMatched.map(item => item.resource?.id).filter(Boolean);
  const otherResources = resources.filter(r => !matchedResourceIds.includes(r.id));

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
              Subir Recursos
            </CardTitle>
            <CardDescription className="text-slate-400">Sube PDFs para el Kit Comercial u otros documentos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-slate-300">Seleccionar Archivo(s) PDF</label>
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
                  placeholder="Descripción que se aplicará a los archivos subidos en este lote..."
                />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo archivos...
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

      {/* Kit Comercial del Asesor */}
      <div>
        <div className="mb-6 border-b border-slate-800 pb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text">
              KIT COMERCIAL DEL ASESOR
            </span>
            <span className="text-sm font-normal text-slate-500 uppercase tracking-widest ml-2">— RSD Solutions</span>
          </h3>
          <p className="text-slate-400 text-sm mt-1">El paso a paso y las guías maestras de nuestro proceso de ventas.</p>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kitItemsMatched.map((item) => (
              <div 
                key={item.id} 
                className={`relative rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                  item.resource 
                    ? 'bg-slate-900 border-slate-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10' 
                    : 'bg-slate-900/50 border-slate-800/50 opacity-80'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl font-black text-slate-800 select-none">{item.id}</span>
                    {item.resource ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <h4 className={`text-lg font-bold mb-1 ${item.resource ? 'text-white' : 'text-slate-400'}`}>
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-500 leading-snug">
                    {item.subtitle}
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  {item.resource ? (
                    <a
                      href={item.resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar PDF
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-slate-600">Pendiente...</span>
                  )}
                  
                  {item.resource && isAdminOrRobinson && (
                    <button
                      onClick={() => handleDelete(item.resource!.id, item.resource!.file_path)}
                      className="text-slate-600 hover:text-red-400 transition-colors"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Otros Recursos */}
      {!isLoading && otherResources.length > 0 && (
        <div className="pt-8">
          <div className="mb-6 border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white">Otros Recursos Adicionales</h3>
            <p className="text-slate-400 text-sm mt-1">Documentos, anexos y materiales de apoyo extra.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherResources.map((resource) => (
              <Card key={resource.id} className="bg-slate-900 border-slate-800 flex flex-col hover:border-slate-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base leading-tight line-clamp-2" title={resource.title}>
                          {resource.title}
                        </CardTitle>
                        <CardDescription className="text-slate-500 text-xs mt-1">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    {isAdminOrRobinson && (
                      <button
                        onClick={() => handleDelete(resource.id, resource.file_path)}
                        className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between pt-0">
                  {resource.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2" title={resource.description}>
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-slate-800/50 px-2 py-1 rounded">
                      {formatBytes(resource.file_size_bytes)}
                    </span>
                    <a
                      href={resource.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-blue-400 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {!isLoading && resources.length === 0 && kitItemsMatched.every(item => !item.resource) && (
        <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl mt-6">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-1">Aún no hay recursos subidos</h3>
          <p className="text-slate-400 text-sm">Los documentos del Kit Comercial y extras aparecerán aquí.</p>
        </div>
      )}
    </div>
  );
}
