import React, { useState, useRef } from 'react';
import {
  HeartHandshake,
  DollarSign,
  Copy,
  Check,
  QrCode,
  Target,
  FileCheck,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
  CreditCard,
  Landmark,
  Tv,
  FileText,
  Download,
  Calendar,
  Send,
  Upload,
  User,
  MessageSquare,
  ShieldCheck,
  X,
  Radio,
  BookOpen,
  Edit3,
  Trash2,
  Settings,
  Plus,
  Camera,
  Image as ImageIcon,
  Sliders,
  Play,
  Heart,
  Megaphone,
  MapPin,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  Video,
  Link2,
  ListTodo,
  CheckSquare,
  Vote,
} from 'lucide-react';
import {
  CustomSectionItem,
  CustomSectionSubTab,
  DonationPaymentMethod,
  DonationCampaign,
  DonationRecord,
  ChurchConfig,
  DeletedItem,
  UserProfile,
} from '../../types';
import { getMinistryIconComponent, MINISTRY_COLOR_PRESETS } from '../../utils/ministryIcons';
import { PhotoCaptureModal } from '../PhotoCaptureModal';
import { SubTabCalendarView } from './subtabs/SubTabCalendarView';
import { SubTabVideosView } from './subtabs/SubTabVideosView';
import { SubTabLinksView } from './subtabs/SubTabLinksView';
import { SubTabWorkPlansView } from './subtabs/SubTabWorkPlansView';
import { SubTabLibraryView } from './subtabs/SubTabLibraryView';
import { SubTabMusicView } from './subtabs/SubTabMusicView';
import { SubTabMembersView } from './subtabs/SubTabMembersView';
import { SubTabCastingView } from './subtabs/SubTabCastingView';
import { SubTabRehearsalsView } from './subtabs/SubTabRehearsalsView';
import { SubTabChecklistView } from './subtabs/SubTabChecklistView';
import { SubTabPollsView } from './subtabs/SubTabPollsView';
import { SubTabRafflesView } from './subtabs/SubTabRafflesView';
import { PollsModuleView } from './polls/PollsModuleView';
import { RafflesModuleView } from './raffles/RafflesModuleView';
import { CustomSubTabsManager, SUBTAB_PRESET_TYPES } from './subtabs/CustomSubTabsManager';
import { PageElementsRenderer } from '../builder/PageElementsRenderer';
import { SectionExpirationBanner } from './SectionExpirationBanner';
import {
  getSectionExpirationInfo,
  formatExpirationDate,
  generatePresetDate,
} from '../../utils/sectionExpiration';

interface CustomSectionRendererProps {
  section: CustomSectionItem;
  config: ChurchConfig;
  currentUser?: UserProfile | null;
  onUpdateSectionData?: (updatedSection: CustomSectionItem) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onDeleteSection?: (sectionId: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export const CustomSectionRenderer: React.FC<CustomSectionRendererProps> = ({
  section,
  config,
  currentUser,
  onUpdateSectionData,
  onUpdateConfig,
  onSendToTrash,
  onDeleteSection,
  onNavigateToTab,
  onShowToast,
}) => {
  const currencySymbol = config.currencySymbol || '$';
  const IconComp = getMinistryIconComponent(section.iconName);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Modal states for Section & Banner editing
  const [isBannerEditorOpen, setIsBannerEditorOpen] = useState<boolean>(false);
  const [isSectionEditorOpen, setIsSectionEditorOpen] = useState<boolean>(false);
  const [isSubTabsModalOpen, setIsSubTabsModalOpen] = useState<boolean>(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);

  const subTabs = section.subTabs || [];

  // Active Sub-tab for modular pages or sections (default to first subTab if available and not donations)
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (section.sectionType === 'custom_page' && subTabs.length > 0) {
      return subTabs[0].id;
    }
    return 'overview';
  });

  const handleUpdateSubTab = (updatedSubTab: CustomSectionSubTab) => {
    const currentSubTabs = section.subTabs || [];
    const updatedSubTabs = currentSubTabs.map((st) => (st.id === updatedSubTab.id ? updatedSubTab : st));
    const updatedSection: CustomSectionItem = {
      ...section,
      subTabs: updatedSubTabs,
      updatedAt: new Date().toISOString(),
    };
    saveSectionChanges(updatedSection);
  };

  const handleSaveSubTabsList = (newSubTabs: CustomSectionSubTab[]) => {
    const updatedSection: CustomSectionItem = {
      ...section,
      subTabs: newSubTabs,
      updatedAt: new Date().toISOString(),
    };
    saveSectionChanges(updatedSection, 'Pestañas de la sección actualizadas con éxito');
    if (newSubTabs.length > 0 && !newSubTabs.some((t) => t.id === activeSubTab)) {
      setActiveSubTab(newSubTabs[0].id);
    }
  };

  // Copied state tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // QR Modal State
  const [selectedQRMethod, setSelectedQRMethod] = useState<DonationPaymentMethod | null>(null);

