import { AppUpdateRelease } from './types';

export const CURRENT_APP_VERSION = '2.5.0';
export const CURRENT_BUILD_NUMBER = 250;
export const CURRENT_BUILD_DATE = '2026-09-07';

/**
 * Parses a semver string like "2.5.0" into a numeric representation for comparison (e.g., 20500)
 */
export function parseVersionNumber(version: string): number {
  if (!version) return 0;
  const cleaned = version.replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map((p) => {
    const num = parseInt(p, 10);
    return isNaN(num) ? 0 : num;
  });
  const major = parts[0] || 0;
  const minor = parts[1] || 0;
  const patch = parts[2] || 0;
  return major * 10000 + minor * 100 + patch;
}

/**
 * Determines if a remote version is strictly newer than the currently installed version
 */
export function isNewerVersion(remoteVersion?: string, currentVersion?: string): boolean {
  if (!remoteVersion) return false;
  const remoteNum = parseVersionNumber(remoteVersion);
  const currentNum = parseVersionNumber(currentVersion || CURRENT_APP_VERSION);
  return remoteNum > currentNum;
}

/**
 * Calculates a bumped minor version (e.g. "2.5.0" -> "2.6.0")
 */
export function bumpMinorVersion(version: string): string {
  if (!version) return '2.6.0';
  const cleaned = version.replace(/^v/i, '').trim();
  const parts = cleaned.split('.').map((p) => parseInt(p, 10) || 0);
  const major = parts[0] ?? 2;
  const minor = (parts[1] ?? 5) + 1;
  return `${major}.${minor}.0`;
}

/**
 * Default initial release state for Monte Sinaí
 */
export const DEFAULT_INITIAL_RELEASE: AppUpdateRelease = {
  id: 'release-v2-5-0',
  version: '2.5.0',
  versionCode: 250,
  title: 'Actualización Integral Monte Sinaí v2.5',
  changelog: [
    'Pantalla de bloqueo con videos espirituales y reproducción continua sin interrupciones',
    'Sincronización instantánea de actualizaciones en tiempo real para todos los dispositivos',
    'Gestión avanzada de ministerios, servidores y roles eclesiásticos',
    'Optimización de carga rápida, memoria y soporte PWA mejorado para móviles y tablets',
  ],
  releaseNotes: 'Esta versión incluye importantes mejoras de estabilidad, persistencia en la nube y sincronización simultánea entre todos los dispositivos de la congregación.',
  isMandatory: false,
  downloadUrl: '',
  publishedAt: Date.now(),
  publishedBy: 'Desarrollador Monte Sinaí',
  isActive: true,
};
