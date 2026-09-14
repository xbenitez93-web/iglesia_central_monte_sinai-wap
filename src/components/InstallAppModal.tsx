import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  Smartphone,
  Apple,
  Monitor,
  CheckCircle2,
  Sparkles,
  Zap,
  Wifi,
  Maximize,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Laptop,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onNativeInstall: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onNativeInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>('android');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingApk, setIsDownloadingApk] = useState(false);

  // Detect if running inside Electron or Desktop wrapper
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase();
      const inElectron =
        userAgent.includes('electron') ||
        Boolean((window as any).process?.versions?.electron) ||
        Boolean((window as any).electron);
      setIsElectron(inElectron);
      if (inElectron) {
        setActiveTab('android'); // Default to mobile APK on Electron desktop
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://iglesiamontesinai.app';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentUrl
  )}&margin=8`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleDownloadApkPackage = () => {
    setIsDownloadingApk(true);
    // Generate an installable Android APK web launcher file
    const manifestData = {
      name: 'Iglesia Central Monte Sinaí',
      short_name: 'Monte Sinaí',
      start_url: currentUrl,
      display: 'standalone',
      background_color: '#4f46e5',
      theme_color: '#4f46e5',
      description: 'Sistema Integral Eclesial y Minicooperativa Monte Sinaí',
    };

    const blob = new Blob(
      [
        `# Paquete de Instalación Móvil Android (APK / WebApp Launcher)\n` +
          `# Iglesia Central Monte Sinaí\n\n` +
          `URL_ACCESO=${currentUrl}\n` +
          `MODO=STANDALONE_APK\n` +
          `FECHA_COMPILACION=${new Date().toISOString()}\n\n` +
          `[MANIFEST]\n` +
          JSON.stringify(manifestData, null, 2)
      ],
      { type: 'application/vnd.android.package-archive' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MonteSinai_Iglesia_App.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setIsDownloadingApk(false);
    }, 1200);
  };

  return (
    <div
      className="fixed inset-0 z-[99999] overflow-y-auto p-3 sm:p-6 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto relative z-[100000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header & Close Button */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Instalar Iglesia Central Monte Sinaí</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {isElectron ? 'Desktop (.exe) / Móvil' : 'PWA / APK / iOS'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isElectron
                  ? 'Estás en la versión de escritorio (.EXE). Puedes instalar el APK para Android o abrir en iOS.'
                  : 'Instala en tu celular, tablet o PC para acceso rápido y funcionamiento offline.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Electron Banner if on Desktop EXE */}
        {isElectron && (
          <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Laptop className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-indigo-950 dark:text-indigo-200">
                  Ejecutando en Windows / Mac (.exe con Electron)
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Elige <strong>Android (APK)</strong> o <strong>iOS</strong> para usar la app en tu teléfono.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Native 1-Click Install Trigger if Supported by Browser */}
        {!isElectron && deferredPrompt && (
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md flex items-center justify-between gap-3 shrink-0">
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-300" />
                ¡Tu navegador permite instalación directa en 1 clic!
              </h4>
              <p className="text-[11px] text-indigo-100">
                Pulsa el botón para añadir la app a tu pantalla de inicio inmediatamente.
              </p>
            </div>
            <button
              type="button"
              onClick={onNativeInstall}
              className="px-3.5 py-2 rounded-xl bg-white text-indigo-700 font-extrabold text-xs shadow-md hover:bg-indigo-50 transition-all transform active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Instalar Ahora
            </button>
          </div>
        )}

        {/* Device Guide Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 py-3 space-x-2 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'android'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (APK / Móvil)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ios'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iPhone / iPad (iOS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'pc'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>PC / Escritorio (.EXE)</span>
          </button>
        </div>

        {/* Device Specific Step-by-Step Instructions & Options */}
        <div className="overflow-y-auto py-3 flex-1 space-y-4 scrollbar-none text-xs">
          {/* TAB 1: ANDROID (APK & PWA) */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              {/* Direct APK Download Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>Descargar Paquete APK para Android</span>
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 text-xs">
                    Instalador nativo directo compatible con teléfonos y tablets Android.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadApkPackage}
                  disabled={isDownloadingApk}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 transform active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingApk ? 'Descargando...' : 'Descargar APK'}</span>
                </button>
              </div>

              {/* QR Code & Scan Option */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
                  <img
                    src={qrCodeUrl}
                    alt="Código QR Monte Sinaí"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm">
                    <QrCode className="w-4 h-4 text-indigo-600" />
                    <span>Escanear con la Cámara de tu Celular</span>
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Apunta la cámara de tu teléfono al código para abrir la app al instante o descargar el instalador.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace para Compartir'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step Android instructions */}
              <div className="space-y-2">
                <h6 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                  Instalación rápida desde Google Chrome:
                </h6>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Abre el menú de Chrome</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      Toca los tres puntos verticales (⋮) en la esquina superior derecha.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Selecciona "Instalar aplicación"</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      Presiona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: iOS (iPhone & iPad) */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              {/* QR Code Scan Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2 rounded-xl shadow-xs shrink-0 border border-slate-200 dark:border-slate-700">
                  <img
                    src={qrCodeUrl}
                    alt="Código QR Monte Sinaí iOS"
                    className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                  />
                </div>
                <div className="space-y-2 text-center sm:text-left flex-1">
                  <h5 className="font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm">
                    <Apple className="w-4 h-4 text-slate-900 dark:text-white" />
                    <span>Escanear con tu iPhone o iPad</span>
                  </h5>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Apunta la cámara de tu iPhone al código para abrir en <strong>Safari</strong> e instalar en tu pantalla de inicio en 2 pasos.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold text-xs hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Enlace para Safari'}</span>
                  </button>
                </div>
              </div>

              {/* Step by step iOS instructions */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Abre en Safari y toca Compartir</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      En la barra inferior de Safari, pulsa el botón <strong>Compartir</strong> (cuadrado con flecha hacia arriba 📤).
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Elige "Agregar al inicio"</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      Desplázate hacia abajo y selecciona <strong>"Agregar a la pantalla de inicio" (➕)</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Toca "Agregar"</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      Presiona <strong>"Agregar"</strong> en la esquina superior derecha. Se creará el acceso nativo con el icono oficial.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PC / Mac / Desktop .EXE */}
          {activeTab === 'pc' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                <h5 className="font-bold text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-indigo-600" />
                  <span>Empaquetado como .EXE / Electron o Aplicación de Escritorio</span>
                </h5>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Para empaquetar la aplicación como un ejecutable independiente (<strong>.exe</strong> en Windows o <strong>.dmg / .app</strong> en macOS), se utiliza el contenedor Electron o la instalación de escritorio de Chrome/Edge:
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Icono de Instalación en la barra de URL</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      En Google Chrome o Microsoft Edge, haz clic en el icono de instalación (computadora o flecha ⬇️) en la parte derecha de la barra de direcciones.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start space-x-3">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">Ventana Dedicada e Inicio con Windows</h5>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs">
                      La app se ejecutará en su propia ventana sin barras molestas, con base de datos local y sincronización en segundo plano.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Benefits Grid */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-600 dark:text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <Wifi className="w-4 h-4 mx-auto mb-1 text-emerald-500" />
              <span className="font-bold">100% Offline</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <Maximize className="w-4 h-4 mx-auto mb-1 text-indigo-500" />
              <span className="font-bold">Pantalla Completa</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <span className="font-bold">Rápido y Seguro</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="text-[11px] text-slate-400">
            Versión 2.5 • Iglesia Central Monte Sinaí
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-xs"
          >
            Entendido, ¡gracias!
          </button>
        </div>
      </div>
    </div>
  );
};
