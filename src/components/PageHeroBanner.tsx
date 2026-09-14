import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  Edit3,
  Sliders,
  X,
  Upload,
  Image as ImageIcon,
  Trash2,
  Layout,
} from 'lucide-react';
import { ChurchConfig } from '../types';
import { TabType } from './Navigation';
import {
  PAGE_METADATA_MAP,
  QUICK_PAGE_COLOR_PRESETS,
  getActivePageThemeColor,
  getHeroBannerGradient,
} from '../lib/pageTheme';
import { churchThemes } from '../data/themes';

interface PageHeroBannerProps {
  tabId: TabType;
  config: ChurchConfig;
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultBadge?: string;
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  actionButtons?: React.ReactNode;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const PageHeroBanner: React.FC<PageHeroBannerProps> = ({
  tabId,
  config,
  defaultTitle,
  defaultSubtitle,
  defaultBadge,
  icon: IconComponent,
  actionButtons,
  onUpdateConfig,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bannerLogoInputRef = useRef<HTMLInputElement>(null);

  const pageMeta = PAGE_METADATA_MAP[tabId] || PAGE_METADATA_MAP.dashboard;
  const pageColor = getActivePageThemeColor(tabId, config);

  const customBanner = config.customBanners?.[tabId] || {};
  const currentTitle = customBanner.title || defaultTitle || pageMeta.title;
  const currentSubtitle = customBanner.subtitle || defaultSubtitle || pageMeta.subtitle;
  const currentBadge = customBanner.badge || defaultBadge || pageMeta.badge || pageMeta.category;
  const currentGradientStyle = customBanner.gradientStyle || 'glow';
  
  // Resolved ministry logo: specific customBanner.logoUrl OR config.ministryLogos?.[tabId] OR config.logoUrl
  const currentLogoUrl =
    customBanner.logoUrl || config.ministryLogos?.[tabId] || '';
  const currentLogoPosition = customBanner.logoPosition || (currentLogoUrl ? 'side' : 'none');
  const currentLogoOpacity = customBanner.logoOpacity !== undefined ? customBanner.logoOpacity : 0.2;

  // Form states for modal
  const [formTitle, setFormTitle] = useState(currentTitle);
  const [formSubtitle, setFormSubtitle] = useState(currentSubtitle);
  const [formBadge, setFormBadge] = useState(currentBadge);
  const [formStyle, setFormStyle] = useState<'glow' | 'deep' | 'vibrant' | 'minimal'>(
    currentGradientStyle
  );
  const [formLogoUrl, setFormLogoUrl] = useState<string>(currentLogoUrl);
  const [formLogoPosition, setFormLogoPosition] = useState<'side' | 'background' | 'both' | 'none'>(
    currentLogoPosition
  );
  const [formLogoOpacity, setFormLogoOpacity] = useState<number>(currentLogoOpacity);

  // Sync state when props/config change
  useEffect(() => {
    setFormTitle(currentTitle);
    setFormSubtitle(currentSubtitle);
    setFormBadge(currentBadge);
    setFormStyle(currentGradientStyle);
    setFormLogoUrl(currentLogoUrl);
    setFormLogoPosition(currentLogoPosition);
    setFormLogoOpacity(currentLogoOpacity);
  }, [currentTitle, currentSubtitle, currentBadge, currentGradientStyle, currentLogoUrl, currentLogoPosition, currentLogoOpacity]);

  // Click outside color picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsColorPickerOpen(false);
      }
    };
    if (isColorPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isColorPickerOpen]);

  const handleUpdatePageColor = (newColor: string) => {
    if (!onUpdateConfig) return;
    const updated: ChurchConfig = {
      ...config,
      customTabColors: {
        ...(config.customTabColors || {}),
        [tabId]: newColor,
      },
    };
    onUpdateConfig(updated);
  };

  const handleResetPageColor = () => {
    if (!onUpdateConfig) return;
    const activeTheme =
      churchThemes.find((t) => t.id === config.activeThemeId) || churchThemes[0];
    const defaultColor =
      activeTheme.tabColors[tabId] || pageMeta.defaultColor || activeTheme.primaryColor;
    handleUpdatePageColor(defaultColor);
  };

  // Handle Logo Upload from device inside modal
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const logoData = event.target.result as string;
          setFormLogoUrl(logoData);
          if (formLogoPosition === 'none') {
            setFormLogoPosition('side');
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBannerCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateConfig) return;

    const updatedMinistryLogos = { ...(config.ministryLogos || {}) };
    if (formLogoUrl) {
      updatedMinistryLogos[tabId] = formLogoUrl;
    } else {
      delete updatedMinistryLogos[tabId];
    }

    const updated: ChurchConfig = {
      ...config,
      ministryLogos: updatedMinistryLogos,
      customBanners: {
        ...(config.customBanners || {}),
        [tabId]: {
          title: formTitle.trim(),
          subtitle: formSubtitle.trim(),
          badge: formBadge.trim(),
          gradientStyle: formStyle,
          logoUrl: formLogoUrl.trim() || undefined,
          logoPosition: formLogoPosition,
          logoOpacity: formLogoOpacity,
        },
      },
    };
    onUpdateConfig(updated);
    setIsEditorOpen(false);
  };

  const handleResetBannerContent = () => {
    if (!onUpdateConfig) return;
    const currentBanners = { ...(config.customBanners || {}) };
    delete currentBanners[tabId];

    const currentMinistryLogos = { ...(config.ministryLogos || {}) };
    delete currentMinistryLogos[tabId];

    const updated: ChurchConfig = {
      ...config,
      customBanners: currentBanners,
      ministryLogos: currentMinistryLogos,
    };
    onUpdateConfig(updated);
    setFormTitle(defaultTitle || pageMeta.title);
    setFormSubtitle(defaultSubtitle || pageMeta.subtitle);
    setFormBadge(defaultBadge || pageMeta.badge || pageMeta.category);
    setFormStyle('glow');
    setFormLogoUrl('');
    setFormLogoPosition('none');
    setFormLogoOpacity(0.2);
    setIsEditorOpen(false);
  };

  const backgroundGradient = getHeroBannerGradient(pageColor, currentGradientStyle);

  // Logo rendering conditions
  const showBackgroundLogo =
    currentLogoUrl &&
    (currentLogoPosition === 'background' || currentLogoPosition === 'both');
  const showSideLogo =
    currentLogoUrl &&
    (currentLogoPosition === 'side' || currentLogoPosition === 'both');

  return (
    <div
      className={`relative rounded-3xl p-6 sm:p-8 text-white shadow-2xl border transition-all duration-500 group ${
        isColorPickerOpen ? 'z-30' : 'z-10'
      }`}
      style={{
        background: backgroundGradient,
        borderColor: `${pageColor}50`,
        boxShadow: `0 12px 36px -10px ${pageColor}40`,
      }}
    >
      {/* Background layer with isolated overflow-hidden */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
        {/* Dynamic ambient glowing spheres inside the hero banner */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full blur-3xl opacity-30 transition-colors duration-700"
          style={{ backgroundColor: pageColor }}
        />
        <div
          className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full blur-2xl opacity-20 transition-colors duration-700"
          style={{ backgroundColor: pageColor }}
        />
        <div
          className="absolute top-0 left-0 h-1.5 w-full transition-colors duration-500"
          style={{ backgroundColor: pageColor }}
        />

        {/* Translucent Background Watermark Logo */}
        {showBackgroundLogo && (
          <div
            className="absolute right-4 sm:right-16 top-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 pointer-events-none transition-all duration-700 flex items-center justify-center select-none"
            style={{ opacity: currentLogoOpacity }}
          >
            <img
              src={currentLogoUrl}
              alt="Marca de agua del ministerio"
              className="w-full h-full object-contain filter drop-shadow-2xl brightness-110 contrast-125"
            />
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Badge, Title, Subtitle & Optional Side Logo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 max-w-3xl">
          
          {/* Side Logo Display */}
          {showSideLogo && (
            <div className="relative shrink-0 group/logo">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl p-2 bg-slate-900/60 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300 group-hover/logo:scale-105"
                style={{
                  boxShadow: `0 8px 24px -4px ${pageColor}60`,
                  borderColor: `${pageColor}80`,
                }}
              >
                <img
                  src={currentLogoUrl}
                  alt="Logo del ministerio"
                  className="w-full h-full object-contain"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 border border-white/30 text-white opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer shadow-md"
                title="Editar posición o imagen del logo"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="space-y-3 min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-2">
              <div
                className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-extrabold border shadow-sm transition-all duration-300"
                style={{
                  backgroundColor: `${pageColor}30`,
                  color: '#ffffff',
                  borderColor: `${pageColor}60`,
                }}
              >
                {IconComponent ? (
                  <IconComponent className="w-3.5 h-3.5" style={{ color: '#ffffff' }} />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{currentBadge}</span>
              </div>

              {/* Quick Color Picker Pill */}
              <div className="relative z-50" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white/90 shadow-xs transition-all cursor-pointer"
                  title="Cambiar color del tema de esta página y su banner"
                >
                  <div
                    className="w-3 h-3 rounded-full border border-white/60 shadow-2xs"
                    style={{ backgroundColor: pageColor }}
                  />
                  <span className="hidden sm:inline">Color</span>
                  <ChevronDown className="w-3 h-3 text-white/60" />
                </button>

                {/* Color Picker Dropdown Popover */}
                {isColorPickerOpen && (
                  <div className="absolute left-0 mt-2 w-72 sm:w-80 p-4 rounded-3xl bg-slate-900/98 backdrop-blur-2xl border border-slate-700/90 shadow-2xl z-[9999] space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-100 ring-1 ring-white/20">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center space-x-1.5">
                        <Palette className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-extrabold text-white">Color de Página</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleResetPageColor();
                          setIsColorPickerOpen(false);
                        }}
                        className="text-[11px] text-slate-400 hover:text-indigo-400 font-semibold flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restablecer</span>
                      </button>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block mb-2">
                        Paleta de Tonos:
                      </span>
                      <div className="grid grid-cols-6 gap-2">
                        {QUICK_PAGE_COLOR_PRESETS.map((preset) => {
                          const isSelected = pageColor.toLowerCase() === preset.hex.toLowerCase();
                          return (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => {
                                handleUpdatePageColor(preset.hex);
                              }}
                              title={preset.name}
                              className={`w-8 h-8 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center ${
                                isSelected
                                  ? 'border-white scale-110 shadow-lg ring-2 ring-white/50'
                                  : 'border-slate-700 hover:scale-105'
                              }`}
                              style={{ backgroundColor: preset.hex }}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Selector Libre:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                          {pageColor}
                        </span>
                        <label
                          className="w-7 h-7 rounded-xl border-2 border-white/60 flex items-center justify-center cursor-pointer relative overflow-hidden"
                          style={{ backgroundColor: pageColor }}
                        >
                          <input
                            type="color"
                            value={pageColor}
                            onChange={(e) => handleUpdatePageColor(e.target.value)}
                            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit Banner Button */}
              {onUpdateConfig && (
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 hover:bg-white/20 border border-white/20 text-white/90 shadow-xs transition-all cursor-pointer"
                  title="Personalizar título, subtítulo, logo, posición y estilo del banner"
                >
                  <Edit3 className="w-3 h-3 text-white/80" />
                  <span>Editar Banner & Logo</span>
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight drop-shadow-sm text-white">
              {currentTitle}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 max-w-2xl leading-relaxed font-medium">
              {currentSubtitle}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        {actionButtons && (
          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start lg:self-center">
            {actionButtons}
          </div>
        )}
      </div>

      {/* Full Banner & Ministry Logo Customization Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-3xl p-5 sm:p-7 shadow-2xl text-white space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                  style={{ backgroundColor: pageColor }}
                >
                  <Sliders className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Editar Banner & Logo del Ministerio
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sube el logo del ministerio, define su posición (fondo o lateral) y ajusta textos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBannerCustomization} className="space-y-4">
              
              {/* SECTION: Ministry Logo Upload & Placement */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Logo Oficial de este Ministerio
                    </span>
                  </div>
                  {formLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setFormLogoUrl('')}
                      className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Quitar Logo</span>
                    </button>
                  )}
                </div>

                {/* Upload & Preview Box */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div
                    onClick={() => bannerLogoInputRef.current?.click()}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all shrink-0 relative overflow-hidden ${
                      formLogoUrl
                        ? 'border-indigo-500 bg-slate-950/80'
                        : 'border-slate-600 hover:border-indigo-400 bg-slate-900/60'
                    }`}
                  >
                    {formLogoUrl ? (
                      <img
                        src={formLogoUrl}
                        alt="Vista previa del logo"
                        className="w-full h-full object-contain p-1.5"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <Upload className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-300 block leading-tight">
                          Subir Logo
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={bannerLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <div className="space-y-1.5 flex-1 min-w-0 text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => bannerLogoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center justify-center sm:justify-start space-x-1.5 cursor-pointer mx-auto sm:mx-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formLogoUrl ? 'Cambiar Imagen de Logo' : 'Seleccionar Archivo de Logo'}</span>
                    </button>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Formatos recomendados: PNG transparente o JPG. Este logo se sincronizará automáticamente con el <strong>Banner</strong> y la <strong>Página del Plan de Trabajo</strong>.
                    </p>
                  </div>
                </div>

                {/* Logo Display Position Options */}
                {formLogoUrl && (
                  <div className="pt-2 border-t border-slate-700/60 space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      ¿Dónde y cómo deseas mostrar el logo en el Banner?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        {
                          id: 'side',
                          label: 'A un Lado',
                          desc: 'Lateral visible junto al título',
                        },
                        {
                          id: 'background',
                          label: 'Fondo Translúcido',
                          desc: 'Marca de agua en el fondo',
                        },
                        {
                          id: 'both',
                          label: 'Ambos',
                          desc: 'Lateral y marca de agua',
                        },
                        {
                          id: 'none',
                          label: 'Oculto en Banner',
                          desc: 'Solo en Plan de Trabajo',
                        },
                      ].map((pos) => (
                        <button
                          key={pos.id}
                          type="button"
                          onClick={() => setFormLogoPosition(pos.id as any)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                            formLogoPosition === pos.id
                              ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-md ring-1 ring-indigo-400'
                              : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-bold block">{pos.label}</span>
                          <span className="text-[9.5px] opacity-75 leading-tight mt-0.5">
                            {pos.desc}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Translucency / Opacity Slider for Background Watermark */}
                    {(formLogoPosition === 'background' || formLogoPosition === 'both') && (
                      <div className="pt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-300">
                            Transparencia de Fondo (Marca de Agua):
                          </span>
                          <span className="font-mono text-indigo-400 font-bold">
                            {Math.round(formLogoOpacity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.05"
                          max="0.6"
                          step="0.05"
                          value={formLogoOpacity}
                          onChange={(e) => setFormLogoOpacity(parseFloat(e.target.value))}
                          className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Etiqueta / Lema del Ministerio
                </label>
                <input
                  type="text"
                  value={formBadge}
                  onChange={(e) => setFormBadge(e.target.value)}
                  placeholder="Ej. Ministerio de Alabanza & Adoración"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-indigo-500 text-xs text-white outline-hidden font-medium"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Título Principal del Banner
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej. Ministerio de Danza & Expresión"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-indigo-500 text-xs text-white outline-hidden font-medium"
                  required
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Descripción / Subtítulo
                </label>
                <textarea
                  rows={2}
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Descripción de actividades, ensayos, canciones o propósitos..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-800/90 border border-slate-700 focus:border-indigo-500 text-xs text-white outline-hidden font-medium"
                />
              </div>

              {/* Gradient Style */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Estilo de Iluminación y Gradiente
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'glow', label: 'Glow Místico' },
                    { id: 'deep', label: 'Noche Profunda' },
                    { id: 'vibrant', label: 'Aura Vibrante' },
                    { id: 'minimal', label: 'Minimal Eclesiástico' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setFormStyle(st.id as any)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formStyle === st.id
                          ? 'border-indigo-500 bg-indigo-600/30 text-white shadow-md'
                          : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Switcher inside Modal */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Color de Tema para esta Página
                </label>
                <div className="flex items-center space-x-3">
                  <div className="grid grid-cols-6 gap-2 flex-1">
                    {QUICK_PAGE_COLOR_PRESETS.slice(0, 6).map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => handleUpdatePageColor(p.hex)}
                        title={p.name}
                        className={`h-8 rounded-xl border transition-all cursor-pointer ${
                          pageColor.toLowerCase() === p.hex.toLowerCase()
                            ? 'border-white scale-110 shadow-md ring-2 ring-white/60'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                  <label
                    className="w-8 h-8 rounded-xl border-2 border-white/60 flex items-center justify-center cursor-pointer shrink-0 relative overflow-hidden"
                    style={{ backgroundColor: pageColor }}
                  >
                    <input
                      type="color"
                      value={pageColor}
                      onChange={(e) => handleUpdatePageColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-between pt-3.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleResetBannerContent}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-3.5 py-2 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-white text-xs font-black shadow-lg transition-all cursor-pointer hover:opacity-95"
                    style={{
                      backgroundColor: pageColor,
                      boxShadow: `0 4px 14px ${pageColor}50`,
                    }}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
