'use client';

import { useState } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Lead, LeadStatus } from '@/types/database.types';
import { LeadCard } from './lead-card';
import { LeadDetailSheet } from './lead-detail-sheet';
import { createClient } from '@/utils/supabase/client';
import { PlusCircle, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

const COLUMNS: { id: LeadStatus; label: string; dotColor: string }[] = [
  { id: 'Nuevo', label: 'Nuevo', dotColor: 'bg-blue-500' },
  { id: 'Contactado', label: 'Contactado', dotColor: 'bg-yellow-500' },
  { id: 'Cita Agendada', label: 'Cita Agendada', dotColor: 'bg-purple-500' },
  { id: 'Propuesta', label: 'Propuesta', dotColor: 'bg-cyan-500' },
  { id: 'Negociación', label: 'Negociación', dotColor: 'bg-amber-500' },
  { id: 'Cerrado-Ganado', label: 'Ganado', dotColor: 'bg-emerald-500' },
  { id: 'Cerrado-Perdido', label: 'Perdido', dotColor: 'bg-rose-500' },
];

interface KanbanBoardProps {
  initialLeads: Lead[];
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Sensor con distancia mínima de 5px para distinguir clic de arrastre
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setLeads(data as Lead[]);
    } catch (err: any) {
      console.error('Error al refrescar leads:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const current = leads.find((l) => l.id === active.id);
    if (current) setActiveLead(current);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const leadId = active.id as string;
    let targetStatus: LeadStatus | null = null;

    // Detectar si el drop fue en la columna o sobre otra tarjeta de esa columna
    const isColumn = COLUMNS.some((col) => col.id === over.id);
    if (isColumn) {
      targetStatus = over.id as LeadStatus;
    } else {
      const targetLead = leads.find((l) => l.id === over.id);
      if (targetLead) {
        targetStatus = targetLead.status;
      }
    }

    if (!targetStatus) return;

    const sourceLead = leads.find((l) => l.id === leadId);
    if (!sourceLead || sourceLead.status === targetStatus) return;

    // 1. UPDATE OPTIMISTA
    const previousLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: targetStatus! } : l))
    );
    setSyncError(null);

    // 2. MUTACIÓN ASÍNCRONA EN SUPABASE CON TRY/CATCH Y ROLLBACK
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: targetStatus })
        .eq('id', leadId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error('Error al sincronizar estado con Supabase:', err);
      setSyncError(`Error al sincronizar cambio: ${err.message || 'Error de conexión'}`);
      // Revertir en caso de falla
      setLeads(previousLeads);
    }
  };

  return (
    <div className="flex flex-col h-full flex-1">
      
      {/* Barra de Acciones y Métricas Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Tablero Kanban
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {leads.length} leads totales
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supervisa el estado de prospección y arrastra los prospectos calificados en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors disabled:opacity-50"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <Link
            href="/nuevo-lead"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo Lead
          </Link>
        </div>
      </div>

      {/* Alerta de Error de Sincronización */}
      {syncError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* Área del Tablero con Drag & Drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-6">
          <div className="flex gap-4 min-w-[1400px] h-full items-start">
            {COLUMNS.map((col) => {
              const columnLeads = leads.filter((l) => l.status === col.id);

              return (
                <div
                  key={col.id}
                  id={col.id}
                  className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-210px)]"
                >
                  {/* Header de Columna */}
                  <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                      <h3 className="font-semibold text-xs text-slate-200">
                        {col.label}
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      {columnLeads.length}
                    </span>
                  </div>

                  {/* Tarjetas Droppable */}
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[160px]">
                    <SortableContext
                      items={columnLeads.map((l) => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {columnLeads.map((lead) => (
                        <LeadCard
                          key={lead.id}
                          lead={lead}
                          onSelect={(l) => setSelectedLead(l)}
                        />
                      ))}
                    </SortableContext>

                    {columnLeads.length === 0 && (
                      <div className="h-28 border border-dashed border-slate-800/60 rounded-xl flex items-center justify-center text-[11px] text-slate-500 select-none">
                        Sin prospectos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Overlay para arrastre suave */}
        <DragOverlay>
          {activeLead ? (
            <div className="rotate-2 scale-105 shadow-2xl opacity-90">
              <LeadCard lead={activeLead} onSelect={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal / Sheet Lateral */}
      <LeadDetailSheet
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdated={(updated) => {
          setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          setSelectedLead(updated);
        }}
      />
    </div>
  );
}
