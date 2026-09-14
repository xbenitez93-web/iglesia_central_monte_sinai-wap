import React from 'react';
import { LockScreenConfig, LockScreenTheme } from '../types';

export interface SpiritualVideoPreset {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  tags: string[];
}

export const SPIRITUAL_VIDEO_PRESETS: SpiritualVideoPreset[] = [
  {
    id: 'clouds_celestial',
    name: '☁️ Rayos de Gloria & Nubes Celestiales',
    description: 'Movimiento majestuoso de nubes con rayos de sol atravesando el cielo.',
    // High-quality reliable atmospheric loop (Wikimedia / reliable web video stream)
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=600&auto=format&fit=crop&q=80',
    tags: ['Celestial', 'Cielo', 'Luz'],
  },
  {
    id: 'worship_candle',
    name: '🕯️ Fuego Santo & Altar de Oración',
    description: 'Vela sagrada encendida en penumbra con cálido resplandor de adoración.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=600&auto=format&fit=crop&q=80',
    tags: ['Altar', 'Oración', 'Fuego'],
  },
  {
    id: 'starry_sinai',
    name: '🌌 Monte Sinaí bajo las Estrellas',
    description: 'El firmamento estrellado en timelapse sobre montañas en reverencia a Dios.',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80',
    tags: ['Noche', 'Monte', 'Estrellas'],
  },
];

export interface SpiritualImagePreset {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tags: string[];
}

export const SPIRITUAL_IMAGE_PRESETS: SpiritualImagePreset[] = [
  {
    id: 'cielo_glorioso',
    name: '☁️ Rayos de Gloria Celestial',
    description: 'Sol y nubes majestuosas transmitiendo paz divina.',
    imageUrl: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1600&auto=format&fit=crop&q=80',
    tags: ['Celestial', 'Luz', 'Paz'],
  },
  {
    id: 'altar_oracion',
    name: '🕯️ Altar de Fuego & Oración',
    description: 'Cálido resplandor de santidad y comunión.',
    imageUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1600&auto=format&fit=crop&q=80',
    tags: ['Oración', 'Altar', 'Intimidad'],
  },
  {
    id: 'sinai_estrellado',
    name: '🌌 Firmamento del Monte Sinaí',
    description: 'Noche estrellada y contemplación ante el Creador.',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&auto=format&fit=crop&q=80',
    tags: ['Noche', 'Monte', 'Estrellas'],
  },
  {
    id: 'templo_fe',
    name: '⛪ Santuario & Cruz de Gracia',
    description: 'Luz entrando por el templo eclesial en adoración.',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-16a7353f86fb?w=1600&auto=format&fit=crop&q=80',
    tags: ['Templo', 'Cruz', 'Santuario'],
  },
];

export const THEME_COLOR_PRESETS: Record<
  LockScreenTheme,
  {
    name: string;
    description: string;
    gradientClass: string;
    bgStyle?: React.CSSProperties;
    accentClass: string;
    glowColor: string;
    borderClass: string;
    tagBg: string;
  }
> = {
  monte_sinai: {
    name: '🏔️ Monte Sinaí Celestial',
    description: 'Azul ultramarino, violeta real y oro celestial.',
    gradientClass: 'from-indigo-950 via-slate-900 to-purple-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(79, 70, 229, 0.45) 0%, rgba(30, 27, 75, 0.95) 55%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-amber-400',
    glowColor: 'rgba(99, 102, 241, 0.55)',
    borderClass: 'border-indigo-500/40',
    tagBg: 'bg-indigo-500/20 text-indigo-200',
  },
  aurora: {
    name: '🌌 Aurora de Avivamiento',
    description: 'Cyan neón, esmeralda y azul profundo.',
    gradientClass: 'from-teal-950 via-slate-900 to-indigo-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(13, 148, 136, 0.45) 0%, rgba(15, 23, 42, 0.95) 55%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-teal-300',
    glowColor: 'rgba(20, 184, 166, 0.55)',
    borderClass: 'border-teal-500/40',
    tagBg: 'bg-teal-500/20 text-teal-200',
  },
  sunset: {
    name: '🌅 Atardecer de Gracia',
    description: 'Ámbar dorado, coral y púrpura crepúsculo.',
    gradientClass: 'from-amber-950 via-slate-900 to-rose-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(217, 119, 6, 0.45) 0%, rgba(88, 28, 135, 0.9) 60%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-amber-300',
    glowColor: 'rgba(245, 158, 11, 0.55)',
    borderClass: 'border-amber-500/40',
    tagBg: 'bg-amber-500/20 text-amber-200',
  },
  worship_night: {
    name: '✨ Noche de Adoración',
    description: 'Negro obsidiana con azul eléctrico y resplandor sagrado.',
    gradientClass: 'from-blue-950 via-slate-900 to-indigo-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(37, 99, 235, 0.45) 0%, rgba(15, 23, 42, 0.95) 55%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-blue-300',
    glowColor: 'rgba(59, 130, 246, 0.55)',
    borderClass: 'border-blue-500/40',
    tagBg: 'bg-blue-500/20 text-blue-200',
  },
  eternal_peace: {
    name: '🕊️ Paz Eterna',
    description: 'Lavanda suave, blanco perla y azul zafiro.',
    gradientClass: 'from-purple-950 via-slate-900 to-slate-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(147, 51, 234, 0.4) 0%, rgba(30, 27, 75, 0.95) 55%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-purple-300',
    glowColor: 'rgba(168, 85, 247, 0.55)',
    borderClass: 'border-purple-500/40',
    tagBg: 'bg-purple-500/20 text-purple-200',
  },
  emerald_glory: {
    name: '💎 Esmeralda Viva',
    description: 'Verde esmeralda profundo, menta y bronce.',
    gradientClass: 'from-emerald-950 via-slate-900 to-teal-950',
    bgStyle: {
      background: 'radial-gradient(ellipse at 50% 35%, rgba(5, 150, 105, 0.45) 0%, rgba(6, 78, 59, 0.9) 55%, rgba(2, 6, 23, 1) 100%)',
    },
    accentClass: 'text-emerald-300',
    glowColor: 'rgba(16, 185, 129, 0.55)',
    borderClass: 'border-emerald-500/40',
    tagBg: 'bg-emerald-500/20 text-emerald-200',
  },
  custom_color: {
    name: '🎨 Color Personalizado',
    description: 'Gradiente con colores definidos manualmente.',
    gradientClass: 'from-slate-900 via-indigo-950 to-black',
    accentClass: 'text-indigo-400',
    glowColor: 'rgba(99, 102, 241, 0.55)',
    borderClass: 'border-indigo-500/40',
    tagBg: 'bg-indigo-500/20 text-indigo-200',
  },
};

