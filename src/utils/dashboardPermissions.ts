import { ChurchConfig, DashboardRolePermissions, DashboardSectionId, SystemRole } from '../types';

export interface DashboardSectionMeta {
  id: DashboardSectionId;
  title: string;
  shortLabel: string;
  category: 'Encabezado y Acciones' | 'Métricas y KPIs' | 'Tableros y Contenido';
  description: string;
  isFinancial: boolean;
  isAdministrative: boolean;
  defaultRecommendation: string;
}

export const ALL_DASHBOARD_SECTIONS: DashboardSectionMeta[] = [
  {
    id: 'heroBanner',
    title: 'Banner de Bienvenida y Título Eclesial',
    shortLabel: 'Banner Superior',
    category: 'Encabezado y Acciones',
    description: 'Muestra el encabezado superior con el nombre de la iglesia, lema, rol del usuario e insignia de seguridad.',
    isFinancial: false,
    isAdministrative: false,
    defaultRecommendation: 'Visible para todos los roles.',
  },
  {
    id: 'quickShortcuts',
    title: 'Accesos Rápidos en Banner (Diezmo / Asistente IA)',
    shortLabel: 'Botones de Banner',
    category: 'Encabezado y Acciones',
    description: 'Botones rápidos en la esquina del banner para abrir el Asistente Pastoral IA y registrar diezmos/entradas.',
    isFinancial: true,
    isAdministrative: false,
    defaultRecommendation: 'Visible para Administrador, Pastor y Contador.',
  },
  {
    id: 'pendingApprovals',
    title: 'Avisos de Solicitudes de Nuevos Usuarios',
    shortLabel: 'Avisos de Registro',
    category: 'Encabezado y Acciones',
    description: 'Alerta ámbar en la parte superior cuando hay usuarios pendientes de aprobación de cuenta.',
    isFinancial: false,
    isAdministrative: true,
    defaultRecommendation: 'Solo Desarrollador y Administrador.',
  },
  {
    id: 'kpiMembers',
    title: 'Métrica: Congregantes & Miembros Activos',
    shortLabel: 'KPI Miembros',
    category: 'Métricas y KPIs',
    description: 'Tarjeta con el total de miembros registrados en el directorio y conteo de miembros en estado Activo.',
    isFinancial: false,
    isAdministrative: false,
    defaultRecommendation: 'Visible para líderes y miembros.',
  },
  {
    id: 'kpiEvents',
    title: 'Métrica: Agenda de Cultos & Próximos Eventos',
    shortLabel: 'KPI Agenda',
    category: 'Métricas y KPIs',
    description: 'Tarjeta con la cantidad de cultos, vigilias y reuniones próximas con el título del próximo evento.',
    isFinancial: false,
    isAdministrative: false,
    defaultRecommendation: 'Visible para todos los congregantes.',
  },
  {
    id: 'kpiFinances',
    title: 'Métrica Financiera: Ingresos y Egresos del Mes',
    shortLabel: 'KPI Finanzas (Privado)',
    category: 'Métricas y KPIs',
    description: 'Muestra las cifras exactas de diezmos, ofrendas y gastos ejecutados en el mes en curso.',
    isFinancial: true,
    isAdministrative: true,
    defaultRecommendation: 'Ocultar a miembros normales. Activar a Contadores y Pastores.',
  },
  {
    id: 'kpiCoop',
    title: 'Métrica Minicooperativa: Fondo de Ahorro y Créditos',
    shortLabel: 'KPI Minicooperativa (Privado)',
    category: 'Métricas y KPIs',
    description: 'Muestra el saldo acumulado en la caja de ahorro y préstamos solicitados.',
    isFinancial: true,
    isAdministrative: true,
    defaultRecommendation: 'Ocultar a miembros sin rol administrativo o tesorería.',
  },
  {
    id: 'nextService',
    title: 'Próximo Culto & Servidores Asignados',
    shortLabel: 'Próximo Culto & Roster',
    category: 'Tableros y Contenido',
    description: 'Ficha grande con hora, ubicación, predicador, pasaje bíblico y lista de ujieres/músicos de turno.',
    isFinancial: false,
    isAdministrative: false,
    defaultRecommendation: 'Recomendado para toda la congregación.',
  },
  {
    id: 'quickActions',
    title: 'Panel de Acciones Rápidas Eclesiales',
    shortLabel: 'Acciones Rápidas',
    category: 'Tableros y Contenido',
    description: 'Tarjetas interactivas para "+ Nuevo Miembro", "+ Agendar Culto" y "+ Registrar Diezmo".',
    isFinancial: true,
    isAdministrative: true,
    defaultRecommendation: 'Activar para Administradores, Pastores y Líderes.',
  },
  {
    id: 'recentFinances',
    title: 'Historial de Movimientos Financieros Recientes',
    shortLabel: 'Movimientos Recientes (Privado)',
    category: 'Tableros y Contenido',
    description: 'Lista de las últimas transacciones con montos, método de pago y nombres de donantes.',
    isFinancial: true,
    isAdministrative: true,
    defaultRecommendation: 'Datos sensibles. Solo Desarrollador, Administrador y Contador.',
  },
  {
    id: 'ministriesSummary',
    title: 'Resumen de Ministerios en Servicio',
    shortLabel: 'Resumen Ministerios',
    category: 'Tableros y Contenido',
    description: 'Distribución de servidores y colaboradores en Alabanza, Escuela Dominical, Ujieres, Medios, etc.',
    isFinancial: false,
    isAdministrative: false,
    defaultRecommendation: 'Visible para líderes y miembros.',
  },
];

