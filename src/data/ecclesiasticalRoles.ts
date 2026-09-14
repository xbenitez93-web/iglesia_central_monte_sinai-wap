import { ChurchConfig, EcclesiasticalRole, EcclesiasticalRoleCategory } from '../types';

export const ECCLESIASTICAL_ROLE_CATEGORIES: {
  id: EcclesiasticalRoleCategory;
  label: string;
  badgeBg: string;
  badgeText: string;
  defaultColor: string;
}[] = [
  {
    id: 'Pastoral',
    label: 'Pastoral & Gobierno',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/70',
    badgeText: 'text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    defaultColor: '#4f46e5',
  },
  {
    id: 'Liderazgo',
    label: 'Liderazgo & Coordinación',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    defaultColor: '#8b5cf6',
  },
  {
    id: 'Liturgia & Alabanza',
    label: 'Liturgia, Alabanza & Música',
    badgeBg: 'bg-pink-100 dark:bg-pink-950/70',
    badgeText: 'text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    defaultColor: '#ec4899',
  },
  {
    id: 'Educación & Niños',
    label: 'Educación & Escuela Bíblica',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
    badgeText: 'text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    defaultColor: '#f59e0b',
  },
  {
    id: 'Servicio & Diaconado',
    label: 'Servicio, Diaconado & Ujieres',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    defaultColor: '#10b981',
  },
  {
    id: 'Medios & Tecnología',
    label: 'Medios, Sonido & Transmisión',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-950/70',
    badgeText: 'text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
    defaultColor: '#06b6d4',
  },
  {
    id: 'Misiones & Evangelismo',
    label: 'Misiones & Evangelismo',
    badgeBg: 'bg-rose-100 dark:bg-rose-950/70',
    badgeText: 'text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    defaultColor: '#f43f5e',
  },
  {
    id: 'General',
    label: 'General & Colaborador',
    badgeBg: 'bg-slate-100 dark:bg-slate-800',
    badgeText: 'text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    defaultColor: '#64748b',
  },
];

export const DEFAULT_ECCLESIASTICAL_ROLES: EcclesiasticalRole[] = [
  {
    id: 'role_pastor_principal',
    name: 'Pastor Principal',
    description: 'Dirección pastoral suprema, predicación dominical expositiva de la Palabra, unción pastoral y visión espiritual de la congregación.',
    category: 'Pastoral',
    color: '#4f46e5',
    isSystem: true,
  },
  {
    id: 'role_pastor_auxiliar',
    name: 'Pastor Auxiliar',
    description: 'Apoyo pastoral en consejería prematrimonial y familiar, visitación a congregantes, discipulado y sustitución en el púlpito.',
    category: 'Pastoral',
    color: '#6366f1',
    isSystem: true,
  },
  {
    id: 'role_diacono',
    name: 'Diácono',
    description: 'Atención a necesidades físicas y asistenciales de la membresía, logística del templo, servicio del pan y vino en la Santa Cena.',
    category: 'Servicio & Diaconado',
    color: '#0d9488',
    isSystem: true,
  },
  {
    id: 'role_lider_jovenes',
    name: 'Líder de Jóvenes',
    description: 'Discipulado generacional, coordinación de cultos y células juveniles, campamentos, dinámicas de liderazgo y misiones de jóvenes.',
    category: 'Liderazgo',
    color: '#8b5cf6',
    isSystem: true,
  },
  {
    id: 'role_director_alabanza',
    name: 'Director de Alabanza',
    description: 'Coordinación litúrgica, selección del repertorio de adoración e himnodia, dirección de ensayos vocales y armonización instrumental.',
    category: 'Liturgia & Alabanza',
    color: '#ec4899',
    isSystem: true,
  },
  {
    id: 'role_musico',
    name: 'Músico',
    description: 'Ejecución reverente de instrumentos (teclado, piano, guitarras, bajo eléctrico, percusión) durante los servicios de adoración y vigilias.',
    category: 'Liturgia & Alabanza',
    color: '#d946ef',
    isSystem: true,
  },
  {
    id: 'role_maestro_escuela_dominical',
    name: 'Maestro Escuela Dominical',
    description: 'Enseñanza bíblica pedagógica por edades para niños y adolescentes, preparación de lecciones, memorización de versículos y manualidades.',
    category: 'Educación & Niños',
    color: '#f59e0b',
    isSystem: true,
  },
  {
    id: 'role_equipo_sonido_media',
    name: 'Equipo de Sonido / Media',
    description: 'Operación de consola de mezcla de audio, ecualización, transmisión en vivo (streaming), proyección de letras bíblicas y diseño gráfico.',
    category: 'Medios & Tecnología',
    color: '#0284c7',
    isSystem: true,
  },
  {
    id: 'role_ujier_recepcion',
    name: 'Ujier / Recepción',
    description: 'Recepción y bienvenida calurosa a las familias y visitas, ubicación de asientos, recolección digna de ofrendas y orden en el santuario.',
    category: 'Servicio & Diaconado',
    color: '#10b981',
    isSystem: true,
  },
  {
    id: 'role_intercesion_oracion',
    name: 'Intercesión / Oración',
    description: 'Cobertura en oración antes y durante los cultos, vigilias, cadenas de intercesión por enfermos y seguimiento a peticiones de oración.',
    category: 'Pastoral',
    color: '#06b6d4',
    isSystem: true,
  },
  {
    id: 'role_ministerio_damas',
    name: 'Ministerio de Damas',
    description: 'Organización de reuniones de edificación femenina, estudios bíblicos para mujeres, apoyo a viudas, ancianas y proyectos de misericordia.',
    category: 'Liderazgo',
    color: '#f43f5e',
    isSystem: true,
  },
  {
    id: 'role_voluntario_general',
    name: 'Voluntario General',
    description: 'Apoyo multifuncional en eventos especiales, transportación, aseo del santuario, comedores y logística comunitaria.',
    category: 'General',
    color: '#64748b',
    isSystem: true,
  },
];

/**
 * Obtiene la lista efectiva de cargos eclesiásticos.
 * Si la configuración tiene cargos definidos y válidos, se usan; si no, retorna la lista predeterminada.
 */
export function getEffectiveEcclesiasticalRoles(config?: ChurchConfig): EcclesiasticalRole[] {
  if (config?.ecclesiasticalRoles && Array.isArray(config.ecclesiasticalRoles) && config.ecclesiasticalRoles.length > 0) {
    return config.ecclesiasticalRoles;
  }
  return DEFAULT_ECCLESIASTICAL_ROLES;
}
