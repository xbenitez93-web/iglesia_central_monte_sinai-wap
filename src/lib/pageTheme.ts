import { TabColorConfig, ChurchConfig } from '../types';
import { churchThemes } from '../data/themes';
import { TabType } from '../components/Navigation';

export interface PageMetadata {
  id: TabType;
  title: string;
  subtitle: string;
  category: string;
  defaultColor: string;
  badge?: string;
}

export interface CustomBannerConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  gradientStyle?: 'glow' | 'deep' | 'vibrant' | 'minimal';
}

export const PAGE_METADATA_MAP: Record<TabType, PageMetadata> = {
  dashboard: {
    id: 'dashboard',
    title: 'Inicio / Panel General',
    subtitle: 'Métricas pastorales, resumen congregacional y accesos prioritarios',
    category: 'Gestión Principal',
    defaultColor: '#4f46e5', // Indigo
    badge: 'Panel Pastoral Central',
  },
  directory: {
    id: 'directory',
    title: 'Directorio Pastoral & Familias',
    subtitle: 'Fichas pastorales, familias, membresía, células y bautismos',
    category: 'Membresía & Cuidado',
    defaultColor: '#0284c7', // Sky Blue
    badge: 'Cuidado Congregacional',
  },
  events: {
    id: 'events',
    title: 'Agendas & Cultos Eclesiásticos',
    subtitle: 'Calendario litúrgico, cultos dominicales, vigilias y actividades',
    category: 'Liturgia & Calendario',
    defaultColor: '#d97706', // Amber Gold
    badge: 'Calendario Litúrgico',
  },
  finances: {
    id: 'finances',
    title: 'Finanzas & Mayordomía Cristiana',
    subtitle: 'Control de diezmos, ofrendas, egresos e informes contables',
    category: 'Administración & Finanzas',
    defaultColor: '#059669', // Emerald
    badge: 'Mayordomía Fiel',
  },
  coop: {
    id: 'coop',
    title: 'Minicooperativa & Campamentos',
    subtitle: 'Cuentas de ahorro, préstamos fraternales e inscripciones a eventos',
    category: 'Comunión & Ahorro',
    defaultColor: '#ea580c', // Sunset Orange
    badge: 'Fondo Fraternal & Eventos',
  },
  worship: {
    id: 'worship',
    title: 'Ministerio de Alabanza & Adoración',
    subtitle: 'Cancionero bíblico, repertorio musical, músicos y cronogramas de ensayos',
    category: 'Ministerios Musicales',
    defaultColor: '#7c3aed', // Royal Violet
    badge: 'Salmistas & Músicos de Dios',
  },
  dance: {
    id: 'dance',
    title: 'Danza, Pandero, Mantos y Banderas',
    subtitle: 'Coreografías litúrgicas, vestuario, implementos e inventario de panderos',
    category: 'Artes & Expresión',
    defaultColor: '#db2777', // Magenta / Pink
    badge: 'Ministerio de Danza & Alabanza',
  },
  women: {
    id: 'women',
    title: 'Sociedad Femenil & Células de Hogar',
    subtitle: 'Reuniones de mujeres, células de damas, desayunos y peticiones de oración',
    category: 'Ministerio Femenino',
    defaultColor: '#e11d48', // Crimson / Rose
    badge: 'Ministerio de Damas & Mujeres de Fe',
  },
  ushers: {
    id: 'ushers',
    title: 'Servidores, Ujieres & Hospitalidad',
    subtitle: 'Roles de servicio dominical, recepción, puertas y logística de cultos',
    category: 'Servicio & Orden',
    defaultColor: '#0891b2', // Cyan / Ocean
    badge: 'Cuerpo de Ujieres & Hospitalidad',
  },
  theater: {
    id: 'theater',
    title: 'Obras Teatrales & Dramatizaciones',
    subtitle: 'Guiones bíblicos, monólogos, pantomimas, casting de actores y ensayos',
    category: 'Artes Escénicas',
    defaultColor: '#9333ea', // Purple Drama
    badge: 'Ministerio de Teatro, Drama & Pantomima',
  },
  ministries: {
    id: 'ministries',
    title: 'Centro de Ministerios & Grupos de Servicio',
    subtitle: 'Gestión, integrantes, planes de trabajo y liderazgo de los ministerios',
    category: 'Ministerios Congregacionales',
    defaultColor: '#7c3aed', // Royal Violet
    badge: 'Centro Ministerial',
  },
  chat: {
    id: 'chat',
    title: 'Grupos Pequeños & Chat Pastoral',
    subtitle: 'Canales de comunicación comunitaria, intercesión y células',
    category: 'Comunión & Grupos',
    defaultColor: '#2563eb', // Sapphire Blue
    badge: 'Comunión Fraternal',
  },
  settings: {
    id: 'settings',
    title: 'Configuración & Temas de la Iglesia',
    subtitle: 'Personalización visual, colores de páginas, identidad y alertas push',
    category: 'Sistema & Ajustes',
    defaultColor: '#4338ca', // Slate Indigo
    badge: 'Panel de Administración',
  },
  developer: {
    id: 'developer',
    title: 'Consola de Desarrollador & Papelera',
    subtitle: 'Auditoría de datos, papelera de reciclaje y diagnósticos avanzados',
    category: 'Mantenimiento & Técnico',
    defaultColor: '#6b21a8', // Deep Violet
    badge: 'Herramientas de Sistema',
  },
};

