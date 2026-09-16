import {
  SystemRole,
  CustomRole,
  UserProfile,
  ChurchConfig,
  DEFAULT_MINISTRIES,
  DEFAULT_CUSTOM_SECTIONS,
  Member,
  CustomSectionItem,
} from '../types';

export const ALL_SYSTEM_TABS = [
  'dashboard',
  'directory',
  'events',
  'finances',
  'coop',
  'ministries',
  'worship',
  'dance',
  'women',
  'ushers',
  'theater',
  'chat',
  'settings',
  'developer',
] as const;

export type SystemTabId = typeof ALL_SYSTEM_TABS[number];

export interface SystemModuleInfo {
  id: string;
  label: string;
  shortLabel?: string;
  category: 'General' | 'Administración' | 'Ministerios' | 'Secciones Personalizadas' | 'Comunidad' | 'Técnico';
  iconName: string;
  color?: string;
  description?: string;
  isCustomSection?: boolean;
  isMinistry?: boolean;
}

/**
 * Retorna todos los módulos y páginas existentes en el sistema en tiempo real,
 * integrando las pestañas base, todos los ministerios activos (estándar y nuevos)
 * y todas las secciones personalizadas creadas dinámicamente por el usuario.
 */
export function getAllAvailableSystemModules(config?: ChurchConfig): SystemModuleInfo[] {
  // 1. Módulos Principales del Sistema
  const coreModules: SystemModuleInfo[] = [
    {
      id: 'dashboard',
      label: 'Inicio / Dashboard',
      shortLabel: 'Inicio',
      category: 'General',
      iconName: 'LayoutDashboard',
      color: '#4f46e5',
      description: 'Vista principal, métricas y resumen de actividades',
    },
    {
      id: 'directory',
      label: 'Directorio de Miembros',
      shortLabel: 'Directorio',
      category: 'General',
      iconName: 'Users',
      color: '#6366f1',
      description: 'Fichas pastorales, familias, células y bautismos',
    },
    {
      id: 'events',
      label: 'Agendas y Eventos',
      shortLabel: 'Agendas',
      category: 'General',
      iconName: 'Calendar',
      color: '#d97706',
      description: 'Calendario eclesial, cultos dominicales y programas',
    },
    {
      id: 'finances',
      label: 'Finanzas & Diezmos',
      shortLabel: 'Finanzas',
      category: 'Administración',
      iconName: 'DollarSign',
      color: '#059669',
      description: 'Control de ingresos, diezmos, ofrendas y egresos',
    },
    {
      id: 'coop',
      label: 'Minicooperativa & Campamentos',
      shortLabel: 'Minicooperativa',
      category: 'Administración',
      iconName: 'PiggyBank',
      color: '#ea580c',
      description: 'Cuentas de ahorro, préstamos y recaudación',
    },
    {
      id: 'ministries',
      label: 'Centro de Ministerios (Hub)',
      shortLabel: 'Ministerios',
      category: 'Ministerios',
      iconName: 'Sparkles',
      color: '#7c3aed',
      description: 'Acceso general al centro de ministerios eclesiales',
    },
    {
      id: 'chat',
      label: 'Grupos & Chat Eclesial',
      shortLabel: 'Chat',
      category: 'Comunidad',
      iconName: 'MessageSquare',
      color: '#2563eb',
      description: 'Canales de comunicación, oración y células',
    },
    {
      id: 'settings',
      label: 'Configuración & Temas',
      shortLabel: 'Configuración',
      category: 'Administración',
      iconName: 'Settings',
      color: '#4338ca',
      description: 'Ajustes visuales, identidad eclesiástica y gestión de roles',
    },
    {
      id: 'developer',
      label: 'Panel de Desarrollador',
      shortLabel: 'Desarrollador',
      category: 'Técnico',
      iconName: 'Terminal',
      color: '#6b21a8',
      description: 'Consola técnica, creador de secciones y papelera',
    },
  ];

  // 2. Ministerios dinámicos (estándar + personalizados creados por el usuario)
  const ministryList = Array.isArray(config?.ministries) && config.ministries.length > 0
    ? config.ministries
    : DEFAULT_MINISTRIES;

  const dynamicMinistries: SystemModuleInfo[] = ministryList
    .filter((m) => m.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((m) => ({
      id: m.id,
      label: `Ministerio: ${m.name}`,
      shortLabel: m.shortName || m.name,
      category: 'Ministerios',
      iconName: m.iconName || 'Sparkles',
      color: m.color || '#7c3aed',
      description: m.description || `Módulo del ministerio ${m.name}`,
      isMinistry: true,
    }));

  // 3. Secciones Personalizadas dinámicas (todas las creadas en el Creador de Secciones)
  const customSecList = Array.isArray(config?.customSections) && config.customSections.length > 0
    ? config.customSections
    : DEFAULT_CUSTOM_SECTIONS;

  const dynamicCustomSections: SystemModuleInfo[] = customSecList
    .filter((s) => s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((s) => ({
      id: s.slug || s.id,
      label: `Sección: ${s.name}`,
      shortLabel: s.shortName || s.name,
      category: 'Secciones Personalizadas',
      iconName: s.iconName || 'Database',
      color: s.color || '#0284c7',
      description: s.description || `Sección personalizada ${s.name}`,
      isCustomSection: true,
    }));

  // Retornamos todos los módulos consolidados
  return [...coreModules, ...dynamicMinistries, ...dynamicCustomSections];
}

/**
 * Retorna las pestañas por defecto para cada rol del sistema según la regla de negocio:
 * - Desarrollador: Acceso total
 * - Administrador: Acceso administrativo, ministerios y chat
 * - Contador: Inicio, Directorio, Finanzas, Minicooperativa y Chat
 * - Líder de Jóvenes: Inicio, Directorio, Agendas, Ministerios y Chat
 * - Líder: Directorio, Agendas y Chat (sin Inicio ni ministerios)
 * - Miembro: Inicio, Agendas/Eventos y Chat
 * - Alabanza: Alabanza, Centro de Ministerios y Chat
 * - Danza: Danza, Centro de Ministerios y Chat
 * - Damas: Damas, Centro de Ministerios y Chat
 * - Servidores: Servidores / Protocolo, Centro de Ministerios y Chat
 * - Teatro: Teatro / Drama, Centro de Ministerios y Chat
 */
export function getDefaultAllowedTabsForRole(role: string, customRoles?: CustomRole[]): string[] {
  // 1. Revisar si coincide con un rol personalizado creado por el Desarrollador
  if (customRoles && Array.isArray(customRoles)) {
    const customMatch = customRoles.find(
      (r) => r.name.toLowerCase().trim() === (role || '').toLowerCase().trim()
    );
    if (customMatch && Array.isArray(customMatch.allowedTabs) && customMatch.allowedTabs.length > 0) {
      return customMatch.allowedTabs;
    }
  }

  // 2. Roles nativos del sistema
  switch (role) {
    case 'Desarrollador':
      return [
        'dashboard',
        'directory',
        'events',
        'finances',
        'coop',
        'ministries',
        'worship',
        'dance',
        'women',
        'ushers',
        'theater',
        'chat',
        'settings',
        'developer',
      ];
    case 'Administrador':
      return [
        'dashboard',
        'directory',
        'events',
        'finances',
        'coop',
        'ministries',
        'worship',
        'dance',
        'women',
        'ushers',
        'theater',
        'chat',
        'settings',
      ];
    case 'Contador':
      return ['dashboard', 'directory', 'finances', 'coop', 'chat'];
    case 'Líder de Jóvenes':
      return [
        'dashboard',
        'directory',
        'events',
        'ministries',
        'worship',
        'dance',
        'women',
        'ushers',
        'theater',
        'chat',
      ];
    case 'Líder':
      return [
        'directory',
        'events',
        'chat',
      ];
    case 'Miembro':
      return ['dashboard', 'events', 'chat'];
    case 'Alabanza':
      return ['ministries', 'worship', 'chat'];
    case 'Danza':
      return ['ministries', 'dance', 'chat'];
    case 'Damas':
      return ['ministries', 'women', 'chat'];
    case 'Servidores':
      return ['ministries', 'ushers', 'chat'];
    case 'Teatro':
      return ['ministries', 'theater', 'chat'];
    default:
      return ['dashboard', 'chat'];
  }
}

/**
 * Obtiene la lista final y segura de pestañas autorizadas para el usuario actual.
 */
export function getEffectiveAllowedTabs(
  user: UserProfile | null | undefined,
  customRoles?: CustomRole[]
): string[] {
  if (!user) return ['dashboard'];
  if (user.role === 'Desarrollador') {
    return [
      'dashboard',
      'directory',
      'events',
      'finances',
      'coop',
      'ministries',
      'worship',
      'dance',
      'women',
      'ushers',
      'theater',
      'chat',
      'settings',
      'developer',
      ...(user.allowedTabs || []),
    ];
  }

  // Si tiene pestañas configuradas explícitamente y no están vacías, usamos esas
  if (user.allowedTabs && user.allowedTabs.length > 0) {
    const defaultTabs = getDefaultAllowedTabsForRole(user.role, customRoles);
    if (defaultTabs.includes('chat') && !user.allowedTabs.includes('chat')) {
      return [...user.allowedTabs, 'chat'];
    }
    return user.allowedTabs;
  }

  // De lo contrario, usamos los permisos estrictos de su rol
  return getDefaultAllowedTabsForRole(user.role, customRoles);
}

/**
 * Comprueba si el usuario tiene permiso para acceder a una pestaña específica
 */
export function isTabAllowedForUser(tabId: string, user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'Desarrollador') return true;
  const allowed = getEffectiveAllowedTabs(user);
  if (allowed.includes(tabId)) return true;
  if (tabId === 'ministries') {
    // Si el usuario tiene acceso a cualquier ministerio o 'ministries'
    const ministryKeywords = ['worship', 'dance', 'women', 'ushers', 'theater', 'ministries'];
    return (
      allowed.includes('ministries') ||
      allowed.some((tab) => ministryKeywords.includes(tab) || tab.startsWith('min_') || tab.startsWith('sec_'))
    );
  }
  return false;
}

/**
 * Comprueba si un usuario tiene acceso específico a un ministerio individual.
 * Permite a los usuarios ingresar a la sección de ministerios, pero bloquea
 * aquellos ministerios a los que no pertenecen.
 */
export function isMinistryAccessibleForUser(
  ministryId: string,
  user: UserProfile | null | undefined,
  members?: Member[]
): boolean {
  if (!user) return false;
  // Desarrollador, Administrador tienen acceso total a todos los ministerios
  if (user.role === 'Desarrollador' || user.role === 'Administrador') {
    return true;
  }

  // Roles directos de ministerio
  if (user.role === 'Alabanza' && ministryId === 'worship') return true;
  if (user.role === 'Danza' && ministryId === 'dance') return true;
  if (user.role === 'Damas' && ministryId === 'women') return true;
  if (user.role === 'Servidores' && ministryId === 'ushers') return true;
  if (user.role === 'Teatro' && ministryId === 'theater') return true;

  // Comprobar pestañas explícitas autorizadas para el usuario
  const effective = getEffectiveAllowedTabs(user);
  if (effective.includes(ministryId)) return true;

  // Comprobar si el usuario está vinculado a un miembro de la congregación que pertenece a ese ministerio
  if (members && members.length > 0) {
    const userEmail = (user.email || '').trim().toLowerCase();
    const userName = (user.name || '').trim().toLowerCase();
    const linkedMember = members.find(
      (m) =>
        (m.email && m.email.trim().toLowerCase() === userEmail) ||
        (m.fullName && m.fullName.trim().toLowerCase() === userName)
    );
    if (linkedMember && Array.isArray(linkedMember.ministries)) {
      if (linkedMember.ministries.includes(ministryId)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Comprueba si el usuario tiene permiso para acceder a una sección personalizada según los roles configurados.
 */
export function isCustomSectionAccessibleForUser(
  section: CustomSectionItem,
  user: UserProfile | null | undefined
): boolean {
  if (!user) return section.isPublic ?? true;
  // Desarrollador y Administrador tienen acceso total para supervisar y editar
  if (user.role === 'Desarrollador' || user.role === 'Administrador') {
    return true;
  }
  // Si la sección no está habilitada
  if (section.enabled === false) {
    return false;
  }
  // Si no se especificaron roles permitidos o incluye 'Todos', está disponible para toda la congregación
  const allowed = section.allowedRoles;
  if (!allowed || allowed.length === 0 || (allowed as string[]).includes('Todos')) {
    return true;
  }
  // Verificar si el rol del usuario actual está en la lista de roles autorizados
  return (allowed as string[]).includes(user.role);
}

