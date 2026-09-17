import { CustomUserVideoPreset } from '../types';

// Zero-dependency IndexedDB storage helper for device-uploaded videos and background photos
const DB_NAME = 'eclesia_media_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'lockscreen_media';
const CUSTOM_PRESETS_META_KEY = 'eclesia_custom_video_presets_v1';

// In-memory cache for ultra-fast, zero-lag synchronous access during active session
let activeMemoryMediaCache: { key: string; url: string; name: string; type: string } | null = null;
const customVideoPresetsCache = new Map<string, { url: string; name: string; type: string }>();

function getLocalPresetsMetaList(): CustomUserVideoPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];import { CustomUserVideoPreset } from '../types';

// Zero-dependency IndexedDB storage helper for device-uploaded videos and background photos
const DB_NAME = 'eclesia_media_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'lockscreen_media';
const CUSTOM_PRESETS_META_KEY = 'eclesia_custom_video_presets_v1';

// In-memory cache for ultra-fast, zero-lag synchronous access during active session
let activeMemoryMediaCache: { key: string; url: string; name: string; type: string } | null = null;
const customVideoPresetsCache = new Map<string, { url: string; name: string; type: string }>();

export function getLocalPresetsMetaList(): CustomUserVideoPreset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function saveLocalPresetsMetaList(list: CustomUserVideoPreset[]): void {
  try {
    // Exclude dynamic blob object URLs before storing to localStorage, but keep serverUrl
    const metaOnly = list.map(({ id, name, blobKey, size, type, createdAt, serverUrl }) => ({
      id,
      name,
      blobKey,
      size,
      type,
      createdAt,
      serverUrl,
    }));
    localStorage.setItem(CUSTOM_PRESETS_META_KEY, JSON.stringify(metaOnly));
  } catch (e) {
    console.warn('Error saving custom presets meta:', e);
  }
}

export function getCachedDeviceMedia(key = 'eclesia_lockscreen_uploaded_media'): { url: string; name: string; type: string } | null {
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    return activeMemoryMediaCache;
  }
  return null;
}

export function getCachedCustomVideoPreset(presetId: string): { url: string; name: string; type: string } | null {
  return customVideoPresetsCache.get(presetId) || null;
}

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un archivo de video o foto subido desde el dispositivo en IndexedDB.
 */
