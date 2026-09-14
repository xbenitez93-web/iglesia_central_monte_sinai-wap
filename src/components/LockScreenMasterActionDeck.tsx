import React, { useState } from 'react';
import {
  Lock,
  Eye,
  Zap,
  Video,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Volume2,
  VolumeX,
  KeyRound,
  Shield,
  ShieldCheck,
  Camera,
  Upload,
  Link,
  UploadCloud,
  Database,
  RefreshCw,
  Copy,
  Download,
  RotateCcw,
  Maximize2,
  Clock,
  Check,
  Flame,
  Star,
  CloudRain,
  Sun,
  Layers,
  FileVideo,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LockScreenConfig,
  LockScreenTheme,
  LockScreenAnimation,
  LockScreenBackgroundType,
} from '../types';
import {
  THEME_COLOR_PRESETS,
  SPIRITUAL_VIDEO_PRESETS,
  SPIRITUAL_IMAGE_PRESETS,
  defaultLockScreenConfig,
  safeStringifyLockScreenConfig,
} from '../data/lockScreenPresets';

interface LockScreenMasterActionDeckProps {
  config: LockScreenConfig;
  onApplyConfig: (nextConfig: LockScreenConfig, toastMsg?: string) => void;
  onTriggerLockNow: () => void;
  onStartCountdownTest: (seconds: number) => void;
  onOpenPhotoCapture: () => void;
  onTriggerFileInput: () => void;
  onOpenExternalUrlDialog: () => void;
  onSyncCloudVideos: () => void;
  onSyncFirestorePresets: () => void;
  onNavigateToDatabase?: (collection?: string) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  isSyncingCloud?: boolean;
  isSyncingPresets?: boolean;
}

