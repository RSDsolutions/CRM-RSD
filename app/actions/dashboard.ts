'use server';

import { createClient } from '@/utils/supabase/server';
import { AuditLog } from '@/types/database.types';

export interface ComprehensiveDashboardMetrics {
  leads: {
    total: number;
    newCount: number;
    unattendedCount: number;
    byStage: Record<string, number>;
  };
  diagnostics: {
    scheduledCount: number;
    completedCount: number;
  };
  demos: {
    total: number;
    inPreparationCount: number;
    pendingApprovalCount: number;
    approvedCount: number;
    presentedCount: number;
    acceptedCount: number;
    aiWindowsCount: number;
    aiAvgPercentage: number;
  };
  proposals: {
    total: number;
    pendingApprovalCount: number;
    approvedCount: number;
    totalAmount: number;
  };
  projects: {
    activeCount: number;
    completedCount: number;
    blockedCount: number;
  };
  tasks: {
    pendingCount: number;
    overdueCount: number;
  };
  clients: {
    activeCount: number;
    maintenanceActiveCount: number;
    expiringSoonCount: number;
  };
  support: {
    openTicketsCount: number;
    criticalTicketsCount: number;
  };
  retention: {
    lostOpportunitiesCount: number;
    referralsCount: number;
  };
  recentAudits: AuditLog[];
}

export async function getComprehensiveDashboardMetricsAction(): Promise<ComprehensiveDashboardMetrics> {
  const supabase = createClient();
  const now = new Date();
  const todayIso = now.toISOString();
  const next30DaysIso = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  // 1. Leads & Pipeline
  const { data: leadsData } = await supabase
    .from('leads')
    .select('id, status, is_first_contacted, is_archived, created_at');

  const leads = leadsData || [];
  const leadsByStage: Record<string, number> = {};
  let newCount = 0;
  let unattendedCount = 0;

  leads.forEach(l => {
    if (l.is_archived) return;
    leadsByStage[l.status] = (leadsByStage[l.status] || 0) + 1;
    if (l.status === 'Nuevo' || l.status === 'Nuevo lead') newCount++;
    if (!l.is_first_contacted) unattendedCount++;
  });

  // 2. Diagnósticos y Reuniones
  const { data: meetingsData } = await supabase
    .from('meetings')
    .select('id, meeting_type, status');

  const meetings = meetingsData || [];
  const diagScheduled = meetings.filter(m => m.meeting_type === 'Diagnóstico' && m.status === 'Confirmada').length;
  const diagCompleted = meetings.filter(m => m.meeting_type === 'Diagnóstico' && m.status === 'Realizada').length;

  // 3. Demos & Consumo de Tokens IA (Ventanas de 5 horas manuales)
  const [{ data: demosData }, { data: aiWindowsData }] = await Promise.all([
    supabase.from('demos').select('id, status, approval_status'),
    supabase.from('ai_usage_windows').select('percentage_consumed'),
  ]);

  const demos = demosData || [];
  const aiWindows = aiWindowsData || [];

  const inPrep = demos.filter(d => d.approval_status === 'Borrador' || d.status === 'En preparación').length;
  const pendingApproval = demos.filter(d => d.approval_status === 'Solicitud enviada' || d.approval_status === 'Reenviada para revisión').length;
  const approved = demos.filter(d => d.approval_status === 'Aprobada internamente').length;
  const presented = demos.filter(d => d.approval_status === 'Presentada al cliente' || d.status === 'Presentada').length;
  const accepted = demos.filter(d => d.approval_status === 'Aceptada por el cliente').length;

  const aiWindowsCount = aiWindows.length;
  const aiAvgPercentage = aiWindowsCount > 0
    ? Math.round(aiWindows.reduce((acc, w) => acc + (w.percentage_consumed || 0), 0) / aiWindowsCount)
    : 0;

  // 4. Propuestas Comerciales
  const { data: proposalsData } = await supabase
    .from('proposals')
    .select('id, total, robinson_approval_status');

  const proposals = proposalsData || [];
  const propPending = proposals.filter(p => p.robinson_approval_status === 'Pendiente aprobación').length;
  const propApproved = proposals.filter(p => p.robinson_approval_status === 'Aprobada por Robinson').length;
  const propTotalAmount = proposals.reduce((acc, p) => acc + (p.total || 0), 0);

  // 5. Proyectos
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, status, has_blocker');

  const projects = projectsData || [];
  const projActive = projects.filter(p => p.status !== 'Completado' && p.status !== 'Cancelado').length;
  const projCompleted = projects.filter(p => p.status === 'Completado').length;
  const projBlocked = projects.filter(p => p.has_blocker || p.status === 'Bloqueado').length;

  // 6. Tareas
  const { data: tasksData } = await supabase
    .from('tasks')
    .select('id, status, due_date');

  const tasks = tasksData || [];
  const pendingTasks = tasks.filter(t => t.status !== 'Completada' && t.status !== 'Cancelada');
  const overdueTasks = pendingTasks.filter(t => t.due_date && new Date(t.due_date) < now).length;

  // 7. Clientes y Mantenimiento
  const [{ count: clientsCount }, { data: maintenanceData }] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'Activo'),
    supabase.from('maintenance_contracts').select('id, status, end_date'),
  ]);

  const contracts = maintenanceData || [];
  const maintActive = contracts.filter(c => c.status === 'Activo').length;
  const maintExpiring = contracts.filter(c => c.status === 'Activo' && c.end_date && c.end_date <= next30DaysIso && c.end_date >= todayIso).length;

  // 8. Soporte e Incidencias
  const { data: ticketsData } = await supabase
    .from('support_tickets')
    .select('id, status, priority');

  const tickets = ticketsData || [];
  const openTickets = tickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Resuelto');
  const criticalTickets = openTickets.filter(t => t.priority === 'Crítica').length;

  // 9. Retención y Referidos
  const [{ count: lostCount }, { count: refCount }] = await Promise.all([
    supabase.from('lost_opportunities').select('*', { count: 'exact', head: true }),
    supabase.from('referrals').select('*', { count: 'exact', head: true }),
  ]);

  // 10. Bitácora de Auditoría Reciente
  const { data: auditData } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    leads: {
      total: leads.length,
      newCount,
      unattendedCount,
      byStage: leadsByStage,
    },
    diagnostics: {
      scheduledCount: diagScheduled,
      completedCount: diagCompleted,
    },
    demos: {
      total: demos.length,
      inPreparationCount: inPrep,
      pendingApprovalCount: pendingApproval,
      approvedCount: approved,
      presentedCount: presented,
      acceptedCount: accepted,
      aiWindowsCount,
      aiAvgPercentage,
    },
    proposals: {
      total: proposals.length,
      pendingApprovalCount: propPending,
      approvedCount: propApproved,
      totalAmount: propTotalAmount,
    },
    projects: {
      activeCount: projActive,
      completedCount: projCompleted,
      blockedCount: projBlocked,
    },
    tasks: {
      pendingCount: pendingTasks.length,
      overdueCount: overdueTasks,
    },
    clients: {
      activeCount: clientsCount || 0,
      maintenanceActiveCount: maintActive,
      expiringSoonCount: maintExpiring,
    },
    support: {
      openTicketsCount: openTickets.length,
      criticalTicketsCount: criticalTickets,
    },
    retention: {
      lostOpportunitiesCount: lostCount || 0,
      referralsCount: refCount || 0,
    },
    recentAudits: (auditData || []) as AuditLog[],
  };
}
