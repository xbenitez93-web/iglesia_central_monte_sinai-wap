import React, { useState, useRef } from 'react';
import {
  MinistryWorkPlan,
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
} from 'lucide-react';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

interface MinistryWorkPlanShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: MinistryWorkPlan;
  ministryName: string;
  ministry: string;
  pageColor: string;
  config?: ChurchConfig;
}

export const MinistryWorkPlanShareModal: React.FC<MinistryWorkPlanShareModalProps> = ({
  isOpen,
  onClose,
  plan,
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

  // Compute tasks progress
  const tasks = plan.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent =
    tasks.length > 0
      ? Math.round((completedTasks / tasks.length) * 100)
      : plan.status === 'Completado'
      ? 100
      : plan.status === 'En Progreso'
      ? 50
      : 10;

  // Default Ministry Emblem / Icon fallback
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

  // Resolved Ministry Custom Banner & Logo from settings or banner configuration
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
      // Use html-to-image toJpeg which natively supports modern CSS (oklch, flex, grid)
      const imgData = await toJpeg(documentRef.current, {
        quality: 0.98,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        style: {
          transform: 'none',
          margin: '0 auto',
        },
      });

      // Measure the rendered image dimensions
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

      // Fit document neatly within printable sheet margins (6mm margins)
      const margin = 6;
      const printWidth = pdfWidth - margin * 2;
      const printHeight = (imgHeight * printWidth) / imgWidth;

      if (printHeight <= pdfHeight - margin * 2) {
        // Fits entirely on a single standard Letter page
        pdf.addImage(imgData, 'JPEG', margin, margin, printWidth, printHeight);
      } else {
        // Multi-page slicing if extensive tasks list
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

      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      pdf.save(`Plan_Trabajo_${ministry}_${safeTitle}.pdf`);
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
      const safeTitle = plan.title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      link.download = `Plan_Trabajo_${ministry}_${safeTitle}.jpg`;
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
    const text = `📋 *PLAN DE TRABAJO MINISTERIAL*\n🏛️ *${config?.name || 'Iglesia Central'}* - ${ministryName}\n\n📌 *Proyecto:* ${plan.title}\n🗓️ *Período:* ${plan.period} ${plan.periodName ? `(${plan.periodName})` : ''}\n👤 *Líder Responsable:* ${plan.responsibleLeader}\n⚡ *Estado:* ${plan.status} (${progressPercent}% de avance)\n\n🎯 *Objetivo General:*\n${plan.objective}\n\n🎯 *Metas Específicas:*\n${plan.goals?.map((g, i) => `${i + 1}. ${g}`).join('\n') || 'N/A'}\n\n📝 *Actividades / Tareas Clave:*\n${tasks.map((t) => `${t.completed ? '✅' : '⏳'} ${t.description} (${t.assignedTo || 'Sin asignar'})`).join('\n') || 'N/A'}\n\n${plan.notes ? `💡 *Observaciones:* ${plan.notes}\n` : ''}${plan.youtubeUrl ? `🎥 *Video/Capacitación:* ${plan.youtubeUrl}\n` : ''}\nGenerado desde el Sistema Eclesial Digital.`;

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
              <Share2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate leading-tight">
                Compartir Plan de Trabajo • Formato Carta
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
              <span className="text-[11px]">Logos</span>
            </label>

            {showLogos && (
              <>
                {/* Ministry Logo Trigger */}
                <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => ministryFileInputRef.current?.click()}
                    className="flex items-center space-x-1 text-slate-200 hover:text-indigo-400 font-semibold text-[11px] cursor-pointer transition-colors"
                    title="Subir logo específico del ministerio"
                  >
                    <Upload className="w-3 h-3 text-indigo-400" />
                    <span>{activeMinistryLogo ? 'Logo Ministerio' : '+ Logo Min.'}</span>
                  </button>
                  <input
                    ref={ministryFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleMinistryLogoUpload}
                    className="hidden"
                  />
                  {customMinistryLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomMinistryLogoUrl(null)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer ml-1"
                      title="Restablecer logo de ministerio"
                    >
                      (Quitar)
                    </button>
                  )}
                </div>

                {/* System / Church Logo Trigger */}
                <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
                  <button
                    type="button"
                    onClick={() => systemFileInputRef.current?.click()}
                    className="flex items-center space-x-1 text-slate-200 hover:text-purple-400 font-semibold text-[11px] cursor-pointer transition-colors"
                    title="Subir o cambiar logo institucional de la iglesia/sistema"
                  >
                    <Upload className="w-3 h-3 text-purple-400" />
                    <span>{activeSystemLogo ? 'Logo Sistema' : '+ Logo Sist.'}</span>
                  </button>
                  <input
                    ref={systemFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSystemLogoUpload}
                    className="hidden"
                  />
                  {customSystemLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCustomSystemLogoUrl(null)}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer ml-1"
                      title="Restablecer logo institucional"
                    >
                      (Quitar)
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Scale / Zoom preview toggles for mobile & desktop */}
            <div className="hidden sm:flex items-center space-x-1 bg-slate-800 px-1.5 py-1 rounded-lg border border-slate-700 text-slate-300 ml-1">
              <button
                type="button"
                onClick={() => setPreviewScale((prev) => Math.max(0.6, prev - 0.1))}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                title="Reducir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-slate-400">
                {Math.round(previewScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setPreviewScale((prev) => Math.min(1.3, prev + 0.1))}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewScale(1)}
                className="p-1 hover:bg-slate-700 rounded transition-colors text-slate-300 hover:text-white ml-0.5"
                title="Tamaño Original (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Download High-Res JPG */}
            <button
              onClick={handleExportJPG}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              title="Descargar imagen en alta resolución lista para compartir"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar JPG</span>
              <span className="sm:hidden">JPG</span>
            </button>

            {/* Download PDF Letter */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              title="Descargar en PDF tamaño Carta listo para imprimir"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar PDF</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Copy WhatsApp text */}
            <button
              onClick={handleCopyText}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Copiar texto formateado para WhatsApp"
            >
              {copiedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Imprimir directamente"
            >
              <Printer className="w-3.5 h-3.5" />
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
            id="work-plan-letter-document"
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
                    {config?.slogan || config?.denomination || 'Edificando y coordinando la obra ministerial'}
                  </p>
                  <div
                    className="inline-block mt-1 px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white"
                    style={{ backgroundColor: pageColor }}
                  >
                    Plan Oficial de Trabajo & Metas
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

              {/* Sub-header Meta Bar (Folio, Date, Period) */}
              <div
                className="flex items-center justify-between px-3 py-1.5 rounded-lg border mb-3 text-[10.5px]"
                style={{
                  backgroundColor: '#f8fafc',
                  borderColor: '#e2e8f0',
                  color: '#334155',
                }}
              >
                <div>
                  <span className="font-bold" style={{ color: '#64748b' }}>FOLIO: </span>
                  <span className="font-black" style={{ color: '#0f172a' }}>
                    #{plan.id.substring(plan.id.length - 6).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#64748b' }}>Fecha: </span>
                  <span className="font-semibold" style={{ color: '#0f172a' }}>
                    {plan.date || new Date().toISOString().split('T')[0]}
                  </span>
                </div>
                <div>
                  <span className="font-bold" style={{ color: '#64748b' }}>Período: </span>
                  <span className="font-bold" style={{ color: '#0f172a' }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              {/* 2. PROJECT TITLE & HIGHLIGHT MATRIX */}
              <div className="mb-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h2
                    className="text-base sm:text-lg font-black leading-tight"
                    style={{ color: '#0f172a' }}
                  >
                    {plan.title}
                  </h2>
                  <span
                    className="text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border"
                    style={{
                      backgroundColor:
                        plan.status === 'Completado'
                          ? '#dcfce7'
                          : plan.status === 'En Progreso'
                          ? '#fef3c7'
                          : plan.status === 'Pausado'
                          ? '#ffe4e6'
                          : '#f1f5f9',
                      color:
                        plan.status === 'Completado'
                          ? '#166534'
                          : plan.status === 'En Progreso'
                          ? '#854d0e'
                          : plan.status === 'Pausado'
                          ? '#9f1239'
                          : '#334155',
                      borderColor:
                        plan.status === 'Completado'
                          ? '#86efac'
                          : plan.status === 'En Progreso'
                          ? '#fcd34d'
                          : '#cbd5e1',
                    }}
                  >
                    Estado: {plan.status}
                  </span>
                </div>

                {/* Technical Overview Matrix with solid light colors */}
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl border text-[11px]"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    color: '#0f172a',
                  }}
                >
                  <div>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider block"
                      style={{ color: '#64748b' }}
                    >
                      Período
                    </span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>
                      {plan.period} {plan.periodName ? `(${plan.periodName})` : ''}
                    </span>
                  </div>

                  <div>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider block"
                      style={{ color: '#64748b' }}
                    >
                      Líder Responsable
                    </span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>
                      {plan.responsibleLeader}
                    </span>
                  </div>

                  <div>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider block"
                      style={{ color: '#64748b' }}
                    >
                      Presupuesto Estimado
                    </span>
                    <span className="font-bold" style={{ color: '#0f172a' }}>
                      {plan.budget
                        ? `${config?.currencySymbol || '$'}${plan.budget.toLocaleString()}`
                        : 'No asignado'}
                    </span>
                  </div>

                  <div>
                    <span
                      className="text-[9px] font-black uppercase tracking-wider block"
                      style={{ color: '#64748b' }}
                    >
                      Progreso de Metas
                    </span>
                    <span
                      className="font-black"
                      style={{ color: progressPercent === 100 ? '#166534' : '#0f172a' }}
                    >
                      {progressPercent}% completado
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION DIVIDER I */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#cbd5e1' }} />
                </div>
                <div className="relative flex justify-start">
                  <span
                    className="pr-2 text-[9px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: '#ffffff', color: '#64748b' }}
                  >
                    Sección I • Propósito & Objetivo General
                  </span>
                </div>
              </div>

              {/* 3. PURPOSE & GENERAL OBJECTIVE */}
              <div className="mb-2">
                <div
                  className="text-xs p-2.5 rounded-xl border leading-relaxed"
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    color: '#1e293b',
                  }}
                >
                  {plan.objective}
                </div>
                {plan.targetAudience && (
                  <p
                    className="text-[10px] font-semibold mt-1"
                    style={{ color: '#475569' }}
                  >
                    👥 <strong>Audiencia y Alcance:</strong> {plan.targetAudience}
                  </p>
                )}
              </div>

              {/* SECTION DIVIDER II */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#cbd5e1' }} />
                </div>
                <div className="relative flex justify-start">
                  <span
                    className="pr-2 text-[9px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: '#ffffff', color: '#64748b' }}
                  >
                    Sección II • Metas Específicas ({plan.goals?.length || 0})
                  </span>
                </div>
              </div>

              {/* 4. SPECIFIC GOALS */}
              <div className="mb-2">
                {plan.goals && plan.goals.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {plan.goals.map((goal, idx) => (
                      <div
                        key={idx}
                        className="flex items-start space-x-2 p-2 rounded-xl border text-[11px]"
                        style={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          color: '#0f172a',
                        }}
                      >
                        <span
                          className="w-4 h-4 rounded-full text-white font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: pageColor }}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-medium leading-snug" style={{ color: '#1e293b' }}>
                          {goal}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] italic" style={{ color: '#94a3b8' }}>
                    No se especificaron sub-metas adicionales.
                  </p>
                )}
              </div>

              {/* SECTION DIVIDER III */}
              <div className="relative my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" style={{ borderColor: '#cbd5e1' }} />
                </div>
                <div className="relative flex justify-start">
                  <span
                    className="pr-2 text-[9px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: '#ffffff', color: '#64748b' }}
                  >
                    Sección III • Checklist de Actividades & Cumplimiento ({completedTasks}/{tasks.length})
                  </span>
                </div>
              </div>

              {/* 5. TASKS & PROGRESS TABLE */}
              <div className="mb-2 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold" style={{ color: '#334155' }}>
                    Avance de Cumplimiento: {completedTasks} de {tasks.length} tareas completadas
                  </span>
                  <span className="font-black" style={{ color: '#0f172a' }}>
                    {progressPercent}%
                  </span>
                </div>

                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#e2e8f0' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: pageColor,
                    }}
                  />
                </div>

                {tasks.length > 0 ? (
                  <div
                    className="border rounded-xl overflow-hidden text-[11px]"
                    style={{ borderColor: '#cbd5e1', backgroundColor: '#ffffff' }}
                  >
                    <table className="w-full border-collapse">
                      <thead>
                        <tr
                          className="border-b text-[9px] font-black uppercase text-left"
                          style={{
                            backgroundColor: '#f1f5f9',
                            borderColor: '#cbd5e1',
                            color: '#475569',
                          }}
                        >
                          <th className="py-1.5 px-2.5 w-20">Estado</th>
                          <th className="py-1.5 px-2.5">Actividad / Tarea</th>
                          <th className="py-1.5 px-2.5 w-36">Responsable</th>
                        </tr>
                      </thead>
                      <tbody style={{ backgroundColor: '#ffffff' }}>
                        {tasks.map((task, idx) => (
                          <tr
                            key={task.id || idx}
                            className="border-b last:border-b-0"
                            style={{
                              borderColor: '#f1f5f9',
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            }}
                          >
                            <td className="py-1.5 px-2.5 align-middle">
                              {task.completed ? (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black"
                                  style={{ backgroundColor: '#dcfce7', color: '#166534' }}
                                >
                                  Hecho
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black"
                                  style={{ backgroundColor: '#fef3c7', color: '#854d0e' }}
                                >
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td
                              className="py-1.5 px-2.5 font-medium leading-snug align-middle"
                              style={{
                                color: task.completed ? '#94a3b8' : '#0f172a',
                                textDecoration: task.completed ? 'line-through' : 'none',
                              }}
                            >
                              {task.description}
                            </td>
                            <td
                              className="py-1.5 px-2.5 font-bold align-middle truncate"
                              style={{ color: '#334155' }}
                            >
                              {task.assignedTo || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[11px] italic" style={{ color: '#94a3b8' }}>
                    No hay tareas desglosadas en el checklist.
                  </p>
                )}
              </div>

              {/* SECTION DIVIDER IV (OBSERVATIONS & LINKS) */}
              {(plan.notes || plan.youtubeUrl) && (
                <>
                  <div className="relative my-2.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" style={{ borderColor: '#cbd5e1' }} />
                    </div>
                    <div className="relative flex justify-start">
                      <span
                        className="pr-2 text-[9px] font-black uppercase tracking-widest"
                        style={{ backgroundColor: '#ffffff', color: '#64748b' }}
                      >
                        Sección IV • Observaciones & Recursos
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] space-y-1 mb-2">
                    {plan.notes && (
                      <div
                        className="p-2 rounded-lg border"
                        style={{
                          backgroundColor: '#f8fafc',
                          borderColor: '#e2e8f0',
                          color: '#334155',
                        }}
                      >
                        <strong>Observaciones:</strong> {plan.notes}
                      </div>
                    )}
                    {plan.youtubeUrl && (
                      <div
                        className="p-2 rounded-lg border text-rose-900"
                        style={{
                          backgroundColor: '#fff1f2',
                          borderColor: '#fecdd3',
                        }}
                      >
                        🎥 <strong>Material de Capacitación / Video:</strong> {plan.youtubeUrl}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 6. OFFICIAL SIGNATURES & VALIDATION */}
            <div
              className="pt-5 mt-4 border-t-2 relative z-10"
              style={{ borderColor: '#0f172a' }}
            >
              <div className="grid grid-cols-2 gap-6 text-center text-[11px]">
                <div>
                  <div
                    className="border-t w-36 sm:w-44 mx-auto mb-1"
                    style={{ borderColor: '#64748b' }}
                  />
                  <span className="font-black block" style={{ color: '#0f172a' }}>
                    {plan.responsibleLeader}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider block"
                    style={{ color: '#64748b' }}
                  >
                    Líder Responsable • {ministryName}
                  </span>
                </div>

                <div>
                  <div
                    className="border-t w-36 sm:w-44 mx-auto mb-1"
                    style={{ borderColor: '#64748b' }}
                  />
                  <span className="font-black block" style={{ color: '#0f172a' }}>
                    {config?.pastorName || 'Pastor Principal / Supervisor'}
                  </span>
                  <span
                    className="text-[9px] uppercase tracking-wider block"
                    style={{ color: '#64748b' }}
                  >
                    Visto Bueno / Aprobación Pastoral
                  </span>
                </div>
              </div>

              {/* Document Footer Note */}
              <div
                className="mt-4 pt-1.5 border-t flex items-center justify-between text-[8.5px]"
                style={{ borderColor: '#e2e8f0', color: '#94a3b8' }}
              >
                <span>Generado desde el Sistema Eclesial • {config?.name || 'Iglesia Central'}</span>
                <span>Documento Oficial Tipo Carta (US Letter 8.5" × 11")</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
