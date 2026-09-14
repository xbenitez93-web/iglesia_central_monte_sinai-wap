import { ChurchConfig, AppCustomModuleConfig, ModuleActionButton, DEFAULT_MINISTRIES, DEFAULT_CUSTOM_SECTIONS } from '../types';

export interface SystemModuleDefinition {
  id: string;
  defaultLabel: string;
  category: 'core' | 'ministry' | 'custom' | 'system';
  categoryLabel: string;
  defaultIcon: string;
  defaultColor: string;
  subtitle: string;
  canDisable?: boolean;
}

export const BASE_SYSTEM_MODULES: SystemModuleDefinition[] = [
  {
    id: 'dashboard',
    defaultLabel: 'Inicio',
    category: 'core',
    categoryLabel: 'Módulo Principal',
    defaultIcon: 'LayoutDashboard',
    defaultColor: '#4f46e5',
    subtitle: 'Muro pastoral, devocional, versículo bíblico y resumen eclesial.',
    canDisable: false,
  },
  {
    id: 'directory',
    defaultLabel: 'Directorio',
    category: 'core',
    categoryLabel: 'Módulo Principal',
    defaultIcon: 'Users',
    defaultColor: '#2563eb',
    subtitle: 'Directorio de miembros, familias, fichas y control pastoral.',
    canDisable: true,
  },
  {
    id: 'events',
    defaultLabel: 'Agendas y Eventos',
    category: 'core',
    categoryLabel: 'Módulo Principal',
    defaultIcon: 'Calendar',
    defaultColor: '#059669',
    subtitle: 'Cultos generales, actividades especiales y calendario litúrgico.',
    canDisable: true,
  },
  {
    id: 'finances',
    defaultLabel: 'Finanzas',
    category: 'core',
    categoryLabel: 'Módulo Principal',
    defaultIcon: 'DollarSign',
    defaultColor: '#16a34a',
    subtitle: 'Tesorería eclesial, entradas, salidas, ofrendas y presupuestos.',
    canDisable: true,
  },
  {
    id: 'coop',
    defaultLabel: 'Minicooperativa',
    category: 'core',
    categoryLabel: 'Módulo Principal',
    defaultIcon: 'PiggyBank',
    defaultColor: '#d97706',
    subtitle: 'Fondo cooperativo de ahorro, préstamos fraternos y aportes.',
    canDisable: true,
  },
  {
    id: 'ministries',
    defaultLabel: 'Ministerios',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'Sparkles',
    defaultColor: '#7c3aed',
    subtitle: 'Hub general de departamentos y ministerios eclesiales.',
    canDisable: true,
  },
  {
    id: 'worship',
    defaultLabel: 'Alabanza',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'Music',
    defaultColor: '#7c3aed',
    subtitle: 'Repertorio musical, músicos, ensayos y programas de alabanza.',
    canDisable: true,
  },
  {
    id: 'dance',
    defaultLabel: 'Danza',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'Sparkles',
    defaultColor: '#db2777',
    subtitle: 'Coreografías, vestuarios, grupos y presentaciones litúrgicas.',
    canDisable: true,
  },
  {
    id: 'women',
    defaultLabel: 'Damas',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'Heart',
    defaultColor: '#e11d48',
    subtitle: 'Ministerio de mujeres, consejería, reuniones y congresos femeniles.',
    canDisable: true,
  },
  {
    id: 'ushers',
    defaultLabel: 'Servidores & Ujieres',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'UserCheck',
    defaultColor: '#d97706',
    subtitle: 'Protocolo en santuario, orden en cultos y bienvenida fraternal.',
    canDisable: true,
  },
  {
    id: 'theater',
    defaultLabel: 'Teatro',
    category: 'ministry',
    categoryLabel: 'Ministerios',
    defaultIcon: 'Drama',
    defaultColor: '#4f46e5',
    subtitle: 'Dramas, guiones, elencos de obras y ensayos dramáticos.',
    canDisable: true,
  },
  {
    id: 'chat',
    defaultLabel: 'Grupos & Chat',
    category: 'core',
    categoryLabel: 'Comunicaciones',
    defaultIcon: 'MessageSquare',
    defaultColor: '#0891b2',
    subtitle: 'Salas de chat eclesial, grupos de trabajo y anuncios oficiales.',
    canDisable: true,
  },
  {
    id: 'settings',
    defaultLabel: 'Configuración',
    category: 'system',
    categoryLabel: 'Sistema',
    defaultIcon: 'Settings',
    defaultColor: '#475569',
    subtitle: 'Datos de la congregación, preferencias visuales y sistema.',
    canDisable: false,
  },
  {
    id: 'developer',
    defaultLabel: 'Desarrollador',
    category: 'system',
    categoryLabel: 'Sistema',
    defaultIcon: 'Terminal',
    defaultColor: '#9333ea',
    subtitle: 'Consola de control técnico, roles, base de datos y auditoría.',
    canDisable: false,
  },
];

