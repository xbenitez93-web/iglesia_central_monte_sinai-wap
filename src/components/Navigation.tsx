import React from 'react';
import {
  Users,
  Calendar,
  DollarSign,
  PiggyBank,
  Settings,
  LayoutDashboard,
  Lock,
  Terminal,
  Music,
  Sparkles,
  Heart,
  UserCheck,
  Drama,
  MessageSquare,
  Layers,
} from 'lucide-react';
import { TabColorConfig, ChurchConfig, MinistryItem, DEFAULT_MINISTRIES, CustomSectionItem, DEFAULT_CUSTOM_SECTIONS } from '../types';
import { getEffectiveAllowedTabs } from '../lib/rbac';
import { getMinistryIconComponent } from '../utils/ministryIcons';

export type TabType =
  | 'dashboard'
  | 'directory'
  | 'events'
  | 'finances'
  | 'coop'
  | 'ministries'
  | 'worship'
  | 'dance'
  | 'women'
  | 'ushers'
  | 'theater'
  | 'chat'
  | 'settings'
  | 'developer'
  | (string & {});

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  enableCoopModule: boolean;
  allowedTabs?: string[];
  userRoleName?: string;
  customTabColors?: TabColorConfig;
  tabBadges?: Record<string, number>;
  config?: ChurchConfig;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: any;
  isDevBadge?: boolean;
  color?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  enableCoopModule,
  allowedTabs,
  userRoleName = 'Usuario',
  customTabColors,
  tabBadges = {},
  config,
}) => {
  const isDev = userRoleName === 'Desarrollador';
  const effectiveAllowed =
    allowedTabs && allowedTabs.length > 0
      ? allowedTabs
      : getEffectiveAllowedTabs({ role: userRoleName as any, allowedTabs: [] } as any);

  const ministriesList: MinistryItem[] =
    Array.isArray(config?.ministries)
      ? [...config.ministries].sort((a, b) => (a.order || 0) - (b.order || 0))
      : DEFAULT_MINISTRIES;

  const activeMinistries = ministriesList.filter((m) => m.enabled);
  const displayMode = config?.ministryNavDisplayMode || 'tabs';

  // Base tabs before ministries
  const coreTabs: NavItem[] = [
    { id: 'dashboard' as TabType, label: 'Inicio', icon: LayoutDashboard },
    { id: 'directory' as TabType, label: 'Directorio', icon: Users },
    { id: 'events' as TabType, label: 'Agendas y Eventos', icon: Calendar },
    { id: 'finances' as TabType, label: 'Finanzas', icon: DollarSign },
    ...(enableCoopModule
      ? [{ id: 'coop' as TabType, label: 'Minicooperativa', icon: PiggyBank }]
      : []),
  ];

  // Ministry tabs: either grouped or individual
  let ministryNavItems: NavItem[] = [];

  if (displayMode === 'grouped') {
    ministryNavItems = [
      {
        id: 'ministries' as TabType,
        label: 'Ministerios',
        icon: Sparkles,
        color: customTabColors?.ministries || '#7c3aed',
      },
    ];
  } else {
    // Individual tabs for each enabled ministry
    ministryNavItems = activeMinistries.map((min) => ({
      id: min.id as TabType,
      label: min.shortName || min.name,
      icon: getMinistryIconComponent(min.iconName),
      color: min.color || customTabColors?.[min.id],
    }));
  }

  // Custom Sections created in Developer View (e.g. Donaciones, Transmisiones, etc.)
  const customSectionsList: CustomSectionItem[] =
    Array.isArray(config?.customSections)
      ? config.customSections
      : DEFAULT_CUSTOM_SECTIONS;

  const activeCustomSections = customSectionsList
    .filter((sec) => sec.enabled && sec.showInTopNav !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const customSectionNavItems: NavItem[] = activeCustomSections.map((sec) => ({
    id: (sec.slug || sec.id) as TabType,
    label: sec.shortName || sec.name,
    icon: getMinistryIconComponent(sec.iconName),
    color: sec.color || customTabColors?.[sec.id as keyof TabColorConfig],
  }));

  // Trailing tabs after ministries and custom sections
  const trailingTabs: NavItem[] = [
    { id: 'chat' as TabType, label: 'Grupos & Chat', icon: MessageSquare },
    { id: 'settings' as TabType, label: 'Configuración', icon: Settings },
    { id: 'developer' as TabType, label: 'Desarrollador', icon: Terminal, isDevBadge: true },
  ];

  const rawCandidateTabs = [...coreTabs, ...ministryNavItems, ...customSectionNavItems, ...trailingTabs];

  // Apply custom module overrides (label, icon, color, visibility) from config.modulesConfig
  const allCandidateTabs: NavItem[] = rawCandidateTabs
    .filter((tab) => {
      const modConf = config?.modulesConfig?.[tab.id];
      if (modConf) {
        if (modConf.enabled === false) return false;
        if (modConf.showInTopNav === false) return false;
      }
      return true;
    })
    .map((tab) => {
      const modConf = config?.modulesConfig?.[tab.id];
      return {
        ...tab,
        label: modConf?.label || tab.label,
        icon: modConf?.iconName ? getMinistryIconComponent(modConf.iconName) : tab.icon,
        color: modConf?.color || tab.color,
      };
    });

  // Sort candidate tabs by custom order (config.moduleNavOrder or config.modulesConfig[id].order)
  const orderedCandidateTabs = [...allCandidateTabs].sort((a, b) => {
    if (Array.isArray(config?.moduleNavOrder) && config.moduleNavOrder.length > 0) {
      const idxA = config.moduleNavOrder.indexOf(a.id);
      const idxB = config.moduleNavOrder.indexOf(b.id);
      const posA = idxA !== -1 ? idxA : 1000;
      const posB = idxB !== -1 ? idxB : 1000;
      if (posA !== posB) return posA - posB;
    }
    const ordA = config?.modulesConfig?.[a.id]?.order;
    const ordB = config?.modulesConfig?.[b.id]?.order;
    if (typeof ordA === 'number' && typeof ordB === 'number') {
      return ordA - ordB;
    }
    return 0;
  });

  // Filter tabs according to RBAC
  const visibleTabs = orderedCandidateTabs.filter((tab) => {
    if (isDev) return true;
    if (tab.id === 'ministries') {
      // In grouped mode, allow if user has access to ANY ministry or 'ministries'
      return (
        effectiveAllowed.includes('ministries') ||
        activeMinistries.some((m) => effectiveAllowed.includes(m.id))
      );
    }

    // Check if this tab corresponds to a custom section
    const matchedCustomSec = customSectionsList.find(
      (sec) => sec.id === tab.id || sec.slug === tab.id
    );

    if (matchedCustomSec) {
      // If user is Admin or Developer, they have full preview access
      if (userRoleName === 'Administrador' || userRoleName === 'Desarrollador') return true;

      // Comprobar vigencia temporal / tiempo de vencimiento
      if (matchedCustomSec.expiration?.enabled) {
        const nowMs = Date.now();
        // Si está programada en el futuro, no mostrar aún a miembros regulares
        if (matchedCustomSec.expiration.startsAt && new Date(matchedCustomSec.expiration.startsAt).getTime() > nowMs) {
          return false;
        }
        // Si ya expiró y la acción configurada es ocultar
        if (
          matchedCustomSec.expiration.expiresAt &&
          new Date(matchedCustomSec.expiration.expiresAt).getTime() <= nowMs &&
          (matchedCustomSec.expiration.expirationAction || 'banner') === 'hide'
        ) {
          return false;
        }
      }

      // If allowedRoles is defined and has items
      if (matchedCustomSec.allowedRoles && matchedCustomSec.allowedRoles.length > 0) {
        if (matchedCustomSec.allowedRoles.includes('Todos' as any)) return true;
        return matchedCustomSec.allowedRoles.includes(userRoleName as any);
      }

      // If isPublic is false, only authorized users or users with tab in allowedTabs
      if (matchedCustomSec.isPublic === false) {
        return effectiveAllowed.includes(tab.id);
      }

      // If public to all congregation by default
      return true;
    }

    return effectiveAllowed.includes(tab.id);
  });

  return (
    <nav className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/60 sticky top-[73px] sm:top-[69px] z-20 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none items-center">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isMinistryActiveInGrouped =
              displayMode === 'grouped' &&
              tab.id === 'ministries' &&
              (activeTab === 'ministries' || activeMinistries.some((m) => m.id === activeTab));
            
            const isActive = activeTab === tab.id || isMinistryActiveInGrouped;
            const customColor = tab.color || customTabColors?.[tab.id as keyof TabColorConfig];

            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                style={
                  isActive && customColor
                    ? {
                        backgroundColor: customColor,
                        boxShadow: `0 4px 16px ${customColor}4d`,
                      }
                    : undefined
                }
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? customColor
                      ? 'text-white border border-white/30 transform scale-[1.02]'
                      : 'bg-indigo-600/90 text-white shadow-sm shadow-indigo-500/20 backdrop-blur-md border border-white/30'
                    : tab.isDevBadge
                    ? 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-950/40'
                    : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? 'text-white'
                      : tab.isDevBadge
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                  style={!isActive && customColor ? { color: customColor } : undefined}
                />
                <span>{tab.label}</span>
                {tabBadges[tab.id] && tabBadges[tab.id] > 0 ? (
                  <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                    {tabBadges[tab.id]}
                  </span>
                ) : config?.modulesConfig?.[tab.id]?.badge ? (
                  <span className="text-[10px] bg-white/20 dark:bg-white/20 text-inherit font-extrabold px-1.5 py-0.2 rounded-md uppercase tracking-wide">
                    {config.modulesConfig[tab.id].badge}
                  </span>
                ) : tab.id === 'ministries' && displayMode === 'grouped' ? (
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded-md">
                    {activeMinistries.length}
                  </span>
                ) : tab.isDevBadge && !isActive ? (
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold px-1.5 py-0.2 rounded-md">
                    DEV
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