export const ALL_ROLES_LIST: SystemRole[] = [
  'Desarrollador',
  'Administrador',
  'Contador',
  'Líder de Jóvenes',
  'Líder',
  'Miembro',
  'Alabanza',
  'Danza',
  'Damas',
  'Servidores',
  'Teatro',
];

/**
 * Default Recommended Permissions for each Role
 */
export const DEFAULT_ROLE_DASHBOARD_PERMISSIONS: Record<SystemRole, DashboardRolePermissions> = {
  Desarrollador: {
    heroBanner: true,
    quickShortcuts: true,
    pendingApprovals: true,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: true,
    kpiCoop: true,
    nextService: true,
    quickActions: true,
    recentFinances: true,
    ministriesSummary: true,
  },
  Administrador: {
    heroBanner: true,
    quickShortcuts: true,
    pendingApprovals: true,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: true,
    kpiCoop: true,
    nextService: true,
    quickActions: true,
    recentFinances: true,
    ministriesSummary: true,
  },
  Contador: {
    heroBanner: true,
    quickShortcuts: true,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: true,
    kpiCoop: true,
    nextService: true,
    quickActions: true,
    recentFinances: true,
    ministriesSummary: false,
  },
  'Líder de Jóvenes': {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: true,
    recentFinances: false,
    ministriesSummary: true,
  },
  Líder: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: true,
    recentFinances: false,
    ministriesSummary: true,
  },
  Miembro: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
  Alabanza: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
  Danza: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
  Damas: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
  Servidores: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
  Teatro: {
    heroBanner: true,
    quickShortcuts: false,
    pendingApprovals: false,
    kpiMembers: true,
    kpiEvents: true,
    kpiFinances: false,
    kpiCoop: false,
    nextService: true,
    quickActions: false,
    recentFinances: false,
    ministriesSummary: true,
  },
};

/**
 * Resolves current permissions for a given role from ChurchConfig or falls back to standard defaults
 */
export function getDashboardPermissionsForRole(
  config?: ChurchConfig,
  role: string = 'Miembro'
): DashboardRolePermissions {
  const defaultForRole =
    DEFAULT_ROLE_DASHBOARD_PERMISSIONS[role as SystemRole] ||
    DEFAULT_ROLE_DASHBOARD_PERMISSIONS['Miembro'];

  const customForRole = config?.dashboardRolePermissions?.[role];

  if (!customForRole) {
    return defaultForRole;
  }

  return {
    ...defaultForRole,
    ...customForRole,
  };
}
