import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChurchConfig,
  LockScreenConfig,
  LockScreenTheme,
  LockScreenAnimation,
  LockScreenBackgroundType,
  CustomUserVideoPreset,
  LockScreenMediaItem,
} from '../types';
import {
  THEME_COLOR_PRESETS,
  SPIRITUAL_VIDEO_PRESETS,
  SPIRITUAL_IMAGE_PRESETS,
  defaultLockScreenConfig,
  sanitizeLockScreenConfig,
  safeStringifyLockScreenConfig,
} from '../data/lockScreenPresets';
import {
  saveDeviceMediaBlob,
  getDeviceMediaBlobUrl,
  deleteDeviceMediaBlob,
  getCachedDeviceMedia,
  saveCustomUserVideoPreset,
  saveCustomUserVideoPresetFromUrl,
  getCustomUserVideoPresets,
  deleteCustomUserVideoPreset,
  renameCustomUserVideoPreset,
  getCachedCustomVideoPreset,
  compressImageFileToDataUrl,
  generateVideoThumbnailFromBlob,
  formatFileSize,
  uploadMediaToServer,
  syncLocalPresetsToCloudServer,
  getLocalPresetsMetaList,
} from '../lib/deviceMediaStorage';
import { saveFirestoreDoc, deleteFirestoreDoc, syncFirestoreCollection } from '../lib/firebase';
import { getBackgroundLoopVideoUrl, parseUniversalVideo, resolveUniversalMediaUrl } from '../lib/VideoUtils';
import { UniversalVideoPlayer } from './UniversalVideoPlayer';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { LockScreenMasterActionDeck } from './LockScreenMasterActionDeck';
import {
  Lock,
  Unlock,
  Play,
  Upload,
  Video,
  Image as ImageIcon,
  Palette,
  Sparkles,
  Clock,
  Shield,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Volume2,
  VolumeX,
  RefreshCw,
  Eye,
  KeyRound,
  FileVideo,
  Cloud,
  UploadCloud,
  Database,
  Monitor,
  Church,
  Camera,
  Zap,
  Info,
  Link,
  ExternalLink,
  Globe,
  HardDrive,
  ArrowRight,
  X,
} from 'lucide-react';

interface LockScreenSettingsTabProps {
  config: LockScreenConfig;
  churchConfig?: ChurchConfig;
  onUpdateConfig: (updated: LockScreenConfig) => void;
  onTriggerLockNow: () => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onNavigateToDatabase?: (collectionName?: string) => void;
}

