// =============================================================
// RSD Solutions CRM — Tipos de base de datos
// Fase 1 Estructural: Lead → Demo → Propuesta → Cliente → Proyecto
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

// Estado completo del lead (incluye valores legacy para compatibilidad)
export type LeadStatus =
  // Flujo nuevo
  | 'Nuevo'
  | 'Contactado'
  | 'Diagnóstico'
  | 'Demo'
  | 'Feedback Demo'
  | 'Cita Agendada'    // legacy: mantener por compatibilidad con leads actuales
  | 'Propuesta'
  | 'Negociación'
  | 'Aprobado'
  | 'Convertido'
  | 'Cerrado-Ganado'   // legacy: mantener por compatibilidad
  | 'Cerrado-Perdido'  // legacy: mantener por compatibilidad
  | 'Perdido';

// Kanban columns: los que se muestran como columnas visibles
export const LEAD_STATUS_KANBAN: LeadStatus[] = [
  'Nuevo',
  'Contactado',
  'Diagnóstico',
  'Demo',
  'Feedback Demo',
  'Propuesta',
  'Negociación',
  'Aprobado',
  'Convertido',
  'Cerrado-Perdido',
];

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
  // Fase 2+
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

// ─── Profile (vinculado a auth.users) ─────────────────────────
export interface Profile {
  id: string;           // = auth.users.id
  full_name: string | null;
  role: UserRole;
  email: string | null;
  avatar_url: string | null;
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

// ─── Demo ─────────────────────────────────────────────────────
export type DemoStatus =
  | 'Pendiente'
  | 'Programada'
  | 'Presentada'
  | 'Interesado'
  | 'Solicita cambios'
  | 'No interesado'
  | 'Convertida a proyecto'
  | 'Cancelada';

export interface Demo {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  name: string;
  software_type: SoftwareType;
  description: string | null;
  objective: string | null;
  demo_url: string | null;
  status: DemoStatus;
  presented_at: string | null;
  assigned_to: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

// ─── DemoFeedback ─────────────────────────────────────────────
export type FeedbackType =
  | 'Comentario'
  | 'Solicitud de cambio'
  | 'Objeción'
  | 'Resultado'
  | 'Confirmación';

export interface DemoFeedback {
  id: string;
  demo_id: string;
  feedback_type: FeedbackType;
  comment: string;
  requested_change: string | null;
  outcome: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Proposal ─────────────────────────────────────────────────
export type ProposalStatus =
  | 'Borrador'
  | 'Enviada'
  | 'Vista'
  | 'En negociación'
  | 'Aceptada'
  | 'Rechazada'
  | 'Vencida'
  | 'Cancelada';

export interface Proposal {
  id: string;
  proposal_number: string | null;
  lead_id: string | null;
  demo_id: string | null;
  client_id: string | null;
  title: string;
  description: string | null;
  scope: string | null;
  price: number | null;
  discount: number;
  total: number | null;
  currency: string;
  valid_until: string | null;
  status: ProposalStatus;
  rejection_reason: string | null;
  document_url: string | null;
  notes: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Project ──────────────────────────────────────────────────
export type ProjectStatus =
  | 'Pendiente de inicio'
  | 'Planificaci\u00f3n'
  | 'Dise\u00f1o'
  | 'Desarrollo'
  | 'Pruebas internas'
  | 'Cancelado'
  | 'Completado';

export interface Project {
  id: string;
  project_code: string | null;
  name: string;
  description: string | null;
  scope: string | null;
  client_id: string;
  proposal_id: string | null;
  demo_id: string | null;
  software_type: SoftwareType | null;
  price: number | null;
  currency: string;
  status: ProjectStatus;
  start_date: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  production_url: string | null;
  repository_url: string | null;
  assigned_to: string | null;
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

// \u2500\u2500\u2500 ProjectDelivery \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type DeliveryStatus =
  | 'Pendiente revisi\u00f3n'
  | 'En revisi\u00f3n'
  | 'Aceptada'
  | 'Rechazada'
  | 'Aceptada con observaciones';

export interface ProjectDelivery {
  id: string;
  project_id: string;
  delivery_number: number;
  title: string;
  description: string | null;
  version: string | null;
  status: DeliveryStatus;
  delivery_url: string | null;
  repository_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// \u2500\u2500\u2500 ProjectAcceptance \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type AcceptanceStatus =
  | 'Aceptada'
  | 'Aceptada con observaciones'
  | 'Rechazada';

export interface ProjectAcceptance {
  id: string;
  project_id: string;
  delivery_id: string | null;
  status: AcceptanceStatus;
  accepted_by_client_name: string | null;
  observations: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// \u2500\u2500\u2500 Payment \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type PaymentType = 'Anticipo' | 'Hito' | 'Saldo final' | '\u00danico';
export type PaymentStatus = 'Pendiente' | 'Registrado' | 'Confirmado' | 'Rechazado' | 'Anulado';

export interface Payment {
  id: string;
  project_id: string;
  proposal_id: string | null;
  client_id: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  status: PaymentStatus;
  payment_date: string | null;
  payment_method: string | null;
  reference: string | null;
  receipt_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// \u2500\u2500\u2500 MaintenanceContract \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type MaintenanceType = 'Incluido' | 'Renovaci\u00f3n';
export type MaintenanceStatus = 'Pendiente' | 'Activo' | 'Por vencer' | 'Vencido' | 'Renovado' | 'Cancelado';

export interface MaintenanceContract {
  id: string;
  project_id: string;
  client_id: string;
  payment_id: string | null;
  type: MaintenanceType;
  status: MaintenanceStatus;
  start_date: string | null;
  end_date: string | null;
  duration_months: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// \u2500\u2500\u2500 MaintenanceEvent \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type MaintenanceEventType = 'Soporte' | 'Correcci\u00f3n' | 'Preventivo' | 'Incidencia' | 'Otro';
export type MaintenanceEventStatus = 'Abierto' | 'En progreso' | 'Resuelto' | 'Cerrado';
export type PriorityLevel = 'Alta' | 'Media' | 'Baja';

export interface MaintenanceEvent {
  id: string;
  maintenance_contract_id: string;
  type: MaintenanceEventType;
  title: string;
  description: string | null;
  status: MaintenanceEventStatus;
  priority: PriorityLevel;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// \u2500\u2500\u2500 Renewal \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
export type RenewalStatus = 'Contactar' | 'Propuesta enviada' | 'En negociaci\u00f3n' | 'Renovado' | 'No renovado';

export interface Renewal {
  id: string;
  client_id: string;
  project_id: string | null;
  maintenance_contract_id: string | null;
  status: RenewalStatus;
  renewal_date_target: string | null;
  amount: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
