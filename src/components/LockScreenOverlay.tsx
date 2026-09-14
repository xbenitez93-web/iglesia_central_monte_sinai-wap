import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChurchConfig,
  LockScreenConfig,
  UserProfile,
  LockScreenMediaItem,
} from '../types';
import {
  THEME_COLOR_PRESETS,
  SPIRITUAL_VIDEO_PRESETS,
  SPIRITUAL_IMAGE_PRESETS,
  defaultLockScreenConfig,
} from '../data/lockScreenPresets';
import {
  getRandomBibleVerse,
  getRandomBibleVerseExcluding,
} from '../data/bibleVerses';
import {
  getDeviceMediaBlobUrl,
  getCachedDeviceMedia,
  getCachedCustomVideoPreset,
  getCustomVideoPresetUrl,
} from '../lib/deviceMediaStorage';
import {
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  Cloud,
  Database,
  ShieldCheck,
  Shuffle,
  Volume2,
  VolumeX,
  User,
  LogOut,
  AlertCircle,
  Church,
} from 'lucide-react';

interface LockScreenOverlayProps {
  config: LockScreenConfig;
  churchConfig?: ChurchConfig;
  currentUser?: UserProfile | null;
  onUnlock: () => void;
  onSwitchUser?: () => void;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({
  config = defaultLockScreenConfig,
  churchConfig,
  currentUser,
  onUnlock,
  onSwitchUser,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeVerse, setActiveVerse] = useState<string>(() => getRandomBibleVerse());
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(() => {
    // 1. Direct universal mediaUrl (/uploads/... or http...)
    if (config.mediaUrl && !config.mediaUrl.startsWith('blob:')) {
      return config.mediaUrl;
    }
    // 2. Local custom preset cache
    if (config.customVideoPresetId) {
      const cached = getCachedCustomVideoPreset(config.customVideoPresetId);
      if (cached?.url) return cached.url;
    }
    // 3. Local uploaded media cache
    const cached = getCachedDeviceMedia('eclesia_lockscreen_uploaded_media');
    if (cached) return cached.url;
    return config.mediaUrl || null;
  });
  const [isMuted, setIsMuted] = useState(config.videoMuted ?? true);
  const [logoImageError, setLogoImageError] = useState(false);
  const [isImageError, setIsImageError] = useState(false);
  const [isVideoError, setIsVideoError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset logo error when config logoUrl or church logo changes
  useEffect(() => {
    setLogoImageError(false);
  }, [config.logoUrl, churchConfig?.logoUrl]);

  // Reset image/video errors when config changes
  useEffect(() => {
    setIsImageError(false);
    setIsVideoError(false);
  }, [config.mediaUrl, config.presetVideoId, config.customVideoPresetId, config.backgroundType]);

  // Keep live time updated
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Retrieve device-uploaded video/image from universal cloud server, memory cache, IndexedDB or Firestore
  useEffect(() => {
    let active = true;

    const loadMedia = async () => {
      // 1. Direct universal mediaUrl (/uploads/... or https://...)
      if (config.mediaUrl && !config.mediaUrl.startsWith('blob:') && active) {
        setUploadedVideoUrl(config.mediaUrl);
        return;
      }

      // 2. If customVideoPresetId is specified, check custom presets vault
      if (config.customVideoPresetId) {
        const cached = getCachedCustomVideoPreset(config.customVideoPresetId);
        if (cached?.url && !cached.url.startsWith('blob:') && active) {
          setUploadedVideoUrl(cached.url);
          return;
        }
        const customUrl = await getCustomVideoPresetUrl(config.customVideoPresetId);
        if (customUrl && active) {
          setUploadedVideoUrl(customUrl);
          return;
        }
      }

      // 3. Check synchronous in-memory cache
      const cached = getCachedDeviceMedia('eclesia_lockscreen_uploaded_media');
      if (cached && active) {
        setUploadedVideoUrl(cached.url);
        return;
      }

      // 4. Query IndexedDB if video or image (for local device)
      if (config.backgroundType !== 'gradient') {
        const stored = await getDeviceMediaBlobUrl('eclesia_lockscreen_uploaded_media');
        if (active && stored?.url) {
          setUploadedVideoUrl(stored.url);
          return;
        }
      }

      // 5. Cross-device Fallback: Query Firestore lockScreenMedia collection for active cloud video
      try {
        const { getFirestoreDocs } = await import('../lib/firebase');
        const mediaDocs = await getFirestoreDocs<LockScreenMediaItem>('lockScreenMedia');
        if (active && mediaDocs && mediaDocs.length > 0) {
          // Look for item with universal URL (/uploads/ or http)
          const match = mediaDocs.find(
            (m) =>
              m.url &&
              !m.url.startsWith('blob:') &&
              ((config.mediaName && m.name === config.mediaName) ||
                (m.isActiveInLockScreen && m.type === 'video'))
          );
          if (match && match.url) {
            setUploadedVideoUrl(match.url);
            return;
          }
        }
      } catch (_) {}
    };

    loadMedia();

    return () => {
      active = false;
    };
  }, [config.mediaUrl, config.backgroundType, config.updatedAt, config.mediaName, config.customVideoPresetId]);

  // Determine active theme colors
  const themePreset = THEME_COLOR_PRESETS[config.theme] || THEME_COLOR_PRESETS.monte_sinai;

  // Active video preset for fallback poster and title
  const activeVideoPreset = React.useMemo(() => {
    // If a custom user video preset is active, do not fall back to spiritual preset poster
    if (config.customVideoPresetId) {
      return null;
    }
    if (config.presetVideoId) {
      return SPIRITUAL_VIDEO_PRESETS.find((p) => p.id === config.presetVideoId) || null;
    }
    return null;
  }, [config.presetVideoId, config.customVideoPresetId]);

  // Background video source resolution: prioritizes universal server URL first, then local blob, then spiritual preset
  const resolvedVideoUrl = React.useMemo(() => {
    if (config.backgroundType !== 'video') return '';

    // 1. Direct universal server URL (/uploads/... or http) from active config
    if (config.mediaUrl && !config.mediaUrl.startsWith('blob:')) {
      return config.mediaUrl;
    }

    // 2. Uploaded / fetched video url if not a dead blob on another device
    if (uploadedVideoUrl && !uploadedVideoUrl.startsWith('blob:')) {
      return uploadedVideoUrl;
    }

    // 3. If on the same device where the local blob exists:
    if (uploadedVideoUrl && uploadedVideoUrl.startsWith('blob:')) {
      return uploadedVideoUrl;
    }

    // 4. Custom user video preset memory cache
    if (config.customVideoPresetId) {
      const cached = getCachedCustomVideoPreset(config.customVideoPresetId);
      if (cached?.url) return cached.url;
    }

    // 5. If a spiritual system preset is explicitly chosen
    if (config.presetVideoId) {
      const preset = SPIRITUAL_VIDEO_PRESETS.find((p) => p.id === config.presetVideoId);
      if (preset) return preset.videoUrl;
    }

    // 6. Universal graceful fallback: always play the beautiful spiritual video preset rather than empty/black
    return SPIRITUAL_VIDEO_PRESETS[0].videoUrl;
  }, [
    config.backgroundType,
    config.customVideoPresetId,
    config.presetVideoId,
    uploadedVideoUrl,
    config.mediaUrl,
    config.mediaType,
  ]);

  // Background image source resolution
  const resolvedImageUrl = React.useMemo(() => {
    if (config.mediaUrl && (!config.mediaType || config.mediaType === 'image')) {
      return config.mediaUrl;
    }
    if (config.mediaType === 'image' && uploadedVideoUrl) {
      return uploadedVideoUrl;
    }
    return SPIRITUAL_IMAGE_PRESETS[0].imageUrl;
  }, [config.mediaUrl, config.mediaType, uploadedVideoUrl]);

  // User activity trigger to ensure video playback starts or resumes immediately if paused
  const handleInteractionResume = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Ensure video element plays smoothly with movement and no autoplay blocking
  useEffect(() => {
    if (config.backgroundType === 'video' && videoRef.current && resolvedVideoUrl) {
      const vid = videoRef.current;
      vid.defaultMuted = true;
      vid.muted = isMuted;
      vid.playsInline = true;
      const promise = vid.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If browser policy blocks audio playback, guarantee muted autoplay
          vid.muted = true;
          vid.play().catch(() => {});
        });
      }
    }
  }, [config.backgroundType, resolvedVideoUrl, isMuted]);

  // Logo source resolution: Lock screen specific logo || Church configuration logo
  const logoSource = config.logoUrl || churchConfig?.logoUrl;

  // Interactive Particle Canvas for Animations (Particles, Stars, Celestial Glow)
  useEffect(() => {
    if (config.animationType === 'none') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Generate celestial particles
    const particleCount = config.animationType === 'celestial_stars' ? 80 : 45;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.6 - 0.2, // rise gently upward
      alpha: Math.random() * 0.8 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.015;
        if (p.alpha < 0.1) p.alpha = 0.1;
        if (p.alpha > 0.9) p.alpha = 0.9;

        // Wrap around edges
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);

        if (config.animationType === 'celestial_stars') {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ffffff';
        } else if (config.animationType === 'aurora_waves') {
          ctx.fillStyle = `rgba(45, 212, 191, ${p.alpha * 0.7})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#14b8a6';
        } else {
          // Particles / golden celestial sparks
          ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha * 0.8})`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#f59e0b';
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [config.animationType]);

  // Handle global click or keypress to trigger unlock
  const handleScreenInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    handleInteractionResume();
    // If clicking inside the unlock form, don't close it
    if ((e.target as HTMLElement).closest('#unlock-card')) return;

    if (config.requirePasswordToUnlock) {
      setIsUnlockModalOpen(true);
      setPinError(null);
    } else {
      onUnlock();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = enteredPin.trim();

    // Verify against:
    // 1. Configured custom unlock PIN
    // 2. Master developer PIN '3755'
    // 3. Current user password
    const isCorrect =
      (config.unlockPin && entered === config.unlockPin) ||
      entered === '3755' ||
      (currentUser?.password && entered === currentUser.password);

    if (isCorrect) {
      setIsUnlockModalOpen(false);
      setEnteredPin('');
      setPinError(null);
      onUnlock();
    } else {
      setIsShaking(true);
      setPinError('Contraseña o PIN incorrecto. Intenta de nuevo.');
      setTimeout(() => setIsShaking(false), 600);
    }
  };

  const formattedTime = currentTime.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div
      id="eclesia-lock-screen"
      onClick={handleScreenInteraction}
      onMouseMove={handleInteractionResume}
      onTouchStart={handleInteractionResume}
      tabIndex={0}
      className="fixed inset-0 z-[99999] overflow-hidden bg-black text-white flex flex-col justify-between select-none cursor-pointer outline-none animate-fadeIn"
    >
      {/* 1. BACKGROUND LAYER: VIDEO, IMAGE, OR GRADIENT */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* BASE CELESTIAL ATMOSPHERE: Always rendered underneath so screen is NEVER black */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${themePreset.gradientClass} transition-all duration-700`}
          style={
            config.theme === 'custom_color' && config.primaryColor && config.secondaryColor
              ? {
                  background: `radial-gradient(ellipse at 50% 35%, ${config.primaryColor} 0%, #090d16 60%, ${config.secondaryColor} 100%)`,
                }
              : themePreset.bgStyle
          }
        />

        {/* Dynamic celestial light rays in gradient mode */}
        {config.backgroundType === 'gradient' && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />
        )}

        {/* IMAGE BACKGROUND */}
        {config.backgroundType === 'image' && (
          <div className="absolute inset-0 overflow-hidden">
            {!isImageError ? (
              <img
                src={resolvedImageUrl}
                alt="Fondo Celestial Salvapantallas"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="w-full h-full object-cover transition-opacity duration-700"
                style={{
                  filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
                }}
                onError={() => {
                  console.warn('Image failed to load, falling back to celestial theme:', resolvedImageUrl);
                  setIsImageError(true);
                }}
              />
            ) : (
              <div className="w-full h-full" style={themePreset.bgStyle} />
            )}
          </div>
        )}

        {/* VIDEO BACKGROUND */}
        {config.backgroundType === 'video' && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Fallback image poster ONLY if spiritual preset video is chosen without custom preset */}
            {!config.customVideoPresetId && config.presetVideoId && activeVideoPreset?.thumbnailUrl && (
              <img
                src={activeVideoPreset.thumbnailUrl}
                alt="Video Poster"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{
                  filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
                }}
              />
            )}
            {resolvedVideoUrl && (
              <video
                key={resolvedVideoUrl}
                ref={videoRef}
                src={resolvedVideoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                onLoadedMetadata={(e) => {
                  const vid = e.currentTarget;
                  vid.defaultMuted = true;
                  vid.muted = isMuted;
                  vid.playsInline = true;
                  vid.play().catch(() => {
                    vid.muted = true;
                    vid.play().catch(() => {});
                  });
                }}
                onCanPlay={(e) => {
                  const vid = e.currentTarget;
                  if (vid.paused) {
                    vid.muted = true;
                    vid.play().catch(() => {});
                  }
                }}
                onError={(e) => {
                  console.warn('Error loading lock screen video source:', resolvedVideoUrl, e.type);
                  setIsVideoError(true);
                }}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
                style={{
                  filter: config.blurAmount > 0 ? `blur(${config.blurAmount}px)` : undefined,
                }}
              />
            )}
          </div>
        )}

        {/* DARKENING OVERLAY FOR LEGIBILITY: Controlled, soft, never turns screen into pure black */}
        {config.backgroundType !== 'gradient' ? (
          <div
            className="absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none"
            style={{ opacity: Math.min(config.videoOpacity ?? 0.3, 0.65) }}
          />
        ) : (
          <div className="absolute inset-0 bg-slate-950/20 pointer-events-none" />
        )}

        {/* Soft Ambient Radial Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/25 to-black/60 pointer-events-none" />

        {/* Particle Canvas Layer */}
        {config.animationType !== 'none' && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
          />
        )}
      </div>

      {/* 2. TOP STATUS BAR */}
      <header className="relative z-10 p-6 sm:p-8 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center space-x-3.5">
          {(config.showChurchLogo ?? true) && (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-xl border border-white/25 p-2 flex items-center justify-center shadow-lg shadow-black/40 shrink-0 overflow-hidden">
              {logoSource && !logoImageError ? (
                <img
                  src={logoSource}
                  alt={config.customHeading || churchConfig?.name || 'Logo Iglesia'}
                  className="w-full h-full object-contain drop-shadow"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoImageError(true)}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-inner">
                  <Church className="w-6 h-6 text-amber-300 drop-shadow" />
                </div>
              )}
            </div>
          )}
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-wide flex items-center space-x-2">
              <span>{config.customHeading || churchConfig?.name || 'Iglesia Central Monte Sinaí'}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Lock className="w-2.5 h-2.5 mr-1 text-indigo-400" />
                Seguro
              </span>
            </h1>
            <p className="text-xs text-white/70">
              {config.customSubheading || churchConfig?.slogan || 'Sistema en Modo Salvapantallas & Bloqueo'}
            </p>
          </div>
        </div>

        {/* Status Badges & Video Controls */}
        <div className="flex items-center space-x-3">
          {config.backgroundType === 'video' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white/80 transition-all cursor-pointer"
              title={isMuted ? 'Activar sonido del video' : 'Silenciar video'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          )}

          {config.showSystemStatus && (
            <div className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Firebase Conectado</span>
            </div>
          )}

          {currentUser && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <span className="font-semibold">{currentUser.name}</span>
              <span className="text-[10px] text-white/60">({currentUser.role})</span>
            </div>
          )}
        </div>
      </header>

      {/* 3. CENTER: HERO CLOCK, DATE, AND INSPIRATION */}
      <main className="relative z-10 my-auto px-6 text-center flex flex-col items-center justify-center max-w-4xl mx-auto space-y-6">
        {/* Large Aesthetic Clock */}
        {config.showClock && (
          <div className="space-y-1">
            <div
              className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tight text-white drop-shadow-2xl font-mono"
              style={{ textShadow: '0 8px 32px rgba(0,0,0,0.8)' }}
            >
              {formattedTime}
            </div>

            {config.showDate && (
              <p className="text-base sm:text-xl font-medium text-indigo-200/90 capitalize tracking-wide drop-shadow-md">
                {formattedDate}
              </p>
            )}
          </div>
        )}

        {/* Inspirational Bible Verse Banner */}
        {config.showVerse && activeVerse && (
          <div className="p-4 sm:p-6 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl max-w-2xl mx-auto text-center space-y-2.5 transition-all">
            <div className="flex items-center justify-center space-x-2 text-xs font-mono uppercase tracking-widest text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Palabra Viva para el Alma</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveVerse((prev) => getRandomBibleVerseExcluding(prev));
                }}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 transition-all cursor-pointer ml-1"
                title="Siguiente versículo de bendición"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            </div>
            <p className="text-sm sm:text-base font-serif italic text-white/95 leading-relaxed">
              {activeVerse}
            </p>
          </div>
        )}

        {/* Unlock Prompt CTA */}
        <div className="pt-4">
          <div className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-md text-xs sm:text-sm font-semibold text-white shadow-xl transition-all animate-bounce duration-1000">
            <Unlock className="w-4 h-4 text-amber-400" />
            <span>
              {config.requirePasswordToUnlock
                ? 'Haz clic o toca para ingresar contraseña y desbloquear'
                : 'Toca cualquier tecla o haz clic para volver al sistema'}
            </span>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 gap-3">
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Sistema Eclesial Protegido • Bloqueo Automático por Inactividad</span>
        </div>

        <div className="flex items-center space-x-4">
          {onSwitchUser && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSwitchUser();
              }}
              className="inline-flex items-center space-x-1.5 text-xs text-white/80 hover:text-white underline cursor-pointer pointer-events-auto"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cambiar de Cuenta</span>
            </button>
          )}

          <span className="text-[11px] text-white/40">
            Tiempo de inactividad:{' '}
            {config.timeoutMinutes >= 1
              ? `${config.timeoutMinutes} min`
              : `${Math.round(config.timeoutMinutes * 60)} seg`}
          </span>
        </div>
      </footer>

      {/* 5. UNLOCK PASSWORD / PIN MODAL (IF REQUIRE PASSWORD IS ON) */}
      {isUnlockModalOpen && (
        <div
          className="fixed inset-0 z-[100000] bg-black/75 backdrop-blur-2xl flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsUnlockModalOpen(false)}
        >
          <div
            id="unlock-card"
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-white/20 shadow-2xl text-white space-y-6 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Desbloquear Pantalla</h3>
              <p className="text-xs text-slate-400">
                Ingresa la contraseña de {currentUser?.name || 'usuario'} o el PIN configurado para desbloquear.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={enteredPin}
                    onChange={(e) => {
                      setEnteredPin(e.target.value);
                      setPinError(null);
                    }}
                    placeholder="Contraseña o PIN (Ej. 3755)"
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {pinError && (
                  <p className="text-xs text-rose-400 flex items-center space-x-1 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-lg shadow-indigo-600/40 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Desbloquear</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
