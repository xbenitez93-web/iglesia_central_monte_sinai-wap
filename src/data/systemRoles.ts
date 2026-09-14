import { CustomRole } from '../types';

export const SYSTEM_ROLE_CATEGORIES = [
  { id: 'Pastoral', label: 'Pastoral & Gobierno', color: '#4f46e5' },
  { id: 'Administración', label: 'Administración & Tesorería', color: '#059669' },
  { id: 'Liderazgo', label: 'Liderazgo & Coordinación', color: '#8b5cf6' },
  { id: 'Ministerios', label: 'Ministerios Eclesiales', color: '#ec4899' },
  { id: 'Servicio', label: 'Servicio & Protocolo', color: '#0d9488' },
  { id: 'Educación', label: 'Educación & Niños', color: '#f59e0b' },
  { id: 'Medios & Tecnología', label: 'Medios & Tecnología', color: '#0284c7' },
  { id: 'General', label: 'General & Miembros', color: '#64748b' },
] as const;

export const ROLE_COLOR_PRESETS = [
  { label: 'Índigo Real', hex: '#4f46e5', bg: 'bg-indigo-600', lightBg: 'bg-indigo-50 dark:bg-indigo-950/60', text: 'text-indigo-600 dark:text-indigo-400' },
  { label: 'Púrpura Imperial', hex: '#7c3aed', bg: 'bg-purple-600', lightBg: 'bg-purple-50 dark:bg-purple-950/60', text: 'text-purple-600 dark:text-purple-400' },
  { label: 'Esmeralda / Finanzas', hex: '#059669', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50 dark:bg-emerald-950/60', text: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Cian / Medios', hex: '#0284c7', bg: 'bg-cyan-600', lightBg: 'bg-cyan-50 dark:bg-cyan-950/60', text: 'text-cyan-600 dark:text-cyan-400' },
  { label: 'Ámbar / Juventud', hex: '#d97706', bg: 'bg-amber-600', lightBg: 'bg-amber-50 dark:bg-amber-950/60', text: 'text-amber-600 dark:text-amber-400' },
  { label: 'Rosa / Damas', hex: '#e11d48', bg: 'bg-rose-600', lightBg: 'bg-rose-50 dark:bg-rose-950/60', text: 'text-rose-600 dark:text-rose-400' },
  { label: 'Teal / Servidores', hex: '#0d9488', bg: 'bg-teal-600', lightBg: 'bg-teal-50 dark:bg-teal-950/60', text: 'text-teal-600 dark:text-teal-400' },
  { label: 'Violeta / Alabanza', hex: '#9333ea', bg: 'bg-violet-600', lightBg: 'bg-violet-50 dark:bg-violet-950/60', text: 'text-violet-600 dark:text-violet-400' },
  { label: 'Fucsia / Danza', hex: '#c026d3', bg: 'bg-fuchsia-600', lightBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/60', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { label: 'Pizarra / Miembro', hex: '#475569', bg: 'bg-slate-600', lightBg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
];

export const ROLE_ICON_OPTIONS = [
  { id: 'Shield', label: 'Escudo / Protección' },
  { id: 'KeyRound', label: 'Llave / Acceso' },
  { id: 'Users', label: 'Usuarios / Comunidad' },
  { id: 'Star', label: 'Estrella / Honor' },
  { id: 'Sparkles', label: 'Destello / Gracia' },
  { id: 'UserCheck', label: 'Usuario Aprobado' },
  { id: 'BookOpen', label: 'Biblia / Enseñanza' },
  { id: 'Heart', label: 'Corazón / Pastoral' },
  { id: 'DollarSign', label: 'Tesorería / Finanzas' },
  { id: 'Compass', label: 'Brújula / Dirección' },
  { id: 'Music', label: 'Música / Alabanza' },
  { id: 'Award', label: 'Medalla / Liderazgo' },
  { id: 'Lock', label: 'Candado / Seguridad' },
  { id: 'Layers', label: 'Capas / Modular' },
];

export const DEFAULT_SYSTEM_ROLES: CustomRole[] = [
  {
    id: 'sys_role_desarrollador',
    name: 'Desarrollador',
    description: 'Acceso total y absoluto al sistema, consola de desarrollador, papelera profunda, creador de módulos y base de datos.',
    category: 'General',
    color: '#6b21a8',
    iconName: 'KeyRound',
    allowedTabs: [
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
    ],
    isSystem: true,
    hierarchyLevel: 1,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_administrador',
    name: 'Administrador',
    description: 'Gestión pastoral y administrativa completa de la congregación, configuración institucional, miembros y finanzas.',
    category: 'Administración',
    color: '#4f46e5',
    iconName: 'Shield',
    allowedTabs: [
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
    ],
    isSystem: true,
    hierarchyLevel: 2,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_contador',
    name: 'Contador',
    description: 'Administración de finanzas eclesiales, diezmos, ofrendas, egresos con recibos y control de la minicooperativa.',
    category: 'Administración',
    color: '#059669',
    iconName: 'DollarSign',
    allowedTabs: ['dashboard', 'directory', 'finances', 'coop', 'chat'],
    isSystem: true,
    hierarchyLevel: 3,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_lider_jovenes',
    name: 'Líder de Jóvenes',
    description: 'Coordinación y discipulado juvenil, eventos y cultos generacionales, agendas y centros de ministerios.',
    category: 'Liderazgo',
    color: '#d97706',
    iconName: 'Sparkles',
    allowedTabs: [
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
    ],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_lider',
    name: 'Líder',
    description: 'Líder de célula o ministerio con acceso al directorio de congregantes, eventos de agenda y canales de comunicación.',
    category: 'Liderazgo',
    color: '#8b5cf6',
    iconName: 'Users',
    allowedTabs: ['directory', 'events', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_miembro',
    name: 'Miembro',
    description: 'Miembro congregante con acceso al resumen eclesial, calendario de eventos, cultos y chat comunitario.',
    category: 'General',
    color: '#64748b',
    iconName: 'UserCheck',
    allowedTabs: ['dashboard', 'events', 'chat'],
    isSystem: true,
    hierarchyLevel: 5,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_alabanza',
    name: 'Alabanza',
    description: 'Integrantes del grupo de música y alabanza, cancionero bíblico, ensayos vocales y agenda litúrgica.',
    category: 'Ministerios',
    color: '#9333ea',
    iconName: 'Music',
    allowedTabs: ['ministries', 'worship', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_danza',
    name: 'Danza',
    description: 'Ministerio de danza y adoración corporal, coreografías, vestuarios y cronogramas de ensayos.',
    category: 'Ministerios',
    color: '#c026d3',
    iconName: 'Sparkles',
    allowedTabs: ['ministries', 'dance', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_damas',
    name: 'Damas',
    description: 'Ministerio femenil, reuniones de oración y edificación espiritual de mujeres, cadenas de intercesión.',
    category: 'Ministerios',
    color: '#e11d48',
    iconName: 'Heart',
    allowedTabs: ['ministries', 'women', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_servidores',
    name: 'Servidores',
    description: 'Servidores, ujieres y equipo de bienvenida, control de accesos, orden en el templo y comisiones de culto.',
    category: 'Servicio',
    color: '#0d9488',
    iconName: 'Shield',
    allowedTabs: ['ministries', 'ushers', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'sys_role_teatro',
    name: 'Teatro',
    description: 'Ministerio de artes escénicas y drama, obras teatrales, libretos evangelísticos y ensayos artísticos.',
    category: 'Ministerios',
    color: '#ea580c',
    iconName: 'Award',
    allowedTabs: ['ministries', 'theater', 'chat'],
    isSystem: true,
    hierarchyLevel: 4,
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

/**
 * Combina los roles nativos con los roles creados por el Desarrollador (guardados en Firebase).
 */
export function getAllEffectiveRoles(customRoles?: CustomRole[]): CustomRole[] {
  const customList = Array.isArray(customRoles) ? customRoles : [];
  // Retornamos los nativos seguidos por los personalizados (o sobreescrituras si tuvieran el mismo nombre)
  const customMap = new Map<string, CustomRole>();
  customList.forEach((r) => {
    if (r && r.name) {
      customMap.set(r.name.toLowerCase().trim(), r);
    }
  });

  const merged: CustomRole[] = [];
  DEFAULT_SYSTEM_ROLES.forEach((sysRole) => {
    const key = sysRole.name.toLowerCase().trim();
    if (customMap.has(key)) {
      merged.push({ ...sysRole, ...customMap.get(key)! });
      customMap.delete(key);
    } else {
      merged.push(sysRole);
    }
  });

  // Agregar los nuevos roles que no existían de forma nativa
  customMap.forEach((newRole) => {
    merged.push(newRole);
  });

  return merged;
}

/**
 * Obtiene la información visual y descripción de cualquier rol del sistema.
 */
export function getRoleMetadata(roleName: string, customRoles?: CustomRole[]) {
  const allRoles = getAllEffectiveRoles(customRoles);
  const found = allRoles.find(
    (r) => r.name.toLowerCase().trim() === (roleName || '').toLowerCase().trim()
  );

  if (found) {
    return {
      name: found.name,
      color: found.color || '#4f46e5',
      iconName: found.iconName || 'Shield',
      category: found.category || 'General',
      description: found.description || '',
      allowedTabs: found.allowedTabs || ['dashboard', 'chat'],
      isSystem: Boolean(found.isSystem),
      id: found.id,
    };
  }

  return {
    name: roleName || 'Miembro',
    color: '#64748b',
    iconName: 'UserCheck',
    category: 'General',
    description: 'Rol de usuario',
    allowedTabs: ['dashboard', 'chat'],
    isSystem: false,
    id: `role_${Date.now()}`,
  };
}
