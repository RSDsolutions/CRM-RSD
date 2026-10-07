'use client';

import { useState, useMemo } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Plus, 
  Calendar, 
  User, 
  CheckCircle2, 
  Filter, 
  Loader2, 
  FolderKanban,
  Flame,
  X,
  PlusCircle
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '@/types/database.types';
import { createTaskAction, updateTaskStatusAction } from '@/app/actions/tasks';
import { EmptyState } from '@/components/ui/empty-state';

interface TaskBoardViewProps {
  initialTasks: Task[];
}

export function TaskBoardView({ initialTasks }: TaskBoardViewProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Comercial' as TaskCategory,
    priority: 'Media' as TaskPriority,
    due_date: '',
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, filterPriority, filterCategory]);

  const stats = useMemo(() => {
    const overdue = tasks.filter(t => t.due_date && isPast(parseISO(t.due_date)) && t.status !== 'Completada').length;
    const critical = tasks.filter(t => (t.priority === 'Crítica' || t.priority === 'Alta') && t.status !== 'Completada').length;
    const completed = tasks.filter(t => t.status === 'Completada').length;
    return { overdue, critical, completed, total: tasks.length };
  }, [tasks]);

  const columns: { status: TaskStatus; label: string; dot: string; color: string }[] = [
    { status: 'Pendiente', label: 'Pendientes', dot: 'bg-slate-400', color: 'border-slate-800 bg-slate-900/60' },
    { status: 'En progreso', label: 'En Progreso', dot: 'bg-indigo-400', color: 'border-indigo-500/30 bg-indigo-950/20' },
    { status: 'Bloqueada', label: 'Bloqueadas', dot: 'bg-amber-400', color: 'border-amber-500/30 bg-amber-950/20' },
    { status: 'Completada', label: 'Completadas', dot: 'bg-emerald-400', color: 'border-emerald-500/30 bg-emerald-950/20' },
  ];

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    await updateTaskStatusAction(taskId, newStatus);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setIsSubmitting(true);
    const res = await createTaskAction({
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
    });

    setIsSubmitting(false);
    if (res.success && res.task) {
      setTasks(prev => [res.task as Task, ...prev]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        category: 'Comercial',
        priority: 'Media',
        due_date: '',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── HEADER: ACCIONES Y RESUMEN ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-400" />
              Gestión de Tareas & Compromisos
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {stats.total} tareas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Seguimiento de entregas, llamadas comerciales y compromisos técnicos.
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex flex-wrap items-center gap-2.5">
          {stats.overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>{stats.overdue} vencidas</span>
            </div>
          )}

          {stats.critical > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.critical} urgentes</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{stats.completed} listas</span>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        </div>
      </div>

      {/* ─── FILTROS ─── */}
      <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1.5 mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-500" /> Filtrar por:
        </span>

        {/* Prioridad */}
        <select
          value={filterPriority}
          onChange={e => setFilterPriority(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">Todas las Prioridades</option>
          <option value="Crítica">Crítica</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>

        {/* Categoría */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="all">Todas las Categorías</option>
          <option value="Comercial">Comercial</option>
          <option value="Técnica">Técnica</option>
          <option value="Administrativa">Administrativa</option>
          <option value="Soporte">Soporte</option>
        </select>

        {(filterPriority !== 'all' || filterCategory !== 'all') && (
          <button
            onClick={() => {
              setFilterPriority('all');
              setFilterCategory('all');
            }}
            className="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        )}
      </div>

      {/* ─── TABLERO DE TAREAS (COLUMNAS KANBAN) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);

          return (
            <div 
              key={col.status}
              className={`border rounded-2xl p-4 flex flex-col min-h-[520px] ${col.color}`}
            >
              {/* Header Columna */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  {col.label}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-semibold">
                    {colTasks.length}
                  </span>
                </span>
              </div>

              {/* Lista de Tarjetas */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {colTasks.map(task => {
                  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'Completada';

                  return (
                    <div
                      key={task.id}
                      className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-all space-y-2 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          task.priority === 'Crítica' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          task.priority === 'Alta' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          task.priority === 'Media' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {task.priority}
                        </span>

                        <span className="text-[10px] text-slate-400 font-medium">
                          {task.category}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-white leading-snug">
                        {task.title}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.leads && (
                        <div className="text-[10px] text-indigo-300 font-medium flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 text-indigo-400" />
                          <span>{task.leads.company_name}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                        {task.due_date ? (
                          <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                            <Calendar className="w-3 h-3" />
                            {format(parseISO(task.due_date), 'd MMM, HH:mm', { locale: es })}
                            {isOverdue && ' (Vencida)'}
                          </span>
                        ) : (
                          <span className="text-slate-600">Sin fecha límite</span>
                        )}

                        {/* Cambiador rápido de estado */}
                        <select
                          value={task.status}
                          onChange={e => handleStatusChange(task.id, e.target.value as TaskStatus)}
                          className="bg-slate-950 border border-slate-800 text-[10px] rounded-lg px-2 py-1 text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="En progreso">En progreso</option>
                          <option value="Bloqueada">Bloqueada</option>
                          <option value="Completada">Completada</option>
                        </select>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="h-36 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center text-[11px] text-slate-600 select-none">
                    No hay tareas en esta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── MODAL: NUEVA TAREA ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Registrar Nueva Tarea
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Título de la Tarea <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Enviar propuesta técnica ajustada"
                  value={newTask.title}
                  onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Descripción / Notas</label>
                <textarea
                  rows={3}
                  placeholder="Detalles sobre lo que debe realizarse..."
                  value={newTask.description}
                  onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Categoría</label>
                  <select
                    value={newTask.category}
                    onChange={e => setNewTask({ ...newTask, category: e.target.value as TaskCategory })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Comercial">Comercial</option>
                    <option value="Técnica">Técnica</option>
                    <option value="Administrativa">Administrativa</option>
                    <option value="Soporte">Soporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Prioridad</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({ ...newTask, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs cursor-pointer focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Crítica">Crítica</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Fecha y Hora Límite</label>
                <input
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Crear Tarea'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
