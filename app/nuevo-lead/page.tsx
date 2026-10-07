'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Building2, 
  User, 
  Laptop, 
  Calendar, 
  CalendarCheck, 
  UserCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Globe,
  Share2,
  Briefcase,
  HelpCircle,
  DollarSign,
  Users2,
  Clock,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { BUSINESS_NICHES, BusinessNiche, SoftwareType } from '@/types/database.types';
import { checkLeadDuplicatesAction, createEnrichedLeadAction, getComercialAdvisorsAction, DuplicateCheckResult } from '@/app/actions/leads';

const leadSchema = z.object({
  company_name: z.string().min(2, 'El nombre comercial de la empresa es obligatorio'),
  legal_name: z.string().optional(),
  tax_id: z.string().optional(),
  niche: z.string().min(2, 'Selecciona un nicho empresarial'),
  city: z.string().optional(),
  province: z.string().optional(),
  website: z.string().optional(),
  social_media: z.string().optional(),
  
  contact_name: z.string().min(2, 'El nombre del contacto es obligatorio'),
  contact_role: z.string().optional(),
  phone: z.string().min(7, 'El teléfono debe tener al menos 7 dígitos').optional().or(z.literal('')),
  whatsapp: z.string().optional(),
  email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
  contact_preference: z.string().default('WhatsApp'),

  software_type: z.enum([
    'Web App', 
    'Mobile App', 
    'E-commerce', 
    'ERP/CRM', 
    'Landing Page', 
    'Otro'
  ] as const),
  current_management_method: z.string().default('Excel'),
  team_size: z.string().optional(),
  main_need: z.string().optional(),
  problem_description: z.string().optional(),
  reference_budget: z.string().optional(),

  lead_source: z.string().default('Meta/Facebook'),
  campaign: z.string().optional(),
  priority: z.enum(['Alta', 'Media', 'Baja']).default('Media'),
  assigned_to: z.string().min(2, 'Ingresa el asesor responsable'),
  next_action: z.string().default('Primer contacto y calificación comercial'),
  next_followup_date: z.string().optional(),

  appointment_scheduled: z.boolean().default(false),
  appointment_date: z.string().optional().nullable(),
}).refine((data) => {
  if (data.appointment_scheduled && (!data.appointment_date || data.appointment_date.trim() === '')) {
    return false;
  }
  return true;
}, {
  message: 'La fecha y hora son obligatorias si la cita está marcada',
  path: ['appointment_date'],
});

type LeadFormData = z.infer<typeof leadSchema>;