export async function saveDeviceMediaBlob(
  key: string,
  blobOrFile: Blob | File,
  meta?: { name?: string; type?: string; size?: number }
): Promise<string> {
  // Create object URL and store in active memory cache immediately
  const objectUrl = URL.createObjectURL(blobOrFile);
  activeMemoryMediaCache = {
    key,
    url: objectUrl,
    name: meta?.name || (blobOrFile instanceof File ? blobOrFile.name : 'archivo_subido'),
    type: meta?.type || blobOrFile.type || (blobOrFile instanceof File && blobOrFile.name.endsWith('.mp4') ? 'video/mp4' : ''),
  };

  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const payload = {
      blob: blobOrFile,
      name: activeMemoryMediaCache!.name,
      type: activeMemoryMediaCache!.type,
      size: meta?.size || blobOrFile.size,
      updatedAt: Date.now(),
    };

    const request = store.put(payload, key);
    request.onsuccess = () => resolve(objectUrl);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un nuevo preset de video personalizado subido por el usuario.
 */
export async function saveCustomUserVideoPreset(
  file: File,
  customName?: string
): Promise<CustomUserVideoPreset> {
  const id = `uvp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const blobKey = `eclesia_uvp_${id}`;
  const name = customName?.trim() || file.name;
  const objectUrl = URL.createObjectURL(file);
  const type = file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'video/webm');

  // Store in memory cache
  customVideoPresetsCache.set(id, {
    url: objectUrl,
    name,
    type,
  });

  // Also update legacy single-media cache
  activeMemoryMediaCache = {
    key: 'eclesia_lockscreen_uploaded_media',
    url: objectUrl,
    name,
    type,
  };

  // Save in IndexedDB
  const db = await openMediaDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const payload = {
      blob: file,
      name,
      type,
      size: file.size,
      updatedAt: Date.now(),
    };
    const req = store.put(payload, blobKey);
    // Also save legacy key for backward compatibility
    store.put(payload, 'eclesia_lockscreen_uploaded_media');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Save metadata in localStorage
  const existingList = getLocalPresetsMetaList();
  const newPreset: CustomUserVideoPreset = {
    id,
    name,
    blobKey,
    size: file.size,
    type,
    createdAt: Date.now(),
    url: objectUrl,
  };
  const updatedList = [newPreset, ...existingList.filter((p) => p.id !== id)];
  saveLocalPresetsMetaList(updatedList);

  return newPreset;
}

/**
 * Guarda un nuevo preset de video mediante URL externa/remota para sincronización multi-dispositivo.
 */
export async function saveCustomUserVideoPresetFromUrl(
  url: string,
  customName?: string,
  thumbnailUrl?: string
): Promise<CustomUserVideoPreset> {
  const id = `uvp_url_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const cleanUrl = url.trim();
  const name = customName?.trim() || 'Video en Línea';
  const type = cleanUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4';

  // Store in memory cache
  customVideoPresetsCache.set(id, {
    url: cleanUrl,
    name,
    type,
  });

  // Save in local presets metadata list
  const existingList = getLocalPresetsMetaList();
  const newPreset: CustomUserVideoPreset = {
    id,
    name,
    blobKey: '',
    type,
    createdAt: Date.now(),
    url: cleanUrl,
    serverUrl: cleanUrl,
    thumbnailUrl: thumbnailUrl || '',
  };

  const updatedList = [newPreset, ...existingList.filter((p) => p.id !== id)];
  saveLocalPresetsMetaList(updatedList);

  return newPreset;
}

/**
 * Obtiene todos los presets de video personalizados subidos por el usuario con Object URLs listas.
 */
export async function getCustomUserVideoPresets(): Promise<CustomUserVideoPreset[]> {
  const list = getLocalPresetsMetaList();
  const db = await openMediaDB().catch(() => null);

  // If list is empty, check for legacy uploaded video
  if (list.length === 0 && db) {
    const legacyItem = await getDeviceMediaBlobUrl('eclesia_lockscreen_uploaded_media');
    if (legacyItem && legacyItem.url) {
      const legacyPreset: CustomUserVideoPreset = {
        id: 'uvp_legacy',
        name: legacyItem.name || 'Mi Video Subido',
        blobKey: 'eclesia_lockscreen_uploaded_media',
        type: legacyItem.type || 'video/mp4',
        createdAt: Date.now(),
        url: legacyItem.url,
      };
      customVideoPresetsCache.set('uvp_legacy', legacyItem);
      saveLocalPresetsMetaList([legacyPreset]);
      return [legacyPreset];
    }
  }

  const resolvedList: CustomUserVideoPreset[] = [];

  for (const item of list) {
    // 0. Direct web URL or server URL (Universal for all devices)
    if (item.url && (item.url.startsWith('http://') || item.url.startsWith('https://') || item.url.startsWith('/'))) {
      customVideoPresetsCache.set(item.id, {
        url: item.url,
        name: item.name,
        type: item.type || 'video/mp4',
      });
      resolvedList.push(item);
      continue;
    }

    if (item.serverUrl && (item.serverUrl.startsWith('http://') || item.serverUrl.startsWith('https://') || item.serverUrl.startsWith('/'))) {
      customVideoPresetsCache.set(item.id, {
        url: item.serverUrl,
        name: item.name,
        type: item.type || 'video/mp4',
      });
      resolvedList.push({ ...item, url: item.serverUrl });
      continue;
    }

    // 1. Check memory cache
    const cached = customVideoPresetsCache.get(item.id);
    if (cached) {
      resolvedList.push({ ...item, url: cached.url });
      continue;
    }

    // 2. Query IndexedDB
    if (db) {
      try {
        const itemBlob = await new Promise<Blob | null>((resolve) => {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const req = store.get(item.blobKey);
          req.onsuccess = () => resolve(req.result?.blob || null);
          req.onerror = () => resolve(null);
        });

        if (itemBlob) {
          const url = URL.createObjectURL(itemBlob);
          customVideoPresetsCache.set(item.id, {
            url,
            name: item.name,
            type: item.type || 'video/mp4',
          });
          resolvedList.push({ ...item, url });
          continue;
        }
      } catch (err) {
        console.warn('Error reading custom preset blob:', err);
      }
    }

    resolvedList.push({
      ...item,
      url: item.serverUrl || item.url,
    });
  }

  return resolvedList;
}

/**
 * Elimina un preset de video personalizado subido por el usuario.
 */
export async function deleteCustomUserVideoPreset(presetId: string): Promise<void> {
  const idsToClean = Array.from(new Set([
    presetId,
    presetId.startsWith('media_vid_') ? presetId.replace('media_vid_', '') : `media_vid_${presetId}`,
  ]));

  for (const id of idsToClean) {
    const cached = customVideoPresetsCache.get(id);
    if (cached) {
      try {
        URL.revokeObjectURL(cached.url);
      } catch (_) {}
      customVideoPresetsCache.delete(id);
    }
  }

  const list = getLocalPresetsMetaList();
  const targets = list.filter((p) => idsToClean.includes(p.id));
  const updatedList = list.filter((p) => !idsToClean.includes(p.id));
  saveLocalPresetsMetaList(updatedList);

  for (const target of targets) {
    if (target.blobKey) {
      try {
        const db = await openMediaDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(target.blobKey);
      } catch (e) {
        console.warn('Error deleting preset blob:', e);
      }
    }
  }
}

/**
 * Renombra un preset de video personalizado.
 */
export function renameCustomUserVideoPreset(presetId: string, newName: string): void {
  const list = getLocalPresetsMetaList();
  const updatedList = list.map((p) => (p.id === presetId ? { ...p, name: newName } : p));
  saveLocalPresetsMetaList(updatedList);

  const cached = customVideoPresetsCache.get(presetId);
  if (cached) {
    cached.name = newName;
  }
}

/**
 * Obtiene la URL de reproducción para un preset de video personalizado.
 */
export async function getCustomVideoPresetUrl(presetId: string): Promise<string | null> {
  const cached = customVideoPresetsCache.get(presetId);
  if (cached) return cached.url;

  const presets = await getCustomUserVideoPresets();
  const match = presets.find((p) => p.id === presetId);
  return match?.url || null;
}

/**
 * Recupera un archivo de video o foto de IndexedDB y genera un Object URL listo para reproducir.
 */
export async function getDeviceMediaBlobUrl(
  key: string
): Promise<{ url: string; name: string; type: string } | null> {
  // If already in memory cache, return immediately
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    return activeMemoryMediaCache;
  }

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const res = request.result;
        if (res && res.blob) {
          const url = URL.createObjectURL(res.blob);
          const cached = { url, name: res.name || '', type: res.type || '' };
          activeMemoryMediaCache = { key, ...cached };
          resolve(cached);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Error recuperando media de IndexedDB:', e);
    return null;
  }
}

