import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  PiggyBank,
  Music,
  Heart,
  UserCheck,
  Drama,
  MessageSquare,
  Settings,
  Terminal,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  ArrowRight,
  Mail,
  Copy,
  Info,
  Bell,
  Edit3,
} from 'lucide-react';
import { ChurchConfig, ModuleActionButton } from '../types';
import { TabType } from './Navigation';
import {
  PAGE_METADATA_MAP,
  QUICK_PAGE_COLOR_PRESETS,
  getActivePageThemeColor,
} from '../lib/pageTheme';
import { churchThemes } from '../data/themes';
import { getMinistryIconComponent } from '../utils/ministryIcons';

interface PageThemeHeaderProps {
  activeTab: TabType;
  config: ChurchConfig;
  onUpdatePageColor: (tab: TabType, colorHex: string) => void;
  onResetPageColor: (tab: TabType) => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenModuleEditor?: (tab: TabType) => void;
  isDevUser?: boolean;
}

const TAB_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  directory: Users,
  events: Calendar,
  finances: DollarSign,
  coop: PiggyBank,
  worship: Music,
  dance: Sparkles,
  women: Heart,
  ushers: UserCheck,
  theater: Drama,
  ministries: Sparkles,
  chat: MessageSquare,
  settings: Settings,
  developer: Terminal,
};

