import React, { useState, useRef } from 'react';
import {
  MinistryItem,
  MinistryWorkPlan,
  Member,
  MinistryCastingCall,
  ChurchConfig,
  MinistryCustomTab,
  MinistryCustomTabItem,
} from '../../types';
import { getMinistryIconComponent, MINISTRY_COLOR_PRESETS } from '../../utils/ministryIcons';
import { MinistryWorkPlanTab } from './MinistryWorkPlanTab';
import { MinistryMembersDirectoryTab } from './MinistryMembersDirectoryTab';
import { MinistryCastingTab } from './MinistryCastingTab';
import {
  Target,
  Users,
  Sparkles,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  Plus,
  ArrowLeft,
  Share2,
  CheckCircle2,
  Sliders,
  Edit3,
  Upload,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  CheckSquare,
  Package,
  BookOpen,
  Music,
  ExternalLink,
  Save,
  X,
  Check,
  CheckSquare2,
  Square,
  FolderOpen,
} from 'lucide-react';

interface GenericMinistryViewProps {
  ministry: MinistryItem;
  config: ChurchConfig;
  members: Member[];
  workPlans: MinistryWorkPlan[];
  castingCalls?: MinistryCastingCall[];
  onAddPlan: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan: (plan: MinistryWorkPlan) => void;
  onDeletePlan: (id: string) => void;
  onUpdateMember: (member: Member) => void;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onAddCasting?: (casting: Omit<MinistryCastingCall, 'id'>) => void;
  onUpdateCasting?: (casting: MinistryCastingCall) => void;
  onDeleteCasting?: (id: string) => void;
  onBackToHub?: () => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
}