export const LockScreenMasterActionDeck: React.FC<LockScreenMasterActionDeckProps> = ({
  config,
  onApplyConfig,
  onTriggerLockNow,
  onStartCountdownTest,
  onOpenPhotoCapture,
  onTriggerFileInput,
  onOpenExternalUrlDialog,
  onSyncCloudVideos,
  onSyncFirestorePresets,
  onNavigateToDatabase,
  onShowToast,
  isSyncingCloud = false,
  isSyncingPresets = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [activeActionCategory, setActiveActionCategory] = useState<'all' | 'test' | 'visual' | 'particles' | 'media' | 'security' | 'database'>('all');

  // Fullscreen trigger for TV/Projector
  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
          onShowToast('📺 Modo Pantalla Completa activado para proyector o TV.', 'info');
        }).catch(() => {
          onShowToast('Pantalla completa iniciada.', 'info');
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
          onShowToast('Modo normal restaurado.', 'info');
        }
      }
    } catch (_) {
      onShowToast('Proyección en pantalla completa lista.', 'info');
    }
  };

  // Copy JSON configuration to clipboard
  const handleCopyConfigJson = () => {
    try {
      const jsonStr = safeStringifyLockScreenConfig(config);
      navigator.clipboard.writeText(jsonStr);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
      onShowToast('📋 Configuración completa copiada al portapapeles en formato JSON.', 'success');
    } catch (e) {
      onShowToast('No se pudo copiar la configuración al portapapeles.', 'danger');
    }
  };

  // Download JSON configuration
  const handleDownloadConfigJson = () => {
    try {
      const jsonStr = safeStringifyLockScreenConfig(config);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `config_salvapantallas_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('💾 Respaldo JSON descargado con éxito.', 'success');
    } catch (_) {
      onShowToast('Error al descargar respaldo.', 'danger');
    }
  };

  // Set timeout shortcut
  const handleSetTimeout = (minutes: number, label: string) => {
    onApplyConfig(
      {
        ...config,
        timeoutMinutes: minutes,
        enabled: true,
        updatedAt: Date.now(),
      },
      `⏰ Tiempo de inactividad establecido a ${label}.`
    );
  };

  // Switch particle animation
  const handleSetAnimation = (anim: LockScreenAnimation, label: string) => {
    onApplyConfig(
      {
        ...config,
        animationType: anim,
        updatedAt: Date.now(),
      },
      `✨ Efecto "${label}" activado en el salvapantallas.`
    );
  };

  // Switch color theme
  const handleSetTheme = (theme: LockScreenTheme, label: string) => {
    onApplyConfig(
      {
        ...config,
        theme,
        backgroundType: 'gradient',
        updatedAt: Date.now(),
      },
      `🎨 Tema "${label}" aplicado con gradiente sagrado.`
    );
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/80 to-slate-900 border-2 border-indigo-500/30 p-5 sm:p-6 shadow-2xl space-y-5 transition-all">
      {/* HEADER WITH TOGGLE & STATUS BADGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                Botonera Maestra de Acciones Rápidas
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                +35 Funciones Directas
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Ejecuta pruebas en vivo, cambia fondos, efectos de partículas, seguridad y sincronizaciones con 1 solo clic.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => onTriggerLockNow()}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
            title="Activar salvapantallas ahora mismo"
          >
            <Lock className="w-4 h-4" />
            <span>Bloquear Ahora</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 transition-all cursor-pointer"
            title={isExpanded ? 'Contraer panel de botones' : 'Expandir panel de botones'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* CATEGORY FILTER CHIPS */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'Todas las Acciones (+35)' },
              { id: 'test', label: '🎯 Pruebas & Ejecución' },
              { id: 'visual', label: '🎬 Fondos & Estilos' },
              { id: 'particles', label: '✨ Partículas Sagradas' },
              { id: 'media', label: '📷 Cámara & Medios' },
              { id: 'security', label: '🛡️ Seguridad & Tiempos' },
              { id: 'database', label: '🗄️ Base de Datos & Nube' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveActionCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeActionCategory === cat.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/10 hover:bg-white/15 text-indigo-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 1. PRUEBAS Y EJECUCIÓN INMEDIATA */}
          {(activeActionCategory === 'all' || activeActionCategory === 'test') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Zap className="w-3.5 h-3.5" />
                <span>Pruebas Inmediatas & Proyección</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => onTriggerLockNow()}
                  className="p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Lock className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Bloquear Ya</span>
                  <span className="text-[10px] text-amber-300/70 font-normal">Activa instantáneo</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCountdownTest(3)}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Probar en 3 seg</span>
                  <span className="text-[10px] text-indigo-300/70 font-normal">Cuenta rápida</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCountdownTest(5)}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Zap className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Probar en 5 seg</span>
                  <span className="text-[10px] text-indigo-300/70 font-normal">Ver transición</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCountdownTest(10)}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Probar en 10 seg</span>
                  <span className="text-[10px] text-indigo-300/70 font-normal">Inactividad test</span>
                </button>

                <button
                  type="button"
                  onClick={() => onStartCountdownTest(30)}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Probar en 30 seg</span>
                  <span className="text-[10px] text-indigo-300/70 font-normal">Pausa corta</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className="p-3 rounded-2xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Maximize2 className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-center font-bold">Pantalla Completa</span>
                  <span className="text-[10px] text-purple-300/70 font-normal">Para Proyector / TV</span>
                </button>
              </div>
            </div>
          )}

          {/* 2. FONDOS Y ESTILO VISUAL */}
          {(activeActionCategory === 'all' || activeActionCategory === 'visual') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                <Palette className="w-3.5 h-3.5" />
                <span>Acciones de Fondo & Temas Espirituales</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const preset = SPIRITUAL_VIDEO_PRESETS[0];
                    onApplyConfig(
                      {
                        ...config,
                        backgroundType: 'video',
                        presetVideoId: preset.id,
                        customVideoPresetId: '',
                        mediaUrl: preset.videoUrl,
                        updatedAt: Date.now(),
                      },
                      `🎬 Modo Video activado con "${preset.name}".`
                    );
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.backgroundType === 'video'
                      ? 'bg-purple-600/40 border-purple-400 text-white ring-2 ring-purple-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Video className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">Activar Video</span>
                  <span className="text-[9px] text-white/60">Cielo Majestuoso</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const preset = SPIRITUAL_IMAGE_PRESETS[0];
                    onApplyConfig(
                      {
                        ...config,
                        backgroundType: 'image',
                        mediaUrl: preset.imageUrl,
                        mediaType: 'image',
                        presetVideoId: '',
                        customVideoPresetId: '',
                        updatedAt: Date.now(),
                      },
                      `🖼️ Modo Imagen activado con "${preset.name}".`
                    );
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.backgroundType === 'image'
                      ? 'bg-blue-600/40 border-blue-400 text-white ring-2 ring-blue-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-bold">Activar Foto</span>
                  <span className="text-[9px] text-white/60">Rayos de Gloria</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('monte_sinai', 'Monte Sinaí')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950 border border-purple-500/40 hover:border-purple-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-sm" />
                  <span className="font-bold">Monte Sinaí</span>
                  <span className="text-[9px] text-purple-200/70">Púrpura Imperial</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('aurora', 'Aurora Celestial')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-teal-900 to-indigo-950 border border-teal-500/40 hover:border-teal-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-teal-400 shadow-sm" />
                  <span className="font-bold">Aurora</span>
                  <span className="text-[9px] text-teal-200/70">Cyan & Teal</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('sunset', 'Atardecer de Gracia')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-amber-900 to-rose-950 border border-amber-500/40 hover:border-amber-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-sm" />
                  <span className="font-bold">Atardecer</span>
                  <span className="text-[9px] text-amber-200/70">Ámbar Dorado</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('worship_night', 'Noche de Adoración')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 border border-blue-500/40 hover:border-blue-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-400 shadow-sm" />
                  <span className="font-bold">Noche Adoración</span>
                  <span className="text-[9px] text-blue-200/70">Azul Zafiro</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('eternal_peace', 'Paz Eterna')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-purple-900 to-slate-950 border border-purple-500/40 hover:border-purple-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-purple-400 shadow-sm" />
                  <span className="font-bold">Paz Eterna</span>
                  <span className="text-[9px] text-purple-200/70">Lavanda Celestial</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTheme('emerald_glory', 'Esmeralda Viva')}
                  className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 border border-emerald-500/40 hover:border-emerald-400 text-white text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-sm" />
                  <span className="font-bold">Esmeralda</span>
                  <span className="text-[9px] text-emerald-200/70">Esperanza Viva</span>
                </button>
              </div>
            </div>
          )}

          {/* 3. PARTÍCULAS Y ANIMACIONES */}
          {(activeActionCategory === 'all' || activeActionCategory === 'particles') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Efectos de Partículas y Clima Celestial</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetAnimation('particles', 'Partículas Sagradas')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'particles'
                      ? 'bg-blue-600/40 border-blue-400 text-white ring-2 ring-blue-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <CloudRain className="w-5 h-5 text-blue-400" />
                  <span className="font-bold">Partículas</span>
                  <span className="text-[9px] text-white/60">Gotas de Bendición</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAnimation('celestial_stars', 'Estrellas Celestiales')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'celestial_stars'
                      ? 'bg-indigo-600/40 border-indigo-400 text-white ring-2 ring-indigo-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Star className="w-5 h-5 text-indigo-400" />
                  <span className="font-bold">Estrellas</span>
                  <span className="text-[9px] text-white/60">Firmamento Santo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAnimation('aurora_waves', 'Ondas Celestiales')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'aurora_waves'
                      ? 'bg-teal-600/40 border-teal-400 text-white ring-2 ring-teal-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Flame className="w-5 h-5 text-teal-400" />
                  <span className="font-bold">Ondas Aurora</span>
                  <span className="text-[9px] text-white/60">Ondas de Gloria</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAnimation('ambient_glow', 'Resplandor Suave')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'ambient_glow'
                      ? 'bg-amber-600/40 border-amber-400 text-white ring-2 ring-amber-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Sun className="w-5 h-5 text-amber-400" />
                  <span className="font-bold">Resplandor</span>
                  <span className="text-[9px] text-white/60">Brillo Cálido</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAnimation('subtle_pulse', 'Pulso de Avivamiento')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'subtle_pulse'
                      ? 'bg-purple-600/40 border-purple-400 text-white ring-2 ring-purple-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="font-bold">Pulso Suave</span>
                  <span className="text-[9px] text-white/60">Latido Espiritual</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetAnimation('none', 'Sin Efecto (Limpio)')}
                  className={`p-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.animationType === 'none'
                      ? 'bg-slate-700/60 border-slate-400 text-white ring-2 ring-slate-500'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5 text-slate-400" />
                  <span className="font-bold">Sin Partículas</span>
                  <span className="text-[9px] text-white/60">Fondo Plano</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. MULTIMEDIA, CÁMARA & NUBE */}
          {(activeActionCategory === 'all' || activeActionCategory === 'media') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Camera className="w-3.5 h-3.5" />
                <span>Cámara, Subida de Archivos & Nube Central</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPhotoCapture()}
                  className="p-3 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Camera className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Tomar Foto con Cámara</span>
                  <span className="text-[10px] text-cyan-300/70 font-normal">Desde móvil o webcam</span>
                </button>

                <button
                  type="button"
                  onClick={() => onTriggerFileInput()}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Upload className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Subir Video o Imagen</span>
                  <span className="text-[10px] text-indigo-300/70 font-normal">Desde tu computadora</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenExternalUrlDialog()}
                  className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group"
                >
                  <Link className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Insertar por Enlace URL</span>
                  <span className="text-[10px] text-emerald-300/70 font-normal">MP4, WebM o JPG/PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSyncCloudVideos()}
                  disabled={isSyncingCloud}
                  className="p-3 rounded-2xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-blue-400/40 text-blue-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1.5 cursor-pointer active:scale-95 group disabled:opacity-50"
                >
                  <UploadCloud className={`w-5 h-5 text-blue-300 group-hover:scale-110 transition-transform ${isSyncingCloud ? 'animate-bounce' : ''}`} />
                  <span className="font-bold">{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Teléfono ➔ PC'}</span>
                  <span className="text-[10px] text-blue-300/70 font-normal">Réplica universal en nube</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. SEGURIDAD & TIEMPOS DE INACTIVIDAD */}
          {(activeActionCategory === 'all' || activeActionCategory === 'security') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rose-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Seguridad, Audio & Temporizadores Rápidos</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !config.requirePasswordToUnlock;
                    onApplyConfig(
                      {
                        ...config,
                        requirePasswordToUnlock: nextVal,
                        updatedAt: Date.now(),
                      },
                      nextVal
                        ? '🔒 Desbloqueo protegido: ahora requiere contraseña o PIN.'
                        : '🔓 Desbloqueo rápido: desbloquea con un clic o toque libre.'
                    );
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.requirePasswordToUnlock
                      ? 'bg-rose-600/30 border-rose-400 text-rose-200'
                      : 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  <span className="font-bold">{config.requirePasswordToUnlock ? 'PIN Activo' : 'PIN Inactivo'}</span>
                  <span className="text-[9px] opacity-75">Alternar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !(config.videoMuted ?? true);
                    onApplyConfig(
                      {
                        ...config,
                        videoMuted: nextMuted,
                        updatedAt: Date.now(),
                      },
                      nextMuted ? '🔇 Audio de videos silenciado por defecto.' : '🔊 Audio de videos activado con sonido.'
                    );
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.videoMuted ?? true
                      ? 'bg-white/5 border-white/15 text-slate-300'
                      : 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                  }`}
                >
                  {config.videoMuted ?? true ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                  <span className="font-bold">{config.videoMuted ?? true ? 'Sin Sonido' : 'Con Sonido'}</span>
                  <span className="text-[9px] opacity-75">Audio Video</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTimeout(0.5, '30 segundos')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="font-bold">30 Segundos</span>
                  <span className="text-[9px] text-slate-400">Modo Demo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTimeout(2, '2 minutos')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold">2 Minutos</span>
                  <span className="text-[9px] text-slate-400">Pausa Corta</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTimeout(5, '5 minutos')}
                  className="p-2.5 rounded-2xl bg-indigo-600/30 hover:bg-indigo-600/40 border border-indigo-400/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <Clock className="w-4 h-4 text-indigo-300" />
                  <span className="font-bold">5 Minutos</span>
                  <span className="text-[9px] text-indigo-300/70">Recomendado</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTimeout(15, '15 minutos')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">15 Minutos</span>
                  <span className="text-[9px] text-slate-400">Para Cultos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetTimeout(30, '30 minutos')}
                  className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95"
                >
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span className="font-bold">30 Minutos</span>
                  <span className="text-[9px] text-slate-400">Sermón Largo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !config.enabled;
                    onApplyConfig(
                      {
                        ...config,
                        enabled: nextVal,
                        updatedAt: Date.now(),
                      },
                      nextVal ? '✅ Salvapantallas y bloqueo automático habilitados.' : '⚠️ Salvapantallas automático pausado.'
                    );
                  }}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 ${
                    config.enabled
                      ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                      : 'bg-rose-600/30 border-rose-400 text-rose-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold">{config.enabled ? 'Habilitado' : 'Desactivado'}</span>
                  <span className="text-[9px] opacity-75">Auto-bloqueo</span>
                </button>
              </div>
            </div>
          )}

          {/* 6. BASE DE DATOS & SINCRONIZACIÓN EN LA NUBE */}
          {(activeActionCategory === 'all' || activeActionCategory === 'database') && (
            <div className="space-y-2.5">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-indigo-300">
                <Database className="w-3.5 h-3.5" />
                <span>Base de Datos Firestore & Copias de Seguridad</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                <button
                  type="button"
                  onClick={() => onSyncFirestorePresets()}
                  disabled={isSyncingPresets}
                  className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-indigo-400 ${isSyncingPresets ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="font-bold">{isSyncingPresets ? 'Guardando...' : 'Sincronizar a Firestore'}</span>
                  <span className="text-[9px] text-indigo-300/70">Guardar todos presets</span>
                </button>

                {onNavigateToDatabase && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDatabase('lockScreenMedia')}
                    className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group"
                  >
                    <Database className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Ver Colección Medios</span>
                    <span className="text-[9px] text-indigo-300/70">lockScreenMedia</span>
                  </button>
                )}

                {onNavigateToDatabase && (
                  <button
                    type="button"
                    onClick={() => onNavigateToDatabase('system')}
                    className="p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group"
                  >
                    <Database className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="font-bold">Ver Configuración</span>
                    <span className="text-[9px] text-indigo-300/70">system/lockScreenConfig</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyConfigJson}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group"
                >
                  {copiedSuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />}
                  <span className="font-bold">{copiedSuccess ? '¡Copiado!' : 'Copiar Config JSON'}</span>
                  <span className="text-[9px] text-slate-400">Al portapapeles</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadConfigJson}
                  className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group"
                >
                  <Download className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" />
                  <span className="font-bold">Descargar Respaldo</span>
                  <span className="text-[9px] text-slate-400">Archivo .json</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onApplyConfig(
                      { ...defaultLockScreenConfig, updatedAt: Date.now() },
                      '♻️ Configuración restablecida a valores de fábrica.'
                    );
                  }}
                  className="p-3 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer active:scale-95 group"
                >
                  <RotateCcw className="w-4 h-4 text-rose-400 group-hover:-rotate-90 transition-transform duration-300" />
                  <span className="font-bold">Restablecer Fábrica</span>
                  <span className="text-[9px] text-rose-400/70">Valores originales</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