export interface UnifiedModuleItem {
  id: string;
  label: string;
  defaultLabel: string;
  subtitle: string;
  category: 'core' | 'ministry' | 'custom' | 'system';
  categoryLabel: string;
  iconName: string;
  color: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple' | 'blue';
  enabled: boolean;
  order: number;
  showInTopNav: boolean;
  allowedRoles?: string[];
  actionButtons: ModuleActionButton[];
  customNotice?: {
    text: string;
    type?: 'info' | 'announcement' | 'warning' | 'success';
  };
  canDisable: boolean;
  isCustomSection?: boolean;
  isMinistry?: boolean;
}

/**
 * Returns all modules unified, with config overrides and sorted by order
 */
export function getUnifiedModulesList(config?: ChurchConfig): UnifiedModuleItem[] {
  const modulesConfig: Record<string, Partial<AppCustomModuleConfig>> = config?.modulesConfig || {};
  const customSections = Array.isArray(config?.customSections)
    ? config.customSections
    : DEFAULT_CUSTOM_SECTIONS;
  const ministries = Array.isArray(config?.ministries)
    ? config.ministries
    : DEFAULT_MINISTRIES;
  const isMinistryGrouped = config?.ministryNavDisplayMode === 'grouped';

  // Build list of all modules
  const allModules: UnifiedModuleItem[] = [];

  // 1. Core & System modules
  BASE_SYSTEM_MODULES.forEach((base, index) => {
    // If grouped mode, hide individual ministries unless specifically configured
    if (isMinistryGrouped && ['worship', 'dance', 'women', 'ushers', 'theater'].includes(base.id)) {
      return;
    }
    // If tabs mode, hide the general 'ministries' hub tab
    if (!isMinistryGrouped && base.id === 'ministries') {
      return;
    }

    const override = modulesConfig[base.id] || {};
    allModules.push({
      id: base.id,
      label: override.label || base.defaultLabel,
      defaultLabel: base.defaultLabel,
      subtitle: override.subtitle || base.subtitle,
      category: base.category,
      categoryLabel: base.categoryLabel,
      iconName: override.iconName || base.defaultIcon,
      color: override.color || base.defaultColor,
      badge: override.badge,
      badgeColor: override.badgeColor || 'indigo',
      enabled: override.enabled !== undefined ? override.enabled : true,
      order: override.order !== undefined ? override.order : index * 10,
      showInTopNav: override.showInTopNav !== undefined ? override.showInTopNav : true,
      allowedRoles: override.allowedRoles,
      actionButtons: override.actionButtons || [],
      customNotice: override.customNotice,
      canDisable: base.canDisable ?? true,
      isMinistry: base.category === 'ministry',
    });
  });

  // 2. Custom Ministries (dynamic ministries created in ministries manager)
  ministries.forEach((m, idx) => {
    // If not already in base (e.g. dynamic ministry)
    if (!allModules.some((mod) => mod.id === m.id)) {
      if (!isMinistryGrouped) {
        const override = modulesConfig[m.id] || {};
        allModules.push({
          id: m.id,
          label: override.label || m.name,
          defaultLabel: m.name,
          subtitle: override.subtitle || m.description || 'Ministerio de servicio eclesial.',
          category: 'ministry',
          categoryLabel: 'Ministerios',
          iconName: override.iconName || m.iconName || 'Sparkles',
          color: override.color || m.color || '#7c3aed',
          badge: override.badge,
          badgeColor: override.badgeColor || 'purple',
          enabled: override.enabled !== undefined ? override.enabled : m.enabled,
          order: override.order !== undefined ? override.order : 50 + idx * 5,
          showInTopNav: override.showInTopNav !== undefined ? override.showInTopNav : true,
          allowedRoles: override.allowedRoles,
          actionButtons: override.actionButtons || [],
          customNotice: override.customNotice,
          canDisable: true,
          isMinistry: true,
        });
      }
    }
  });

  // 3. Custom Sections (e.g. Donaciones, Transmisiones, etc.)
  customSections.forEach((sec, idx) => {
    const secId = sec.slug || sec.id;
    if (!allModules.some((mod) => mod.id === secId)) {
      const override = modulesConfig[secId] || {};
      allModules.push({
        id: secId,
        label: override.label || sec.name,
        defaultLabel: sec.name,
        subtitle: override.subtitle || sec.description || 'Sección personalizada de la iglesia.',
        category: 'custom',
        categoryLabel: 'Sección Personalizada',
        iconName: override.iconName || sec.iconName || 'HeartHandshake',
        color: override.color || sec.color || '#059669',
        badge: override.badge || sec.badge,
        badgeColor: override.badgeColor || 'emerald',
        enabled: override.enabled !== undefined ? override.enabled : sec.enabled,
        order: override.order !== undefined ? override.order : 70 + idx * 5,
        showInTopNav: override.showInTopNav !== undefined ? override.showInTopNav : (sec.showInTopNav !== false),
        allowedRoles: override.allowedRoles || sec.allowedRoles,
        actionButtons: override.actionButtons || [],
        customNotice: override.customNotice,
        canDisable: true,
        isCustomSection: true,
      });
    }
  });

  // Sort according to moduleNavOrder if present, or by order property
  if (Array.isArray(config?.moduleNavOrder) && config.moduleNavOrder.length > 0) {
    const orderMap = new Map<string, number>();
    config.moduleNavOrder.forEach((id, idx) => orderMap.set(id, idx));

    allModules.sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 1000 + a.order;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 1000 + b.order;
      return idxA - idxB;
    });
  } else {
    allModules.sort((a, b) => a.order - b.order);
  }

  // Normalize order numbers sequentially (1, 2, 3...)
  return allModules.map((mod, index) => ({
    ...mod,
    order: index + 1,
  }));
}

