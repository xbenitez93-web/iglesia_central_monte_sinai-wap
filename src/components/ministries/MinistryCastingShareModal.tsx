import React, { useState, useRef } from 'react';
import {
  MinistryCastingCall,
  ChurchConfig,
} from '../../types';
import {
  X,
  Share2,
  Printer,
  Copy,
  Check,
  Image as ImageIcon,
  FileText,
  Upload,
  Sparkles,
  Music,
  Heart,
  Shield,
  Theater,
  Church,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  Calendar,
  Clock,
  MapPin,
  Star,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MinistryCastingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  casting: MinistryCastingCall;
  ministryName: string;
  ministry: string;
  pageColor: string;
  config?: ChurchConfig;
}

export const MinistryCastingShareModal: React.FC<MinistryCastingShareModalProps> = ({
  isOpen,
  onClose,
  casting,
  ministryName,
  ministry,
  pageColor,
  config,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const ministryFileInputRef = useRef<HTMLInputElement>(null);
  const systemFileInputRef = useRef<HTMLInputElement>(null);

  // Customization state
  const [showLogos, setShowLogos] = useState(true);
  const [customMinistryLogoUrl, setCustomMinistryLogoUrl] = useState<string | null>(null);
  const [customSystemLogoUrl, setCustomSystemLogoUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [previewScale, setPreviewScale] = useState<number>(1);

  if (!isOpen) return null;

  // Compute metrics
  const roles = casting.rolesNeeded || [];
  const candidates = casting.candidates || [];
  const titularsCount = candidates.filter((c) => c.status === 'Seleccionado (Titular)').length;
  const substitutesCount = candidates.filter((c) => c.status === 'Suplente / Cover').length;
  const inEvaluationCount = candidates.filter((c) => c.status === 'En Evaluación').length;
  const coveragePercent = roles.length > 0 ? Math.min(100, Math.round((titularsCount / roles.length) * 100)) : 100;

  // Ministry Emblem / Icon fallback
  const getMinistryIcon = () => {
    switch (ministry) {
      case 'worship':
        return <Music className="w-7 h-7 text-white" />;
      case 'dance':
        return <Sparkles className="w-7 h-7 text-white" />;
      case 'women':
        return <Heart className="w-7 h-7 text-white" />;
      case 'ushers':
        return <Shield className="w-7 h-7 text-white" />;
      case 'theater':
        return <Theater className="w-7 h-7 text-white" />;
      default:
        return <Church className="w-7 h-7 text-white" />;
    }
  };

  // Resolved Ministry Custom Banner & Logo
  const customBannerConfig = config?.customBanners?.[ministry];
  const activeMinistryLogo =
    customMinistryLogoUrl ||
    customBannerConfig?.logoUrl ||
    config?.ministryLogos?.[ministry] ||
    '';

  // Resolved System / Main Church Logo
  const activeSystemLogo =
    customSystemLogoUrl ||
    config?.logoUrl ||
    '';

  // Handle Logo Upload from device for Ministry
  const handleMinistryLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomMinistryLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Logo Upload from device for System / Church
  const handleSystemLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomSystemLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Export as High Resolution PDF (US Letter Format: 215.9 x 279.4 mm)
  const handleExportPDF = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportMessage('Generando documento PDF en tamaño Carta...');

    try {
      const imgData = await toJpeg(documentRef.current, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'none',
          margin: '0 auto',
        },
      });

      const img = new Image();
      img.src = imgData;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      const imgWidth = img.naturalWidth || 800;
      const imgHeight = img.naturalHeight || 1100;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'letter', // 215.9 x 279.4 mm
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const margin = 6;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (imgHeight * printWidth) / imgWidth;

      if (printHeight <= pdfHeight - margin * 2) {
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      } else {
        let heightLeft = printHeight;
        let position = margin;

        pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
        heightLeft -= pdfHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - printHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
          heightLeft -= pdfHeight - margin * 2;
        }
      }

      const safeTitle = casting.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      pdf.save(`Casting_${ministry}_${safeTitle}.pdf`);
      setExportMessage('¡PDF exportado con éxito!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setExportMessage('Error al exportar PDF. Intenta de nuevo.');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export as High Resolution JPG Image
  const handleExportJPG = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);
    setExportMessage('Generando imagen JPG en alta resolución...');

    try {
      const imgUrl = await toJpeg(documentRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'none',
          margin: '0 auto',
        },
      });

      const link = document.createElement('a');
      const safeTitle = casting.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      link.download = `Casting_${ministry}_${safeTitle}.jpg`;
      link.href = imgUrl;
      link.click();

      setExportMessage('¡Imagen JPG descargada con éxito!');
      setTimeout(() => setExportMessage(null), 3000);
    } catch (error) {
      console.error('Error generating JPG image:', error);
      setExportMessage('Error al exportar imagen. Intenta de nuevo.');
      setTimeout(() => setExportMessage(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Direct Print
  const handlePrint = () => {
    window.print();
  };

  // 4. Copy Clean Summary Text for WhatsApp / Telegram
  const handleCopyText = () => {
    const assignedSummary = roles
      .map((r) => {
        const titular = candidates.find((c) => c.status === 'Seleccionado (Titular)' && (c.assignedRole === r.roleName || c.applyingRole === r.roleName));
        return `• *${r.roleName}* (${r.characterType}): ${titular ? titular.name : 'Por asignar'}`;
      })
      .join('\n');

    const text = `🎭 *CONVOCATORIA & AUDICIONES*\n🏛️ *${config?.name || 'Iglesia Central'}* - ${ministryName}\n\n📌 *Convocatoria:* ${casting.title}\n${casting.playTitle ? `🎬 *Proyecto / Obra:* ${casting.playTitle}\n` : ''}👤 *Director/Evaluador:* ${casting.director}\n🗓️ *Fecha:* ${casting.date} • ⏰ *Hora:* ${casting.time}\n📍 *Lugar:* ${casting.location}\n⚡ *Estado:* ${casting.status}\n\n🎭 *Roles / Puestos Requeridos:*\n${assignedSummary || 'Ver convocatoria completa'}\n\n${casting.requirements ? `📋 *Requisitos:* ${casting.requirements}\n` : ''}${casting.auditionScriptSnippet ? `📜 *Pauta / Texto de Audición:* ${casting.auditionScriptSnippet}\n` : ''}${casting.youtubeReferenceUrl ? `🎥 *Video de Referencia:* ${casting.youtubeReferenceUrl}\n` : ''}\nGenerado desde el Sistema Eclesial Digital.`;

    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 rounded-2xl sm:rounded-3xl max-w-5xl w-full h-[94vh] max-h-[94vh] flex flex-col shadow-2xl border border-slate-700 overflow-hidden">
        
        {/* Modal Top Header Bar */}
        <div className="px-4 py-3 bg-slate-950 text-white border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: pageColor }}
            >
              <Award className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                Compartir Ficha de Casting & Audiciones • Formato Carta
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {ministryName} • Doble Logo (Ministerio & Sistema)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls & Options Toolbar */}
        <div className="px-3 py-2.5 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0">
          
          {/* Logo & Display Options */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <label className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 cursor-pointer font-semibold shadow-xs">
              <input
                type="checkbox"
                checked={showLogos}
                onChange={(e) => setShowLogos(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-400"
              />
              <span>Mostrar Logos</span>
            </label>

            {showLogos && (
              <>
                <button
                  type="button"
                  onClick={() => ministryFileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 cursor-pointer text-xs font-semibold"
                  title="Subir logo personalizado para el Ministerio"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Logo Ministerio</span>
                </button>
                <input
                  ref={ministryFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMinistryLogoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => systemFileInputRef.current?.click()}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 cursor-pointer text-xs font-semibold"
                  title="Subir logo institucional de la Iglesia"
                >
                  <Upload className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Logo Iglesia</span>
                </button>
                <input
                  ref={systemFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleSystemLogoUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Zoom & Action Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 mr-1">
              <button
                onClick={() => setPreviewScale((s) => Math.max(0.6, s - 0.1))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Alejar vista"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-slate-300">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                onClick={() => setPreviewScale((s) => Math.min(1.4, s + 0.1))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Acercar vista"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewScale(1)}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-slate-700"
                title="Restablecer tamaño (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* WhatsApp Copy */}
            <button
              onClick={handleCopyText}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? '¡Copiado!' : 'WhatsApp'}</span>
            </button>

            {/* Print Direct */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            {/* Export JPG */}
            <button
              onClick={handleExportJPG}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>JPG</span>
            </button>

            {/* Export PDF (Carta) */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-slate-950 font-black transition-all shadow-md disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#f59e0b' }}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Carta</span>
            </button>
          </div>
        </div>

        {/* Status Alert Notification */}
        {exportMessage && (
          <div className="bg-amber-500 text-slate-950 font-bold px-3 py-1.5 text-xs text-center flex items-center justify-center space-x-1.5 animate-pulse shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{exportMessage}</span>
          </div>
        )}

        {/* DOCUMENT PREVIEW WORKSPACE (Styled as Physical Paper Sheet, Isolated from Dark Mode) */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-3 sm:p-6 bg-slate-950/90 flex justify-center items-start">
          
          {/* Printable US Letter Paper Sheet Container */}
          <div
            ref={documentRef}
            id="casting-letter-document"
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              transform: `scale(${previewScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="w-full max-w-[740px] min-h-[960px] p-6 sm:p-8 bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between box-border my-2 overflow-hidden"
          >
            {/* Top Colored Accent Ribbon */}
            <div
              className="absolute top-0 left-0 right-0 h-2 rounded-t-sm"
              style={{ backgroundColor: pageColor }}
            />

            {/* Subtle Translucent Background Watermark Logo inside document */}
            {showLogos && (activeMinistryLogo || activeSystemLogo) && (
              <div
                className="absolute inset-0 pointer-events-none flex items-center justify-center select-none"
                style={{ opacity: 0.04 }}
              >
                <img
                  src={activeMinistryLogo || activeSystemLogo}
                  alt="Marca de agua institucional"
                  className="w-96 h-96 object-contain filter grayscale"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            <div className="w-full relative z-10">
              
              {/* 1. INSTITUTIONAL DUAL-LOGO HEADER */}
              <div
                className="flex items-center justify-between gap-3 pb-3.5 mb-2.5 border-b-2"
                style={{ borderColor: '#0f172a' }}
              >
                {/* Left: Ministry Logo */}
                {showLogos && (
                  <div className="flex flex-col items-center shrink-0">
                    {activeMinistryLogo ? (
                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl border p-1 flex items-center justify-center shrink-0 shadow-xs bg-white"
                        style={{ borderColor: '#cbd5e1' }}
                      >
                        <img
                          src={activeMinistryLogo}
                          alt="Logo del Ministerio"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl text-white flex items-center justify-center shadow-xs shrink-0"
                        style={{ backgroundColor: pageColor }}
                      >
                        {getMinistryIcon()}
                      </div>
                    )}
                    <span
                      className="text-[8px] font-black uppercase tracking-wider mt-1 text-center max-w-[76px] truncate"
                      style={{ color: '#64748b' }}
                    >
                      Ministerio
                    </span>
                  </div>
                )}

                {/* Center Institutional Details */}
                <div className="flex-1 min-w-0 text-center px-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest block"
                    style={{ color: '#64748b' }}
                  >
                    {config?.name || 'IGLESIA CENTRAL CRISTIANA'}
                  </span>
                  <h1
                    className="text-base sm:text-xl font-black tracking-tight leading-tight uppercase truncate mt-0.5"
                    style={{ color: '#0f172a' }}
                  >
                    {ministryName}
                  </h1>
                  <p
                    className="text-[10.5px] font-medium leading-tight truncate"
                    style={{ color: '#475569' }}
                  >
                    {config?.slogan || config?.denomination || 'Convocatoria Oficial de Audiciones & Selección de Talentos'}
                  </p>
                  <div
                    className="inline-block mt-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: pageColor }}
                  >
                    Ficha Oficial de Casting & Evaluación Técnica
                  </div>
                </div>

                {/* Right: System / Church Logo */}
                {showLogos && (
                  <div className="flex flex-col items-center shrink-0">
                    {activeSystemLogo ? (
                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl border p-1 flex items-center justify-center shrink-0 shadow-xs bg-white"
                        style={{ borderColor: '#cbd5e1' }}
                      >
                        <img
                          src={activeSystemLogo}
                          alt="Logo del Sistema / Iglesia"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-br from-indigo-700 to-slate-900 text-white flex items-center justify-center shadow-xs shrink-0 border border-slate-300"
                      >
                        <Church className="w-7 h-7 text-white" />
                      </div>
                    )}
                    <span
                      className="text-[8px] font-black uppercase tracking-wider mt-1 text-center max-w-[76px] truncate"
                      style={{ color: '#64748b' }}
                    >
                      Iglesia / Sistema
                    </span>
                  </div>
                )}
              </div>

              {/* Sub-header Meta Bar (Folio, Date, Status) */}
              <div
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border mb-3 text-[10.5px]"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#334155',
                }}
              >
                <div>
                  <span className="font-bold text-slate-500">Folio: </span>
                  <span className="font-mono font-bold text-slate-900 uppercase">
                    {casting.id.replace('tc_', 'CST-').replace('wc_', 'CST-').replace('dc_', 'CST-').substring(0, 12)}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Fecha de Emisión: </span>
                  <span className="font-bold text-slate-900">
                    {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-500">Estado: </span>
                  <span
                    className="font-bold px-2 py-0.5 rounded text-[9.5px] uppercase"
                    style={{
                      backgroundColor:
                        casting.status === 'Elenco Confirmado'
                          ? '#dcfce7'
                          : casting.status === 'En Proceso de Audición'
                          ? '#fef3c7'
                          : '#e0f2fe',
                      color:
                        casting.status === 'Elenco Confirmado'
                          ? '#15803d'
                          : casting.status === 'En Proceso de Audición'
                          ? '#b45309'
                          : '#0369a1',
                    }}
                  >
                    {casting.status}
                  </span>
                </div>
              </div>

              {/* 2. CASTING HERO SUMMARY CARD */}
              <div
                className="p-3.5 rounded-xl border mb-3 text-xs"
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 mb-2" style={{ borderColor: '#f1f5f9' }}>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">
                      {casting.playTitle ? `Proyecto / Obra: ${casting.playTitle}` : 'Convocatoria General'}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {casting.title}
                    </h2>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold text-slate-500 block">Evaluador / Director:</span>
                    <span className="text-xs font-black text-slate-800">{casting.director}</span>
                  </div>
                </div>

                {/* Logistics grid */}
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9.5px] text-slate-400 block">Fecha Audición</span>
                      <span className="font-bold text-slate-800">{casting.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9.5px] text-slate-400 block">Horario</span>
                      <span className="font-bold text-slate-800">{casting.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[9.5px] text-slate-400 block">Lugar / Salón</span>
                      <span className="font-bold text-slate-800 truncate">{casting.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. METRICS PROGRESS BAR */}
              <div
                className="p-2.5 rounded-lg border mb-3 flex items-center justify-between gap-3 text-xs"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                }}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Roles Requeridos</span>
                    <span className="text-sm font-black text-slate-900">{roles.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Aspirantes</span>
                    <span className="text-sm font-black text-slate-900">{candidates.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Titulares</span>
                    <span className="text-sm font-black text-emerald-600">{titularsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Suplentes</span>
                    <span className="text-sm font-black text-indigo-600">{substitutesCount}</span>
                  </div>
                </div>

                <div className="w-36 text-right">
                  <div className="flex justify-between text-[10px] font-bold mb-1">
                    <span className="text-slate-500">Cobertura Elenco:</span>
                    <span style={{ color: pageColor }}>{coveragePercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${coveragePercent}%`,
                        backgroundColor: pageColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 4. ROLES REQUERIDOS & DESGLOSE */}
              <div className="mb-3">
                <h3
                  className="text-[11px] font-black uppercase tracking-wider mb-1.5 pb-1 border-b flex items-center justify-between"
                  style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: pageColor }} />
                    <span>Perfiles & Roles Requeridos ({roles.length})</span>
                  </span>
                </h3>

                {roles.length === 0 ? (
                  <p className="text-[11px] italic text-slate-400 py-1">No se han registrado roles específicos para esta convocatoria.</p>
                ) : (
                  <table className="w-full text-left text-[10.5px] border-collapse border" style={{ borderColor: '#cbd5e1' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                        <th className="p-1.5 border font-bold">Rol / Puesto</th>
                        <th className="p-1.5 border font-bold">Tipo / Clasificación</th>
                        <th className="p-1.5 border font-bold">Perfil & Rango de Edad</th>
                        <th className="p-1.5 border font-bold text-center">Titular Asignado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map((r) => {
                        const titular = candidates.find(
                          (c) => c.status === 'Seleccionado (Titular)' && (c.assignedRole === r.roleName || c.applyingRole === r.roleName)
                        );
                        return (
                          <tr key={r.id} className="border-b" style={{ borderColor: '#e2e8f0' }}>
                            <td className="p-1.5 border font-bold text-slate-900">{r.roleName}</td>
                            <td className="p-1.5 border text-slate-600">{r.characterType}</td>
                            <td className="p-1.5 border text-slate-600">
                              {r.description} {r.ageRange ? `(${r.ageRange})` : ''} {r.gender ? `• ${r.gender}` : ''}
                            </td>
                            <td className="p-1.5 border text-center font-bold">
                              {titular ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {titular.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px] italic">Vacante</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 5. EVALUACIÓN DE ASPIRANTES */}
              <div className="mb-3">
                <h3
                  className="text-[11px] font-black uppercase tracking-wider mb-1.5 pb-1 border-b flex items-center justify-between"
                  style={{ borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  <span className="flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5" style={{ color: pageColor }} />
                    <span>Fichas de Evaluación & Aspirantes ({candidates.length})</span>
                  </span>
                </h3>

                {candidates.length === 0 ? (
                  <p className="text-[11px] italic text-slate-400 py-1">No hay aspirantes registrados en esta convocatoria.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse border" style={{ borderColor: '#cbd5e1' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                          <th className="p-1.5 border font-bold">Aspirante</th>
                          <th className="p-1.5 border font-bold">Puesto</th>
                          <th className="p-1.5 border font-bold text-center">Nivel</th>
                          <th className="p-1.5 border font-bold text-center">Puntaje</th>
                          <th className="p-1.5 border font-bold text-center">Veredicto Oficial</th>
                          <th className="p-1.5 border font-bold">Observaciones / Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((cand) => (
                          <tr key={cand.id} className="border-b" style={{ borderColor: '#e2e8f0' }}>
                            <td className="p-1.5 border font-bold text-slate-900">
                              {cand.name}
                              {cand.phone && <span className="block text-[8.5px] text-slate-400">{cand.phone}</span>}
                            </td>
                            <td className="p-1.5 border text-slate-700 font-medium">{cand.applyingRole}</td>
                            <td className="p-1.5 border text-center text-slate-500">{cand.experienceLevel || 'Intermedio'}</td>
                            <td className="p-1.5 border text-center">
                              <span className="font-bold text-amber-600">
                                {cand.overallRating ? `★ ${cand.overallRating}/5` : '-'}
                              </span>
                            </td>
                            <td className="p-1.5 border text-center">
                              <span
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase inline-block"
                                style={{
                                  backgroundColor:
                                    cand.status === 'Seleccionado (Titular)'
                                      ? '#dcfce7'
                                      : cand.status === 'Suplente / Cover'
                                      ? '#e0e7ff'
                                      : cand.status === 'En Evaluación'
                                      ? '#fef3c7'
                                      : '#fee2e2',
                                  color:
                                    cand.status === 'Seleccionado (Titular)'
                                      ? '#15803d'
                                      : cand.status === 'Suplente / Cover'
                                      ? '#4338ca'
                                      : cand.status === 'En Evaluación'
                                      ? '#b45309'
                                      : '#b91c1c',
                                }}
                              >
                                {cand.status}
                              </span>
                            </td>
                            <td className="p-1.5 border text-slate-600 italic max-w-[180px] truncate">
                              {cand.auditionNotes || 'Sin observaciones'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 6. PAUTAS, REQUISITOS Y GUION/CANCION DE AUDICION */}
              {(casting.requirements || casting.auditionScriptSnippet) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {casting.requirements && (
                    <div
                      className="p-2.5 rounded-lg border text-[10.5px]"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                    >
                      <h4 className="font-bold text-slate-900 mb-1 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>Requisitos para Aspirantes:</span>
                      </h4>
                      <p className="text-slate-700 whitespace-pre-line leading-tight text-[10px]">
                        {casting.requirements}
                      </p>
                    </div>
                  )}

                  {casting.auditionScriptSnippet && (
                    <div
                      className="p-2.5 rounded-lg border text-[10.5px]"
                      style={{ backgroundColor: '#fffbeb', borderColor: '#fef3c7' }}
                    >
                      <h4 className="font-bold text-amber-900 mb-1 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pauta / Material de Prueba:</span>
                      </h4>
                      <p className="text-amber-900/90 whitespace-pre-line leading-tight text-[10px] font-mono italic">
                        "{casting.auditionScriptSnippet}"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 7. INSTITUTIONAL FOOTER & SIGNATURES */}
            <div className="w-full pt-3 mt-auto relative z-10">
              
              {/* Dual Signature Blocks */}
              <div className="grid grid-cols-2 gap-8 pt-4 pb-2 border-t" style={{ borderColor: '#cbd5e1' }}>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 mx-auto mb-1"></div>
                  <p className="text-[10px] font-bold text-slate-900 leading-tight uppercase">
                    {casting.director || 'Director(a) del Ministerio'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 leading-tight">
                    Director / Evaluador Responsable
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-40 border-b border-slate-900 mx-auto mb-1"></div>
                  <p className="text-[10px] font-bold text-slate-900 leading-tight uppercase">
                    {config?.pastorName || 'Pastor Principal / Liderazgo'}
                  </p>
                  <p className="text-[8.5px] text-slate-500 leading-tight">
                    Supervisión Pastoral & Ministerial
                  </p>
                </div>
              </div>

              {/* Document Disclaimer & System Seal */}
              <div
                className="flex items-center justify-between text-[8px] text-slate-400 pt-2 border-t"
                style={{ borderColor: '#f1f5f9' }}
              >
                <span>
                  Documento eclesial oficial generado por {config?.name || 'Sistema Eclesia'} • Formato Carta
                </span>
                <span>Página 1 de 1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
