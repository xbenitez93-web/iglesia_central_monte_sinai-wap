import React, { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  Sparkles,
  Download,
  Share2,
  Copy,
  Check,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Smartphone,
  ExternalLink,
  Trash2,
  Plus,
  Layers,
  History,
  Send,
  Eye,
  Laptop,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Wifi,
} from 'lucide-react';
import { AppUpdateRelease, ChurchConfig, UserProfile } from '../types';
import {
  CURRENT_APP_VERSION,
  CURRENT_BUILD_NUMBER,
  CURRENT_BUILD_DATE,
  DEFAULT_INITIAL_RELEASE,
  parseVersionNumber,
} from '../version';
import { saveFirestoreDoc, getFirestoreDoc, syncFirestoreDoc } from '../lib/firebase';

interface AppUpdatesTabProps {
  config: ChurchConfig;
  currentUser?: UserProfile;
  onShowToast?: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onTriggerTestModal?: (previewRelease: AppUpdateRelease) => void;
}

export const AppUpdatesTab: React.FC<AppUpdatesTabProps> = ({
  config,
  currentUser,
  onShowToast,
  onTriggerTestModal,
}) => {
  // Remote active update from Firestore
  const [activeRelease, setActiveRelease] = useState<AppUpdateRelease | null>(null);
  const [releaseHistory, setReleaseHistory] = useState<AppUpdateRelease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states for creating / publishing a new release
  const [formVersion, setFormVersion] = useState<string>('2.5.1');
  const [formTitle, setFormTitle] = useState<string>('Mejoras de Sincronización y Pantalla de Bloqueo');
  const [formReleaseNotes, setFormReleaseNotes] = useState<string>(
    'Esta actualización optimiza la velocidad del sistema, sincroniza datos entre todos los dispositivos en tiempo real y estabiliza la reproducción multimedia.'
  );
  const [formChangelog, setFormChangelog] = useState<string[]>([
    'Pantalla de bloqueo con videos espirituales y reproducción continua sin interrupciones',
    'Sincronización instantánea de actualizaciones en tiempo real para todos los dispositivos',
    'Optimización de memoria, velocidad de carga y soporte PWA para móviles y tablets',
    'Mejoras en el explorador de base de datos y control de roles eclesiásticos',
  ]);
  const [newChangelogItem, setNewChangelogItem] = useState<string>('');
  const [formIsMandatory, setFormIsMandatory] = useState<boolean>(false);
  const [formDownloadUrl, setFormDownloadUrl] = useState<string>('');

  // 1. Listen to active update in Firestore in real-time
  useEffect(() => {
    const unsub = syncFirestoreDoc<AppUpdateRelease>('system', 'activeAppUpdate', (remoteData) => {
      if (remoteData) {
        setActiveRelease(remoteData);
      } else {
        setActiveRelease(null);
      }
      setIsLoading(false);
    });

    // Also load history
    getFirestoreDoc<{ list?: AppUpdateRelease[] }>('system', 'appUpdateHistory')
      .then((historyDoc) => {
        if (historyDoc && Array.isArray(historyDoc.list)) {
          setReleaseHistory(historyDoc.list);
        } else {
          setReleaseHistory([DEFAULT_INITIAL_RELEASE]);
        }
      })
      .catch((err) => {
        console.warn('Could not load release history:', err);
      });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Compute current origin / URL for links and QR code
  const currentOrigin =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://iglesiamontesinai.app';

  const updateShareUrl =
    formDownloadUrl && formDownloadUrl.trim().length > 0
      ? formDownloadUrl
      : `${currentOrigin}?action=update&v=${encodeURIComponent(formVersion)}`;

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    updateShareUrl
  )}&margin=8`;

  // Handlers for Changelog
  const handleAddChangelogItem = () => {
    if (!newChangelogItem.trim()) return;
    setFormChangelog((prev) => [...prev, newChangelogItem.trim()]);
    setNewChangelogItem('');
  };

  const handleRemoveChangelogItem = (index: number) => {
    setFormChangelog((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick version bump buttons
  const handleBumpVersion = (type: 'patch' | 'minor' | 'major') => {
    const clean = formVersion.replace(/^v/i, '').trim();
    const parts = clean.split('.').map((p) => parseInt(p, 10) || 0);
    let major = parts[0] || 2;
    let minor = parts[1] || 5;
    let patch = parts[2] || 0;

    if (type === 'patch') patch += 1;
    if (type === 'minor') {
      minor += 1;
      patch = 0;
    }
    if (type === 'major') {
      major += 1;
      minor = 0;
      patch = 0;
    }

    setFormVersion(`${major}.${minor}.${patch}`);
  };

  // Copy direct link
  const handleCopyDirectLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(updateShareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      onShowToast?.('¡Enlace de actualización copiado al portapapeles!', 'success');
    }
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const changelogList = formChangelog.map((c) => `• ${c}`).join('\n');
    const msg =
      `*¡Paz de Cristo! Nueva Actualización de Monte Sinaí (v${formVersion})*\n\n` +
      `Se ha liberado una nueva actualización oficial para el sistema de Iglesia Central Monte Sinaí.\n\n` +
      `*Novedades:*\n${changelogList}\n\n` +
      `👉 *Haz clic en este enlace para instalar la actualización ahora:*\n${updateShareUrl}`;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Toggle active broadcast on/off
  const handleToggleActiveBroadcast = async () => {
    if (!activeRelease) return;
    const nextState = !activeRelease.isActive;
    try {
      const updated = {
        ...activeRelease,
        isActive: nextState,
        updatedAt: Date.now(),
      };
      await saveFirestoreDoc('system', 'activeAppUpdate', updated);
      setActiveRelease(updated);
      onShowToast?.(
        nextState
          ? '¡Emisión de actualización activada para todos los dispositivos!'
          : 'Emisión de actualización pausada.',
        'info'
      );
    } catch (err) {
      console.error('Error toggling update broadcast:', err);
      onShowToast?.('Error al cambiar estado de emisión en Firebase.', 'danger');
    }
  };

  // Unpublish / clear active update
  const handleUnpublishActive = async () => {
    if (!confirm('¿Deseas retirar y desactivar la actualización activa en todos los dispositivos?')) return;
    try {
      await saveFirestoreDoc('system', 'activeAppUpdate', {
        isActive: false,
        version: '',
        title: '',
        changelog: [],
        publishedAt: Date.now(),
      });
      setActiveRelease(null);
      onShowToast?.('Actualización retirada de todos los dispositivos.', 'info');
    } catch (err) {
      console.error('Error unpublishing:', err);
      onShowToast?.('Error al retirar la actualización.', 'danger');
    }
  };

  // Publish new release to Firestore (Broadcast to all devices!)
  const handlePublishRelease = async () => {
    if (!formVersion.trim()) {
      onShowToast?.('Por favor ingresa un número de versión válido.', 'danger');
      return;
    }
    if (!formTitle.trim()) {
      onShowToast?.('Por favor ingresa un título para la actualización.', 'danger');
      return;
    }

    setIsPublishing(true);
    try {
      const newRelease: AppUpdateRelease = {
        id: `release-v${formVersion.replace(/\./g, '-')}-${Date.now()}`,
        version: formVersion.trim(),
        versionCode: parseVersionNumber(formVersion),
        title: formTitle.trim(),
        changelog: formChangelog,
        releaseNotes: formReleaseNotes.trim(),
        isMandatory: formIsMandatory,
        downloadUrl: formDownloadUrl.trim() || updateShareUrl,
        publishedAt: Date.now(),
        publishedBy: currentUser?.fullName || currentUser?.name || 'Desarrollador Monte Sinaí',
        isActive: true,
      };

      // 1. Broadcast to Firestore doc system/activeAppUpdate
      await saveFirestoreDoc('system', 'activeAppUpdate', newRelease);

      // 2. Append to history in system/appUpdateHistory
      const updatedHistory = [newRelease, ...releaseHistory.filter((r) => r.version !== newRelease.version)];
      setReleaseHistory(updatedHistory);
      await saveFirestoreDoc('system', 'appUpdateHistory', {
        list: updatedHistory.slice(0, 20),
        updatedAt: Date.now(),
      });

      // 3. Update local installed version too so dev doesn't get blocked
      localStorage.setItem('eclesia_installed_version', newRelease.version);

      setActiveRelease(newRelease);
      onShowToast?.(
        `¡Versión v${newRelease.version} publicada y transmitida a todos los dispositivos con éxito!`,
        'success'
      );
    } catch (err) {
      console.error('Error publishing release:', err);
      onShowToast?.('Error al publicar la actualización en Firebase.', 'danger');
    } finally {
      setIsPublishing(false);
    }
  };

  // Trigger preview in current device
  const handleTestInCurrentDevice = () => {
    const previewRelease: AppUpdateRelease = {
      id: 'preview-test',
      version: formVersion.trim(),
      versionCode: parseVersionNumber(formVersion),
      title: formTitle.trim() || 'Prueba de Actualización',
      changelog: formChangelog,
      releaseNotes: formReleaseNotes.trim(),
      isMandatory: formIsMandatory,
      downloadUrl: formDownloadUrl.trim() || updateShareUrl,
      publishedAt: Date.now(),
      publishedBy: currentUser?.fullName || 'Desarrollador',
      isActive: true,
    };

    if (onTriggerTestModal) {
      onTriggerTestModal(previewRelease);
    } else {
      onShowToast?.('Abriendo pantalla emergente de prueba...', 'info');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-black uppercase tracking-wider text-cyan-200 border border-white/20">
              <ArrowUpCircle className="w-4 h-4 text-cyan-300 animate-pulse" />
              <span>Transmisión Remota de Actualizaciones PWA</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Gestor de Actualizaciones & Lanzamiento a Dispositivos
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              Cuando compiles o realices cambios en la app, lanza una nueva versión desde aquí. En todos los
              teléfonos, tablets y computadoras conectadas aparecerá inmediatamente una pantalla emergente
              indicando la actualización con el botón <strong>&quot;Descargar e Instalar Ahora&quot;</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestInCurrentDevice}
            className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-blue-50 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center space-x-2 shrink-0 cursor-pointer transform active:scale-95"
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Probar Pantalla Emergente</span>
          </button>
        </div>
      </div>

      {/* Grid: Current System Status & Active Cloud Broadcast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Local Device Version */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-4 h-4 text-indigo-500" />
              Versión en Este Dispositivo
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold">
              Build #{CURRENT_BUILD_NUMBER}
            </span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              v{CURRENT_APP_VERSION}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Compilada: {CURRENT_BUILD_DATE}
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Código fuente actual en ejecución. Al lanzar una nueva versión desde el formulario inferior,
            este identificador servirá de base para que los clientes detecten la actualización.
          </p>
        </div>

        {/* Card 2: Cloud Firestore Broadcast Status */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-emerald-500" />
              Emisión Activa en la Nube (Firebase)
            </span>
            {activeRelease?.isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Transmitiendo
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold">
                Pausada
              </span>
            )}
          </div>

          {activeRelease && activeRelease.version ? (
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  v{activeRelease.version}
                </span>
                <span className="text-xs text-slate-500">
                  {new Date(activeRelease.publishedAt).toLocaleString('es-ES', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate">
                {activeRelease.title}
              </p>

              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={handleToggleActiveBroadcast}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  {activeRelease.isActive ? (
                    <>
                      <ToggleRight className="w-4 h-4 text-emerald-500" />
                      <span>Pausar Emisión</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4 text-slate-400" />
                      <span>Reanudar Emisión</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleUnpublishActive}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Retirar Actualización</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-2 text-slate-500 dark:text-slate-400 text-xs italic">
              No hay ninguna actualización activa emitiéndose actualmente a los dispositivos.
            </div>
          )}
        </div>
      </div>

      {/* Main Publishing Section: Form & Link/QR Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Release Creation Form */}
        <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Configurar y Emitir Nueva Actualización
            </h3>
            <span className="text-xs text-slate-500">Paso 1 de 2: Definir Versión</span>
          </div>

          <div className="space-y-4">
            {/* Version Number Input + Quick Increment Buttons */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número de Versión a Lanzar:
              </label>
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative flex-1 min-w-[140px]">
                  <span className="absolute left-3 top-2.5 text-xs font-bold font-mono text-slate-400">
                    v
                  </span>
                  <input
                    type="text"
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value.replace(/^v/i, ''))}
                    placeholder="2.5.1"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Bump buttons */}
                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('patch')}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="Incremento de corrección rápida"
                  >
                    +0.0.1 Patch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('minor')}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="Incremento de nuevas funciones"
                  >
                    +0.1.0 Menor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBumpVersion('major')}
                    className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                    title="Lanzamiento mayor"
                  >
                    +1.0.0 Mayor
                  </button>
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Título del Lanzamiento / Actualización:
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ej. Actualización Integral Monte Sinaí v2.5"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Release Notes / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descripción General (Para los hermanos/usuarios):
              </label>
              <textarea
                value={formReleaseNotes}
                onChange={(e) => setFormReleaseNotes(e.target.value)}
                rows={2}
                placeholder="Describe brevemente el propósito de esta actualización..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Changelog Items (Viñetas de novedades) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Lista de Novedades & Cambios (Changelog):
              </label>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {formChangelog.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-x-2"
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate">
                        {item}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveChangelogItem(index)}
                      className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title="Eliminar viñeta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Changelog Item input */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  value={newChangelogItem}
                  onChange={(e) => setNewChangelogItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChangelogItem();
                    }
                  }}
                  placeholder="Escribe una nueva mejora o corrección..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddChangelogItem}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center space-x-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>

            {/* Mandatory Update Switch */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>¿Es una Actualización Obligatoria (Crítica)?</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Si se activa, los usuarios no podrán cerrar la pantalla emergente hasta que hayan instalado la
                  nueva versión.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormIsMandatory(!formIsMandatory)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  formIsMandatory ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    formIsMandatory ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Custom Download / Install URL (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                URL Personalizada de Instalación / Descarga (Opcional):
              </label>
              <input
                type="text"
                value={formDownloadUrl}
                onChange={(e) => setFormDownloadUrl(e.target.value)}
                placeholder={updateShareUrl}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Por defecto utiliza la dirección actual del sistema para recarga automática y caché limpia.
              </span>
            </div>

            {/* Publish Button */}
            <div className="pt-2">
              <button
                type="button"
                id="btn-publish-app-update"
                disabled={isPublishing}
                onClick={handlePublishRelease}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white font-black text-sm shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center space-x-2.5 cursor-pointer transform active:scale-95 disabled:opacity-60"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Publicando y Notificando a Dispositivos...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>🚀 Publicar y Notificar a Todos los Dispositivos Ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Direct Link Generator & QR Code */}
        <div className="space-y-4">
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <QrCode className="w-5 h-5 text-purple-600" />
              Enlace Directo & Código QR
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Comparte este enlace o permite que los hermanos escaneen el código QR desde su celular o tablet para
              abrir e instalar la actualización directamente sin pasos complicados.
            </p>

            {/* QR Code Preview */}
            <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <img
                src={qrCodeUrl}
                alt="Código QR de Actualización"
                className="w-44 h-44 rounded-xl shadow-md border border-white"
              />
              <span className="text-[11px] font-mono text-slate-500 mt-2 font-bold">
                Escanear para instalar v{formVersion}
              </span>
            </div>

            {/* Direct Link Input & Copy */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 break-all select-all border border-slate-200 dark:border-slate-700">
                {updateShareUrl}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyDirectLink}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Enlace</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Por WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick instructions guide */}
          <div className="bg-indigo-50/60 dark:bg-indigo-950/30 rounded-3xl p-5 border border-indigo-100 dark:border-indigo-900/50 space-y-2.5 text-xs text-indigo-900 dark:text-indigo-200">
            <span className="font-black uppercase tracking-wider text-[10px] text-indigo-600 dark:text-indigo-400 block">
              ¿Cómo funciona en los demás dispositivos?
            </span>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Detección en Tiempo Real:</strong> Al pulsar &quot;Publicar&quot;, Firebase emite la señal y los
                dispositivos conectados abren la pantalla emergente en 1-2 segundos.
              </li>
              <li>
                <strong>Un solo clic:</strong> Al presionar &quot;Descargar e Instalar Ahora&quot;, el dispositivo limpia
                la caché antigua, actualiza el Service Worker y recarga la nueva versión.
              </li>
              <li>
                <strong>Soporte PWA:</strong> Si el dispositivo no tiene la app instalada en la pantalla de inicio,
                también le permite instalarla de inmediato.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* History of Published Releases */}
      {releaseHistory.length > 0 && (
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <History className="w-5 h-5 text-purple-600" />
            Historial de Versiones Publicadas ({releaseHistory.length})
          </h3>

          <div className="space-y-3">
            {releaseHistory.map((rel) => (
              <div
                key={rel.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                      v{rel.version}
                    </span>
                    {rel.isMandatory && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                        Obligatoria
                      </span>
                    )}
                    <span className="text-slate-400 text-[11px]">
                      {new Date(rel.publishedAt).toLocaleString('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-200">{rel.title}</p>
                  {rel.releaseNotes && <p className="text-slate-500 text-[11px]">{rel.releaseNotes}</p>}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setFormVersion(rel.version);
                      setFormTitle(rel.title);
                      setFormReleaseNotes(rel.releaseNotes || '');
                      setFormChangelog(rel.changelog || []);
                      setFormIsMandatory(rel.isMandatory || false);
                      onShowToast?.(`Datos de la versión v${rel.version} cargados en el formulario`, 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold transition-colors cursor-pointer"
                  >
                    Cargar en Formulario
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
