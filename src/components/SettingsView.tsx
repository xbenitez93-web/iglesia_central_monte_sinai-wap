import React, { useState, useEffect } from 'react';
import { ChurchConfig, TabColorConfig, DeletedItem } from '../types';
import { churchThemes, ThemeDefinition } from '../data/themes';
import { UserRolesManager } from './UserRolesManager';
import {
  Palette,
  Church,
  Save,
  Check,
  Sparkles,
  Sliders,
  Camera,
  Image as ImageIcon,
  Plus,
  Trash2,
  SlidersHorizontal,
  Layers,
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  PiggyBank,
  Settings,
  Terminal,
  MessageSquare,
  Music,
  Heart,
  UserCheck,
  Drama,
  RotateCcw,
  Bell,
  Smartphone,
  Zap,
  Volume2,
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Monitor,
  BookOpen,
  Cloud,
  ShieldAlert,
  UserPlus,
  Shuffle,
} from 'lucide-react';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import {
  getRandomBibleVerseExcluding,
  BIBLE_VERSES,
} from '../data/bibleVerses';
import {
  getStoredGeminiApiKey,
  setStoredGeminiApiKey,
} from '../lib/pastoralAIService';
import {
  getNotificationPermission,
  requestNotificationPermission,
  triggerNativePush,
} from '../lib/pushNotifications';

interface SettingsViewProps {
  config: ChurchConfig;
  onUpdateConfig: (newConfig: ChurchConfig) => void;
  systemUsers?: any[];
  currentUser?: any;
  onUpdateSystemUsers?: (users: any[]) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onResetData?: () => void;
  onOpenQuickGuide?: () => void;
  onOpenSectionsCreator?: () => void;
}


