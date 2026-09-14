import React, { useState, useMemo, useRef } from 'react';
import {
  ChurchConfig,
  MinistryItem,
  DEFAULT_MINISTRIES,
  DeletedItem,
  MinistryCustomTab,
} from '../../types';
import {
  MINISTRY_ICON_OPTIONS,
  MINISTRY_COLOR_PRESETS,
  getMinistryIconComponent,
} from '../../utils/ministryIcons';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Layers,
  LayoutGrid,
  ListFilter,
  Search,
  RotateCcw,
  Check,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Sliders,
  Palette,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Info,
  BadgeCheck,
  Flame,
  Globe,
  Tag,
  FileText,
  Save,
  X,
  HelpCircle,
  Upload,
  Image as ImageIcon,
  Layout,
  BookOpen,
  Link,
  CheckSquare,
  Package,
  FileCode,
  Music,
} from 'lucide-react';

interface MinistryManagerViewProps {
  config: ChurchConfig;
  onUpdateConfig?: (updated: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  autoOpenCreateTrigger?: number;
}

const DEFAULT_STANDARD_TABS = [
  {
    id: 'plans',
    label: 'Planes de Trabajo & Metas',
    icon: Calendar,
    description: 'Cronogramas, objetivos trimestrales y listas de tareas con seguimiento.',
  },
  {
    id: 'members',
    label: 'Directorio de Integrantes',
    icon: User,
    description: 'Fichas de servidores, cargos, números de contacto y fechas de ingreso.',
  },
  {
    id: 'castings',
    label: 'Convocatorias & Audiciones',
    icon: Sparkles,
    description: 'Aspirantes, roles requeridos, evaluaciones con puntaje y selección de elenco.',
  },
  {
    id: 'resources',
    label: 'Recursos & Enlaces Digitales',
    icon: Link,
    description: 'Documentos, carpetas de Drive, partituras, audios y enlaces de interés.',
  },
  {
    id: 'notes',
    label: 'Notas & Minutas Ministeriales',
    icon: FileText,
    description: 'Actas de reuniones, acuerdos pastorales y avisos internos del equipo.',
  },
];

export const MinistryManagerView: React.FC<MinistryManagerViewProps> = ({
  config,
  onUpdateConfig,
  onSendToTrash,
  onShowToast,
  autoOpenCreateTrigger,
}) => {
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  const currentMinistries: MinistryItem[] = useMemo(() => {
    if (Array.isArray(config.ministries)) {
      return [...config.ministries].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return DEFAULT_MINISTRIES;
  }, [config.ministries]);

  const navDisplayMode = config.ministryNavDisplayMode || 'tabs';

  // Screen View Mode: 'list' (all ministries) or 'editor' (full screen creation/edit studio)
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [editingMinistry, setEditingMinistry] = useState<MinistryItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Confirmation Modals for list mode
  const [deleteConfirmMinistry, setDeleteConfirmMinistry] = useState<MinistryItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Form state for full screen editor
  const [formData, setFormData] = useState<Partial<MinistryItem>>({
    id: '',
    name: '',
    shortName: '',
    description: '',
    leaderName: '',
    leaderPhone: '',
    leaderEmail: '',
    meetingSchedule: '',
    iconName: 'Flame',
    color: '#7c3aed',
    enabled: true,
    badge: 'Ministerio Eclesial',
    type: 'custom',
    bannerTitle: '',
    bannerSubtitle: '',
    bannerGradient: 'glow',
    bannerLogoPosition: 'side',
    bannerLogoOpacity: 0.25,
    logoUrl: '',
    coverImageUrl: '',
    enabledTabs: ['plans', 'members', 'castings'],
    customTabs: [],
  });

  const [iconCategoryFilter, setIconCategoryFilter] = useState<string>('Todos');
  const [iconSearchQuery, setIconSearchQuery] = useState<string>('');

  // Custom Tab Creation Modal in Editor
  const [isCustomTabModalOpen, setIsCustomTabModalOpen] = useState(false);
  const [customTabForm, setCustomTabForm] = useState<Partial<MinistryCustomTab>>({
    id: '',
    name: '',
    iconName: 'FileText',
    type: 'resources',
    description: '',
  });

  // Filtered ministries for list view
  const filteredMinistries = useMemo(() => {
    return currentMinistries.filter((m) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (m.name || '').toLowerCase().includes(q) ||
        (m.shortName ? m.shortName.toLowerCase().includes(q) : false) ||
        (m.leaderName ? m.leaderName.toLowerCase().includes(q) : false) ||
        (m.description ? m.description.toLowerCase().includes(q) : false);
      
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.enabled) ||
        (statusFilter === 'inactive' && !m.enabled);

      return matchesSearch && matchesStatus;
    });
  }, [currentMinistries, searchQuery, statusFilter]);

  const activeCount = currentMinistries.filter((m) => m.enabled).length;
  const inactiveCount = currentMinistries.length - activeCount;

  // Change display mode
  const handleSetDisplayMode = (mode: 'grouped' | 'tabs') => {
    if (!onUpdateConfig) return;
    onUpdateConfig((prev) => ({
      ...prev,
      ministryNavDisplayMode: mode,
    }));
    onShowToast(
      mode === 'grouped'
        ? 'Modo cambiado: Ministerios agrupados en la sección "Ministerios"'
        : 'Modo cambiado: Ministerios mostrados como pestañas individuales',
      'success'
    );
  };

