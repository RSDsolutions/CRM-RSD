/**
 * Utilidades de roles para RSD Solutions CRM.
 * Los roles se almacenan en raw_user_meta_data de Supabase Auth y en public.profiles.
 * Roles: 'admin' | 'comercial' | 'tecnico' | 'soporte'
 */

import { UserRole } from '@/types/database.types';
import { User } from '@supabase/supabase-js';

/**
 * Extrae el rol del usuario desde su metadata de Supabase Auth.
 * Si no tiene rol definido, devuelve 'comercial' por defecto.
 */
export function getUserRole(user: User | null): UserRole {
  if (!user) return 'comercial';
  const role = user.user_metadata?.role as UserRole | undefined;
  if (role === 'admin' || role === 'comercial' || role === 'tecnico' || role === 'soporte') {
    return role;
  }
  return 'comercial';
}

/**
 * Determina si el usuario es administrador principal (Robinson Solórzano).
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === 'admin';
}

/**
 * Determina si el usuario tiene permisos de aprobación crítica.
 */
export function canApprove(user: User | null): boolean {
  return isAdmin(user);
}

/**
 * Determina si el usuario es asesor comercial.
 */
export function isCommercial(user: User | null): boolean {
  return getUserRole(user) === 'comercial';
}

/**
 * Determina si el usuario es técnico / desarrollador.
 */
export function isTechnical(user: User | null): boolean {
  return getUserRole(user) === 'tecnico';
}

/**
 * Determina si el usuario es soporte / operaciones.
 */
export function isSupport(user: User | null): boolean {
  return getUserRole(user) === 'soporte';
}

/**
 * Devuelve la etiqueta visible para el rol.
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador (Dirección)',
    comercial: 'Asesor Comercial',
    tecnico: 'Desarrollador / Técnico',
    soporte: 'Soporte / Operaciones',
  };
  return labels[role] || 'Asesor Comercial';
}
