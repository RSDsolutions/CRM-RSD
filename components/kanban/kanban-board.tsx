'use client';

import { useState, useMemo } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent, 
  PointerSensor, 
  useSensor, 
  useSensors,
  useDroppable
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { Lead, LeadStatus } from '@/types/database.types';
import { LeadCard } from './lead-card';
import { LeadDetailSheet } from './lead-detail-sheet';
import { createClient } from '@/utils/supabase/client';
import { 
  PlusCircle, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  Filter, 
  Calendar, 
  Flame, 
  TrendingUp, 
  X,
  Users
} from 'lucide-react';
import Link from 'next/link';

// Columnas del Kanban — refleja el pipeline comercial real de RSD Solutions
const COLUMNS: { id: LeadStatus; label: string; dotColor: string }[] = [
  { id: 'Nuevo',           label: 'Nuevo',           dotColor: 'bg-blue-500' },
  { id: 'Contactado',      label: 'Contactado',      dotColor: 'bg-yellow-500' },
  { id: 'Diagnóstico',     label: 'Diagnóstico',     dotColor: 'bg-sky-500' },
  { id: 'Demo',            label: 'Demo',            dotColor: 'bg-purple-500' },
  { id: 'Feedback Demo',   label: 'Feedback Demo',   dotColor: 'bg-violet-500' },
  { id: 'Propuesta',       label: 'Propuesta',       dotColor: 'bg-cyan-500' },
  { id: 'Negociación',     label: 'Negociación',     dotColor: 'bg-amber-500' },
  { id: 'Aprobado',        label: 'Aprobado',        dotColor: 'bg-teal-500' },
  { id: 'Convertido',      label: 'Convertido',      dotColor: 'bg-emerald-500' },
  { id: 'Cerrado-Perdido', label: 'Perdido',         dotColor: 'bg-rose-500' },
];

interface KanbanBoardProps {
  initialLeads: Lead[];
}

function DroppableColumn({ 
  col, 
  columnLeads, 
  children 
}: { 
  col: (typeof COLUMNS)[number]; 
  columnLeads: Lead[]; 
  children: React.ReactNode; 
}) {
  const { setNodeRef } = useDroppable({
    id: col.id,
  });

  return (
    <div
      ref={setNodeRef}
      id={col.id}
      className="flex-1 min-w-[280px] max-w-[340px] bg-slate-900/60 border border-slate-800/80 rounded-2xl flex flex-col max-h-[calc(100vh-220px)] shadow-lg shadow-black/20"
    >
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
          <h3 className="font-semibold text-xs text-slate-200">
            {col.label}
          </h3>
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
          {columnLeads.length}
        </span>
      </div>
      {children}
    </div>
  );
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [onlyAttention, setOnlyAttention] = useState<boolean>(false);

  // Sensor con distancia mínima de 5px para distinguir clic de arrastre
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Extraer lista única de asesores
  const uniqueAdvisors = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.assigned_to) set.add(l.assigned_to);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtrado de leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // 1. Búsqueda de texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchCompany = lead.company_name?.toLowerCase().includes(q);
        const matchContact = lead.contact_name?.toLowerCase().includes(q);
        const matchNeed = lead.main_need?.toLowerCase().includes(q) || lead.problem_description?.toLowerCase().includes(q);
        const matchPhone = lead.phone?.toLowerCase().includes(q);
        if (!matchCompany && !matchContact && !matchNeed && !matchPhone) {
          return false;
        }
      }

      // 2. Filtro asesor
      if (advisorFilter !== 'all' && lead.assigned_to !== advisorFilter) {
        return false;
      }

      // 3. Filtro prioridad
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) {
        return false;
      }

      // 4. Toggle solo requiere atención
      if (onlyAttention) {
        const hasAppointment = lead.appointment_scheduled;
        const isHigh = lead.priority === 'Alta';
        if (!hasAppointment && !isHigh) {
          return false;
        }
      }

      return true;
    });
  }, [leads, searchQuery, advisorFilter, priorityFilter, onlyAttention]);

  // Métricas rápidas calculadas
  const stats = useMemo(() => {
    const withApp = leads.filter((l) => l.appointment_scheduled).length;
    const highPri = leads.filter((l) => l.priority === 'Alta').length;
    const closing = leads.filter((l) => l.status === 'Negociación' || l.status === 'Aprobado').length;
    return { withApp, highPri, closing };
  }, [leads]);

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

    // Detectar si el drop fue en la columna o sobre otra tarjeta
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

    // 2. MUTACIÓN ASÍNCRONA EN SUPABASE CON ROLLBACK
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
      setLeads(previousLeads);
    }
  };

  const hasActiveFilters = searchQuery !== '' || advisorFilter !== 'all' || priorityFilter !== 'all' || onlyAttention;

  const clearFilters = () => {
    setSearchQuery('');
    setAdvisorFilter('all');
    setPriorityFilter('all');
    setOnlyAttention(false);
  };

  return (
    <div className="flex flex-col h-full flex-1 space-y-4">
      
      {/* ─── BARRA SUPERIOR: TÍTULO, MÉTRICAS & ACCIONES ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Pipeline Comercial
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {leads.length} prospectos
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Flujo operativo integral: califica y mueve prospectos a lo largo del embudo de conversión.
            </p>
          </div>

          {/* Mini-indicadores rápidos */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs font-medium">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{stats.withApp} con cita</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>{stats.highPri} alta prioridad</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats.closing} en cierre</span>
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-50"
            title="Refrescar leads desde Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>

          <Link
            href="/nuevo-lead"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nuevo Lead</span>
          </Link>
        </div>
      </div>

      {/* ─── BARRA DE FILTROS Y BÚSQUEDA EN TIEMPO REAL ─── */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl text-xs">
        {/* Buscador */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por empresa, contacto o dolor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro Asesor */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={advisorFilter}
            onChange={(e) => setAdvisorFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los Asesores</option>
            {uniqueAdvisors.map((adv) => (
              <option key={adv} value={adv}>
                {adv}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro Prioridad */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las Prioridades</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </div>

        {/* Toggle Requiere Atención */}
        <button
          onClick={() => setOnlyAttention(!onlyAttention)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            onlyAttention
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Flame className={`w-3.5 h-3.5 ${onlyAttention ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>Requiere Atención</span>
        </button>

        {/* Reset filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-950 transition-colors text-xs"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Alerta de Error de Sincronización */}
      {syncError && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{syncError}</span>
        </div>
      )}

      {/* ─── ÁREA DEL TABLERO KANBAN CON DRAG & DROP ─── */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto pb-4 pt-1">
          <div className="flex gap-4 min-w-[1400px] h-full items-start">
            {COLUMNS.map((col) => {
              const columnLeads = filteredLeads.filter((l) => l.status === col.id);

              return (
                <DroppableColumn key={col.id} col={col} columnLeads={columnLeads}>
                  <div className="p-3 flex-1 overflow-y-auto space-y-3 min-h-[180px]">
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
                      <div className="h-28 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[11px] text-slate-500 select-none">
                        Sin prospectos
                      </div>
                    )}
                  </div>
                </DroppableColumn>
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

      {/* ─── MODAL / SHEET LATERAL DE OPERACIONES ─── */}
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
