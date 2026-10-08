'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserRole, getRoleLabel } from '@/utils/auth/roles';
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/database.types';
import { NotificationsBell } from '@/components/notifications/notifications-bell';
import { CommandMenu } from '@/components/shell/command-menu';
import {
  KanbanSquare,
  Calendar,
  CheckSquare,
  Users,
  FolderKanban,
  Monitor,
  FileText,
  Activity,
  PlusCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Search,
  ShieldCheck,
  UserCircle2,
  Layers,
  ChevronDown,
  Sparkles,
  Users2,
  Library
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Comercial',
    items: [
      { label: 'Pipeline (Kanban)', href: '/', icon: KanbanSquare },
      { label: 'Directorio de Leads', href: '/leads', icon: Users2 },
      { label: 'Agenda & Citas', href: '/agenda', icon: Calendar },
      { label: 'Demos & Tokens IA', href: '/comercial/demos', icon: Monitor },
      { label: 'Propuestas', href: '/comercial/propuestas', icon: FileText },
    ],
  },
  {
    title: 'Clientes & Cuentas',
    items: [
      { label: 'Cartera 360', href: '/clientes', icon: Users },
    ],
  },
  {
    title: 'Producción & QA',
    items: [
      { label: 'Proyectos de Software', href: '/proyectos', icon: FolderKanban },
    ],
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Tareas & Seguimiento', href: '/tareas', icon: CheckSquare },
      { label: 'Recursos', href: '/recursos', icon: Library },
    ],
  },
  {
    title: 'Dirección',
    items: [
      { label: 'Dashboard Ejecutivo', href: '/dashboard', icon: Activity },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('comercial');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load user data
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setRole(getUserRole(data.user));
      }
    });
  }, [supabase]);

  // Load sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('rsd_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(saved === 'true');
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('rsd_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Global keydown listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // If login route, don't show shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  // Compute dynamic breadcrumbs
  const getBreadcrumbs = () => {
    if (pathname === '/') return ['Comercial', 'Pipeline Kanban'];
    if (pathname.startsWith('/leads')) return ['Comercial', 'Directorio de Leads'];
    if (pathname === '/nuevo-lead') return ['Comercial', 'Nuevo Lead'];
    if (pathname.startsWith('/agenda')) return ['Comercial', 'Agenda'];
    if (pathname.startsWith('/comercial/demos')) return ['Comercial', 'Demos'];
    if (pathname.startsWith('/comercial/propuestas')) return ['Comercial', 'Propuestas'];
    if (pathname.startsWith('/clientes')) return ['Clientes', 'Cartera 360'];
    if (pathname.startsWith('/proyectos')) return ['Producción', 'Proyectos'];
    if (pathname.startsWith('/tareas')) return ['Operaciones', 'Tareas'];
    if (pathname.startsWith('/dashboard')) return ['Dirección', 'Dashboard'];
    return ['RSD Solutions', 'CRM'];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col antialiased text-slate-100">
      
      {/* ─── GLOBAL COMMAND PALETTE MODAL ─── */}
      <CommandMenu isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      <div className="flex flex-1 min-h-screen">
        {/* ─── DESKTOP SIDEBAR ─── */}
        <aside
          className={`hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950 sticky top-0 h-screen transition-all duration-300 z-30 select-none ${
            isCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand Header */}
          <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 flex-shrink-0 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm tracking-tight text-white truncate">
                      RSD Solutions
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      CRM
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate">Software a Medida</span>
                </div>
              )}
            </Link>

            {/* Collapse toggle */}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
              title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    {section.title}
                  </h4>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        active
                          ? 'bg-gradient-to-r from-indigo-500/15 to-violet-500/10 text-white font-semibold border border-indigo-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                      } ${isCollapsed ? 'justify-center' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-colors ${
                          active ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      />
                      {!isCollapsed && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}
                      {!isCollapsed && active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Fast Action */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
            <Link
              href="/nuevo-lead"
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/20 transition-all ${
                isCollapsed ? 'justify-center p-2.5' : ''
              }`}
              title="Registrar Nuevo Lead"
            >
              <PlusCircle className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>Nuevo Lead</span>}
            </Link>
          </div>
        </aside>

        {/* ─── MOBILE DRAWER (SLIDE-OVER) ─── */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            
            {/* Drawer */}
            <div className="relative w-72 max-w-[80vw] bg-slate-950 border-r border-slate-800 h-full flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  <span className="font-extrabold text-sm text-white">RSD Solutions</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {section.title}
                    </h4>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium ${
                            active
                              ? 'bg-indigo-600/20 text-white font-semibold border border-indigo-500/40'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-800">
                <Link
                  href="/nuevo-lead"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-xs text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nuevo Lead</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ─── MAIN CONTENT AREA ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* ─── GLOBAL HEADER ─── */}
          <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between gap-4">
            
            {/* Left side: Mobile trigger + Breadcrumb */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
                title="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Breadcrumb Trail */}
              <nav className="flex items-center gap-2 text-xs text-slate-400 truncate">
                <span className="text-slate-400 font-medium">{breadcrumbs[0]}</span>
                <span className="text-slate-600">/</span>
                <span className="text-white font-bold tracking-tight truncate">
                  {breadcrumbs[1]}
                </span>
              </nav>
            </div>

            {/* Right side: Search shortcut, Notifications, Profile */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Command Palette Button */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 hover:text-slate-200 transition-all shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400">Buscar o ir a...</span>
                <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-950 border border-slate-800 rounded-md">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile search button */}
              <button
                onClick={() => setIsCommandOpen(true)}
                className="sm:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800"
                title="Buscar (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Notifications Bell */}
              <NotificationsBell />

              {/* User Profile Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-indigo-500/20">
                    {user?.email ? user.email.substring(0, 2).toUpperCase() : 'RS'}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                      {user?.email?.split('@')[0] || 'Usuario'}
                    </span>
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                      role === 'admin' ? 'text-violet-400' : 'text-indigo-400'
                    }`}>
                      {getRoleLabel(role)}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <p className="text-xs font-bold text-white truncate">{user?.email}</p>
                      <p className="text-[10px] text-indigo-400 font-semibold mt-0.5">
                        {role === 'admin' ? 'Super Admin' : 'Asesor Comercial'}
                      </p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                      >
                        <Activity className="w-4 h-4 text-indigo-400" />
                        Dashboard Ejecutivo
                      </Link>
                      <Link
                        href="/nuevo-lead"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-400" />
                        Nuevo Prospecto
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ─── PAGE CONTENT CONTAINER ─── */}
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
