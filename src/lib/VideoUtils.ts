/**
 * Utilidades universales para procesamiento y reproducción de videos
 * Soporta YouTube (normal, shorts, live, embed, youtu.be), Vimeo, Google Drive,
 * Dailymotion, Loom, Facebook, Dropbox, y archivos de video directos (MP4, WebM, MOV, etc.).
 */

export type VideoPlatform =
  | 'youtube'
  | 'vimeo'
  | 'drive'
  | 'dailymotion'
  | 'loom'
  | 'facebook'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'direct'
  | 'unknown';

export interface ParsedVideoInfo {
  platform: VideoPlatform;
  platformLabel: string;
  originalUrl: string;
  canonicalUrl?: string;
  videoId?: string;
  embedUrl: string;
  directVideoUrl?: string;
  thumbnailUrl?: string;
  isIframe: boolean;
  isVertical?: boolean;
  isShareLink?: boolean;
  warning?: string;
  isValid: boolean;
}

/**
 * Extrae el ID de un video de YouTube a partir de cualquier enlace o formato
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Raw 11 characters ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // youtu.be/ID
  const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch) return shortMatch[1];

  // youtube.com/shorts/ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch) return shortsMatch[1];

  // youtube.com/live/ID
  const liveMatch = trimmed.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/i);
  if (liveMatch) return liveMatch[1];

  // youtube.com/embed/ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i);
  if (embedMatch) return embedMatch[1];

  // youtube.com/watch?v=ID or &v=ID
  const watchMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/i);
  if (watchMatch) return watchMatch[1];

  // Regexp general para otros formatos
  const generalMatch = trimmed.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/i);
  if (generalMatch) return generalMatch[1];

  return null;
}

/**
 * Extrae el ID de un video de Vimeo
 */
export function extractVimeoId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:vimeo\.com\/(?:video\/)?|player\.vimeo\.com\/video\/)(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extrae el ID de un archivo de video en Google Drive
 */
export function extractGoogleDriveId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // drive.google.com/file/d/ID/...
  const matchD = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchD) return matchD[1];

  // drive.google.com/open?id=ID
  const matchId = trimmed.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchId) return matchId[1];

  return null;
}

/**
 * Extrae ID de Dailymotion
 */
export function extractDailymotionId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Extrae ID de Loom
 */
export function extractLoomId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9_-]+)/i);
  return match ? match[1] : null;
}

/**
 * Extrae el identificador numérico o alfanumérico de un video de TikTok
 */
export function extractTikTokId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Si son puros dígitos (15 a 22 números)
  if (/^\d{15,22}$/.test(trimmed)) {
    return trimmed;
  }

  // /video/(\d+)
  const videoMatch = trimmed.match(/\/video\/(\d{15,22})/i);
  if (videoMatch) return videoMatch[1];

  // /v/(\d+)
  const vMatch = trimmed.match(/\/v\/(\d{15,22})/i);
  if (vMatch) return vMatch[1];

  // /embed/v2/(\d+) o /embed/(\d+) o /player/v1/(\d+)
  const embedMatch = trimmed.match(/\/(?:embed(?:\/v2)?|player\/v1)\/(\d{15,22})/i);
  if (embedMatch) return embedMatch[1];

  // Secuencia de números larga dentro de un enlace de tiktok (ID numérico estándar de 17-21 dígitos)
  if (trimmed.includes('tiktok.com')) {
    const generalDigits = trimmed.match(/(\d{17,21})/);
    if (generalDigits) return generalDigits[1];
  }

  // vm.tiktok.com/CODE o vt.tiktok.com/CODE o tiktok.com/t/CODE (código corto alfanumérico)
  const shortMatch = trimmed.match(/(?:vm\.tiktok\.com|vt\.tiktok\.com|tiktok\.com\/t)\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) return shortMatch[1];

  return null;
}

/**
 * Extrae el código corto (shortcode) de un Reel, publicación o IGTV de Instagram
 */
