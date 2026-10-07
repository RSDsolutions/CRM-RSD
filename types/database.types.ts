// =============================================================
// RSD Solutions CRM — Tipos de base de datos
// Fase 1 Estructural: Lead → Demo → Propuesta → Cliente → Proyecto
// =============================================================

// ─── Roles del sistema ────────────────────────────────────────
export type UserRole = 'admin' | 'comercial' | 'tecnico' | 'soporte';

// ─── Nichos Empresariales ─────────────────────────────────────
export type BusinessNiche =
  | 'Clínica / consultorio'
  | 'Distribuidora / mayorista'
  | 'Servicios técnicos en campo'
  | 'Educación / academia'
  | 'Retail multisede'
  | 'Legal / consultoría'
  | 'Automotriz / taller'
  | 'Inmobiliario / construcción'
  | 'Otro';

export const BUSINESS_NICHES: BusinessNiche[] = [
  'Clínica / consultorio',
  'Distribuidora / mayorista',
  'Servicios técnicos en campo',
  'Educación / academia',
  'Retail multisede',
  'Legal / consultoría',
  'Automotriz / taller',
  'Inmobiliario / construcción',
  'Otro',
];

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
  // Fase B
  legal_name?: string | null;
  tax_id?: string | null;
  city?: string | null;
  province?: string | null;
  website?: string | null;
  social_media?: string | null;
  contact_role?: string | null;
  niche?: BusinessNiche | string | null;
  campaign?: string | null;
  main_need?: string | null;
  problem_description?: string | null;
  current_management_method?: string | null;
  team_size?: string | null;
  reference_budget?: string | null;
  next_action?: string | null;
  next_followup_date?: string | null;
  contact_preference?: string | null;
  is_archived?: boolean;
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

export type DemoApprovalStatus =
  | 'Borrador'
  | 'Solicitud enviada'
  | 'En revisión'
  | 'Observada / requiere ajustes'
  | 'Reenviada para revisión'
  | 'Aprobada internamente'
  | 'Lista para presentar'
  | 'Presentada al cliente'
  | 'Aceptada por el cliente'
  | 'Rechazada por el cliente'
  | 'Archivada';

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
  approval_status?: DemoApprovalStatus;
  approved_by?: string | null;
  approved_at?: string | null;
  approval_notes?: string | null;
  demo_version?: number;
  dna_version_used?: number | null;
  diagnostic_id?: string | null;
  functional_description?: string | null;
  modules_included?: string | null;
  main_flows?: string | null;
  target_roles?: string | null;
  visual_identity_received?: string | null;
  design_references?: string | null;
  test_data_used?: string | null;
  known_limitations?: string | null;
  acceptance_criteria?: string | null;
  client_feedback_decision?: string | null;
  client_feedback_notes?: string | null;
  client_feedback_date?: string | null;
  presented_at: string | null;
  assigned_to: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  leads?: {
    company_name: string;
    contact_name: string;
  } | null;
  demo_files?: DemoFile[];
  ai_usage_windows?: AIUsageWindow[];
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