export const LockScreenSettingsTab: React.FC<LockScreenSettingsTabProps> = ({
  config = defaultLockScreenConfig,
  churchConfig,
  onUpdateConfig,
  onTriggerLockNow,
  onShowToast,
  onNavigateToDatabase,
}) => {
  const [formData, setFormData] = useState<LockScreenConfig>(config);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>(() => {
    const cached = getCachedDeviceMedia('eclesia_lockscreen_uploaded_media');
    if (cached?.name) return cached.name;
    return config.mediaName || '';
  });
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(() => {
    const cached = getCachedDeviceMedia('eclesia_lockscreen_uploaded_media');
    if (cached?.url) return cached.url;
    return config.mediaUrl || null;
  });
  const [customVideoPresets, setCustomVideoPresets] = useState<CustomUserVideoPreset[]>([]);
  const [videoPresetsTab, setVideoPresetsTab] = useState<'my_presets' | 'spiritual_presets' | 'all'>('my_presets');
  const [isSavingToFirebase, setIsSavingToFirebase] = useState(false);
  const [isLogoPhotoModalOpen, setIsLogoPhotoModalOpen] = useState(false);
  const [isBackgroundCameraModalOpen, setIsBackgroundCameraModalOpen] = useState(false);
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Firestore Real-time Collections sync
  const [firestoreMediaList, setFirestoreMediaList] = useState<LockScreenMediaItem[]>([]);
  const [isSyncingPresets, setIsSyncingPresets] = useState(false);
  const [externalUrlInput, setExternalUrlInput] = useState('');
  const [externalUrlName, setExternalUrlName] = useState('');
  const [externalUrlType, setExternalUrlType] = useState<'video' | 'image'>('video');
  const [isAddingExternalUrl, setIsAddingExternalUrl] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [externalUrlEnableAudio, setExternalUrlEnableAudio] = useState(true);

  // Modal confirmation state for 100% reliable in-app deletions (avoids iframe confirm() blocks)
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    name: string;
    type: 'custom_video_preset' | 'firestore_media' | 'uploaded_media';
    title?: string;
    url?: string;
    thumbnail?: string;
  } | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoPresetInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe in real-time to lockScreenMedia in Firestore
  useEffect(() => {
    const unsub = syncFirestoreCollection<LockScreenMediaItem>('lockScreenMedia', (items) => {
      const validItems = items || [];
      setFirestoreMediaList(validItems);

      if (Array.isArray(validItems)) {
        const remoteVideos = validItems.filter((m) => m.type === 'video' && m.url);
        setCustomVideoPresets((prev) => {
          // Keep local device-stored presets (those with local blobKey or in local metadata list)
          const localMetaList = getLocalPresetsMetaList();
          const localMetaIds = new Set(localMetaList.map((p) => p.id));
          const localOnly = prev.filter(
            (p) => (p.blobKey && p.blobKey.length > 0) || localMetaIds.has(p.id)
          );

          // Build current remote presets directly from live Firestore collection
          const remotePresets: CustomUserVideoPreset[] = remoteVideos.map((rv) => ({
            id: rv.id,
            name: rv.name,
            blobKey: '',
            type: rv.mediaType || 'video/mp4',
            createdAt: new Date(rv.createdAt).getTime() || Date.now(),
            url: rv.url,
            serverUrl: rv.url,
          }));

          // Merge uniquely avoiding duplicates
          const combined: CustomUserVideoPreset[] = [...localOnly];
          const existingUrls = new Set(combined.map((p) => p.url));
          const existingIds = new Set(combined.map((p) => p.id));

          for (const rp of remotePresets) {
            if (!existingUrls.has(rp.url) && !existingIds.has(rp.id)) {
              combined.push(rp);
              existingUrls.add(rp.url);
              existingIds.add(rp.id);
            }
          }
          return combined;
        });
      }
    });
    return () => {
      unsub();
    };
  }, []);

  // Load custom user video presets on mount and auto-sync any local videos to the cloud server
  useEffect(() => {
    let isMounted = true;
    const loadCustomPresets = async () => {
      // Auto-sync any device-local videos to cloud server so they are visible across all devices (phone -> PC)
      try {
        const syncResult = await syncLocalPresetsToCloudServer();
        if (syncResult.syncedCount > 0 && isMounted) {
          onShowToast(`☁️ Se sincronizaron ${syncResult.syncedCount} videos locales con la nube para verse en todos tus dispositivos.`, 'success');
        }
      } catch (err) {
        console.warn('Auto cloud sync notice:', err);
      }

      const presets = await getCustomUserVideoPresets();
      if (isMounted) {
        setCustomVideoPresets(presets);
        // If current config points to a custom preset, ensure preview URL is synced
        if (config.customVideoPresetId) {
          const match = presets.find((p) => p.id === config.customVideoPresetId);
          if (match?.url) {
            setUploadedPreviewUrl(match.url);
            setUploadedFileName(match.name);
          }
        }
      }
    };
    loadCustomPresets();
    return () => {
      isMounted = false;
    };
  }, [config.customVideoPresetId]);

  // Load preview from universal URL, Firestore, memory cache or IndexedDB on mount
  useEffect(() => {
    let isMounted = true;
    const loadStoredMedia = async () => {
      // 1. Direct universal cloud URL (/uploads/... or http...)
      if (config.mediaUrl && !config.mediaUrl.startsWith('blob:')) {
        if (isMounted) {
          setUploadedPreviewUrl(config.mediaUrl);
          if (config.mediaName) setUploadedFileName(config.mediaName);
        }
        return;
      }
      if (config.customVideoPresetId) {
        const cachedPreset = getCachedCustomVideoPreset(config.customVideoPresetId);
        if (cachedPreset?.url && isMounted) {
          setUploadedPreviewUrl(cachedPreset.url);
          setUploadedFileName(cachedPreset.name);
          return;
        }
      }
      const cached = getCachedDeviceMedia('eclesia_lockscreen_uploaded_media');
      if (cached && isMounted) {
        setUploadedPreviewUrl(cached.url);
        if (cached.name) setUploadedFileName(cached.name);
        return;
      }
      // If mediaUrl is a blob: that doesn't exist on this device (e.g. uploaded from phone, now on PC)
      try {
        const { getFirestoreDocs } = await import('../lib/firebase');
        const mediaDocs = await getFirestoreDocs<LockScreenMediaItem>('lockScreenMedia');
        if (isMounted && mediaDocs && mediaDocs.length > 0) {
          const match = mediaDocs.find(
            (m) =>
              m.url &&
              !m.url.startsWith('blob:') &&
              ((config.mediaName && m.name === config.mediaName) ||
                (m.isActiveInLockScreen && m.type === (config.mediaType || 'video')))
          );
          if (match && match.url) {
            setUploadedPreviewUrl(match.url);
            setUploadedFileName(match.name);
            return;
          }
        }
      } catch (_) {}

      const item = await getDeviceMediaBlobUrl('eclesia_lockscreen_uploaded_media');
      if (isMounted && item) {
        setUploadedPreviewUrl(item.url);
        if (item.name) setUploadedFileName(item.name);
      }
    };
    loadStoredMedia();
    return () => {
      isMounted = false;
    };
  }, [config.mediaUrl, config.updatedAt, config.customVideoPresetId]);

  // Sync internal state when external config prop changes
  useEffect(() => {
    setFormData(config);
  }, [config]);

  // Quick Inactivity Test Countdown
  useEffect(() => {
    if (testCountdown === null) return;
    if (testCountdown <= 0) {
      setTestCountdown(null);
      handleTriggerLockNow();
      return;
    }
    const timer = setInterval(() => {
      setTestCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [testCountdown]);

  // Centralized state update: immediately informs parent, persists in localStorage, and auto-syncs with Firebase
  const handleApplyUpdate = (nextConfig: LockScreenConfig, toastMsg?: string) => {
    const cleanConfig = sanitizeLockScreenConfig(nextConfig);
    setFormData(cleanConfig);
    onUpdateConfig(cleanConfig);
    try {
      localStorage.setItem('eclesia_lock_screen_config', safeStringifyLockScreenConfig(cleanConfig));
    } catch (e) {
      console.warn('Could not cache lock screen config in localStorage', e);
    }
    // Auto-save to Firebase Firestore in background: both system/lockScreenConfig AND lockScreenConfig/active
    const payload = {
      ...cleanConfig,
      updatedAt: Date.now(),
      updatedBy: 'Desarrollador',
    };
    saveFirestoreDoc('system', 'lockScreenConfig', payload).catch((err) => {
      console.warn('Auto-save to Firebase system/lockScreenConfig failed:', err);
    });
    saveFirestoreDoc('lockScreenConfig', 'active', payload).catch((err) => {
      console.warn('Auto-save to Firebase lockScreenConfig/active failed:', err);
    });

    if (toastMsg) {
      onShowToast(toastMsg, 'success');
    }
  };

  // Immediate lock trigger with current form data guaranteed applied
  const handleTriggerLockNow = () => {
    handleApplyUpdate(formData);
    onTriggerLockNow();
  };

  // Start countdown test with customizable seconds
  const handleStartCountdownTest = (seconds: number) => {
    const nextConfig: LockScreenConfig = {
      ...formData,
      enabled: true,
      timeoutMinutes: seconds / 60,
      updatedAt: Date.now(),
    };
    handleApplyUpdate(nextConfig);
    setTestCountdown(seconds);
    onShowToast(`⚡ Modo prueba activado: Dejando inactivo el sistema por ${seconds} segundos...`, 'info');
  };

  // Start 10-second inactivity test
  const handleStartQuick10sTest = () => {
    handleStartCountdownTest(10);
  };

  // Prompt for direct web media URL
  const handlePromptExternalUrl = () => {
    setShowUrlModal(true);
  };

  // Handle local background file upload (video or image) from user's device
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const lowerName = file.name.toLowerCase();
      const isVideo =
        file.type.startsWith('video/') ||
        lowerName.endsWith('.mp4') ||
        lowerName.endsWith('.webm') ||
        lowerName.endsWith('.mov') ||
        lowerName.endsWith('.m4v') ||
        lowerName.endsWith('.ogv') ||
        lowerName.endsWith('.mkv');
      const isImage =
        file.type.startsWith('image/') ||
        lowerName.endsWith('.jpg') ||
        lowerName.endsWith('.jpeg') ||
        lowerName.endsWith('.png') ||
        lowerName.endsWith('.webp') ||
        lowerName.endsWith('.gif');

      if (!isVideo && !isImage) {
        onShowToast('Por favor selecciona un archivo de video (MP4, WebM, MOV) o imagen (JPG, PNG).', 'danger');
        setIsUploading(false);
        return;
      }

      if (isVideo) {
        // 1. Upload video to universal server so it is accessible cross-device (phone, computer, tablet)
        onShowToast(`Subiendo video "${file.name}" a la nube central para sincronización multi-dispositivo...`, 'info');
        const serverUpload = await uploadMediaToServer(file, file.name);
        const universalUrl = serverUpload?.url || '';

        // 2. Generate video thumbnail frame
        const { thumbnailDataUrl, duration } = await generateVideoThumbnailFromBlob(file);

        // 3. Save as a persistent custom video preset in local IndexedDB
        const newPreset = await saveCustomUserVideoPreset(file);
        if (universalUrl) {
          newPreset.serverUrl = universalUrl;
        }
        setCustomVideoPresets((prev) => [newPreset, ...prev.filter((p) => p.id !== newPreset.id)]);
        setUploadedPreviewUrl(universalUrl || newPreset.url || null);
        setUploadedFileName(newPreset.name);

        // 4. Save full metadata and universal URL into Firestore collection lockScreenMedia
        const mediaDocId = `media_vid_${Date.now()}`;
        const finalUrl = universalUrl || newPreset.url || '';
        const mediaDoc: LockScreenMediaItem = {
          id: mediaDocId,
          name: file.name,
          type: 'video',
          mediaType: file.type || 'video/mp4',
          url: finalUrl,
          thumbnail: thumbnailDataUrl || '',
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          durationSeconds: Math.round(duration),
          isActiveInLockScreen: true,
          source: 'device_upload',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Desarrollador',
        };
        await saveFirestoreDoc('lockScreenMedia', mediaDocId, mediaDoc);

        const nextConfig: LockScreenConfig = {
          ...formData,
          backgroundType: 'video',
          mediaType: 'video',
          customVideoPresetId: newPreset.id,
          presetVideoId: '',
          mediaName: newPreset.name,
          mediaUrl: finalUrl,
          updatedAt: Date.now(),
        };

        handleApplyUpdate(
          nextConfig,
          `🎬 Video "${newPreset.name}" subido a la nube y sincronizado al 100%. ¡Ahora se verá en la computadora y en el teléfono!`
        );
      } else {
        // 1. Upload image to server
        const serverUpload = await uploadMediaToServer(file, file.name);
        const universalUrl = serverUpload?.url || '';

        // 2. Compress image to high-quality JPEG Base64
        const { dataUrl } = await compressImageFileToDataUrl(file);

        // 3. Store image in IndexedDB for fast local retrieval
        await saveDeviceMediaBlob('eclesia_lockscreen_uploaded_media', file, {
          name: file.name,
          type: file.type || 'image/jpeg',
          size: file.size,
        });

        // 4. Save full compressed image and metadata in Firestore lockScreenMedia
        const mediaDocId = `media_img_${Date.now()}`;
        const finalUrl = universalUrl || dataUrl;
        const mediaDoc: LockScreenMediaItem = {
          id: mediaDocId,
          name: file.name,
          type: 'image',
          mediaType: file.type || 'image/jpeg',
          url: finalUrl,
          thumbnail: dataUrl,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          isActiveInLockScreen: true,
          source: 'device_upload',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Desarrollador',
        };
        await saveFirestoreDoc('lockScreenMedia', mediaDocId, mediaDoc);

        setUploadedPreviewUrl(finalUrl);
        setUploadedFileName(file.name);

        const nextConfig: LockScreenConfig = {
          ...formData,
          backgroundType: 'image',
          mediaType: 'image',
          mediaName: file.name,
          mediaUrl: finalUrl,
          presetVideoId: '',
          customVideoPresetId: '',
          updatedAt: Date.now(),
        };

        handleApplyUpdate(
          nextConfig,
          `🖼️ Imagen "${file.name}" guardada en la base de datos central y sincronizada al 100%.`
        );
      }
    } catch (error) {
      console.error('Error subiendo archivo de salvapantallas:', error);
      onShowToast('Ocurrió un error al procesar el archivo. Intenta con otro formato.', 'danger');
    } finally {
      setIsUploading(false);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Handle Photo Capture via device camera modal
  const handleBackgroundPhotoCaptured = async (photoDataUrl: string) => {
    setIsBackgroundCameraModalOpen(false);
    const mediaDocId = `media_cam_${Date.now()}`;
    const cleanName = `Foto Cámara ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    const approxSize = Math.round((photoDataUrl.length * 3) / 4);

    const mediaDoc: LockScreenMediaItem = {
      id: mediaDocId,
      name: cleanName,
      type: 'image',
      mediaType: 'image/jpeg',
      url: photoDataUrl,
      thumbnail: photoDataUrl,
      size: approxSize,
      sizeFormatted: formatFileSize(approxSize),
      isActiveInLockScreen: true,
      source: 'camera_capture',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'Desarrollador',
    };

    try {
      await saveFirestoreDoc('lockScreenMedia', mediaDocId, mediaDoc);
      setUploadedPreviewUrl(photoDataUrl);
      setUploadedFileName(cleanName);

      const nextConfig: LockScreenConfig = {
        ...formData,
        backgroundType: 'image',
        mediaType: 'image',
        mediaName: cleanName,
        mediaUrl: photoDataUrl,
        presetVideoId: '',
        customVideoPresetId: '',
        updatedAt: Date.now(),
      };
      handleApplyUpdate(
        nextConfig,
        '📸 Fotografía con cámara guardada en Firestore y activada en el salvapantallas.'
      );
    } catch (err) {
      console.error('Error guardando foto en Firestore:', err);
      onShowToast('Error al guardar la foto en Firestore.', 'danger');
    }
  };

  // Handle adding external media URL (MP4 video, YouTube, social networks, or image link)
  const handleAddExternalUrlMedia = async () => {
    if (!externalUrlInput.trim()) {
      onShowToast('Introduce una URL válida de imagen o video.', 'danger');
      return;
    }
    setIsAddingExternalUrl(true);
    try {
      const cleanUrl = externalUrlInput.trim();
      let resolvedUrl = cleanUrl;
      let thumbnail = '';
      let platformName = 'Enlace Remoto';
      let cleanName = externalUrlName.trim();

      if (externalUrlType === 'video') {
        const resolved = await resolveUniversalMediaUrl(cleanUrl);
        resolvedUrl = resolved.canonicalUrl || cleanUrl;
        thumbnail = resolved.thumbnailUrl || '';
        platformName = resolved.platform;
        if (!cleanName) {
          cleanName = resolved.title || 'Video Remoto';
        }
      } else {
        thumbnail = cleanUrl;
        if (!cleanName) cleanName = 'Imagen Remota';
      }

      const mediaDocId = `media_url_${Date.now()}`;

      const mediaDoc: LockScreenMediaItem = {
        id: mediaDocId,
        name: cleanName,
        type: externalUrlType,
        mediaType: externalUrlType === 'video' ? 'video/mp4' : 'image/jpeg',
        url: resolvedUrl,
        thumbnail,
        isActiveInLockScreen: true,
        source: 'external_url',
        notes: `Plataforma: ${platformName}. Sonido: ${externalUrlEnableAudio ? 'Activo' : 'Silenciado'}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'Desarrollador',
      };

      let createdPresetId = '';
      if (externalUrlType === 'video') {
        const newPreset = await saveCustomUserVideoPresetFromUrl(resolvedUrl, cleanName, thumbnail);
        createdPresetId = newPreset.id;
        setCustomVideoPresets((prev) => [newPreset, ...prev.filter((p) => p.id !== newPreset.id)]);
      }

      await saveFirestoreDoc('lockScreenMedia', mediaDocId, mediaDoc);
      setUploadedPreviewUrl(resolvedUrl);
      setUploadedFileName(cleanName);

      const nextConfig: LockScreenConfig = {
        ...formData,
        backgroundType: externalUrlType,
        mediaType: externalUrlType,
        mediaName: cleanName,
        mediaUrl: resolvedUrl,
        presetVideoId: '',
        customVideoPresetId: createdPresetId,
        videoMuted: externalUrlType === 'video' ? !externalUrlEnableAudio : (formData.videoMuted ?? true),
        updatedAt: Date.now(),
      };

      const audioNotice = externalUrlType === 'video' ? (externalUrlEnableAudio ? ' (Audio habilitado 🔊)' : ' (Silenciado 🔇)') : '';
      handleApplyUpdate(
        nextConfig,
        `🌐 Fondo "${cleanName}" (${platformName}) guardado en base de datos Firestore y activado en salvapantallas${audioNotice}.`
      );
      setExternalUrlInput('');
      setExternalUrlName('');
      setShowUrlModal(false);
    } catch (err) {
      console.error('Error guardando URL en Firestore:', err);
      onShowToast('Error al guardar la URL en Firestore.', 'danger');
    } finally {
      setIsAddingExternalUrl(false);
    }
  };

  // Synchronize all Spiritual Presets (Videos & Images) into Firestore lockScreenMedia
  const handleSyncSpiritualPresetsToFirestore = async () => {
    setIsSyncingPresets(true);
    try {
      // 3 Video Presets
      for (const p of SPIRITUAL_VIDEO_PRESETS) {
        const item: LockScreenMediaItem = {
          id: `preset_vid_${p.id}`,
          name: p.name,
          type: 'video',
          mediaType: 'video/mp4',
          url: p.videoUrl,
          thumbnail: p.thumbnailUrl,
          isActiveInLockScreen: formData.backgroundType === 'video' && formData.presetVideoId === p.id,
          source: 'preset',
          notes: p.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Sistema',
        };
        await saveFirestoreDoc('lockScreenMedia', item.id, item);
      }
      // 4 Image Presets
      for (const p of SPIRITUAL_IMAGE_PRESETS) {
        const item: LockScreenMediaItem = {
          id: `preset_img_${p.id}`,
          name: p.name,
          type: 'image',
          mediaType: 'image/jpeg',
          url: p.imageUrl,
          thumbnail: p.imageUrl,
          isActiveInLockScreen: formData.backgroundType === 'image' && formData.mediaUrl === p.imageUrl,
          source: 'preset',
          notes: p.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'Sistema',
        };
        await saveFirestoreDoc('lockScreenMedia', item.id, item);
      }
      onShowToast('¡Todos los presets espirituales (videos e imágenes) se sincronizaron en Firestore!', 'success');
    } catch (err) {
      console.error('Error sincronizando presets con Firestore:', err);
      onShowToast('Error al sincronizar presets con Firestore.', 'danger');
    } finally {
      setIsSyncingPresets(false);
    }
  };

  // Select and project a media item from Firestore database
  const handleSelectFirestoreMediaItem = async (item: LockScreenMediaItem) => {
    try {
      // Mark selected as active in Firestore
      for (const m of firestoreMediaList) {
        if (m.id === item.id && !m.isActiveInLockScreen) {
          await saveFirestoreDoc('lockScreenMedia', m.id, { ...m, isActiveInLockScreen: true, updatedAt: new Date().toISOString() });
        } else if (m.id !== item.id && m.isActiveInLockScreen) {
          await saveFirestoreDoc('lockScreenMedia', m.id, { ...m, isActiveInLockScreen: false, updatedAt: new Date().toISOString() });
        }
      }

      const nextConfig: LockScreenConfig = {
        ...formData,
        backgroundType: item.type === 'video' ? 'video' : 'image',
        mediaType: item.type === 'video' ? 'video' : 'image',
        mediaName: item.name,
        mediaUrl: item.url,
        presetVideoId: item.source === 'preset' && item.type === 'video' ? item.id.replace('preset_vid_', '') : '',
        customVideoPresetId: '',
        updatedAt: Date.now(),
      };

      setUploadedPreviewUrl(item.url || item.thumbnail || null);
      setUploadedFileName(item.name);

      handleApplyUpdate(
        nextConfig,
        `✓ Fondo "${item.name}" seleccionado de la base de datos Firestore y proyectando.`
      );
    } catch (err) {
      console.error('Error activando fondo de Firestore:', err);
      onShowToast('Error activando fondo de la base de datos.', 'danger');
    }
  };

  // Prompt modal deletion for Firestore media item
  const handleDeleteFirestoreMediaItem = (itemId: string, itemName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = firestoreMediaList.find((m) => m.id === itemId);
    setItemToDelete({
      id: itemId,
      name: itemName,
      type: 'firestore_media',
      title: `¿Eliminar "${itemName}" de Firestore?`,
      url: item?.url,
      thumbnail: item?.thumbnail,
    });
  };

  // Synchronize local videos to universal cloud server for cross-device view (phone -> PC)
  const handleSyncLocalVideosToCloud = async () => {
    setIsSyncingCloud(true);
    try {
      onShowToast('Subiendo videos locales y sincronizando con la nube central...', 'info');
      const { syncedCount, updatedPresets } = await syncLocalPresetsToCloudServer((msg) => {
        onShowToast(msg, 'info');
      });

      if (updatedPresets.length > 0) {
        setCustomVideoPresets(updatedPresets);
      }

      // Ensure each updated preset has a record in Firestore lockScreenMedia
      for (const p of updatedPresets) {
        if (p.serverUrl) {
          const mediaDocId = `media_vid_${p.id}`;
          await saveFirestoreDoc('lockScreenMedia', mediaDocId, {
            id: mediaDocId,
            name: p.name,
            type: 'video',
            mediaType: p.type || 'video/mp4',
            url: p.serverUrl,
            thumbnail: p.url || '',
            size: p.size,
            sizeFormatted: p.size ? formatFileSize(p.size) : undefined,
            isActiveInLockScreen: formData.customVideoPresetId === p.id || formData.mediaName === p.name,
            source: 'device_upload',
            createdAt: new Date(p.createdAt).toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'Desarrollador',
          });
        }
      }

      // If active preset was among updated, update active mediaUrl
      if (formData.customVideoPresetId) {
        const matching = updatedPresets.find((p) => p.id === formData.customVideoPresetId);
        if (matching?.serverUrl) {
          handleApplyUpdate({
            ...formData,
            mediaUrl: matching.serverUrl,
            updatedAt: Date.now(),
          });
        }
      }

      if (syncedCount > 0) {
        onShowToast(`☁️ ¡Éxito! Se sincronizaron ${syncedCount} videos con el servidor. Ahora se reproducen en tu computadora, teléfono y cualquier dispositivo.`, 'success');
      } else {
        onShowToast('✅ Todos los videos ya se encuentran sincronizados en la nube y en la base de datos.', 'success');
      }
    } catch (e) {
      console.error('Error sincronizando videos con la nube:', e);
      onShowToast('Error durante la sincronización a la nube.', 'danger');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Select a custom user video preset
  const handleSelectCustomVideoPreset = (preset: CustomUserVideoPreset) => {
    const finalUrl = preset.serverUrl || preset.url;

    // If not yet uploaded to server, attempt upload in background so it's universal
    if (!preset.serverUrl) {
      syncLocalPresetsToCloudServer().then((res) => {
        if (res.syncedCount > 0) {
          getCustomUserVideoPresets().then(setCustomVideoPresets);
        }
      });
    }

    const nextConfig: LockScreenConfig = {
      ...formData,
      backgroundType: 'video',
      mediaType: 'video',
      customVideoPresetId: preset.id,
      presetVideoId: '',
      mediaName: preset.name,
      mediaUrl: finalUrl,
      updatedAt: Date.now(),
    };
    setUploadedPreviewUrl(finalUrl || null);
    setUploadedFileName(preset.name);
    handleApplyUpdate(
      nextConfig,
      `🎬 Video "${preset.name}" activado y sincronizado con la base de datos central.`
    );
  };

  // Prompt modal deletion for custom user video preset
  const handleDeleteCustomVideoPreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = customVideoPresets.find((p) => p.id === presetId);
    setItemToDelete({
      id: presetId,
      name: target?.name || 'Video Preset',
      type: 'custom_video_preset',
      title: `¿Eliminar preset de video "${target?.name || 'este video'}"?`,
      url: target?.url || target?.serverUrl,
    });
  };

  // Prompt modal deletion for uploaded media
  const handleRemoveUploadedMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItemToDelete({
      id: 'eclesia_lockscreen_uploaded_media',
      name: uploadedFileName || 'Fotografía activa en el salvapantallas',
      type: 'uploaded_media',
      title: '¿Quitar fotografía subida del salvapantallas?',
      url: uploadedPreviewUrl || undefined,
    });
  };

  // 100% Robust Deletion Execution across Firestore, IndexedDB, Memory Cache, and State
  const handleExecuteDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingMedia(true);
    const { id, name, type, url } = itemToDelete;

    try {
      if (type === 'custom_video_preset') {
        // 1. Delete from IndexedDB and local storage meta list
        await deleteCustomUserVideoPreset(id);

        // 2. Delete from Firestore collection lockScreenMedia (both raw and prefixed IDs)
        await deleteFirestoreDoc('lockScreenMedia', id);
        await deleteFirestoreDoc('lockScreenMedia', `media_vid_${id}`);

        // 3. Optimistic local state update
        setCustomVideoPresets((prev) => prev.filter((p) => p.id !== id && p.id !== `media_vid_${id}`));
        setFirestoreMediaList((prev) => prev.filter((m) => m.id !== id && m.id !== `media_vid_${id}`));

        // 4. Check if currently active in lock screen configuration
        const isActive =
          formData.customVideoPresetId === id ||
          formData.customVideoPresetId === `media_vid_${id}` ||
          (url && formData.mediaUrl === url) ||
          formData.mediaName === name;

        if (isActive) {
          const defaultPreset = SPIRITUAL_VIDEO_PRESETS[0];
          const nextConfig: LockScreenConfig = {
            ...formData,
            backgroundType: 'video',
            mediaType: 'video',
            customVideoPresetId: '',
            presetVideoId: defaultPreset.id,
            mediaName: defaultPreset.name,
            mediaUrl: defaultPreset.videoUrl,
            updatedAt: Date.now(),
          };
          setUploadedPreviewUrl(null);
          setUploadedFileName('');
          await handleApplyUpdate(
            nextConfig,
            `✓ Preset "${name}" eliminado al 100% de Firestore y del dispositivo. Se activó "${defaultPreset.name}".`
          );
        } else {
          onShowToast(`✓ Preset "${name}" eliminado correctamente de Firestore y del dispositivo.`, 'success');
        }
      } else if (type === 'firestore_media') {
        // 1. Delete from Firestore database
        await deleteFirestoreDoc('lockScreenMedia', id);

        // 2. Delete from local device presets if cached
        const cleanId = id.startsWith('media_vid_') ? id.replace('media_vid_', '') : id;
        await deleteCustomUserVideoPreset(id);
        await deleteCustomUserVideoPreset(cleanId);

        // 3. Optimistic local state update
        setFirestoreMediaList((prev) => prev.filter((m) => m.id !== id));
        setCustomVideoPresets((prev) => prev.filter((p) => p.id !== id && p.id !== cleanId));

        // 4. Check if currently active in lock screen
        const isActive =
          (url && formData.mediaUrl === url) ||
          formData.mediaName === name ||
          formData.customVideoPresetId === id ||
          formData.customVideoPresetId === cleanId;

        if (isActive) {
          const defaultPreset = SPIRITUAL_VIDEO_PRESETS[0];
          const nextConfig: LockScreenConfig = {
            ...formData,
            backgroundType: 'video',
            mediaType: 'video',
            customVideoPresetId: '',
            presetVideoId: defaultPreset.id,
            mediaName: defaultPreset.name,
            mediaUrl: defaultPreset.videoUrl,
            updatedAt: Date.now(),
          };
          setUploadedPreviewUrl(null);
          setUploadedFileName('');
          await handleApplyUpdate(
            nextConfig,
            `✓ Archivo "${name}" eliminado de la base de datos. Se restauró el salvapantallas a "${defaultPreset.name}".`
          );
        } else {
          onShowToast(`✓ "${name}" eliminado de la base de datos Firestore y del dispositivo.`, 'success');
        }
      } else if (type === 'uploaded_media') {
        // 1. Delete local media blob
        await deleteDeviceMediaBlob('eclesia_lockscreen_uploaded_media');
        setUploadedPreviewUrl(null);
        setUploadedFileName('');

        // 2. Delete any matching device_upload document in Firestore lockScreenMedia
        const matchingDocs = firestoreMediaList.filter(
          (m) =>
            m.source === 'device_upload' &&
            (m.name === name || (url && m.url === url) || (uploadedPreviewUrl && m.url === uploadedPreviewUrl))
        );
        for (const m of matchingDocs) {
          await deleteFirestoreDoc('lockScreenMedia', m.id);
        }
        if (matchingDocs.length > 0) {
          setFirestoreMediaList((prev) => prev.filter((m) => !matchingDocs.some((d) => d.id === m.id)));
        }

        // 3. Reset lockscreen background to default gradient
        const nextConfig: LockScreenConfig = {
          ...formData,
          backgroundType: 'gradient',
          mediaUrl: undefined,
          mediaName: undefined,
          mediaType: undefined,
          presetVideoId: undefined,
          customVideoPresetId: undefined,
          updatedAt: Date.now(),
        };
        await handleApplyUpdate(nextConfig, '✓ Fotografía multimedia eliminada del salvapantallas.');
      }
    } catch (err: any) {
      console.error('Error al ejecutar eliminación multimedia:', err);
      onShowToast(`Error al eliminar archivo: ${err?.message || 'Error en base de datos'}`, 'danger');
    } finally {
      setIsDeletingMedia(false);
      setItemToDelete(null);
    }
  };

  // Select a spiritual system preset
  const handleSelectSpiritualVideoPreset = (preset: (typeof SPIRITUAL_VIDEO_PRESETS)[0]) => {
    const nextConfig: LockScreenConfig = {
      ...formData,
      backgroundType: 'video',
      mediaType: 'video',
      presetVideoId: preset.id,
      customVideoPresetId: '',
      mediaName: preset.name,
      mediaUrl: preset.videoUrl,
      updatedAt: Date.now(),
    };
    handleApplyUpdate(nextConfig, `Preset espiritual "${preset.name}" seleccionado.`);
  };

  // Handle lock screen logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Por favor selecciona una imagen válida (PNG, JPG, SVG).', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const next = {
          ...formData,
          showChurchLogo: true,
          logoUrl: dataUrl,
          updatedAt: Date.now(),
        };
        handleApplyUpdate(next, 'Logotipo de la pantalla de bloqueo actualizado.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Save explicitly to Firebase with notification
  const handleSaveToFirebase = async () => {
    setIsSavingToFirebase(true);
    try {
      const sanitized = sanitizeLockScreenConfig({
        ...formData,
        updatedAt: Date.now(),
        updatedBy: 'Desarrollador',
      });

      await saveFirestoreDoc('system', 'lockScreenConfig', sanitized);
      await saveFirestoreDoc('lockScreenConfig', 'active', sanitized);

      // If active media exists, ensure marked in lockScreenMedia
      if (formData.mediaName) {
        const matchingDoc = firestoreMediaList.find(
          (m) => m.name === formData.mediaName || m.url === formData.mediaUrl
        );
        if (matchingDoc && !matchingDoc.isActiveInLockScreen) {
          await saveFirestoreDoc('lockScreenMedia', matchingDoc.id, {
            ...matchingDoc,
            isActiveInLockScreen: true,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      handleApplyUpdate(sanitized);
      onShowToast('¡Configuración de bloqueo y salvapantallas guardada al 100% en Firebase Firestore!', 'success');
    } catch (e) {
      console.error('Error guardando en Firebase:', e);
      onShowToast('Error al sincronizar con Firebase.', 'danger');
    } finally {
      setIsSavingToFirebase(false);
    }
  };

  // Determine effective logo source
  const effectiveLogo = formData.logoUrl || churchConfig?.logoUrl;
  const isUsingCustomLogo = !!formData.logoUrl;

  // Determine active spiritual theme preset
  const activeTheme = THEME_COLOR_PRESETS[formData.theme] || THEME_COLOR_PRESETS.monte_sinai;

  // Video source for live preview card with real-time motion
  const previewVideoUrl = useMemo(() => {
    if (formData.backgroundType !== 'video') return '';
    // 1. If custom user video preset chosen
    if (formData.customVideoPresetId) {
      const match = customVideoPresets.find((p) => p.id === formData.customVideoPresetId);
      if (match?.url) return match.url;
      const cached = getCachedCustomVideoPreset(formData.customVideoPresetId);
      if (cached?.url) return cached.url;
    }
    // 2. If spiritual system preset video chosen
    if (formData.presetVideoId) {
      const preset = SPIRITUAL_VIDEO_PRESETS.find((p) => p.id === formData.presetVideoId);
      if (preset) return preset.videoUrl;
    }
    // 3. Fallbacks
    if (uploadedPreviewUrl) return uploadedPreviewUrl;
    if (formData.mediaUrl && (!formData.mediaType || formData.mediaType === 'video')) {
      return formData.mediaUrl;
    }
    return SPIRITUAL_VIDEO_PRESETS[0].videoUrl;
  }, [
    formData.backgroundType,
    formData.customVideoPresetId,
    formData.presetVideoId,
    customVideoPresets,
    uploadedPreviewUrl,
    formData.mediaUrl,
    formData.mediaType,
  ]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* HEADER HERO BANNER */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl shadow-purple-600/30 flex items-center justify-center shrink-0">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-white">
                  Bloqueo de Pantalla & Salvapantallas por Inactividad
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firebase Sincronizado
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Protege el sistema de la iglesia bloqueando automáticamente la pantalla tras el período de inactividad configurado. Personaliza el logo de la iglesia, videos y fotografías, versículos bíblicos y clave de desbloqueo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleStartQuick10sTest}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer"
              title="Ajusta temporalmente el tiempo de inactividad a 10 segundos para probar la activación automática"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Probar en 10 seg</span>
            </button>

            <button
              type="button"
              onClick={handleTriggerLockNow}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Bloquear Pantalla Ahora</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToFirebase}
              disabled={isSavingToFirebase}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Database className={`w-4 h-4 ${isSavingToFirebase ? 'animate-spin' : ''}`} />
              <span>{isSavingToFirebase ? 'Guardando...' : 'Guardar en Firebase'}</span>
            </button>
          </div>
        </div>

        {/* ACTIVE COUNTDOWN BANNER IF TESTING */}
        {testCountdown !== null && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-between gap-3 text-amber-200 text-xs animate-pulse">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>
                <strong>Prueba en curso:</strong> Deja de mover el ratón y el teclado. Activando bloqueo automático en <strong>{testCountdown}s</strong>...
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTestCountdown(null);
                handleApplyUpdate({ ...formData, timeoutMinutes: 5 });
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/30 hover:bg-amber-500/50 text-amber-100 text-[11px] font-bold cursor-pointer"
            >
              Restaurar 5 min
            </button>
          </div>
        )}
      </div>

      {/* MASTER ACTION DECK: FULL BATCH OF INSTANT ACTION BUTTONS */}
      <LockScreenMasterActionDeck
        config={formData}
        onApplyConfig={handleApplyUpdate}
        onTriggerLockNow={handleTriggerLockNow}
        onStartCountdownTest={handleStartCountdownTest}
        onOpenPhotoCapture={() => setIsBackgroundCameraModalOpen(true)}
        onTriggerFileInput={() => fileInputRef.current?.click()}
        onOpenExternalUrlDialog={handlePromptExternalUrl}
        onSyncCloudVideos={handleSyncLocalVideosToCloud}
        onSyncFirestorePresets={handleSyncSpiritualPresetsToFirestore}
        onNavigateToDatabase={onNavigateToDatabase}
        onShowToast={onShowToast}
        isSyncingCloud={isSyncingCloud}
        isSyncingPresets={isSyncingPresets}
      />

      {/* 1. PRINCIPAL CONTROLS: ENABLED & INACTIVITY TIMEOUT */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Temporizador de Inactividad</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Determina cuánto tiempo sin movimiento del mouse o pulsaciones de teclas debe pasar para que se active el salvapantallas.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formData.enabled ? 'Activado' : 'Desactivado'}
            </span>
            <button
              type="button"
              onClick={() =>
                handleApplyUpdate({
                  ...formData,
                  enabled: !formData.enabled,
                  updatedAt: Date.now(),
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                formData.enabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  formData.enabled ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* TIMEOUT PRESET SELECTOR */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Tiempo de espera sin uso:
            </label>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold">
              Configurado: {formData.timeoutMinutes >= 1 ? `${formData.timeoutMinutes} min` : `${Math.round(formData.timeoutMinutes * 60)} seg`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {[
              { val: 0.167, label: '10 seg ⚡' },
              { val: 0.5, label: '30 seg' },
              { val: 1, label: '1 min' },
              { val: 2, label: '2 min' },
              { val: 3, label: '3 min' },
              { val: 5, label: '5 min' },
              { val: 10, label: '10 min' },
              { val: 15, label: '15 min' },
            ].map((option) => (
              <button
                key={option.val}
                type="button"
                onClick={() =>
                  handleApplyUpdate({
                    ...formData,
                    timeoutMinutes: option.val,
                    updatedAt: Date.now(),
                  })
                }
                className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                  Math.abs(formData.timeoutMinutes - option.val) < 0.05
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">O ingresa minutos personalizados:</span>
            <input
              type="number"
              min="0.1"
              max="120"
              step="0.5"
              value={formData.timeoutMinutes}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  handleApplyUpdate({
                    ...formData,
                    timeoutMinutes: val,
                    updatedAt: Date.now(),
                  });
                }
              }}
              className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono bg-white dark:bg-slate-850 text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-500">minutos</span>
          </div>
        </div>
      </div>

      {/* 2. CHURCH LOGO & BRANDING ON LOCK SCREEN */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Church className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Logotipo & Encabezado en Pantalla de Bloqueo</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Garantiza que la insignia eclesiástica, el nombre de la congregación y el lema se muestren con total nitidez.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formData.showChurchLogo ? 'Mostrar Logo' : 'Ocultar Logo'}
            </span>
            <button
              type="button"
              onClick={() =>
                handleApplyUpdate({
                  ...formData,
                  showChurchLogo: !formData.showChurchLogo,
                  updatedAt: Date.now(),
                })
              }
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                formData.showChurchLogo ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                  formData.showChurchLogo ? 'left-6.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* LOGO ORIGIN CONTROLS & LIVE PREVIEW */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Fuente del Logotipo:
              </label>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyUpdate({
                      ...formData,
                      showChurchLogo: true,
                      logoUrl: undefined, // Clears lock-screen specific logo to inherit official
                      updatedAt: Date.now(),
                    }, 'Usando logotipo oficial de la iglesia.')
                  }
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    !isUsingCustomLogo
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Church className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Logotipo Oficial de la Iglesia
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Hereda el logotipo principal configurado en la pestaña Ajustes.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {!isUsingCustomLogo ? '✓ Activo' : 'Seleccionar'}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!formData.logoUrl && churchConfig?.logoUrl) {
                      handleApplyUpdate({
                        ...formData,
                        showChurchLogo: true,
                        logoUrl: churchConfig.logoUrl,
                        updatedAt: Date.now(),
                      });
                    }
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isUsingCustomLogo
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Logotipo Exclusivo para Bloqueo
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Sube una insignia especial o versión con fondo transparente.
                    </p>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                    {isUsingCustomLogo ? '✓ Personalizado' : 'Personalizar'}
                  </div>
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS TO UPLOAD OR CHANGE LOGO */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Imagen de tu Dispositivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsLogoPhotoModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tomar Foto / Cámara</span>
                </button>

                {isUsingCustomLogo && (
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyUpdate({
                        ...formData,
                        logoUrl: undefined,
                        updatedAt: Date.now(),
                      }, 'Se restableció el logotipo al oficial de la iglesia.')
                    }
                    className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Restablecer a Oficial</span>
                  </button>
                )}
              </div>

              {/* URL INPUT FOR LOGO */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                  O pega un enlace directo (URL) de la imagen o logo:
                </label>
                <div className="relative">
                  <Link className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    placeholder={churchConfig?.logoUrl || 'https://ejemplo.com/logo.png'}
                    onChange={(e) =>
                      handleApplyUpdate({
                        ...formData,
                        showChurchLogo: true,
                        logoUrl: e.target.value.trim() || undefined,
                        updatedAt: Date.now(),
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* CUSTOM HEADING & SUBHEADING */}
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Iglesia en Bloqueo:
                </label>
                <input
                  type="text"
                  value={formData.customHeading ?? churchConfig?.name ?? 'Iglesia Central Monte Sinaí'}
                  onChange={(e) =>
                    handleApplyUpdate({
                      ...formData,
                      customHeading: e.target.value,
                      updatedAt: Date.now(),
                    })
                  }
                  placeholder="Ej. Iglesia Central Monte Sinaí"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo / Lema en Bloqueo:
                </label>
                <input
                  type="text"
                  value={formData.customSubheading ?? churchConfig?.slogan ?? 'Sistema Central de Gestión & Cobertura Eclesial'}
                  onChange={(e) =>
                    handleApplyUpdate({
                      ...formData,
                      customSubheading: e.target.value,
                      updatedAt: Date.now(),
                    })
                  }
                  placeholder="Ej. Fe, esperanza y amor para la comunidad"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Card Column */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span>Vista Previa del Salvapantallas:</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {formData.backgroundType === 'image'
                  ? '🖼️ Imagen'
                  : formData.backgroundType === 'video'
                  ? '🎬 Video'
                  : '🌈 Gradiente'}
              </span>
            </div>

            <div className="flex-1 p-5 rounded-3xl bg-slate-950 border border-slate-800 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden min-h-[220px]">
              {/* RENDER ACTIVE BACKGROUND IN PREVIEW */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Base Theme Atmosphere */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${activeTheme.gradientClass}`}
                  style={activeTheme.bgStyle}
                />

                {/* Active Image Background */}
                {formData.backgroundType === 'image' && (
                  <img
                    src={formData.mediaUrl || SPIRITUAL_IMAGE_PRESETS[0].imageUrl}
                    alt="Fondo Seleccionado"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      filter: formData.blurAmount > 0 ? `blur(${Math.min(formData.blurAmount, 6)}px)` : undefined,
                    }}
                  />
                )}

                {/* Active Video Background with live playback */}
                {formData.backgroundType === 'video' && (
                  <div className="absolute inset-0 overflow-hidden">
                    {formData.presetVideoId && (
                      <img
                        src={
                          SPIRITUAL_VIDEO_PRESETS.find((p) => p.id === formData.presetVideoId)?.thumbnailUrl ||
                          SPIRITUAL_VIDEO_PRESETS[0].thumbnailUrl
                        }
                        alt="Video Poster"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{
                          filter: formData.blurAmount > 0 ? `blur(${Math.min(formData.blurAmount, 6)}px)` : undefined,
                        }}
                      />
                    )}
                    {previewVideoUrl && (() => {
                      const loopInfo = getBackgroundLoopVideoUrl(previewVideoUrl);
                      if (loopInfo.isIframe) {
                        return (
                          <iframe
                            key={loopInfo.url}
                            src={loopInfo.url}
                            title="Video Preview"
                            className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-110"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            style={{
                              filter: formData.blurAmount > 0 ? `blur(${Math.min(formData.blurAmount, 6)}px)` : undefined,
                            }}
                          />
                        );
                      }
                      return (
                        <video
                          key={previewVideoUrl}
                          src={loopInfo.url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="auto"
                          onLoadedMetadata={(e) => {
                            e.currentTarget.muted = true;
                            e.currentTarget.play().catch(() => {});
                          }}
                          onCanPlay={(e) => {
                            e.currentTarget.muted = true;
                            e.currentTarget.play().catch(() => {});
                          }}
                          className="absolute inset-0 w-full h-full object-cover"
                          style={{
                            filter: formData.blurAmount > 0 ? `blur(${Math.min(formData.blurAmount, 6)}px)` : undefined,
                          }}
                        />
                      );
                    })()}
                  </div>
                )}

                {/* Controlled Darkening Overlay */}
                {formData.backgroundType !== 'gradient' ? (
                  <div
                    className="absolute inset-0 bg-black/40"
                    style={{ opacity: Math.min(formData.videoOpacity ?? 0.3, 0.6) }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-slate-950/20" />
                )}

                {/* Vignette */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-black/20 to-black/60" />
              </div>

              {/* Preview Content Overlay */}
              <div className="relative z-10 space-y-3">
                <div className="flex items-center space-x-3">
                  {formData.showChurchLogo ? (
                    <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 p-1.5 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
                      {effectiveLogo ? (
                        <img
                          src={effectiveLogo}
                          alt="Logo de la Iglesia"
                          className="w-full h-full object-contain drop-shadow"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <Church className="w-6 h-6 text-amber-300" />
                      )}
                    </div>
                  ) : (
                    <div className="p-2 rounded-lg bg-white/10 border border-dashed border-white/20 text-white/50 text-[10px]">
                      Sin Logo
                    </div>
                  )}

                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white tracking-wide truncate flex items-center space-x-1.5">
                      <span>{formData.customHeading || churchConfig?.name || 'Iglesia Central Monte Sinaí'}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[8px] font-mono uppercase bg-indigo-500/40 text-indigo-200 border border-indigo-500/40">
                        Activo
                      </span>
                    </h4>
                    <p className="text-[10px] text-white/80 truncate mt-0.5">
                      {formData.customSubheading || churchConfig?.slogan || 'Salvapantallas Configurado'}
                    </p>
                  </div>
                </div>

                {/* Miniature Clock & Scripture Preview */}
                <div className="text-center py-2 bg-black/25 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="text-2xl font-black text-white tracking-tight font-mono drop-shadow">
                    12:00:00 <span className="text-xs font-sans font-bold text-amber-300">PM</span>
                  </div>
                  <div className="text-[9px] text-white/80 italic line-clamp-1 px-3 mt-0.5">
                    "Jehová es mi pastor; nada me faltará." — Salmos 23:1
                  </div>
                </div>
              </div>

              {/* Direct Lock Button from Developer Tab */}
              <div className="relative z-10 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2">
                <span className="text-[10px] text-white/70">
                  {formData.backgroundType === 'image'
                    ? formData.mediaName || 'Foto Espiritual'
                    : formData.backgroundType === 'video'
                    ? formData.mediaName || 'Video en Movimiento'
                    : activeTheme.name}
                </span>
                <button
                  type="button"
                  onClick={handleTriggerLockNow}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-[10px] shadow-md flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                >
                  <Lock className="w-3 h-3" />
                  <span>Probar Bloqueo Ahora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BACKGROUND SELECTION: GRADIENTS, UPLOADED VIDEOS/PHOTOS, PRESETS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Fondo del Salvapantallas (Videos, Fotos o Gradientes)</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Elige si deseas un video en movimiento en bucle, una fotografía o un degradado con partículas.
          </p>
        </div>

        {/* TABS OF BACKGROUND TYPE */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            {
              id: 'gradient',
              title: '🌈 Gradiente & Partículas',
              desc: 'Degradados espirituales elegantes con partículas flotantes y auroras.',
            },
            {
              id: 'video',
              title: '🎬 Video en Movimiento',
              desc: 'Sube un video de fondo desde tu dispositivo o elige un preset espiritual.',
            },
            {
              id: 'image',
              title: '🖼️ Fotografía / Imagen',
              desc: 'Sube una foto de la congregación, templo o paisaje desde tu dispositivo.',
            },
          ].map((item) => (
            <label
              key={item.id}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                formData.backgroundType === item.id
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 shadow-sm ring-2 ring-purple-500/20'
                  : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div>
                <input
                  type="radio"
                  name="backgroundType"
                  checked={formData.backgroundType === item.id}
                  onChange={() => {
                    const nextType = item.id as LockScreenBackgroundType;
                    const updates: Partial<LockScreenConfig> = {
                      backgroundType: nextType,
                      updatedAt: Date.now(),
                    };
                    if (nextType === 'image') {
                      updates.mediaType = 'image';
                      if (!formData.mediaUrl) {
                        updates.mediaUrl = SPIRITUAL_IMAGE_PRESETS[0].imageUrl;
                        updates.mediaName = SPIRITUAL_IMAGE_PRESETS[0].name;
                      }
                    } else if (nextType === 'video') {
                      updates.mediaType = 'video';
                      if (!formData.presetVideoId) {
                        updates.presetVideoId = SPIRITUAL_VIDEO_PRESETS[0].id;
                        updates.mediaUrl = SPIRITUAL_VIDEO_PRESETS[0].videoUrl;
                        updates.mediaName = SPIRITUAL_VIDEO_PRESETS[0].name;
                      }
                    }
                    handleApplyUpdate(
                      { ...formData, ...updates },
                      `Modo de fondo "${item.title}" activado.`
                    );
                  }}
                  className="sr-only"
                />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400">
                {formData.backgroundType === item.id ? '✓ Seleccionado' : 'Elegir'}
              </div>
            </label>
          ))}
        </div>

        {/* PRESET GALLERY FOR SPIRITUAL IMAGES */}
        {formData.backgroundType === 'image' && (
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Galería de Fondos Espirituales Incorporados:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SPIRITUAL_IMAGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    handleApplyUpdate(
                      {
                        ...formData,
                        backgroundType: 'image',
                        mediaUrl: preset.imageUrl,
                        mediaName: preset.name,
                        mediaType: 'image',
                        updatedAt: Date.now(),
                      },
                      `Fondo de imagen "${preset.name}" aplicado.`
                    )
                  }
                  className={`group relative rounded-2xl overflow-hidden border text-left transition-all cursor-pointer h-28 ${
                    formData.mediaUrl === preset.imageUrl
                      ? 'border-purple-600 ring-4 ring-purple-500/30 shadow-lg'
                      : 'border-slate-200 dark:border-slate-700 hover:border-purple-400'
                  }`}
                >
                  <img
                    src={preset.imageUrl}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2 text-white">
                    <span className="text-[11px] font-bold leading-tight truncate">{preset.name}</span>
                    <span className="text-[9px] text-slate-300 truncate">{preset.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* DEDICATED VIDEO PRESETS SECTION (MY VIDEOS & SPIRITUAL SYSTEM PRESETS) */}
        {formData.backgroundType === 'video' && (
          <div className="p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>Apartado de Presets de Video para Salvapantallas</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Selecciona el video que se proyectará cuando se active el bloqueo de pantalla. Puedes subir tus propios videos o elegir presets espirituales.
                </p>
              </div>

              {/* Upload & URL buttons for custom video preset */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <input
                  ref={videoPresetInputRef}
                  type="file"
                  accept="video/*,.mp4,.webm,.mov,.m4v,.ogv,.mkv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoPresetInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 active:scale-95"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploading ? 'Procesando Video...' : '+ Subir Video Preset'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExternalUrlType('video');
                    setExternalUrlInput('');
                    setExternalUrlName('');
                    setShowUrlModal(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                >
                  <Globe className="w-4 h-4" />
                  <span>+ Video por URL</span>
                </button>
              </div>
            </div>

            {/* TAB SELECTOR: MIS VIDEOS / PRESETS ESPIRITUALES / TODOS */}
            <div className="flex items-center space-x-2 border-b border-indigo-100 dark:border-indigo-900/50 pb-3">
              <button
                type="button"
                onClick={() => setVideoPresetsTab('my_presets')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  videoPresetsTab === 'my_presets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-100/50 dark:hover:bg-slate-800'
                }`}
              >
                <FileVideo className="w-4 h-4" />
                <span>Mis Videos Subidos</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    videoPresetsTab === 'my_presets'
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {customVideoPresets.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoPresetsTab('spiritual_presets')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  videoPresetsTab === 'spiritual_presets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-100/50 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Presets Espirituales (Sistema)</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    videoPresetsTab === 'spiritual_presets'
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {SPIRITUAL_VIDEO_PRESETS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVideoPresetsTab('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  videoPresetsTab === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-indigo-100/50 dark:hover:bg-slate-800'
                }`}
              >
                <span>Ver Todos ({customVideoPresets.length + SPIRITUAL_VIDEO_PRESETS.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: MIS VIDEOS SUBIDOS */}
            {(videoPresetsTab === 'my_presets' || videoPresetsTab === 'all') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileVideo className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Mis Presets de Video Personalizados ({customVideoPresets.length})</span>
                  </h5>
                  {customVideoPresets.length > 0 && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Haz clic en cualquier video para proyectarlo en el salvapantallas
                    </span>
                  )}
                </div>

                {customVideoPresets.length === 0 ? (
                  <div className="p-8 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-white/70 dark:bg-slate-900/60 text-center flex flex-col items-center justify-center space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                      <FileVideo className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        No tienes presets de video subidos aún
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
                        Sube tus propios videos grabados o descargados (MP4, MOV, WebM) para proyectarlos automáticamente cada vez que se bloquee la pantalla.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => videoPresetInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Subir Video Preset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExternalUrlType('video');
                          setExternalUrlInput('');
                          setExternalUrlName('');
                          setShowUrlModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Globe className="w-4 h-4" />
                        <span>+ Video por URL</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customVideoPresets.map((preset) => {
                      const isCurrentlyActive =
                        formData.backgroundType === 'video' &&
                        formData.customVideoPresetId === preset.id;

                      return (
                        <div
                          key={preset.id}
                          className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                            isCurrentlyActive
                              ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 ring-4 ring-indigo-500/30 shadow-xl shadow-indigo-600/20'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                          }`}
                        >
                          {/* VIDEO PREVIEW */}
                          <div className="relative aspect-video rounded-xl bg-black overflow-hidden group">
                            {preset.url ? (
                              <video
                                key={preset.url}
                                src={preset.url}
                                muted
                                playsInline
                                autoPlay
                                loop
                                preload="auto"
                                onLoadedMetadata={(e) => {
                                  e.currentTarget.muted = true;
                                  e.currentTarget.play().catch(() => {});
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                                Sin vista previa
                              </div>
                            )}

                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-bold text-indigo-200 border border-white/10 flex items-center space-x-1">
                              <FileVideo className="w-3 h-3 text-indigo-400" />
                              <span>Mi Video</span>
                            </div>

                            {isCurrentlyActive && (
                              <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wider flex items-center space-x-1 shadow-lg shadow-emerald-500/40 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                <span>PROYECTANDO</span>
                              </div>
                            )}
                          </div>

                          {/* DETAILS & ACTIONS */}
                          <div className="pt-3 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="truncate flex-1">
                                <h6
                                  className="text-xs font-bold text-slate-900 dark:text-white truncate"
                                  title={preset.name}
                                >
                                  {preset.name}
                                </h6>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  {preset.size
                                    ? `${(preset.size / (1024 * 1024)).toFixed(1)} MB`
                                    : 'Video'}{' '}
                                  • {new Date(preset.createdAt).toLocaleDateString()}
                                </p>
                                <div className="flex items-center space-x-1.5 mt-1">
                                  {preset.url && (preset.url.startsWith('http://') || preset.url.startsWith('https://')) ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-[9px] font-bold flex items-center space-x-1 border border-indigo-500/20">
                                      <Globe className="w-2.5 h-2.5" />
                                      <span>URL Web (Multidispositivo)</span>
                                    </span>
                                  ) : preset.serverUrl ? (
                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold flex items-center space-x-1 border border-emerald-500/20">
                                      <Cloud className="w-2.5 h-2.5" />
                                      <span>Nube (PC & Móvil)</span>
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[9px] font-bold flex items-center space-x-1 border border-amber-500/20">
                                      <span>📱 Local en Dispositivo</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteCustomVideoPreset(preset.id, e)}
                                title="Eliminar preset"
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* SELECT / ACTIVE BUTTON */}
                            {isCurrentlyActive ? (
                              <div className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>Activo en Salvapantallas</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectCustomVideoPreset(preset)}
                                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Seleccionar y Proyectar</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PRESETS ESPIRITUALES DEL SISTEMA */}
            {(videoPresetsTab === 'spiritual_presets' || videoPresetsTab === 'all') && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Presets Espirituales del Sistema (3)</span>
                  </h5>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Fondos celestiales y proféticos incorporados
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {SPIRITUAL_VIDEO_PRESETS.map((preset) => {
                    const isCurrentlyActive =
                      formData.backgroundType === 'video' &&
                      formData.presetVideoId === preset.id &&
                      !formData.customVideoPresetId;

                    return (
                      <div
                        key={preset.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                          isCurrentlyActive
                            ? 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 ring-4 ring-indigo-500/30 shadow-xl shadow-indigo-600/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
                        }`}
                      >
                        <div className="relative aspect-video rounded-xl bg-black overflow-hidden group">
                          <img
                            src={preset.thumbnailUrl}
                            alt={preset.name}
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 text-white">
                            <span className="text-xs font-bold leading-tight">{preset.name}</span>
                            <span className="text-[10px] text-slate-300">{preset.description}</span>
                          </div>

                          {isCurrentlyActive && (
                            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black tracking-wider flex items-center space-x-1 shadow-lg shadow-emerald-500/40 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              <span>PROYECTANDO</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2.5">
                          {isCurrentlyActive ? (
                            <div className="w-full py-2 px-3 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Activo en Salvapantallas</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSelectSpiritualVideoPreset(preset)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-indigo-600 hover:text-white dark:bg-slate-800 dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Seleccionar y Proyectar</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* DEVICE UPLOAD SECTION (PHOTOS ONLY WHEN BACKGROUND IS IMAGE) */}
        {formData.backgroundType === 'image' && (
          <div className="p-5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Subir fotografía desde tu dispositivo</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Formatos compatibles: Imágenes (JPG, PNG, WebP) de alta resolución, fotos con cámara o por URL.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                  <span>
                    {isUploading ? 'Procesando imagen...' : 'Elegir Foto'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBackgroundCameraModalOpen(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 hover:bg-purple-200 text-purple-900 dark:text-purple-200 font-bold text-xs border border-purple-300 dark:border-purple-800 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-purple-700 dark:text-purple-300" />
                  <span>Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExternalUrlType('image');
                    setExternalUrlInput('');
                    setExternalUrlName('');
                    setShowUrlModal(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Globe className="w-4 h-4" />
                  <span>Por URL</span>
                </button>
              </div>
            </div>

            {/* PREVIEW OF CURRENTLY UPLOADED IMAGE */}
            {uploadedPreviewUrl && formData.backgroundType === 'image' && (
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-16 h-12 rounded-lg bg-black overflow-hidden shrink-0 relative">
                    <img
                      src={uploadedPreviewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {uploadedFileName || 'Fotografía activa'}
                    </p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Guardada y sincronizada al 100% con Firestore y Base de Datos</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleRemoveUploadedMedia}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* DEDICATED FIRESTORE DATABASE EXPLORER LINK & LIVE MEDIA REPOSITORY CARD */}
        {/* ========================================================================= */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-amber-900/10 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-amber-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-lg space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-2">
                    <span>Base de Datos Firestore: Archivos y Fondos de Salvapantallas</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black tracking-wider uppercase border border-emerald-500/30 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sincronizado 100% en Vivo</span>
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Colección <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold">lockScreenMedia</code> y <code className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono font-bold">system/lockScreenConfig</code> en Firebase.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {onNavigateToDatabase && (
                <button
                  type="button"
                  onClick={() => onNavigateToDatabase('lockScreenMedia')}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  <span>Ver en Base de Datos del Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={handleSyncLocalVideosToCloud}
                disabled={isSyncingCloud}
                title="Sube y sincroniza cualquier video cargado desde tu teléfono o laptop para que se reproduzca en todos tus dispositivos"
                className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <UploadCloud className={`w-4 h-4 ${isSyncingCloud ? 'animate-bounce' : ''}`} />
                <span>{isSyncingCloud ? 'Sincronizando...' : 'Sincronizar Videos (Teléfono ➔ PC)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncSpiritualPresetsToFirestore}
                disabled={isSyncingPresets}
                className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-4 h-4 text-amber-500 ${isSyncingPresets ? 'animate-spin' : ''}`} />
                <span>{isSyncingPresets ? 'Sincronizando Presets...' : 'Sincronizar Presets Espirituales'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToFirebase}
                disabled={isSavingToFirebase}
                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSavingToFirebase ? 'animate-spin' : ''}`} />
                <span>Forzar Guardado 100%</span>
              </button>
            </div>
          </div>

          {/* FIRESTORE MEDIA GALLERY CAROUSEL/GRID */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Archivos Registrados en Firestore ({firestoreMediaList.length}):
              </span>
              <span>
                Cualquier cambio o subida aquí se almacena instantáneamente en Firestore y en la base de datos local.
              </span>
            </div>

            {firestoreMediaList.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-dashed border-indigo-200 dark:border-indigo-900/60 text-center space-y-3">
                <Database className="w-8 h-8 text-indigo-400 mx-auto" />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Aún no hay archivos registrados en la colección <code className="font-mono text-indigo-500">lockScreenMedia</code>.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sube una foto o video desde los botones de arriba, o pulsa "Sincronizar Presets Espirituales" para almacenar todos los fondos en la base de datos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncSpiritualPresetsToFirestore}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sincronizar Presets Ahora</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
                {firestoreMediaList.map((item) => {
                  const isCurrentlyActive =
                    (formData.mediaName === item.name) ||
                    (item.type === 'video' && formData.backgroundType === 'video' && (formData.mediaUrl === item.url || (formData.presetVideoId && item.id.includes(formData.presetVideoId)))) ||
                    (item.type === 'image' && formData.backgroundType === 'image' && (formData.mediaUrl === item.url || formData.mediaName === item.name));

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                        isCurrentlyActive
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/30 shadow-md'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div>
                        <div className="relative aspect-video rounded-xl bg-black overflow-hidden group">
                          {item.thumbnail || item.url ? (
                            <img
                              src={item.thumbnail || item.url}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                              {item.type === 'video' ? <Video className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                            </div>
                          )}

                          <div className="absolute top-1.5 left-1.5 flex items-center space-x-1">
                            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider flex items-center space-x-1">
                              {item.type === 'video' ? <Video className="w-2.5 h-2.5 text-indigo-400" /> : <ImageIcon className="w-2.5 h-2.5 text-purple-400" />}
                              <span>{item.type === 'video' ? 'Video' : 'Imagen'}</span>
                            </span>
                          </div>

                          {isCurrentlyActive && (
                            <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-wider flex items-center space-x-1 shadow-md shadow-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              <span>ACTIVO</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-2.5 space-y-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                            {item.name}
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="capitalize">{item.source === 'device_upload' ? 'Dispositivo' : item.source === 'camera_capture' ? 'Cámara' : item.source === 'external_url' ? 'URL' : 'Preset'}</span>
                            {item.sizeFormatted && <span className="font-mono">{item.sizeFormatted}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 flex items-center space-x-1.5">
                        {isCurrentlyActive ? (
                          <div className="flex-1 py-1.5 px-2 rounded-xl bg-emerald-600/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] flex items-center justify-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Proyectando</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectFirestoreMediaItem(item)}
                            className="flex-1 py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] flex items-center justify-center space-x-1 shadow transition-all cursor-pointer active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Proyectar</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteFirestoreMediaItem(item.id, item.name, e)}
                          title="Eliminar de Firestore"
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-300 transition-all cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SLIDERS: OPACITY & BLUR & AUDIO */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Oscurecimiento del fondo:</span>
              <span className="font-mono">{Math.round((formData.videoOpacity ?? 0.6) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={formData.videoOpacity ?? 0.6}
              onChange={(e) =>
                handleApplyUpdate({
                  ...formData,
                  videoOpacity: parseFloat(e.target.value),
                  updatedAt: Date.now(),
                })
              }
              className="w-full accent-purple-600"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Asegura un contraste óptimo para que la hora y los versículos sean perfectamente legibles.
            </p>
          </div>

          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Desenfoque ambiental (Blur):</span>
              <span className="font-mono">{formData.blurAmount ?? 0}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={formData.blurAmount ?? 0}
              onChange={(e) =>
                handleApplyUpdate({
                  ...formData,
                  blurAmount: parseInt(e.target.value, 10),
                  updatedAt: Date.now(),
                })
              }
              className="w-full accent-purple-600"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Añade un elegante efecto de cristal esmerilado cinematográfico al fondo.
            </p>
          </div>

          {/* AUDIO EN SALVAPANTALLAS */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                  {formData.videoMuted ? (
                    <VolumeX className="w-4 h-4 text-slate-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-500 animate-pulse" />
                  )}
                  <span>Audio del Video:</span>
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    formData.videoMuted
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {formData.videoMuted ? 'Silenciado' : 'Con Sonido'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Reproduce el sonido de YouTube, Facebook, enlaces web o videos subidos al bloquear.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextMuted = !(formData.videoMuted ?? true);
                handleApplyUpdate(
                  {
                    ...formData,
                    videoMuted: nextMuted,
                    updatedAt: Date.now(),
                  },
                  nextMuted ? '🔇 Audio de videos silenciado.' : '🔊 Audio de videos activado en salvapantallas.'
                );
              }}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm active:scale-95 ${
                formData.videoMuted
                  ? 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
              }`}
            >
              {formData.videoMuted ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Activar Sonido del Video</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Silenciar Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 4. THEME COLORS & ANIMATIONS */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Paleta de Colores & Estilo Espiritual</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personaliza los tonos celestiales y degradados del salvapantallas.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(THEME_COLOR_PRESETS) as LockScreenTheme[]).map((themeKey) => {
            const themeItem = THEME_COLOR_PRESETS[themeKey];
            const isSelected = formData.theme === themeKey;
            return (
              <button
                key={themeKey}
                type="button"
                onClick={() =>
                  handleApplyUpdate(
                    {
                      ...formData,
                      theme: themeKey,
                      updatedAt: Date.now(),
                    },
                    `Tema espiritual "${themeItem.name}" aplicado.`
                  )
                }
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-purple-500 shadow-md ring-2 ring-purple-500/30 bg-purple-50/70 dark:bg-purple-950/50'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:border-slate-300'
                }`}
              >
                {/* Visual Gradient Box */}
                <div
                  className={`w-full h-12 rounded-xl mb-2.5 overflow-hidden shadow-inner relative flex items-center justify-center bg-gradient-to-br ${themeItem.gradientClass}`}
                  style={themeItem.bgStyle}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <span className="relative z-10 text-[10px] font-bold text-white drop-shadow">
                    {themeItem.name.split(' ')[0]} {themeItem.name.split(' ')[1] || ''}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {themeItem.name}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      ✓ Activo
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                  {themeItem.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* CUSTOM COLOR PICKERS IF 'custom_color' IS SELECTED */}
        {formData.theme === 'custom_color' && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Primario:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.primaryColor || '#4f46e5'}
                  onChange={(e) =>
                    handleApplyUpdate({ ...formData, primaryColor: e.target.value, updatedAt: Date.now() })
                  }
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600"
                />
                <input
                  type="text"
                  value={formData.primaryColor || '#4f46e5'}
                  onChange={(e) =>
                    handleApplyUpdate({ ...formData, primaryColor: e.target.value, updatedAt: Date.now() })
                  }
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Color Secundario:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.secondaryColor || '#7c3aed'}
                  onChange={(e) =>
                    handleApplyUpdate({ ...formData, secondaryColor: e.target.value, updatedAt: Date.now() })
                  }
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300 dark:border-slate-600"
                />
                <input
                  type="text"
                  value={formData.secondaryColor || '#7c3aed'}
                  onChange={(e) =>
                    handleApplyUpdate({ ...formData, secondaryColor: e.target.value, updatedAt: Date.now() })
                  }
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 font-mono bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* ANIMATION STYLES */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Efecto de Animación Dinámica:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { id: 'particles', label: '✨ Chispas Celestiales' },
              { id: 'aurora_waves', label: '🌊 Ondas de Aurora' },
              { id: 'celestial_stars', label: '⭐ Cielo Estrellado' },
              { id: 'subtle_pulse', label: '💫 Pulso Armónico' },
              { id: 'none', label: '🚫 Sin Animación' },
            ].map((anim) => (
              <button
                key={anim.id}
                type="button"
                onClick={() =>
                  handleApplyUpdate({
                    ...formData,
                    animationType: anim.id as LockScreenAnimation,
                    updatedAt: Date.now(),
                  })
                }
                className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center cursor-pointer ${
                  formData.animationType === anim.id
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {anim.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. ON-SCREEN ELEMENTS & SECURITY / UNLOCK PIN */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Elementos en Pantalla & Modo de Desbloqueo</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configura la información visual mostrada y el nivel de seguridad al desbloquear.
          </p>
        </div>

        {/* TOGGLES */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { key: 'showClock', label: 'Mostrar Reloj Digital' },
            { key: 'showDate', label: 'Mostrar Fecha Completa' },
            { key: 'showVerse', label: 'Mostrar Versículo Bíblico' },
            { key: 'showChurchLogo', label: 'Mostrar Logo de la Iglesia' },
            { key: 'showSystemStatus', label: 'Mostrar Estado de Firebase' },
          ].map((item) => (
            <label
              key={item.key}
              className="flex items-center space-x-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={(formData as any)[item.key] ?? true}
                onChange={(e) =>
                  handleApplyUpdate({
                    ...formData,
                    [item.key]: e.target.checked,
                    updatedAt: Date.now(),
                  })
                }
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {item.label}
              </span>
            </label>
          ))}
        </div>

        {/* SECURITY & UNLOCK PIN */}
        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Modo de Desbloqueo de Pantalla</span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ¿Debe solicitarse contraseña para volver al sistema o solo un clic rápido?
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {formData.requirePasswordToUnlock ? 'Requiere Contraseña/PIN' : 'Desbloqueo con 1 clic'}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleApplyUpdate({
                    ...formData,
                    requirePasswordToUnlock: !formData.requirePasswordToUnlock,
                    updatedAt: Date.now(),
                  })
                }
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  formData.requirePasswordToUnlock ? 'bg-amber-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                    formData.requirePasswordToUnlock ? 'left-6.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {formData.requirePasswordToUnlock && (
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  PIN Rápido de Desbloqueo (Opcional):
                </label>
                <input
                  type="text"
                  value={formData.unlockPin || '3755'}
                  onChange={(e) =>
                    handleApplyUpdate({
                      ...formData,
                      unlockPin: e.target.value,
                      updatedAt: Date.now(),
                    })
                  }
                  placeholder="Ej. 3755"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono text-slate-800 dark:text-slate-200"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  También es válida la contraseña del usuario actualmente logueado o el PIN del desarrollador (3755).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM SAVE BUTTON */}
        <div className="pt-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleTriggerLockNow}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Probar Salvapantallas Ahora</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToFirebase}
            disabled={isSavingToFirebase}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <Database className={`w-4 h-4 ${isSavingToFirebase ? 'animate-spin' : ''}`} />
            <span>{isSavingToFirebase ? 'Guardando en Firebase...' : 'Guardar Todo en Firebase'}</span>
          </button>
        </div>
      </div>

      {/* MODAL FOR LOGO CAMERA PHOTO CAPTURE */}
      <PhotoCaptureModal
        isOpen={isLogoPhotoModalOpen}
        onClose={() => setIsLogoPhotoModalOpen(false)}
        onPhotoSelected={(photoUrl) => {
          setIsLogoPhotoModalOpen(false);
          handleApplyUpdate({
            ...formData,
            showChurchLogo: true,
            logoUrl: photoUrl,
            updatedAt: Date.now(),
          }, 'Logotipo capturado con cámara aplicado a la pantalla de bloqueo.');
        }}
        currentPhotoUrl={formData.logoUrl || churchConfig?.logoUrl}
        title="Capturar o Subir Logotipo"
        subtitle="Usa la cámara de tu dispositivo o selecciona una fotografía del logotipo de la congregación."
      />

      {/* MODAL FOR BACKGROUND CAMERA PHOTO CAPTURE */}
      <PhotoCaptureModal
        isOpen={isBackgroundCameraModalOpen}
        onClose={() => setIsBackgroundCameraModalOpen(false)}
        onPhotoSelected={(photoUrl) => handleBackgroundPhotoCaptured(photoUrl)}
        title="Tomar Fotografía con Cámara para Fondo"
        subtitle="Captura una imagen en vivo con la cámara de tu dispositivo para usarla como salvapantallas y sincronizarla en Firestore."
      />

      {/* MODAL FOR EXTERNAL MEDIA URL (VIDEO OR IMAGE) */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {externalUrlType === 'video' ? 'Añadir Video por Enlace URL' : 'Añadir Imagen por Enlace URL'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Se registrará en la base de datos Firestore y se proyectará en el salvapantallas.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre descriptivo del fondo:
                </label>
                <input
                  type="text"
                  value={externalUrlName}
                  onChange={(e) => setExternalUrlName(e.target.value)}
                  placeholder={externalUrlType === 'video' ? 'Ej. Nubes y Gloria Celestial HD' : 'Ej. Paisaje Monte Sinaí'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    {externalUrlType === 'video'
                      ? 'Enlace URL del video (YouTube, Facebook, TikTok, Instagram, Vimeo, Drive, MP4):'
                      : 'URL de la imagen (JPG, PNG, WebP):'}
                  </label>
                  {externalUrlType === 'video' && externalUrlInput && parseUniversalVideo(externalUrlInput).isValid && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {parseUniversalVideo(externalUrlInput).platformLabel}
                    </span>
                  )}
                </div>
                <input
                  type="url"
                  value={externalUrlInput}
                  onChange={(e) => setExternalUrlInput(e.target.value)}
                  placeholder={
                    externalUrlType === 'video'
                      ? 'https://www.youtube.com/..., Facebook, TikTok, Instagram o archivo .mp4'
                      : 'https://ejemplo.com/recursos/fondo.jpg'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 font-mono"
                />

                {/* Quick samples for video */}
                {externalUrlType === 'video' && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-medium">Ejemplos para probar:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalUrlInput('https://www.youtube.com/watch?v=k1-TrAvp_xs');
                        if (!externalUrlName) setExternalUrlName('Video Musical en Vivo HD');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer"
                    >
                      YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalUrlInput('https://www.facebook.com/watch/?v=10153231379946729');
                        if (!externalUrlName) setExternalUrlName('Video Comunitario Facebook');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer"
                    >
                      Facebook
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalUrlInput('https://www.tiktok.com/@scout2015/video/6718335390845095173');
                        if (!externalUrlName) setExternalUrlName('Video de Mascotas en TikTok (Scout)');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-cyan-300 text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                    >
                      TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalUrlInput('https://www.instagram.com/reel/C8xYz123456/');
                        if (!externalUrlName) setExternalUrlName('Reel Instagram');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-pink-600 dark:text-pink-400 text-[10px] font-bold hover:opacity-80 cursor-pointer border border-pink-500/20"
                    >
                      Instagram
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExternalUrlInput('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                        if (!externalUrlName) setExternalUrlName('Fondo de Fuego Celestial MP4');
                      }}
                      className="px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer"
                    >
                      MP4 Directo
                    </button>
                  </div>
                )}

                {/* Live video preview in modal */}
                {externalUrlType === 'video' && externalUrlInput.trim() && (
                  <div className="mt-3 p-3 rounded-2xl bg-slate-950 text-white border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center space-x-1.5">
                        <Play className="w-3.5 h-3.5 text-indigo-400 fill-current" />
                        <span>Vista Previa del Video ({parseUniversalVideo(externalUrlInput).platformLabel})</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400">
                        Compatible con salvapantallas
                      </span>
                    </div>
                    <UniversalVideoPlayer
                      url={externalUrlInput}
                      title={externalUrlName || 'Vista previa'}
                      autoPlay={false}
                      controls={true}
                      showBadge={true}
                      className="max-h-52"
                    />

                    {/* Guía interactiva si el usuario pegó un enlace de Facebook (especialmente /share/v/ o /share/r/) */}
                    {(externalUrlInput.includes('facebook.com') || externalUrlInput.includes('fb.watch')) && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-blue-950/80 border border-blue-800/80 text-left space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-bold text-blue-200">
                                ¿Dice «Video no disponible» en la vista previa de Facebook?
                              </p>
                              <p className="text-[10px] text-blue-300/90 leading-relaxed mt-0.5">
                                Facebook restringe la reproducción en sitios web si el enlace es de la app móvil (<code>/share/v/</code>) o si el video no es público.
                              </p>
                            </div>
                          </div>
                          <a
                            href={externalUrlInput}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-sm cursor-pointer"
                          >
                            <span>Abrir video ↗</span>
                          </a>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-900/90 border border-blue-900/60 text-[10px] space-y-1 text-slate-300">
                          <p className="font-semibold text-blue-300">
                            💡 Solución en 2 pasos para que se reproduzca aquí:
                          </p>
                          <p>
                            <strong>1. Copiar enlace directo:</strong> Toca el botón <em>«Abrir video ↗»</em> arriba. En la barra de tu navegador copia la dirección final (formato <code>facebook.com/watch/?v=...</code> o <code>facebook.com/reel/...</code>) y pégala en este campo.
                          </p>
                          <p>
                            <strong>2. Privacidad pública:</strong> El video debe ser <strong>Público</strong> (ícono de mundo 🌍 en Facebook). Videos de grupos cerrados o de amigos no permiten verse en otras páginas.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Guía interactiva si el usuario pegó un enlace de TikTok */}
                    {externalUrlInput.includes('tiktok.com') && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-pink-500/40 text-left space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2">
                            <Info className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-bold text-pink-200">
                                ¿Dice «Este vídeo no está disponible» en TikTok?
                              </p>
                              <p className="text-[10px] text-slate-300 leading-relaxed mt-0.5">
                                TikTok restringe la reproducción si el video fue marcado como privado por su autor, si fue borrado o si proviene de un enlace corto móvil (<code>vm.tiktok.com</code>) sin resolver.
                              </p>
                            </div>
                          </div>
                          <a
                            href={externalUrlInput}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-black text-cyan-300 border border-pink-500/40 hover:bg-slate-800 text-[10px] font-bold flex items-center space-x-1 shrink-0 shadow-sm cursor-pointer"
                          >
                            <span>Abrir TikTok ↗</span>
                          </a>
                        </div>

                        <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] space-y-1 text-slate-300">
                          <p className="font-semibold text-pink-300">
                            💡 Consejos para que TikTok se reproduzca correctamente:
                          </p>
                          <p>
                            <strong>1. Video público:</strong> Abre el video en TikTok y asegúrate de que sea 100% público (no cuenta privada ni video sólo para amigos).
                          </p>
                          <p>
                            <strong>2. Permiso de inserción del autor:</strong> En TikTok, los creadores pueden activar o desactivar la opción <em>«Permitir inserción»</em> en ajustes de privacidad. Si está restringido por el autor, abre el video directamente con el botón superior.
                          </p>
                          <p>
                            <strong>3. Autoguardado:</strong> Al pulsar <em>«Guardar y Activar Fondo Remoto»</em>, nuestro servidor consulta automáticamente a TikTok para resolver el título y la miniatura oficial.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {externalUrlType === 'video'
                    ? 'Acepta enlaces de YouTube, Facebook, Instagram, TikTok, X (Twitter), Vimeo, Google Drive y archivos directos MP4/WebM.'
                    : 'Asegúrate de que la URL sea accesible públicamente y termine en formato de imagen compatible.'}
                </p>

                {/* AUDIO PREFERENCE SWITCH FOR THE VIDEO URL */}
                {externalUrlType === 'video' && (
                  <div className="mt-3 p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        {externalUrlEnableAudio ? (
                          <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                        ) : (
                          <VolumeX className="w-4 h-4 text-slate-400" />
                        )}
                        <span>¿Reproducir con sonido en el salvapantallas?</span>
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {externalUrlEnableAudio
                          ? '🔊 El video se proyectará con audio activo al bloquear la pantalla.'
                          : '🔇 El video se proyectará en silencio (puedes activar el audio en cualquier momento).'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExternalUrlEnableAudio(!externalUrlEnableAudio)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm ${
                        externalUrlEnableAudio
                          ? 'bg-emerald-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {externalUrlEnableAudio ? '🔊 Con Sonido' : '🔇 Sin Sonido'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddExternalUrlMedia}
                disabled={isAddingExternalUrl || !externalUrlInput.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isAddingExternalUrl ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Database className="w-3.5 h-3.5" />
                )}
                <span>{isAddingExternalUrl ? 'Guardando en Base de Datos...' : 'Guardar en Base de Datos y Proyectar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL - 100% FUNCTIONAL IN IFRAMES & DESKTOP */}
      {itemToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {itemToDelete.title || '¿Eliminar archivo permanentemente?'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción eliminará el archivo de la base de datos Firestore y del almacenamiento local del dispositivo.
                </p>
              </div>
            </div>

            {/* ITEM PREVIEW CARD */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
              {itemToDelete.thumbnail || itemToDelete.url ? (
                <div className="w-16 h-12 rounded-xl bg-black overflow-hidden shrink-0">
                  <img
                    src={itemToDelete.thumbnail || itemToDelete.url}
                    alt={itemToDelete.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FileVideo className="w-6 h-6" />
                </div>
              )}
              <div className="truncate flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {itemToDelete.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">
                  {itemToDelete.type === 'custom_video_preset'
                    ? 'Preset de Video Personalizado'
                    : itemToDelete.type === 'firestore_media'
                    ? 'Fondo Registrado en Firestore'
                    : 'Fotografía Subida'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <span>
                Si este fondo está actualmente activo en el salvapantallas, se cambiará automáticamente a un fondo predeterminado seguro para evitar pantallas en blanco.
              </span>
            </div>

            <div className="flex justify-end items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeletingMedia}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeletingMedia}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeletingMedia ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingMedia ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
