import React, { useState, useEffect } from 'react';
import { parseUniversalVideo, ParsedVideoInfo } from '../lib/videoUtils';
import { Video, ExternalLink, RefreshCw, AlertCircle, Play } from 'lucide-react';

interface UniversalVideoPlayerProps {
  url?: string;
  title?: string;
  autoPlay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  className?: string;
  aspectRatio?: string;
  showBadge?: boolean;
  onLoaded?: () => void;
  onError?: (err?: any) => void;
}

export const UniversalVideoPlayer: React.FC<UniversalVideoPlayerProps> = ({
  url,
  title = 'Video',
  autoPlay = true,
  muted = false,
  controls = true,
  loop = false,
  className = '',
  aspectRatio = 'aspect-video',
  showBadge = false,
  onLoaded,
  onError,
}) => {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const videoInfo: ParsedVideoInfo = React.useMemo(() => {
    return parseUniversalVideo(url, autoPlay);
  }, [url, autoPlay]);

  useEffect(() => {
    setHasError(false);
  }, [url, retryCount]);

  const effectiveAspectRatio =
    aspectRatio === 'aspect-video' && videoInfo.isVertical
      ? 'aspect-[9/16] max-h-[580px] max-w-sm mx-auto'
      : aspectRatio;

  if (!url || !url.trim() || !videoInfo.isValid) {
    return (
      <div
        className={`w-full ${effectiveAspectRatio} rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center p-4 text-center space-y-2 ${className}`}
      >
        <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
          <Video className="w-5 h-5" />
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-xs">
          {url ? 'El enlace ingresado no es válido o está vacío.' : 'Ingresa una URL de video para ver la reproducción en vivo.'}
        </p>
      </div>
    );
  }

  // Get badge styling based on platform
  const getBadgeStyle = () => {
    switch (videoInfo.platform) {
      case 'youtube':
        return 'bg-red-600 text-white border-red-500/40';
      case 'facebook':
        return 'bg-[#1877F2] text-white border-blue-400/40';
      case 'tiktok':
        return 'bg-black text-cyan-300 border-pink-500/50';
      case 'instagram':
        return 'bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 text-white border-white/20';
      case 'vimeo':
        return 'bg-sky-500 text-white border-sky-400/40';
      case 'drive':
        return 'bg-emerald-600 text-white border-emerald-400/40';
      default:
        return 'bg-slate-800 text-slate-200 border-white/20';
    }
  };

  return (
    <div className={`relative w-full ${effectiveAspectRatio} rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner group ${className}`}>
      {/* Platform Badge (optional) */}
      {showBadge && (
        <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
          <span className={`px-2.5 py-0.5 rounded-md backdrop-blur-sm border text-[10px] font-bold shadow-sm flex items-center space-x-1.5 ${getBadgeStyle()}`}>
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>{videoInfo.platformLabel}</span>
          </span>
        </div>
      )}

      {/* External Link quick shortcut button - visible on mobile and desktop */}
      <a
        href={videoInfo.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Abrir video original en ${videoInfo.platformLabel}`}
        className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white/90 hover:text-white text-[11px] font-bold backdrop-blur-md transition-all flex items-center space-x-1 shadow-md border border-white/10 cursor-pointer"
      >
        <span>Abrir en {videoInfo.platform === 'facebook' ? 'Facebook' : videoInfo.platform === 'tiktok' ? 'TikTok' : videoInfo.platform === 'instagram' ? 'Instagram' : 'fuente'}</span>
        <ExternalLink className="w-3 h-3" />
      </a>

      {/* RENDER IFRAME (YouTube, Facebook, TikTok, Instagram, Vimeo, Google Drive, Dailymotion, Loom) */}
      {videoInfo.isIframe && !hasError ? (
        <iframe
          key={`${videoInfo.embedUrl}_${retryCount}`}
          src={videoInfo.embedUrl}
          title={title}
          className="w-full h-full border-0 absolute inset-0 bg-black"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => onLoaded?.()}
          onError={(e) => {
            console.warn('Error loading iframe video embed:', e);
            setHasError(true);
            onError?.(e);
          }}
        />
      ) : !hasError ? (
        /* RENDER DIRECT HTML5 VIDEO (MP4, WebM, MOV, Cloud Storage, Dropbox) */
        <video
          key={`${videoInfo.directVideoUrl || videoInfo.originalUrl}_${retryCount}`}
          src={videoInfo.directVideoUrl || videoInfo.originalUrl}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          preload="auto"
          className="w-full h-full object-contain absolute inset-0 bg-black"
          onLoadedData={() => onLoaded?.()}
          onError={(e) => {
            console.warn('Error loading direct video element:', e);
            setHasError(true);
            onError?.(e);
          }}
        >
          Tu navegador no soporta la reproducción directa de este video.
        </video>
      ) : (
        /* ERROR FALLBACK */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90 text-white">
          <AlertCircle className="w-10 h-10 text-amber-400" />
          <div>
            <h4 className="font-bold text-sm text-slate-200">No se pudo cargar el reproductor integrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Es posible que el proveedor requiera abrirse directamente o tenga restricciones de inserción.
            </p>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </button>
            <a
              href={videoInfo.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white flex items-center space-x-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <span>Abrir enlace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