export const GenericMinistryView: React.FC<GenericMinistryViewProps> = ({
  ministry,
  config,
  members,
  workPlans,
  castingCalls = [],
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateMember,
  onAddMember,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onBackToHub,
  onUpdateConfig,
}) => {
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Active sub-tab state
  const enabledTabs = ministry.enabledTabs && ministry.enabledTabs.length > 0
    ? ministry.enabledTabs
    : ['plans', 'members', 'castings'];
  
  const [activeTab, setActiveTab] = useState<string>(enabledTabs[0] || 'plans');

  // Custom Banner / Logo data resolved from config or ministry
  const customBannerConfig = config.customBanners?.[ministry.id] || {};
  const currentLogo = config.ministryLogos?.[ministry.id] || ministry.logoUrl || customBannerConfig.logoUrl || '';
  const currentTitle = customBannerConfig.title || ministry.bannerTitle || ministry.name;
  const currentSubtitle = customBannerConfig.subtitle || ministry.bannerSubtitle || ministry.description;
  const currentBadge = customBannerConfig.badge || ministry.badge || 'Ministerio Eclesial';
  const currentGradient = customBannerConfig.gradientStyle || ministry.bannerGradient || 'glow';
  const currentLogoPosition = customBannerConfig.logoPosition || ministry.bannerLogoPosition || (currentLogo ? 'side' : 'none');
  const currentLogoOpacity = customBannerConfig.logoOpacity !== undefined ? customBannerConfig.logoOpacity : (ministry.bannerLogoOpacity ?? 0.25);
  const themeColor = config.customTabColors?.[ministry.id] || ministry.color || '#7c3aed';

  const Icon = getMinistryIconComponent(ministry.iconName);

  // Filter plans for this ministry
  const ministryPlans = workPlans.filter((p) => p.ministry === ministry.id);
  const ministryCastings = castingCalls.filter((c) => c.ministry === ministry.id);
  const ministryMembers = members.filter((m) => m.ministries?.includes(ministry.id));

  // Banner & Logo Edit Modal State
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: currentTitle,
    subtitle: currentSubtitle,
    badge: currentBadge,
    color: themeColor,
    gradientStyle: currentGradient,
    logoUrl: currentLogo,
    logoPosition: currentLogoPosition,
    logoOpacity: currentLogoOpacity,
  });

  // Custom Tab Creation / Edition Modal State
  const [isCustomTabModalOpen, setIsCustomTabModalOpen] = useState(false);
  const [customTabForm, setCustomTabForm] = useState<Partial<MinistryCustomTab>>({
    id: '',
    name: '',
    iconName: 'FileText',
    type: 'resources',
    description: '',
  });

  // Resources state inside ministry (Stored in ministry item or local tab)
  const [newResourceForm, setNewResourceForm] = useState({
    title: '',
    url: '',
    category: 'General',
    notes: '',
  });
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);

  // Notes state inside ministry
  const [newNoteForm, setNewNoteForm] = useState({
    title: '',
    content: '',
  });
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  // Checklist state inside custom tabs
  const [newChecklistText, setNewChecklistText] = useState('');

  // Handle Logo Upload from device
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const logoData = event.target.result as string;
          setBannerForm((prev) => ({
            ...prev,
            logoUrl: logoData,
            logoPosition: prev.logoPosition === 'none' ? 'side' : prev.logoPosition,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Banner & Logo Updates to ChurchConfig & Ministry
  const handleSaveBannerUpdates = () => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const updatedMinistries = (prev.ministries || []).map((m) => {
        if (m.id === ministry.id) {
          return {
            ...m,
            name: bannerForm.title || m.name,
            bannerTitle: bannerForm.title,
            bannerSubtitle: bannerForm.subtitle,
            badge: bannerForm.badge,
            color: bannerForm.color,
            bannerGradient: bannerForm.gradientStyle as any,
            logoUrl: bannerForm.logoUrl,
            bannerLogoPosition: bannerForm.logoPosition as any,
            bannerLogoOpacity: bannerForm.logoOpacity,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      return {
        ...prev,
        ministries: updatedMinistries,
        customTabColors: {
          ...prev.customTabColors,
          [ministry.id]: bannerForm.color,
        },
        customBanners: {
          ...prev.customBanners,
          [ministry.id]: {
            title: bannerForm.title,
            subtitle: bannerForm.subtitle,
            badge: bannerForm.badge,
            gradientStyle: bannerForm.gradientStyle as any,
            logoUrl: bannerForm.logoUrl,
            logoPosition: bannerForm.logoPosition as any,
            logoOpacity: bannerForm.logoOpacity,
          },
        },
        ministryLogos: {
          ...prev.ministryLogos,
          [ministry.id]: bannerForm.logoUrl,
        },
      };
    });

    setIsBannerEditorOpen(false);
  };

  // Save New or Edited Custom Tab
  const handleSaveCustomTab = () => {
    if (!customTabForm.name?.trim() || !onUpdateConfig) return;

    const newTabId = customTabForm.id || `tab_${Date.now()}`;
    const newTab: MinistryCustomTab = {
      id: newTabId,
      name: customTabForm.name.trim(),
      iconName: customTabForm.iconName || 'FileText',
      type: customTabForm.type || 'resources',
      description: customTabForm.description?.trim() || '',
      content: customTabForm.content || '',
      items: customTabForm.items || [],
      createdAt: customTabForm.createdAt || new Date().toISOString(),
    };

    onUpdateConfig((prev) => {
      const updatedMinistries = (prev.ministries || []).map((m) => {
        if (m.id === ministry.id) {
          const currentCustomTabs = m.customTabs || [];
          const isEdit = currentCustomTabs.some((t) => t.id === newTabId);
          const updatedTabs = isEdit
            ? currentCustomTabs.map((t) => (t.id === newTabId ? newTab : t))
            : [...currentCustomTabs, newTab];

          return {
            ...m,
            customTabs: updatedTabs,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      return {
        ...prev,
        ministries: updatedMinistries,
      };
    });

    setIsCustomTabModalOpen(false);
    setActiveTab(newTabId);
  };

  // Add Item to a Custom Tab (Resources, Checklist, Notes, Inventory)
  const handleAddItemToCustomTab = (tabId: string, item: Omit<MinistryCustomTabItem, 'id'>) => {
    if (!onUpdateConfig) return;

    const newItem: MinistryCustomTabItem = {
      ...item,
      id: `item_${Date.now()}`,
      date: new Date().toLocaleDateString('es-ES'),
    };

    onUpdateConfig((prev) => {
      const updatedMinistries = (prev.ministries || []).map((m) => {
        if (m.id === ministry.id) {
          const updatedTabs = (m.customTabs || []).map((t) => {
            if (t.id === tabId) {
              return {
                ...t,
                items: [...(t.items || []), newItem],
              };
            }
            return t;
          });
          return { ...m, customTabs: updatedTabs };
        }
        return m;
      });
      return { ...prev, ministries: updatedMinistries };
    });
  };

  // Toggle Checklist Item
  const handleToggleChecklistItem = (tabId: string, itemId: string) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const updatedMinistries = (prev.ministries || []).map((m) => {
        if (m.id === ministry.id) {
          const updatedTabs = (m.customTabs || []).map((t) => {
            if (t.id === tabId) {
              return {
                ...t,
                items: (t.items || []).map((it) =>
                  it.id === itemId ? { ...it, checked: !it.checked } : it
                ),
              };
            }
            return t;
          });
          return { ...m, customTabs: updatedTabs };
        }
        return m;
      });
      return { ...prev, ministries: updatedMinistries };
    });
  };

  // Delete Item from Custom Tab
  const handleDeleteItemFromCustomTab = (tabId: string, itemId: string) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const updatedMinistries = (prev.ministries || []).map((m) => {
        if (m.id === ministry.id) {
          const updatedTabs = (m.customTabs || []).map((t) => {
            if (t.id === tabId) {
              return {
                ...t,
                items: (t.items || []).filter((it) => it.id !== itemId),
              };
            }
            return t;
          });
          return { ...m, customTabs: updatedTabs };
        }
        return m;
      });
      return { ...prev, ministries: updatedMinistries };
    });
  };

  // Gradient styles
  const getBannerGradientBackground = (color: string, style?: string) => {
    switch (style) {
      case 'deep':
        return `linear-gradient(145deg, #090d16 0%, ${color}99 50%, #030712 100%)`;
      case 'vibrant':
        return `linear-gradient(135deg, ${color} 0%, #4338ca 50%, #1e1b4b 100%)`;
      case 'minimal':
        return `linear-gradient(180deg, ${color}33 0%, #0f172a 100%)`;
      case 'glow':
      default:
        return `linear-gradient(135deg, ${color} 0%, #1e1b4b 100%)`;
    }
  };

  // Find active custom tab if activeTab is a custom tab id
  const currentCustomTab = (ministry.customTabs || []).find((t) => t.id === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* HEADER HERO BANNER WITH BANNER & LOGO CUSTOMIZATION */}
      <div
        className="rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden transition-all border border-white/10"
        style={{
          background: getBannerGradientBackground(themeColor, currentGradient),
        }}
      >
        {/* Background Logo Watermark */}
        {currentLogo && (currentLogoPosition === 'background' || currentLogoPosition === 'both') && (
          <div
            className="absolute right-0 bottom-0 pointer-events-none transform translate-x-6 translate-y-6"
            style={{ opacity: currentLogoOpacity }}
          >
            <img
              src={currentLogo}
              alt="Logo de fondo"
              className="w-56 h-56 sm:w-80 sm:h-80 object-contain"
            />
          </div>
        )}

        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            {onBackToHub ? (
              <button
                type="button"
                onClick={onBackToHub}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Centro de Ministerios</span>
              </button>
            ) : <div />}

            {/* Banner & Logo Edit Button */}
            <button
              type="button"
              onClick={() => {
                setBannerForm({
                  title: currentTitle,
                  subtitle: currentSubtitle,
                  badge: currentBadge,
                  color: themeColor,
                  gradientStyle: currentGradient,
                  logoUrl: currentLogo,
                  logoPosition: currentLogoPosition,
                  logoOpacity: currentLogoOpacity,
                });
                setIsBannerEditorOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer backdrop-blur-md shadow-sm border border-white/20"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Banner & Logo</span>
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              {/* Main Logo / Icon Box */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-lg border border-white/30 overflow-hidden">
                {currentLogo && (currentLogoPosition === 'side' || currentLogoPosition === 'both') ? (
                  <img
                    src={currentLogo}
                    alt="Logo oficial"
                    className="w-full h-full object-contain p-1.5"
                  />
                ) : (
                  <Icon className="w-8 h-8 sm:w-10 sm:h-10" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-extrabold uppercase tracking-wider">
                    {currentBadge}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                    Activo
                  </span>
                  {currentLogo && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-bold border border-purple-400/30 flex items-center space-x-1">
                      <ImageIcon className="w-2.5 h-2.5" />
                      <span>Logo Personalizado</span>
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {currentTitle}
                </h1>

                <p className="text-white/85 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  {currentSubtitle}
                </p>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 pt-2 text-xs text-white/90 font-medium">
                  {ministry.leaderName && (
                    <div className="flex items-center space-x-1.5">
                      <User className="w-4 h-4 text-amber-300" />
                      <span>Líder: <strong>{ministry.leaderName}</strong></span>
                    </div>
                  )}
                  {ministry.meetingSchedule && (
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-emerald-300" />
                      <span>Reuniones: {ministry.meetingSchedule}</span>
                    </div>
                  )}
                  {ministry.leaderPhone && (
                    <div className="flex items-center space-x-1.5">
                      <Phone className="w-4 h-4 text-sky-300" />
                      <span>{ministry.leaderPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION & CREATE SUBTAB BUTTON */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3 overflow-x-auto">
        <div className="flex items-center space-x-2 shrink-0">
          {/* STANDARD TAB: PLANS */}
          {enabledTabs.includes('plans') && (
            <button
              type="button"
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'plans'
                  ? 'text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeTab === 'plans' ? { backgroundColor: themeColor } : {}}
            >
              <Target className="w-4 h-4" />
              <span>Plan de Trabajo ({ministryPlans.length})</span>
            </button>
          )}

          {/* STANDARD TAB: MEMBERS */}
          {enabledTabs.includes('members') && (
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'members'
                  ? 'text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeTab === 'members' ? { backgroundColor: themeColor } : {}}
            >
              <Users className="w-4 h-4" />
              <span>Directorio ({ministryMembers.length})</span>
            </button>
          )}

          {/* STANDARD TAB: CASTINGS */}
          {enabledTabs.includes('castings') && (
            <button
              type="button"
              onClick={() => setActiveTab('castings')}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                activeTab === 'castings'
                  ? 'text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              style={activeTab === 'castings' ? { backgroundColor: themeColor } : {}}
            >
              <Sparkles className="w-4 h-4" />
              <span>Audiciones ({ministryCastings.length})</span>
            </button>
          )}

          {/* CUSTOM TABS */}
          {(ministry.customTabs || []).map((ct) => {
            const CtIcon = getMinistryIconComponent(ct.iconName || 'FileText');
            const isActive = activeTab === ct.id;
            return (
              <button
                key={ct.id}
                type="button"
                onClick={() => setActiveTab(ct.id)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                style={isActive ? { backgroundColor: themeColor } : {}}
              >
                <CtIcon className="w-4 h-4" />
                <span>{ct.name}</span>
                {ct.items && ct.items.length > 0 && (
                  <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
                    {ct.items.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Add Custom Tab Button */}
        <button
          type="button"
          onClick={() => {
            setCustomTabForm({
              id: `tab_${Date.now()}`,
              name: '',
              iconName: 'FileText',
              type: 'resources',
              description: '',
            });
            setIsCustomTabModalOpen(true);
          }}
          className="px-3.5 py-1.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-2xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Pestaña</span>
        </button>
      </div>

      {/* SUBTAB CONTENT: STANDARD TABS */}
      {activeTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry={ministry.id}
          ministryName={ministry.name}
          pageColor={themeColor}
          plans={workPlans}
          onAddPlan={onAddPlan}
          onUpdatePlan={onUpdatePlan}
          onDeletePlan={onDeletePlan}
          config={config}
          availableLeaders={members.map((m) => m.fullName)}
        />
      )}

      {activeTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId={ministry.id}
          ministryName={ministry.name}
          themeColor={themeColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {activeTab === 'castings' && (
        <MinistryCastingTab
          ministry={ministry.id}
          ministryName={ministry.name}
          pageColor={themeColor}
          castings={castingCalls}
          onAddCasting={onAddCasting || (() => {})}
          onUpdateCasting={onUpdateCasting || (() => {})}
          onDeleteCasting={onDeleteCasting || (() => {})}
          config={config}
        />
      )}

      {/* SUBTAB CONTENT: DYNAMIC CUSTOM TAB RENDERER */}
      {currentCustomTab && (
        <div className="space-y-6">
          {/* Custom Tab Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-extrabold uppercase">
                  Pestaña Personalizada
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {currentCustomTab.type === 'notes'
                    ? 'Notas & Minutas'
                    : currentCustomTab.type === 'checklist'
                    ? 'Lista de Verificación'
                    : currentCustomTab.type === 'custom_list'
                    ? 'Inventario / Elementos'
                    : 'Recursos & Enlaces'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {currentCustomTab.name}
              </h3>
              {currentCustomTab.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {currentCustomTab.description}
                </p>
              )}
            </div>

            {/* Add Item Button for this Custom Tab */}
            <button
              type="button"
              onClick={() => {
                if (currentCustomTab.type === 'resources') setIsAddResourceOpen(true);
                else if (currentCustomTab.type === 'notes') setIsAddNoteOpen(true);
                else if (currentCustomTab.type === 'checklist') {
                  const desc = prompt('Ingresa la tarea o elemento a verificar:');
                  if (desc && desc.trim()) {
                    handleAddItemToCustomTab(currentCustomTab.id, {
                      title: desc.trim(),
                      checked: false,
                    });
                  }
                } else {
                  const title = prompt('Nombre del artículo / equipo a registrar:');
                  if (title && title.trim()) {
                    handleAddItemToCustomTab(currentCustomTab.id, {
                      title: title.trim(),
                      status: 'Disponible',
                      quantity: 1,
                    });
                  }
                }
              }}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs flex items-center space-x-2 shadow-md cursor-pointer self-start sm:self-auto transition-all transform hover:scale-[1.02]"
              style={{ backgroundColor: themeColor }}
            >
              <Plus className="w-4 h-4" />
              <span>
                {currentCustomTab.type === 'resources'
                  ? 'Agregar Enlace / Recurso'
                  : currentCustomTab.type === 'notes'
                  ? 'Escribir Nota / Minuta'
                  : currentCustomTab.type === 'checklist'
                  ? 'Agregar Tarea'
                  : 'Registrar Artículo'}
              </span>
            </button>
          </div>

          {/* RENDER CONTENT BY TYPE */}

          {/* 1. RESOURCES & LINKS */}
          {currentCustomTab.type === 'resources' && (
            <div className="space-y-4">
              {isAddResourceOpen && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-purple-200 dark:border-purple-800 space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Nuevo Enlace o Documento Digital
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newResourceForm.title}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, title: e.target.value })}
                      placeholder="Título (Ej. Partituras Domingo / Carpeta de Fotos)"
                      className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <input
                      type="url"
                      value={newResourceForm.url}
                      onChange={(e) => setNewResourceForm({ ...newResourceForm, url: e.target.value })}
                      placeholder="URL del enlace (Google Drive, YouTube, Dropbox, etc.)"
                      className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <input
                    type="text"
                    value={newResourceForm.notes}
                    onChange={(e) => setNewResourceForm({ ...newResourceForm, notes: e.target.value })}
                    placeholder="Descripción o notas adicionales (opcional)..."
                    className="w-full px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddResourceOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newResourceForm.title.trim()) return;
                        handleAddItemToCustomTab(currentCustomTab.id, {
                          title: newResourceForm.title.trim(),
                          url: newResourceForm.url.trim(),
                          notes: newResourceForm.notes.trim(),
                        });
                        setNewResourceForm({ title: '', url: '', category: 'General', notes: '' });
                        setIsAddResourceOpen(false);
                      }}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                    >
                      Guardar Recurso
                    </button>
                  </div>
                </div>
              )}

              {(!currentCustomTab.items || currentCustomTab.items.length === 0) ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <LinkIcon className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No hay recursos agregados todavía
                  </h4>
                  <p className="text-xs text-slate-500">
                    Haz clic en «Agregar Enlace / Recurso» para compartir carpetas de Google Drive, enlaces a partituras, videos o audios.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentCustomTab.items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3 hover:shadow-md transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteItemFromCustomTab(currentCustomTab.id, it.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-all cursor-pointer"
                            title="Eliminar recurso"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {it.title}
                        </h4>

                        {it.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                            {it.notes}
                          </p>
                        )}
                      </div>

                      {it.url && (
                        <a
                          href={it.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Enlace</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. NOTES & MINUTES */}
          {currentCustomTab.type === 'notes' && (
            <div className="space-y-4">
              {isAddNoteOpen && (
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-md border border-purple-200 dark:border-purple-800 space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Nueva Nota o Minuta Ministerial
                  </h4>
                  <input
                    type="text"
                    value={newNoteForm.title}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, title: e.target.value })}
                    placeholder="Título de la Nota / Reunión..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <textarea
                    rows={4}
                    value={newNoteForm.content}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, content: e.target.value })}
                    placeholder="Escribe el contenido, acuerdos, peticiones de oración o notas..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddNoteOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!newNoteForm.title.trim()) return;
                        handleAddItemToCustomTab(currentCustomTab.id, {
                          title: newNoteForm.title.trim(),
                          notes: newNoteForm.content.trim(),
                        });
                        setNewNoteForm({ title: '', content: '' });
                        setIsAddNoteOpen(false);
                      }}
                      className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
                    >
                      Guardar Nota
                    </button>
                  </div>
                </div>
              )}

              {(!currentCustomTab.items || currentCustomTab.items.length === 0) ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    No hay minutas ni notas registradas
                  </h4>
                  <p className="text-xs text-slate-500">
                    Registra acuerdos de reuniones, instrucciones o peticiones especiales para este ministerio.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentCustomTab.items.map((it) => (
                    <div
                      key={it.id}
                      className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-purple-500" />
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                            {it.title}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2">
                          {it.date && (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {it.date}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteItemFromCustomTab(currentCustomTab.id, it.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {it.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {it.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. CHECKLIST / VERIFICACIÓN */}
          {currentCustomTab.type === 'checklist' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="space-y-2">
                {(!currentCustomTab.items || currentCustomTab.items.length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    No hay tareas en la lista de verificación. Pulsa «Agregar Tarea» arriba.
                  </p>
                ) : (
                  currentCustomTab.items.map((it) => (
                    <div
                      key={it.id}
                      onClick={() => handleToggleChecklistItem(currentCustomTab.id, it.id)}
                      className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                        it.checked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 opacity-80'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                            it.checked
                              ? 'bg-emerald-600 text-white'
                              : 'border border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {it.checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            it.checked
                              ? 'line-through text-slate-400'
                              : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {it.title}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItemFromCustomTab(currentCustomTab.id, it.id);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 4. INVENTORY / ITEMS LIST */}
          {currentCustomTab.type === 'custom_list' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              {(!currentCustomTab.items || currentCustomTab.items.length === 0) ? (
                <div className="text-center py-6 space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">
                    No hay artículos registrados. Pulsa «Registrar Artículo» para añadir elementos.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentCustomTab.items.map((it) => (
                    <div
                      key={it.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {it.title}
                        </h5>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                            Cant: {it.quantity || 1}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-semibold">
                            {it.status || 'Disponible'}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteItemFromCustomTab(currentCustomTab.id, it.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EDIT BANNER & UPLOAD LOGO */}
      {isBannerEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Editar Banner & Logo del Ministerio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personaliza la apariencia, sube tu logo oficial y ajusta el degradado.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerEditorOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* SUBIDA DE LOGO */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Logo Oficial del Ministerio</span>
                  {bannerForm.logoUrl && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      Logo cargado ✓
                    </span>
                  )}
                </label>

                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {bannerForm.logoUrl ? (
                      <img src={bannerForm.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <Icon className="w-7 h-7 text-purple-500" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{bannerForm.logoUrl ? 'Cambiar Imagen' : 'Subir Archivo'}</span>
                      </button>

                      {bannerForm.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setBannerForm({ ...bannerForm, logoUrl: '' })}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 text-xs font-bold cursor-pointer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <input
                      type="url"
                      value={bannerForm.logoUrl}
                      onChange={(e) => setBannerForm({ ...bannerForm, logoUrl: e.target.value })}
                      placeholder="O pega URL de imagen..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {bannerForm.logoUrl && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Posición del Logo
                      </label>
                      <select
                        value={bannerForm.logoPosition}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, logoPosition: e.target.value as any })
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
                      >
                        <option value="side">Lateral Principal</option>
                        <option value="background">Fondo con Marca de Agua</option>
                        <option value="both">Ambos (Lateral y Fondo)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        <span>Opacidad Fondo</span>
                        <span>{Math.round((bannerForm.logoOpacity || 0.25) * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={bannerForm.logoOpacity}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, logoOpacity: parseFloat(e.target.value) })
                        }
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* TÍTULO Y SUBTÍTULO */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Título del Banner
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Subtítulo / Lema
                </label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* INSIGNIA & DEGRADADO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Insignia (*Badge*)
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Estilo de Degradado
                  </label>
                  <select
                    value={bannerForm.gradientStyle}
                    onChange={(e) => setBannerForm({ ...bannerForm, gradientStyle: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white"
                  >
                    <option value="glow">✨ Resplandor Glow</option>
                    <option value="deep">🌌 Deep Contrast</option>
                    <option value="vibrant">🔥 Vibrante Vivo</option>
                    <option value="minimal">🍃 Minimalista</option>
                  </select>
                </div>
              </div>

              {/* COLOR TEMÁTICO */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Color de Fondo Primario
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {MINISTRY_COLOR_PRESETS.slice(0, 8).map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, color: p.hex })}
                      className={`w-8 h-8 rounded-xl cursor-pointer transition-all ${
                        bannerForm.color === p.hex ? 'ring-2 ring-purple-600 scale-110' : ''
                      }`}
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                  <input
                    type="color"
                    value={bannerForm.color}
                    onChange={(e) => setBannerForm({ ...bannerForm, color: e.target.value })}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent p-0"
                  />
                </div>
              </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBannerEditorOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBannerUpdates}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Guardar Banner & Logo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREAR PESTAÑA PERSONALIZADA */}
      {isCustomTabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Nueva Pestaña para {ministry.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crea un submódulo dedicado para el trabajo de este ministerio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomTabModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Nombre de la Pestaña *
                </label>
                <input
                  type="text"
                  value={customTabForm.name || ''}
                  onChange={(e) => setCustomTabForm({ ...customTabForm, name: e.target.value })}
                  placeholder="Ej. Inventario / Cancionero / Minutas"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Tipo de Pestaña
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'resources', label: 'Recursos & Enlaces', icon: LinkIcon },
                    { type: 'notes', label: 'Notas & Minutas', icon: FileText },
                    { type: 'checklist', label: 'Checklist / Tareas', icon: CheckSquare },
                    { type: 'custom_list', label: 'Inventario / Elementos', icon: Package },
                  ].map((it) => (
                    <div
                      key={it.type}
                      onClick={() => setCustomTabForm({ ...customTabForm, type: it.type as any })}
                      className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center space-x-2 ${
                        customTabForm.type === it.type
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <it.icon className="w-4 h-4 text-purple-600" />
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {it.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={customTabForm.description || ''}
                  onChange={(e) => setCustomTabForm({ ...customTabForm, description: e.target.value })}
                  placeholder="Propósito de esta pestaña..."
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCustomTabModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveCustomTab}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Crear Pestaña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
