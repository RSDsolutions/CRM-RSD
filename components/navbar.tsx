'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserRole, getRoleLabel } from '@/utils/auth/roles';
import { 
  KanbanSquare, 
  PlusCircle, 
  LogOut, 
  Layers,
  Users,
  ShieldCheck,
  UserCircle2,
  Monitor,
  FileText,
  FolderKanban,
  ChevronDown
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/database.types';

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: { label: string; href: string }[];
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('comercial');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setRole(getUserRole(data.user));
      }
    });
  }, [supabase]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const baseLinkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      isActive(href)
        ? 'bg-slate-800 text-white font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
    }`;

  const navGroups: NavGroup[] = [
    {
      label: 'Comercial',
      icon: <Monitor className="w-4 h-4" />,
      children: [
        { label: 'Leads (Kanban)', href: '/' },
        { label: 'Demos', href: '/comercial/demos' },
        { label: 'Propuestas', href: '/comercial/propuestas' },
      ],
    },
    {
      label: 'Clientes',
      icon: <Users className="w-4 h-4" />,
      href: '/clientes',
    },
    {
      label: 'Proyectos',
      icon: <FolderKanban className="w-4 h-4" />,
      href: '/proyectos',
    },
  ];

  const isGroupActive = (group: NavGroup) => {
    if (group.href) return isActive(group.href);
    return group.children?.some(c => isActive(c.href)) ?? false;
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-4" ref={dropdownRef}>
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white hidden sm:flex items-center gap-1.5">
              RSD Solutions
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                CRM
              </span>
            </span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-0.5 relative">
            {navGroups.map((group) => (
              <div key={group.label} className="relative">
                {group.href ? (
                  <Link href={group.href} className={baseLinkClass(group.href)}>
                    {group.icon}
                    {group.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setOpenGroup(openGroup === group.label ? null : group.label)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isGroupActive(group) || openGroup === group.label
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {group.icon}
                      {group.label}
                      <ChevronDown className={`w-3 h-3 transition-transform ${openGroup === group.label ? 'rotate-180' : ''}`} />
                    </button>

                    {openGroup === group.label && group.children && (
                      <div className="absolute top-full left-0 mt-1.5 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 py-1.5 z-50">
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpenGroup(null)}
                            className={`flex items-center px-3.5 py-2 text-xs font-medium transition-colors ${
                              isActive(child.href)
                                ? 'text-white bg-slate-800'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                            }`}
                          >
                            {child.label}
                          </Link>
                        ))}
                        <div className="mx-3 my-1.5 border-t border-slate-800" />
                        <Link
                          href="/nuevo-lead"
                          onClick={() => setOpenGroup(null)}
                          className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 transition-colors"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Nuevo Lead
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Acciones de usuario */}
        <div className="flex items-center gap-3">
          {/* Botón rápido móvil */}
          <Link
            href="/nuevo-lead"
            className="md:hidden p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            title="Nuevo Lead"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>

          {/* Rol + email */}
          {user && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-xs text-slate-300 font-medium truncate max-w-[180px]">
                {user.email}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                role === 'admin' ? 'text-violet-400' : 'text-indigo-400'
              }`}>
                {role === 'admin' 
                  ? <ShieldCheck className="w-3 h-3" />
                  : <UserCircle2 className="w-3 h-3" />
                }
                {getRoleLabel(role)}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors flex items-center gap-1.5 text-xs"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
