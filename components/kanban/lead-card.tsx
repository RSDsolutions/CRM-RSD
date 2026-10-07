'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/types/database.types';
import { Clock, AlertTriangle, Laptop, User, ChevronRight } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

// Función para obtener colores consistentes según el asesor
const getAdvisorColor = (name: string) => {
  if (!name) return {
    bg: 'bg-slate-700',
    text: 'text-slate-300',
    border: 'border-slate-600',
    accent: 'bg-slate-500'
  };
  
  const n = name.toLowerCase();
  
  // Robinson -> Morado
  if (n.includes('robinson')) return {
    bg: 'bg-purple-500/20',
    text: 'text-purple-300',
    border: 'border-purple-500/50',
    accent: 'bg-purple-500',
    glow: 'group-hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
  };
  
  // Otros nombres conocidos o hash determinista
  const palettes = [
    { bg: 'bg-sky-500/20', text: 'text-sky-300', border: 'border-sky-500/50', accent: 'bg-sky-500', glow: 'group-hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50', accent: 'bg-emerald-500', glow: 'group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]' },
    { bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/50', accent: 'bg-rose-500', glow: 'group-hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]' },
    { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/50', accent: 'bg-amber-500', glow: 'group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]' },
    { bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/50', accent: 'bg-indigo-500', glow: 'group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]' },
    { bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/50', accent: 'bg-teal-500', glow: 'group-hover:shadow-[0_0_15px_rgba(20,184,166,0.2)]' },
  ];
  
  const index = name.charCodeAt(0) % palettes.length;
  return palettes[index];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export function LeadCard({ lead, onSelect }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const advisorColor = getAdvisorColor(lead.assigned_to);

  // Formato visual de alerta para la fecha de la cita
  const renderAppointmentBadge = () => {
    if (!lead.appointment_scheduled || !lead.appointment_date) return null;

    try {
      const appDate = parseISO(lead.appointment_date);
      const isOverdue = isPast(appDate) && !isToday(appDate);
      const isDueToday = isToday(appDate);

      let badgeClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
      let icon = <Clock className="w-3 h-3" />;

      if (isOverdue || isDueToday) {
        badgeClasses = 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse';
        icon = <AlertTriangle className="w-3 h-3" />;
      } else {
        badgeClasses = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      }

      return (
        <div className={`mt-3 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold border ${badgeClasses} backdrop-blur-sm`}>
          {icon}
          <span>
            {isDueToday ? 'Hoy: ' : ''}
            {format(appDate, "dd MMM - HH:mm 'hrs'", { locale: es })}
          </span>
        </div>
      );
    } catch {
      return null;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(lead)}
      className={`group relative flex flex-col p-3.5 rounded-xl bg-gradient-to-b from-slate-900 to-slate-900/95 border border-slate-800/80 hover:border-slate-700 transition-all duration-300 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 select-none overflow-hidden ${
        isDragging ? 'opacity-40 scale-105 shadow-2xl z-50 ring-2 ring-indigo-500' : 'shadow-md hover:shadow-xl'
      } ${advisorColor.glow || ''}`}
    >
      {/* Barra lateral de acento de color */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${advisorColor.accent} opacity-80`} />

      <div className="pl-1">
        {/* Encabezado: Empresa y Tipo de Software */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-bold text-xs text-white line-clamp-2 leading-tight">
            {lead.company_name}
          </h4>
          <span className="inline-flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-indigo-300 flex-shrink-0 shadow-sm">
            <Laptop className="w-2.5 h-2.5" />
            {lead.software_type}
          </span>
        </div>

        {/* Contacto */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
          <User className="w-3 h-3 text-slate-500" />
          <span className="truncate">{lead.contact_name}</span>
        </div>

        <div className="w-full h-[1px] bg-gradient-to-r from-slate-800 to-transparent mb-3" />

        {/* Footer de la tarjeta: Asesor y Cita */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${advisorColor.bg} ${advisorColor.text} border ${advisorColor.border}`}>
              {getInitials(lead.assigned_to)}
            </div>
            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[80px]">
              {lead.assigned_to?.split(' ')[0] || 'Sin Asignar'}
            </span>
          </div>
          
          <div className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>

        {/* Badge de Cita (Opcional, se renderiza abajo si existe) */}
        {renderAppointmentBadge()}
      </div>
    </div>
  );
}
