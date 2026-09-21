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
  created_at: string;
  updated_at: string;
}
