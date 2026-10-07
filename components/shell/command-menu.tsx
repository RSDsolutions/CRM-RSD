'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  KanbanSquare,
  Calendar,
  CheckSquare,
  Users,
  FolderKanban,
  Monitor,
  FileText,
  Activity,
  PlusCircle,
  ArrowRight,
  X,
  Command as CommandIcon,
  Sparkles
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: 'Navegación' | 'Acción Rápida';
  href: string;
  icon: any;
  keywords?: string[];
}

const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'kanban',
    title: 'Tablero Kanban (Pipeline Comercial)',
    category: 'Navegación',
    href: '/',
    icon: KanbanSquare,
    keywords: ['leads', 'kanban', 'pipeline', 'prospectos', 'ventas'],
  },
  {
    id: 'agenda',
    title: 'Agenda & Diagnósticos (Robinson)',
    category: 'Navegación',
    href: '/agenda',
    icon: Calendar,
    keywords: ['citas', 'reuniones', 'calendario', 'diagnostico', 'meet'],
  },
  {
    id: 'tareas',
    title: 'Tareas & Compromisos Operativos',
    category: 'Navegación',
    href: '/tareas',
    icon: CheckSquare,
    keywords: ['tareas', 'pendientes', 'todo', 'compromisos'],
  },
  {
    id: 'clientes',
    title: 'Cartera de Clientes 360',
    category: 'Navegación',
    href: '/clientes',
    icon: Users,
    keywords: ['clientes', 'empresas', 'contactos', '360'],
  },
  {
    id: 'proyectos',
    title: 'Proyectos de Desarrollo & Alcance',
    category: 'Navegación',
    href: '/proyectos',
    icon: FolderKanban,
    keywords: ['proyectos', 'desarrollo', 'hitos', 'entregas', 'qa'],
  },
  {
    id: 'demos',
    title: 'Demos & Declaración de Tokens IA',
    category: 'Navegación',
    href: '/comercial/demos',
    icon: Monitor,
    keywords: ['demos', 'tokens', 'ia', 'prototipos'],
  },
  {
    id: 'propuestas',
    title: 'Propuestas Comerciales & Cotizaciones',
    category: 'Navegación',
    href: '/comercial/propuestas',
    icon: FileText,
    keywords: ['propuestas', 'cotizaciones', 'presupuesto', 'precios'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Ejecutivo & Dirección',
    category: 'Navegación',
    href: '/dashboard',
    icon: Activity,
    keywords: ['dashboard', 'metricas', 'kpi', 'direccion', 'estadisticas'],
  },
  {
    id: 'new-lead',
    title: 'Registrar Nuevo Prospecto (Lead)',
    category: 'Acción Rápida',
    href: '/nuevo-lead',
    icon: PlusCircle,
    keywords: ['crear', 'nuevo lead', 'prospecto', 'onboarding'],
  },
  {
    id: 'new-client',
    title: 'Crear Nuevo Cliente Directo',
    category: 'Acción Rápida',
    href: '/clientes/nuevo',
    icon: Users,
    keywords: ['crear cliente', 'nuevo cliente'],
  },
  {
    id: 'new-project',
    title: 'Crear Nuevo Proyecto',
    category: 'Acción Rápida',
    href: '/proyectos/nuevo',
    icon: FolderKanban,
    keywords: ['crear proyecto', 'nuevo proyecto'],
  },
  {
    id: 'new-proposal',
    title: 'Generar Nueva Propuesta Económica',
    category: 'Acción Rápida',
    href: '/comercial/propuestas/nueva',
    icon: FileText,
    keywords: ['nueva propuesta', 'cotizar'],
  },
];

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandMenu({ isOpen, onClose }: CommandMenuProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filtered = COMMAND_ITEMS.filter((item) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const matchTitle = item.title.toLowerCase().includes(q);
    const matchCategory = item.category.toLowerCase().includes(q);
    const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
    return matchTitle || matchCategory || matchKeywords;
  });

  const handleSelect = (item: CommandItem) => {
    onClose();
    router.push(item.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800/80 bg-slate-950/40">
          <Search className="w-4 h-4 text-slate-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando o busca módulo..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No se encontraron comandos o módulos para &ldquo;{query}&rdquo;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <span className="text-[10px] text-slate-500">{item.category}</span>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'text-indigo-400 translate-x-1' : 'text-slate-600'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span>Navegar con</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">↑</kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">↓</kbd>
            <span>Seleccionar con</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">↵</kbd>
          </div>
          <span className="text-indigo-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> RSD Command Suite
          </span>
        </div>
      </div>
    </div>
  );
}