/**
 * Elimina el archivo de video o foto de IndexedDB
 */
export async function deleteDeviceMediaBlob(key: string): Promise<void> {
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    try {
      URL.revokeObjectURL(activeMemoryMediaCache.url);
    } catch (_) {}
    activeMemoryMediaCache = null;
  }

  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Error borrando media de IndexedDB:', e);
  }
}

/**
 * Comprime una imagen a formato JPEG Base64 optimizado para Firestore (máx ~250KB)
 */
export async function compressImageFileToDataUrl(
  fileOrBlob: File | Blob,
  maxWidth = 1600,
  maxHeight = 1080,
  quality = 0.82
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = e.target?.result as string;
          resolve({ dataUrl: rawUrl, size: fileOrBlob.size });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSize = Math.round((compressedDataUrl.length * 3) / 4);
        resolve({ dataUrl: compressedDataUrl, size: approxSize });
      };
      img.onerror = () => {
        const rawUrl = e.target?.result as string;
        resolve({ dataUrl: rawUrl, size: fileOrBlob.size });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Genera una miniatura JPEG rápida de un video usando un elemento de video y canvas
 */
export async function generateVideoThumbnailFromBlob(
  videoBlobOrFile: Blob | File
): Promise<{ thumbnailDataUrl: string; duration: number }> {
  return new Promise((resolve) => {
    try {
      const tempUrl = URL.createObjectURL(videoBlobOrFile);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.src = tempUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(tempUrl);
        } catch (_) {}
      };

      let resolved = false;
      const captureFrame = () => {
        if (resolved) return;
        resolved = true;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbUrl = canvas.toDataURL('image/jpeg', 0.75);
            cleanup();
            resolve({ thumbnailDataUrl: thumbUrl, duration: video.duration || 0 });
            return;
          }
        } catch (_) {}
        cleanup();
        resolve({ thumbnailDataUrl: '', duration: video.duration || 0 });
      };

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      });

      video.addEventListener('seeked', captureFrame);

      // Fallback timeout after 3s if browser fails to seek
      setTimeout(() => {
        if (!resolved) {
          captureFrame();
        }
      }, 3000);
    } catch (_) {
      resolve({ thumbnailDataUrl: '', duration: 0 });
    }
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Sube un archivo de video o imagen al servidor central en la nube.
 * Retorna la URL pública universal (ej. /uploads/video_1726...mp4) accesible
 * desde cualquier dispositivo (computadora, teléfono, tablet, proyector).
 */
