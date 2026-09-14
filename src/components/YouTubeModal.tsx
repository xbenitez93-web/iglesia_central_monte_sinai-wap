import React from 'react';
import { X, ExternalLink, Play, Video, HelpCircle } from 'lucide-react';

interface YouTubeModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl?: string;
  title: string;
  subtitle?: string;
  notes?: string;
}

export function getYouTubeVideoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  
  // Format: youtu.be/ID (handling optional query params like ?si=...)
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];

  // Format: youtube.com/watch?v=ID or m.youtube.com/watch?v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Format: youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Format: youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Format: youtube.com/live/ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch) return liveMatch[1];

  // Raw 11 char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export const YouTubeModal: React.FC<YouTubeModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  title,
  subtitle,
  notes,
}) => {
  if (!isOpen) return null;

  const videoId = getYouTubeVideoId(videoUrl);
  const directLink = videoUrl && (videoUrl.startsWith('http://') || videoUrl.startsWith('https://'))
    ? videoUrl
    : videoId
      ? `https://www.youtube.com/watch?v=${videoId}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' ' + (subtitle || ''))}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-sm">
              <Play className="w-5 h-5 fill-red-500" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug line-clamp-1">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400 line-clamp-1">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player or Fallback */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {videoId ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-inner">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
                title={title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <Video className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">Video de Referencia para Ensayo</h4>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  {videoUrl
                    ? 'El enlace provisto no tiene formato estándar de YouTube embebido. Puedes abrirlo directamente con el botón de abajo.'
                    : 'Aún no se ha asignado un enlace de video directo. Puedes buscar guías y tutoriales en YouTube con un clic.'}
                </p>
              </div>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors shadow-lg shadow-red-600/30"
              >
                <span>{videoUrl ? 'Abrir enlace en YouTube' : 'Buscar video guía en YouTube'}</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* Notes or instructions */}
          {notes && (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 text-xs sm:text-sm text-slate-300">
              <div className="flex items-center space-x-2 text-slate-400 font-semibold mb-1">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                <span>Instrucciones / Notas para el ensayo:</span>
              </div>
              <p className="whitespace-pre-line text-slate-300">{notes}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <a
              href={directLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-xs sm:text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              <span>Ver en aplicación / web de YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors ml-auto"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
