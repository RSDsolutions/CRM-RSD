'use client';

import { useState } from 'react';
import { Client, ClientContact } from '@/types/database.types';
import { updateClientAction } from '@/app/actions/clients';
import {
  Building2, Phone, Mail, Globe, MapPin, FileText,
  ArrowLeft, Pencil, Save, Loader2, CheckCircle2, AlertCircle,
  Hash, Calendar, X, UserCircle2, PlusCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface ClientProfileViewProps {
  client: Client;
  contacts: ClientContact[];
}

const STATUS_OPTIONS = ['Activo', 'Inactivo', 'Suspendido'] as const;

const STATUS_BADGE: Record<string, string> = {
  'Activo':     'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Inactivo':   'bg-slate-700/30 text-slate-400 border-slate-700',
  'Suspendido': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
};

export function ClientProfileView({ client, contacts }: ClientProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client>(client);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const formData = new FormData(e.currentTarget);
      await updateClientAction(currentClient.id, formData);
      // Actualizar estado local
      const updated: Client = {
        ...currentClient,
        company_name: formData.get('company_name') as string,
        trade_name:   formData.get('trade_name') as string || null,
        tax_id:       formData.get('tax_id') as string || null,
        industry:     formData.get('industry') as string || null,
        website:      formData.get('website') as string || null,
        phone:        formData.get('phone') as string || null,
        whatsapp:     formData.get('whatsapp') as string || null,
        email:        formData.get('email') as string || null,
        address:      formData.get('address') as string || null,
        city:         formData.get('city') as string || null,
        country:      formData.get('country') as string || 'Ecuador',
        status:       (formData.get('status') as Client['status']) || 'Activo',
        notes:        formData.get('notes') as string || null,
      };
      setCurrentClient(updated);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div>
          <Link
            href="/clientes"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver a Clientes
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {currentClient.company_name}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_BADGE[currentClient.status] ?? ''}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              {currentClient.status}
            </span>
          </div>
          {currentClient.trade_name && (
            <p className="text-xs text-slate-400 mt-0.5">{currentClient.trade_name}</p>
          )}
          <p className="text-[10px] text-slate-500 mt-1">
            Cliente desde {format(parseISO(currentClient.converted_at), "d 'de' MMMM yyyy", { locale: es })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {error && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Cliente actualizado correctamente.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel principal: datos del cliente */}
        <div className="lg:col-span-2 space-y-4">
          
          {editing ? (
            /* MODO EDICIÓN */
            <form onSubmit={handleUpdate} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                Editar datos del cliente
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Empresa *</label>
                  <input name="company_name" defaultValue={currentClient.company_name} required className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Nombre comercial</label>
                  <input name="trade_name" defaultValue={currentClient.trade_name ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">RUC / NIT</label>
                  <input name="tax_id" defaultValue={currentClient.tax_id ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Industria</label>
                  <input name="industry" defaultValue={currentClient.industry ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Estado</label>
                  <select name="status" defaultValue={currentClient.status} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input name="phone" defaultValue={currentClient.phone ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">WhatsApp</label>
                  <input name="whatsapp" defaultValue={currentClient.whatsapp ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
                  <input name="email" type="email" defaultValue={currentClient.email ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Sitio web</label>
                  <input name="website" type="url" defaultValue={currentClient.website ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Ciudad</label>
                  <input name="city" defaultValue={currentClient.city ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">País</label>
                  <select name="country" defaultValue={currentClient.country} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="Ecuador">Ecuador</option>
                    <option value="Colombia">Colombia</option>
                    <option value="Perú">Perú</option>
                    <option value="México">México</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Chile">Chile</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Dirección</label>
                  <input name="address" defaultValue={currentClient.address ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Notas</label>
                  <textarea name="notes" rows={3} defaultValue={currentClient.notes ?? ''} className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all disabled:opacity-50">
                  {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando...</> : <><Save className="w-3.5 h-3.5" />Guardar Cambios</>}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-xs font-medium transition-all">
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            /* MODO VISTA */
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
                Información del Cliente
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  { icon: <Hash className="w-3.5 h-3.5" />, label: 'RUC / NIT', value: currentClient.tax_id },
                  { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Industria', value: currentClient.industry },
                  { icon: <Phone className="w-3.5 h-3.5" />, label: 'Teléfono', value: currentClient.phone },
                  { icon: <Phone className="w-3.5 h-3.5" />, label: 'WhatsApp', value: currentClient.whatsapp },
                  { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: currentClient.email },
                  { icon: <Globe className="w-3.5 h-3.5" />, label: 'Web', value: currentClient.website },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Ciudad', value: currentClient.city },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'País', value: currentClient.country },
                  { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Dirección', value: currentClient.address },
                ].map(({ icon, label, value }) =>
                  value ? (
                    <div key={label} className="flex items-start gap-2 py-1.5 border-b border-slate-800/60">
                      <span className="text-indigo-400 mt-0.5 flex-shrink-0">{icon}</span>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase tracking-wider block">{label}</span>
                        <span className="text-slate-200 font-medium">{value}</span>
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              {currentClient.notes && (
                <div className="pt-3 border-t border-slate-800">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Notas internas
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{currentClient.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: contactos y metadata */}
        <div className="space-y-4">

          {/* Lead de origen */}
          {currentClient.lead_id && (
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Lead de origen</p>
              <Link
                href={`/?lead=${currentClient.lead_id}`}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-medium"
              >
                Ver lead en Kanban →
              </Link>
            </div>
          )}

          {/* Contactos */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <UserCircle2 className="w-3.5 h-3.5" /> Contactos
              </p>
              <span className="text-[10px] font-semibold text-slate-400">{contacts.length}</span>
            </div>

            {contacts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">Sin contactos registrados</p>
            ) : (
              <div className="space-y-2.5">
                {contacts.map((contact) => (
                  <div key={contact.id} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-200">{contact.full_name}</p>
                      {contact.is_primary && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    {contact.job_title && <p className="text-[10px] text-slate-500 mt-0.5">{contact.job_title}</p>}
                    {contact.email && <p className="text-[10px] text-slate-400 mt-1">{contact.email}</p>}
                    {contact.phone && <p className="text-[10px] text-slate-500">{contact.phone}</p>}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[10px] text-slate-600 text-center mt-3">
              Gestión de contactos disponible en Fase 2+
            </p>
          </div>

          {/* Metadatos */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Historial
            </p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Convertido</span>
                <span>{format(parseISO(currentClient.converted_at), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Creado</span>
                <span>{format(parseISO(currentClient.created_at), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Actualizado</span>
                <span>{format(parseISO(currentClient.updated_at), 'dd/MM/yyyy', { locale: es })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