export function extractInstagramCode(url?: string): { code: string; isReel: boolean } | null {
  if (!url) return null;
  const trimmed = url.trim();

  // instagram.com/reel/CODE o instagram.com/reels/CODE
  const reelMatch = trimmed.match(/(?:instagram\.com|instagr\.am)\/reels?\/([a-zA-Z0-9_-]+)/i);
  if (reelMatch) {
    return { code: reelMatch[1], isReel: true };
  }

  // instagram.com/p/CODE o instagram.com/tv/CODE
  const postMatch = trimmed.match(/(?:instagram\.com|instagr\.am)\/(?:p|tv)\/([a-zA-Z0-9_-]+)/i);
  if (postMatch) {
    return { code: postMatch[1], isReel: false };
  }

  return null;
}

/**
 * Extrae el ID de un Tweet / Publicación en X (Twitter)
 */
export function extractTwitterInfo(url?: string): { tweetId: string } | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('twitter.com') && !trimmed.includes('x.com')) {
    return null;
  }
  const match = trimmed.match(/(?:twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/status\/(\d+)/i);
  if (match) {
    return { tweetId: match[1] };
  }
  const directDigits = trimmed.match(/\/status\/(\d+)/i);
  if (directDigits) {
    return { tweetId: directDigits[1] };
  }
  return null;
}

export interface FacebookInfo {
  isReel: boolean;
  videoId?: string;
  isShareLink?: boolean;
  canonicalUrl?: string;
}

/**
 * Extrae información de video de Facebook (watch, video regular, reel o enlace corto de app)
 */
export function extractFacebookInfo(url?: string): FacebookInfo | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('facebook.com') && !trimmed.includes('fb.watch')) {
    return null;
  }

  const isReel = trimmed.includes('/reel') || trimmed.includes('/share/r/');
  const isShareLink = trimmed.includes('/share/v/') || trimmed.includes('/share/r/') || trimmed.includes('fb.watch');

  // ?v=ID o &v=ID
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
  if (vMatch) {
    return {
      isReel,
      videoId: vMatch[1],
      isShareLink: false,
      canonicalUrl: `https://www.facebook.com/watch/?v=${vMatch[1]}`,
    };
  }

  // /videos/ID
  const videosMatch = trimmed.match(/\/videos\/([a-zA-Z0-9_-]+)/i);
  if (videosMatch) {
    return {
      isReel,
      videoId: videosMatch[1],
      isShareLink: false,
      canonicalUrl: `https://www.facebook.com/watch/?v=${videosMatch[1]}`,
    };
  }

  // /reel/ID
  const reelMatch = trimmed.match(/\/reel\/([a-zA-Z0-9_-]+)/i);
  if (reelMatch) {
    return {
      isReel: true,
      videoId: reelMatch[1],
      isShareLink: false,
      canonicalUrl: `https://www.facebook.com/reel/${reelMatch[1]}`,
    };
  }

  // /share/v/TOKEN o /share/r/TOKEN
  const shareMatch = trimmed.match(/\/share\/([vr])\/([a-zA-Z0-9_-]+)/i);
  if (shareMatch) {
    const typeLetter = shareMatch[1].toLowerCase();
    const token = shareMatch[2];
    const reel = typeLetter === 'r';
    return {
      isReel: reel,
      videoId: token,
      isShareLink: true,
      canonicalUrl: reel
        ? `https://www.facebook.com/reel/${token}`
        : `https://www.facebook.com/watch/?v=${token}`,
    };
  }

  // fb.watch/TOKEN
  const fbWatchMatch = trimmed.match(/fb\.watch\/([a-zA-Z0-9_-]+)/i);
  if (fbWatchMatch) {
    const token = fbWatchMatch[1];
    return {
      isReel: false,
      videoId: token,
      isShareLink: true,
      canonicalUrl: `https://www.facebook.com/watch/?v=${token}`,
    };
  }

  return {
    isReel,
    isShareLink,
    canonicalUrl: isReel ? `https://www.facebook.com/reel` : `https://www.facebook.com/watch`,
  };
}

/**
 * Comprueba si una URL apunta directamente a un archivo de video multimedia (MP4, WebM, MOV, etc.)
 */
