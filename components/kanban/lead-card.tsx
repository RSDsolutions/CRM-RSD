'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead } from '@/types/database.types';
import { Clock, AlertTriangle, Laptop } from 'lucide-react';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface LeadCardProps {
  lead: Lead;
  onSelect: (lead: Lead) => void;
}

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

  // Formato visual de alerta para la fecha de la cita
  const renderAppointmentBadge = () => {
    if (!lead.appointment_scheduled || !lead.appointment_date) return null;

    try {
      const appDate = parseISO(lead.appointment_date);
      const isOverdue = isPast(appDate) && !isToday(appDate);
      const isDueToday = isToday(appDate);

      let badgeClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      let icon = <Clock className="w-3 h-3" />;

      if (isOverdue || isDueToday) {
        badgeClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/40 animate-pulse';
        icon = <AlertTriangle className="w-3 h-3" />;
      }

      return (
        <div className={`mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badgeClasses}`}>
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
      className={`group relative p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 transition-all duration-150 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md select-none ${
        isDragging ? 'opacity-30 ring-2 ring-indigo-500' : ''
      }`}
    >
      {/* Encabezado: Empresa y Tipo de Software */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-xs text-slate-100 group-hover:text-white line-clamp-1">
          {lead.company_name}
        </h4>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 flex-shrink-0">
          <Laptop className="w-2.5 h-2.5 text-indigo-400" />
          {lead.software_type}
        </span>
      </div>

      {/* Contacto y Asesor */}
      <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between gap-1">
        <span className="truncate">👤 {lead.contact_name}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">Asesor: {lead.assigned_to}</span>
      </div>

      {/* Badge de Cita */}
      {renderAppointmentBadge()}
    </div>
  );
}