export const QUICK_PAGE_COLOR_PRESETS = [
  { name: 'Índigo Real', hex: '#4f46e5' },
  { name: 'Esmeralda Celestial', hex: '#059669' },
  { name: 'Ámbar / Ocaso Dorado', hex: '#d97706' },
  { name: 'Rubí / Rosa Pastoral', hex: '#e11d48' },
  { name: 'Zafiro / Océano', hex: '#0284c7' },
  { name: 'Violeta Majestuosa', hex: '#7c3aed' },
  { name: 'Fucsia / Danza', hex: '#db2777' },
  { name: 'Naranja Cooperativa', hex: '#ea580c' },
  { name: 'Turquesa / Menta', hex: '#0d9488' },
  { name: 'Púrpura Dramático', hex: '#9333ea' },
  { name: 'Azul Cobalto', hex: '#2563eb' },
  { name: 'Vino Tinto Solemne', hex: '#881337' },
];

/**
 * Convierte un color HEX a RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Genera un gradiente rico y oscuro para los hero banners basado en el color activo
 */
export function getHeroBannerGradient(hexColor: string, style: string = 'glow'): string {
  const { r, g, b } = hexToRgb(hexColor);
  switch (style) {
    case 'vibrant':
      return `linear-gradient(135deg, rgba(${Math.min(255, r + 20)}, ${Math.min(255, g + 20)}, ${Math.min(255, b + 20)}, 0.95) 0%, rgba(${r}, ${g}, ${b}, 0.85) 50%, rgba(15, 23, 42, 0.95) 100%)`;
    case 'minimal':
      return `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.2) 0%, rgba(${r}, ${g}, ${b}, 0.05) 50%, rgba(15, 23, 42, 0.9) 100%)`;
    case 'deep':
      return `linear-gradient(135deg, rgba(${Math.floor(r * 0.35)}, ${Math.floor(g * 0.35)}, ${Math.floor(b * 0.35)}, 0.98) 0%, rgba(${Math.floor(r * 0.2)}, ${Math.floor(g * 0.2)}, ${Math.floor(b * 0.2)}, 0.95) 50%, #090d16 100%)`;
    case 'glow':
    default:
      return `linear-gradient(135deg, rgba(${Math.floor(r * 0.45)}, ${Math.floor(g * 0.45)}, ${Math.floor(b * 0.45)}, 0.95) 0%, rgba(${Math.floor(r * 0.25)}, ${Math.floor(g * 0.25)}, ${Math.floor(b * 0.25)}, 0.95) 50%, #0b0f19 100%)`;
  }
}

/**
 * Obtiene el color de tema personalizado correspondiente a la pestaña activa.
 */
export function getActivePageThemeColor(activeTab: TabType, config: ChurchConfig): string {
  if (config.customTabColors && config.customTabColors[activeTab]) {
    return config.customTabColors[activeTab]!;
  }

  const activeTheme = churchThemes.find((t) => t.id === config.activeThemeId) || churchThemes[0];
  if (activeTheme.tabColors && activeTheme.tabColors[activeTab]) {
    return activeTheme.tabColors[activeTab]!;
  }

  return PAGE_METADATA_MAP[activeTab]?.defaultColor || activeTheme.primaryColor || '#4f46e5';
}
