import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  X,
  Upload,
  Camera,
  Image as ImageIcon,
  HeartHandshake,
  DollarSign,
  Tv,
  FileText,
  Layers,
  Megaphone,
  Heart,
  MapPin,
  ArrowUp,
  ArrowDown,
  Copy,
  Info,
  Sliders,
  ExternalLink,
  ShieldAlert,
  CreditCard,
  Landmark,
  QrCode,
  Target,
  FileCheck,
  Smile,
  Vote,
  Ticket,
  Shield,
  Clock,
  Calendar,
  AlertTriangle,
  Hourglass,
  Lock,
  EyeOff,
} from 'lucide-react';
import {
  CustomSectionItem,
  CustomSectionType,
  CustomSectionSubTab,
  DonationPaymentMethod,
  DonationCampaign,
  ChurchConfig,
  DeletedItem,
  DEFAULT_CUSTOM_SECTIONS,
  SystemRole,
} from '../../types';
import { isDemoRaffle } from '../../utils/raffleUtils';
import {
  MINISTRY_ICON_OPTIONS,
  MINISTRY_COLOR_PRESETS,
  getMinistryIconComponent,
} from '../../utils/ministryIcons';
import { CustomSubTabsManager } from './subtabs/CustomSubTabsManager';
import {
  getSectionExpirationInfo,
  formatExpirationDate,
  generatePresetDate,
  toLocalDatetimeInputValue,
} from '../../utils/sectionExpiration';

