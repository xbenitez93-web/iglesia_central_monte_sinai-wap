import { CustomSectionItem } from '../types';

export interface ExpirationCalculation {
  hasExpiration: boolean;
  isExpired: boolean;
  isScheduled: boolean;
  isActive: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedText: string;
  badgeLabel: string;
  badgeColorClass: string;
  action: 'hide' | 'lock' | 'banner';
  expiresAt?: string;
  startsAt?: string;
}

/**
 * Calcula el estado de vigencia y tiempo restante de una sección personalizada.
 */
export function getSectionExpirationInfo(
  section: CustomSectionItem,
  currentDate: Date = new Date()
): ExpirationCalculation {
  const config = section.expiration;

  if (!config || !config.enabled || !config.expiresAt) {
    return {
      hasExpiration: false,
      isExpired: false,
      isScheduled: false,
      isActive: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedText: 'Permanente (Sin Vencimiento)',
      badgeLabel: 'Permanente',
      badgeColorClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      action: 'banner',
      expiresAt: undefined,
      startsAt: undefined,
    };
  }

  const action = config.expirationAction || 'banner';
  const nowMs = currentDate.getTime();
  const expireDate = new Date(config.expiresAt);
  const expireMs = expireDate.getTime();

  // Comprobar inicio programado
  if (config.startsAt) {
    const startDate = new Date(config.startsAt);
    if (nowMs < startDate.getTime()) {
      const diffStart = startDate.getTime() - nowMs;
      const daysToStart = Math.floor(diffStart / (1000 * 60 * 60 * 24));
      const hoursToStart = Math.floor((diffStart / (1000 * 60 * 60)) % 24);

      return {
        hasExpiration: true,
        isExpired: false,
        isScheduled: true,
        isActive: false,
        days: daysToStart,
        hours: hoursToStart,
        minutes: Math.floor((diffStart / (1000 * 60)) % 60),
        seconds: Math.floor((diffStart / 1000) % 60),
        formattedText: `Inicia en ${daysToStart > 0 ? `${daysToStart}d ` : ''}${hoursToStart}h`,
        badgeLabel: 'Programado',
        badgeColorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800',
        action,
        expiresAt: config.expiresAt,
        startsAt: config.startsAt,
      };
    }
  }

  const diffMs = expireMs - nowMs;

  if (diffMs <= 0) {
    return {
      hasExpiration: true,
      isExpired: true,
      isScheduled: false,
      isActive: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formattedText: `Venció el ${formatExpirationDateShort(expireDate)}`,
      badgeLabel: 'Vencido',
      badgeColorClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800',
      action,
      expiresAt: config.expiresAt,
      startsAt: config.startsAt,
    };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  let formattedText = '';
  if (days > 1) {
    formattedText = `${days} días restantes`;
  } else if (days === 1) {
    formattedText = `1 día, ${hours}h restantes`;
  } else if (hours > 0) {
    formattedText = `${hours}h ${minutes}m restantes`;
  } else {
    formattedText = `${minutes}m ${seconds}s restantes`;
  }

  // Colores de alerta según proximidad
  let badgeColorClass = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
  if (days === 0 && hours < 6) {
    badgeColorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse';
  } else if (days <= 2) {
    badgeColorClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
  }

  return {
    hasExpiration: true,
    isExpired: false,
    isScheduled: false,
    isActive: true,
    days,
    hours,
    minutes,
    seconds,
    formattedText,
    badgeLabel: days > 0 ? `${days}d restantes` : `${hours}h restantes`,
    badgeColorClass,
    action,
    expiresAt: config.expiresAt,
    startsAt: config.startsAt,
  };
}

/**
 * Formatea una fecha para mostrar en advertencias de vencimiento.
 */
export function formatExpirationDate(dateOrIso: Date | string): string {
  if (!dateOrIso) return '';
  const date = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (isNaN(date.getTime())) return '';

  return date.toLocaleString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatExpirationDateShort(date: Date): string {
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Genera una fecha ISO para preajustes rápidos de vencimiento.
 */
export function generatePresetDate(
  preset:
    | '1hour'
    | '6hours'
    | '12hours'
    | '1day'
    | '3days'
    | '1week'
    | '2weeks'
    | '1month'
    | 'end_of_month'
): string {
  const now = new Date();
  const target = new Date(now);

  switch (preset) {
    case '1hour':
      target.setHours(target.getHours() + 1);
      return toLocalDatetimeInputValue(target);
    case '6hours':
      target.setHours(target.getHours() + 6);
      return toLocalDatetimeInputValue(target);
    case '12hours':
      target.setHours(target.getHours() + 12);
      return toLocalDatetimeInputValue(target);
    case '1day':
      target.setDate(target.getDate() + 1);
      break;
    case '3days':
      target.setDate(target.getDate() + 3);
      break;
    case '1week':
      target.setDate(target.getDate() + 7);
      break;
    case '2weeks':
      target.setDate(target.getDate() + 14);
      break;
    case '1month':
      target.setMonth(target.getMonth() + 1);
      break;
    case 'end_of_month':
      target.setMonth(target.getMonth() + 1, 0); // último día del mes actual
      target.setHours(23, 59, 0, 0);
      return toLocalDatetimeInputValue(target);
  }

  // Ajustar hora a las 23:59 por defecto para que venza al final del día
  target.setHours(23, 59, 0, 0);
  return toLocalDatetimeInputValue(target);
}

/**
 * Convierte un objeto Date a formato 'YYYY-MM-DDTHH:mm' compatible con <input type="datetime-local">
 */
export function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