export const defaultLockScreenConfig: LockScreenConfig = {
  enabled: true,
  timeoutMinutes: 5,
  theme: 'monte_sinai',
  primaryColor: '#4f46e5',
  secondaryColor: '#7c3aed',
  animationType: 'particles',
  backgroundType: 'gradient',
  videoMuted: true,
  videoOpacity: 0.3,
  blurAmount: 0,
  showClock: true,
  showDate: true,
  showVerse: true,
  showChurchLogo: true,
  showSystemStatus: true,
  customHeading: 'Iglesia Central Monte Sinaí',
  customSubheading: 'Sistema Central de Gestión & Cobertura Eclesial',
  requirePasswordToUnlock: false,
  unlockPin: '3755',
  updatedAt: Date.now(),
  updatedBy: 'Desarrollador',
};

/**
 * Sanitiza y valida estrictamente un objeto LockScreenConfig, garantizando que solo
 * contenga propiedades primitivas serializables en JSON (sin referencias circulares,
 * sin elementos DOM ni SyntheticEvents).
 */
export function sanitizeLockScreenConfig(raw: any): LockScreenConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultLockScreenConfig };
  }

  // Safe string extractor
  const safeStr = (v: any, fallback?: string): string | undefined => {
    return typeof v === 'string' ? v : fallback;
  };

  const safeNum = (v: any, fallback: number, min?: number, max?: number): number => {
    const parsed = typeof v === 'number' ? v : Number(v);
    if (isNaN(parsed)) return fallback;
    if (min !== undefined && parsed < min) return min;
    if (max !== undefined && parsed > max) return max;
    return parsed;
  };

  const safeBool = (v: any, fallback: boolean): boolean => {
    return typeof v === 'boolean' ? v : fallback;
  };

  return {
    enabled: safeBool(raw.enabled, true),
    timeoutMinutes: safeNum(raw.timeoutMinutes, 5, 0.16, 120),
    theme: safeStr(raw.theme, 'monte_sinai') as any,
    primaryColor: safeStr(raw.primaryColor, '#4f46e5'),
    secondaryColor: safeStr(raw.secondaryColor, '#7c3aed'),
    animationType: safeStr(raw.animationType, 'particles') as any,
    backgroundType: (['gradient', 'video', 'image'].includes(raw.backgroundType)
      ? raw.backgroundType
      : 'gradient') as any,
    mediaUrl: typeof raw.mediaUrl === 'string' ? raw.mediaUrl : undefined,
    mediaType: raw.mediaType === 'image' || raw.mediaType === 'video' ? raw.mediaType : undefined,
    mediaName: safeStr(raw.mediaName),
    presetVideoId: safeStr(raw.presetVideoId),
    customVideoPresetId: safeStr(raw.customVideoPresetId),
    videoMuted: safeBool(raw.videoMuted, true),
    videoOpacity: safeNum(raw.videoOpacity, 0.3, 0, 1),
    blurAmount: safeNum(raw.blurAmount, 0, 0, 20),
    showClock: safeBool(raw.showClock, true),
    showDate: safeBool(raw.showDate, true),
    showVerse: safeBool(raw.showVerse, true),
    showChurchLogo: safeBool(raw.showChurchLogo, true),
    logoUrl: typeof raw.logoUrl === 'string' ? raw.logoUrl : undefined,
    showSystemStatus: safeBool(raw.showSystemStatus, true),
    customHeading: safeStr(raw.customHeading, 'Iglesia Central Monte Sinaí'),
    customSubheading: safeStr(raw.customSubheading, 'Sistema Central de Gestión & Cobertura Eclesial'),
    requirePasswordToUnlock: safeBool(raw.requirePasswordToUnlock, false),
    unlockPin: safeStr(raw.unlockPin, '3755'),
    updatedAt: safeNum(raw.updatedAt, Date.now()),
    updatedBy: safeStr(raw.updatedBy, 'Desarrollador'),
  };
}

/**
 * Serializa de manera 100% segura la configuración del bloqueo a JSON sin riesgo de
 * excepciones por estructuras circulares.
 */
export function safeStringifyLockScreenConfig(config: any): string {
  try {
    const clean = sanitizeLockScreenConfig(config);
    return JSON.stringify(clean);
  } catch (err) {
    console.warn('safeStringifyLockScreenConfig fallback used:', err);
    return JSON.stringify(defaultLockScreenConfig);
  }
}