export async function uploadMediaToServer(
  file: File | Blob,
  fileName?: string
): Promise<{ url: string; size: number; fileName: string } | null> {
  try {
    const name = fileName || (file instanceof File ? file.name : `media_${Date.now()}.mp4`);
    const type = file.type || (name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: name,
        fileType: type,
        base64Data,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.url) {
      return {
        url: data.url,
        size: data.size || (file instanceof File ? file.size : 0),
        fileName: data.fileName || name,
      };
    }
    return null;
  } catch (error) {
    console.warn('Fallo subida al servidor central, usando almacenamiento local:', error);
    return null;
  }
}

/**
 * Detecta si hay videos o medios almacenados localmente en IndexedDB (por ejemplo en el teléfono móvil)
 * que aún no hayan sido subidos al servidor central en la nube.
 * Los sube a /api/media/upload y retorna las URLs universales para que se vean en la computadora.
 */
export async function syncLocalPresetsToCloudServer(
  onProgress?: (msg: string) => void
): Promise<{ syncedCount: number; updatedPresets: CustomUserVideoPreset[] }> {
  const db = await openMediaDB().catch(() => null);
  if (!db) return { syncedCount: 0, updatedPresets: [] };

  const presets = getLocalPresetsMetaList();
  let syncedCount = 0;
  const updatedPresets: CustomUserVideoPreset[] = [];

  for (const preset of presets) {
    // If preset already has a universal server url or external url, skip upload
    if (preset.serverUrl && !preset.serverUrl.startsWith('blob:')) {
      updatedPresets.push(preset);
      continue;
    }

    try {
      if (onProgress) onProgress(`Sincronizando video "${preset.name}" con la nube para que se vea en todos los dispositivos...`);
      // Fetch blob from IndexedDB
      const blob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(preset.blobKey);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => resolve(null);
      });

      if (blob) {
        const uploadRes = await uploadMediaToServer(blob, preset.name);
        if (uploadRes && uploadRes.url) {
          const updatedPreset: CustomUserVideoPreset = {
            ...preset,
            serverUrl: uploadRes.url,
            url: uploadRes.url,
          };
          updatedPresets.push(updatedPreset);
          syncedCount++;
          continue;
        }
      }
    } catch (err) {
      console.warn(`Error al subir preset local ${preset.name} al servidor:`, err);
    }
    updatedPresets.push(preset);
  }

  // Also check legacy key 'eclesia_lockscreen_uploaded_media'
  try {
    const legacyItem = await new Promise<any>((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('eclesia_lockscreen_uploaded_media');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (legacyItem && legacyItem.blob && (!legacyItem.serverUrl || legacyItem.serverUrl.startsWith('blob:'))) {
      const uploadRes = await uploadMediaToServer(legacyItem.blob, legacyItem.name || 'video_salvapantallas.mp4');
      if (uploadRes && uploadRes.url) {
        legacyItem.serverUrl = uploadRes.url;
        legacyItem.url = uploadRes.url;
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(legacyItem, 'eclesia_lockscreen_uploaded_media');
        syncedCount++;
      }
    }
  } catch (_) {}

  if (syncedCount > 0) {
    saveLocalPresetsMetaList(updatedPresets);
  }

  return { syncedCount, updatedPresets };
}

  }
}