// ─── Diagnóstico Comercial (Fase C) ───────────────────────────
export interface Diagnostic {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  meeting_id: string | null;
  advisor_id: string | null;
  conducted_by: string | null;
  status: 'Borrador' | 'Completado';
  business_activity: string | null;
  business_model: string | null;
  products_services: string | null;
  team_size: string | null;
  branches: string | null;
  current_tools: string | null;
  digitalization_level: string | null;
  main_problem: string | null;
  secondary_problems: string | null;
  current_workflow: string | null;
  bottlenecks: string | null;
  risks_losses: string | null;
  urgency_priority: string | null;
  expected_outcome: string | null;
  proposed_solution: string | null;
  potential_modules: string | null;
  user_roles: string | null;
  required_integrations: string | null;
  data_migration: string | null;
  restrictions: string | null;
  pending_validation: string | null;
  preliminary_feasibility: string | null;
  technical_risks: string | null;
  client_pending_info: string | null;
  next_action: string | null;
  requires_demo: boolean;
  internal_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── ADN de la Empresa / Cliente (Fase C) ──────────────────────
export interface CompanyDNA {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  version: number;
  business_name: string;
  industry_niche: string | null;
  business_overview: string | null;
  target_audience: string | null;
  business_model: string | null;
  operational_flow: string | null;
  current_tools: string | null;
  identified_pain_points: string | null;
  desired_modules: string | null;
  required_integrations: string | null;
  visual_identity_notes: string | null;
  design_preferences: string | null;
  reference_systems: string | null;
  constraints_budget: string | null;
  consolidated_context: string | null; // Contexto en Markdown para redacción manual del prompt
  status: 'Preliminar' | 'Confirmado' | 'En validación';
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Viabilidad del Proyecto (Fase C) ─────────────────────────
export interface FeasibilityReview {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  problem_to_solve: string | null;
  preliminary_scope: string | null;
  estimated_complexity: 'Baja' | 'Media' | 'Alta' | 'Muy Alta';
  required_modules: string | null;
  integrations: string | null;
  external_dependencies: string | null;
  technical_risks: string | null;
  operational_risks: string | null;
  estimated_timeline: string | null;
  preliminary_price_range: string | null;
  technical_notes: string | null;
  commercial_notes: string | null;
  recommendation: 'Viable' | 'Viable con condiciones' | 'Requiere más información' | 'No viable';
  robinson_decision: string | null;
  conditions_justification: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Archivos de Demo (.md) (Fase C) ──────────────────────────
export interface DemoFile {
  id: string;
  demo_id: string;
  file_name: string;
  file_type: string;
  file_content: string | null;
  file_size_bytes: number;
  is_required_by_robinson: boolean;
  status: 'Requerido' | 'Recibido' | 'Revisado' | 'Observado' | 'Aprobado';
  robinson_observations: string | null;
  version: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Registro de Uso de IA / Tokens de Demo (Fase C) ──────────
export interface AIUsageWindow {
  id: string;
  demo_id: string;
  advisor_id: string;
  provider: string;
  model: string | null;
  window_number: number;
  window_duration_hours: number;
  window_start_time: string;
  window_end_time: string | null;
  percentage_consumed: number; // 0 a 100
  work_summary: string;
  notes: string | null;
  robinson_reviewed: boolean;
  robinson_notes: string | null;
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
  base_amount?: number;
  extras_amount?: number;
  tax_rate?: number;
  tax_amount?: number;
  monthly_maintenance?: number;
  estimated_delivery_weeks?: number;
  commercial_terms?: string | null;
  robinson_approval_status?: 'Borrador' | 'Pendiente aprobación' | 'Aprobada por Robinson' | 'Rechazada';
  approved_by?: string | null;
  approved_at?: string | null;
  proposal_version?: number;
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
  commercial_advisor_id?: string | null;
  technical_director_id?: string | null;
  has_blocker?: boolean;
  active_blocker?: string | null;
  scope_version?: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  milestones?: ProjectMilestone[];
  scope_changes?: ScopeChangeRequest[];
}

// ─── Hitos de Proyecto (Fase D) ───────────────────────────────
export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  target_date: string;
  completed_date: string | null;
  status: 'Pendiente' | 'En progreso' | 'Completado' | 'Atrasado';
  order_index: number;
  created_at: string;
  updated_at: string;
}

// ─── Control de Cambios de Alcance (Fase D) ───────────────────
export interface ScopeChangeRequest {
  id: string;
  project_id: string;
  change_code: string;
  requested_by: string | null;
  description: string;
  reason: string;
  expected_benefit: string | null;
  affected_modules: string | null;
  technical_impact: string | null;
  schedule_impact_days: number;
  commercial_impact_amount: number;
  status: 'Solicitado' | 'En evaluación' | 'Pendiente aprobación interna' | 'Aprobado por Robinson' | 'Aprobado por cliente' | 'Rechazado' | 'Implementado';
  robinson_decision: string | null;
  robinson_notes: string | null;
  client_acceptance_date: string | null;
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

// ─── Actividades y Seguimiento (Fase B) ────────────────────────
export type ActivityType =
  | 'Llamada'
  | 'WhatsApp'
  | 'Correo'
  | 'Reunión'
  | 'Diagnóstico'
  | 'Presentación demo'
  | 'Seguimiento propuesta'
  | 'Seguimiento proyecto'
  | 'Seguimiento satisfacción'
  | 'Renovación'
  | 'Referido'
  | 'Nota interna'
  | 'Otro';

export type ActivityStatus = 'Planificada' | 'Realizada' | 'Cancelada' | 'Reprogramada';
export type ActivityVisibility = 'Interno' | 'Compartible';

export interface Activity {
  id: string;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  activity_type: ActivityType;
  activity_date: string;
  user_id: string | null;
  summary: string;
  result: string | null;
  next_step: string | null;
  next_followup_date: string | null;
  visibility: ActivityVisibility;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
  // Joined relation
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

// ─── Tareas Globales y Vinculadas (Fase B) ─────────────────────
export type TaskPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type TaskStatus = 'Pendiente' | 'En progreso' | 'Bloqueada' | 'Completada' | 'Cancelada';
export type TaskCategory = 'Comercial' | 'Técnica' | 'Administrativa' | 'Soporte';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string | null;
  created_by: string | null;
  due_date: string | null;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  completed_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  assigned_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
  leads?: {
    company_name: string;
    contact_name: string;
  } | null;
}

// ─── Agenda y Disponibilidad (Fase B) ─────────────────────────
export interface WeeklySchedule {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

export type SlotType =
  | 'Diagnóstico'
  | 'Presentación Demo'
  | 'General'
  | 'Bloqueo Personal'
  | 'Reunión Interna';

export interface AvailabilityBlock {
  id: string;
  user_id: string;
  title: string;
  slot_type: SlotType;
  start_time: string;
  end_time: string;
  is_available: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type MeetingType =
  | 'Diagnóstico'
  | 'Presentación de Demo'
  | 'Revisión de Propuesta'
  | 'Seguimiento'
  | 'Reunión de Proyecto'
  | 'Soporte'
  | 'Otro';

export type MeetingModality = 'Virtual' | 'Presencial';
export type MeetingStatus =
  | 'Solicitada'
  | 'Confirmada'
  | 'Realizada'
  | 'No asistió'
  | 'Cancelada'
  | 'Reprogramada';

export interface Meeting {
  id: string;
  title: string;
  meeting_type: MeetingType;
  host_id: string;
  advisor_id: string;
  lead_id: string | null;
  client_id: string | null;
  project_id: string | null;
  start_time: string;
  end_time: string;
  modality: MeetingModality;
  meeting_url: string | null;
  location: string | null;
  status: MeetingStatus;
  objective: string | null;
  notes: string | null;
  result: string | null;
  next_steps: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  host_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
  advisor_profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
  leads?: {
    company_name: string;
    contact_name: string;
    phone: string | null;
  } | null;
}

// ─── Control de Calidad (QA) (Fase E) ─────────────────────────
export type QATestStatus = 'Pendiente' | 'Aprobado' | 'Fallido' | 'Bloqueado';

export interface QATestCase {
  id: string;
  project_id: string;
  module_name: string;
  test_case_title: string;
  description: string | null;
  expected_result: string;
  actual_result: string | null;
  status: QATestStatus;
  evidence_url: string | null;
  responsible_id: string | null;
  executed_at: string | null;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Sesión de Capacitación (Fase E) ──────────────────────────
export interface TrainingSession {
  id: string;
  project_id: string;
  client_id: string;
  session_date: string;
  modality: 'Virtual' | 'Presencial';
  attendees: string;
  topics_covered: string;
  delivered_materials: string | null;
  client_questions: string | null;
  pending_items: string | null;
  instructor_id: string | null;
  client_confirmed: boolean;
  confirmation_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Tickets de Soporte e Incidencias (Fase E) ─────────────────
export type SupportTicketCategory =
  | 'Error en sistema'
  | 'Consulta técnica'
  | 'Solicitud de mejora'
  | 'Fallo de acceso'
  | 'Otro';

export type SupportTicketPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';
export type SupportTicketStatus = 'Abierto' | 'En diagnóstico' | 'En resolución' | 'Resuelto' | 'Cerrado';

export interface SupportTicket {
  id: string;
  ticket_code: string;
  client_id: string;
  project_id: string | null;
  requester_name: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  impact: string;
  description: string;
  evidence_url: string | null;
  assigned_to: string | null;
  status: SupportTicketStatus;
  diagnosis: string | null;
  solution: string | null;
  resolved_at: string | null;
  client_confirmed: boolean;
  commercial_followup_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  clients?: {
    company_name: string;
  } | null;
}

// ─── Oportunidades Perdidas y Recuperación (Fase E) ───────────
export type RecoveryStatus = 'En espera' | 'En reactivación' | 'Recuperado' | 'Definitivamente perdido';

export interface LostOpportunity {
  id: string;
  lead_id: string;
  loss_reason: string;
  stage_lost: string;
  competitor_chosen: string | null;
  main_objection: string | null;
  price_or_scope_reason: string | null;
  loss_date: string;
  responsible_id: string | null;
  recovery_attempts_count: number;
  last_recovery_date: string | null;
  next_reactivation_date: string | null;
  do_not_contact: boolean;
  recovery_status: RecoveryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  leads?: {
    company_name: string;
    contact_name: string;
    phone: string | null;
  } | null;
}

// ─── Referidos y Alianzas (Fase E) ────────────────────────────
export type ReferralStatus = 'Registrado' | 'En contacto' | 'En negociación' | 'Convertido a cliente' | 'Descartado';

export interface Referral {
  id: string;
  referrer_client_id: string | null;
  referred_name: string;
  referred_company: string | null;
  referred_phone: string | null;
  referred_email: string | null;
  advisor_id: string | null;
  status: ReferralStatus;
  incentive_authorized: boolean;
  incentive_details: string | null;
  followup_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  referrer_client?: {
    company_name: string;
  } | null;
}

// ─── Notificaciones Internas (Fase F) ─────────────────────────
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}


