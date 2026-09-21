/**
 * Utilidades de roles para RSD Solutions CRM.
 * Los roles se almacenan en raw_user_meta_data de Supabase Auth.
 * Estructura: { "role": "admin" | "comercial" }
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
  return role === 'admin' ? 'admin' : 'comercial';
}

/**
 * Determina si el usuario es administrador.
 */
export function isAdmin(user: User | null): boolean {
  return getUserRole(user) === 'admin';
}

/**
 * Devuelve la etiqueta visible para el rol.
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: 'Administrador',
    comercial: 'Asesor Comercial',
  };
  return labels[role];
}