const PRESET_PALETTE_COLORS = [
  { name: 'Índigo', hex: '#4f46e5' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Ámbar', hex: '#d97706' },
  { name: 'Rubí / Rosa', hex: '#e11d48' },
  { name: 'Zafiro', hex: '#0284c7' },
  { name: 'Amatista', hex: '#7c3aed' },
  { name: 'Teal Oceánico', hex: '#0d9488' },
  { name: 'Fucsia Gracia', hex: '#db2777' },
  { name: 'Menta Fresca', hex: '#16a34a' },
  { name: 'Pizarra Slate', hex: '#475569' },
  { name: 'Bronce Tierra', hex: '#b45309' },
  { name: 'Lavanda Monte', hex: '#6366f1' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  systemUsers,
  currentUser,
  onUpdateSystemUsers,
  onSendToTrash,
  onExportData,
  onImportData,
  onResetData,
  onOpenQuickGuide,
  onOpenSectionsCreator,
}) => {

  const [formData, setFormData] = useState<ChurchConfig>({
    ...config,
    customTabColors: config.customTabColors || {
      dashboard: '#4f46e5',
      directory: '#6366f1',
      events: '#d97706',
      finances: '#059669',
      coop: '#ea580c',
      worship: '#7c3aed',
      dance: '#db2777',
      women: '#e11d48',
      ushers: '#0284c7',
      theater: '#9333ea',
      chat: '#2563eb',
      settings: '#4338ca',
      developer: '#6b21a8',
    },
    pushNotificationsEnabled: config.pushNotificationsEnabled ?? true,
    notifyEvents: config.notifyEvents ?? true,
    notifyMeetings: config.notifyMeetings ?? true,
    notifyCoop: config.notifyCoop ?? true,
    notifySound: config.notifySound ?? true,
  });

  useEffect(() => {
    setFormData({
      ...config,
      customTabColors: config.customTabColors || {
        dashboard: '#4f46e5',
        directory: '#6366f1',
        events: '#d97706',
        finances: '#059669',
        coop: '#ea580c',
        worship: '#7c3aed',
        dance: '#db2777',
        women: '#e11d48',
        ushers: '#0284c7',
        theater: '#9333ea',
        chat: '#2563eb',
        settings: '#4338ca',
        developer: '#6b21a8',
      },
      pushNotificationsEnabled: config.pushNotificationsEnabled ?? true,
      notifyEvents: config.notifyEvents ?? true,
      notifyMeetings: config.notifyMeetings ?? true,
      notifyCoop: config.notifyCoop ?? true,
      notifySound: config.notifySound ?? true,
    });
  }, [config]);

  const [activeSubTab, setActiveSubTab] = useState<'themes' | 'tabColors' | 'notifications' | 'churchIdentity' | 'users'>('themes');
  const [newCategory, setNewCategory] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);

  const pendingUsersCount = (systemUsers || []).filter((u) => u.status === 'pending').length;


  useEffect(() => {
    setGeminiApiKey(getStoredGeminiApiKey());
  }, []);

  const handleSaveGeminiKey = () => {
    setStoredGeminiApiKey(geminiApiKey);
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 2500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionState(getNotificationPermission());
    }
  }, []);

  const activeTheme = churchThemes.find((t) => t.id === formData.activeThemeId) || churchThemes[0];

  const handleApplyTheme = (theme: ThemeDefinition) => {
    const updated: ChurchConfig = {
      ...formData,
      activeThemeId: theme.id,
      customTabColors: { ...theme.tabColors },
    };
    setFormData(updated);
    onUpdateConfig(updated);
    showSaveNotification();
  };

  const handleResetAllToTheme = () => {
    const updated: ChurchConfig = {
      ...formData,
      customTabColors: { ...activeTheme.tabColors },
    };
    setFormData(updated);
    onUpdateConfig(updated);
    showSaveNotification();
  };

  const handleResetSingleTabToTheme = (tabKey: keyof TabColorConfig) => {
    const defaultColor = activeTheme.tabColors[tabKey] || '#4f46e5';
    handleUpdateTabColor(tabKey, defaultColor);
  };

  const handleUpdateTabColor = (tabKey: keyof TabColorConfig, colorHex: string) => {
    const updatedColors = {
      ...(formData.customTabColors || {}),
      [tabKey]: colorHex,
    };
    const updated: ChurchConfig = {
      ...formData,
      customTabColors: updatedColors,
    };
    setFormData(updated);
    onUpdateConfig(updated);
    showSaveNotification();
  };

  const handleTogglePushSetting = (key: keyof ChurchConfig, value: boolean) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onUpdateConfig(updated);
    showSaveNotification();
  };

  const handleRequestPushPermission = async () => {
    const perm = await requestNotificationPermission();
    setPermissionState(perm);
    if (perm === 'granted') {
      triggerNativePush(
        '🔔 Notificaciones Push Activadas',
        'Se han configurado las alertas para eventos, reuniones y la cooperativa.'
      );
    }
  };

  const handleTestPushFromSettings = () => {
    triggerNativePush(
      '⛪ Notificación de Prueba',
      'Configuración guardada exitosamente. Las alertas push están operativas en tu dispositivo.'
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    showSaveNotification();
  };

  const showSaveNotification = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (formData.customCategories.includes(newCategory.trim())) return;
    const updated = {
      ...formData,
      customCategories: [...formData.customCategories, newCategory.trim()],
    };
    setFormData(updated);
    onUpdateConfig(updated);
    setNewCategory('');
    showSaveNotification();
  };

  const handleRemoveCategory = (catToRemove: string) => {
    const updated = {
      ...formData,
      customCategories: formData.customCategories.filter((c) => c !== catToRemove),
    };
    setFormData(updated);
    onUpdateConfig(updated);
    showSaveNotification();
  };

  const tabColorList: { key: keyof TabColorConfig; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'dashboard', label: 'Inicio / Dashboard', description: 'Vista general, métricas y resumen de congregación', icon: LayoutDashboard },
    { key: 'directory', label: 'Directorio & Familias', description: 'Fichas pastorales, miembros, células y bautismos', icon: Users },
    { key: 'events', label: 'Agendas & Cultos', description: 'Calendario litúrgico, cultos dominicales y reuniones', icon: Calendar },
    { key: 'finances', label: 'Finanzas & Diezmos', description: 'Control de diezmos, ofrendas, egresos e informes', icon: DollarSign },
    { key: 'coop', label: 'Minicooperativa & Campamentos', description: 'Cuentas de ahorro, préstamos y eventos especiales', icon: PiggyBank },
    { key: 'worship', label: 'Ministerio de Alabanza', description: 'Cancionero, repertorio, músicos y ensayos', icon: Music },
    { key: 'dance', label: 'Ministerio de Danza', description: 'Coreografías, vestuarios y ensayos de danza', icon: Sparkles },
    { key: 'women', label: 'Ministerio de Damas', description: 'Actividades de mujeres, células y peticiones de oración', icon: Heart },
    { key: 'ushers', label: 'Servidores & Ujieres', description: 'Roles de servicio dominical, puertas y logística', icon: UserCheck },
    { key: 'theater', label: 'Ministerio de Teatro', description: 'Obras teatrales bíblicas, libretos y elenco', icon: Drama },
    { key: 'chat', label: 'Grupos Pequeños & Chat', description: 'Canales pastorales, células y comunicación interna', icon: MessageSquare },
    { key: 'settings', label: 'Configuración del Sistema', description: 'Ajustes visuales, identidad eclesiástica y categorías', icon: Settings },
    { key: 'developer', label: 'Desarrollador / Master', description: 'Consola técnica, papelera y auditoría de datos', icon: Terminal },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Configuración & Personalización del Sistema
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestiona los 12 temas litúrgicos, colores por pestaña, notificaciones push e identidad de la iglesia.
          </p>
        </div>

        {isSaved && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>¡Cambios Guardados Exitosamente!</span>
          </div>
        )}
      </div>

      {/* Sub-tabs Selector */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('themes')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'themes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>12 Temas del Sistema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tabColors')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'tabColors'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Colores por Pestaña</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('notifications')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notificaciones Push</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('churchIdentity')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'churchIdentity'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Church className="w-4 h-4" />
          <span>Identidad de la Iglesia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios & Roles</span>
          {pendingUsersCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black animate-pulse">
              {pendingUsersCount}
            </span>
          )}
        </button>
      </div>


      {/* SUBTAB 1: 12 TEMAS DEL SISTEMA & MODO CLARO/OSCURO */}
      {activeSubTab === 'themes' && (
        <div className="space-y-6">
          {/* Real-time Firebase Sync Status Card */}
          <div className="bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-indigo-500/10 border border-teal-200 dark:border-teal-900/60 rounded-3xl p-5 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Cloud className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Sincronización en Tiempo Real con Firebase
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    🟢 Activo 100%
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Cualquier cambio realizado en este u otro dispositivo (logos, fotos de perfil, colores, miembros, diezmos) se sincroniza instantáneamente con la base de datos Firestore.
                </p>
              </div>
            </div>
          </div>

          {/* Modo Claro / Oscuro al 100% */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sun className="w-5 h-5 text-amber-500" />
                Modo de Visualización (Claro / Oscuro al 100%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Selecciona la apariencia preferida para toda la aplicación. Se activa inmediatamente en todas las vistas y componentes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Opción Modo Claro */}
              <button
                type="button"
                onClick={() => {
                  const updated: ChurchConfig = { ...formData, themeMode: 'light' };
                  setFormData(updated);
                  onUpdateConfig(updated);
                  showSaveNotification();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  (formData.themeMode || 'light') === 'light'
                    ? 'border-amber-500 bg-amber-50/70 dark:bg-slate-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  {(formData.themeMode || 'light') === 'light' && (
                    <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Claro</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Luminosidad alta, colores frescos y fondos limpios para el día.
                  </p>
                </div>
              </button>

              {/* Opción Modo Oscuro */}
              <button
                type="button"
                onClick={() => {
                  const updated: ChurchConfig = { ...formData, themeMode: 'dark' };
                  setFormData(updated);
                  onUpdateConfig(updated);
                  showSaveNotification();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  formData.themeMode === 'dark'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-slate-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
                    <Moon className="w-5 h-5" />
                  </div>
                  {formData.themeMode === 'dark' && (
                    <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Modo Oscuro</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Pizarra profunda, alto contraste de texto y descanso visual.
                  </p>
                </div>
              </button>

              {/* Opción Modo Sistema */}
              <button
                type="button"
                onClick={() => {
                  const updated: ChurchConfig = { ...formData, themeMode: 'system' };
                  setFormData(updated);
                  onUpdateConfig(updated);
                  showSaveNotification();
                }}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                  formData.themeMode === 'system'
                    ? 'border-blue-600 bg-blue-50/70 dark:bg-slate-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  {formData.themeMode === 'system' && (
                    <span className="text-[11px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Automático / Sistema</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Se adapta automáticamente a la configuración de tu teléfono o PC.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Guía Rápida & Tutorial del Sistema */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Guía Rápida & Tutorial de Uso del Sistema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Facilita la familiarización de los pastores, líderes y servidores con todas las funciones.
                </p>
              </div>

              {onOpenQuickGuide && (
                <button
                  type="button"
                  onClick={onOpenQuickGuide}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Abrir Guía Tutorial Ahora</span>
                </button>
              )}
            </div>

            <label className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.showQuickGuideOnStartup ?? false}
                onChange={(e) => {
                  const updated: ChurchConfig = {
                    ...formData,
                    showQuickGuideOnStartup: e.target.checked,
                  };
                  setFormData(updated);
                  onUpdateConfig(updated);
                  showSaveNotification();
                }}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Abrir la guía rápida cuando se inicie la app
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  Muestra el tutorial interactivo automáticamente al abrir la aplicación en el dispositivo.
                </span>
              </div>
            </label>
          </div>

          {/* Catálogo de 12 Temas */}
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-600" />
                Catálogo de 12 Temas Litúrgicos & Eclesiásticos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Haz clic en cualquier tema para aplicarlo al instante a toda la aplicación con su paleta de colores armónica.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {churchThemes.map((theme) => {
                const isActive = formData.activeThemeId === theme.id;

                return (
                  <div
                    key={theme.id}
                    onClick={() => handleApplyTheme(theme)}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden group shadow-xs hover:shadow-lg ${
                      isActive
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 ring-2 ring-indigo-500/30'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    {/* Theme visual banner */}
                    <div
                      className={`h-16 rounded-2xl bg-gradient-to-r ${theme.previewBg} p-3 flex items-center justify-between text-white shadow-inner mb-3.5`}
                    >
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                          {theme.category}
                        </span>
                        <h4 className="font-black text-sm drop-shadow-xs">{theme.name}</h4>
                      </div>
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white/60 shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {theme.description}
                    </p>

                    {/* Tab Colors Preview Dots */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        {Object.values(theme.tabColors).map((color, idx) => (
                          <div
                            key={idx}
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>

                      {isActive ? (
                        <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Activo
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">
                          Aplicar →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: AJUSTES DE COLOR POR PESTAÑA */}
      {activeSubTab === 'tabColors' && (
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  Personalización Individual de Color por Pestaña (13 Módulos)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Modifica libremente el color distintivo de cada pestaña o restaura a los valores del tema activo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAllToTheme}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                <span>Restablecer Todo al Tema ({activeTheme.name})</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tabColorList.map((tab) => {
                const IconComponent = tab.icon;
                const currentColor =
                  formData.customTabColors?.[tab.key] || activeTheme.tabColors[tab.key] || '#4f46e5';

                return (
                  <div
                    key={tab.key}
                    className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                          style={{ backgroundColor: currentColor }}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {tab.label}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {tab.description}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleResetSingleTabToTheme(tab.key)}
                        title="Restablecer color por defecto del tema"
                        className="text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 font-semibold cursor-pointer"
                      >
                        Restaurar
                      </button>
                    </div>

                    {/* Palette Selector */}
                    <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
                      {PRESET_PALETTE_COLORS.map((pColor) => (
                        <button
                          key={pColor.hex}
                          type="button"
                          onClick={() => handleUpdateTabColor(tab.key, pColor.hex)}
                          title={pColor.name}
                          className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer shrink-0 ${
                            (currentColor || '').toLowerCase() === (pColor.hex || '').toLowerCase()
                              ? 'border-indigo-600 scale-125 shadow-md ring-2 ring-indigo-500/30'
                              : 'border-white dark:border-slate-800 hover:scale-110'
                          }`}
                          style={{ backgroundColor: pColor.hex }}
                        />
                      ))}

                      {/* Custom Color Input */}
                      <label
                        className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:border-indigo-500 shrink-0 relative"
                        title="Elegir color personalizado"
                      >
                        <input
                          type="color"
                          value={currentColor}
                          onChange={(e) => handleUpdateTabColor(tab.key, e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-slate-400">+</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: NOTIFICACIONES PUSH */}
      {activeSubTab === 'notifications' && (
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-600" />
                  Sistema de Notificaciones Push & Alertas Eclesiásticas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configura las alertas automáticas para cultos, eventos especiales, reuniones de ministerios y cooperativa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {permissionState !== 'granted' ? (
                  <button
                    type="button"
                    onClick={handleRequestPushPermission}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Habilitar en este Dispositivo</span>
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Push Habilitado</span>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleTestPushFromSettings}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>{testSent ? '¡Notificación Emitida!' : 'Probar Notificación'}</span>
                </button>
              </div>
            </div>

            {/* Notification Channels Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Events & Services Channel */}
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-amber-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Anuncios de Eventos & Cultos
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Notificaciones de cultos dominicales, vigilias, santas cenas y campamentos anuales.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyEvents ?? true}
                  onChange={(e) => handleTogglePushSetting('notifyEvents', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-md cursor-pointer mt-1"
                />
              </div>

              {/* Meetings & Rehearsals Channel */}
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Music className="w-5 h-5 text-indigo-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Recordatorios de Reuniones & Ensayos
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Alertas para ensayos de alabanza, danza, roles de servidores y reuniones de damas.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyMeetings ?? true}
                  onChange={(e) => handleTogglePushSetting('notifyMeetings', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-md cursor-pointer mt-1"
                />
              </div>

              {/* Minicooperative Channel */}
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <PiggyBank className="w-5 h-5 text-emerald-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Actualizaciones de la Minicooperativa
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Avisos sobre cuotas de campamentos, aportes de ahorro y microcréditos aprobados.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifyCoop ?? true}
                  onChange={(e) => handleTogglePushSetting('notifyCoop', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-md cursor-pointer mt-1"
                />
              </div>

              {/* Sound & Alert Ping */}
              <div className="p-5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-purple-500" />
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      Sonido & Vibración de Notificación
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Reproduce un tono discreto al recibir nuevos avisos y recordatorios eclesiales.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.notifySound ?? true}
                  onChange={(e) => handleTogglePushSetting('notifySound', e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-md cursor-pointer mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: IDENTIDAD DE LA IGLESIA */}
      {activeSubTab === 'churchIdentity' && (
        <form onSubmit={handleSaveAll} className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Church className="w-5 h-5 text-indigo-600" />
                Datos & Parámetros Eclesiásticos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nombre de la congregación, versículo lema, pastor principal y logotipo oficial.
              </p>
            </div>

            {/* Logo Upload Section */}
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              {formData.logoUrl ? (
                <img
                  src={formData.logoUrl}
                  alt="Logo"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold text-xl border border-indigo-200">
                  ⛪
                </div>
              )}
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                  Insignia Oficial de la Iglesia
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aparece en los membretes, reportes financieros y barra de navegación.
                </p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsLogoModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer hover:bg-indigo-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Cambiar Logotipo</span>
                  </button>
                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...formData, logoUrl: undefined };
                        setFormData(updated);
                        onUpdateConfig(updated);
                        setIsSaved(true);
                        setTimeout(() => setIsSaved(false), 3000);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600 font-bold text-xs cursor-pointer hover:bg-rose-100 transition-colors"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre de la Congregación</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Denominación / Cobertura</label>
                <input
                  type="text"
                  value={formData.denomination}
                  onChange={(e) => setFormData({ ...formData, denomination: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Pastor Principal</label>
                <input
                  type="text"
                  value={formData.pastorName}
                  onChange={(e) => setFormData({ ...formData, pastorName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Lema / Slogan</label>
                <input
                  type="text"
                  value={formData.slogan}
                  onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-2 space-y-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-semibold text-slate-900 dark:text-slate-100">
                      Versículo Bíblico & Lema del Sistema
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aparece en la franja superior de bienvenida de la iglesia.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const random = getRandomBibleVerseExcluding(formData.verse);
                      setFormData({ ...formData, verse: random });
                    }}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 shadow-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-all cursor-pointer"
                    title="Seleccionar al azar un versículo de la Biblia"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Elegir versículo al azar</span>
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.verse}
                  onChange={(e) => setFormData({ ...formData, verse: e.target.value })}
                  placeholder="Ej. «Todo lo puedo en Cristo que me fortalece.» — Filipenses 4:13"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 italic text-sm shadow-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                />

                {/* Selector de Modo de Versículo */}
                <div className="pt-2 border-t border-indigo-100/60 dark:border-indigo-900/30">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Comportamiento al ingresar al sistema:
                  </span>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <label
                      className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.verseMode !== 'fixed'
                          ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                          : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verseMode"
                        checked={formData.verseMode !== 'fixed'}
                        onChange={() => setFormData({ ...formData, verseMode: 'random' })}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1">
                          <span>🎲 Versículos Aleatorios</span>
                          <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          Muestra automáticamente una promesa bíblica aleatoria diferente cada vez que se ingresa al sistema.
                        </p>
                      </div>
                    </label>

                    <label
                      className={`flex items-start space-x-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.verseMode === 'fixed'
                          ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xs ring-1 ring-indigo-500/30'
                          : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="verseMode"
                        checked={formData.verseMode === 'fixed'}
                        onChange={() => setFormData({ ...formData, verseMode: 'fixed' })}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          📌 Versículo Lema Fijo
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                          Muestra de manera fija y permanente el versículo redactado en el campo superior.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp Pastoral</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Dirección del Templo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Símbolo de Moneda</label>
                <input
                  type="text"
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="enableCoop"
                  checked={formData.enableCoopModule}
                  onChange={(e) => setFormData({ ...formData, enableCoopModule: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded-sm cursor-pointer"
                />
                <label htmlFor="enableCoop" className="font-semibold text-xs cursor-pointer select-none">
                  Habilitar Módulo Minicooperativa & Campamentos
                </label>
              </div>
            </div>

            {/* Custom Budget Categories */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="block font-bold text-xs uppercase text-slate-400">
                Categorías de Presupuesto e Ingresos / Egresos
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Nueva categoría de diezmos, ofrendas o gastos..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {formData.customCategories.map((cat) => (
                  <span
                    key={cat}
                    className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-medium flex items-center space-x-1.5"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Gemini AI & Offline/Compiled Apps Configuration */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-bold text-xs uppercase text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Inteligencia Artificial Pastoral (Google Gemini AI)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Utilizada por el Asistente Pastoral para generar sermones, bosquejos litúrgicos, anuncios y análisis financiero.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
                <div className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>En el servidor web:</strong> Funciona automáticamente con la clave de entorno. <br />
                    <strong>En APK Android / Desktop (.exe):</strong> Si distribuyes la aplicación de forma independiente o sin conexión al servidor, puedes configurar aquí tu clave API gratuita de Google AI Studio:
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Clave API de Gemini (AIzaSy...)"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                  >
                    {geminiKeySaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-200" />
                        <span>¡Guardado!</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar Clave Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* CREADOR DE SECCIONES & MINISTERIOS LINK CARD */}
            {onOpenSectionsCreator && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900/30 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        Creador de Secciones, Páginas & Ministerios
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Agrega nuevas secciones en la barra superior al mismo nivel de Directorio y Finanzas, personaliza banners, sube fotos/logos desde el dispositivo y añade sub-pestañas.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenSectionsCreator}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center space-x-2 shrink-0 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Abrir Creador de Secciones</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Identidad de la Iglesia</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* SUBTAB 5: GESTIÓN DE USUARIOS, ROLES & MÓDULOS */}
      {activeSubTab === 'users' && (
        <UserRolesManager
          config={formData}
          systemUsers={systemUsers || []}
          currentUser={currentUser || null}
          onUpdateSystemUsers={onUpdateSystemUsers || (() => {})}
          onSendToTrash={onSendToTrash}
        />
      )}

      {/* PHOTO CAPTURE MODAL FOR CHURCH LOGO */}

      <PhotoCaptureModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        onPhotoSelected={(url) => {
          const updated = { ...formData, logoUrl: url };
          setFormData(updated);
          onUpdateConfig(updated);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 3000);
        }}
        currentPhotoUrl={formData.logoUrl}
        title="Logotipo de la Iglesia"
        subtitle="Sube la insignia oficial de la congregación o toma una fotografía"
      />
    </div>
  );
};