/**
 * Moves a module up or down in the nav order
 */
export function reorderModulesList(
  modules: UnifiedModuleItem[],
  moduleId: string,
  direction: 'up' | 'down' | 'top' | 'bottom'
): string[] {
  const currentIds = modules.map((m) => m.id);
  const currentIndex = currentIds.indexOf(moduleId);
  if (currentIndex === -1) return currentIds;

  const newIds = [...currentIds];

  if (direction === 'up' && currentIndex > 0) {
    const temp = newIds[currentIndex];
    newIds[currentIndex] = newIds[currentIndex - 1];
    newIds[currentIndex - 1] = temp;
  } else if (direction === 'down' && currentIndex < newIds.length - 1) {
    const temp = newIds[currentIndex];
    newIds[currentIndex] = newIds[currentIndex + 1];
    newIds[currentIndex + 1] = temp;
  } else if (direction === 'top' && currentIndex > 0) {
    const [item] = newIds.splice(currentIndex, 1);
    newIds.unshift(item);
  } else if (direction === 'bottom' && currentIndex < newIds.length - 1) {
    const [item] = newIds.splice(currentIndex, 1);
    newIds.push(item);
  }

  return newIds;
}

/**
 * Builds updated ChurchConfig with reordered modules
 */
export function applyNewModuleOrder(
  config: ChurchConfig,
  orderedModuleIds: string[]
): ChurchConfig {
  const currentModulesConfig = { ...(config.modulesConfig || {}) };

  orderedModuleIds.forEach((id, idx) => {
    currentModulesConfig[id] = {
      ...(currentModulesConfig[id] || { id }),
      order: idx + 1,
    };
  });

  return {
    ...config,
    moduleNavOrder: orderedModuleIds,
    modulesConfig: currentModulesConfig,
  };
}