function saveLocalPresetsMetaList(list: CustomUserVideoPreset[]): void {
  try {
    // Exclude dynamic blob object URLs before storing to localStorage, but keep serverUrl
    const metaOnly = list.map(({ id, name, blobKey, size, type, createdAt, serverUrl }) => ({
      id,
      name,
      blobKey,
      size,
      type,
      createdAt,
      serverUrl,
    }));
    localStorage.setItem(CUSTOM_PRESETS_META_KEY, JSON.stringify(metaOnly));
  } catch (e) {
    console.warn('Error saving custom presets meta:', e);
  }
}

export function getCachedDeviceMedia(key = 'eclesia_lockscreen_uploaded_media'): { url: string; name: string; type: string } | null {
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    return activeMemoryMediaCache;
  }
  return null;
}

export function getCachedCustomVideoPreset(presetId: string): { url: string; name: string; type: string } | null {
  return customVideoPresetsCache.get(presetId) || null;
}

function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un archivo de video o foto subido desde el dispositivo en IndexedDB.
 */
export async function saveDeviceMediaBlob(
  key: string,
  blobOrFile: Blob | File,
  meta?: { name?: string; type?: string; size?: number }
): Promise<string> {
  // Create object URL and store in active memory cache immediately
  const objectUrl = URL.createObjectURL(blobOrFile);
  activeMemoryMediaCache = {
    key,
    url: objectUrl,
    name: meta?.name || (blobOrFile instanceof File ? blobOrFile.name : 'archivo_subido'),
    type: meta?.type || blobOrFile.type || (blobOrFile instanceof File && blobOrFile.name.endsWith('.mp4') ? 'video/mp4' : ''),
  };

  const db = await openMediaDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const payload = {
      blob: blobOrFile,
      name: activeMemoryMediaCache!.name,
      type: activeMemoryMediaCache!.type,
      size: meta?.size || blobOrFile.size,
      updatedAt: Date.now(),
    };

    const request = store.put(payload, key);
    request.onsuccess = () => resolve(objectUrl);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Guarda un nuevo preset de video personalizado subido por el usuario.
 */
export async function saveCustomUserVideoPreset(
  file: File,
  customName?: string
): Promise<CustomUserVideoPreset> {
  const id = `uvp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const blobKey = `eclesia_uvp_${id}`;
  const name = customName?.trim() || file.name;
  const objectUrl = URL.createObjectURL(file);
  const type = file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'video/webm');

  // Store in memory cache
  customVideoPresetsCache.set(id, {
    url: objectUrl,
    name,
    type,
  });

  // Also update legacy single-media cache
  activeMemoryMediaCache = {
    key: 'eclesia_lockscreen_uploaded_media',
    url: objectUrl,
    name,
    type,
  };

  // Save in IndexedDB
  const db = await openMediaDB();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const payload = {
      blob: file,
      name,
      type,
      size: file.size,
      updatedAt: Date.now(),
    };
    const req = store.put(payload, blobKey);
    // Also save legacy key for backward compatibility
    store.put(payload, 'eclesia_lockscreen_uploaded_media');
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });

  // Save metadata in localStorage
  const existingList = getLocalPresetsMetaList();
  const newPreset: CustomUserVideoPreset = {
    id,
    name,
    blobKey,
    size: file.size,
    type,
    createdAt: Date.now(),
    url: objectUrl,
  };
  const updatedList = [newPreset, ...existingList.filter((p) => p.id !== id)];
  saveLocalPresetsMetaList(updatedList);

  return newPreset;
}

/**
 * Obtiene todos los presets de video personalizados subidos por el usuario con Object URLs listas.
 */
export async function getCustomUserVideoPresets(): Promise<CustomUserVideoPreset[]> {
  const list = getLocalPresetsMetaList();
  const db = await openMediaDB().catch(() => null);

  // If list is empty, check for legacy uploaded video
  if (list.length === 0 && db) {
    const legacyItem = await getDeviceMediaBlobUrl('eclesia_lockscreen_uploaded_media');
    if (legacyItem && legacyItem.url) {
      const legacyPreset: CustomUserVideoPreset = {
        id: 'uvp_legacy',
        name: legacyItem.name || 'Mi Video Subido',
        blobKey: 'eclesia_lockscreen_uploaded_media',
        type: legacyItem.type || 'video/mp4',
        createdAt: Date.now(),
        url: legacyItem.url,
      };
      customVideoPresetsCache.set('uvp_legacy', legacyItem);
      saveLocalPresetsMetaList([legacyPreset]);
      return [legacyPreset];
    }
  }

  const resolvedList: CustomUserVideoPreset[] = [];

  for (const item of list) {
    // 1. Check memory cache
    const cached = customVideoPresetsCache.get(item.id);
    if (cached) {
      resolvedList.push({ ...item, url: cached.url });
      continue;
    }

    // 2. Query IndexedDB
    if (db) {
      try {
        const itemBlob = await new Promise<Blob | null>((resolve) => {
          const transaction = db.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          const req = store.get(item.blobKey);
          req.onsuccess = () => resolve(req.result?.blob || null);
          req.onerror = () => resolve(null);
        });

        if (itemBlob) {
          const url = URL.createObjectURL(itemBlob);
          customVideoPresetsCache.set(item.id, {
            url,
            name: item.name,
            type: item.type || 'video/mp4',
          });
          resolvedList.push({ ...item, url });
          continue;
        }
      } catch (err) {
        console.warn('Error reading custom preset blob:', err);
      }
    }

    resolvedList.push({
      ...item,
      url: item.serverUrl || item.url,
    });
  }

  return resolvedList;
}

/**
 * Elimina un preset de video personalizado subido por el usuario.
 */
export async function deleteCustomUserVideoPreset(presetId: string): Promise<void> {
  const cached = customVideoPresetsCache.get(presetId);
  if (cached) {
    try {
      URL.revokeObjectURL(cached.url);
    } catch (_) {}
    customVideoPresetsCache.delete(presetId);
  }

  const list = getLocalPresetsMetaList();
  const target = list.find((p) => p.id === presetId);
  const updatedList = list.filter((p) => p.id !== presetId);
  saveLocalPresetsMetaList(updatedList);

  if (target) {
    try {
      const db = await openMediaDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      store.delete(target.blobKey);
    } catch (e) {
      console.warn('Error deleting preset blob:', e);
    }
  }
}

/**
 * Renombra un preset de video personalizado.
 */
export function renameCustomUserVideoPreset(presetId: string, newName: string): void {
  const list = getLocalPresetsMetaList();
  const updatedList = list.map((p) => (p.id === presetId ? { ...p, name: newName } : p));
  saveLocalPresetsMetaList(updatedList);

  const cached = customVideoPresetsCache.get(presetId);
  if (cached) {
    cached.name = newName;
  }
}

/**
 * Obtiene la URL de reproducción para un preset de video personalizado.
 */
export async function getCustomVideoPresetUrl(presetId: string): Promise<string | null> {
  const cached = customVideoPresetsCache.get(presetId);
  if (cached) return cached.url;

  const presets = await getCustomUserVideoPresets();
  const match = presets.find((p) => p.id === presetId);
  return match?.url || null;
}

/**
 * Recupera un archivo de video o foto de IndexedDB y genera un Object URL listo para reproducir.
 */
export async function getDeviceMediaBlobUrl(
  key: string
): Promise<{ url: string; name: string; type: string } | null> {
  // If already in memory cache, return immediately
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    return activeMemoryMediaCache;
  }

  try {
    const db = await openMediaDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const res = request.result;
        if (res && res.blob) {
          const url = URL.createObjectURL(res.blob);
          const cached = { url, name: res.name || '', type: res.type || '' };
          activeMemoryMediaCache = { key, ...cached };
          resolve(cached);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (e) {
    console.warn('Error recuperando media de IndexedDB:', e);
    return null;
  }
}

/**
 * Elimina el archivo de video o foto de IndexedDB
 */
export async function deleteDeviceMediaBlob(key: string): Promise<void> {
  if (activeMemoryMediaCache && activeMemoryMediaCache.key === key) {
    try {
      URL.revokeObjectURL(activeMemoryMediaCache.url);
    } catch (_) {}
    activeMemoryMediaCache = null;
  }

  try {
    const db = await openMediaDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn('Error borrando media de IndexedDB:', e);
  }
}

/**
 * Comprime una imagen a formato JPEG Base64 optimizado para Firestore (máx ~250KB)
 */
export async function compressImageFileToDataUrl(
  fileOrBlob: File | Blob,
  maxWidth = 1600,
  maxHeight = 1080,
  quality = 0.82
): Promise<{ dataUrl: string; size: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const rawUrl = e.target?.result as string;
          resolve({ dataUrl: rawUrl, size: fileOrBlob.size });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const approxSize = Math.round((compressedDataUrl.length * 3) / 4);
        resolve({ dataUrl: compressedDataUrl, size: approxSize });
      };
      img.onerror = () => {
        const rawUrl = e.target?.result as string;
        resolve({ dataUrl: rawUrl, size: fileOrBlob.size });
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Genera una miniatura JPEG rápida de un video usando un elemento de video y canvas
 */
export async function generateVideoThumbnailFromBlob(
  videoBlobOrFile: Blob | File
): Promise<{ thumbnailDataUrl: string; duration: number }> {
  return new Promise((resolve) => {
    try {
      const tempUrl = URL.createObjectURL(videoBlobOrFile);
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.src = tempUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(tempUrl);
        } catch (_) {}
      };

      let resolved = false;
      const captureFrame = () => {
        if (resolved) return;
        resolved = true;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbUrl = canvas.toDataURL('image/jpeg', 0.75);
            cleanup();
            resolve({ thumbnailDataUrl: thumbUrl, duration: video.duration || 0 });
            return;
          }
        } catch (_) {}
        cleanup();
        resolve({ thumbnailDataUrl: '', duration: video.duration || 0 });
      };

      video.addEventListener('loadeddata', () => {
        video.currentTime = Math.min(1, (video.duration || 2) / 2);
      });

      video.addEventListener('seeked', captureFrame);

      // Fallback timeout after 3s if browser fails to seek
      setTimeout(() => {
        if (!resolved) {
          captureFrame();
        }
      }, 3000);
    } catch (_) {
      resolve({ thumbnailDataUrl: '', duration: 0 });
    }
  });
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Sube un archivo de video o imagen al servidor central en la nube.
 * Retorna la URL pública universal (ej. /uploads/video_1726...mp4) accesible
 * desde cualquier dispositivo (computadora, teléfono, tablet, proyector).
 */
export async function uploadMediaToServer(
  file: File | Blob,
  fileName?: string
): Promise<{ url: string; size: number; fileName: string } | null> {
  try {
    const name = fileName || (file instanceof File ? file.name : `media_${Date.now()}.mp4`);
    const type = file.type || (name.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');

    // Convert file to base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/media/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: name,
        fileType: type,
        base64Data,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.url) {
      return {
        url: data.url,
        size: data.size || (file instanceof File ? file.size : 0),
        fileName: data.fileName || name,
      };
    }
    return null;
  } catch (error) {
    console.warn('Fallo subida al servidor central, usando almacenamiento local:', error);
    return null;
  }
}

/**
 * Detecta si hay videos o medios almacenados localmente en IndexedDB (por ejemplo en el teléfono móvil)
 * que aún no hayan sido subidos al servidor central en la nube.
 * Los sube a /api/media/upload y retorna las URLs universales para que se vean en la computadora.
 */
export async function syncLocalPresetsToCloudServer(
  onProgress?: (msg: string) => void
): Promise<{ syncedCount: number; updatedPresets: CustomUserVideoPreset[] }> {
  const db = await openMediaDB().catch(() => null);
  if (!db) return { syncedCount: 0, updatedPresets: [] };

  const presets = getLocalPresetsMetaList();
  let syncedCount = 0;
  const updatedPresets: CustomUserVideoPreset[] = [];

  for (const preset of presets) {
    // If preset already has a universal server url or external url, skip upload
    if (preset.serverUrl && !preset.serverUrl.startsWith('blob:')) {
      updatedPresets.push(preset);
      continue;
    }

    try {
      if (onProgress) onProgress(`Sincronizando video "${preset.name}" con la nube para que se vea en todos los dispositivos...`);
      // Fetch blob from IndexedDB
      const blob = await new Promise<Blob | null>((resolve) => {
        const tx = db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(preset.blobKey);
        req.onsuccess = () => resolve(req.result?.blob || null);
        req.onerror = () => resolve(null);
      });

      if (blob) {
        const uploadRes = await uploadMediaToServer(blob, preset.name);
        if (uploadRes && uploadRes.url) {
          const updatedPreset: CustomUserVideoPreset = {
            ...preset,
            serverUrl: uploadRes.url,
            url: uploadRes.url,
          };
          updatedPresets.push(updatedPreset);
          syncedCount++;
          continue;
        }
      }
    } catch (err) {
      console.warn(`Error al subir preset local ${preset.name} al servidor:`, err);
    }
    updatedPresets.push(preset);
  }

  // Also check legacy key 'eclesia_lockscreen_uploaded_media'
  try {
    const legacyItem = await new Promise<any>((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get('eclesia_lockscreen_uploaded_media');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (legacyItem && legacyItem.blob && (!legacyItem.serverUrl || legacyItem.serverUrl.startsWith('blob:'))) {
      const uploadRes = await uploadMediaToServer(legacyItem.blob, legacyItem.name || 'video_salvapantallas.mp4');
      if (uploadRes && uploadRes.url) {
        legacyItem.serverUrl = uploadRes.url;
        legacyItem.url = uploadRes.url;
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(legacyItem, 'eclesia_lockscreen_uploaded_media');
        syncedCount++;
      }
    }
  } catch (_) {}

  if (syncedCount > 0) {
    saveLocalPresetsMetaList(updatedPresets);
  }

  return { syncedCount, updatedPresets };
}