export function isDirectVideoFile(url?: string): boolean {
  if (!url) return false;
  const clean = url.trim().toLowerCase();

  // Blob o base64
  if (clean.startsWith('blob:') || clean.startsWith('data:video/')) {
    return true;
  }

  // Extensiones típicas de video
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.ogv', '.mkv', '.avi'];
  const hasExt = videoExtensions.some((ext) => clean.includes(ext));
  if (hasExt) return true;

  // CDNs o buckets comunes con video
  if (clean.includes('commondatastorage.googleapis.com') || clean.includes('/uploads/video_')) {
    return true;
  }

  return false;
}

/**
 * Analiza de forma universal cualquier URL de video y genera la configuración óptima para reproducirlo.
 */
export function parseUniversalVideo(url?: string, autoplay = true): ParsedVideoInfo {
  if (!url || !url.trim()) {
    return {
      platform: 'unknown',
      platformLabel: 'Sin URL',
      originalUrl: '',
      embedUrl: '',
      isIframe: false,
      isValid: false,
    };
  }

  const clean = url.trim();

  // 1. YouTube
  const ytId = extractYouTubeId(clean);
  if (ytId) {
    const autoplayParam = autoplay ? 'autoplay=1&' : '';
    return {
      platform: 'youtube',
      platformLabel: 'YouTube',
      originalUrl: clean,
      videoId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?${autoplayParam}rel=0&playsinline=1`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      isIframe: true,
      isValid: true,
    };
  }

  // 2. Vimeo
  const vimeoId = extractVimeoId(clean);
  if (vimeoId) {
    const autoplayParam = autoplay ? '?autoplay=1' : '';
    return {
      platform: 'vimeo',
      platformLabel: 'Vimeo',
      originalUrl: clean,
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}${autoplayParam}`,
      isIframe: true,
      isValid: true,
    };
  }

  // 3. Google Drive
  const driveId = extractGoogleDriveId(clean);
  if (driveId) {
    return {
      platform: 'drive',
      platformLabel: 'Google Drive',
      originalUrl: clean,
      videoId: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      isIframe: true,
      isValid: true,
    };
  }

  // 4. Dailymotion
  const dailyId = extractDailymotionId(clean);
  if (dailyId) {
    const autoplayParam = autoplay ? '?autoplay=1' : '';
    return {
      platform: 'dailymotion',
      platformLabel: 'Dailymotion',
      originalUrl: clean,
      videoId: dailyId,
      embedUrl: `https://www.dailymotion.com/embed/video/${dailyId}${autoplayParam}`,
      thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${dailyId}`,
      isIframe: true,
      isValid: true,
    };
  }

  // 5. Loom
  const loomId = extractLoomId(clean);
  if (loomId) {
    const autoplayParam = autoplay ? '?autoplay=1' : '';
    return {
      platform: 'loom',
      platformLabel: 'Loom',
      originalUrl: clean,
      videoId: loomId,
      embedUrl: `https://www.loom.com/embed/${loomId}${autoplayParam}`,
      isIframe: true,
      isValid: true,
    };
  }

  // 6. Facebook Video & Reel
  if (clean.includes('facebook.com') || clean.includes('fb.watch')) {
    const fbInfo = extractFacebookInfo(clean);
    const isReel = fbInfo?.isReel || clean.includes('/reel') || clean.includes('/share/r/');
    const isShareLink = fbInfo?.isShareLink || clean.includes('/share/v/') || clean.includes('/share/r/') || clean.includes('fb.watch');
    const targetUrl = fbInfo?.canonicalUrl || clean;
    const autoplayParam = autoplay ? '&autoplay=1' : '';
    return {
      platform: 'facebook',
      platformLabel: isReel ? 'Facebook Reel' : 'Facebook Video',
      originalUrl: clean,
      canonicalUrl: fbInfo?.canonicalUrl || clean,
      videoId: fbInfo?.videoId,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetUrl)}&show_text=0${autoplayParam}`,
      isIframe: true,
      isVertical: isReel,
      isShareLink,
      isValid: true,
    };
  }

  // 7. TikTok Video (Reproductor oficial moderno HTML5 Player v1 de TikTok)
  if (clean.includes('tiktok.com')) {
    const tikTokId = extractTikTokId(clean);
    // Si el ID es puramente numérico se utiliza el reproductor de alto rendimiento v1
    const isNumericId = tikTokId && /^\d{15,22}$/.test(tikTokId);
    const embedUrl = isNumericId
      ? `https://www.tiktok.com/player/v1/${tikTokId}?autoplay=${autoplay ? 1 : 0}&music_info=1&description=1`
      : tikTokId
      ? `https://www.tiktok.com/player/v1/${tikTokId}?autoplay=${autoplay ? 1 : 0}`
      : `https://www.tiktok.com/player/v1/?url=${encodeURIComponent(clean)}`;

    return {
      platform: 'tiktok',
      platformLabel: 'TikTok Video',
      originalUrl: clean,
      canonicalUrl: isNumericId ? `https://www.tiktok.com/@video/video/${tikTokId}` : clean,
      videoId: tikTokId || undefined,
      embedUrl,
      isIframe: true,
      isVertical: true,
      isValid: true,
    };
  }

  // 8. Instagram Video / Reel
  if (clean.includes('instagram.com') || clean.includes('instagr.am')) {
    const igInfo = extractInstagramCode(clean);
    const code = igInfo ? igInfo.code : '';
    const isReel = igInfo ? igInfo.isReel : clean.includes('/reel');
    const embedUrl = code
      ? `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${code}/embed`
      : clean.endsWith('/embed')
        ? clean
        : `${clean.split('?')[0].replace(/\/$/, '')}/embed`;

    return {
      platform: 'instagram',
      platformLabel: isReel ? 'Instagram Reel' : 'Instagram Video',
      originalUrl: clean,
      canonicalUrl: code ? `https://www.instagram.com/${isReel ? 'reel' : 'p'}/${code}/` : clean,
      videoId: code || undefined,
      embedUrl,
      isIframe: true,
      isVertical: isReel,
      isValid: true,
    };
  }

  // 9. Twitter / X Video
  if (clean.includes('twitter.com') || clean.includes('x.com')) {
    const twInfo = extractTwitterInfo(clean);
    const tweetId = twInfo?.tweetId;
    return {
      platform: 'twitter',
      platformLabel: 'X / Twitter Video',
      originalUrl: clean,
      canonicalUrl: tweetId ? `https://twitter.com/i/status/${tweetId}` : clean,
      videoId: tweetId,
      embedUrl: tweetId
        ? `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}`
        : clean,
      isIframe: true,
      isValid: true,
    };
  }

  // 10. Dropbox direct link (replaces dl=0 or dl=1 with raw=1)
  if (clean.includes('dropbox.com')) {
    const rawDropbox = clean.replace(/([?&])dl=[01]/i, '$1raw=1').replace(/([^?&]+)$/, (m) => (m.includes('raw=1') ? m : `${m}?raw=1`));
    return {
      platform: 'direct',
      platformLabel: 'Dropbox Video',
      originalUrl: clean,
      embedUrl: rawDropbox,
      directVideoUrl: rawDropbox,
      isIframe: false,
      isValid: true,
    };
  }

  // 11. Direct Video File (MP4, WebM, MOV, etc.)
  if (isDirectVideoFile(clean)) {
    return {
      platform: 'direct',
      platformLabel: 'Video Directo (MP4/WebM)',
      originalUrl: clean,
      embedUrl: clean,
      directVideoUrl: clean,
      isIframe: false,
      isValid: true,
    };
  }

  // 12. Generic Embed or Unknown Web URL
  // Si la URL ya contiene /embed/ o /player, se presume iframe
  const seemsEmbed = clean.includes('/embed/') || clean.includes('/player') || clean.includes('player.');
  return {
    platform: seemsEmbed ? 'direct' : 'unknown',
    platformLabel: seemsEmbed ? 'Reproductor Embebido' : 'Enlace Web / Video',
    originalUrl: clean,
    embedUrl: clean,
    directVideoUrl: clean,
    isIframe: seemsEmbed,
    isValid: clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('blob:'),
  };
}

