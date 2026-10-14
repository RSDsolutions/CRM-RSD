'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Video, 
  MapPin, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Loader2,
  Phone,
  Building2,
  FileCheck,
  Search,
  Users,
  Sparkles,
  Ban,
  Lock,
  Coffee,
  Plane,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { AvailabilityBlock, Meeting, MeetingStatus, UserRole, WeeklySchedule } from '@/types/database.types';
import { 
  getAgendaScheduleAction, 
  createAvailabilityBlockAction, 
  deleteAvailabilityBlockAction,
  bookMeetingSlotAction,
  updateMeetingStatusAction,
  saveWeeklySchedulesAction
} from '@/app/actions/agenda';

export interface LeadSummary {
  id: string;
  company_name: string;
  contact_name: string;
  phone?: string | null;
  email?: string | null;
  status: string;
  software_type?: string;
}

interface AgendaViewProps {
  initialRole: UserRole;
  userEmail: string;
  initialLeadId?: string;
}

export function AgendaView({ initialRole, userEmail, initialLeadId }: AgendaViewProps) {
  const isAdmin = initialRole === 'admin';
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<{
    robinson: any;
    blocks: AvailabilityBlock[];
    meetings: Meeting[];
    weeklySchedules: WeeklySchedule[];
    leads?: LeadSummary[];
  }>({ robinson: null, blocks: [], meetings: [], weeklySchedules: [], leads: [] });

  // Modales
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<Meeting | null>(null);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>('');
  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'cards'>('grid');

  // Modo de asociación de reunión: con lead existente, sin lead (general), o prospecto manual
  const [meetingTargetMode, setMeetingTargetMode] = useState<'lead' | 'none' | 'manual'>('lead');
  const [selectedLeadId, setSelectedLeadId] = useState<string>(initialLeadId || '');
  const [leadSearchTerm, setLeadSearchTerm] = useState<string>('');

  // Estados de formulario
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulario de Reserva
  const [bookingForm, setBookingForm] = useState({
    title: 'Diagnóstico Gratuito 30 min',
    generalTitle: '',
    meeting_type: 'Diagnóstico',
    startTime: '',
    endTime: '',
    leadName: '',
    companyName: '',
    modality: 'Virtual',
    meetingUrl: 'https://meet.google.com/rsd-diagnostico',
    objective: 'Revisión de procesos y diagnóstico de necesidades de software',
    notes: '',
  });

  const getLocalDatetimeString = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // Pre-seleccionar lead si se pasó initialLeadId por query params o props
  useEffect(() => {
    if (initialLeadId && scheduleData.leads && scheduleData.leads.length > 0) {
      const foundLead = scheduleData.leads.find(l => l.id === initialLeadId);
      if (foundLead) {
        setSelectedLeadId(foundLead.id);
        setMeetingTargetMode('lead');
        setBookingForm(prev => ({
          ...prev,
          companyName: foundLead.company_name,
          leadName: foundLead.contact_name,
          startTime: prev.startTime || getLocalDatetimeString(new Date()),
          endTime: prev.endTime || getLocalDatetimeString(new Date(Date.now() + 30 * 60 * 1000)),
        }));
        setShowBookingModal(true);
      }
    }
  }, [initialLeadId, scheduleData.leads]);

  // Formulario de Excepción / Bloqueo (Admin)
  const [blockType, setBlockType] = useState<'hours' | 'day' | 'range' | 'custom_avail'>('hours');
  const [availForm, setAvailForm] = useState({
    title: 'Bloqueo Personal',
    slot_type: 'Bloqueo Personal',
    date: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '13:00',
    endTime: '15:00',
    is_available: false,
    notes: '',
  });

  const openBlockModalForDay = (date: Date, mode: 'hours' | 'day') => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setBlockType(mode);
    setAvailForm(prev => ({
      ...prev,
      date: dateStr,
      endDate: dateStr,
      title: mode === 'day' ? 'Día Bloqueado / No disponible' : 'Bloqueo Personal (Horas)',
      slot_type: 'Bloqueo Personal',
      is_available: false,
      startTime: '13:00',
      endTime: '15:00',
    }));
    setShowBlockModal(true);
  };

  const [weeklyForm, setWeeklyForm] = useState({
    morningStart: '09:00',
    morningEnd: '13:00',
    afternoonStart: '15:00',
    afternoonEnd: '18:00',
    days: [1, 2, 3, 4, 5], // 1=Lunes, 5=Viernes
  });

  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(currentWeekStart, i)); // Lunes a Sábado

  // Configuración de la cuadrícula de 30 minutos (08:00 a 20:00)
  const START_HOUR = 8;
  const END_HOUR = 20;
  const SLOT_HEIGHT = 44; // Altura en px por cada intervalo de 30 minutos
  const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 24 medias horas

  const timeSlots = Array.from({ length: TOTAL_SLOTS }, (_, i) => {
    const totalMinutes = START_HOUR * 60 + i * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    const isHour = m === 0;
    return { timeStr, isHour, totalMinutes };
  });

  const getEventPosition = (startTimeStr: string, endTimeStr: string, dayDate: Date) => {
    const start = parseISO(startTimeStr);
    const end = parseISO(endTimeStr);

    const dayStartZero = new Date(dayDate);
    dayStartZero.setHours(START_HOUR, 0, 0, 0);

    const dayEndZero = new Date(dayDate);
    dayEndZero.setHours(END_HOUR, 0, 0, 0);

    const clampedStart = Math.max(start.getTime(), dayStartZero.getTime());
    const clampedEnd = Math.min(end.getTime(), dayEndZero.getTime());

    if (clampedEnd <= clampedStart) return null;

    const startMinutes = (clampedStart - dayStartZero.getTime()) / (1000 * 60);
    const durationMinutes = (clampedEnd - clampedStart) / (1000 * 60);

    const pxPerMinute = SLOT_HEIGHT / 30;
    const top = startMinutes * pxPerMinute;
    const height = Math.max(durationMinutes * pxPerMinute, 24);

    return { top, height };
  };

  const loadSchedule = async () => {
    setLoading(true);
    const startStr = currentWeekStart.toISOString();
    const endStr = addDays(currentWeekStart, 7).toISOString();
    try {
      const data = await getAgendaScheduleAction(startStr, endStr);
      setScheduleData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedule();
  }, [currentWeekStart]);

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Manejar selección de lead existente
  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) {
      setBookingForm(prev => ({
        ...prev,
        companyName: '',
        leadName: '',
      }));
      return;
    }
    const lead = scheduleData.leads?.find(l => l.id === leadId);
    if (lead) {
      setBookingForm(prev => ({
        ...prev,
        companyName: lead.company_name,
        leadName: lead.contact_name,
        objective: prev.objective || `Diagnóstico comercial y necesidades de ${lead.company_name}`,
      }));
    }
  };

  // Manejar cambio de modo (con lead, sin lead, manual)
  const handleSwitchMode = (mode: 'lead' | 'none' | 'manual') => {
    setMeetingTargetMode(mode);
    if (mode === 'none') {
      if (!bookingForm.generalTitle) {
        setBookingForm(prev => ({
          ...prev,
          generalTitle: prev.meeting_type === 'Diagnóstico' ? 'Reunión General / Interna' : prev.meeting_type,
        }));
      }
    } else if (mode === 'lead' && selectedLeadId) {
      const lead = scheduleData.leads?.find(l => l.id === selectedLeadId);
      if (lead) {
        setBookingForm(prev => ({
          ...prev,
          companyName: lead.company_name,
          leadName: lead.contact_name,
        }));
      }
    }
  };

  // Guardar Bloqueo/Disponibilidad (Admin)
  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    let startDateTime: string;
    let endDateTime: string;
    let isAvailable = false;
    let isAllDay = false;
    let slotType = availForm.slot_type || 'Bloqueo Personal';

    if (blockType === 'hours') {
      startDateTime = new Date(`${availForm.date}T${availForm.startTime}:00`).toISOString();
      endDateTime = new Date(`${availForm.date}T${availForm.endTime}:00`).toISOString();
      isAvailable = false;
      isAllDay = false;
    } else if (blockType === 'day') {
      startDateTime = new Date(`${availForm.date}T00:00:00`).toISOString();
      endDateTime = new Date(`${availForm.date}T23:59:59.999`).toISOString();
      isAvailable = false;
      isAllDay = true;
    } else if (blockType === 'range') {
      startDateTime = new Date(`${availForm.date}T00:00:00`).toISOString();
      endDateTime = new Date(`${availForm.endDate}T23:59:59.999`).toISOString();
      isAvailable = false;
      isAllDay = true;
    } else {
      // custom_avail
      startDateTime = new Date(`${availForm.date}T${availForm.startTime}:00`).toISOString();
      endDateTime = new Date(`${availForm.date}T${availForm.endTime}:00`).toISOString();
      isAvailable = true;
      isAllDay = false;
      slotType = availForm.slot_type || 'Diagnóstico';
    }

    if (new Date(endDateTime) <= new Date(startDateTime)) {
      setFeedback({ type: 'error', text: 'La fecha u hora de finalización debe ser posterior a la de inicio.' });
      setSubmitting(false);
      return;
    }

    const res = await createAvailabilityBlockAction({
      title: availForm.title.trim() || (isAvailable ? 'Disponibilidad Extraordinaria' : isAllDay ? 'Día Bloqueado' : 'Horario Bloqueado'),
      slot_type: slotType,
      start_time: startDateTime,
      end_time: endDateTime,
      is_available: isAvailable,
      is_all_day: isAllDay,
      notes: availForm.notes,
      target_user_id: scheduleData.robinson?.id,
    });

    setSubmitting(false);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Error al guardar la excepción o bloqueo.' });
    } else {
      setFeedback({ 
        type: 'success', 
        text: isAvailable 
          ? '✅ Horario extraordinario habilitado correctamente.' 
          : isAllDay 
          ? '✅ Día(s) bloqueado(s) exitosamente en la agenda.' 
          : '✅ Horario bloqueado exitosamente en la agenda.' 
      });
      setShowBlockModal(false);
      loadSchedule();
    }
  };

  const handleSaveWeeklySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    if (!scheduleData.robinson?.id) {
      setFeedback({ type: 'error', text: 'No se encontró el perfil de Robinson.' });
      setSubmitting(false);
      return;
    }

    const schedulesToSave: { day_of_week: number; start_time: string; end_time: string }[] = [];
    for (const day of weeklyForm.days) {
      if (weeklyForm.morningStart && weeklyForm.morningEnd) {
        schedulesToSave.push({
          day_of_week: day,
          start_time: weeklyForm.morningStart,
          end_time: weeklyForm.morningEnd,
        });
      }
      if (weeklyForm.afternoonStart && weeklyForm.afternoonEnd) {
        schedulesToSave.push({
          day_of_week: day,
          start_time: weeklyForm.afternoonStart,
          end_time: weeklyForm.afternoonEnd,
        });
      }
    }

    const res = await saveWeeklySchedulesAction(scheduleData.robinson.id, schedulesToSave);
    setSubmitting(false);

    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'Error al guardar el horario semanal.' });
    } else {
      setFeedback({ type: 'success', text: 'Horario semanal configurado correctamente.' });
      setShowWeeklyModal(false);
      loadSchedule();
    }
  };

  // Reservar Cita (Con lead seleccionado, sin lead general, o manual)
  const handleBookMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    if (!scheduleData.robinson?.id) {
      setFeedback({ type: 'error', text: 'No se encontró el perfil de Robinson en el sistema.' });
      setSubmitting(false);
      return;
    }

    if (!bookingForm.startTime || !bookingForm.endTime) {
      setFeedback({ type: 'error', text: 'Por favor define la fecha y hora de inicio y fin.' });
      setSubmitting(false);
      return;
    }

    let finalTitle = '';
    let finalLeadId: string | null = null;

    if (meetingTargetMode === 'lead') {
      if (!selectedLeadId) {
        setFeedback({ type: 'error', text: 'Por favor selecciona un prospecto de la lista o cambia la opción a "Sin Lead / General".' });
        setSubmitting(false);
        return;
      }
      finalLeadId = selectedLeadId;
      const selectedLead = scheduleData.leads?.find(l => l.id === selectedLeadId);
      const companyOrContact = selectedLead?.company_name || selectedLead?.contact_name || bookingForm.companyName || bookingForm.leadName;
      finalTitle = `${bookingForm.meeting_type} - ${companyOrContact}`;
    } else if (meetingTargetMode === 'manual') {
      if (!bookingForm.companyName.trim() && !bookingForm.leadName.trim()) {
        setFeedback({ type: 'error', text: 'Por favor ingresa el nombre de la empresa o contacto del prospecto.' });
        setSubmitting(false);
        return;
      }
      finalTitle = `${bookingForm.meeting_type} - ${bookingForm.companyName.trim() || bookingForm.leadName.trim()}`;
      finalLeadId = null;
    } else {
      // Sin lead en específico (reunión general o interna)
      if (!bookingForm.generalTitle.trim()) {
        setFeedback({ type: 'error', text: 'Por favor ingresa el título o asunto de la reunión.' });
        setSubmitting(false);
        return;
      }
      finalTitle = bookingForm.generalTitle.trim();
      finalLeadId = null;
    }

    const res = await bookMeetingSlotAction({
      title: finalTitle,
      meeting_type: bookingForm.meeting_type,
      host_id: scheduleData.robinson.id,
      lead_id: finalLeadId,
      start_time: new Date(bookingForm.startTime).toISOString(),
      end_time: new Date(bookingForm.endTime).toISOString(),
      modality: bookingForm.modality,
      meeting_url: bookingForm.meetingUrl,
      objective: bookingForm.objective,
      notes: bookingForm.notes,
    });

    setSubmitting(false);
    if (!res.success) {
      setFeedback({ type: 'error', text: res.error || 'No se pudo reservar la cita.' });
    } else {
      setFeedback({ type: 'success', text: '✅ Cita reservada y confirmada con éxito. Horario bloqueado en la agenda.' });
      setShowBookingModal(false);
      setSelectedLeadId('');
      setLeadSearchTerm('');
      setBookingForm(prev => ({
        ...prev,
        generalTitle: '',
        companyName: '',
        leadName: '',
      }));
      loadSchedule();
    }
  };

  // Registrar resultado de reunión
  const handleUpdateStatus = async (meetingId: string, status: MeetingStatus, resultText: string) => {
    setSubmitting(true);
    const res = await updateMeetingStatusAction(meetingId, {
      status,
      result: resultText,
    });
    setSubmitting(false);
    if (res.success) {
      setShowOutcomeModal(null);
      loadSchedule();
    }
  };

  const openBookingForSlot = (date: Date, hourStr: string) => {
    const start = new Date(date);
    const [h, m] = hourStr.split(':').map(Number);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 minutos por defecto

    setBookingForm(prev => ({
      ...prev,
      startTime: getLocalDatetimeString(start),
      endTime: getLocalDatetimeString(end),
    }));

    if (selectedLeadId && scheduleData.leads) {
      const lead = scheduleData.leads.find(l => l.id === selectedLeadId);
      if (lead) {
        setBookingForm(prev => ({
          ...prev,
          companyName: lead.company_name,
          leadName: lead.contact_name,
        }));
      }
    }
    setShowBookingModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Barra superior con controles y acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Agenda Compartida de Robinson Solórzano</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de disponibilidad y reserva atómica de diagnósticos y presentaciones sin doble reserva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowWeeklyModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Calendar className="w-4 h-4 text-emerald-400" />
                Configurar Horario Semanal
              </button>
              <button
                onClick={() => setShowBlockModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                Definir Excepción / Bloqueo
              </button>
            </>
          )}

          <button
            onClick={() => {
              const now = new Date();
              now.setMinutes(0, 0, 0);
              const end = new Date(now.getTime() + 30 * 60 * 1000);
              setBookingForm(prev => ({
                ...prev,
                startTime: getLocalDatetimeString(now),
                endTime: getLocalDatetimeString(end),
              }));
              setShowBookingModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Clock className="w-4 h-4" />
            Reservar Horario con Robinson
          </button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {feedback.text}
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Navegación de Semana y Controles de Vista */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentWeek}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Esta Semana
            </button>
            <button
              onClick={handleNextWeek}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-sm font-bold text-white capitalize">
            {format(currentWeekStart, "MMMM yyyy", { locale: es })} — Semana del {format(currentWeekStart, "d 'de' MMMM", { locale: es })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Modo de Vista */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setCalendarViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                calendarViewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Cuadrícula 30 min</span>
            </button>
            <button
              onClick={() => setCalendarViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                calendarViewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Resumen por Día</span>
            </button>
          </div>

          {/* Leyenda de Colores */}
          <div className="flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" /> Disponible
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]" /> Cita Reservada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" /> Bloqueado / Almuerzo
            </span>
          </div>
        </div>
      </div>

      {/* Calendario Semanal */}
      {loading ? (
        <div className="flex items-center justify-center p-20 bg-slate-900 border border-slate-800 rounded-2xl">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-3" />
          <span className="text-xs text-slate-400">Cargando disponibilidad y citas de la agenda...</span>
        </div>
      ) : calendarViewMode === 'grid' ? (
        /* VISTA 1: CUADRÍCULA PROFESIONAL POR MEDIAS HORAS (30 min) */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header con las columnas de los días */}
          <div className="flex border-b border-slate-800 bg-slate-950/90 sticky top-0 z-40 backdrop-blur-md">
            {/* Celda de esquina superior izquierda (Hora) */}
            <div className="w-16 sm:w-20 shrink-0 p-3 border-r border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center">
              Hora
            </div>

            {/* Columnas de los 6 días */}
            <div className="grid grid-cols-6 flex-1 divide-x divide-slate-800">
              {weekDays.map(day => {
                const isToday = isSameDay(day, new Date());
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);
                const dayBlocks = scheduleData.blocks.filter(b => {
                  const bStart = parseISO(b.start_time);
                  const bEnd = parseISO(b.end_time);
                  return bStart <= dayEnd && bEnd >= dayStart;
                });
                const fullDayBlock = dayBlocks.find(b =>
                  !b.is_available && (
                    b.is_all_day ||
                    (parseISO(b.start_time) <= dayStart && parseISO(b.end_time) >= dayEnd)
                  )
                );

                return (
                  <div
                    key={day.toISOString()}
                    className={`p-2.5 text-center transition-colors ${
                      fullDayBlock
                        ? 'bg-rose-950/40 text-rose-300'
                        : isToday
                        ? 'bg-indigo-600/10 text-indigo-300'
                        : 'bg-transparent text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="uppercase tracking-wider font-semibold">
                        {format(day, 'EEE', { locale: es })}
                      </span>
                      {fullDayBlock && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] flex items-center gap-0.5 border border-rose-500/30">
                          <Lock className="w-2.5 h-2.5" /> Bloqueado
                        </span>
                      )}
                      {isToday && !fullDayBlock && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </div>
                    <div className="text-sm font-extrabold text-white mt-0.5">
                      {format(day, 'd MMM', { locale: es })}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <button
                          onClick={() => openBlockModalForDay(day, 'day')}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/90 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-0.5 border border-slate-700/60"
                          title="Bloquear día completo"
                        >
                          <Ban className="w-2.5 h-2.5 text-rose-400" />
                          Bloquear
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contenedor vertical scrolleable de las 24 medias horas (08:00 a 20:00) */}
          <div className="flex overflow-y-auto max-h-[660px] relative">
            {/* Columna vertical de horas (Y-Axis) */}
            <div className="w-16 sm:w-20 shrink-0 border-r border-slate-800 bg-slate-950/60 select-none">
              {timeSlots.map((slot) => (
                <div
                  key={slot.timeStr}
                  style={{ height: `${SLOT_HEIGHT}px` }}
                  className={`flex items-start justify-end pr-2 text-right border-b ${
                    slot.isHour ? 'border-slate-800/80' : 'border-slate-800/30'
                  }`}
                >
                  <span
                    className={`-mt-2 font-mono ${
                      slot.isHour ? 'text-[11px] font-bold text-slate-300' : 'text-[9px] font-medium text-slate-500'
                    }`}
                  >
                    {slot.timeStr}
                  </span>
                </div>
              ))}
            </div>

            {/* 6 Columnas de Días con rejilla de 30 min y eventos absolutos */}
            <div className="grid grid-cols-6 flex-1 divide-x divide-slate-800 relative">
              {weekDays.map(day => {
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(day);
                dayEnd.setHours(23, 59, 59, 999);

                const dayMeetings = scheduleData.meetings.filter(m => isSameDay(parseISO(m.start_time), day));
                const dayBlocks = scheduleData.blocks.filter(b => {
                  const bStart = parseISO(b.start_time);
                  const bEnd = parseISO(b.end_time);
                  return bStart <= dayEnd && bEnd >= dayStart;
                });
                const fullDayBlock = dayBlocks.find(b =>
                  !b.is_available && (
                    b.is_all_day ||
                    (parseISO(b.start_time) <= dayStart && parseISO(b.end_time) >= dayEnd)
                  )
                );
                const dayWeeklySchedules = scheduleData.weeklySchedules.filter(s => s.day_of_week === (day.getDay() || 7));
                const isToday = isSameDay(day, new Date());

                // Posición de la línea de hora actual
                const now = new Date();
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const isCurrentTimeVisible =
                  isToday && currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60;
                const currentTop = isCurrentTimeVisible
                  ? (currentMinutes - START_HOUR * 60) * (SLOT_HEIGHT / 30)
                  : null;

                return (
                  <div
                    key={day.toISOString()}
                    style={{ height: `${TOTAL_SLOTS * SLOT_HEIGHT}px` }}
                    className={`relative select-none ${
                      fullDayBlock ? 'bg-rose-950/15' : isToday ? 'bg-indigo-950/5' : 'bg-transparent'
                    }`}
                  >
                    {/* Ranuras interactivas de 30 minutos de fondo */}
                    {timeSlots.map((slot) => {
                      const slotMinute = slot.totalMinutes;
                      const inWeeklySchedule = dayWeeklySchedules.some(ws => {
                        const [sH, sM] = ws.start_time.split(':').map(Number);
                        const [eH, eM] = ws.end_time.split(':').map(Number);
                        const wsStart = sH * 60 + sM;
                        const wsEnd = eH * 60 + eM;
                        return slotMinute >= wsStart && slotMinute + 30 <= wsEnd;
                      });

                      return (
                        <div
                          key={slot.timeStr}
                          style={{ height: `${SLOT_HEIGHT}px` }}
                          onClick={() => {
                            if (fullDayBlock) return;
                            openBookingForSlot(day, slot.timeStr);
                          }}
                          className={`border-b transition-colors group relative cursor-pointer ${
                            slot.isHour ? 'border-slate-800/80' : 'border-slate-800/30'
                          } ${
                            fullDayBlock
                              ? 'cursor-not-allowed'
                              : inWeeklySchedule
                              ? 'bg-emerald-500/[0.03] hover:bg-emerald-500/[0.14]'
                              : 'bg-slate-950/20 hover:bg-slate-800/40'
                          }`}
                        >
                          {/* Indicador en hover para reservar en esta media hora */}
                          {!fullDayBlock && (
                            <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-indigo-300 pointer-events-none transition-opacity bg-indigo-500/10">
                              <Plus className="w-3 h-3 mr-0.5 text-indigo-400" />
                              {slot.timeStr}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Línea indicadora de hora actual */}
                    {currentTop !== null && (
                      <div
                        style={{ top: `${currentTop}px` }}
                        className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] -ml-1" />
                        <div className="flex-1 h-[2px] bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                      </div>
                    )}

                    {/* Capa de Eventos en su posición exacta */}
                    {!fullDayBlock && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* 1. Bloqueos de No Disponibilidad / Almuerzo / Personal (is_available = false) */}
                        {dayBlocks
                          .filter(b => !b.is_available && !b.is_all_day)
                          .map(block => {
                            const pos = getEventPosition(block.start_time, block.end_time, day);
                            if (!pos) return null;
                            return (
                              <div
                                key={block.id}
                                style={{
                                  top: `${pos.top}px`,
                                  height: `${pos.height}px`,
                                }}
                                className="absolute left-1 right-1 pointer-events-auto rounded-lg bg-rose-950/90 hover:bg-rose-900 border-l-4 border-l-rose-400 border border-rose-600/50 text-rose-100 p-1.5 shadow-md flex flex-col justify-between overflow-hidden transition-all group z-20"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-rose-300">
                                    <span className="flex items-center gap-1 truncate">
                                      <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                                      <span className="truncate">{block.title || 'Horario Bloqueado'}</span>
                                    </span>
                                    {isAdmin && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          deleteAvailabilityBlockAction(block.id).then(loadSchedule);
                                        }}
                                        className="text-rose-400 hover:text-white p-0.5 transition-colors"
                                        title="Eliminar bloqueo"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-rose-200/80 font-mono mt-0.5">
                                    {format(parseISO(block.start_time), 'HH:mm')} - {format(parseISO(block.end_time), 'HH:mm')}
                                  </div>
                                </div>
                                {pos.height > 50 && block.notes && (
                                  <p className="text-[9px] text-slate-300 italic truncate mt-1">{block.notes}</p>
                                )}
                              </div>
                            );
                          })}

                        {/* 2. Horas Extraordinarias (is_available = true) */}
                        {dayBlocks
                          .filter(b => b.is_available)
                          .map(block => {
                            const pos = getEventPosition(block.start_time, block.end_time, day);
                            if (!pos) return null;
                            return (
                              <div
                                key={block.id}
                                style={{
                                  top: `${pos.top}px`,
                                  height: `${pos.height}px`,
                                }}
                                className="absolute left-1 right-1 pointer-events-auto rounded-lg bg-emerald-950/80 hover:bg-emerald-900/80 border-l-4 border-l-emerald-400 border border-emerald-600/50 text-emerald-100 p-1.5 shadow-md flex flex-col justify-between overflow-hidden transition-all z-10"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-300">
                                    <span className="flex items-center gap-1 truncate">
                                      <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                                      <span className="truncate">{block.title || 'Horario Extra'}</span>
                                    </span>
                                    {isAdmin && (
                                      <button
                                        onClick={e => {
                                          e.stopPropagation();
                                          deleteAvailabilityBlockAction(block.id).then(loadSchedule);
                                        }}
                                        className="text-emerald-400 hover:text-white p-0.5"
                                        title="Eliminar"
                                      >
                                        ✕
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[9px] text-emerald-300/80 font-mono">
                                    {format(parseISO(block.start_time), 'HH:mm')} - {format(parseISO(block.end_time), 'HH:mm')}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                        {/* 3. Reuniones Agendadas (Meetings) */}
                        {dayMeetings.map(meeting => {
                          const pos = getEventPosition(meeting.start_time, meeting.end_time, day);
                          if (!pos) return null;

                          const isFinished = meeting.status === 'Realizada';
                          const isCancelled = meeting.status === 'Cancelada';

                          return (
                            <div
                              key={meeting.id}
                              onClick={e => {
                                e.stopPropagation();
                                setShowOutcomeModal(meeting);
                              }}
                              style={{
                                top: `${pos.top}px`,
                                height: `${pos.height}px`,
                              }}
                              className={`absolute left-1 right-1 pointer-events-auto rounded-xl p-2 cursor-pointer shadow-lg transition-all hover:scale-[1.01] hover:z-30 z-20 flex flex-col justify-between overflow-hidden border ${
                                isFinished
                                  ? 'bg-gradient-to-br from-teal-800 to-emerald-900 border-teal-500/60 border-l-4 border-l-teal-300 text-teal-100 shadow-teal-950/50'
                                  : isCancelled
                                  ? 'bg-slate-800/90 border-slate-700 text-slate-400 line-through border-l-4 border-l-slate-500'
                                  : 'bg-gradient-to-br from-indigo-600 to-violet-700 border-indigo-400/60 border-l-4 border-l-indigo-200 text-white shadow-indigo-950/60'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="font-mono flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {format(parseISO(meeting.start_time), 'HH:mm')} - {format(parseISO(meeting.end_time), 'HH:mm')}
                                  </span>
                                  <span className={`px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    isFinished
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : 'bg-white/20 text-white'
                                  }`}>
                                    {meeting.meeting_type}
                                  </span>
                                </div>
                                <div className="font-extrabold text-[11px] truncate mt-0.5 leading-tight">
                                  {meeting.title}
                                </div>
                                {pos.height >= 40 && meeting.leads && (
                                  <div className="text-[10px] text-indigo-100/90 font-medium truncate flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3 h-3 shrink-0 text-indigo-200" />
                                    <span className="truncate">{meeting.leads.company_name}</span>
                                  </div>
                                )}
                              </div>

                              {pos.height >= 70 && (
                                <div className="text-[9px] text-white/80 flex items-center justify-between border-t border-white/10 pt-1 mt-1">
                                  <span className="truncate">
                                    Asesor: {meeting.advisor_profile?.full_name?.split(' ')[0] || 'Asesor'}
                                  </span>
                                  <span className="font-semibold">{meeting.modality}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Overlay cuando todo el día está bloqueado */}
                    {fullDayBlock && (
                      <div className="absolute inset-2 rounded-2xl bg-rose-950/80 backdrop-blur-[2px] border border-rose-500/40 p-4 flex flex-col justify-center items-center text-center space-y-2 z-25 shadow-2xl">
                        <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-lg">
                          <Ban className="w-6 h-6 text-rose-400" />
                        </div>
                        <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                          Día Completo Bloqueado
                        </span>
                        <p className="text-xs text-rose-200 font-semibold">{fullDayBlock.title || 'No Disponible'}</p>
                        {fullDayBlock.notes && (
                          <p className="text-[10px] text-slate-300 italic max-w-[160px] line-clamp-3">{fullDayBlock.notes}</p>
                        )}
                        <span className="text-[10px] text-rose-300/80 font-medium">No se permiten citas hoy</span>
                        {isAdmin && (
                          <button
                            onClick={() => deleteAvailabilityBlockAction(fullDayBlock.id).then(loadSchedule)}
                            className="mt-2 px-3 py-1.5 rounded-xl bg-rose-500/30 hover:bg-rose-500/50 text-white font-bold text-[11px] border border-rose-500/40 transition-colors shadow-sm"
                          >
                            Desbloquear Día
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA 2: TARJETAS POR DÍA */
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {weekDays.map((day) => {
            const dayStart = new Date(day);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);

            const dayMeetings = scheduleData.meetings.filter(m => isSameDay(parseISO(m.start_time), day));
            const dayBlocks = scheduleData.blocks.filter(b => {
              const bStart = parseISO(b.start_time);
              const bEnd = parseISO(b.end_time);
              return bStart <= dayEnd && bEnd >= dayStart;
            });
            const fullDayBlock = dayBlocks.find(b => 
              !b.is_available && (
                b.is_all_day || 
                (parseISO(b.start_time) <= dayStart && parseISO(b.end_time) >= dayEnd)
              )
            );
            const dayWeeklySchedules = scheduleData.weeklySchedules.filter(s => s.day_of_week === (day.getDay() || 7));
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={day.toISOString()} 
                className={`bg-slate-900 border rounded-xl overflow-hidden flex flex-col min-h-[400px] ${
                  fullDayBlock
                    ? 'border-rose-500/40 bg-rose-950/10'
                    : isToday 
                    ? 'border-indigo-500/50 shadow-md shadow-indigo-500/10' 
                    : 'border-slate-800'
                }`}
              >
                {/* Cabecera del día */}
                <div className={`p-3 text-center border-b border-slate-800 ${
                  fullDayBlock
                    ? 'bg-rose-950/40 text-rose-300'
                    : isToday 
                    ? 'bg-indigo-600/10 text-indigo-300' 
                    : 'bg-slate-950/60 text-slate-300'
                }`}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="uppercase tracking-wider font-semibold">
                      {format(day, 'EEEE', { locale: es })}
                    </span>
                    {fullDayBlock && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[9px] flex items-center gap-1 border border-rose-500/30">
                        <Lock className="w-2.5 h-2.5" /> Bloqueado
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-extrabold text-white mt-0.5">
                    {format(day, 'd MMM', { locale: es })}
                  </div>

                  {/* Acciones rápidas de bloqueo para Robinson / Admin */}
                  {isAdmin && (
                    <div className="flex items-center justify-center gap-1.5 mt-2 pt-1.5 border-t border-slate-800/60">
                      <button
                        onClick={() => openBlockModalForDay(day, 'day')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors flex items-center gap-1 border border-slate-700/60"
                        title="Bloquear este día completo"
                      >
                        <Ban className="w-2.5 h-2.5 text-rose-400" />
                        Bloquear Día
                      </button>
                      <button
                        onClick={() => openBlockModalForDay(day, 'hours')}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/80 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 transition-colors flex items-center gap-1 border border-slate-700/60"
                        title="Bloquear horas específicas"
                      >
                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                        Horas
                      </button>
                    </div>
                  )}
                </div>

                {/* Eventos del día */}
                <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                  {/* Banner de Día Completo Bloqueado */}
                  {fullDayBlock && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 rounded-xl space-y-1">
                      <div className="flex items-center justify-between font-bold text-rose-300 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Ban className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{fullDayBlock.title || 'Día No Disponible'}</span>
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => deleteAvailabilityBlockAction(fullDayBlock.id).then(loadSchedule)}
                            className="text-slate-500 hover:text-rose-300 text-xs p-0.5"
                            title="Desbloquear este día"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {fullDayBlock.notes && (
                        <p className="text-[10px] text-slate-300 italic truncate">{fullDayBlock.notes}</p>
                      )}
                      <p className="text-[9px] text-rose-400/90 font-medium">
                        ⛔ Sin disponibilidad para reservas hoy
                      </p>
                    </div>
                  )}

                  {/* Horario Semanal Habitual */}
                  {!fullDayBlock && dayWeeklySchedules.map(ws => (
                    <div key={ws.id} className="p-2 rounded-lg text-[11px] border bg-emerald-500/5 border-emerald-500/10 text-emerald-400">
                      <div className="font-semibold flex items-center justify-between">
                        <span>Horario Disponible</span>
                      </div>
                      <div className="text-[10px] text-emerald-500/70 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ws.start_time.slice(0,5)} - {ws.end_time.slice(0,5)}
                      </div>
                    </div>
                  ))}

                  {/* Bloques de Excepción y Bloqueos por Horas */}
                  {dayBlocks.filter(b => b.id !== fullDayBlock?.id).map(block => (
                    <div 
                      key={block.id}
                      className={`p-2 rounded-lg text-[11px] border ${
                        block.is_available 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                          : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1 truncate">
                          {block.is_available ? (
                            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                          ) : (
                            <Ban className="w-3 h-3 text-rose-400 shrink-0" />
                          )}
                          <span className="truncate">{block.title || (block.is_available ? 'Horario Extra' : 'Bloqueado')}</span>
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => deleteAvailabilityBlockAction(block.id).then(loadSchedule)}
                            className="text-slate-500 hover:text-rose-400 ml-1 shrink-0"
                            title="Eliminar bloqueo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        {format(parseISO(block.start_time), 'HH:mm')} - {format(parseISO(block.end_time), 'HH:mm')}
                      </div>
                      {block.notes && (
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                          {block.notes}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Reuniones agendadas */}
                  {dayMeetings.map(meeting => (
                    <div
                      key={meeting.id}
                      onClick={() => setShowOutcomeModal(meeting)}
                      className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-white text-[11px] cursor-pointer hover:bg-indigo-900/40 transition-colors group"
                    >
                      <div className="flex items-center justify-between font-bold text-indigo-300">
                        <span>{format(parseISO(meeting.start_time), 'HH:mm')} - {format(parseISO(meeting.end_time), 'HH:mm')}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          meeting.status === 'Realizada' ? 'bg-emerald-500/20 text-emerald-300' :
                          meeting.status === 'Cancelada' ? 'bg-rose-500/20 text-rose-300' :
                          'bg-indigo-500/20 text-indigo-300'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                      <div className="font-semibold text-slate-200 mt-1 truncate">
                        {meeting.title}
                      </div>

                      {/* Indicador de prospecto o reunión general */}
                      {meeting.leads ? (
                        <div className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 truncate font-medium">
                          <Building2 className="w-3 h-3 shrink-0 text-emerald-400" />
                          <span className="truncate">{meeting.leads.company_name}</span>
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 shrink-0 text-slate-500" />
                          <span className="truncate">Sin Lead / General</span>
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        Asesor: {meeting.advisor_profile?.full_name || 'Asesor'}
                      </div>
                    </div>
                  ))}

                  {dayMeetings.length === 0 && dayBlocks.length === 0 && !fullDayBlock && dayWeeklySchedules.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                      <Clock className="w-5 h-5 text-slate-700 mb-1" />
                      <span className="text-[11px] text-slate-600">Sin bloques ni citas</span>
                    </div>
                  )}
                </div>

                {/* Botón rápido para reservar en este día */}
                <div className="p-2 border-t border-slate-800 bg-slate-950/40">
                  {fullDayBlock ? (
                    <div className="w-full py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-semibold text-center flex items-center justify-center gap-1">
                      <Lock className="w-3 h-3 text-rose-400/70" />
                      Día No Disponible
                    </div>
                  ) : (
                    <button
                      onClick={() => openBookingForSlot(day, '10:00')}
                      className="w-full py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3 text-indigo-400" />
                      Reservar Cita
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: DEFINIR EXCEPCIÓN / BLOQUEO (Admin) */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">
                    Definir Excepción o Bloqueo en la Agenda
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Bloquea horas, días completos o periodos para evitar reservas no deseadas.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Selector de Modo: Horas | Día Completo | Rango Días | Horas Extra */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setBlockType('hours');
                  setAvailForm(prev => ({
                    ...prev,
                    title: prev.title === 'Día Bloqueado / No disponible' || prev.title === 'Vacaciones / Feriado' ? 'Bloqueo Personal (Horas)' : prev.title,
                    is_available: false,
                  }));
                }}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                  blockType === 'hours'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Horas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlockType('day');
                  setAvailForm(prev => ({
                    ...prev,
                    title: 'Día Bloqueado / No disponible',
                    is_available: false,
                  }));
                }}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                  blockType === 'day'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Día Entero</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlockType('range');
                  setAvailForm(prev => ({
                    ...prev,
                    title: 'Vacaciones / Feriado',
                    is_available: false,
                  }));
                }}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                  blockType === 'range'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Varios Días</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlockType('custom_avail');
                  setAvailForm(prev => ({
                    ...prev,
                    title: 'Disponibilidad Extra',
                    is_available: true,
                    slot_type: 'Diagnóstico',
                  }));
                }}
                className={`py-2 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition-all ${
                  blockType === 'custom_avail'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Horas Extra</span>
              </button>
            </div>

            {/* Presets rápidos de motivos */}
            {blockType !== 'custom_avail' && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Motivos frecuentes (haz clic para auto-completar):</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAvailForm(prev => ({ ...prev, title: 'Almuerzo / Receso', startTime: '13:00', endTime: '15:00' }))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60"
                  >
                    <Coffee className="w-3 h-3 text-amber-400" /> Almuerzo (13h-15h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailForm(prev => ({ ...prev, title: 'Cita Médica / Personal' }))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60"
                  >
                    🏥 Cita Médica
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailForm(prev => ({ ...prev, title: 'Viaje de Negocios' }))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60"
                  >
                    <Plane className="w-3 h-3 text-sky-400" /> Viaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailForm(prev => ({ ...prev, title: 'Vacaciones / Feriado' }))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60"
                  >
                    🏖️ Vacaciones / Feriado
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvailForm(prev => ({ ...prev, title: 'Reunión Interna / Desarrollo' }))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 border border-slate-700/60"
                  >
                    💻 Desarrollo Interno
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveAvailability} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Título o Motivo</label>
                <input
                  type="text"
                  value={availForm.title}
                  onChange={e => setAvailForm({ ...availForm, title: e.target.value })}
                  placeholder={blockType === 'custom_avail' ? 'Ej. Disponibilidad Sábado Mañana' : 'Ej. Almuerzo, Viaje, Asunto personal...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-medium"
                  required
                />
              </div>

              {/* SELECCIÓN DE FECHAS SEGÚN EL MODO */}
              {blockType === 'range' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha Desde (Inicio)</label>
                    <input
                      type="date"
                      value={availForm.date}
                      onChange={e => setAvailForm({ ...availForm, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Fecha Hasta (Fin)</label>
                    <input
                      type="date"
                      value={availForm.endDate}
                      min={availForm.date}
                      onChange={e => setAvailForm({ ...availForm, endDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Fecha</label>
                  <input
                    type="date"
                    value={availForm.date}
                    onChange={e => setAvailForm({ ...availForm, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              )}

              {/* SELECCIÓN DE HORAS (Solo si es 'hours' o 'custom_avail') */}
              {(blockType === 'hours' || blockType === 'custom_avail') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={availForm.startTime}
                      onChange={e => setAvailForm({ ...availForm, startTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={availForm.endTime}
                      onChange={e => setAvailForm({ ...availForm, endTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                      required
                    />
                  </div>
                </div>
              )}

              {/* TIPO DE ACTIVIDAD SI ES HABILITACIÓN EXTRA */}
              {blockType === 'custom_avail' && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tipo de Actividad Permitida</label>
                  <select
                    value={availForm.slot_type}
                    onChange={e => setAvailForm({ ...availForm, slot_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="Diagnóstico">Diagnóstico (30 min)</option>
                    <option value="Presentación Demo">Presentación de Demo</option>
                    <option value="General">Horario General Disponible</option>
                  </select>
                </div>
              )}

              {/* AVISO EXPLICATIVO */}
              <div className={`p-3 rounded-xl border text-[11px] ${
                blockType === 'custom_avail'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              }`}>
                {blockType === 'hours' && (
                  <p>🚫 Se bloqueará este rango horario. El sistema rechazará cualquier intento de reserva en estas horas.</p>
                )}
                {blockType === 'day' && (
                  <p>⛔ Se bloqueará todo el día seleccionado (00:00 - 23:59). Ningún asesor podrá agendar reuniones en esta fecha.</p>
                )}
                {blockType === 'range' && (
                  <p>🗓️ Se bloquearán todos los días entre la fecha de inicio y fin. Ideal para vacaciones, viajes o periodos de descanso.</p>
                )}
                {blockType === 'custom_avail' && (
                  <p>✨ Se abrirá disponibilidad extraordinaria en la agenda fuera del horario base recurrente.</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notas Internas (Opcional)</label>
                <input
                  type="text"
                  placeholder="Detalles adicionales o recordatorio para el equipo..."
                  value={availForm.notes}
                  onChange={e => setAvailForm({ ...availForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 rounded-xl font-bold text-white shadow-md transition-all disabled:opacity-50 ${
                    blockType === 'custom_avail'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {submitting 
                    ? 'Guardando...' 
                    : blockType === 'custom_avail' 
                    ? 'Habilitar Disponibilidad' 
                    : blockType === 'day' 
                    ? 'Bloquear Día Completo' 
                    : blockType === 'range' 
                    ? 'Bloquear Periodo' 
                    : 'Bloquear Horas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HORARIO SEMANAL RECURRENTE (Admin) */}
      {showWeeklyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                Configurar Horario Semanal
              </h2>
              <button onClick={() => setShowWeeklyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-[11px] text-slate-400">
              Define tu disponibilidad base para diagnósticos y reuniones de Lunes a Viernes. Las citas solo podrán agendarse dentro de estos bloques.
            </p>

            <form onSubmit={handleSaveWeeklySchedule} className="space-y-4 text-xs">
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">Bloque Mañana</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={weeklyForm.morningStart}
                      onChange={e => setWeeklyForm({ ...weeklyForm, morningStart: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={weeklyForm.morningEnd}
                      onChange={e => setWeeklyForm({ ...weeklyForm, morningEnd: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">Bloque Tarde</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={weeklyForm.afternoonStart}
                      onChange={e => setWeeklyForm({ ...weeklyForm, afternoonStart: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={weeklyForm.afternoonEnd}
                      onChange={e => setWeeklyForm({ ...weeklyForm, afternoonEnd: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWeeklyModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar Horario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHEET: RESERVA DE CITA (Asesor/Admin) */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 sm:pl-16">
            <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
              
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/50 flex flex-col gap-1 relative">
                <button 
                  onClick={() => setShowBookingModal(false)} 
                  className="absolute top-5 right-5 p-2 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-2 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                  <Calendar className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Agendar Nueva Cita</h2>
                <p className="text-xs text-slate-400">
                  Reserva un bloque en la agenda de Robinson. Se validarán colisiones en tiempo real.
                </p>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleBookMeeting} className="space-y-6">
                  
                  {/* Bloque 1: Horario */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm">
                    <h3 className="text-[11px] uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                      <Clock className="w-3.5 h-3.5" /> 1. Fecha y Hora
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Hora Inicio</label>
                        <input
                          type="datetime-local"
                          value={bookingForm.startTime}
                          onChange={e => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-medium transition-colors"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Hora Fin</label>
                        <input
                          type="datetime-local"
                          value={bookingForm.endTime}
                          onChange={e => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-sm text-white font-medium transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bloque 2: Selección de Prospecto o Reunión General */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <h3 className="text-[11px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> 2. Destinatario de la Cita
                      </h3>
                      <span className="text-[10px] font-medium text-slate-500">
                        {meetingTargetMode === 'lead' ? 'Con Lead CRM' : meetingTargetMode === 'none' ? 'Sin Lead (General)' : 'Lead Manual'}
                      </span>
                    </div>

                    {/* Selector de Modo (Pills) */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleSwitchMode('lead')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          meetingTargetMode === 'lead'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span className="truncate">Vincular Lead</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchMode('none')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          meetingTargetMode === 'none'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="truncate">Sin Lead</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSwitchMode('manual')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                          meetingTargetMode === 'manual'
                            ? 'bg-slate-700 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">Manual</span>
                      </button>
                    </div>

                    {/* MODO 1: SELECCIONAR LEAD DE LA BASE DE DATOS */}
                    {meetingTargetMode === 'lead' && (
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1 flex items-center justify-between">
                            <span>Seleccionar Prospecto Creado</span>
                            <span className="text-[10px] text-emerald-400 font-normal">
                              {(scheduleData.leads || []).length} disponibles
                            </span>
                          </label>

                          {/* Buscador de prospectos */}
                          <div className="relative mb-2">
                            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              placeholder="Filtrar por empresa o contacto..."
                              value={leadSearchTerm}
                              onChange={e => setLeadSearchTerm(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700/80 focus:border-emerald-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 transition-colors"
                            />
                            {leadSearchTerm && (
                              <button
                                type="button"
                                onClick={() => setLeadSearchTerm('')}
                                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Select de Leads */}
                          <select
                            value={selectedLeadId}
                            onChange={e => handleSelectLead(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white font-medium transition-colors"
                            required
                          >
                            <option value="">-- Selecciona un prospecto registrado --</option>
                            {(scheduleData.leads || [])
                              .filter(lead => {
                                if (!leadSearchTerm.trim()) return true;
                                const term = leadSearchTerm.toLowerCase();
                                return (
                                  lead.company_name?.toLowerCase().includes(term) ||
                                  lead.contact_name?.toLowerCase().includes(term) ||
                                  lead.phone?.toLowerCase().includes(term) ||
                                  lead.software_type?.toLowerCase().includes(term)
                                );
                              })
                              .map(lead => (
                                <option key={lead.id} value={lead.id}>
                                  {lead.company_name} — {lead.contact_name} ({lead.status})
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Tarjeta de Resumen del Lead Seleccionado */}
                        {selectedLeadId && (() => {
                          const lead = scheduleData.leads?.find(l => l.id === selectedLeadId);
                          if (!lead) return null;
                          return (
                            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                                  {lead.company_name}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                  {lead.status}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-300 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span>{lead.contact_name}</span>
                              </div>
                              {lead.phone && (
                                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-400" />
                                  <span>{lead.phone}</span>
                                </div>
                              )}
                              <p className="text-[10px] text-emerald-400/80 pt-1 border-t border-emerald-500/20">
                                ✓ Se agendará la cita a este lead y se actualizará su seguimiento en el CRM y Kanban.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* MODO 2: SIN LEAD ESPECÍFICO (REUNIÓN GENERAL / INTERNA) */}
                    {meetingTargetMode === 'none' && (
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                            Título o Asunto de la Reunión
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Reunión General, Alianza Comercial, Revisión Técnica..."
                            value={bookingForm.generalTitle}
                            onChange={e => setBookingForm({ ...bookingForm, generalTitle: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2.5 text-white transition-colors text-sm"
                            required
                          />
                        </div>

                        <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                          <div>
                            <p className="font-semibold text-white">Reunión sin lead asociado</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Este evento se registrará en la agenda de Robinson bloqueando el horario, sin requerir vincularse a un cliente o prospecto de ventas.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODO 3: PROSPECTO MANUAL (NO REGISTRADO PREVIAMENTE) */}
                    {meetingTargetMode === 'manual' && (
                      <div className="space-y-3 text-sm">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">Empresa / Negocio</label>
                          <div className="relative">
                            <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                              type="text"
                              placeholder="Ej. Clínica Dental o Negocio"
                              value={bookingForm.companyName}
                              onChange={e => setBookingForm({ ...bookingForm, companyName: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 focus:border-slate-500 rounded-xl pl-9 pr-3 py-2.5 text-white transition-colors"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">Contacto Principal</label>
                          <div className="relative">
                            <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                            <input
                              type="text"
                              placeholder="Nombre de la persona"
                              value={bookingForm.leadName}
                              onChange={e => setBookingForm({ ...bookingForm, leadName: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 focus:border-slate-500 rounded-xl pl-9 pr-3 py-2.5 text-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bloque 3: Modalidad y Detalles */}
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-sm">
                    <h3 className="text-[11px] uppercase tracking-wider font-bold text-sky-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
                      <FileCheck className="w-3.5 h-3.5" /> 3. Detalles de la Cita
                    </h3>
                    
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Tipo de Reunión</label>
                        <select
                          value={bookingForm.meeting_type}
                          onChange={e => {
                            const newType = e.target.value;
                            setBookingForm(prev => ({
                              ...prev,
                              meeting_type: newType,
                              generalTitle: meetingTargetMode === 'none' && (!prev.generalTitle || prev.generalTitle === prev.meeting_type) ? newType : prev.generalTitle
                            }));
                          }}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2.5 text-white transition-colors"
                        >
                          <option value="Diagnóstico">Diagnóstico Gratuito (30 min)</option>
                          <option value="Presentación de Demo">Presentación de Demo Funcional</option>
                          <option value="Revisión de Propuesta">Revisión de Propuesta y Alcance</option>
                          <option value="Seguimiento">Seguimiento Comercial / Proyecto</option>
                          <option value="Reunión Interna">Reunión Interna / Planificación</option>
                          <option value="Soporte">Soporte Técnico Especializado</option>
                          <option value="Otro">Otro / General</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">Modalidad</label>
                          <select
                            value={bookingForm.modality}
                            onChange={e => setBookingForm({ ...bookingForm, modality: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2.5 text-white transition-colors"
                          >
                            <option value="Virtual">Virtual (G-Meet)</option>
                            <option value="Presencial">Presencial</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 font-semibold mb-1">Enlace / Ubicación</label>
                          <div className="relative">
                            {bookingForm.modality === 'Virtual' ? (
                              <Video className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                            )}
                            <input
                              type="text"
                              value={bookingForm.meetingUrl}
                              onChange={e => setBookingForm({ ...bookingForm, meetingUrl: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl pl-8 pr-2 py-2.5 text-white transition-colors"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 font-semibold mb-1">Objetivo / Tema a Tratar</label>
                        <input
                          type="text"
                          value={bookingForm.objective}
                          onChange={e => setBookingForm({ ...bookingForm, objective: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl px-3 py-2.5 text-white transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              {/* Footer Fijo */}
              <div className="p-5 border-t border-slate-800 bg-slate-950/80">
                <button
                  type="submit"
                  onClick={handleBookMeeting}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-sm shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Confirmando Reserva...</>
                  ) : (
                    <><CheckCircle2 className="w-5 h-5" /> Agendar y Confirmar Cita</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE Y RESULTADO DE REUNIÓN */}
      {showOutcomeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white">{showOutcomeModal.title}</h2>
                <p className="text-[11px] text-slate-400">
                  {format(parseISO(showOutcomeModal.start_time), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </p>
              </div>
              <button onClick={() => setShowOutcomeModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div><span className="text-slate-500">Tipo:</span> <span className="text-white font-medium">{showOutcomeModal.meeting_type}</span></div>
                <div><span className="text-slate-500">Modalidad:</span> <span className="text-white font-medium">{showOutcomeModal.modality}</span></div>
                
                {/* Información de Prospecto o Reunión General */}
                {showOutcomeModal.leads ? (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300">
                    <div className="font-semibold flex items-center gap-1.5 text-xs">
                      <Building2 className="w-3.5 h-3.5" />
                      Lead: {showOutcomeModal.leads.company_name}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {showOutcomeModal.leads.contact_name}
                      </span>
                      {showOutcomeModal.leads.phone && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          {showOutcomeModal.leads.phone}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Reunión General (Sin prospecto específico vinculado)</span>
                  </div>
                )}

                {showOutcomeModal.meeting_url && (
                  <div>
                    <span className="text-slate-500">Enlace:</span>{' '}
                    <a href={showOutcomeModal.meeting_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
                      {showOutcomeModal.meeting_url}
                    </a>
                  </div>
                )}
                {showOutcomeModal.objective && (
                  <div><span className="text-slate-500">Objetivo:</span> <span className="text-white">{showOutcomeModal.objective}</span></div>
                )}
                <div><span className="text-slate-500">Estado actual:</span> <span className="text-indigo-300 font-semibold">{showOutcomeModal.status}</span></div>
              </div>

              {/* Acciones de estado */}
              <div className="pt-2">
                <span className="block text-[11px] text-slate-400 mb-2 font-medium">Actualizar Estado de la Cita:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleUpdateStatus(showOutcomeModal.id, 'Realizada', 'Diagnóstico realizado satisfactoriamente')}
                    disabled={submitting}
                    className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-center font-semibold text-[11px]"
                  >
                    ✓ Realizada
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(showOutcomeModal.id, 'No asistió', 'El prospecto no asistió a la cita programada')}
                    disabled={submitting}
                    className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-center font-semibold text-[11px]"
                  >
                    No Asistió
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(showOutcomeModal.id, 'Cancelada', 'Cancelada por el prospecto / asesor')}
                    disabled={submitting}
                    className="p-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-center font-semibold text-[11px]"
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