  // Open Full-Screen Creator
  const handleOpenCreate = () => {
    setEditingMinistry(null);
    setFormData({
      id: `min_${Date.now()}`,
      name: '',
      shortName: '',
      description: '',
      leaderName: '',
      leaderPhone: '',
      leaderEmail: '',
      meetingSchedule: '',
      iconName: 'Flame',
      color: '#7c3aed',
      enabled: true,
      badge: 'Ministerio Eclesial',
      type: 'custom',
      order: currentMinistries.length + 1,
      bannerTitle: '',
      bannerSubtitle: '',
      bannerGradient: 'glow',
      bannerLogoPosition: 'side',
      bannerLogoOpacity: 0.25,
      logoUrl: '',
      coverImageUrl: '',
      enabledTabs: ['plans', 'members', 'castings', 'resources'],
      customTabs: [],
    });
    setIconCategoryFilter('Todos');
    setIconSearchQuery('');
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Automatically open creation studio if triggered from parent / external button
  React.useEffect(() => {
    if (autoOpenCreateTrigger && autoOpenCreateTrigger > 0) {
      handleOpenCreate();
    }
  }, [autoOpenCreateTrigger]);

  // Open Full-Screen Editor
  const handleOpenEdit = (ministry: MinistryItem) => {
    setEditingMinistry(ministry);
    // Check if banner info is already stored in config.customBanners
    const existingCustomBanner = config.customBanners?.[ministry.id];
    const existingLogo = config.ministryLogos?.[ministry.id] || ministry.logoUrl || '';

    setFormData({
      ...ministry,
      bannerTitle: ministry.bannerTitle || existingCustomBanner?.title || ministry.name,
      bannerSubtitle: ministry.bannerSubtitle || existingCustomBanner?.subtitle || ministry.description,
      bannerGradient: ministry.bannerGradient || existingCustomBanner?.gradientStyle || 'glow',
      bannerLogoPosition: ministry.bannerLogoPosition || existingCustomBanner?.logoPosition || (existingLogo ? 'side' : 'side'),
      bannerLogoOpacity: ministry.bannerLogoOpacity ?? existingCustomBanner?.logoOpacity ?? 0.25,
      logoUrl: existingLogo,
      enabledTabs: ministry.enabledTabs && ministry.enabledTabs.length > 0 ? ministry.enabledTabs : ['plans', 'members', 'castings'],
      customTabs: ministry.customTabs || [],
    });
    setIconCategoryFilter('Todos');
    setIconSearchQuery('');
    setViewMode('editor');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel Full-Screen Editor
  const handleCancelEditor = () => {
    setViewMode('list');
    setEditingMinistry(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Logo Upload from device
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('El tamaño de la imagen no debe superar los 5MB', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const logoData = event.target.result as string;
          setFormData((prev) => ({
            ...prev,
            logoUrl: logoData,
            bannerLogoPosition: prev.bannerLogoPosition === 'none' ? 'side' : prev.bannerLogoPosition,
          }));
          onShowToast('Logo cargado con éxito para este ministerio', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove Logo
  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logoUrl: '',
    }));
    if (logoFileInputRef.current) {
      logoFileInputRef.current.value = '';
    }
    onShowToast('Logo eliminado del ministerio', 'info');
  };

  // Toggle Standard Sub-tab
  const handleToggleStandardTab = (tabId: string) => {
    const currentTabs = formData.enabledTabs || ['plans', 'members', 'castings'];
    let updatedTabs: string[];
    if (currentTabs.includes(tabId)) {
      if (currentTabs.length === 1 && (!formData.customTabs || formData.customTabs.length === 0)) {
        onShowToast('Debes mantener al menos una pestaña activa en el ministerio', 'danger');
        return;
      }
      updatedTabs = currentTabs.filter((t) => t !== tabId);
    } else {
      updatedTabs = [...currentTabs, tabId];
    }
    setFormData((prev) => ({ ...prev, enabledTabs: updatedTabs }));
  };

  // Add / Save Custom Tab
  const handleSaveCustomTab = () => {
    if (!customTabForm.name || !customTabForm.name.trim()) {
      onShowToast('El nombre de la pestaña es obligatorio', 'danger');
      return;
    }

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

    const currentCustomTabs = formData.customTabs || [];
    const isEdit = currentCustomTabs.some((t) => t.id === newTabId);

    const updatedCustomTabs = isEdit
      ? currentCustomTabs.map((t) => (t.id === newTabId ? newTab : t))
      : [...currentCustomTabs, newTab];

    setFormData((prev) => ({
      ...prev,
      customTabs: updatedCustomTabs,
    }));

    setIsCustomTabModalOpen(false);
    setCustomTabForm({ id: '', name: '', iconName: 'FileText', type: 'resources', description: '' });
    onShowToast(isEdit ? 'Pestaña personalizada actualizada' : 'Nueva pestaña agregada al ministerio', 'success');
  };

  // Remove Custom Tab
  const handleRemoveCustomTab = (tabId: string) => {
    const updated = (formData.customTabs || []).filter((t) => t.id !== tabId);
    setFormData((prev) => ({ ...prev, customTabs: updated }));
    onShowToast('Pestaña personalizada eliminada', 'info');
  };

  // Save create/edit in full screen
  const handleSaveMinistry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.name.trim()) {
      onShowToast('El nombre del ministerio es obligatorio', 'danger');
      return;
    }

    const short = formData.shortName?.trim() || formData.name.trim().split(' ')[0];
    const generatedId =
      editingMinistry?.id ||
      formData.id ||
      `min_${Date.now()}`;

    const updatedItem: MinistryItem = {
      id: generatedId,
      name: formData.name.trim(),
      shortName: short,
      description: formData.description?.trim() || 'Ministerio de servicio, adoración y edificación congregacional.',
      leaderName: formData.leaderName?.trim() || '',
      leaderPhone: formData.leaderPhone?.trim() || '',
      leaderEmail: formData.leaderEmail?.trim() || '',
      meetingSchedule: formData.meetingSchedule?.trim() || '',
      iconName: formData.iconName || 'Sparkles',
      color: formData.color || '#7c3aed',
      enabled: formData.enabled !== undefined ? formData.enabled : true,
      badge: formData.badge?.trim() || 'Ministerio Eclesial',
      type: editingMinistry ? editingMinistry.type || 'custom' : 'custom',
      order: editingMinistry ? editingMinistry.order : currentMinistries.length + 1,
      bannerTitle: formData.bannerTitle?.trim() || formData.name.trim(),
      bannerSubtitle: formData.bannerSubtitle?.trim() || formData.description?.trim() || '',
      bannerGradient: formData.bannerGradient || 'glow',
      bannerLogoPosition: formData.bannerLogoPosition || 'side',
      bannerLogoOpacity: formData.bannerLogoOpacity !== undefined ? formData.bannerLogoOpacity : 0.25,
      logoUrl: formData.logoUrl || '',
      coverImageUrl: formData.coverImageUrl || '',
      enabledTabs: formData.enabledTabs || ['plans', 'members', 'castings'],
      customTabs: formData.customTabs || [],
      updatedAt: new Date().toISOString(),
    };

    let updatedList: MinistryItem[];
    if (editingMinistry) {
      updatedList = currentMinistries.map((m) => (m.id === editingMinistry.id ? updatedItem : m));
      onShowToast(`Ministerio "${updatedItem.name}" actualizado con éxito`, 'success');
    } else {
      updatedItem.createdAt = new Date().toISOString();
      updatedList = [...currentMinistries, updatedItem];
      onShowToast(`Nuevo ministerio "${updatedItem.name}" creado con éxito`, 'success');
    }

    // Update config tab colors, banners and logos
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({
        ...prev,
        ministries: updatedList,
        customTabColors: {
          ...prev.customTabColors,
          [updatedItem.id]: updatedItem.color,
        },
        customBanners: {
          ...prev.customBanners,
          [updatedItem.id]: {
            title: updatedItem.bannerTitle,
            subtitle: updatedItem.bannerSubtitle,
            badge: updatedItem.badge,
            gradientStyle: updatedItem.bannerGradient,
            logoUrl: updatedItem.logoUrl,
            logoPosition: updatedItem.bannerLogoPosition,
            logoOpacity: updatedItem.bannerLogoOpacity,
          },
        },
        ministryLogos: {
          ...prev.ministryLogos,
          [updatedItem.id]: updatedItem.logoUrl || '',
        },
      }));
    }

    setViewMode('list');
    setEditingMinistry(null);
  };

  // Quick toggle status in list
  const handleToggleEnabled = (ministry: MinistryItem) => {
    if (!onUpdateConfig) return;
    const updatedList = currentMinistries.map((m) =>
      m.id === ministry.id ? { ...m, enabled: !m.enabled } : m
    );
    onUpdateConfig((prev) => ({
      ...prev,
      ministries: updatedList,
    }));
    onShowToast(
      `Ministerio "${ministry.name}" ${!ministry.enabled ? 'activado' : 'desactivado'}`,
      'info'
    );
  };

  // Move order in list
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (!onUpdateConfig) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentMinistries.length) return;

    const reordered = [...currentMinistries];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    // Update order numbers
    const finalized = reordered.map((m, idx) => ({ ...m, order: idx + 1 }));
    onUpdateConfig((prev) => ({
      ...prev,
      ministries: finalized,
    }));
    onShowToast('Orden de ministerios actualizado', 'info');
  };

  // Delete to Trash
  const handleConfirmDelete = () => {
    if (!deleteConfirmMinistry) return;

    if (onSendToTrash) {
      const deletedItem: DeletedItem = {
        id: `del_min_${Date.now()}`,
        originalId: deleteConfirmMinistry.id,
        itemType: 'ministry',
        title: deleteConfirmMinistry.name,
        subtitle: `Líder: ${deleteConfirmMinistry.leaderName || 'Sin asignar'} · Icono: ${deleteConfirmMinistry.iconName}`,
        deletedAt: new Date().toISOString(),
        payload: deleteConfirmMinistry,
      };
      onSendToTrash(deletedItem);
    }

    if (onUpdateConfig) {
      const updatedList = currentMinistries.filter((m) => m.id !== deleteConfirmMinistry.id);
      onUpdateConfig((prev) => ({
        ...prev,
        ministries: updatedList,
      }));
    }

    onShowToast(`Ministerio "${deleteConfirmMinistry.name}" enviado a la papelera`, 'danger');
    setDeleteConfirmMinistry(null);
  };

  // Reset to default ministries
  const handleResetDefaults = () => {
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({
        ...prev,
        ministries: DEFAULT_MINISTRIES,
      }));
    }
    setIsResetConfirmOpen(false);
    onShowToast('Ministerios restablecidos a los 5 predeterminados de la congregación', 'info');
  };

  // Filtered icons for selector
  const iconCategories = [
    'Todos',
    'Artes & Música',
    'Grupos & Familias',
    'Servicio & Protocolo',
    'Espiritual & Misiones',
    'Media & Creatividad',
  ];

  const filteredIcons = useMemo(() => {
    return MINISTRY_ICON_OPTIONS.filter((opt) => {
      const matchCat = iconCategoryFilter === 'Todos' || opt.category === iconCategoryFilter;
      const matchSearch =
        !iconSearchQuery ||
        opt.label.toLowerCase().includes(iconSearchQuery.toLowerCase()) ||
        opt.key.toLowerCase().includes(iconSearchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [iconCategoryFilter, iconSearchQuery]);

  // Selected icon component
  const CurrentSelectedIcon = getMinistryIconComponent(formData.iconName);

  // Gradient styles mapping
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

  // =========================================================================
  // VIEW MODE: FULL-SCREEN CREATION / EDITING STUDIO
  // =========================================================================
  if (viewMode === 'editor') {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* TOP BAR / BACK NAVIGATION */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              type="button"
              onClick={handleCancelEditor}
              className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center shrink-0 group"
              title="Volver a la lista de ministerios"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{editingMinistry ? 'Modo de Edición Integral' : 'Estudio de Creación de Ministerio'}</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {editingMinistry ? `Editar: ${editingMinistry.name}` : 'Crear Nuevo Ministerio & Personalizar Pestañas'}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleCancelEditor}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMinistry}
              className="px-6 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-lg flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${formData.color || '#7c3aed'} 0%, #4338ca 100%)`,
                boxShadow: `0 10px 25px -5px ${formData.color || '#7c3aed'}55`,
              }}
            >
              <Save className="w-4 h-4" />
              <span>{editingMinistry ? 'Guardar Cambios' : 'Crear & Publicar Ministerio'}</span>
            </button>
          </div>
        </div>

        {/* MAIN FORM & REAL-TIME PREVIEW GRID */}
        <form onSubmit={handleSaveMinistry} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT / CENTER: FORM SECTIONS (7-8 COLUMNS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            
            {/* SECCIÓN 1: DATOS PRINCIPALES & IDENTIDAD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    1. Identidad y Datos Principales
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Define los títulos oficiales y la descripción con la que se identificará este ministerio.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Nombre Completo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Nombre Oficial del Ministerio *</span>
                    <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">Obligatorio</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Ministerio de Jóvenes «Generación de Fuego»"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nombre Corto */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Nombre Corto (para Pestañas y Menús)
                    </label>
                    <input
                      type="text"
                      value={formData.shortName || ''}
                      onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                      placeholder="Ej. Jóvenes"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <span className="text-[10px] text-slate-400">
                      Se utilizará en los botones de navegación superior.
                    </span>
                  </div>

                  {/* Insignia / Badge */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      Insignia / Etiqueta Descriptiva
                    </label>
                    <input
                      type="text"
                      value={formData.badge || ''}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      placeholder="Ej. Liderazgo Juvenil / Vida Congregacional"
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Descripción / Propósito */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Propósito y Visión Ministerial
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe el propósito espiritual, objetivos y funciones de este grupo de servicio dentro de la congregación..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: PERSONALIZACIÓN DEL BANNER & SUBIDA DE LOGO */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    2. Banner de Cabecera & Subida de Logo Oficial
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Personaliza el banner de este ministerio y sube su logo o emblema distintivo.
                  </p>
                </div>
              </div>

              {/* LOGO UPLOAD COMPONENT */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Logo thumbnail or preview */}
                    <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-purple-300 dark:border-purple-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                      {formData.logoUrl ? (
                        <img
                          src={formData.logoUrl}
                          alt="Logo del ministerio"
                          className="w-full h-full object-contain p-1"
                        />
                      ) : (
                        <CurrentSelectedIcon className="w-8 h-8 text-purple-500" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Emblema / Logo del Ministerio
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sube una imagen PNG con transparencia, JPG o SVG (máx. 5MB).
                      </p>
                    </div>
                  </div>

                  {/* Upload & Delete Actions */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      ref={logoFileInputRef}
                      onChange={handleLogoFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.logoUrl ? 'Cambiar Logo' : 'Subir Logo'}</span>
                    </button>

                    {formData.logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                        title="Quitar logo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Direct URL Input */}
                <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    O ingresa la URL directa de la imagen del logo:
                  </label>
                  <input
                    type="url"
                    value={formData.logoUrl || ''}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://ejemplo.com/logo-ministerio.png"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Logo Display Position & Opacity (If logo exists) */}
                {formData.logoUrl && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        Posición del Logo en el Banner
                      </label>
                      <select
                        value={formData.bannerLogoPosition || 'side'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bannerLogoPosition: e.target.value as 'side' | 'background' | 'both' | 'none',
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="side">Icono Lateral Principal (Reemplaza ícono)</option>
                        <option value="background">Marca de Agua de Fondo (Gigante)</option>
                        <option value="both">Ambos (Lateral y Marca de Agua de Fondo)</option>
                        <option value="none">No mostrar en el banner</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-extrabold text-slate-800 dark:text-slate-200">
                        <span>Opacidad del Logo de Fondo</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">
                          {Math.round((formData.bannerLogoOpacity || 0.25) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={formData.bannerLogoOpacity !== undefined ? formData.bannerLogoOpacity : 0.25}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bannerLogoOpacity: parseFloat(e.target.value),
                          })
                        }
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* BANNER STYLING & GRADIENT */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Estilo de Degradado del Banner
                  </label>
                  <select
                    value={formData.bannerGradient || 'glow'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bannerGradient: e.target.value as 'glow' | 'deep' | 'vibrant' | 'minimal',
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="glow">✨ Resplandor Eclesial (Glow Suave)</option>
                    <option value="deep">🌌 Noche Profunda (Deep Contrast)</option>
                    <option value="vibrant">🔥 Vibrante & Enérgico (Gradiente Vivo)</option>
                    <option value="minimal">🍃 Minimalista & Limpio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Subtítulo / Lema en el Banner
                  </label>
                  <input
                    type="text"
                    value={formData.bannerSubtitle || ''}
                    onChange={(e) => setFormData({ ...formData, bannerSubtitle: e.target.value })}
                    placeholder="Ej. «Lámpara es a mis pies tu palabra»"
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: CONFIGURACIÓN DE PESTAÑAS & CREACIÓN DE NUEVAS PESTAÑAS */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      3. Pestañas y Submódulos del Ministerio
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Activa las pestañas estándar que necesites o crea nuevas pestañas personalizadas.
                    </p>
                  </div>
                </div>

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
                  className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Nueva Pestaña</span>
                </button>
              </div>

              {/* PESTAÑAS ESTÁNDAR DISPONIBLES */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Pestañas Estándar del Sistema:
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DEFAULT_STANDARD_TABS.map((tab) => {
                    const TabIcon = tab.icon;
                    const isEnabled = (formData.enabledTabs || []).includes(tab.id);
                    return (
                      <div
                        key={tab.id}
                        onClick={() => handleToggleStandardTab(tab.id)}
                        className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start justify-between ${
                          isEnabled
                            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isEnabled
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <TabIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {tab.label}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                              {tab.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 ml-2">
                          <div
                            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                              isEnabled
                                ? 'bg-indigo-600 text-white'
                                : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PESTAÑAS PERSONALIZADAS CREADAS */}
              {formData.customTabs && formData.customTabs.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-700 dark:text-purple-300 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Pestañas Personalizadas Creadas ({formData.customTabs.length}):</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {formData.customTabs.map((ct) => {
                      const CtIcon = getMinistryIconComponent(ct.iconName || 'FileText');
                      return (
                        <div
                          key={ct.id}
                          className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between shadow-2xs"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                              <CtIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {ct.name}
                              </h4>
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                                Tipo:{' '}
                                {ct.type === 'notes'
                                  ? 'Notas & Minutas'
                                  : ct.type === 'checklist'
                                  ? 'Checklist / Verificación'
                                  : ct.type === 'custom_list'
                                  ? 'Inventario / Ítems'
                                  : 'Recursos & Enlaces'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setCustomTabForm(ct);
                                setIsCustomTabModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-all cursor-pointer"
                              title="Editar pestaña"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTab(ct.id)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-all cursor-pointer"
                              title="Eliminar pestaña"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 4: LIDERAZGO, CONTACTO Y REUNIONES */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    4. Liderazgo, Contacto y Horarios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Datos del encargado(a), canales de comunicación y horario de reuniones.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Director / Líder */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-purple-500" />
                    <span>Líder o Director(a) Responsable</span>
                  </label>
                  <input
                    type="text"
                    value={formData.leaderName || ''}
                    onChange={(e) => setFormData({ ...formData, leaderName: e.target.value })}
                    placeholder="Ej. Hno. Roberto Gómez"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Días y Horarios de Reunión */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Día y Horario de Reunión / Ensayos</span>
                  </label>
                  <input
                    type="text"
                    value={formData.meetingSchedule || ''}
                    onChange={(e) => setFormData({ ...formData, meetingSchedule: e.target.value })}
                    placeholder="Ej. Sábados 6:00 PM / Miércoles 7:00 PM"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Teléfono / WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Teléfono / WhatsApp de Contacto</span>
                  </label>
                  <input
                    type="text"
                    value={formData.leaderPhone || ''}
                    onChange={(e) => setFormData({ ...formData, leaderPhone: e.target.value })}
                    placeholder="Ej. +502 5555-1234"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-sky-500" />
                    <span>Correo Electrónico Oficial</span>
                  </label>
                  <input
                    type="email"
                    value={formData.leaderEmail || ''}
                    onChange={(e) => setFormData({ ...formData, leaderEmail: e.target.value })}
                    placeholder="Ej. jovenes@montesinai.org"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: COLOR TEMÁTICO E ÍCONO PRINCIPAL */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    5. Paleta Cromática & Ícono Representativo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elige el color característico y el ícono gráfico que simbolizará a este ministerio.
                  </p>
                </div>
              </div>

              {/* PALETA DE COLOR */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Color Temático</span>
                  <span className="font-mono text-[11px] text-slate-500">{formData.color}</span>
                </label>

                <div className="flex flex-wrap items-center gap-2.5">
                  {MINISTRY_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: preset.hex })}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                        formData.color === preset.hex
                          ? 'ring-4 ring-offset-2 ring-purple-600 scale-110 shadow-lg'
                          : 'hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {formData.color === preset.hex && <Check className="w-5 h-5 text-white" />}
                    </button>
                  ))}

                  <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                    <input
                      type="color"
                      value={formData.color || '#7c3aed'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-10 h-10 rounded-2xl cursor-pointer border-0 bg-transparent p-0"
                      title="Elegir color personalizado"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Personalizado
                    </span>
                  </div>
                </div>
              </div>

              {/* SELECTOR DE ÍCONOS POR CATEGORÍAS */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Ícono Representativo</span>
                  </label>

                  {/* Icon Search */}
                  <div className="relative w-full sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={iconSearchQuery}
                      onChange={(e) => setIconSearchQuery(e.target.value)}
                      placeholder="Buscar ícono..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {/* Categorías de íconos */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {iconCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setIconCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        iconCategoryFilter === cat
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grilla de Íconos */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-h-60 overflow-y-auto p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  {filteredIcons.map((opt) => {
                    const OptIcon = opt.icon;
                    const isSelected = formData.iconName === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFormData({ ...formData, iconName: opt.key })}
                        className={`p-3 rounded-2xl flex flex-col items-center justify-center space-y-1.5 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-105'
                            : 'bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700'
                        }`}
                        title={opt.label}
                      >
                        <OptIcon className="w-6 h-6" />
                        <span className="text-[10px] font-bold truncate w-full text-center">
                          {opt.label.split('/')[0].trim()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECCIÓN 6: ESTADO Y VISIBILIDAD */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Visibilidad en la Navegación y Congregación
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg">
                  {formData.enabled
                    ? 'El ministerio está ACTIVO: aparecerá en el Centro de Ministerios y en las barras de menú correspondientes.'
                    : 'El ministerio está OCULTO: solo los administradores podrán verlo en la consola de gestión.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shrink-0 ${
                  formData.enabled
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {formData.enabled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{formData.enabled ? 'Ministerio Activo' : 'Ministerio Oculto'}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: STICKY REAL-TIME PREVIEW (4-5 COLUMNS) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <div className="sticky top-6 space-y-6">
              {/* CARD DE VISTA PREVIA EN VIVO */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Vista Previa del Banner & Pestañas</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                    En Vivo ⚡
                  </span>
                </div>

                {/* SIMULACIÓN DEL HERO BANNER COMPLETO CON LOGO */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Banner Principal del Ministerio:
                  </span>

                  <div
                    className="rounded-3xl p-5 text-white shadow-lg relative overflow-hidden transition-all border border-white/10"
                    style={{
                      background: getBannerGradientBackground(formData.color || '#7c3aed', formData.bannerGradient),
                    }}
                  >
                    {/* Background Logo Watermark */}
                    {formData.logoUrl &&
                      (formData.bannerLogoPosition === 'background' ||
                        formData.bannerLogoPosition === 'both') && (
                        <div
                          className="absolute right-0 bottom-0 pointer-events-none transform translate-x-4 translate-y-4"
                          style={{ opacity: formData.bannerLogoOpacity || 0.25 }}
                        >
                          <img
                            src={formData.logoUrl}
                            alt="Logo de fondo"
                            className="w-36 h-36 object-contain"
                          />
                        </div>
                      )}

                    {/* Dynamic Ambient Glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-3">
                      <div className="flex items-start space-x-3.5">
                        {/* Side Logo or Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-md border border-white/30 overflow-hidden">
                          {formData.logoUrl &&
                          (formData.bannerLogoPosition === 'side' ||
                            formData.bannerLogoPosition === 'both') ? (
                            <img
                              src={formData.logoUrl}
                              alt="Logo"
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <CurrentSelectedIcon className="w-7 h-7" />
                          )}
                        </div>

                        <div className="space-y-1 overflow-hidden">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 border border-white/30 text-white text-[10px] font-extrabold uppercase truncate">
                              {formData.badge || 'Ministerio Eclesial'}
                            </span>
                          </div>

                          <h4 className="text-base sm:text-lg font-black text-white leading-tight truncate">
                            {formData.bannerTitle || formData.name || 'Nombre del Ministerio'}
                          </h4>

                          <p className="text-[11px] text-white/80 line-clamp-2 leading-tight">
                            {formData.bannerSubtitle ||
                              formData.description ||
                              'Lema y propósito de este ministerio...'}
                          </p>
                        </div>
                      </div>

                      {/* Details row preview */}
                      <div className="pt-2 border-t border-white/15 flex flex-wrap gap-2 text-[10px] text-white/90">
                        {formData.leaderName && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-amber-300" />
                            <span>{formData.leaderName}</span>
                          </span>
                        )}
                        {formData.meetingSchedule && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-emerald-300" />
                            <span>{formData.meetingSchedule}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SIMULACIÓN DE SUB-PESTAÑAS ACTIVAS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Pestañas Activas en este Ministerio:
                  </span>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                    {(formData.enabledTabs || []).map((tId) => {
                      const st = DEFAULT_STANDARD_TABS.find((x) => x.id === tId);
                      return (
                        <span
                          key={tId}
                          className="px-2.5 py-1 rounded-xl text-white text-[10px] font-extrabold flex items-center space-x-1 shadow-2xs"
                          style={{ backgroundColor: formData.color || '#7c3aed' }}
                        >
                          <Check className="w-2.5 h-2.5" />
                          <span>{st?.label.split(' ')[0] || tId}</span>
                        </span>
                      );
                    })}

                    {(formData.customTabs || []).map((ct) => (
                      <span
                        key={ct.id}
                        className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-extrabold flex items-center space-x-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                        <span>{ct.name}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* SIMULACIÓN DE PESTAÑA EN BARRA DE NAVEGACIÓN */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Pestaña en Menú Superior:
                  </span>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center space-x-2">
                    <div
                      className="px-3 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center space-x-1.5"
                      style={{ backgroundColor: formData.color || '#7c3aed' }}
                    >
                      <CurrentSelectedIcon className="w-3.5 h-3.5" />
                      <span>{formData.shortName || formData.name || 'Ministerio'}</span>
                    </div>
                  </div>
                </div>

                {/* BOTONES DE GUARDAR / CANCELAR INFERIORES */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-2xl text-white font-extrabold text-xs shadow-lg flex items-center justify-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${formData.color || '#7c3aed'} 0%, #4338ca 100%)`,
                    }}
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingMinistry ? 'Guardar Cambios' : 'Crear Ministerio'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancelEditor}
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Cancelar y Volver
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* MODAL PARA CREAR / EDITAR PESTAÑA PERSONALIZADA */}
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
                      {customTabForm.id ? 'Editar Pestaña Personalizada' : 'Nueva Pestaña para el Ministerio'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Crea un espacio específico para tu equipo de trabajo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomTabModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nombre de la Pestaña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Nombre de la Pestaña *
                  </label>
                  <input
                    type="text"
                    value={customTabForm.name || ''}
                    onChange={(e) => setCustomTabForm({ ...customTabForm, name: e.target.value })}
                    placeholder="Ej. Inventario de Vestuarios / Devocionales / Enlaces"
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Tipo de Pestaña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Tipo de Contenido & Funcionalidad
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        type: 'resources',
                        label: 'Recursos & Enlaces',
                        desc: 'Carpetas de Drive, archivos y enlaces',
                        icon: Link,
                      },
                      {
                        type: 'notes',
                        label: 'Notas & Minutas',
                        desc: 'Actas, devocionales y anuncios',
                        icon: FileText,
                      },
                      {
                        type: 'checklist',
                        label: 'Lista de Tareas (Checklist)',
                        desc: 'Casillas de verificación de tareas',
                        icon: CheckSquare,
                      },
                      {
                        type: 'custom_list',
                        label: 'Inventario / Elementos',
                        desc: 'Registro de materiales y equipos',
                        icon: Package,
                      },
                    ].map((item) => {
                      const TypeIcon = item.icon;
                      const isSelected = customTabForm.type === item.type;
                      return (
                        <div
                          key={item.type}
                          onClick={() =>
                            setCustomTabForm({
                              ...customTabForm,
                              type: item.type as any,
                            })
                          }
                          className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col space-y-1 ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <TypeIcon
                              className={`w-4 h-4 ${
                                isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-500'
                              }`}
                            />
                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {item.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ícono de la pestaña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Ícono de la Pestaña
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'FileText', label: 'Notas', icon: FileText },
                      { key: 'Link', label: 'Enlaces', icon: Link },
                      { key: 'CheckSquare', label: 'Checklist', icon: CheckSquare },
                      { key: 'Package', label: 'Inventario', icon: Package },
                      { key: 'BookOpen', label: 'Biblia', icon: BookOpen },
                      { key: 'Music', label: 'Música', icon: Music },
                      { key: 'Sparkles', label: 'Destacado', icon: Sparkles },
                      { key: 'Calendar', label: 'Agenda', icon: Calendar },
                    ].map((ic) => {
                      const IcComp = ic.icon;
                      const isSel = (customTabForm.iconName || 'FileText') === ic.key;
                      return (
                        <button
                          key={ic.key}
                          type="button"
                          onClick={() => setCustomTabForm({ ...customTabForm, iconName: ic.key })}
                          className={`p-2.5 rounded-xl border flex items-center space-x-1.5 text-xs font-bold cursor-pointer transition-all ${
                            isSel
                              ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <IcComp className="w-4 h-4" />
                          <span>{ic.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Descripción / Propósito (Opcional)
                  </label>
                  <input
                    type="text"
                    value={customTabForm.description || ''}
                    onChange={(e) =>
                      setCustomTabForm({ ...customTabForm, description: e.target.value })
                    }
                    placeholder="Ej. Espacio para subir y consultar los enlaces a canciones y audios de ensayo."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomTabModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomTab}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  {customTabForm.id ? 'Guardar Pestaña' : 'Agregar Pestaña'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW MODE: LIST OF MINISTRIES
  // =========================================================================
  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Gestión Dinámica de Ministerios & Grupos</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Crear, Editar & Organizar Ministerios
            </h2>
            <p className="text-purple-200 text-sm max-w-2xl leading-relaxed">
              Administra todos los ministerios de la iglesia. Crea nuevos ministerios en pantalla completa, sube su logo oficial, personaliza sus banners, configura qué pestañas tendrán activas (o crea pestañas a medida) y elige el modo de visualización en la navegación.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 flex items-center space-x-2 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Ministerio</span>
            </button>

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-purple-100 font-semibold text-xs border border-white/20 flex items-center space-x-1.5 transition-all cursor-pointer"
              title="Restablecer ministerios base"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
              <span>Restaurar Base</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: SELECTOR DE MODO DE VISUALIZACIÓN EN BARRA DE NAVEGACIÓN */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Modo de Visualización en la Barra Superior
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Selecciona la forma en que los usuarios y líderes verán los ministerios en el menú de navegación.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold self-start sm:self-auto">
            Sincronizado en Firebase ⚡
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Opción A: Pestañas Individuales */}
          <div
            onClick={() => handleSetDisplayMode('tabs')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              navDisplayMode === 'tabs'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    navDisplayMode === 'tabs'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                    Pestañas Individuales (Desplegadas)
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Como pestañas independientes
                  </span>
                </div>
              </div>
              {navDisplayMode === 'tabs' && (
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Cada ministerio activo (Alabanza, Danza, Damas, etc.) aparece directamente como una pestaña en la barra de navegación superior según los permisos del rol.
            </p>
          </div>

          {/* Opción B: Agrupados en sección "Ministerios" */}
          <div
            onClick={() => handleSetDisplayMode('grouped')}
            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              navDisplayMode === 'grouped'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 shadow-md ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    navDisplayMode === 'grouped'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                    Agrupados en Sección «Ministerios» (Centro Ministerial)
                  </h4>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Menú unificado y limpio
                  </span>
                </div>
              </div>
              {navDisplayMode === 'grouped' && (
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5" />
                </span>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Todos los ministerios se unifican bajo una sola pestaña principal llamada <strong>«Ministerios»</strong>, la cual abre el centro con tarjetas de acceso rápido.
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: LISTADO DE MINISTERIOS REGISTRADOS */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Ministerios Registrados ({currentMinistries.length})
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Reordena con las flechas, activa o desactiva su visibilidad, o edita sus datos en pantalla completa.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
              {activeCount} Activos
            </span>
            {inactiveCount > 0 && (
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-extrabold">
                {inactiveCount} Ocultos
              </span>
            )}
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, líder o propósito..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Solo Activos
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'inactive'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Solo Ocultos
            </button>
          </div>
        </div>

        {/* MINISTRIES LIST TABLE / CARDS */}
        <div className="space-y-3">
          {filteredMinistries.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No se encontraron ministerios con los filtros actuales.
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold shadow-sm"
              >
                Crear Nuevo Ministerio
              </button>
            </div>
          ) : (
            filteredMinistries.map((ministry, index) => {
              const MinistryIcon = getMinistryIconComponent(ministry.iconName);
              const logo = config.ministryLogos?.[ministry.id] || ministry.logoUrl;
              const hasCustomTabs = ministry.customTabs && ministry.customTabs.length > 0;

              return (
                <div
                  key={ministry.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    ministry.enabled
                      ? 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/80 shadow-2xs hover:shadow-md'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Left: Icon, Name & Details */}
                  <div className="flex items-start space-x-4">
                    {/* Reorder Arrows */}
                    <div className="flex flex-col space-y-1 self-center pr-1 border-r border-slate-200 dark:border-slate-700">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, 'up')}
                        className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${
                          index === 0
                            ? 'opacity-30 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 cursor-pointer'
                        }`}
                        title="Subir orden"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === currentMinistries.length - 1}
                        onClick={() => handleMoveOrder(index, 'down')}
                        className={`p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all ${
                          index === currentMinistries.length - 1
                            ? 'opacity-30 cursor-not-allowed'
                            : 'text-slate-600 dark:text-slate-300 cursor-pointer'
                        }`}
                        title="Bajar orden"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Ministry Icon or Logo */}
                    <div
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm relative overflow-hidden"
                      style={{ backgroundColor: ministry.color || '#7c3aed' }}
                    >
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-contain p-1" />
                      ) : (
                        <MinistryIcon className="w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {ministry.name}
                        </h4>
                        {ministry.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                            {ministry.badge}
                          </span>
                        )}
                        {logo && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold flex items-center space-x-1">
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Con Logo</span>
                          </span>
                        )}
                        {hasCustomTabs && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>{ministry.customTabs?.length} Pestañas Extra</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-xl">
                        {ministry.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                        {ministry.leaderName && (
                          <span className="flex items-center space-x-1">
                            <User className="w-3 h-3 text-purple-500" />
                            <span>Líder: <strong>{ministry.leaderName}</strong></span>
                          </span>
                        )}
                        {ministry.meetingSchedule && (
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-amber-500" />
                            <span>{ministry.meetingSchedule}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(ministry)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                        ministry.enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                      title={ministry.enabled ? 'Ocultar ministerio' : 'Activar ministerio'}
                    >
                      {ministry.enabled ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Activo</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Oculto</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(ministry)}
                      className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 transition-all cursor-pointer"
                      title="Editar en pantalla completa (Banner, logo y pestañas)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmMinistry(ministry)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 transition-all cursor-pointer"
                      title="Enviar ministerio a la papelera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL: DELETE TO TRASH */}
      {deleteConfirmMinistry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Enviar ministerio a la papelera?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                El ministerio <strong>«{deleteConfirmMinistry.name}»</strong> será removido de la navegación y guardado en la Papelera de Reciclaje, donde podrás restaurarlo si lo deseas.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmMinistry(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
              >
                Enviar a Papelera
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET DEFAULTS */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                ¿Restablecer ministerios base?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Esto restaurará la lista de los 5 ministerios iniciales (Alabanza, Danza, Damas, Servidores y Teatro).
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/30 cursor-pointer"
              >
                Sí, Restablecer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