interface CustomSectionManagerViewProps {
  config: ChurchConfig;
  onUpdateConfig?: (updated: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onPreviewSection?: (sectionSlug: string) => void;
  autoOpenCreateTrigger?: number;
}

const SECTION_TYPE_PRESETS: {
  type: CustomSectionType;
  title: string;
  badge: string;
  iconName: string;
  color: string;
  description: string;
}[] = [
  {
    type: 'donations',
    title: 'Donaciones, Diezmos & Ofrendas',
    badge: 'Canales Oficiales',
    iconName: 'HeartHandshake',
    color: '#059669',
    description: 'Cuentas bancarias (ACH/Wire), Zelle, PayPal, códigos QR, campañas pro-templo con barras de metas y comprobantes.',
  },
  {
    type: 'media',
    title: 'Transmisiones en Vivo & Medios',
    badge: 'En Vivo',
    iconName: 'Tv',
    color: '#dc2626',
    description: 'Reproductor de cultos en vivo (YouTube/Facebook), podcast, radio online y archivo de sermones.',
  },
  {
    type: 'resources',
    title: 'Recursos & Documentos',
    badge: 'Descargas',
    iconName: 'FileText',
    color: '#0284c7',
    description: 'Guías de estudio bíblico, formatos de membresía, material dominical y enlaces a Google Drive.',
  },
  {
    type: 'custom_page',
    title: 'Página Personalizada con Sub-pestañas',
    badge: 'Modular',
    iconName: 'Layers',
    color: '#7c3aed',
    description: 'Crea una sección libre con sub-pestañas dinámicas (Notas, Minutas, Tareas, Enlaces y Tarjetas).',
  },
  {
    type: 'announcements',
    title: 'Boletín Eclesial & Avisos',
    badge: 'Noticias',
    iconName: 'Megaphone',
    color: '#ea580c',
    description: 'Comunicados urgentes, boletín dominical oficial y calendario de avisos especiales.',
  },
  {
    type: 'prayer_wall',
    title: 'Muro de Oración & Testimonios',
    badge: 'Intercesión',
    iconName: 'Heart',
    color: '#db2777',
    description: 'Espacio para peticiones de oración de los hermanos, testimonios de fe y apoyo espiritual.',
  },
  {
    type: 'contact',
    title: 'Sedes, Horarios & Contacto',
    badge: 'Atención',
    iconName: 'MapPin',
    color: '#0d9488',
    description: 'Dirección física de los santuarios, líneas telefónicas de consejería pastoral y mapa interactivo.',
  },
  {
    type: 'polls',
    title: 'Encuestas & Votaciones Interactivas',
    badge: 'Votaciones & Elecciones',
    iconName: 'Vote',
    color: '#9333ea',
    description: 'Votaciones con fotos de candidatos, lemas de congresos, elecciones y proyectos con conteo de votos en vivo y ganadores.',
  },
  {
    type: 'raffles',
    title: 'Sorteos & Rifas Pro-Fondos',
    badge: 'Tómbola & Premios',
    iconName: 'Ticket',
    color: '#d97706',
    description: 'Boletos numerados, recaudación pro-templo, tómbola digital en vivo con ruleta animada y entrega de premios.',
  },
];

const AVAILABLE_SYSTEM_ROLES: SystemRole[] = [
  'Desarrollador',
  'Administrador',
  'Contador',
  'Líder de Jóvenes',
  'Líder',
  'Miembro',
  'Alabanza',
  'Danza',
  'Damas',
  'Servidores',
  'Teatro',
];

export const CustomSectionManagerView: React.FC<CustomSectionManagerViewProps> = ({
  config,
  onUpdateConfig,
  onSendToTrash,
  onShowToast,
  onPreviewSection,
  autoOpenCreateTrigger,
}) => {
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const sectionsList: CustomSectionItem[] =
    Array.isArray(config.customSections)
      ? config.customSections
      : DEFAULT_CUSTOM_SECTIONS;

  const [isCreatingOrEditing, setIsCreatingOrEditing] = useState<boolean>(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<'general' | 'banner' | 'subtabs' | 'content' | 'expiration'>('general');
  const [sectionToDelete, setSectionToDelete] = useState<CustomSectionItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<CustomSectionItem>({
    id: '',
    name: '',
    shortName: '',
    slug: '',
    description: '',
    sectionType: 'donations',
    iconName: 'HeartHandshake',
    color: '#059669',
    enabled: true,
    order: sectionsList.length + 1,
    badge: 'Ofrendar',
    showInTopNav: true,
    expiration: {
      enabled: false,
      expiresAt: '',
      startsAt: '',
      expirationAction: 'banner',
      showCountdown: true,
      expiredMessage: '',
    },
    banner: {
      title: 'Donaciones & Ofrendas',
      subtitle: 'Sembrando con gozo en la expansión del Reino de Dios',
      badge: 'Canales Oficiales',
      gradientStyle: 'emerald',
      logoPosition: 'side',
      logoOpacity: 0.25,
      primaryColor: '#059669',
      secondaryColor: '#047857',
      logoUrl: '',
    },
    donationsData: {
      versePrompt: '«Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.» — 2 Corintios 9:7',
      enableDonorRegistration: true,
      showFundraisingCampaigns: true,
      showRecentDonations: true,
      methods: [
        {
          id: `meth_${Date.now()}`,
          title: 'Zelle Oficial',
          type: 'zelle',
          accountName: 'Iglesia Central',
          accountNumberOrEmail: 'donaciones@iglesiacentral.org',
          instructions: 'Indique su nombre y el concepto (Diezmo, Ofrenda o Pro-Templo).',
          colorTheme: '#7c3aed',
          active: true,
        },
      ],
      campaigns: [
        {
          id: `camp_${Date.now()}`,
          title: 'Campaña Pro-Construcción del Templo',
          description: 'Recaudación para la ampliación del santuario principal.',
          targetGoal: 50000,
          currentAmount: 15000,
          active: true,
        },
      ],
      records: [],
    },
  });

  // Automatically open create studio if triggered
  React.useEffect(() => {
    if (autoOpenCreateTrigger && autoOpenCreateTrigger > 0) {
      handleOpenCreate('donations');
    }
  }, [autoOpenCreateTrigger]);

  const handleOpenCreate = (presetType: CustomSectionType | any = 'donations') => {
    // Ensure presetType is a valid string and not a SyntheticEvent
    const safeType: CustomSectionType =
      typeof presetType === 'string' && SECTION_TYPE_PRESETS.some((p) => p.type === presetType)
        ? (presetType as CustomSectionType)
        : 'donations';
    const preset = SECTION_TYPE_PRESETS.find((p) => p.type === safeType) || SECTION_TYPE_PRESETS[0];
    const newId = `sec_${Date.now().toString(36)}`;
    const initialSlug = safeType === 'donations' ? 'donaciones' : `${safeType}-${Date.now().toString(36).slice(-4)}`;

    const newSection: CustomSectionItem = {
      id: newId,
      name: preset.title,
      shortName: preset.title.split(' ')[0],
      slug: initialSlug,
      description: preset.description,
      sectionType: safeType,
      iconName: preset.iconName,
      color: preset.color,
      enabled: true,
      order: sectionsList.length + 1,
      badge: preset.badge,
      showInTopNav: true,
      expiration: {
        enabled: false,
        expiresAt: '',
        startsAt: '',
        expirationAction: 'banner',
        showCountdown: true,
        expiredMessage: '',
      },
      banner: {
        title: preset.title,
        subtitle: `Bienvenido a la sección oficial de ${preset.title} de nuestra congregación`,
        badge: preset.badge,
        gradientStyle: presetType === 'donations' ? 'emerald' : 'glow',
        logoPosition: 'side',
        logoOpacity: 0.25,
        primaryColor: preset.color,
        secondaryColor: preset.color,
        logoUrl: '',
      },
      donationsData:
        presetType === 'donations'
          ? {
              versePrompt: '«Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.» — 2 Corintios 9:7',
              enableDonorRegistration: true,
              showFundraisingCampaigns: true,
              showRecentDonations: true,
              methods: [
                {
                  id: `meth_zelle_${Date.now()}`,
                  title: 'Zelle Parroquial',
                  type: 'zelle',
                  accountName: 'Iglesia Central',
                  accountNumberOrEmail: 'donaciones@iglesiacentral.org',
                  instructions: 'Por favor indique en la nota si es Diezmo u Ofrenda.',
                  colorTheme: '#7c3aed',
                  active: true,
                },
                {
                  id: `meth_bank_${Date.now()}`,
                  title: 'Transferencia Bancaria',
                  type: 'bank',
                  accountName: 'Iglesia Central Ministerio Internacional',
                  bankName: 'JPMorgan Chase Bank',
                  accountNumberOrEmail: '987654321012',
                  routingOrSwift: '021000021',
                  instructions: 'Comprobante al correo finanzas@iglesiacentral.org',
                  colorTheme: '#0284c7',
                  active: true,
                },
              ],
              campaigns: [
                {
                  id: `camp_${Date.now()}`,
                  title: 'Campaña Pro-Construcción del Templo',
                  description: 'Recaudación para la ampliación del santuario principal.',
                  targetGoal: 50000,
                  currentAmount: 15000,
                  active: true,
                },
              ],
              records: [],
            }
          : undefined,
      pollsData:
        presetType === 'polls'
          ? {
              polls: [
                {
                  id: `poll_${Date.now()}`,
                  title: 'Elección de Coordinador de Campamento Juvenil 2026',
                  description: 'Vota con oración y responsabilidad por el hermano o hermana que liderará el equipo de actividades.',
                  category: 'Elecciones',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                  options: [
                    {
                      id: `opt_${Date.now()}_1`,
                      text: 'Hno. David Morales',
                      description: 'Líder del grupo de jóvenes universitarios, 5 años de servicio en campamentos.',
                      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                      color: '#4f46e5',
                      votesCount: 0,
                      voterUserIds: [],
                    },
                    {
                      id: `opt_${Date.now()}_2`,
                      text: 'Hna. Gabriela Santos',
                      description: 'Coordinadora de eventos y talleres espirituales con amplia experiencia en retiros.',
                      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
                      color: '#059669',
                      votesCount: 0,
                      voterUserIds: [],
                    },
                  ],
                  totalVotes: 0,
                },
              ],
            }
          : undefined,
      rafflesData:
        presetType === 'raffles'
          ? {
              raffles: [],
            }
          : undefined,
    };

    setFormData(newSection);
    setEditingSectionId(null);
    setEditorSubTab('general');
    setIsCreatingOrEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (section: CustomSectionItem) => {
    const cloned: CustomSectionItem = JSON.parse(JSON.stringify(section));
    if (cloned.rafflesData?.raffles) {
      cloned.rafflesData.raffles = cloned.rafflesData.raffles.filter((r) => !isDemoRaffle(r));
    }
    if (cloned.subTabs) {
      cloned.subTabs = cloned.subTabs.map((st) => {
        if (st.rafflesData?.raffles) {
          return {
            ...st,
            rafflesData: {
              ...st.rafflesData,
              raffles: st.rafflesData.raffles.filter((r) => !isDemoRaffle(r)),
            },
          };
        }
        return st;
      });
    }
    if (!cloned.expiration) {
      cloned.expiration = {
        enabled: false,
        expiresAt: '',
        startsAt: '',
        expirationAction: 'banner',
        showCountdown: true,
        expiredMessage: '',
      };
    }
    setFormData(cloned);
    setEditingSectionId(section.id);
    setEditorSubTab('general');
    setIsCreatingOrEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Image Upload helper (Device & Camera)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'bannerLogo' | 'qrCode', methodIndex?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Por favor suba un archivo de imagen válido (PNG, JPG, WebP, SVG).', 'danger');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      onShowToast('La imagen excede el límite recomendado de 8MB.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (field === 'bannerLogo') {
        setFormData((prev) => ({
          ...prev,
          banner: {
            ...prev.banner,
            logoUrl: result,
          },
        }));
        onShowToast('¡Imagen y logotipo cargados exitosamente!', 'success');
      } else if (field === 'qrCode' && methodIndex !== undefined && formData.donationsData) {
        const updatedMethods = [...(formData.donationsData.methods || [])];
        if (updatedMethods[methodIndex]) {
          updatedMethods[methodIndex].qrCodeUrl = result;
          setFormData((prev) => ({
            ...prev,
            donationsData: {
              ...prev.donationsData!,
              methods: updatedMethods,
            },
          }));
          onShowToast('¡Código QR cargado exitosamente!', 'success');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Section
  const handleSaveSection = () => {
    if (!formData.name.trim()) {
      onShowToast('El nombre de la sección no puede estar vacío.', 'danger');
      return;
    }

    let finalSlug = formData.slug?.trim() || (formData.name || '').toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (!finalSlug) finalSlug = `seccion-${Date.now()}`;

    const preparedSection: CustomSectionItem = {
      ...formData,
      slug: finalSlug,
      shortName: formData.shortName?.trim() || formData.name.trim(),
      updatedAt: new Date().toISOString(),
    };

    let updatedList: CustomSectionItem[];
    if (editingSectionId) {
      updatedList = sectionsList.map((sec) => (sec.id === editingSectionId ? preparedSection : sec));
      onShowToast(`Sección «${preparedSection.name}» actualizada con éxito.`, 'success');
    } else {
      updatedList = [...sectionsList, { ...preparedSection, createdAt: new Date().toISOString() }];
      onShowToast(`Nueva sección «${preparedSection.name}» creada exitosamente.`, 'success');
    }

    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({
        ...prev,
        customSections: updatedList,
      }));
    }

    setIsCreatingOrEditing(false);
    setEditingSectionId(null);
  };

  // Toggle Enabled
  const handleToggleEnabled = (sectionId: string) => {
    const updated = sectionsList.map((sec) =>
      sec.id === sectionId ? { ...sec, enabled: !sec.enabled } : sec
    );
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({ ...prev, customSections: updated }));
    }
    const current = sectionsList.find((s) => s.id === sectionId);
    onShowToast(`Sección ${current?.enabled ? 'desactivada' : 'activada'}.`, 'info');
  };

  // Toggle Top Nav Visibility
  const handleToggleTopNav = (sectionId: string) => {
    const updated = sectionsList.map((sec) =>
      sec.id === sectionId ? { ...sec, showInTopNav: !sec.showInTopNav } : sec
    );
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({ ...prev, customSections: updated }));
    }
    const current = sectionsList.find((s) => s.id === sectionId);
    onShowToast(`Visibilidad en barra superior ${current?.showInTopNav ? 'ocultada' : 'activada'}.`, 'info');
  };

