import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  User,
  X,
  Check,
  RotateCw,
  Sparkles,
  AlertCircle,
  Image as ImageIcon,
  CheckCircle2,
  SwitchCamera,
  Smartphone,
} from 'lucide-react';

interface PhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (photoUrl: string) => void;
  currentPhotoUrl?: string;
  title?: string;
  subtitle?: string;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
];

/**
 * Resizes and compresses an image data URL or File to a lightweight, crisp JPEG DataURL (max 600x600, ~40-70KB)
 * to prevent localStorage quota exhaustion, Firestore document size limits, and browser render freezes.
 */
function compressImageFile(file: File, maxWidth = 600, maxHeight = 600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  onPhotoSelected,
  currentPhotoUrl,
  title = 'Foto de Perfil / Ficha',
  subtitle = 'Sube una foto desde tu dispositivo o tómate una foto con la cámara en vivo',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets'>('upload');
  const [previewPhoto, setPreviewPhoto] = useState<string>(currentPhotoUrl || '');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {
        // Ignore pause errors
      }
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start camera helper with multiple constraint fallbacks
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    setCameraError(null);
    setCapturedSnapshot(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara en vivo en navegador no está soportada. Por favor utiliza la opción "Subir Archivo" o "Cámara del Celular".');
      }

      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 },
          },
          audio: false,
        });
      } catch {
        // Fallback for devices without strict facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (innerErr) {
          throw innerErr;
        }
      }

      if (!stream) throw new Error('No se pudo obtener el flujo de video.');

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((playErr) => {
            console.warn('Video play warning:', playErr);
          });
        };
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        'No se pudo abrir la cámara web en vivo. Puedes pulsar "Cámara del Celular" o "Subir Archivo" para tomar una foto directamente con la aplicación de tu dispositivo.'
      );
      setIsCameraActive(false);
    }
  };

  const handleToggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  useEffect(() => {
    if (isOpen) {
      setPreviewPhoto(currentPhotoUrl || '');
      setCapturedSnapshot(null);
      setCameraError(null);
      if (activeTab === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Take Snapshot from Camera
  const handleCaptureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const vWidth = video.videoWidth || 480;
    const vHeight = video.videoHeight || 480;
    const size = Math.min(vWidth, vHeight) || 400;

    canvas.width = 400;
    canvas.height = 400;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crop center square
    const startX = (vWidth - size) / 2;
    const startY = (vHeight - size) / 2;

    if (facingMode === 'user') {
      // Flip horizontally for selfie mirror effect
      ctx.translate(400, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, startX, startY, size, size, 0, 0, 400, 400);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedSnapshot(dataUrl);
    setPreviewPhoto(dataUrl);
    stopCamera();
  };

  // Handle File Input from device with automatic compression & resizing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).');
      return;
    }

    setIsProcessingFile(true);
    try {
      const compressedDataUrl = await compressImageFile(file, 600, 600, 0.85);
      setPreviewPhoto(compressedDataUrl);
      setCapturedSnapshot(null);
    } catch (err) {
      console.error('Error procesando imagen:', err);
      alert('Hubo un problema al procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsProcessingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleConfirm = () => {
    onPhotoSelected(previewPhoto);
    stopCamera();
    onClose();
  };

  const handleRemovePhoto = () => {
    setPreviewPhoto('');
    setCapturedSnapshot(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{title}</h3>
              <p className="text-xs text-indigo-100/90 leading-tight">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              stopCamera();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Subir Archivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Cámara en Vivo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('presets');
              stopCamera();
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avatares</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Active Tab: UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4 text-center">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Regular File Upload */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-300 dark:border-indigo-800/80 rounded-2xl p-5 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-11 h-11 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      Galería / Archivos
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Selecciona una foto guardada en tu dispositivo
                    </p>
                  </div>
                </div>

                {/* Native Device Camera Trigger */}
                <div
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="border-2 border-dashed border-purple-300 dark:border-purple-800/80 rounded-2xl p-5 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-all cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-11 h-11 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-300 flex items-center justify-center shadow-xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                      Cámara del Celular
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Abre la app nativa de cámara de tu teléfono
                    </p>
                  </div>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={nativeCameraInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleFileChange}
                className="hidden"
              />

              {isProcessingFile && (
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center space-x-2 animate-pulse">
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Optimizando y ajustando resolución de imagen...</span>
                </div>
              )}

              {previewPhoto && (
                <div className="flex flex-col items-center space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Foto Seleccionada:
                  </p>
                  <img
                    src={previewPhoto}
                    alt="Preview"
                    className="w-28 h-28 rounded-full object-cover ring-4 ring-indigo-500/30 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                  >
                    Quitar foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Tab: CAMERA */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              {cameraError ? (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs space-y-3">
                  <div className="flex items-center space-x-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Aviso de Acceso a Cámara</span>
                  </div>
                  <p className="leading-relaxed">{cameraError}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Reintentar Web</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => nativeCameraInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer flex items-center space-x-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Usar Cámara Nativa del Teléfono</span>
                    </button>
                  </div>
                </div>
              ) : capturedSnapshot ? (
                <div className="flex flex-col items-center space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
                  <div className="relative">
                    <img
                      src={capturedSnapshot}
                      alt="Foto tomada"
                      className="w-40 h-40 rounded-full object-cover ring-4 ring-emerald-500/40 shadow-lg"
                    />
                    <div className="absolute bottom-1 right-1 p-1 rounded-full bg-emerald-500 text-white shadow-md">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    ¡Foto capturada y optimizada exitosamente!
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedSnapshot(null);
                      startCamera();
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Tomar otra foto</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-slate-950 border-2 border-indigo-500/50 shadow-inner flex items-center justify-center">
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      autoPlay
                      className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                    />
                    {/* Face Guide Ring Overlay */}
                    <div className="absolute inset-4 rounded-full border-2 border-white/40 border-dashed pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] text-white/70 font-semibold bg-black/40 px-2 py-0.5 rounded-full">
                        Encuadra el rostro
                      </span>
                    </div>

                    {/* Camera switch button */}
                    <button
                      type="button"
                      onClick={handleToggleCameraFacing}
                      className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white shadow-md transition-all cursor-pointer"
                      title="Cambiar Cámara Frontal / Trasera"
                    >
                      <SwitchCamera className="w-4 h-4" />
                    </button>
                  </div>

                  <canvas ref={canvasRef} className="hidden" />

                  <button
                    type="button"
                    onClick={handleCaptureSnapshot}
                    disabled={!isCameraActive}
                    className={`px-6 py-2.5 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-lg transition-all flex items-center space-x-2 cursor-pointer ${
                      isCameraActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                        : 'bg-slate-400 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capturar Foto Ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Tab: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Selecciona uno de los avatares predeterminados para la membresía:
              </p>
              <div className="grid grid-cols-5 gap-2.5">
                {PRESET_AVATARS.map((url, idx) => {
                  const isSelected = previewPhoto === url;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPreviewPhoto(url);
                        setCapturedSnapshot(null);
                      }}
                      className={`relative rounded-2xl overflow-hidden border-2 aspect-square transition-all cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 ring-2 ring-indigo-500/40 scale-105'
                          : 'border-transparent hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/30 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white font-bold stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar y Guardar Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};

