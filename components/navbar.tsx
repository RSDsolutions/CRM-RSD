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
  UserCircle2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { UserRole } from '@/types/database.types';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('comercial');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser(data.user);
        setRole(getUserRole(data.user));
      }
    });
  }, [supabase]);

  // No mostrar navbar en la página de login
  if (pathname === '/login') return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navLinkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
      isActive(href)
        ? 'bg-slate-800 text-white font-semibold'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
    }`;

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo RSD Solutions */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                RSD Solutions
                <span className="text-[10px] font-semibold tracking-normal px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  CRM
                </span>
              </span>
            </div>
          </Link>

          {/* Navegación principal */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className={navLinkClass('/')}>
              <KanbanSquare className="w-4 h-4" />
              Kanban
            </Link>

            <Link href="/nuevo-lead" className={navLinkClass('/nuevo-lead')}>
              <PlusCircle className="w-4 h-4" />
              Nuevo Lead
            </Link>

            <Link href="/clientes" className={navLinkClass('/clientes')}>
              <Users className="w-4 h-4" />
              Clientes
            </Link>
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">

          {/* Botón móvil: Nuevo Lead */}
          <Link
            href="/nuevo-lead"
            className="md:hidden p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            title="Nuevo Lead"
          >
            <PlusCircle className="w-4 h-4" />
          </Link>

          {/* Badge de rol + email */}
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
