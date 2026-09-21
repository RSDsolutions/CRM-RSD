'use server';

import { createClient } from '@/utils/supabase/server';

export interface DashboardMetrics {
  projects: {
    activeCount: number;
    completedCount: number;
    deliveriesPendingReview: number;
  };
  finances: {
    pendingPaymentsCount: number;
    pendingPaymentsTotal: number;
    confirmedPaymentsTotal: number;
  };
  maintenance: {
    activeCount: number;
    expiringSoonCount: number;
  };
  renewals: {
    pendingCount: number;
  };
}

export async function getDashboardMetricsAction(): Promise<DashboardMetrics> {
  const supabase = createClient();
  
  // 1. Proyectos
  const { count: activeProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .not('status', 'in', '("Completado", "Cancelado")');
    
  const { count: completedProjectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Completado');

  const { count: deliveriesPendingCount } = await supabase
    .from('project_deliveries')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Pendiente revisión', 'En revisión']);

  // 2. Finanzas
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, status')
    .in('status', ['Registrado', 'Confirmado']);

  let pendingCount = 0;
  let pendingTotal = 0;
  let confirmedTotal = 0;
  
  if (payments) {
    payments.forEach(p => {
      if (p.status === 'Registrado') {
        pendingCount++;
        pendingTotal += p.amount;
      } else if (p.status === 'Confirmado') {
        confirmedTotal += p.amount;
      }
    });
  }

  // 3. Mantenimiento
  // Para expirar pronto (ej. menos de 15 días), hacemos cálculo en JS simplificado,
  // pero idealmente se hace por query filtrando dates.
  const today = new Date();
  const next15Days = new Date(today);
  next15Days.setDate(today.getDate() + 15);

  const { count: activeMaintenanceCount } = await supabase
    .from('maintenance_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Activo');

  const { count: expiringMaintenanceCount } = await supabase
    .from('maintenance_contracts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Activo')
    .lte('end_date', next15Days.toISOString())
    .gte('end_date', today.toISOString());

  // 4. Renovaciones
  const { count: pendingRenewalsCount } = await supabase
    .from('renewals')
    .select('*', { count: 'exact', head: true })
    .in('status', ['Contactar', 'Propuesta enviada', 'En negociación']);

  return {
    projects: {
      activeCount: activeProjectsCount || 0,
      completedCount: completedProjectsCount || 0,
      deliveriesPendingReview: deliveriesPendingCount || 0,
    },
    finances: {
      pendingPaymentsCount: pendingCount,
      pendingPaymentsTotal: pendingTotal,
      confirmedPaymentsTotal: confirmedTotal,
    },
    maintenance: {
      activeCount: activeMaintenanceCount || 0,
      expiringSoonCount: expiringMaintenanceCount || 0,
    },
    renewals: {
      pendingCount: pendingRenewalsCount || 0,
    }
  };
}