export const PageThemeHeader: React.FC<PageThemeHeaderProps> = ({
  activeTab,
  config,
  onUpdatePageColor,
  onResetPageColor,
  onNavigateTab,
  onOpenModuleEditor,
  isDevUser,
}) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom module config if any
  const modConfig = config.modulesConfig?.[activeTab];

  const pageMeta = PAGE_METADATA_MAP[activeTab] || {
    title: modConfig?.label || activeTab,
    subtitle: modConfig?.subtitle || 'Módulo del sistema eclesial.',
    category: 'Módulo',
    defaultColor: '#4f46e5',
  };

  const rawPageColor = getActivePageThemeColor(activeTab, config);
  const pageColor = modConfig?.color || rawPageColor;

  // Custom or fallback icon
  const IconComponent = modConfig?.iconName
    ? getMinistryIconComponent(modConfig.iconName)
    : TAB_ICONS[activeTab] || LayoutDashboard;

  const displayTitle = modConfig?.label || pageMeta.title;
  const displaySubtitle = modConfig?.subtitle || pageMeta.subtitle;

  // Action buttons configured for this module
  const actionButtons: ModuleActionButton[] = modConfig?.actionButtons || [];

  // Custom notice
  const customNotice = modConfig?.customNotice;

  // Close dropdown on click outside
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

  // Handle action button click
  const handleButtonClick = (btn: ModuleActionButton) => {
    if (btn.actionType === 'whatsapp') {
      const cleanPhone = (btn.targetUrl || '').replace(/[^0-9+]/g, '');
      const encodedMsg = encodeURIComponent(btn.payload || '');
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}?text=${encodedMsg}`
        : `https://wa.me/?text=${encodedMsg}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else if (btn.actionType === 'phone') {
      const cleanPhone = (btn.targetUrl || '').replace(/[^0-9+]/g, '');
      if (cleanPhone) {
        window.location.href = `tel:${cleanPhone}`;
      }
    } else if (btn.actionType === 'url') {
      if (btn.targetUrl) {
        window.open(btn.targetUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (btn.actionType === 'navigate') {
      if (btn.targetTab && onNavigateTab) {
        onNavigateTab(btn.targetTab as TabType);
      }
    } else if (btn.actionType === 'copy') {
      const textToCopy = btn.payload || btn.targetUrl || '';
      if (textToCopy && navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy);
        setCopiedButtonId(btn.id);
        setTimeout(() => setCopiedButtonId(null), 2500);
      }
    } else if (btn.actionType === 'email') {
      if (btn.targetUrl) {
        window.location.href = `mailto:${btn.targetUrl}`;
      }
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {/* Optional Custom Notice Banner */}
      {customNotice && customNotice.text && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-in slide-in-from-top-2 duration-200 ${
            customNotice.type === 'announcement'
              ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200'
              : customNotice.type === 'warning'
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
              : customNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
              : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60 text-blue-900 dark:text-blue-200'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="p-1.5 rounded-xl bg-white/60 dark:bg-white/10 shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <p className="text-xs sm:text-sm font-semibold truncate sm:whitespace-normal">
              {customNotice.text}
            </p>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-white/60 dark:bg-white/10 shrink-0">
            Aviso
          </span>
        </div>
      )}

      {/* Main Banner */}
      <div
        className={`relative p-4 sm:p-5 rounded-3xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/80 dark:border-slate-800/80 shadow-md transition-all duration-300 group ${
          isColorPickerOpen ? 'z-30' : 'z-10'
        }`}
        style={{
          boxShadow: `0 8px 30px -10px ${pageColor}26`,
        }}
      >
        {/* Background layer with isolated overflow-hidden to prevent clipping dropdowns */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          {/* Dynamic Ambient Background Glow inside the Banner */}
          <div
            className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl opacity-20 dark:opacity-25 transition-colors duration-500"
            style={{ backgroundColor: pageColor }}
          />
          <div
            className="absolute top-0 left-0 h-1.5 w-full transition-colors duration-500"
            style={{ backgroundColor: pageColor }}
          />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Side: Page Icon, Title & Category */}
          <div className="flex items-center space-x-3.5 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all duration-300 transform group-hover:scale-105 shrink-0"
              style={{
                backgroundColor: pageColor,
                boxShadow: `0 6px 18px ${pageColor}50`,
              }}
            >
              <IconComponent className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs transition-colors"
                  style={{
                    backgroundColor: `${pageColor}15`,
                    color: pageColor,
                    borderColor: `${pageColor}40`,
                  }}
                >
                  {pageMeta.category}
                </span>

                {modConfig?.badge && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    {modConfig.badge}
                  </span>
                )}

                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  • Color de Tema Activo
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug mt-0.5 truncate">
                {displayTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
                {displaySubtitle}
              </p>
            </div>
          </div>

          {/* Right Side: Quick Action Buttons & Controls */}
          <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2 self-start sm:self-center">
            {/* Action Buttons Added to this Module */}
            {actionButtons.map((btn) => {
              const BtnIcon = getMinistryIconComponent(btn.icon || 'ExternalLink');
              const isCopied = copiedButtonId === btn.id;

              let btnClasses =
                'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20';
              if (btn.variant === 'indigo') {
                btnClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20';
              } else if (btn.variant === 'sky') {
                btnClasses = 'bg-sky-600 hover:bg-sky-700 text-white shadow-sky-600/20';
              } else if (btn.variant === 'amber') {
                btnClasses = 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20';
              } else if (btn.variant === 'rose') {
                btnClasses = 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20';
              } else if (btn.variant === 'purple') {
                btnClasses = 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20';
              } else if (btn.variant === 'secondary') {
                btnClasses =
                  'bg-slate-700 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white';
              } else if (btn.variant === 'outline') {
                btnClasses =
                  'bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700';
              }

              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleButtonClick(btn)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all transform hover:scale-105 cursor-pointer ${btnClasses}`}
                  title={btn.label}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <BtnIcon className="w-3.5 h-3.5" />
                      <span>{btn.label}</span>
                    </>
                  )}
                </button>
              );
            })}

            {/* Quick Edit Module shortcut for Dev/Admin */}
            {(isDevUser || onOpenModuleEditor) && (
              <button
                type="button"
                onClick={() => onOpenModuleEditor && onOpenModuleEditor(activeTab)}
                className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs"
                title="Editar este módulo (cambiar orden, botones, iconos o avisos)"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}

            {/* Color Customizer for THIS page */}
            <div className="relative shrink-0 z-50" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700/90 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs hover:shadow-xs transition-all cursor-pointer text-xs font-bold text-slate-800 dark:text-slate-200"
                title="Personalizar el color distintivo de este módulo"
              >
                <Palette className="w-3.5 h-3.5" style={{ color: pageColor }} />
                <span>Color:</span>
                <div
                  className="w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 shadow-xs transition-colors"
                  style={{ backgroundColor: pageColor }}
                />
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${
                    isColorPickerOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Color Picker Popover Dropdown */}
              {isColorPickerOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 p-4 rounded-3xl bg-white/98 dark:bg-slate-900/98 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5 dark:ring-white/10">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center space-x-1.5">
                      <Palette className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        Personalizar Color de Página
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onResetPageColor(activeTab);
                        setIsColorPickerOpen(false);
                      }}
                      className="text-[11px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold flex items-center space-x-1 cursor-pointer"
                      title="Restablecer al color por defecto del tema"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer</span>
                    </button>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-2">
                      Paleta de Tonos Recomendados:
                    </span>
                    <div className="grid grid-cols-6 gap-2">
                      {QUICK_PAGE_COLOR_PRESETS.map((preset) => {
                        const isSelected =
                          (pageColor || '').toLowerCase() === (preset.hex || '').toLowerCase();
                        return (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() => {
                              onUpdatePageColor(activeTab, preset.hex);
                            }}
                            title={preset.name}
                            className={`w-8 h-8 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center shadow-2xs ${
                              isSelected
                                ? 'border-indigo-600 scale-110 shadow-md ring-2 ring-indigo-500/40'
                                : 'border-white dark:border-slate-800 hover:scale-105'
                            }`}
                            style={{ backgroundColor: preset.hex }}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Custom Hex Color Picker */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Selector Libre / HEX:
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-slate-500 uppercase">
                        {pageColor}
                      </span>
                      <label
                        className="w-7 h-7 rounded-xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer shadow-xs relative overflow-hidden"
                        title="Elegir cualquier color con el selector del sistema"
                        style={{ backgroundColor: pageColor }}
                      >
                        <input
                          type="color"
                          value={pageColor}
                          onChange={(e) => onUpdatePageColor(activeTab, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