  // Register Donation Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [donationForm, setDonationForm] = useState<{
    donorName: string;
    amount: string;
    method: string;
    campaignTitle: string;
    referenceNumber: string;
    notes: string;
    isAnonymous: boolean;
    receiptPhotoUrl?: string;
  }>({
    donorName: '',
    amount: '',
    method: section.donationsData?.methods?.[0]?.title || 'Zelle Oficial',
    campaignTitle: 'Ofrenda General',
    referenceNumber: '',
    notes: '',
    isAnonymous: false,
  });

  // Banner Editor Form State
  const [bannerForm, setBannerForm] = useState({
    title: section.banner?.title || section.name,
    subtitle: section.banner?.subtitle || section.description,
    badge: section.banner?.badge || section.badge || 'Sección Oficial',
    gradientStyle: section.banner?.gradientStyle || 'emerald',
    primaryColor: section.banner?.primaryColor || section.color || '#059669',
    secondaryColor: section.banner?.secondaryColor || '#047857',
    logoUrl: section.banner?.logoUrl || '',
    logoPosition: section.banner?.logoPosition || (section.banner?.logoUrl ? 'side' : 'none'),
    logoOpacity: section.banner?.logoOpacity ?? 0.25,
  });

  // Section General Editor Form State
  const [sectionForm, setSectionForm] = useState<CustomSectionItem>({ ...section });

  // Quick Inline Item Modals (For adding methods, campaigns, files, videos, announcements)
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState<boolean>(false);
  const [editingItemType, setEditingItemType] = useState<'method' | 'campaign' | 'video' | 'file' | 'announcement' | 'prayer' | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [methodFormData, setMethodFormData] = useState<Partial<DonationPaymentMethod>>({
    title: '',
    type: 'zelle',
    accountName: config.churchName || 'Iglesia Central',
    accountNumberOrEmail: '',
    bankName: '',
    routingOrSwift: '',
    instructions: '',
    colorTheme: section.color || '#059669',
    active: true,
  });

  const [campaignFormData, setCampaignFormData] = useState<Partial<DonationCampaign>>({
    title: '',
    description: '',
    targetGoal: 10000,
    currentAmount: 0,
    deadline: '',
    active: true,
  });

  const [videoFormData, setVideoFormData] = useState({
    title: '',
    youtubeUrl: '',
    date: new Date().toISOString().split('T')[0],
    speaker: '',
  });

  const [fileFormData, setFileFormData] = useState({
    title: '',
    category: 'General',
    url: '',
    size: '1.5 MB',
    format: 'PDF',
    description: '',
  });

  const [announcementFormData, setAnnouncementFormData] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    badge: 'Aviso',
    author: 'Pastorado',
  });

  const [prayerFormData, setPrayerFormData] = useState({
    name: '',
    request: '',
  });

  const handleCopy = (text: string, key: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast(`¡${label} copiado al portapapeles!`, 'success');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Helper to commit section changes
  const saveSectionChanges = (updated: CustomSectionItem, toastMsg?: string) => {
    if (onUpdateSectionData) {
      onUpdateSectionData(updated);
    }
    if (onUpdateConfig) {
      onUpdateConfig((prev) => {
        const list = prev.customSections && prev.customSections.length > 0 ? prev.customSections : [updated];
        const idx = list.findIndex((s) => s.id === updated.id);
        const newList = idx >= 0 ? list.map((s, i) => (i === idx ? updated : s)) : [...list, updated];
        return { ...prev, customSections: newList };
      });
    }
    if (toastMsg) {
      onShowToast(toastMsg, 'success');
    }
  };

  // Save Banner Changes
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSection: CustomSectionItem = {
      ...section,
      color: bannerForm.primaryColor,
      badge: bannerForm.badge,
      banner: {
        ...section.banner,
        title: bannerForm.title,
        subtitle: bannerForm.subtitle,
        badge: bannerForm.badge,
        gradientStyle: bannerForm.gradientStyle as any,
        primaryColor: bannerForm.primaryColor,
        secondaryColor: bannerForm.secondaryColor,
        logoUrl: bannerForm.logoUrl,
        logoPosition: bannerForm.logoPosition as any,
        logoOpacity: bannerForm.logoOpacity,
      },
      updatedAt: new Date().toISOString(),
    };

    saveSectionChanges(updatedSection, '¡Banner y diseño visual actualizados con éxito!');
    setIsBannerEditorOpen(false);
  };

  // Save Section Settings Changes
  const handleSaveSectionSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSection: CustomSectionItem = {
      ...sectionForm,
      updatedAt: new Date().toISOString(),
    };

    saveSectionChanges(updatedSection, '¡Configuración de la sección guardada con éxito!');
    setIsSectionEditorOpen(false);
  };

  // Delete / Trash Section
  const handleConfirmDeleteSection = () => {
    if (onSendToTrash) {
      onSendToTrash({
        id: `del_sec_${Date.now()}`,
        originalId: section.id,
        itemType: 'customSection',
        title: section.name,
        subtitle: section.description,
        deletedAt: new Date().toISOString(),
        payload: section,
      });
    }

    if (onDeleteSection) {
      onDeleteSection(section.id);
    } else if (onUpdateConfig) {
      onUpdateConfig((prev) => ({
        ...prev,
        customSections: (prev.customSections || []).filter((s) => s.id !== section.id),
      }));
    }

    onShowToast(`Sección "${section.name}" eliminada y enviada a la papelera.`, 'info');
    setIsDeleteConfirmOpen(false);

    if (onNavigateToTab) {
      onNavigateToTab('dashboard');
    }
  };

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        onShowToast('La imagen no debe superar los 5MB', 'danger');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const imgUrl = event.target.result as string;
          setBannerForm((prev) => ({
            ...prev,
            logoUrl: imgUrl,
            logoPosition: prev.logoPosition === 'none' ? 'side' : prev.logoPosition,
          }));
          onShowToast('Logo cargado correctamente', 'success');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Donation Record
  const handleSubmitDonationRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(donationForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      onShowToast('Por favor ingrese un monto válido de donación.', 'danger');
      return;
    }

    const newRecord: DonationRecord = {
      id: `don_${Date.now()}`,
      donorName: donationForm.isAnonymous ? 'Ofrendante Anónimo' : donationForm.donorName.trim() || 'Miembro Eclesial',
      amount: numAmount,
      method: donationForm.method,
      campaignTitle: donationForm.campaignTitle,
      date: new Date().toISOString().split('T')[0],
      referenceNumber: donationForm.referenceNumber,
      receiptPhotoUrl: donationForm.receiptPhotoUrl,
      status: 'Confirmado',
      notes: donationForm.notes,
      isAnonymous: donationForm.isAnonymous,
    };

    let updatedCampaigns = [...(section.donationsData?.campaigns || [])];
    if (donationForm.campaignTitle && donationForm.campaignTitle !== 'Ofrenda General' && donationForm.campaignTitle !== 'Diezmo Eclesial') {
      updatedCampaigns = updatedCampaigns.map((camp) => {
        if (camp.title === donationForm.campaignTitle) {
          return { ...camp, currentAmount: (camp.currentAmount || 0) + numAmount };
        }
        return camp;
      });
    }

    const updatedSection: CustomSectionItem = {
      ...section,
      donationsData: {
        ...section.donationsData!,
        campaigns: updatedCampaigns,
        records: [newRecord, ...(section.donationsData?.records || [])],
      },
    };

    saveSectionChanges(updatedSection, '¡Aporte registrado y notificado con éxito! Que Dios bendiga su ofrenda.');
    setIsRegisterModalOpen(false);
    setDonationForm({
      donorName: '',
      amount: '',
      method: section.donationsData?.methods?.[0]?.title || 'Zelle Oficial',
      campaignTitle: 'Ofrenda General',
      referenceNumber: '',
      notes: '',
      isAnonymous: false,
    });
  };

  // Item deletion helper
  const handleDeletePaymentMethod = (methodId: string) => {
    if (!section.donationsData) return;
    const updatedMethods = section.donationsData.methods.filter((m) => m.id !== methodId);
    const updatedSection: CustomSectionItem = {
      ...section,
      donationsData: {
        ...section.donationsData,
        methods: updatedMethods,
      },
    };
    saveSectionChanges(updatedSection, 'Canal de pago eliminado');
  };

  const handleDeleteCampaign = (campaignId: string) => {
    if (!section.donationsData) return;
    const updatedCampaigns = section.donationsData.campaigns.filter((c) => c.id !== campaignId);
    const updatedSection: CustomSectionItem = {
      ...section,
      donationsData: {
        ...section.donationsData,
        campaigns: updatedCampaigns,
      },
    };
    saveSectionChanges(updatedSection, 'Campaña eliminada');
  };

  // Gradient calculator
  const getBannerGradientBackground = (primary: string, secondary: string, style?: string) => {
    switch (style) {
      case 'deep':
        return `linear-gradient(145deg, #090d16 0%, ${primary}bb 50%, #030712 100%)`;
      case 'vibrant':
        return `linear-gradient(135deg, ${primary} 0%, ${secondary} 50%, #1e1b4b 100%)`;
      case 'minimal':
        return `linear-gradient(180deg, ${primary}44 0%, #0f172a 100%)`;
      case 'gold':
        return `linear-gradient(135deg, #b45309 0%, #d97706 50%, #78350f 100%)`;
      case 'emerald':
      case 'glow':
      default:
        return `linear-gradient(135deg, ${primary} 0%, ${secondary || '#047857'} 100%)`;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. TOP ACTION BAR WITH EDIT & DELETE BUTTONS 100% ACTIVE */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
            style={{ backgroundColor: section.color || '#059669' }}
          >
            <IconComp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {section.name}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-slate-600 dark:text-slate-300 uppercase">
                {section.sectionType}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Pestaña activa • /{section.slug}
            </span>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Banner Button */}
          <button
            type="button"
            onClick={() => {
              setBannerForm({
                title: section.banner?.title || section.name,
                subtitle: section.banner?.subtitle || section.description,
                badge: section.banner?.badge || section.badge || 'Sección Oficial',
                gradientStyle: section.banner?.gradientStyle || 'emerald',
                primaryColor: section.banner?.primaryColor || section.color || '#059669',
                secondaryColor: section.banner?.secondaryColor || '#047857',
                logoUrl: section.banner?.logoUrl || '',
                logoPosition: section.banner?.logoPosition || (section.banner?.logoUrl ? 'side' : 'none'),
                logoOpacity: section.banner?.logoOpacity ?? 0.25,
              });
              setIsBannerEditorOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Editar Banner & Logo</span>
          </button>

          {/* Edit Section Settings */}
          <button
            type="button"
            onClick={() => {
              setSectionForm({ ...section });
              setIsSectionEditorOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-200 hover:text-teal-600 dark:hover:text-teal-300 font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border border-slate-200 dark:border-slate-700"
          >
            <Settings className="w-3.5 h-3.5 text-teal-500" />
            <span>Editar Sección</span>
          </button>

          {/* Manage Sub-Tabs Button */}
          <button
            type="button"
            onClick={() => setIsSubTabsModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border border-purple-200 dark:border-purple-800"
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Pestañas ({subTabs.length})</span>
          </button>

          {/* Delete Section Button */}
          <button
            type="button"
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-extrabold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm border border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar Sección</span>
          </button>
        </div>
      </div>

      {/* EXPIRATION BANNER / LIVE COUNTDOWN / ADMIN EXTEND CONTROLS */}
      <SectionExpirationBanner
        section={section}
        currentUser={currentUser}
        onUpdateSection={saveSectionChanges}
        onShowToast={onShowToast}
      />

      {/* 2. CUSTOM HERO BANNER */}
      <div
        className="relative p-6 sm:p-10 rounded-3xl overflow-hidden shadow-xl text-white transition-all border border-white/10"
        style={{
          background: getBannerGradientBackground(
            section.banner?.primaryColor || section.color || '#059669',
            section.banner?.secondaryColor || '#047857',
            section.banner?.gradientStyle
          ),
        }}
      >
        {/* Background Watermark Logo */}
        {section.banner?.logoUrl &&
          (section.banner.logoPosition === 'background' || section.banner.logoPosition === 'both') && (
            <img
              src={section.banner.logoUrl}
              alt="Watermark"
              className="absolute right-4 -bottom-6 w-52 h-52 sm:w-80 sm:h-80 object-contain pointer-events-none select-none"
              style={{ opacity: section.banner.logoOpacity ?? 0.25 }}
            />
          )}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 sm:space-x-5">
            {/* Side Logo if uploaded */}
            {section.banner?.logoUrl &&
              (section.banner.logoPosition === 'side' || section.banner.logoPosition === 'both') && (
                <div className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl bg-white/20 backdrop-blur-md p-2.5 border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                  <img
                    src={section.banner.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

            {(!section.banner?.logoUrl || section.banner.logoPosition === 'background' || section.banner.logoPosition === 'none') && (
              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-white/20 backdrop-blur-md p-3 border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                <IconComp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
            )}

            <div>
              {section.banner?.badge && (
                <span className="inline-block px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-xs mb-1.5 shadow-sm">
                  {section.banner.badge}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-sm">
                {section.banner?.title || section.name}
              </h1>
              <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-2xl leading-relaxed">
                {section.banner?.subtitle || section.description}
              </p>
            </div>
          </div>

          {/* Quick Action Button for Donations */}
          {section.sectionType === 'donations' && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-white text-slate-900 font-extrabold text-xs sm:text-sm shadow-xl hover:bg-slate-50 transition-all flex items-center space-x-2 cursor-pointer scale-100 hover:scale-105"
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>Notificar Mi Ofrenda / Diezmo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. SUB-TABS NAVIGATION BAR (IF SUB-TABS ARE CONFIGURED OR MODULAR PAGE) */}
      {subTabs.length > 0 && (
        <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
          <div className="flex items-center space-x-1.5 min-w-max">
            {/* Overview Tab for sections that have other default modules */}
            {section.sectionType !== 'custom_page' && (
              <button
                type="button"
                onClick={() => setActiveSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSubTab === 'overview'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                <span>Vista Principal</span>
              </button>
            )}

            {/* Dynamic Sub-Tabs */}
            {subTabs.map((tab) => {
              const preset = SUBTAB_PRESET_TYPES.find((p) => p.type === tab.type) || SUBTAB_PRESET_TYPES[0];
              const Icon = preset.icon;
              const isActive = activeSubTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.name}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                        isActive
                          ? 'bg-white/25 text-white'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsSubTabsModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-extrabold text-xs flex items-center space-x-1 shrink-0 border border-purple-200 dark:border-purple-800 cursor-pointer"
            title="Administrar Pestañas"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Gestionar Pestañas</span>
          </button>
        </div>
      )}

      {/* 4. ACTIVE SUB-TAB RENDERER (WHEN A SUB-TAB IS ACTIVE) */}
      {(() => {
        const currentSelectedSubTab = subTabs.find((t) => t.id === activeSubTab);
        if (!currentSelectedSubTab || activeSubTab === 'overview') return null;

        return (
          <div className="space-y-4 animate-fadeIn">
            {currentSelectedSubTab.type === 'calendar' && (
              <SubTabCalendarView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'videos' && (
              <SubTabVideosView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'links' && (
              <SubTabLinksView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'work_plans' && (
              <SubTabWorkPlansView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'library' && (
              <SubTabLibraryView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'music' && (
              <SubTabMusicView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'members' && (
              <SubTabMembersView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'casting' && (
              <SubTabCastingView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'rehearsals' && (
              <SubTabRehearsalsView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'checklist' && (
              <SubTabChecklistView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
              />
            )}

            {currentSelectedSubTab.type === 'polls' && (
              <SubTabPollsView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
                currentUser={currentUser}
              />
            )}

            {currentSelectedSubTab.type === 'raffles' && (
              <SubTabRafflesView
                subTab={currentSelectedSubTab}
                onUpdateSubTab={handleUpdateSubTab}
                onShowToast={onShowToast}
                currentUser={currentUser}
                config={config}
              />
            )}

            {currentSelectedSubTab.type === 'notes' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <FileText className="w-5 h-5" />
                  </span>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {currentSelectedSubTab.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500">
                  {currentSelectedSubTab.description || 'Contenido editorial y notas de la sección.'}
                </p>
              </div>
            )}
          </div>
        );
      })()}
      
      {/* 4.8 CUSTOM PAGE BUILDER ELEMENTS (RENDERED FOR PAGE_BUILDER OR SECTIONS WITH VISUAL ELEMENTS) */}
      {(section.sectionType === 'page_builder' || (Array.isArray(section.pageElements) && section.pageElements.length > 0)) && (activeSubTab === 'overview' || subTabs.length === 0) && (
        <div className="space-y-6">
          <PageElementsRenderer
            elements={section.pageElements || []}
            onNavigateToTab={onNavigateToTab}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* 5. BIBLICAL PROMPT / CALLOUT FOR DONATIONS (ONLY WHEN OVERVIEW ACTIVE) */}
      {section.sectionType === 'donations' && (activeSubTab === 'overview' || subTabs.length === 0) && section.donationsData?.versePrompt && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-sm">
          <Sparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="italic">{section.donationsData.versePrompt}</p>
        </div>
      )}

      {/* 6. DONATIONS MAIN VIEW (ONLY WHEN OVERVIEW ACTIVE) */}
      {section.sectionType === 'donations' && (activeSubTab === 'overview' || subTabs.length === 0) && (
        <div className="space-y-8">
          {/* SECTION A: PAYMENT METHODS (ZELLE, BANK, PAYPAL) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <Landmark className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Canales de Donación & Cuentas Oficiales</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Realiza tus aportes de manera segura a través de los siguientes métodos oficiales:
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMethodFormData({
                    id: `meth_${Date.now()}`,
                    title: 'Nuevo Canal de Pago',
                    type: 'zelle',
                    accountName: config.churchName || 'Iglesia Central',
                    accountNumberOrEmail: '',
                    instructions: '',
                    colorTheme: section.color || '#059669',
                    active: true,
                  });
                  setEditingItemType('method');
                  setEditingItemId(null);
                  setIsAddItemModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Canal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.donationsData?.methods?.map((method) => {
                const isZelle = method.type === 'zelle';
                const isBank = method.type === 'bank';
                const isPayPal = method.type === 'paypal';

                return (
                  <div
                    key={method.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group relative"
                  >
                    {/* Top: Icon, Title & In-Card Edit/Delete Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div
                          className="px-3 py-1.5 rounded-xl text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5"
                          style={{ backgroundColor: method.colorTheme || section.color || '#059669' }}
                        >
                          {isZelle && <span className="font-mono">Zelle</span>}
                          {isBank && <Landmark className="w-3.5 h-3.5" />}
                          {isPayPal && <CreditCard className="w-3.5 h-3.5" />}
                          {!isZelle && !isBank && !isPayPal && <DollarSign className="w-3.5 h-3.5" />}
                          <span>{method.type.toUpperCase()}</span>
                        </div>

                        {/* Actions for this method */}
                        <div className="flex items-center space-x-1">
                          {method.qrCodeUrl && (
                            <button
                              type="button"
                              onClick={() => setSelectedQRMethod(method)}
                              className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-all flex items-center space-x-1 text-xs font-bold"
                              title="Ver código QR para escanear"
                            >
                              <QrCode className="w-4 h-4" />
                              <span className="hidden sm:inline">QR</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setMethodFormData({ ...method });
                              setEditingItemType('method');
                              setEditingItemId(method.id);
                              setIsAddItemModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-400 hover:text-teal-600 transition-all"
                            title="Editar este canal de donación"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-slate-600 dark:text-slate-400 hover:text-red-600 transition-all"
                            title="Eliminar este canal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-black text-base text-slate-900 dark:text-white">
                        {method.title}
                      </h3>

                      {method.bankName && (
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {method.bankName}
                        </p>
                      )}
                    </div>

                    {/* Middle: Details & Copyable Blocks */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Titular de la Cuenta:
                        </span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          {method.accountName}
                        </span>
                      </div>

                      {/* Number or Email */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                        <div className="overflow-hidden">
                          <span className="text-[10px] font-bold text-slate-400 block">
                            {isZelle ? 'Email / Teléfono Zelle:' : isPayPal ? 'Enlace PayPal:' : 'Número de Cuenta:'}
                          </span>
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate block">
                            {method.accountNumberOrEmail}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopy(method.accountNumberOrEmail, method.id, 'Dato de cuenta')}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-1 shrink-0"
                          title="Copiar dato"
                        >
                          {copiedKey === method.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === method.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                      </div>

                      {/* Routing or SWIFT if bank */}
                      {method.routingOrSwift && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Routing / SWIFT:</span>
                            <span className="font-mono font-bold text-xs text-slate-800 dark:text-slate-200">
                              {method.routingOrSwift}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(method.routingOrSwift!, `${method.id}_rout`, 'Routing')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            title="Copiar Routing"
                          >
                            {copiedKey === `${method.id}_rout` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {method.instructions && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          ℹ️ {method.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: FUNDRAISING CAMPAIGNS & METAS PRO-TEMPLO */}
          {section.donationsData?.campaigns && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    <span>Campañas Pro-Fondos & Metas Eclesiales</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proyectos activos de construcción, misiones y acción comunitaria con metas financieras.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCampaignFormData({
                      id: `camp_${Date.now()}`,
                      title: 'Nueva Campaña Pro-Fondos',
                      description: 'Descripción del proyecto de edificación...',
                      targetGoal: 20000,
                      currentAmount: 0,
                      deadline: '2026-12-31',
                      active: true,
                    });
                    setEditingItemType('campaign');
                    setEditingItemId(null);
                    setIsAddItemModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva Campaña</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.donationsData.campaigns.map((camp) => {
                  const percentage = Math.min(
                    100,
                    Math.round(((camp.currentAmount || 0) / (camp.targetGoal || 1)) * 100)
                  );
                  const remaining = Math.max(0, (camp.targetGoal || 0) - (camp.currentAmount || 0));

                  return (
                    <div
                      key={camp.id}
                      className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-teal-500/30 shadow-md space-y-4 relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold text-[10px]">
                            {camp.active ? 'Campaña Activa' : 'Finalizada'}
                          </span>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white mt-1">
                            {camp.title}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {camp.description}
                          </p>
                        </div>

                        {/* In-Card Edit / Delete */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCampaignFormData({ ...camp });
                              setEditingItemType('campaign');
                              setEditingItemId(camp.id);
                              setIsAddItemModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950 text-slate-600 dark:text-slate-400 hover:text-teal-600"
                            title="Editar campaña"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCampaign(camp.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950 text-slate-600 dark:text-slate-400 hover:text-red-600"
                            title="Eliminar campaña"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Meter */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black">
                          <span className="text-slate-700 dark:text-slate-300">
                            Recaudado: <strong className="text-emerald-600 dark:text-emerald-400">{currencySymbol}{(camp.currentAmount || 0).toLocaleString()}</strong>
                          </span>
                          <span className="text-slate-500">
                            Meta: {currencySymbol}{(camp.targetGoal || 0).toLocaleString()} ({percentage}%)
                          </span>
                        </div>

                        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Faltante: {currencySymbol}{remaining.toLocaleString()}</span>
                          {camp.deadline && <span>Fecha límite: {camp.deadline}</span>}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDonationForm((prev) => ({ ...prev, campaignTitle: camp.title }));
                            setIsRegisterModalOpen(true);
                          }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          <span>Ofrendar a esta Campaña</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION C: RECENT DONATION RECORDS / WALL */}
          {section.donationsData?.records && section.donationsData.records.length > 0 && (
            <div className="space-y-4 pt-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                  <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Muro de Gratitud & Aportes Recientes</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Registro transparente de aportes para la edificación del ministerio.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.donationsData.records.slice(0, 6).map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center">
                        <HeartHandshake className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {rec.donorName}
                        </h4>
                        <span className="text-[10px] text-slate-500 block">
                          {rec.campaignTitle || rec.method} • {rec.date}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                        +{currencySymbol}{rec.amount.toLocaleString()}
                      </span>
                      <span className="block text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MEDIA & LIVE TRANSMISSIONS RENDERER */}
      {section.sectionType === 'media' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                <Tv className="w-5 h-5 text-red-600" />
                <span>Transmisión en Directo & Cultos en Línea</span>
              </h3>
              <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-300 font-extrabold text-xs flex items-center space-x-1.5 animate-pulse">
                <Radio className="w-3.5 h-3.5" />
                <span>EN VIVO DOMINGOS</span>
              </span>
            </div>

            {section.mediaData?.liveStreamUrl ? (
              <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black">
                <iframe
                  src={section.mediaData.liveStreamUrl}
                  title="Live Stream"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800 text-center space-y-3">
                <Tv className="w-12 h-12 text-slate-400 mx-auto" />
                <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
                  Próxima Transmisión Programada
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {section.mediaData?.streamSchedule || 'Domingos 10:00 AM & Miércoles 7:30 PM'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. RESOURCES & DOCUMENTS RENDERER */}
      {section.sectionType === 'resources' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Biblioteca de Recursos & Descargas</span>
            </h3>
            <p className="text-xs text-slate-500">
              Guías de estudio bíblico, manuales ministeriales y formatos de membresía.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {section.resourcesData?.files && section.resourcesData.files.length > 0 ? (
                section.resourcesData.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[150px]">
                          {file.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {file.category} • {file.size || '1.2 MB'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-full p-8 text-center text-slate-400 text-xs">
                  No hay archivos cargados aún. Haz clic en "Editar Sección" para agregar documentos.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. MODULAR CUSTOM PAGE RENDERER */}
      {section.sectionType === 'custom_page' && (activeSubTab === 'overview' || subTabs.length === 0) && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-xl text-slate-900 dark:text-white">
                  {section.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                  {section.description || 'Página modular personalizada para tu iglesia.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSubTabsModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Pestaña a esta Sección</span>
              </button>
            </div>

            {/* Quick preset selector cards when subtabs are empty or to add more */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Módulos y Pestañas Disponibles para Activar</span>
                </h4>
                <span className="text-[11px] text-slate-400">
                  {subTabs.length} pestañas activas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SUBTAB_PRESET_TYPES.map((preset) => {
                  const Icon = preset.icon;
                  const isAlreadyAdded = subTabs.some((t) => t.type === preset.type);

                  return (
                    <div
                      key={preset.type}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                        isAlreadyAdded
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className="p-2.5 rounded-xl text-white shadow-sm shrink-0"
                          style={{ backgroundColor: preset.color }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                              {preset.defaultName}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {preset.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {preset.label}
                        </span>

                        {isAlreadyAdded ? (
                          <button
                            type="button"
                            onClick={() => {
                              const found = subTabs.find((t) => t.type === preset.type);
                              if (found) setActiveSubTab(found.id);
                            }}
                            className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          >
                            Ver Pestaña →
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newSubTab: CustomSectionSubTab = {
                                id: `subtab_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                                type: preset.type,
                                name: preset.defaultName,
                                badge: preset.label,
                                description: preset.description,
                                order: subTabs.length,
                                active: true,
                              };
                              handleSaveSubTabsList([...subTabs, newSubTab]);
                              setActiveSubTab(newSubTab.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-800 dark:text-slate-200 hover:text-emerald-600 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Crear Pestaña</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POLLS & VOTING MODULE VIEW (WHEN OVERVIEW ACTIVE OR NO SUBTABS) */}
      {section.sectionType === 'polls' && (activeSubTab === 'overview' || subTabs.length === 0) && (
        <PollsModuleView
          section={section}
          currentUser={currentUser}
          config={config}
          onUpdateSectionData={onUpdateSectionData}
          onShowToast={onShowToast}
          onOpenSectionEditor={() => setIsBannerEditorOpen(true)}
        />
      )}

      {/* RAFFLES & SORTEOS MODULE VIEW (WHEN OVERVIEW ACTIVE OR NO SUBTABS) */}
      {section.sectionType === 'raffles' && (activeSubTab === 'overview' || subTabs.length === 0) && (
        <RafflesModuleView
          section={section}
          currentUser={currentUser}
          config={config}
          onUpdateSectionData={onUpdateSectionData}
          onShowToast={onShowToast}
          onOpenSectionEditor={() => setIsBannerEditorOpen(true)}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT BANNER & LOGO WITH REAL-TIME PREVIEW & CAMERA UPLOAD */}
      {/* ========================================================================= */}
      {isBannerEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    Personalizar Banner & Logotipo de la Sección
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajusta los títulos, colores de degradado, logotipo oficial e imágenes de portada.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBannerEditorOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4">
              {/* LIVE PREVIEW CARD */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Vista Previa en Tiempo Real:
                </span>
                <div
                  className="p-5 rounded-2xl text-white relative overflow-hidden shadow-md transition-all"
                  style={{
                    background: getBannerGradientBackground(
                      bannerForm.primaryColor,
                      bannerForm.secondaryColor,
                      bannerForm.gradientStyle
                    ),
                  }}
                >
                  {bannerForm.logoUrl &&
                    (bannerForm.logoPosition === 'background' || bannerForm.logoPosition === 'both') && (
                      <img
                        src={bannerForm.logoUrl}
                        alt="Preview Watermark"
                        className="absolute right-2 -bottom-4 w-32 h-32 object-contain pointer-events-none"
                        style={{ opacity: bannerForm.logoOpacity }}
                      />
                    )}

                  <div className="relative z-10 flex items-center space-x-3">
                    {bannerForm.logoUrl &&
                      (bannerForm.logoPosition === 'side' || bannerForm.logoPosition === 'both') && (
                        <div className="w-12 h-12 rounded-xl bg-white/20 p-1.5 flex items-center justify-center shrink-0 border border-white/30">
                          <img
                            src={bannerForm.logoUrl}
                            alt="Preview Logo"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold mb-1">
                        {bannerForm.badge || 'Etiqueta'}
                      </span>
                      <h4 className="font-black text-lg">{bannerForm.title || section.name}</h4>
                      <p className="text-xs text-white/80">{bannerForm.subtitle || section.description}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Título Principal del Banner *
                  </label>
                  <input
                    type="text"
                    required
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Distintivo / Badge
                  </label>
                  <input
                    type="text"
                    value={bannerForm.badge}
                    onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                    placeholder="Ej: Canales Oficiales, En Vivo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Subtítulo / Mensaje de Bienvenida
                </label>
                <input
                  type="text"
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Colors & Gradient Styles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Color Primario
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={bannerForm.primaryColor}
                      onChange={(e) => setBannerForm({ ...bannerForm, primaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={bannerForm.primaryColor}
                      onChange={(e) => setBannerForm({ ...bannerForm, primaryColor: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Color Secundario (Degradado)
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={bannerForm.secondaryColor}
                      onChange={(e) => setBannerForm({ ...bannerForm, secondaryColor: e.target.value })}
                      className="w-9 h-9 rounded-xl border-0 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={bannerForm.secondaryColor}
                      onChange={(e) => setBannerForm({ ...bannerForm, secondaryColor: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* LOGO & IMAGE MANAGEMENT */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                    <span>Logotipo o Portada del Banner</span>
                  </span>

                  {bannerForm.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, logoUrl: '', logoPosition: 'none' })}
                      className="text-[11px] font-bold text-red-500 hover:text-red-700"
                    >
                      Eliminar logo
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Subir de Mi Dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCameraModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-500" />
                    <span>Tomar Foto con Cámara</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Posición del Logotipo
                    </label>
                    <select
                      value={bannerForm.logoPosition}
                      onChange={(e) => setBannerForm({ ...bannerForm, logoPosition: e.target.value as any })}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="side">Al lado del título (Side Box)</option>
                      <option value="background">Marca de agua de fondo (Background)</option>
                      <option value="both">Ambos (Side + Background)</option>
                      <option value="none">Ocultar logotipo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Opacidad de Fondo ({Math.round((bannerForm.logoOpacity || 0.25) * 100)}%)
                    </label>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={bannerForm.logoOpacity}
                      onChange={(e) => setBannerForm({ ...bannerForm, logoOpacity: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer accent-emerald-600"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBannerEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: SECTION SETTINGS (GENERAL, SLUG, ORDER, NAV TOGGLE) */}
      {/* ========================================================================= */}
      {isSectionEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-300">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    Configuración General de la Sección
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifica el nombre oficial, acceso en barra de navegación y visibilidad.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSectionEditorOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSectionSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Sección *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Corto (Para barra de navegación)
                  </label>
                  <input
                    type="text"
                    value={sectionForm.shortName || ''}
                    onChange={(e) => setSectionForm({ ...sectionForm, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="chk-nav"
                  checked={sectionForm.showInTopNav}
                  onChange={(e) => setSectionForm({ ...sectionForm, showInTopNav: e.target.checked })}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="chk-nav" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  Mostrar como pestaña en la barra de navegación superior
                </label>
              </div>

              {/* VIGENCIA Y TIEMPO DE VENCIMIENTO */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                        Vigencia & Tiempo de Vencimiento
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Configura un plazo límite de vigencia para esta sección.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSectionForm((prev) => ({
                        ...prev,
                        expiration: {
                          enabled: !prev.expiration?.enabled,
                          expiresAt: prev.expiration?.expiresAt || generatePresetDate('1week'),
                          startsAt: prev.expiration?.startsAt || '',
                          expirationAction: prev.expiration?.expirationAction || 'banner',
                          showCountdown: prev.expiration?.showCountdown ?? true,
                          expiredMessage: prev.expiration?.expiredMessage || '',
                        },
                      }))
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      sectionForm.expiration?.enabled ? 'bg-amber-600' : 'bg-slate-400'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        sectionForm.expiration?.enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {sectionForm.expiration?.enabled && (
                  <div className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha y Hora de Cierre / Vencimiento *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={sectionForm.expiration.expiresAt || ''}
                        onChange={(e) =>
                          setSectionForm((prev) => ({
                            ...prev,
                            expiration: {
                              ...prev.expiration!,
                              expiresAt: e.target.value,
                            },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: '+1 Día', preset: '1day' },
                        { label: '+3 Días', preset: '3days' },
                        { label: '+1 Semana', preset: '1week' },
                        { label: '+1 Mes', preset: '1month' },
                      ].map((p) => (
                        <button
                          key={p.preset}
                          type="button"
                          onClick={() => {
                            const newDate = generatePresetDate(p.preset as any);
                            setSectionForm((prev) => ({
                              ...prev,
                              expiration: {
                                ...prev.expiration!,
                                expiresAt: newDate,
                              },
                            }));
                          }}
                          className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-amber-500"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Acción al Vencer
                        </label>
                        <select
                          value={sectionForm.expiration.expirationAction || 'banner'}
                          onChange={(e) =>
                            setSectionForm((prev) => ({
                              ...prev,
                              expiration: {
                                ...prev.expiration!,
                                expirationAction: e.target.value as any,
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                        >
                          <option value="banner">📢 Mostrar Cinta de Finalizado</option>
                          <option value="lock">🔒 Bloquear Acceso con Aviso</option>
                          <option value="hide">🚫 Ocultar Sección Automáticamente</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-2 pt-4">
                        <input
                          type="checkbox"
                          id="chk-countdown"
                          checked={sectionForm.expiration.showCountdown !== false}
                          onChange={(e) =>
                            setSectionForm((prev) => ({
                              ...prev,
                              expiration: {
                                ...prev.expiration!,
                                showCountdown: e.target.checked,
                              },
                            }))
                          }
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="chk-countdown" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          Mostrar contador regresivo
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mensaje al Concluir Vigencia (Opcional)
                      </label>
                      <input
                        type="text"
                        value={sectionForm.expiration.expiredMessage || ''}
                        onChange={(e) =>
                          setSectionForm((prev) => ({
                            ...prev,
                            expiration: {
                              ...prev.expiration!,
                              expiredMessage: e.target.value,
                            },
                          }))
                        }
                        placeholder="Ej: El plazo para esta sección ha concluido. ¡Gracias!"
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSectionEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CONFIRM DELETE SECTION (100% WORKING + SENDS TO TRASH) */}
      {/* ========================================================================= */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-red-200 dark:border-red-900/50 shadow-2xl space-y-4 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                ¿Eliminar la sección "{section.name}"?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Esta sección será removida de la navegación y enviada a la <strong>Papelera de Reciclaje</strong>. Podrás restaurarla en cualquier momento desde la vista de Desarrollador.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSection}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar y Eliminar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: INLINE ADD / EDIT ITEM MODAL (METHODS, CAMPAIGNS) */}
      {/* ========================================================================= */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {editingItemType === 'method' && (editingItemId ? 'Editar Canal de Pago' : 'Nuevo Canal de Pago')}
                {editingItemType === 'campaign' && (editingItemId ? 'Editar Campaña' : 'Nueva Campaña Pro-Fondos')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddItemModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM FOR PAYMENT METHOD */}
            {editingItemType === 'method' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const currentMethods = section.donationsData?.methods || [];
                  const newMethod: DonationPaymentMethod = {
                    id: editingItemId || `meth_${Date.now()}`,
                    title: methodFormData.title || 'Canal de Pago',
                    type: methodFormData.type as any || 'zelle',
                    accountName: methodFormData.accountName || config.churchName || 'Iglesia Central',
                    accountNumberOrEmail: methodFormData.accountNumberOrEmail || '',
                    bankName: methodFormData.bankName,
                    routingOrSwift: methodFormData.routingOrSwift,
                    instructions: methodFormData.instructions,
                    colorTheme: methodFormData.colorTheme || section.color || '#059669',
                    active: true,
                  };

                  const updatedMethods = editingItemId
                    ? currentMethods.map((m) => (m.id === editingItemId ? newMethod : m))
                    : [...currentMethods, newMethod];

                  const updatedSection: CustomSectionItem = {
                    ...section,
                    donationsData: {
                      ...section.donationsData!,
                      methods: updatedMethods,
                    },
                  };

                  saveSectionChanges(updatedSection, 'Canal de pago guardado correctamente');
                  setIsAddItemModalOpen(false);
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre / Título *
                    </label>
                    <input
                      type="text"
                      required
                      value={methodFormData.title}
                      onChange={(e) => setMethodFormData({ ...methodFormData, title: e.target.value })}
                      placeholder="Ej: Zelle Oficial"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Método *
                    </label>
                    <select
                      value={methodFormData.type}
                      onChange={(e) => setMethodFormData({ ...methodFormData, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                    >
                      <option value="zelle">Zelle</option>
                      <option value="bank">Transferencia Bancaria (ACH/Wire)</option>
                      <option value="paypal">PayPal / Enlace Web</option>
                      <option value="cash">Efectivo / En Culto</option>
                      <option value="card">Tarjeta de Crédito / Débito</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Titular de la Cuenta *
                  </label>
                  <input
                    type="text"
                    required
                    value={methodFormData.accountName}
                    onChange={(e) => setMethodFormData({ ...methodFormData, accountName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email, Teléfono o Número de Cuenta *
                  </label>
                  <input
                    type="text"
                    required
                    value={methodFormData.accountNumberOrEmail}
                    onChange={(e) => setMethodFormData({ ...methodFormData, accountNumberOrEmail: e.target.value })}
                    placeholder="Ej: donaciones@iglesia.org o 987654321"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>

                {methodFormData.type === 'bank' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombre del Banco
                      </label>
                      <input
                        type="text"
                        value={methodFormData.bankName || ''}
                        onChange={(e) => setMethodFormData({ ...methodFormData, bankName: e.target.value })}
                        placeholder="Ej: Chase Bank"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Routing / SWIFT
                      </label>
                      <input
                        type="text"
                        value={methodFormData.routingOrSwift || ''}
                        onChange={(e) => setMethodFormData({ ...methodFormData, routingOrSwift: e.target.value })}
                        placeholder="Ej: 021000021"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Instrucciones Especiales
                  </label>
                  <input
                    type="text"
                    value={methodFormData.instructions || ''}
                    onChange={(e) => setMethodFormData({ ...methodFormData, instructions: e.target.value })}
                    placeholder="Ej: Indicar si es Diezmo u Ofrenda en la nota"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
                  >
                    Guardar Canal
                  </button>
                </div>
              </form>
            )}

            {/* FORM FOR CAMPAIGN */}
            {editingItemType === 'campaign' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const currentCampaigns = section.donationsData?.campaigns || [];
                  const newCampaign: DonationCampaign = {
                    id: editingItemId || `camp_${Date.now()}`,
                    title: campaignFormData.title || 'Campaña Pro-Fondos',
                    description: campaignFormData.description || '',
                    targetGoal: Number(campaignFormData.targetGoal) || 10000,
                    currentAmount: Number(campaignFormData.currentAmount) || 0,
                    deadline: campaignFormData.deadline,
                    active: campaignFormData.active !== false,
                  };

                  const updatedCampaigns = editingItemId
                    ? currentCampaigns.map((c) => (c.id === editingItemId ? newCampaign : c))
                    : [...currentCampaigns, newCampaign];

                  const updatedSection: CustomSectionItem = {
                    ...section,
                    donationsData: {
                      ...section.donationsData!,
                      campaigns: updatedCampaigns,
                    },
                  };

                  saveSectionChanges(updatedSection, 'Campaña guardada con éxito');
                  setIsAddItemModalOpen(false);
                }}
                className="space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignFormData.title}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, title: e.target.value })}
                    placeholder="Ej: Campaña Pro-Construcción del Templo"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción / Propósito
                  </label>
                  <textarea
                    rows={2}
                    value={campaignFormData.description}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Meta Financiera ({currencySymbol}) *
                    </label>
                    <input
                      type="number"
                      required
                      value={campaignFormData.targetGoal}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, targetGoal: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Monto Recaudado Actual ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      value={campaignFormData.currentAmount}
                      onChange={(e) => setCampaignFormData({ ...campaignFormData, currentAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha Límite (Opcional)
                  </label>
                  <input
                    type="date"
                    value={campaignFormData.deadline || ''}
                    onChange={(e) => setCampaignFormData({ ...campaignFormData, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md"
                  >
                    Guardar Campaña
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR CODE MODAL */}
      {selectedQRMethod && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center animate-scaleUp">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Código QR: {selectedQRMethod.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedQRMethod(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              {selectedQRMethod.qrCodeUrl ? (
                <img
                  src={selectedQRMethod.qrCodeUrl}
                  alt="QR Code"
                  className="w-56 h-56 object-contain rounded-xl shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 space-y-2">
                  <QrCode className="w-16 h-16" />
                  <span className="text-xs">No hay imagen QR cargada</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                {selectedQRMethod.accountName}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 block font-bold">
                {selectedQRMethod.accountNumberOrEmail}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedQRMethod(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* REGISTER / NOTIFY DONATION MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    Notificar / Registrar Mi Aporte
                  </h3>
                  <p className="text-xs text-slate-500">
                    Envía el registro de tu diezmo u ofrenda para confirmación eclesiástica.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDonationRecord} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Monto de la Ofrenda ({currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={donationForm.amount}
                    onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                    placeholder="Ej: 50.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Método Utilizado *
                  </label>
                  <select
                    value={donationForm.method}
                    onChange={(e) => setDonationForm({ ...donationForm, method: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    {section.donationsData?.methods.map((m) => (
                      <option key={m.id} value={m.title}>
                        {m.title}
                      </option>
                    ))}
                    <option value="Efectivo en Culto">Efectivo en Culto</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Destino / Campaña
                  </label>
                  <select
                    value={donationForm.campaignTitle}
                    onChange={(e) => setDonationForm({ ...donationForm, campaignTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  >
                    <option value="Ofrenda General">Ofrenda General</option>
                    <option value="Diezmo Eclesial">Diezmo Eclesial</option>
                    {section.donationsData?.campaigns.map((c) => (
                      <option key={c.id} value={c.title}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    No. de Confirmación / Referencia
                  </label>
                  <input
                    type="text"
                    value={donationForm.referenceNumber}
                    onChange={(e) => setDonationForm({ ...donationForm, referenceNumber: e.target.value })}
                    placeholder="Ej: #ZEL-98213"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Donante / Familia
                </label>
                <input
                  type="text"
                  disabled={donationForm.isAnonymous}
                  value={donationForm.donorName}
                  onChange={(e) => setDonationForm({ ...donationForm, donorName: e.target.value })}
                  placeholder="Ej: Hno. Carlos Rodríguez"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs disabled:opacity-40"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chk-anon"
                  checked={donationForm.isAnonymous}
                  onChange={(e) => setDonationForm({ ...donationForm, isAnonymous: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chk-anon" className="text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                  Ofrendar de forma anónima (no mostrar nombre en el registro)
                </label>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Nota o Petición Especial
                </label>
                <textarea
                  rows={2}
                  value={donationForm.notes}
                  onChange={(e) => setDonationForm({ ...donationForm, notes: e.target.value })}
                  placeholder="Ej: Petición por sanidad de la familia..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Notificación de Ofrenda</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: MANAGE SUB-TABS (CALENDARS, VIDEOS, LINKS, WORK PLANS, LIBRARY, MUSIC, MEMBERS, CASTING, REHEARSALS) */}
      {/* ========================================================================= */}
      {isSubTabsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-3xl w-full border border-purple-200 dark:border-purple-900/50 shadow-2xl space-y-5 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white">
                    Pestañas y Módulos de "{section.name}"
                  </h3>
                  <p className="text-xs text-slate-500">
                    Agrega, reordena y personaliza pestañas internas: Calendarios, Videos, Enlaces, Planificaciones, Bibliotecas, Libros, Música, Integrantes, Casting y Ensayos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSubTabsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <CustomSubTabsManager
              subTabs={subTabs}
              onChangeSubTabs={handleSaveSubTabsList}
              onShowToast={onShowToast}
            />

            <div className="flex items-center justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSubTabsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Listo y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO CAPTURE CAMERA MODAL */}
      <PhotoCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoSelected={(photoUrl) => {
          setBannerForm((prev) => ({
            ...prev,
            logoUrl: photoUrl,
            logoPosition: prev.logoPosition === 'none' ? 'side' : prev.logoPosition,
          }));
          setIsCameraModalOpen(false);
          onShowToast('Foto capturada con éxito para el banner', 'success');
        }}
        title="Capturar Foto para Banner o Logotipo"
        subtitle="Usa la cámara de tu dispositivo para capturar una imagen nítida de la iglesia o ministerio."
      />
    </div>
  );
};