export default function NuevoLeadPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'empresa' | 'contacto' | 'necesidad' | 'comercial'>('empresa');
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [advisors, setAdvisors] = useState<string[]>(['Robinson Solórzano']);

  useEffect(() => {
    async function loadAdvisors() {
      const res = await getComercialAdvisorsAction();
      if (res.success && res.advisors && res.advisors.length > 0) {
        setAdvisors(res.advisors);
      }
    }
    loadAdvisors();
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      company_name: '',
      legal_name: '',
      tax_id: '',
      niche: 'Distribuidora / mayorista',
      city: 'Guayaquil',
      province: 'Guayas',
      website: '',
      social_media: '',
      contact_name: '',
      contact_role: 'Gerente General / Propietario',
      phone: '',
      whatsapp: '',
      email: '',
      contact_preference: 'WhatsApp',
      software_type: 'ERP/CRM',
      current_management_method: 'Excel',
      team_size: '5 a 15 personas',
      main_need: '',
      problem_description: '',
      reference_budget: '',
      lead_source: 'Meta/Facebook',
      campaign: 'Campaña Meta - Software a Medida',
      priority: 'Media',
      assigned_to: 'Robinson Solórzano',
      next_action: 'Contactar vía WhatsApp para agendar Diagnóstico Gratuito de 30 min',
      next_followup_date: '',
      appointment_scheduled: false,
      appointment_date: '',
    },
  });

  const appointmentScheduled = watch('appointment_scheduled');
  const phoneValue = watch('phone');
  const emailValue = watch('email');

  const checkDuplicates = async () => {
    if ((phoneValue && phoneValue.length >= 7) || (emailValue && emailValue.length >= 5)) {
      const res = await checkLeadDuplicatesAction(phoneValue, emailValue);
      if (res.hasDuplicate) {
        setDuplicateWarning(res);
      } else {
        setDuplicateWarning(null);
      }
    }
  };

  const onSubmit = async (data: LeadFormData) => {
    setServerError(null);
    setSuccess(false);

    const payload = {
      company_name: data.company_name.trim(),
      legal_name: data.legal_name?.trim() || null,
      tax_id: data.tax_id?.trim() || null,
      niche: data.niche as BusinessNiche,
      city: data.city?.trim() || null,
      province: data.province?.trim() || null,
      website: data.website?.trim() || null,
      social_media: data.social_media?.trim() || null,
      contact_name: data.contact_name.trim(),
      contact_role: data.contact_role?.trim() || null,
      phone: data.phone?.trim() || null,
      whatsapp: data.whatsapp?.trim() || data.phone?.trim() || null,
      email: data.email?.trim() || null,
      contact_preference: data.contact_preference,
      software_type: data.software_type as SoftwareType,
      current_management_method: data.current_management_method,
      team_size: data.team_size || null,
      main_need: data.main_need?.trim() || null,
      problem_description: data.problem_description?.trim() || null,
      reference_budget: data.reference_budget?.trim() || null,
      interaction_log: `Ingreso inicial en CRM. Método actual: ${data.current_management_method}. Necesidad: ${data.main_need || 'Sin especificar'}.`,
      lead_source: data.lead_source as any,
      campaign: data.campaign?.trim() || null,
      priority: data.priority,
      assigned_to: data.assigned_to.trim(),
      next_action: data.next_action.trim(),
      next_followup_date: data.next_followup_date ? new Date(data.next_followup_date).toISOString() : null,
      appointment_scheduled: data.appointment_scheduled,
      appointment_date: data.appointment_scheduled && data.appointment_date 
        ? new Date(data.appointment_date).toISOString() 
        : null,
      status: (data.appointment_scheduled ? 'Diagnóstico' : 'Nuevo') as any,
    };

    const result = await createEnrichedLeadAction(payload);

    if (!result.success) {
      setServerError(result.error || 'Ocurrió un error al guardar el prospecto.');
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabecera y botón regresar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Tablero Kanban
          </Link>
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
            Ingreso de Prospecto / Grow Level
          </span>
        </div>

        {/* Alerta de duplicados */}
        {duplicateWarning?.hasDuplicate && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Posible Prospecto Duplicado:</span> Ya existe un lead registrado con el mismo {duplicateWarning.duplicateField === 'phone' ? 'teléfono' : 'correo'}: <span className="font-semibold text-white">{duplicateWarning.existingLead?.company_name}</span> ({duplicateWarning.existingLead?.contact_name}). Puedes continuar si corresponde a otra oportunidad.
            </div>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header del onboarding comercial */}
          <div className="border-b border-slate-800 px-6 sm:px-8 py-6 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  Onboarding Comercial de Prospectos
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 mt-1 tracking-tight">
                  <Building2 className="w-5 h-5 text-indigo-400" />
                  Registro de Nuevo Prospecto
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Captura datos comerciales, califica necesidades de software y agenda el diagnóstico inicial.
                </p>
              </div>

              {/* Porcentaje de progreso */}
              <div className="flex items-center gap-3 bg-slate-950/60 border border-slate-800 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                <span className="text-[11px] text-slate-400 font-medium">Progreso</span>
                <span className="text-xs font-bold text-indigo-300 font-mono">
                  {activeTab === 'empresa' ? '25%' : activeTab === 'contacto' ? '50%' : activeTab === 'necesidad' ? '75%' : '100%'}
                </span>
              </div>
            </div>

            {/* Stepper Visual Bar */}
            <div className="mt-6 pt-2">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'empresa', step: 1, label: 'Empresa', icon: Building2 },
                  { id: 'contacto', step: 2, label: 'Contacto', icon: User },
                  { id: 'necesidad', step: 3, label: 'Necesidad', icon: Briefcase },
                  { id: 'comercial', step: 4, label: 'Comercial', icon: Clock },
                ].map((s) => {
                  const Icon = s.icon;
                  const isCurrent = activeTab === s.id;
                  const isCompleted = 
                    (s.step === 1 && (activeTab === 'contacto' || activeTab === 'necesidad' || activeTab === 'comercial')) ||
                    (s.step === 2 && (activeTab === 'necesidad' || activeTab === 'comercial')) ||
                    (s.step === 3 && activeTab === 'comercial');

                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setActiveTab(s.id as any)}
                      className="group flex flex-col items-center sm:items-start text-left text-xs transition-all"
                    >
                      <div className="flex items-center gap-2 w-full mb-1.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                            isCurrent
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                              : isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isCompleted ? '✓' : s.step}
                        </div>
                        <span
                          className={`hidden sm:inline font-semibold truncate ${
                            isCurrent
                              ? 'text-white'
                              : isCompleted
                              ? 'text-slate-300'
                              : 'text-slate-500'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div
                        className={`w-full h-1 rounded-full transition-colors ${
                          isCurrent
                            ? 'bg-indigo-500'
                            : isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-slate-800'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-6">
            
            {/* PESTAÑA 1: DATOS DE LA EMPRESA */}
            {activeTab === 'empresa' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nombre Comercial <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('company_name')}
                      placeholder="Ej. Distribuidora del Pacífico"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {errors.company_name && (
                      <p className="text-xs text-rose-400 mt-1">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Razón Social (opcional)
                    </label>
                    <input
                      type="text"
                      {...register('legal_name')}
                      placeholder="Ej. DisPacífico S.A."
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      RUC / Identificación Fiscal (opcional)
                    </label>
                    <input
                      type="text"
                      {...register('tax_id')}
                      placeholder="Ej. 0991234567001"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nicho Empresarial <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('niche')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {BUSINESS_NICHES.map((niche) => (
                        <option key={niche} value={niche}>{niche}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      {...register('city')}
                      placeholder="Ej. Guayaquil"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Provincia
                    </label>
                    <input
                      type="text"
                      {...register('province')}
                      placeholder="Ej. Guayas"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Sitio Web
                    </label>
                    <input
                      type="text"
                      {...register('website')}
                      placeholder="https://empresa.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Redes Sociales
                    </label>
                    <input
                      type="text"
                      {...register('social_media')}
                      placeholder="Instagram, Facebook o LinkedIn"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('contacto')}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Siguiente: Contacto Principal →
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: CONTACTO PRINCIPAL */}
            {activeTab === 'contacto' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Nombre Completo del Contacto <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('contact_name')}
                      placeholder="Ej. Ing. Carlos Mendoza"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {errors.contact_name && (
                      <p className="text-xs text-rose-400 mt-1">{errors.contact_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cargo o Rol
                    </label>
                    <input
                      type="text"
                      {...register('contact_role')}
                      placeholder="Ej. Gerente General / Socio / Director"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      onBlur={checkDuplicates}
                      placeholder="Ej. +593 99 123 4567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      {...register('whatsapp')}
                      placeholder="Ej. 0991234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      onBlur={checkDuplicates}
                      placeholder="carlos@empresa.com"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Preferencia de Contacto
                    </label>
                    <select
                      {...register('contact_preference')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="WhatsApp">WhatsApp (Recomendado)</option>
                      <option value="Llamada">Llamada telefónica</option>
                      <option value="Correo">Correo electrónico</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('empresa')}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    ← Volver a Empresa
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('necesidad')}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Siguiente: Necesidad →
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: SITUACIÓN Y NECESIDAD */}
            {activeTab === 'necesidad' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tipo de Software Solicitado <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('software_type')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="ERP/CRM">ERP / Mini-CRM a Medida</option>
                      <option value="Web App">Web Application / Portal</option>
                      <option value="Mobile App">Mobile App (Android/iOS)</option>
                      <option value="E-commerce">E-commerce / Tienda B2B</option>
                      <option value="Landing Page">Landing Page de Conversión</option>
                      <option value="Otro">Otro Sistema Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Método de Gestión Actual
                    </label>
                    <select
                      {...register('current_management_method')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Excel">Hojas de Excel / Google Sheets</option>
                      <option value="WhatsApp">WhatsApp y notas de voz</option>
                      <option value="Cuaderno">Cuaderno / Papel / Manual</option>
                      <option value="Software antiguo">Software antiguo / Enlatado rígido</option>
                      <option value="Múltiples herramientas">Múltiples herramientas desintegradas</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Tamaño del Equipo / Usuarios Previstos
                    </label>
                    <input
                      type="text"
                      {...register('team_size')}
                      placeholder="Ej. 10 personas (3 administrativos, 7 en campo)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Presupuesto Referencial (si lo comunicó)
                    </label>
                    <input
                      type="text"
                      {...register('reference_budget')}
                      placeholder="Ej. $1,500 - $3,000 USD"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Necesidad Principal
                  </label>
                  <input
                    type="text"
                    {...register('main_need')}
                    placeholder="Ej. Centralizar pedidos, inventario multisede y seguimiento de cobros"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descripción Inicial del Problema
                  </label>
                  <textarea
                    rows={3}
                    {...register('problem_description')}
                    placeholder="Detalles sobre qué cuellos de botella experimenta el negocio, pérdidas de tiempo o errores recurrentes..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('contacto')}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    ← Volver a Contacto
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('comercial')}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    Siguiente: Gestión Comercial →
                  </button>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: GESTIÓN COMERCIAL Y AGENDAMIENTO */}
            {activeTab === 'comercial' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Canal de Origen <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('lead_source')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Meta/Facebook">Meta Ads (Facebook / Instagram via Grow Level)</option>
                      <option value="Instagram Ads">Instagram Direct</option>
                      <option value="Google Ads">Google Ads / Web</option>
                      <option value="Referido">Referido de cliente actual</option>
                      <option value="Directo">Contacto Directo / Networking</option>
                      <option value="Alianza">Alianza Estratégica</option>
                      <option value="Otro">Otro Canal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Campaña o Referencia
                    </label>
                    <input
                      type="text"
                      {...register('campaign')}
                      placeholder="Ej. Campaña ERP Clínicas Sep-Oct"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Prioridad Comercial
                    </label>
                    <select
                      {...register('priority')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Alta">Alta (Urgente / Decisor directo)</option>
                      <option value="Media">Media (Interés activo)</option>
                      <option value="Baja">Baja (Solo cotizando / Exploratorio)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Asesor Responsable <span className="text-rose-500">*</span>
                    </label>
                    <select
                      {...register('assigned_to')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      {advisors.map(adv => (
                        <option key={adv} value={adv}>{adv}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Próxima Acción Comercial
                    </label>
                    <input
                      type="text"
                      {...register('next_action')}
                      placeholder="Ej. Enviar mensaje de WhatsApp para agendar diagnóstico"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Fecha del Próximo Seguimiento
                    </label>
                    <input
                      type="datetime-local"
                      {...register('next_followup_date')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Agendamiento directo de Diagnóstico */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="appointment_scheduled"
                      {...register('appointment_scheduled')}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
                    />
                    <label htmlFor="appointment_scheduled" className="text-xs font-semibold text-white cursor-pointer select-none">
                      ¿Ya se acordó fecha para el Diagnóstico Gratuito de 30 min con Robinson?
                    </label>
                  </div>

                  {appointmentScheduled && (
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Fecha y Hora del Diagnóstico <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        {...register('appointment_date')}
                        className="w-full sm:w-80 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      {errors.appointment_date && (
                        <p className="text-xs text-rose-400 mt-1">{errors.appointment_date.message}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('necesidad')}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  >
                    ← Volver a Situación
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando Prospecto...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Guardar Prospecto en CRM
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Mensajes de servidor */}
            {serverError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {serverError}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Prospecto registrado con éxito. Redirigiendo al Kanban...
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
