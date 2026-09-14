import React, { useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  ArrowUpCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { AppUpdateRelease } from '../types';
import { CURRENT_APP_VERSION } from '../version';

interface AppUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: AppUpdateRelease | null;
  installedVersion?: string;
  onInstalledSuccess?: () => void;
  deferredPrompt?: any;
  onNativeInstall?: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  installedVersion = CURRENT_APP_VERSION,
  onInstalledSuccess,
  deferredPrompt,
  onNativeInstall,
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installStatusText, setInstallStatusText] = useState('Iniciando instalación...');
  const [copiedLink, setCopiedLink] = useState(false);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsInstalling(false);
      setInstallProgress(0);
      setInstallStatusText('Preparando entorno...');
    }
  }, [isOpen]);

  if (!isOpen || !updateInfo) return null;

  const effectiveInstalledVersion =
    (typeof window !== 'undefined' && localStorage.getItem('eclesia_installed_version')) ||
    installedVersion ||
    '2.4.9';

  const updateUrl =
    updateInfo.downloadUrl && updateInfo.downloadUrl.trim().length > 0
      ? updateInfo.downloadUrl
      : typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?action=update&v=${encodeURIComponent(
          updateInfo.version
        )}`
      : '';

  const handleCopyLink = () => {
    if (navigator.clipboard && updateUrl) {
      navigator.clipboard.writeText(updateUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleStartInstallation = async () => {
    setIsInstalling(true);
    setInstallProgress(10);
    setInstallStatusText('Conectando y descargando nuevo paquete de actualización...');

    // Progress Simulation & Real Cache Invalidation
    try {
      // Step 1: Invalidate all browser caches
      await new Promise((resolve) => setTimeout(resolve, 350));
      setInstallProgress(35);
      setInstallStatusText('Limpiando archivos de caché antiguos y optimizando memoria...');

      if ('caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        } catch (cacheErr) {
          console.warn('Caches clear note:', cacheErr);
        }
      }

      // Step 2: Trigger service worker updates
      await new Promise((resolve) => setTimeout(resolve, 450));
      setInstallProgress(70);
      setInstallStatusText('Actualizando registros y preparando nuevos componentes...');

      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }
        } catch (swErr) {
          console.warn('Service worker update note:', swErr);
        }
      }

      // Step 3: Register installed version in localStorage
      await new Promise((resolve) => setTimeout(resolve, 450));
      setInstallProgress(90);
      setInstallStatusText('Registrando versión v' + updateInfo.version + ' con éxito...');

      localStorage.setItem('eclesia_installed_version', updateInfo.version);
      localStorage.setItem('eclesia_last_updated_at', String(Date.now()));
      localStorage.removeItem('eclesia_dismissed_update_version');

      // Step 4: Finish installation & reload
      await new Promise((resolve) => setTimeout(resolve, 450));
      setInstallProgress(100);
      setInstallStatusText('¡Instalación completada! Reiniciando la aplicación...');

      if (onInstalledSuccess) {
        onInstalledSuccess();
      }

      setTimeout(() => {
        // If there's an external custom download url, navigate to it; otherwise reload current app cleanly
        if (
          updateInfo.downloadUrl &&
          updateInfo.downloadUrl.startsWith('http') &&
          !updateInfo.downloadUrl.includes(window.location.host)
        ) {
          window.location.href = updateInfo.downloadUrl;
        } else {
          // Hard reload with cache-busting timestamp
          const cleanUrl = `${window.location.origin}${window.location.pathname}?updated=true&v=${encodeURIComponent(
            updateInfo.version
          )}&t=${Date.now()}`;
          window.location.href = cleanUrl;
        }
      }, 700);
    } catch (err) {
      console.error('Error during installation:', err);
      // Fallback: still mark and reload
      localStorage.setItem('eclesia_installed_version', updateInfo.version);
      window.location.reload();
    }
  };

  const handleDismiss = () => {
    if (updateInfo.isMandatory) return; // Cannot dismiss mandatory update
    try {
      localStorage.setItem('eclesia_dismissed_update_version', updateInfo.version);
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <div
      id="app-update-modal-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn"
      style={{ animationDuration: '200ms' }}
    >
      <div
        id="app-update-modal-card"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Gradient Ribbon */}
        <div
          className={`h-2.5 w-full ${
            updateInfo.isMandatory
              ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600'
              : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500'
          }`}
        />

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  updateInfo.isMandatory
                    ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                <ArrowUpCircle className="w-7 h-7 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide uppercase ${
                      updateInfo.isMandatory
                        ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                        : 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {updateInfo.isMandatory ? 'Actualización Crítica' : 'Nueva Versión Disponible'}
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold">
                    v{effectiveInstalledVersion} ➔ v{updateInfo.version}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {updateInfo.title || 'Actualización de Iglesia Monte Sinaí'}
                </h3>
              </div>
            </div>

            {!updateInfo.isMandatory && !isInstalling && (
              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Cerrar aviso"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {updateInfo.releaseNotes && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {updateInfo.releaseNotes}
            </p>
          )}
        </div>

        {/* Modal Body: Changelog & Installation Status */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* If installation is in progress */}
          {isInstalling ? (
            <div className="py-6 px-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 animate-spin">
                <RefreshCw className="w-7 h-7" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Instalando Versión v{updateInfo.version}
                </h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-1">
                  {installStatusText}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-indigo-600 to-cyan-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${installProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                <span>Progreso</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{installProgress}%</span>
              </div>
            </div>
          ) : (
            <>
              {/* Mandatory alert note */}
              {updateInfo.isMandatory && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start space-x-3 text-xs text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Actualización obligatoria:</span> Esta versión contiene
                    ajustes esenciales de sincronización y seguridad necesarios para continuar utilizando la app.
                  </div>
                </div>
              )}

              {/* Changelog items list */}
              {Array.isArray(updateInfo.changelog) && updateInfo.changelog.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Novedades y Mejoras Incluidas:
                  </span>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-4 space-y-2.5 max-h-56 overflow-y-auto">
                    {updateInfo.changelog.map((item, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                          {item}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Device & PWA Direct Link Box */}
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 overflow-hidden">
                  <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span className="truncate text-[11px]">
                    {updateUrl}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-[11px] shadow-sm transition-colors flex items-center space-x-1 shrink-0 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          {!isInstalling && !updateInfo.isMandatory && (
            <button
              type="button"
              id="btn-dismiss-update"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              Recordármelo más tarde
            </button>
          )}

          {!isInstalling && (
            <button
              type="button"
              id="btn-install-update-now"
              onClick={handleStartInstallation}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center space-x-2.5 cursor-pointer transform active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar e Instalar Ahora</span>
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          )}

          {/* Native PWA Prompt Shortcut if available */}
          {!isInstalling && deferredPrompt && onNativeInstall && (
            <button
              type="button"
              onClick={onNativeInstall}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Instalar en Pantalla de Inicio</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
