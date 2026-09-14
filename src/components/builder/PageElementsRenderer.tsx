import React, { useState } from 'react';
import {
  Sparkles,
  ExternalLink,
  MessageCircle,
  Phone,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  BookOpen,
  DollarSign,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Play,
  Share2,
  ArrowRight,
  Target,
  Layers,
  Mail,
  Download,
  Heart,
  Send,
} from 'lucide-react';
import { PageElementItem, PageMenuItem, TabType } from '../../types';
import { getMinistryIconComponent } from '../../utils/ministryIcons';

interface PageElementsRendererProps {
  elements: PageElementItem[];
  onNavigateToTab?: (tab: TabType | string) => void;
  onShowToast?: (message: string) => void;
  isEditing?: boolean;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onDuplicate?: (element: PageElementItem) => void;
  onDelete?: (elementId: string) => void;
  onEditElement?: (element: PageElementItem) => void;
}

export const PageElementsRenderer: React.FC<PageElementsRendererProps> = ({
  elements,
  onNavigateToTab,
  onShowToast,
  isEditing = false,
  selectedElementId,
  onSelectElement,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onEditElement,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedAccordionIds, setExpandedAccordionIds] = useState<Record<string, boolean>>({});

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onShowToast) onShowToast('¡Copiado al portapapeles!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAction = (
    actionType: string | undefined,
    targetTab?: string,
    url?: string,
    payload?: string
  ) => {
    if (isEditing) return; // Disable actions while in editor canvas

    switch (actionType) {
      case 'navigate':
        if (targetTab && onNavigateToTab) {
          onNavigateToTab(targetTab);
        }
        break;
      case 'url':
        if (url) {
          window.open(url.startsWith('http') ? url : `https://${url}`, '_blank', 'noopener,noreferrer');
        }
        break;
      case 'whatsapp':
        if (url || payload) {
          const rawNumber = (url || '').replace(/[^0-9]/g, '');
          const msg = encodeURIComponent(payload || '¡Hola! Me contacto desde la aplicación de la iglesia.');
          window.open(`https://wa.me/${rawNumber}?text=${msg}`, '_blank');
        }
        break;
      case 'phone':
        if (url) {
          window.location.href = `tel:${url.replace(/[^0-9+]/g, '')}`;
        }
        break;
      case 'toast':
        if (onShowToast) {
          onShowToast(payload || 'Acción completada con éxito');
        }
        break;
      case 'copy':
        if (payload) {
          handleCopy(payload, 'btn-action');
        }
        break;
      case 'donations':
        if (onNavigateToTab) {
          onNavigateToTab('donaciones');
        }
        break;
      case 'share': {
        const shareTitle = payload || 'Iglesia Central Monte Sinaí';
        const shareUrl = url || window.location.href;
        if (navigator.share) {
          navigator.share({ title: shareTitle, url: shareUrl }).catch(() => {});
        } else {
          handleCopy(shareUrl, 'btn-share');
          if (onShowToast) onShowToast('¡Enlace copiado para compartir!');
        }
        break;
      }
      case 'prayer_modal':
        if (onNavigateToTab) {
          onNavigateToTab('chat');
        }
        if (onShowToast) {
          onShowToast(payload || 'Abre el grupo de oración para enviar tu petición');
        }
        break;
      case 'email':
        if (url) {
          const subj = encodeURIComponent(payload || 'Contacto desde la aplicación');
          window.location.href = `mailto:${url}?subject=${subj}`;
        }
        break;
      case 'download':
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = payload || 'descarga';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          if (onShowToast) onShowToast('Iniciando descarga...');
        }
        break;
      default:
        break;
    }
  };

  const toggleAccordion = (itemId: string) => {
    setExpandedAccordionIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Convert regular YouTube URL into an embeddable URL
  const getEmbedYouTubeUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const renderSingleElement = (el: PageElementItem, index: number, isNested = false) => {
    const isSelected = selectedElementId === el.id;
    const IconComp = el.iconName ? getMinistryIconComponent(el.iconName) : null;

    const alignClass =
      el.align === 'center'
        ? 'text-center items-center justify-center'
        : el.align === 'right'
        ? 'text-right items-end justify-end'
        : 'text-left items-start justify-start';

    // ELEMENT INNER CONTENT BY TYPE
    let elementContent: React.ReactNode = null;

    switch (el.type) {
      case 'text': {
        const variant = el.textVariant || 'paragraph';
        if (variant === 'h1') {
          elementContent = (
            <div className={`space-y-1.5 ${alignClass}`}>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight"
                style={{ color: el.color }}
              >
                {el.title || el.content || 'Título Principal'}
              </h1>
              {el.subtitle && (
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                  {el.subtitle}
                </p>
              )}
            </div>
          );
        } else if (variant === 'h2') {
          elementContent = (
            <div className={`space-y-1 ${alignClass}`}>
              <h2
                className="text-xl sm:text-2xl font-black tracking-tight"
                style={{ color: el.color }}
              >
                {el.title || el.content || 'Subtítulo Destacado'}
              </h2>
              {el.subtitle && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {el.subtitle}
                </p>
              )}
            </div>
          );
        } else if (variant === 'h3') {
          elementContent = (
            <div className={`space-y-0.5 ${alignClass}`}>
              <h3
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white"
                style={{ color: el.color }}
              >
                {el.title || el.content || 'Encabezado de Sección'}
              </h3>
              {el.subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400">{el.subtitle}</p>
              )}
            </div>
          );
        } else if (variant === 'verse') {
          elementContent = (
            <div className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 border-t border-r border-b border-amber-500/20 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-serif italic text-slate-800 dark:text-amber-100/90 leading-relaxed">
                    "{el.content || el.title || 'Porque de tal manera amó Dios al mundo...'}"
                  </p>
                  {el.subtitle && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        — {el.subtitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(`${el.content || el.title} — ${el.subtitle}`, el.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === el.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === el.id ? 'Copiado' : 'Copiar versículo'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        } else if (variant === 'quote') {
          elementContent = (
            <div className="border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-700 dark:text-slate-300">
              <p className="text-sm sm:text-base leading-relaxed">"{el.content || el.title}"</p>
              {el.subtitle && <p className="text-xs font-bold text-indigo-500 mt-1">— {el.subtitle}</p>}
            </div>
          );
        } else {
          // Normal paragraph
          elementContent = (
            <p className={`text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed ${alignClass}`}>
              {el.content || el.title || 'Escribe tu párrafo o contenido informativo aquí...'}
            </p>
          );
        }
        break;
      }

      case 'label': {
        const badgeBg = el.badgeColor || el.color || '#4f46e5';
        elementContent = (
          <div className={`flex ${alignClass}`}>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
              style={{
                backgroundColor: el.badgeVariant === 'outline' ? 'transparent' : `${badgeBg}18`,
                color: badgeBg,
                border: `1px solid ${badgeBg}${el.badgeVariant === 'outline' ? '99' : '33'}`,
              }}
            >
              {IconComp && <IconComp className="w-3.5 h-3.5" />}
              <span>{el.badgeText || el.title || 'Etiqueta'}</span>
            </span>
          </div>
        );
        break;
      }

      case 'button': {
        const variant = el.buttonVariant || 'primary';
        const btnColor = el.color || '#4f46e5';
        const isFull = el.buttonSize === 'full';

        let btnClasses = 'px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ';
        if (isFull) btnClasses += 'w-full ';

        let btnStyle: React.CSSProperties = {};

        if (variant === 'primary' || variant === 'gradient') {
          btnStyle = {
            backgroundColor: btnColor,
            color: '#ffffff',
            boxShadow: `0 4px 14px ${btnColor}40`,
          };
        } else if (variant === 'outline') {
          btnStyle = {
            border: `2px solid ${btnColor}`,
            color: btnColor,
            backgroundColor: 'transparent',
          };
        } else if (variant === 'soft') {
          btnStyle = {
            backgroundColor: `${btnColor}18`,
            color: btnColor,
          };
        } else if (variant === 'danger') {
          btnStyle = {
            backgroundColor: '#ef4444',
            color: '#ffffff',
          };
        } else {
          // secondary
          btnClasses += 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 ';
        }

        elementContent = (
          <div className={`flex ${alignClass}`}>
            <button
              type="button"
              onClick={() =>
                handleAction(
                  el.buttonActionType,
                  el.buttonTargetTab,
                  el.buttonUrl,
                  el.buttonPayload
                )
              }
              className={btnClasses}
              style={btnStyle}
            >
              {IconComp && <IconComp className="w-4 h-4" />}
              <span>{el.title || 'Hacer Clic Aquí'}</span>
              {el.buttonActionType === 'url' && <ExternalLink className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'whatsapp' && <MessageCircle className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'phone' && <Phone className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'navigate' && <ArrowRight className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'share' && <Share2 className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'prayer_modal' && <Heart className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'email' && <Mail className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'download' && <Download className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'copy' && <Copy className="w-3.5 h-3.5 opacity-80" />}
              {el.buttonActionType === 'donations' && <DollarSign className="w-3.5 h-3.5 opacity-80" />}
            </button>
          </div>
        );
        break;
      }

      case 'banner': {
        const gradStyle = el.bannerGradientStyle || 'glow';
        const overlayOp = el.bannerOverlayOpacity ?? 0.6;
        const bannerColor = el.color || '#4f46e5';
        const isCompact = el.bannerHeight === 'compact';
        const isTall = el.bannerHeight === 'tall';

        let gradCss = 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
        if (gradStyle === 'emerald') {
          gradCss = 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)';
        } else if (gradStyle === 'gold') {
          gradCss = 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)';
        } else if (gradStyle === 'sunset') {
          gradCss = 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)';
        } else if (gradStyle === 'royal') {
          gradCss = 'linear-gradient(135deg, #6366f1 0%, #4338ca 50%, #312e81 100%)';
        } else if (gradStyle === 'dark_luxury') {
          gradCss = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #020617 100%)';
        } else if (gradStyle === 'deep') {
          gradCss = `linear-gradient(135deg, ${bannerColor} 0%, #0f172a 100%)`;
        } else if (gradStyle === 'vibrant') {
          gradCss = `linear-gradient(135deg, ${bannerColor} 0%, #ec4899 100%)`;
        } else if (gradStyle === 'minimal') {
          gradCss = `linear-gradient(135deg, ${bannerColor}22 0%, ${bannerColor}0a 100%)`;
        }

        const BannerIcon = el.iconName ? getMinistryIconComponent(el.iconName) : Sparkles;

        elementContent = (
          <div
            className={`relative overflow-hidden rounded-3xl text-white shadow-xl transition-all ${
              isCompact ? 'p-5 sm:p-6' : isTall ? 'p-8 sm:p-12' : 'p-6 sm:p-8'
            }`}
            style={{ background: gradCss }}
          >
            {/* Background Image Overlay if provided */}
            {el.imageUrl && (
              <div
                className="absolute inset-0 bg-cover bg-center mix-blend-overlay pointer-events-none"
                style={{
                  backgroundImage: `url(${el.imageUrl})`,
                  opacity: overlayOp,
                }}
              />
            )}

            {/* Ambient gradient glow effect */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/15 rounded-full blur-3xl pointer-events-none" />

            {/* Content wrapper */}
            <div className={`relative z-10 flex flex-col ${alignClass} space-y-3`}>
              <div className="flex items-center gap-2 flex-wrap">
                {el.badgeText && (
                  <span
                    className="px-3 py-1 rounded-full text-xs font-black shadow-sm tracking-wide inline-flex items-center gap-1.5"
                    style={{
                      backgroundColor: el.badgeColor ? `${el.badgeColor}33` : 'rgba(255,255,255,0.2)',
                      color: el.badgeColor || '#ffffff',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <BannerIcon className="w-3.5 h-3.5" />
                    <span>{el.badgeText}</span>
                  </span>
                )}
              </div>

              <h2 className={`font-black tracking-tight text-white leading-tight ${isCompact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl lg:text-4xl'}`}>
                {el.title || el.content || 'Título del Banner'}
              </h2>

              {el.subtitle && (
                <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed font-medium">
                  {el.subtitle}
                </p>
              )}

              {/* Banner CTA Button */}
              {el.bannerCtaText && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(
                        el.bannerCtaActionType || 'navigate',
                        el.bannerCtaTargetTab,
                        el.bannerCtaUrl,
                        el.bannerCtaPayload
                      )
                    }
                    className="px-5 py-2.5 rounded-2xl bg-white hover:bg-white/95 text-slate-900 font-extrabold text-xs sm:text-sm shadow-lg transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <span>{el.bannerCtaText}</span>
                    <ArrowRight className="w-4 h-4 text-indigo-600" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
        break;
      }

      case 'progressbar': {
        const cur = el.progressCurrent ?? 75;
        const tot = el.progressTotal ?? 100;
        const pct = el.progressPercentage ?? Math.min(100, Math.round((cur / (tot || 1)) * 100));
        const barColor = el.progressColor || el.color || '#10b981';

        elementContent = (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                  style={{ backgroundColor: barColor }}
                >
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {el.title || el.progressLabel || 'Meta de Progreso'}
                  </h4>
                  {el.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{el.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="text-right">
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs"
                  style={{ backgroundColor: `${barColor}20`, color: barColor }}
                >
                  {pct}%
                </span>
                {el.progressTotal !== undefined && (
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    ${cur.toLocaleString()} / ${tot.toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* The progress bar track */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  backgroundColor: barColor,
                  backgroundImage:
                    el.progressStyle === 'striped'
                      ? 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)'
                      : undefined,
                  backgroundSize: '1rem 1rem',
                }}
              />
            </div>

            {/* Optional bottom action button */}
            {el.hasActionButton && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    handleAction('navigate', el.actionButtonTab || 'donaciones')
                  }
                  className="text-xs font-bold px-3.5 py-1.5 rounded-xl text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                  style={{ backgroundColor: barColor }}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{el.actionButtonText || 'Ofrendar a esta Meta'}</span>
                </button>
              </div>
            )}
          </div>
        );
        break;
      }

      case 'menu': {
        const menuType = el.menuType || 'grid';
        const items: PageMenuItem[] = el.menuItems && el.menuItems.length > 0 ? el.menuItems : [
          { id: '1', label: 'Directorio de Miembros', description: 'Contactos y líderes', iconName: 'Users', actionType: 'navigate', targetTab: 'directory' },
          { id: '2', label: 'Próximos Eventos', description: 'Calendario de cultos', iconName: 'Calendar', actionType: 'navigate', targetTab: 'events' },
          { id: '3', label: 'Canales de Donación', description: 'Diezmos y ofrendas', iconName: 'HeartHandshake', actionType: 'navigate', targetTab: 'donaciones' },
        ];

        if (menuType === 'accordion') {
          elementContent = (
            <div className="space-y-2">
              {el.title && (
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {el.title}
                </h4>
              )}
              {items.map((it, itIdx) => {
                const isExpanded = !!expandedAccordionIds[it.id];
                const ItemIcon = it.iconName ? getMinistryIconComponent(it.iconName) : Info;
                return (
                  <div
                    key={`${it.id || 'it'}_${itIdx}`}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(it.id)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {it.label}
                          </span>
                          {it.badge && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              {it.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 leading-relaxed">
                        <p>{it.description || 'Contenido detallado para este punto del menú.'}</p>
                        {it.targetTab && (
                          <button
                            type="button"
                            onClick={() => handleAction(it.actionType || 'navigate', it.targetTab, it.url, it.payload)}
                            className="mt-3 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>Ir a {it.label}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        } else if (menuType === 'list') {
          elementContent = (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden">
              {el.title && (
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 font-bold text-xs text-slate-500 uppercase tracking-wider">
                  {el.title}
                </div>
              )}
              {items.map((it, itIdx) => {
                const ItemIcon = it.iconName ? getMinistryIconComponent(it.iconName) : ChevronRight;
                return (
                  <button
                    key={`${it.id || 'it'}_${itIdx}`}
                    type="button"
                    onClick={() => handleAction(it.actionType, it.targetTab, it.url, it.payload)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shrink-0">
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {it.label}
                        </h5>
                        {it.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {it.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {it.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          {it.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          );
        } else {
          // Grid menu
          const colsClass =
            el.menuColumns === 1
              ? 'grid-cols-1'
              : el.menuColumns === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : el.menuColumns === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

          elementContent = (
            <div className="space-y-2">
              {el.title && (
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                  {el.title}
                </h4>
              )}
              <div className={`grid ${colsClass} gap-3`}>
                {items.map((it, itIdx) => {
                  const ItemIcon = it.iconName ? getMinistryIconComponent(it.iconName) : Sparkles;
                  return (
                    <button
                      key={`${it.id || 'it'}_${itIdx}`}
                      type="button"
                      onClick={() => handleAction(it.actionType, it.targetTab, it.url, it.payload)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 hover:shadow-md transition-all text-left flex flex-col justify-between space-y-3 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
                          <ItemIcon className="w-5 h-5" />
                        </div>
                        {it.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
                            {it.badge}
                          </span>
                        )}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {it.label}
                        </h5>
                        {it.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {it.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }
        break;
      }

      case 'frame': {
        const frameStyle = el.frameStyle || 'card';
        const children = el.childElements || [];

        let frameClasses = 'p-5 sm:p-6 rounded-3xl transition-all space-y-4 ';

        if (frameStyle === 'glass') {
          frameClasses += 'bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white/60 dark:border-slate-800/60 shadow-lg';
        } else if (frameStyle === 'hero') {
          const heroGrad = el.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
          return (
            <div
              className="p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden space-y-3"
              style={{ background: heroGrad }}
            >
              <div className="relative z-10 space-y-2">
                {el.badgeText && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 backdrop-blur-md text-white border border-white/30 inline-block">
                    {el.badgeText}
                  </span>
                )}
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {el.title || 'Cabecera Visual de Página'}
                </h2>
                {el.subtitle && (
                  <p className="text-sm sm:text-base text-white/90 max-w-2xl leading-relaxed">
                    {el.subtitle}
                  </p>
                )}
                {children.length > 0 && (
                  <div className="pt-3 space-y-4">
                    {children.map((child, cIdx) => renderSingleElement(child, cIdx, true))}
                  </div>
                )}
              </div>
            </div>
          );
        } else if (frameStyle === 'alert') {
          const tone = el.frameAlertTone || 'info';
          let toneBg = 'bg-blue-500/10 border-blue-500/30 text-blue-800 dark:text-blue-200';
          let ToneIcon = Info;
          if (tone === 'success') {
            toneBg = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200';
            ToneIcon = CheckCircle2;
          } else if (tone === 'warning') {
            toneBg = 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200';
            ToneIcon = AlertTriangle;
          } else if (tone === 'error') {
            toneBg = 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-200';
            ToneIcon = AlertCircle;
          }

          elementContent = (
            <div className={`p-4 sm:p-5 rounded-2xl border ${toneBg} flex items-start gap-3 shadow-xs`}>
              <ToneIcon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-bold">{el.title || 'Aviso Importante'}</h4>
                <p className="text-xs leading-relaxed opacity-90">{el.content || el.subtitle}</p>
              </div>
            </div>
          );
          break;
        } else {
          // Default Card frame
          frameClasses += 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm';
        }

        elementContent = (
          <div className={frameClasses}>
            {(el.title || el.subtitle) && (
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                {el.title && (
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {el.title}
                  </h3>
                )}
                {el.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {el.subtitle}
                  </p>
                )}
              </div>
            )}
            {children.length > 0 ? (
              <div className="space-y-4">
                {children.map((child, cIdx) => renderSingleElement(child, cIdx, true))}
              </div>
            ) : (
              <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Layers className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Marco contenedor (arrastra o agrega elementos aquí)
                </p>
              </div>
            )}
          </div>
        );
        break;
      }

      case 'image': {
        elementContent = (
          <div className="space-y-2">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm">
              <img
                src={el.imageUrl || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1200&q=80'}
                alt={el.imageAlt || el.title || 'Imagen de sección'}
                className="w-full h-auto object-cover max-h-96"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
            {(el.title || el.subtitle) && (
              <div className="text-center px-2">
                {el.title && <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{el.title}</p>}
                {el.subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400">{el.subtitle}</p>}
              </div>
            )}
          </div>
        );
        break;
      }

      case 'video': {
        const embedUrl = getEmbedYouTubeUrl(el.videoUrl || 'https://www.youtube.com/embed/live_stream');
        elementContent = (
          <div className="space-y-2">
            <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md bg-black border border-slate-800">
              <iframe
                src={embedUrl}
                title={el.title || 'Video Reproductor'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            {el.title && (
              <div className="px-1">
                <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">{el.title}</h5>
                {el.subtitle && <p className="text-[11px] text-slate-500">{el.subtitle}</p>}
              </div>
            )}
          </div>
        );
        break;
      }

      case 'stats': {
        elementContent = (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {el.statLabel || el.title || 'Total'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {el.statValue || '1,250'}
              </h3>
              {el.statTrend && (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{el.statTrend}</span>
                </span>
              )}
            </div>
            {IconComp && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <IconComp className="w-6 h-6" />
              </div>
            )}
          </div>
        );
        break;
      }

      case 'divider': {
        elementContent = (
          <div className="py-2 flex items-center gap-3">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
            {el.title && (
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                {el.title}
              </span>
            )}
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
          </div>
        );
        break;
      }

      default:
        elementContent = (
          <div className="p-3 rounded-xl bg-slate-100 text-xs text-slate-500">
            Elemento no reconocido: {el.type}
          </div>
        );
        break;
    }

    // If we're in Builder/Editor mode, wrap with selection outline and floating quick action bar
    if (isEditing && !isNested) {
      return (
        <div
          key={`${el.id || 'el'}_${index}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectElement) onSelectElement(el.id);
          }}
          className={`relative group rounded-2xl p-1 transition-all ${
            isSelected
              ? 'ring-2 ring-indigo-600 dark:ring-indigo-400 shadow-md bg-indigo-50/20 dark:bg-indigo-950/20'
              : 'hover:ring-1 hover:ring-slate-300 dark:hover:ring-slate-700'
          }`}
        >
          {/* Top floating action pill for quick element manipulation */}
          <div
            className={`absolute -top-3.5 right-3 z-20 flex items-center space-x-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-md rounded-full px-2 py-0.5 text-xs transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 mr-1">
              {el.type}
            </span>
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(index);
                }}
                disabled={index === 0}
                title="Mover arriba"
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                ▲
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(index);
                }}
                disabled={index === elements.length - 1}
                title="Mover abajo"
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
              >
                ▼
              </button>
            )}
            {onDuplicate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate(el);
                }}
                title="Duplicar"
                className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
            {onEditElement && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditElement(el);
                }}
                title="Editar propiedades"
                className="p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
              >
                <Layers className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(el.id);
                }}
                title="Eliminar"
                className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {elementContent}
        </div>
      );
    }

    return <div key={`${el.id || 'el'}_${index}`}>{elementContent}</div>;
  };

  if (!elements || elements.length === 0) {
    if (isEditing) {
      return (
        <div className="py-16 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 space-y-3 bg-white/40 dark:bg-slate-900/40">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Lienzo en Blanco
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Agrega componentes desde la barra izquierda (textos, botones, barras de progreso, menús, marcos) o elige una plantilla predefinida para comenzar.
          </p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {elements.map((el, idx) => renderSingleElement(el, idx))}
    </div>
  );
};