/**
 * Resuelve de forma asíncrona mediante el backend una URL de red social
 * (obtiene el enlace canónico, título descriptivo y miniatura de alta resolución)
 */
export async function resolveUniversalMediaUrl(url: string): Promise<{
  canonicalUrl: string;
  title: string;
  thumbnailUrl: string;
  platform: string;
  directVideoUrl?: string;
  videoId?: string;
  isReel?: boolean;
}> {
  const fallback = parseUniversalVideo(url);
  try {
    const response = await fetch('/api/media/resolve-social-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          canonicalUrl: data.canonicalUrl || fallback.canonicalUrl || url,
          title: data.title || fallback.platformLabel,
          thumbnailUrl: data.thumbnailUrl || fallback.thumbnailUrl || '',
          platform: data.platform || fallback.platform,
          directVideoUrl: data.directVideoUrl || fallback.directVideoUrl,
          videoId: data.videoId || fallback.videoId,
          isReel: data.isReel ?? fallback.isVertical,
        };
      }
    }
  } catch (err) {
    console.warn('[resolveUniversalMediaUrl] Fallo al consultar servidor, usando resolución local:', err);
  }

  return {
    canonicalUrl: fallback.canonicalUrl || url,
    title: fallback.platformLabel,
    thumbnailUrl: fallback.thumbnailUrl || '',
    platform: fallback.platform,
    directVideoUrl: fallback.directVideoUrl,
    videoId: fallback.videoId,
    isReel: fallback.isVertical,
  };
}

