// =============================================================
// RSD Solutions CRM — Tipos de base de datos
// Generado manualmente. Fase 2: Roles, Clientes, Auditoría.
// =============================================================

// ─── Roles del sistema ────────────────────────────────────────
export type UserRole = 'admin' | 'comercial';

// ─── ENUMs de Leads ───────────────────────────────────────────
export type SoftwareType =
  | 'Web App'
  | 'Mobile App'
  | 'E-commerce'
  | 'ERP/CRM'
  | 'Landing Page'
  | 'Otro';

export type LeadStatus =
  | 'Nuevo'
  | 'Contactado'
  | 'Cita Agendada'
  | 'Propuesta'
  | 'Negociación'
  | 'Cerrado-Ganado'
  | 'Cerrado-Perdido';

export type LeadPriority = 'Alta' | 'Media' | 'Baja';

export type LeadSource =
  | 'Facebook Ads'
  | 'Google Ads'
  | 'Instagram Ads'
  | 'Referido'
  | 'Directo'
  | 'Otro';

// ─── Entidad Lead ─────────────────────────────────────────────
export interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  software_type: SoftwareType;
  interaction_log: string;
  appointment_scheduled: boolean;
  appointment_date: string | null;
  status: LeadStatus;
  assigned_to: string;
  // Fase 2: campos nuevos (opcionales para compatibilidad con registros previos)
  phone?: string | null;
  email?: string | null;
  lead_source?: LeadSource | null;
  priority?: LeadPriority;
  converted_at?: string | null;
  client_id?: string | null;
  assigned_to_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Estado de un Cliente ─────────────────────────────────────
export type ClientStatus = 'Activo' | 'Inactivo' | 'Suspendido';

// ─── Entidad Client ───────────────────────────────────────────
export interface Client {
  id: string;
  company_name: string;
  trade_name: string | null;
  tax_id: string | null;
  industry: string | null;
  website: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string;
  status: ClientStatus;
  lead_id: string | null;
  assigned_to: string | null;
  converted_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Entidad ClientContact ────────────────────────────────────
export interface ClientContact {
  id: string;
  client_id: string;
  full_name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Entidad AuditLog ─────────────────────────────────────────
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}