  // Move Order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sectionsList.length - 1)) return;

    const newIdx = direction === 'up' ? index - 1 : index + 1;
    const items = [...sectionsList];
    const temp = items[index];
    items[index] = items[newIdx];
    items[newIdx] = temp;

    const reordered = items.map((it, idx) => ({ ...it, order: idx + 1 }));
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({ ...prev, customSections: reordered }));
    }
  };

  // Delete Section with Recycle Bin support
  const handleDeleteSection = (section: CustomSectionItem) => {
    setSectionToDelete(section);
  };

  const handleConfirmDeleteSection = () => {
    if (!sectionToDelete) return;
    const target = sectionToDelete;

    if (onSendToTrash) {
      onSendToTrash({
        id: `del_${Date.now()}`,
        originalId: target.id,
        itemType: 'customSection',
        title: target.name,
        subtitle: `Sección personalizada (${target.sectionType}) • /${target.slug}`,
        deletedAt: new Date().toISOString(),
        payload: target,
      });
    }
    const updated = sectionsList.filter((s) => s.id !== target.id);
    if (onUpdateConfig) {
      onUpdateConfig((prev) => ({ ...prev, customSections: updated }));
    }
    onShowToast(`Sección «${target.name}» enviada a la papelera de reciclaje.`, 'info');
    setSectionToDelete(null);
  };

  // Helper Methods for Donation Configuration
  const handleAddDonationMethod = () => {
    if (!formData.donationsData) return;
    const newMethod: DonationPaymentMethod = {
      id: `meth_${Date.now()}`,
      title: 'Nuevo Método de Donación',
      type: 'bank',
      accountName: config.name || 'Iglesia Central',
      accountNumberOrEmail: '',
      colorTheme: '#059669',
      active: true,
    };
    setFormData((prev) => ({
      ...prev,
      donationsData: {
        ...prev.donationsData!,
        methods: [...(prev.donationsData?.methods || []), newMethod],
      },
    }));
  };

  const handleAddDonationCampaign = () => {
    if (!formData.donationsData) return;
    const newCamp: DonationCampaign = {
      id: `camp_${Date.now()}`,
      title: 'Nueva Campaña Pro-Fondos',
      description: 'Descripción del propósito y meta de la recaudación.',
      targetGoal: 10000,
      currentAmount: 0,
      active: true,
    };
    setFormData((prev) => ({
      ...prev,
      donationsData: {
        ...prev.donationsData!,
        campaigns: [...(prev.donationsData?.campaigns || []), newCamp],
      },
    }));
  };

  const SelectedIconComponent = getMinistryIconComponent(formData.iconName);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Hidden File Inputs for Device & Camera */}
      <input
        type="file"
        ref={logoFileInputRef}
        onChange={(e) => handleImageUpload(e, 'bannerLogo')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleImageUpload(e, 'bannerLogo')}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/40 border-2 border-emerald-500/40 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 shrink-0">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                Creación de Secciones & Pestañas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs">
                {sectionsList.length} Secciones
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Crea módulos y pestañas independientes (Donaciones, Medios en Vivo, Recursos, Misiones, etc.) con banners personalizados, subida de fotos/logos desde el dispositivo o cámara, y sincronización en tiempo real en la barra superior.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleOpenCreate('donations')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Sección de Donaciones</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenCreate('custom_page')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Página Libre</span>
          </button>
        </div>
      </div>

      {/* QUICK PRESET TEMPLATES */}
      {!isCreatingOrEditing && (
        <div className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Plantillas Rápidas Listas para Crear</span>
            </h3>
            <span className="text-[11px] text-slate-400">Haz clic en una plantilla para comenzar</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {SECTION_TYPE_PRESETS.map((preset) => {
              const IconComp = getMinistryIconComponent(preset.iconName);
              return (
                <button
                  key={preset.type}
                  type="button"
                  onClick={() => handleOpenCreate(preset.type)}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-2.5 rounded-xl text-white shadow-sm shrink-0"
                      style={{ backgroundColor: preset.color }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {preset.title}
                      </h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {preset.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* FULL EDITOR STUDIO MODAL / CARD */}
      {isCreatingOrEditing && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/50 shadow-2xl space-y-6 animate-fadeIn">
          {/* Editor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
            <div className="flex items-center space-x-3">
              <div
                className="p-3 rounded-2xl text-white shadow-md"
                style={{ backgroundColor: formData.color || '#059669' }}
              >
                <SelectedIconComponent className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                  <span>{editingSectionId ? `Editar Sección: ${formData.name}` : 'Crear Nueva Sección / Pestaña'}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-mono">
                    {formData.sectionType}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Personaliza todos los aspectos visuales, banner superior, subida de fotos y módulos internos.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setIsCreatingOrEditing(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSection}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Sección</span>
              </button>
            </div>
          </div>

          {/* Sub-tab navigation in editor */}
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              type="button"
              onClick={() => setEditorSubTab('general')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                editorSubTab === 'general'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>1. Configuración Básica</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorSubTab('banner')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                editorSubTab === 'banner'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>2. Banner Superior & Fotos</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorSubTab('subtabs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                editorSubTab === 'subtabs'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. Pestañas Internas ({formData.subTabs?.length || 0})</span>
            </button>

            {formData.sectionType === 'donations' && (
              <button
                type="button"
                onClick={() => setEditorSubTab('content')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  editorSubTab === 'content'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>4. Cuentas & Métodos de Donación</span>
              </button>
            )}

            {formData.sectionType === 'raffles' && (
              <button
                type="button"
                onClick={() => setEditorSubTab('content')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  editorSubTab === 'content'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>4. Sorteos & Boletos ({formData.rafflesData?.raffles.length || 0})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setEditorSubTab('expiration')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                editorSubTab === 'expiration'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>⏱️ Vigencia & Tiempo de Vencimiento</span>
              {formData.expiration?.enabled && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          {/* TAB 1: BASIC CONFIG */}
          {editorSubTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Sección / Pestaña *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        name: val,
                        shortName: prev.shortName ? prev.shortName : val.split(' ')[0],
                        banner: { ...prev.banner, title: prev.banner.title || val },
                      }));
                    }}
                    placeholder="Ej: Donaciones & Ofrendas, Transmisiones, Misiones..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Nombre Corto (Barra Superior)
                    </label>
                    <input
                      type="text"
                      value={formData.shortName || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, shortName: e.target.value }))}
                      placeholder="Ej: Donaciones"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Identificador / Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                      placeholder="donaciones"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Módulo
                  </label>
                  <select
                    value={formData.sectionType}
                    onChange={(e) => {
                      const newType = e.target.value as CustomSectionType;
                      setFormData((prev) => ({
                        ...prev,
                        sectionType: newType,
                        donationsData:
                          newType === 'donations' && !prev.donationsData
                            ? {
                                versePrompt: '«Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.» — 2 Corintios 9:7',
                                enableDonorRegistration: true,
                                showFundraisingCampaigns: true,
                                showRecentDonations: true,
                                methods: [],
                                campaigns: [],
                                records: [],
                              }
                            : prev.donationsData,
                        pollsData:
                          newType === 'polls' && !prev.pollsData
                            ? {
                                polls: [
                                  {
                                    id: 'poll_' + Date.now(),
                                    title: 'Elección de Lema Anual 2026',
                                    description: 'Participa y vota por la visión espiritual que guiará a la iglesia este año.',
                                    category: 'Lema & Visión',
                                    options: [
                                      {
                                        id: 'opt_1',
                                        text: 'Año de la Doble Porción y Conquista',
                                        description: 'Basado en 2 Reyes 2:9',
                                        votesCount: 0,
                                        color: '#4f46e5',
                                      },
                                      {
                                        id: 'opt_2',
                                        text: 'Año de Fe Inquebrantable y Milagros',
                                        description: 'Basado en Hebreos 11:1',
                                        votesCount: 0,
                                        color: '#059669',
                                      },
                                      {
                                        id: 'opt_3',
                                        text: 'Año de Avivamiento y Cosecha Espiritual',
                                        description: 'Basado en Hechos 2:17',
                                        votesCount: 0,
                                        color: '#d97706',
                                      },
                                    ],
                                    totalVotes: 0,
                                    status: 'active',
                                    allowMultipleVotes: false,
                                    showResultsBeforeVoting: false,
                                    requireAuthToVote: true,
                                    createdAt: new Date().toISOString(),
                                  },
                                ],
                                allowMemberPollCreation: false,
                              }
                            : prev.pollsData,
                        rafflesData:
                          newType === 'raffles' && !prev.rafflesData
                            ? {
                                raffles: [],
                              }
                            : prev.rafflesData,
                      }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  >
                    <option value="donations">💳 Donaciones & Ofrendas (Zelle, Bancos, Metas)</option>
                    <option value="media">🎥 Transmisiones en Vivo & Medios</option>
                    <option value="resources">📚 Recursos & Documentos Descargables</option>
                    <option value="custom_page">📄 Página Libre con Sub-pestañas Dinámicas</option>
                    <option value="announcements">📢 Boletín Eclesial & Avisos</option>
                    <option value="prayer_wall">🙏 Muro de Oración & Testimonios</option>
                    <option value="contact">📍 Sedes, Horarios & Contacto</option>
                    <option value="polls">📊 Encuestas & Votaciones Interactivas (Candidatos, Votos y Ganador)</option>
                    <option value="raffles">🎟️ Sorteos & Rifas Pro-Fondos (Boletos, Tómbola Digital y Premios)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Insignia / Badge Opcional
                  </label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                    placeholder="Ej: Ofrendar, En Vivo, Oficial..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white">Mostrar en Barra de Navegación Superior</span>
                      <p className="text-[11px] text-slate-500">Aparecerá en el menú superior para todos los usuarios autorizados.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, showInTopNav: !prev.showInTopNav }))}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                        formData.showInTopNav ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          formData.showInTopNav ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Role Permissions (RBAC) */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          Roles con Permiso de Acceso
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Controla qué cargos pueden ver y participar en esta sección.
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {(!formData.allowedRoles || formData.allowedRoles.length === 0 || (formData.allowedRoles as string[]).includes('Todos'))
                        ? 'Toda la Congregación'
                        : `${formData.allowedRoles.length} Roles`}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          allowedRoles: [],
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        !formData.allowedRoles || formData.allowedRoles.length === 0 || (formData.allowedRoles as string[]).includes('Todos')
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      ✓ Toda la Congregación (Público)
                    </button>

                    {AVAILABLE_SYSTEM_ROLES.map((role) => {
                      const isSelected =
                        Array.isArray(formData.allowedRoles) &&
                        formData.allowedRoles.length > 0 &&
                        !(formData.allowedRoles as string[]).includes('Todos') &&
                        formData.allowedRoles.includes(role);

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => {
                              const current = Array.isArray(prev.allowedRoles)
                                ? prev.allowedRoles.filter((r) => r !== 'Todos')
                                : [];
                              const exists = current.includes(role);
                              const updated = exists
                                ? current.filter((r) => r !== role)
                                : [...current, role];
                              return {
                                ...prev,
                                allowedRoles: updated,
                              };
                            });
                          }}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-sm font-bold'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {role}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Icon & Color Selector */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
                    Seleccionar Icono Representativo
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                    {MINISTRY_ICON_OPTIONS.map((opt) => {
                      const IconItem = opt.icon;
                      const isSelected = (formData.iconName || '').toLowerCase() === (opt.key || '').toLowerCase();
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, iconName: opt.key }))}
                          title={opt.label}
                          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          <IconItem className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-2">
                    Paleta de Color Temático
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {MINISTRY_COLOR_PRESETS.map((col) => {
                      const isSelected = (formData.color || '').toLowerCase() === (col.hex || '').toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              color: col.hex,
                              banner: { ...prev.banner, primaryColor: col.hex },
                            }))
                          }
                          title={col.name}
                          className={`w-7 h-7 rounded-full transition-transform ${
                            isSelected ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: col.hex }}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción General
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detalles y propósito de esta sección..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                  />
                </div>

                {/* Atajo Rápido a Configuración de Vigencia */}
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-2 rounded-xl ${formData.expiration?.enabled ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        Tiempo de Vigencia / Vencimiento
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {formData.expiration?.enabled && formData.expiration.expiresAt
                          ? `Vence: ${formatExpirationDate(formData.expiration.expiresAt)}`
                          : 'Permanente (Sin límite de tiempo)'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditorSubTab('expiration')}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    {formData.expiration?.enabled ? 'Ajustar ⏱️' : '+ Añadir Tiempo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BANNER & PHOTO UPLOAD */}
          {editorSubTab === 'banner' && (
            <div className="space-y-6 animate-fadeIn">
              {/* LIVE BANNER PREVIEW */}
              <div>
                <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                  Vista Previa del Banner en Vivo
                </label>
                <div
                  className="relative p-6 sm:p-8 rounded-3xl overflow-hidden shadow-xl text-white transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${formData.color || '#059669'} 0%, ${formData.banner.secondaryColor || '#047857'} 100%)`,
                  }}
                >
                  {/* Background Watermark Logo if set */}
                  {formData.banner.logoUrl &&
                    (formData.banner.logoPosition === 'background' || formData.banner.logoPosition === 'both') && (
                      <img
                        src={formData.banner.logoUrl}
                        alt="Watermark"
                        className="absolute right-4 -bottom-6 w-48 h-48 sm:w-64 sm:h-64 object-contain pointer-events-none select-none"
                        style={{ opacity: formData.banner.logoOpacity || 0.2 }}
                      />
                    )}

                  <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      {/* Side Logo if set */}
                      {formData.banner.logoUrl &&
                        (formData.banner.logoPosition === 'side' || formData.banner.logoPosition === 'both') && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-md p-2 border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                            <img
                              src={formData.banner.logoUrl}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}

                      {!formData.banner.logoUrl && (
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md p-3 border border-white/30 flex items-center justify-center shrink-0 shadow-lg">
                          <SelectedIconComponent className="w-8 h-8 text-white" />
                        </div>
                      )}

                      <div>
                        {formData.banner.badge && (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] mb-1">
                            {formData.banner.badge}
                          </span>
                        )}
                        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                          {formData.banner.title || formData.name || 'Título de la Sección'}
                        </h2>
                        <p className="text-xs sm:text-sm text-white/80 mt-0.5 max-w-xl">
                          {formData.banner.subtitle || 'Subtítulo eclesial descriptivo para la congregación.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BANNER EDIT CONTROLS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Título del Banner
                    </label>
                    <input
                      type="text"
                      value={formData.banner.title || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          banner: { ...prev.banner, title: e.target.value },
                        }))
                      }
                      placeholder="Ej: Canales de Donación & Diezmos"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Subtítulo del Banner
                    </label>
                    <input
                      type="text"
                      value={formData.banner.subtitle || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          banner: { ...prev.banner, subtitle: e.target.value },
                        }))
                      }
                      placeholder="Ej: Sembrando con alegría en la obra de Dios"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                      Insignia del Banner
                    </label>
                    <input
                      type="text"
                      value={formData.banner.badge || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          banner: { ...prev.banner, badge: e.target.value },
                        }))
                      }
                      placeholder="Ej: Canales Oficiales Eclesiales"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                {/* LOGO & IMAGE UPLOADER */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1.5">
                      <Upload className="w-4 h-4 text-emerald-500" />
                      <span>Subir Foto / Logotipo de la Sección</span>
                    </label>
                    {formData.banner.logoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            banner: { ...prev.banner, logoUrl: '' },
                          }))
                        }
                        className="text-[11px] font-bold text-rose-500 hover:underline"
                      >
                        Quitar Imagen
                      </button>
                    )}
                  </div>

                  {/* Upload action buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 font-bold text-xs text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center space-y-1 transition-all"
                    >
                      <Upload className="w-5 h-5 text-emerald-500" />
                      <span>Subir de Dispositivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-emerald-500 font-bold text-xs text-slate-700 dark:text-slate-200 flex flex-col items-center justify-center space-y-1 transition-all"
                    >
                      <Camera className="w-5 h-5 text-teal-500" />
                      <span>Tomar con Cámara</span>
                    </button>
                  </div>

                  {/* Direct URL input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      O pegar enlace URL de imagen:
                    </label>
                    <input
                      type="url"
                      value={formData.banner.logoUrl || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          banner: { ...prev.banner, logoUrl: e.target.value },
                        }))
                      }
                      placeholder="https://ejemplo.com/logo.png"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                    />
                  </div>

                  {/* Logo Display Position */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Posición del Logo
                      </label>
                      <select
                        value={formData.banner.logoPosition || 'side'}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            banner: { ...prev.banner, logoPosition: e.target.value as any },
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                      >
                        <option value="side">Lateral Destacado</option>
                        <option value="background">Fondo (Marca de Agua)</option>
                        <option value="both">Ambos</option>
                        <option value="none">Sin Logo</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">
                        Opacidad Marca de Agua ({Math.round((formData.banner.logoOpacity || 0.2) * 100)}%)
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={formData.banner.logoOpacity || 0.25}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            banner: { ...prev.banner, logoOpacity: parseFloat(e.target.value) },
                          }))
                        }
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: INTERNAL SUB-TABS MANAGER (CALENDARS, VIDEOS, LINKS, WORK PLANS, LIBRARY, MUSIC, MEMBERS, CASTING, REHEARSALS) */}
          {editorSubTab === 'subtabs' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                <p className="font-extrabold flex items-center space-x-1.5 mb-1">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>Pestañas y Módulos Internos de la Sección</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Agrega pestañas a esta sección como <strong>Calendarios</strong>, <strong>Subida de Videos</strong>, <strong>Enlaces</strong>, <strong>Planificaciones de Trabajo</strong>, <strong>Bibliotecas y Libros</strong>, <strong>Música</strong>, <strong>Integrantes</strong>, <strong>Casting</strong> y <strong>Ensayos</strong>. Podrás ordenarlas y editar su contenido en cualquier momento.
                </p>
              </div>

              <CustomSubTabsManager
                subTabs={formData.subTabs || []}
                onChangeSubTabs={(newTabs) => setFormData((prev) => ({ ...prev, subTabs: newTabs }))}
                onShowToast={onShowToast}
              />
            </div>
          )}

          {/* TAB 4: DONATIONS CONTENT CONFIG */}
          {editorSubTab === 'content' && formData.sectionType === 'donations' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Biblical Prompt */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Texto Bíblico o Mensaje de Ofrenda
                </label>
                <input
                  type="text"
                  value={formData.donationsData?.versePrompt || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      donationsData: { ...prev.donationsData!, versePrompt: e.target.value },
                    }))
                  }
                  placeholder="«Cada uno dé como propuso en su corazón...» — 2 Corintios 9:7"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* PAYMENT METHODS LIST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Cuentas & Métodos de Pago Habilitados ({formData.donationsData?.methods.length || 0})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDonationMethod}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 font-bold text-xs transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Método</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.donationsData?.methods.map((method, mIdx) => (
                    <div
                      key={method.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center">
                            {mIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={method.title}
                            onChange={(e) => {
                              const updated = [...(formData.donationsData?.methods || [])];
                              updated[mIdx].title = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            placeholder="Ej: Zelle Parroquial, Banco Chase..."
                            className="font-extrabold text-sm px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (formData.donationsData?.methods || []).filter((_, idx) => idx !== mIdx);
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                            title="Eliminar método"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo de Canal</label>
                          <select
                            value={method.type}
                            onChange={(e) => {
                              const updated = [...(formData.donationsData?.methods || [])];
                              updated[mIdx].type = e.target.value as any;
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          >
                            <option value="zelle">Zelle</option>
                            <option value="bank">Transferencia Bancaria (ACH/Wire)</option>
                            <option value="paypal">PayPal / Tarjeta</option>
                            <option value="bizum">Bizum / Móvil</option>
                            <option value="card">Pasarela de Pago Online</option>
                            <option value="other">Otro Canal</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Titular de la Cuenta</label>
                          <input
                            type="text"
                            value={method.accountName}
                            onChange={(e) => {
                              const updated = [...(formData.donationsData?.methods || [])];
                              updated[mIdx].accountName = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            placeholder="Nombre oficial de la cuenta"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Número de Cuenta o Email</label>
                          <input
                            type="text"
                            value={method.accountNumberOrEmail}
                            onChange={(e) => {
                              const updated = [...(formData.donationsData?.methods || [])];
                              updated[mIdx].accountNumberOrEmail = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            placeholder="Email Zelle o No. de Cuenta"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {method.type === 'bank' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Nombre del Banco</label>
                            <input
                              type="text"
                              value={method.bankName || ''}
                              onChange={(e) => {
                                const updated = [...(formData.donationsData?.methods || [])];
                                updated[mIdx].bankName = e.target.value;
                                setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            placeholder="Ej: Chase Bank, Wells Fargo, BBVA..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">Routing / SWIFT / CLABE</label>
                          <input
                            type="text"
                            value={method.routingOrSwift || ''}
                            onChange={(e) => {
                              const updated = [...(formData.donationsData?.methods || [])];
                              updated[mIdx].routingOrSwift = e.target.value;
                              setFormData((prev) => ({
                                ...prev,
                                donationsData: { ...prev.donationsData!, methods: updated },
                              }));
                            }}
                            placeholder="021000021"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Instrucciones Adicionales</label>
                      <input
                        type="text"
                        value={method.instructions || ''}
                        onChange={(e) => {
                          const updated = [...(formData.donationsData?.methods || [])];
                          updated[mIdx].instructions = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            donationsData: { ...prev.donationsData!, methods: updated },
                          }));
                        }}
                        placeholder="Ej: Indicar en la referencia si es Diezmo o Pro-Templo"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FUNDRAISING CAMPAIGNS */}
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-teal-500" />
                  <span>Campañas Pro-Fondos & Metas Eclesiales ({formData.donationsData?.campaigns.length || 0})</span>
                </h4>
                <button
                  type="button"
                  onClick={handleAddDonationCampaign}
                  className="px-3 py-1.5 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-200 font-bold text-xs transition-all flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Campaña</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.donationsData?.campaigns.map((camp, cIdx) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={camp.title}
                        onChange={(e) => {
                          const updated = [...(formData.donationsData?.campaigns || [])];
                          updated[cIdx].title = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            donationsData: { ...prev.donationsData!, campaigns: updated },
                          }));
                        }}
                        placeholder="Nombre de la campaña"
                        className="font-extrabold text-xs px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 w-full mr-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (formData.donationsData?.campaigns || []).filter((_, idx) => idx !== cIdx);
                          setFormData((prev) => ({
                            ...prev,
                            donationsData: { ...prev.donationsData!, campaigns: updated },
                          }));
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Meta Financiera ($)</label>
                        <input
                          type="number"
                          value={camp.targetGoal}
                          onChange={(e) => {
                            const updated = [...(formData.donationsData?.campaigns || [])];
                            updated[cIdx].targetGoal = parseFloat(e.target.value) || 0;
                            setFormData((prev) => ({
                              ...prev,
                              donationsData: { ...prev.donationsData!, campaigns: updated },
                            }));
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Monto Actual ($)</label>
                        <input
                          type="number"
                          value={camp.currentAmount}
                          onChange={(e) => {
                            const updated = [...(formData.donationsData?.campaigns || [])];
                            updated[cIdx].currentAmount = parseFloat(e.target.value) || 0;
                            setFormData((prev) => ({
                              ...prev,
                              donationsData: { ...prev.donationsData!, campaigns: updated },
                            }));
                          }}
                          className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4 (RAFFLES): RAFFLES CONTENT PREVIEW & CONFIG */}
        {editorSubTab === 'content' && formData.sectionType === 'raffles' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shrink-0">
                <Ticket className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Módulo de Sorteos & Rifas Pro-Fondos Activo
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Esta sección incluye una experiencia completa e intuitiva con <strong>grilla interactiva de boletos</strong>, 
                  <strong>tómbola digital con ruleta y sonido</strong>, <strong>asignación masiva de boletos</strong>, 
                  <strong>filtro por comprador</strong> y <strong>sistema de premios con podio</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Ticket className="w-4 h-4 text-amber-500" />
                  <span>Sorteos Configurados ({formData.rafflesData?.raffles.length || 0})</span>
                </h4>
              </div>

              {(!formData.rafflesData?.raffles || formData.rafflesData.raffles.length === 0) ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  <Ticket className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">No hay ningún sorteo inicial configurado todavía.</p>
                </div>
              ) : (
                formData.rafflesData.raffles.map((raffle, rIdx) => (
                  <div
                    key={raffle.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                          Sorteo #{rIdx + 1}
                        </span>
                        <h5 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {raffle.title}
                        </h5>
                      </div>
                      <span className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                        {raffle.currency}{raffle.ticketPrice} / boleto
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] text-slate-400 block font-semibold">Total de Boletos</span>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                          {raffle.totalTickets} boletos
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] text-slate-400 block font-semibold">Meta de Recaudación</span>
                        <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                          {raffle.currency}{(raffle.totalTickets * raffle.ticketPrice).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] text-slate-400 block font-semibold">Premios en Juego</span>
                        <span className="font-extrabold text-sm text-amber-600 dark:text-amber-400 font-mono">
                          {raffle.prizes?.length || 0} premios
                        </span>
                      </div>
                    </div>

                    {raffle.prizes && raffle.prizes.length > 0 && (
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Premios Destacados
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {raffle.prizes.map((prz) => (
                            <div
                              key={prz.id}
                              className="flex items-center space-x-2 p-2 rounded-xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-xs"
                            >
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {prz.place}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">{prz.name}</p>
                                {prz.valueEstimated && (
                                  <p className="text-[10px] text-slate-400 font-mono">Valuado en {raffle.currency}{prz.valueEstimated}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Al guardar la sección, tendrás acceso directo en vivo para agregar más sorteos, vender boletos, realizar la tómbola en directo y proclamar ganadores.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: VIGENCIA & TIEMPO DE VENCIMIENTO */}
        {editorSubTab === 'expiration' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-800/60 flex items-start space-x-3.5">
              <div className="p-3 rounded-xl bg-amber-500 text-white shadow-md shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Control de Vigencia & Tiempo de Vencimiento
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Adapta un plazo límite temporal para esta sección. Ideal para campañas especiales de recaudación, votaciones o elecciones con plazo de cierre, anuncios temporales de congresos, eventos o inscripciones con fecha de expiración.
                </p>
              </div>
            </div>

            {/* Master Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ¿Activar Vigencia / Tiempo de Vencimiento?
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                      formData.expiration?.enabled
                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {formData.expiration?.enabled ? 'Vigencia Programada' : 'Sección Permanente'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formData.expiration?.enabled
                    ? 'La sección responderá automáticamente a la fecha y hora límite asignada.'
                    : 'Si está desactivado, la sección permanecerá activa indefinidamente.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
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
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  formData.expiration?.enabled ? 'bg-amber-600' : 'bg-slate-400'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    formData.expiration?.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {formData.expiration?.enabled && (
              <div className="space-y-6 pt-1">
                {/* Fecha de Vencimiento y Atajos */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4 text-amber-500" />
                      <span>Fecha y Hora de Cierre / Vencimiento *</span>
                    </label>
                    {formData.expiration.expiresAt && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60">
                        {formatExpirationDate(formData.expiration.expiresAt)}
                      </span>
                    )}
                  </div>

                  <input
                    type="datetime-local"
                    required
                    value={formData.expiration.expiresAt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiration: {
                          ...prev.expiration!,
                          expiresAt: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-amber-500"
                  />

                  {/* Quick Presets Buttons */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-extrabold text-slate-500 block">
                      Atajos Rápidos de Tiempo de Vencimiento:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '+1 Día (Mañana)', preset: '1day' },
                        { label: '+3 Días', preset: '3days' },
                        { label: '+1 Semana', preset: '1week' },
                        { label: '+2 Semanas', preset: '2weeks' },
                        { label: '+1 Mes', preset: '1month' },
                        { label: 'Fin de Mes Actual', preset: 'end_of_month' },
                      ].map((item) => (
                        <button
                          key={item.preset}
                          type="button"
                          onClick={() => {
                            const presetDate = generatePresetDate(item.preset as any);
                            setFormData((prev) => ({
                              ...prev,
                              expiration: {
                                ...prev.expiration!,
                                expiresAt: presetDate,
                              },
                            }));
                            onShowToast(`Vencimiento configurado a ${item.label}`, 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Acción al Vencer (Behavior) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
                    Acción Automática al Llegar la Fecha de Vencimiento
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {
                        id: 'banner',
                        title: 'Mantener Visible con Aviso',
                        badge: 'Recomendado',
                        desc: 'Mantiene la sección accesible para consulta o lectura pero con una barra destacada indicando que el periodo ha concluido.',
                        icon: AlertTriangle,
                      },
                      {
                        id: 'lock',
                        title: 'Bloquear Acceso con Aviso',
                        badge: 'Votaciones / Elecciones',
                        desc: 'Muestra una pantalla de bloqueo con candado e información de vencimiento impidiendo registrar más votos o envíos.',
                        icon: Lock,
                      },
                      {
                        id: 'hide',
                        title: 'Ocultar Automáticamente',
                        badge: 'Campañas Temporales',
                        desc: 'La sección desaparece automáticamente de la barra de navegación y del acceso para los miembros regulares.',
                        icon: EyeOff,
                      },
                    ].map((act) => {
                      const IconItem = act.icon;
                      const isSelected = (formData.expiration?.expirationAction || 'banner') === act.id;
                      return (
                        <button
                          key={act.id}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              expiration: {
                                ...prev.expiration!,
                                expirationAction: act.id as any,
                              },
                            }))
                          }
                          className={`p-4 rounded-2xl border-2 text-left transition-all relative cursor-pointer ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-amber-400/50 shadow-md'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`p-2 rounded-xl ${
                                isSelected
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}
                            >
                              <IconItem className="w-4 h-4" />
                            </div>
                            {isSelected && (
                              <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black">
                                ✓
                              </span>
                            )}
                          </div>
                          <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {act.title}
                          </h5>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                            {act.badge}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {act.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cronómetro / Contador Regresivo */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Hourglass className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                        Mostrar Cronómetro Regresivo en Vivo
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Muestra los días, horas, minutos y segundos restantes en una barra destacada en la cabecera de la sección.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        expiration: {
                          ...prev.expiration!,
                          showCountdown: !prev.expiration?.showCountdown,
                        },
                      }))
                    }
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                      formData.expiration?.showCountdown !== false ? 'bg-purple-600' : 'bg-slate-400'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        formData.expiration?.showCountdown !== false ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Mensaje Personalizado de Cierre */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider block">
                    Mensaje Personalizado al Concluir la Vigencia (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.expiration?.expiredMessage || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiration: {
                          ...prev.expiration!,
                          expiredMessage: e.target.value,
                        },
                      }))
                    }
                    placeholder="Ej: El plazo para esta sección ha concluido. ¡Agradecemos a todos por su participación y apoyo!"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Este texto se presentará a la congregación en la cinta superior o en la pantalla de aviso cuando venza el periodo.
                  </p>
                </div>

                {/* Publicación Programada Anticipada (Opcional) */}
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Fecha de Inicio Programada (Opcional)
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Si deseas que la sección comience a verse a partir de un día u hora específico en el futuro.
                      </p>
                    </div>
                    {formData.expiration?.startsAt && (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            expiration: {
                              ...prev.expiration!,
                              startsAt: '',
                            },
                          }))
                        }
                        className="text-[11px] font-bold text-rose-500 hover:underline"
                      >
                        Quitar inicio programado
                      </button>
                    )}
                  </div>

                  <input
                    type="datetime-local"
                    value={formData.expiration?.startsAt || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiration: {
                          ...prev.expiration!,
                          startsAt: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* SECTIONS LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <span>Secciones & Pestañas Configurate</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
              {sectionsList.length}
            </span>
          </h3>
          <span className="text-xs text-slate-500">Puedes reordenar, activar o personalizar cada una</span>
        </div>

        {sectionsList.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Plus className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No hay secciones personalizadas creadas</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Todas las secciones han sido eliminadas o enviadas a la papelera. Puedes crear una nueva sección ahora o restaurarla desde la Papelera de Reciclaje.
            </p>
            <button
              type="button"
              id="btn-create-empty-section"
              onClick={() => handleOpenCreate('donations')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow transition-all inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Sección</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sectionsList.map((section, index) => {
              const IconComp = getMinistryIconComponent(section.iconName);
              return (
                <div
                  key={section.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    section.enabled
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  {/* Left: Icon & Info */}
                  <div className="flex items-start sm:items-center space-x-3.5">
                    {/* Order controls */}
                    <div className="flex flex-col space-y-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveOrder(index, 'up')}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>
                      <button
                        type="button"
                        disabled={index === sectionsList.length - 1}
                        onClick={() => handleMoveOrder(index, 'down')}
                        className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                      </button>
                    </div>

                    {/* Icon with Color */}
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                      style={{ backgroundColor: section.color || '#059669' }}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                          {section.name}
                        </h4>
                        {section.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-extrabold">
                            {section.badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono">
                          /{section.slug}
                        </span>
                        {(() => {
                          const expInfo = getSectionExpirationInfo(section);
                          if (!expInfo.hasExpiration) {
                            return (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-semibold flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Permanente</span>
                              </span>
                            );
                          }
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold flex items-center space-x-1 ${expInfo.badgeColorClass}`}
                              title={
                                expInfo.expiresAt
                                  ? `Vence: ${formatExpirationDate(expInfo.expiresAt)} (Acción: ${expInfo.action})`
                                  : undefined
                              }
                            >
                              <Clock className="w-3 h-3" />
                              <span>{expInfo.badgeLabel}</span>
                            </span>
                          );
                        })()}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 max-w-xl">
                        {section.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                        <span>Tipo: <strong className="text-slate-700 dark:text-slate-300">{section.sectionType}</strong></span>
                        <span>•</span>
                        <span>En barra: <strong className={section.showInTopNav ? 'text-emerald-600' : 'text-slate-400'}>{section.showInTopNav ? 'Visible' : 'Oculta'}</strong></span>
                        {section.banner.logoUrl && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Foto/Logo subido ✓</span>
                          </>
                        )}
                        {section.expiration?.enabled && section.expiration.expiresAt && (
                          <>
                            <span>•</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-1">
                              <Clock className="w-3 h-3 inline" />
                              <span>Vence: {formatExpirationDate(section.expiration.expiresAt)}</span>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {onPreviewSection && (
                      <button
                        type="button"
                        onClick={() => onPreviewSection(section.slug)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-xs transition-all flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Sección</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleTopNav(section.id)}
                      title={section.showInTopNav ? 'Ocultar de barra superior' : 'Mostrar en barra superior'}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        section.showInTopNav
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {section.showInTopNav ? 'Barra Sup. ON' : 'Barra Sup. OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(section)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all"
                      title="Editar sección y banner"
                    >
                      <Edit className="w-4 h-4 text-emerald-600" />
                    </button>

                    <button
                      type="button"
                      id={`btn-delete-section-${section.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section);
                      }}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-95 text-rose-600 dark:text-rose-400 transition-all cursor-pointer flex items-center justify-center"
                      title={`Eliminar sección «${section.name}» y enviar a papelera`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de confirmación de eliminación con soporte 100% para iframe y móviles */}
      {sectionToDelete && (
        <div
          id="modal-delete-custom-section"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSectionToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  ¿Eliminar esta sección?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  La sección se removerá del menú y se guardará en la Papelera
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {sectionToDelete.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  /{sectionToDelete.slug}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                {sectionToDelete.description || 'Sin descripción'}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/40">
                <span>Tipo: <strong className="text-slate-700 dark:text-slate-300">{sectionToDelete.sectionType}</strong></span>
                <span>•</span>
                <span>En barra superior: <strong className="text-slate-700 dark:text-slate-300">{sectionToDelete.showInTopNav ? 'Sí' : 'No'}</strong></span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-start space-x-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                Podrás restaurar esta sección en cualquier momento desde la <strong>Papelera de Reciclaje</strong> en el Panel Desarrollador.
              </span>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                id="btn-cancel-delete-section"
                onClick={() => setSectionToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                id="btn-confirm-delete-section"
                onClick={handleConfirmDeleteSection}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs shadow-md shadow-rose-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Enviar a Papelera</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