/**
 * Retorna la URL de fondo optimizada para salvapantallas / proyector en bucle con soporte de audio o silenciado
 */
export function getBackgroundLoopVideoUrl(url?: string, muted = true): { url: string; isIframe: boolean } {
  if (!url) return { url: '', isIframe: false };
  const info = parseUniversalVideo(url, true);

  if (info.platform === 'youtube' && info.videoId) {
    const muteParam = muted ? 'mute=1' : 'mute=0';
    const originParam = typeof window !== 'undefined' && window.location.origin
      ? `&origin=${encodeURIComponent(window.location.origin)}`
      : '';
    return {
      url: `https://www.youtube-nocookie.com/embed/${info.videoId}?autoplay=1&${muteParam}&controls=0&loop=1&playlist=${info.videoId}&playsinline=1&modestbranding=1&enablejsapi=1${originParam}`,
      isIframe: true,
    };
  }

  if (info.platform === 'vimeo' && info.videoId) {
    const muteParam = muted ? 'muted=1&background=1' : 'muted=0';
    return {
      url: `https://player.vimeo.com/video/${info.videoId}?autoplay=1&${muteParam}&loop=1&api=1`,
      isIframe: true,
    };
  }

  if (info.platform === 'drive' && info.videoId) {
    return {
      url: `https://drive.google.com/file/d/${info.videoId}/preview`,
      isIframe: true,
    };
  }

  if (info.platform === 'facebook') {
    const targetUrl = info.canonicalUrl || info.originalUrl;
    const muteParam = muted ? 'mute=1' : 'mute=0';
    return {
      url: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(targetUrl)}&autoplay=1&${muteParam}&controls=0&show_text=0`,
      isIframe: true,
    };
  }

  if (info.platform === 'tiktok' && info.videoId) {
    const isNumericId = /^\d{15,22}$/.test(info.videoId);
    return {
      url: isNumericId
        ? `https://www.tiktok.com/player/v1/${info.videoId}?autoplay=1&description=0&music_info=0`
        : `https://www.tiktok.com/player/v1/${info.videoId}?autoplay=1`,
      isIframe: true,
    };
  }

  if (info.platform === 'instagram') {
    return {
      url: info.embedUrl,
      isIframe: true,
    };
  }

  if (info.platform === 'twitter' && info.videoId) {
    return {
      url: `https://platform.twitter.com/embed/Tweet.html?id=${info.videoId}`,
      isIframe: true,
    };
  }

  return {
    url: info.directVideoUrl || info.embedUrl || url,
    isIframe: info.isIframe,
  };
}
