'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { FileText, Upload, Trash2, Download, AlertCircle, Loader2 } from 'lucide-react';
import { uploadResourceAction, getResourcesAction, deleteResourceAction } from '@/app/actions/resources';

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
    const file = formData.get('file') as File;
    
    if (file && file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.');
      setIsUploading(false);
      return;
    }

    const { error: uploadError } = await uploadResourceAction(formData);

    if (uploadError) {
      setError(uploadError);
    } else {
      e.currentTarget.reset();
      await loadResources();
    }
    
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Recursos</h2>
          <p className="text-slate-400">Documentos y PDFs disponibles para los asesores.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Upload Section - Only visible to admin or robinson (or advisors if you prefer, but usually admins upload) */}
      {isAdminOrRobinson && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Subir Nuevo Recurso</CardTitle>
            <CardDescription className="text-slate-400">Sube un archivo PDF para compartir con el equipo de asesores.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-slate-300">Título</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Guía de Ventas 2026"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="file" className="text-sm font-medium text-slate-300">Archivo PDF</label>
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf"
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium text-slate-300">Descripción (Opcional)</label>
                <textarea
                  id="description"
                  name="description"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Breve descripción del contenido..."
                />
              </div>
              <Button type="submit" disabled={isUploading} className="w-full sm:w-auto">
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" /> Subir Recurso
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Resource List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No hay recursos disponibles</h3>
            <p className="text-slate-400">Los documentos subidos aparecerán aquí.</p>
          </div>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} className="bg-slate-900 border-slate-800 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                      <FileText className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg line-clamp-1" title={resource.title}>
                        {resource.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-xs mt-1">
                        Subido el {new Date(resource.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  {isAdminOrRobinson && (
                    <button
                      onClick={() => handleDelete(resource.id, resource.file_path)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                      title="Eliminar recurso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <p className="text-sm text-slate-300 mb-4 line-clamp-2" title={resource.description || 'Sin descripción'}>
                  {resource.description || <span className="italic text-slate-500">Sin descripción</span>}
                </p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs font-medium text-slate-500 bg-slate-800 px-2 py-1 rounded">
                    PDF • {formatBytes(resource.file_size_bytes)}
                  </span>
                  <a
                    href={resource.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Descargar
                  </a>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
