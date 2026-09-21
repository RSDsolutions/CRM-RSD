'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createClient } from '@/utils/supabase/client';
import { SoftwareType, LeadStatus } from '@/types/database.types';
import { 
  Building2, 
  User, 
  Laptop, 
  FileText, 
  Calendar, 
  CalendarCheck, 
  UserCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const leadSchema = z.object({
  company_name: z.string().min(2, 'El nombre de la empresa es obligatorio'),
  contact_name: z.string().min(2, 'El nombre de la persona de contacto es obligatorio'),
  software_type: z.enum([
    'Web App', 
    'Mobile App', 
    'E-commerce', 
    'ERP/CRM', 
    'Landing Page', 
    'Otro'
  ] as const, {
    errorMap: () => ({ message: 'Selecciona un tipo de software válido' }),
  }),
  interaction_log: z.string().min(10, 'La bitácora de interacción debe tener al menos 10 caracteres'),
  appointment_scheduled: z.boolean().default(false),
  appointment_date: z.string().optional().nullable(),
  assigned_to: z.string().min(2, 'Debes ingresar el nombre del asesor comercial'),
}).refine((data) => {
  // Despliegue y validación condicional de fecha si la casilla está marcada
  if (data.appointment_scheduled && (!data.appointment_date || data.appointment_date.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'La fecha y hora de la cita son obligatorias cuando la casilla está marcada',
  path: ['appointment_date'],
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function NuevoLeadPage() {
  const router = useRouter();
  const supabase = createClient();

  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company_name: '',
      contact_name: '',
      software_type: 'Web App',
      interaction_log: '',
      appointment_scheduled: false,
      appointment_date: '',
      assigned_to: '',
    },
  });

  const appointmentScheduled = watch('appointment_scheduled');

  const onSubmit = async (data: LeadFormData) => {
    setServerError(null);
    setSuccess(false);

    try {
      const payload = {
        company_name: data.company_name.trim(),
        contact_name: data.contact_name.trim(),
        software_type: data.software_type as SoftwareType,
        interaction_log: data.interaction_log.trim(),
        appointment_scheduled: data.appointment_scheduled,
        appointment_date: data.appointment_scheduled && data.appointment_date 
          ? new Date(data.appointment_date).toISOString() 
          : null,
        status: (data.appointment_scheduled ? 'Cita Agendada' : 'Nuevo') as LeadStatus,
        assigned_to: data.assigned_to.trim(),
      };

      const { error } = await supabase.from('leads').insert([payload]);

      if (error) {
        throw new Error(error.message);
      }

      setSuccess(true);
      reset();

      // Redirigir al tablero Kanban
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);

    } catch (err: any) {
      console.error('Error al insertar lead:', err);
      setServerError(err.message || 'Ocurrió un error inesperado al guardar el lead');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Volver al Tablero Kanban
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Registrar Nuevo Lead
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingreso de prospectos calificados para asesores comerciales de RSD Solutions.
          </p>
        </div>

        {/* Notificaciones */}
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs">{serverError}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-medium">¡Lead guardado correctamente! Redirigiendo al Kanban...</p>
          </div>
        )}

        {/* Formulario */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="bg-slate-900 border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-8 space-y-6"
        >
          {/* Fila 1: Empresa y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Nombre de la Empresa
              </label>
              <input
                type="text"
                placeholder="Ej. Acme Corp"
                {...register('company_name')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              {errors.company_name && (
                <p className="text-rose-400 text-[11px] mt-1.5">{errors.company_name.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Persona de Contacto
              </label>
              <input
                type="text"
                placeholder="Ej. Roberto Sánchez"
                {...register('contact_name')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              {errors.contact_name && (
                <p className="text-rose-400 text-[11px] mt-1.5">{errors.contact_name.message}</p>
              )}
            </div>
          </div>

          {/* Fila 2: Tipo de Software y Asesor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                Tipo de Software Requerido
              </label>
              <select
                {...register('software_type')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              >
                <option value="Web App">Web App</option>
                <option value="Mobile App">Mobile App</option>
                <option value="E-commerce">E-commerce</option>
                <option value="ERP/CRM">ERP/CRM</option>
                <option value="Landing Page">Landing Page</option>
                <option value="Otro">Otro</option>
              </select>
              {errors.software_type && (
                <p className="text-rose-400 text-[11px] mt-1.5">{errors.software_type.message}</p>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                Asesor Comercial Asignado
              </label>
              <input
                type="text"
                placeholder="Nombre del asesor que tomó la llamada"
                {...register('assigned_to')}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              {errors.assigned_to && (
                <p className="text-rose-400 text-[11px] mt-1.5">{errors.assigned_to.message}</p>
              )}
            </div>
          </div>

          {/* Fila 3: Bitácora de Interacción */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Bitácora de Interacción (Requerimientos y Resumen de Llamada)
            </label>
            <textarea
              rows={4}
              placeholder="Resume lo que conversaste con el cliente: funcionalidades clave, dolores actuales, stack preferido, urgencia..."
              {...register('interaction_log')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
            {errors.interaction_log && (
              <p className="text-rose-400 text-[11px] mt-1.5">{errors.interaction_log.message}</p>
            )}
          </div>

          {/* Fila 4: Cita Agendada y DatePicker Condicional */}
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="appointment_scheduled"
                type="checkbox"
                {...register('appointment_scheduled')}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <label 
                htmlFor="appointment_scheduled" 
                className="text-xs font-medium text-slate-200 cursor-pointer select-none flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4 text-indigo-400" />
                ¿Se agendó una cita / reunión de diagnóstico?
              </label>
            </div>

            {appointmentScheduled && (
              <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <label className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  Fecha y Hora de la Cita
                </label>
                <input
                  type="datetime-local"
                  {...register('appointment_date')}
                  className="w-full sm:w-80 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
                {errors.appointment_date && (
                  <p className="text-rose-400 text-[11px]">{errors.appointment_date.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Guardando Lead...
                </>
              ) : (
                'Registrar Lead'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
