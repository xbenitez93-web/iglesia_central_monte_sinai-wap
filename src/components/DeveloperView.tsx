import React, { useState } from 'react';
import {
  ChurchConfig,
  DeletedItem,
  DeletedItemType,
  SystemRole,
  UserProfile,
} from '../types';
import { getDefaultAllowedTabsForRole } from '../lib/rbac';
import { saveFirestoreDoc, deleteFirestoreDoc } from '../lib/firebase';
import {
  Terminal,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Users,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Plus,
  KeyRound,
  Lock,
  Eye,
  Check,
  CheckCircle2,
  UserPlus,
  UserX,
  Bell,
  Search,
  Calendar,
  DollarSign,
  Heart,
  PiggyBank,
  Tent,
  Database,
  Activity,
  AlertTriangle,
  AlertOctagon,
  Camera,
  Music,
  Sparkles,
  UserCheck,
  Drama,
  MessageSquare,
  X,
  Info,
  Edit3,
  Pencil,
  Sliders,
  LayoutDashboard,
  HeartHandshake,
  Layers,
  ArrowUpCircle,
  Compass,
} from 'lucide-react';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { UserRolesManager } from './UserRolesManager';
import { SystemRolesManager } from './roles/SystemRolesManager';
import { FirestoreDatabaseExplorer } from './FirestoreDatabaseExplorer';

import { AllModulesManagerView } from './modules/AllModulesManagerView';
import { DashboardCustomizerView } from './DashboardCustomizerView';
import { MinistryManagerView } from './ministries/MinistryManagerView';
import { CustomSectionManagerView } from './sections/CustomSectionManagerView';
import { LockScreenSettingsTab } from './LockScreenSettingsTab';
import { AppUpdatesTab } from './AppUpdatesTab';
import { EcclesiasticalRolesManager } from './roles/EcclesiasticalRolesManager';
import { getEffectiveEcclesiasticalRoles } from '../data/ecclesiasticalRoles';
import { DEFAULT_MINISTRIES, MinistryItem, DEFAULT_CUSTOM_SECTIONS, CustomSectionItem, LockScreenConfig, Member, AppUpdateRelease, CustomRole } from '../types';
import { defaultLockScreenConfig } from '../data/lockScreenPresets';

interface DeveloperViewProps {
  config: ChurchConfig;
  systemUsers: UserProfile[];
  currentUser?: UserProfile;
  deletedItems: DeletedItem[];
  members?: Member[];
  initialSubTab?: 'modules' | 'trash' | 'users' | 'system_roles' | 'ministries' | 'custom_sections' | 'home_customizer' | 'maintenance' | 'system' | 'database' | 'lock_screen' | 'ecclesiastical_roles' | 'app_updates';
  autoOpenCreatorTrigger?: number;
  customRoles?: CustomRole[];
  onUpdateCustomRoles?: (roles: CustomRole[]) => void;
  lockScreenConfig?: LockScreenConfig;
  onUpdateLockScreenConfig?: (updated: LockScreenConfig) => void;
  onTriggerLockNow?: () => void;
  onTriggerTestUpdateModal?: (previewRelease: AppUpdateRelease) => void;
  onRestoreDeletedItem: (item: DeletedItem) => void;
  onPermanentDeleteItem: (itemId: string) => void;
  onEmptyTrash: () => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onUpdateSystemUsers: (users: UserProfile[]) => void;
  onUpdateConfig?: (updated: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetData: () => void;
  stats: {
    membersCount: number;
    familiesCount: number;
    eventsCount: number;
    specialEventsCount: number;
    transactionsCount: number;
    coopAccountsCount: number;
  };
}

export const DeveloperView: React.FC<DeveloperViewProps> = ({
  config,
  systemUsers = [],
  currentUser,
  deletedItems = [],
  members = [],
  customRoles = [],
  onUpdateCustomRoles,
  initialSubTab,
  autoOpenCreatorTrigger,
  onRestoreDeletedItem,
  onPermanentDeleteItem,
  onEmptyTrash,
  onSendToTrash,
  onUpdateSystemUsers,
  onUpdateConfig,
  onExportData,
  onImportData,
  onResetData,
  stats,
  lockScreenConfig,
  onUpdateLockScreenConfig,
  onTriggerLockNow,
  onTriggerTestUpdateModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'modules' | 'trash' | 'users' | 'ministries' | 'custom_sections' | 'home_customizer' | 'maintenance' | 'system' | 'database' | 'lock_screen' | 'ecclesiastical_roles' | 'app_updates'>(initialSubTab || 'modules');
  const [databaseInitialCollection, setDatabaseInitialCollection] = useState<string>('members');
  const [ministriesCreateTrigger, setMinistriesCreateTrigger] = useState<number>(0);
  const [sectionsCreateTrigger, setSectionsCreateTrigger] = useState<number>(0);

  // React to initialSubTab changes from parent
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // React to autoOpenCreatorTrigger from parent
  React.useEffect(() => {
    if (autoOpenCreatorTrigger && autoOpenCreatorTrigger > 0) {
      setActiveSubTab('custom_sections');
      setSectionsCreateTrigger(autoOpenCreatorTrigger);
    }
  }, [autoOpenCreatorTrigger]);

  const handleOpenSectionsCreator = () => {
    setActiveSubTab('custom_sections');
    setSectionsCreateTrigger(Date.now());
  };

  const handleOpenMinistriesCreator = () => {
    setActiveSubTab('ministries');
    setMinistriesCreateTrigger(Date.now());
  };
  const [trashFilter, setTrashFilter] = useState<string>('all');
  const [trashSearch, setTrashSearch] = useState<string>('');

  // Recycle Bin In-App Modal & Toast States
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<DeletedItem | null>(null);
  const [isEmptyTrashConfirmOpen, setIsEmptyTrashConfirmOpen] = useState<boolean>(false);
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<UserProfile | null>(null);
  const [toastNotification, setToastNotification] = useState<{ message: string; type: 'success' | 'danger' | 'info' } | null>(null);

  // User Management State
  const [usersList, setUsersList] = useState<UserProfile[]>(systemUsers);
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isUserPhotoPickerOpen, setIsUserPhotoPickerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isEditUserPhotoPickerOpen, setIsEditUserPhotoPickerOpen] = useState(false);
  const [showPasswordInEdit, setShowPasswordInEdit] = useState(false);

  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: SystemRole;
    avatarUrl: string;
    allowedTabs: string[];
  }>({
    name: '',
    email: '',
    password: '123',
    phone: '',
    role: 'Contador',
    avatarUrl: '',
    allowedTabs: getDefaultAllowedTabsForRole('Contador'),
  });

  // Sync usersList when prop changes
  React.useEffect(() => {
    setUsersList(systemUsers);
  }, [systemUsers]);

  const showToast = (message: any, type: 'success' | 'danger' | 'info' = 'success') => {
    const text = typeof message === 'string' ? message : (message?.message || String(message || ''));
    setToastNotification({ message: text, type });
    setTimeout(() => {
      setToastNotification((prev) => (prev?.message === text ? null : prev));
    }, 4000);
  };

  const handleConfirmPermanentDelete = () => {
    if (!itemToDeletePermanently) return;
    const title = itemToDeletePermanently.title;
    onPermanentDeleteItem(itemToDeletePermanently.id);
    setItemToDeletePermanently(null);
    showToast(`"${title}" fue eliminado definitivamente de la base de datos.`, 'danger');
  };

  const handleConfirmEmptyTrash = () => {
    const count = deletedItems.length;
    onEmptyTrash();
    setIsEmptyTrashConfirmOpen(false);
    showToast(`Se vaciaron ${count} elementos de la papelera permanentemente.`, 'danger');
  };

  const handleConfirmRestore = (item: DeletedItem) => {
    onRestoreDeletedItem(item);
    showToast(`"${item.title}" fue restaurado con éxito al sistema activo.`, 'success');
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDeleteConfirm) return;
    const user = userToDeleteConfirm;
    const updated = usersList.filter((u) => u.id !== user.id);
    setUsersList(updated);
    onUpdateSystemUsers(updated);
    deleteFirestoreDoc('systemUsers', user.id);

    if (onSendToTrash) {
      onSendToTrash({
        id: `del_user_${Date.now()}`,
        originalId: user.id,
        itemType: 'systemUser',
        title: user.name,
        subtitle: `Rol: ${user.role} • ${user.email}`,
        deletedAt: new Date().toLocaleString('es-MX'),
        deletedBy: currentUser?.name || 'Desarrollador',
        payload: user,
      });
    }
    setUserToDeleteConfirm(null);
    showToast(`Usuario "${user.name}" enviado a la Papelera de Reciclaje.`, 'info');
  };

  const allAvailableTabs = [
    { id: 'dashboard', label: 'Inicio' },
    { id: 'directory', label: 'Directorio' },
    { id: 'events', label: 'Agendas y Eventos' },
    { id: 'finances', label: 'Finanzas' },
    { id: 'coop', label: 'Minicooperativa' },
    { id: 'worship', label: 'Alabanza' },
    { id: 'dance', label: 'Danza' },
    { id: 'women', label: 'Damas' },
    { id: 'ushers', label: 'Servidores' },
    { id: 'theater', label: 'Teatro' },
    { id: 'chat', label: 'Grupos & Chat' },
    { id: 'settings', label: 'Configuración' },
    { id: 'developer', label: 'Desarrollador' },
  ];

  // Filtering Recycle Bin
  const filteredTrash = deletedItems.filter((item) => {
    if (!item) return false;
    const rawType = typeof item.itemType === 'object' && item.itemType !== null ? (item.itemType as any).itemType : item.itemType;
    const matchesType = trashFilter === 'all' || rawType === trashFilter;
    const q = (trashSearch || '').toLowerCase();
    const itemTitle = typeof item.title === 'string' ? item.title : (item.title ? String((item.title as any)?.title || '') : '');
    const itemSubtitle = typeof item.subtitle === 'string' ? item.subtitle : (item.subtitle ? String(item.subtitle) : '');
    const matchesSearch =
      itemTitle.toLowerCase().includes(q) ||
      itemSubtitle.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const getItemTypeBadge = (type: any) => {
    const rawType = typeof type === 'object' && type !== null ? (type.itemType || 'other') : type;
    switch (rawType) {
      case 'member':
        return { label: 'Miembros', icon: Users, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'family':
        return { label: 'Familia', icon: Heart, bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'event':
        return { label: 'Evento Agenda', icon: Calendar, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'specialCoopEvent':
        return { label: 'Campamento / Recaudación', icon: Tent, bg: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' };
      case 'financialTransaction':
        return { label: 'Transacción / Diezmo', icon: DollarSign, bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'coopAccount':
        return { label: 'Cuenta Ahorro', icon: PiggyBank, bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'coopTransaction':
        return { label: 'Movimiento Ahorro', icon: DollarSign, bg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
      case 'microLoan':
        return { label: 'Préstamo Parroquial', icon: DollarSign, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'eventRegistration':
        return { label: 'Inscripción Evento', icon: UserCheck, bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'systemUser':
        return { label: 'Usuario Sistema', icon: Shield, bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'worshipSong':
        return { label: 'Canción Alabanza', icon: Music, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'worshipMusician':
        return { label: 'Músico Alabanza', icon: Users, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'worshipRehearsal':
        return { label: 'Ensayo Alabanza', icon: Calendar, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'worshipSchedule':
        return { label: 'Programa Alabanza', icon: Calendar, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'worshipCasting':
        return { label: 'Audición Alabanza', icon: Sparkles, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'danceChoreography':
        return { label: 'Coreografía Danza', icon: Sparkles, bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
      case 'danceDancer':
        return { label: 'Danzora', icon: Users, bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
      case 'danceRehearsal':
        return { label: 'Ensayo Danza', icon: Calendar, bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
      case 'danceWardrobe':
        return { label: 'Vestuario Danza', icon: Sparkles, bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
      case 'danceCasting':
        return { label: 'Audición Danza', icon: Sparkles, bg: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
      case 'womenActivity':
        return { label: 'Actividad Damas', icon: Heart, bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'womenLeader':
        return { label: 'Líder Damas', icon: Users, bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'womenCellGroup':
        return { label: 'Célula Damas', icon: Users, bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'womenPrayerRequest':
        return { label: 'Petición Oración', icon: Heart, bg: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' };
      case 'usherServer':
        return { label: 'Servidor Ujier', icon: UserCheck, bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
      case 'usherDuty':
        return { label: 'Turno Servidores', icon: UserCheck, bg: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
      case 'theaterPlay':
        return { label: 'Obra de Teatro', icon: Drama, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'theaterActor':
        return { label: 'Actor / Elenco', icon: Users, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'theaterRehearsal':
        return { label: 'Ensayo Teatro', icon: Calendar, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'theaterCasting':
        return { label: 'Casting Teatro', icon: Drama, bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      case 'ministryWorkPlan':
        return { label: 'Plan de Trabajo', icon: Database, bg: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' };
      case 'chatGroup':
        return { label: 'Grupo de Chat', icon: MessageSquare, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      case 'ministry':
        return { label: 'Ministerio', icon: Sparkles, bg: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'customSection':
        return { label: 'Sección Personalizada', icon: Database, bg: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'ecclesiasticalRole':
        return { label: 'Cargo Eclesiástico', icon: Layers, bg: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' };
      default:
        return { label: 'Elemento', icon: Database, bg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' };
    }
  };

  const handleToggleTabForUser = (userId: string, tabId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const hasTab = u.allowedTabs.includes(tabId);
        const newTabs = hasTab
          ? u.allowedTabs.filter((t) => t !== tabId)
          : [...u.allowedTabs, tabId];
        return { ...u, allowedTabs: newTabs };
      }
      return u;
    });
    setUsersList(updated);
    onUpdateSystemUsers(updated);
  };

  const handleChangeRole = (userId: string, newRole: SystemRole) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const defaultTabs = getDefaultAllowedTabsForRole(newRole);
        return { ...u, role: newRole, allowedTabs: defaultTabs };
      }
      return u;
    });
    setUsersList(updated);
    onUpdateSystemUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = usersList.find((u) => u.id === userId);
    if (userToDelete) {
      setUserToDeleteConfirm(userToDelete);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      password: newUserForm.password || '123',
      phone: newUserForm.phone,
      role: newUserForm.role,
      allowedTabs: newUserForm.allowedTabs,
      avatarUrl: newUserForm.avatarUrl || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      status: 'approved',
    };

    const nextUsers = [...usersList, newUser];
    setUsersList(nextUsers);
    onUpdateSystemUsers(nextUsers);

    setIsNewUserModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      password: '123',
      phone: '',
      role: 'Contador',
      avatarUrl: '',
      allowedTabs: getDefaultAllowedTabsForRole('Contador'),
    });
  };

  const handleStartEditUser = (user: UserProfile) => {
    setUserToEdit({
      ...user,
      password: user.password || '123',
      allowedTabs: user.allowedTabs && user.allowedTabs.length > 0 ? user.allowedTabs : getDefaultAllowedTabsForRole(user.role),
      status: user.status || 'approved',
    });
    setShowPasswordInEdit(false);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToEdit) return;

    const normalizedUser: UserProfile = {
      ...userToEdit,
      name: userToEdit.name.trim(),
      email: userToEdit.email.trim(),
      password: userToEdit.password?.trim() || '123',
      phone: userToEdit.phone?.trim() || '',
    };

    const nextUsers = usersList.map((u) => (u.id === normalizedUser.id ? normalizedUser : u));
    setUsersList(nextUsers);
    onUpdateSystemUsers(nextUsers);

    // Synchronize to Firestore directly
    saveFirestoreDoc('systemUsers', normalizedUser.id, normalizedUser);

    showToast(`Usuario "${normalizedUser.name}" actualizado y sincronizado en la base de datos con éxito.`, 'success');
    setUserToEdit(null);
  };

  const handleApproveUser = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        let tabs = u.allowedTabs;
        if (!tabs || tabs.length === 0) {
          tabs = getDefaultAllowedTabsForRole(u.role);
        }
        const approvedUser = { ...u, status: 'approved' as const, allowedTabs: tabs };
        saveFirestoreDoc('systemUsers', approvedUser.id, approvedUser);
        return approvedUser;
      }
      return u;
    });
    setUsersList(updated);
    onUpdateSystemUsers(updated);
    showToast(`Usuario aprobado con acceso a sus módulos autorizados.`, 'success');
  };

  const handleRejectUser = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const rejectedUser = { ...u, status: 'rejected' as const, allowedTabs: [] };
        saveFirestoreDoc('systemUsers', rejectedUser.id, rejectedUser);
        return rejectedUser;
      }
      return u;
    });
    setUsersList(updated);
    onUpdateSystemUsers(updated);
    showToast(`Solicitud de usuario rechazada.`, 'info');
  };

  const pendingUsers = usersList.filter((u) => u.status === 'pending');
  const activeUsers = usersList.filter((u) => u.status !== 'pending' && u.status !== 'rejected');

  return (
    <div className="space-y-6">
      {/* Developer Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/80 border border-indigo-400/40 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Terminal className="w-6 h-6 text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Panel de Desarrollador & Control Total
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 font-extrabold text-[11px]">
                ROOT ACCESS
              </span>
            </div>
            <p className="text-xs sm:text-sm text-indigo-200/80 mt-0.5">
              Creador de Secciones y Ministerios, administración global, papelera de reciclaje, usuarios y diagnóstico.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenSectionsCreator}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-md bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white ring-2 ring-purple-300"
          >
            <Sparkles className="w-4 h-4 text-purple-200" />
            <span>✨ Abrir Creador de Secciones</span>
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs font-mono text-indigo-200 flex items-center space-x-2">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>Papelera: {deletedItems.length}</span>
          </div>
        </div>
      </div>

      {/* PROMINENT QUICK LAUNCHER BENTO FOR SECTIONS CREATOR */}
      {activeSubTab !== 'ministries' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900/40 border-2 border-purple-500/40 backdrop-blur-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md shadow-purple-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  Creador de Secciones, Páginas & Ministerios
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                  {config.ministries && config.ministries.length > 0 ? config.ministries.length : DEFAULT_MINISTRIES.length} Secciones
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Crea nuevas secciones para la barra superior, sube logos y fotos desde tu dispositivo/cámara, personaliza banners y agrega sub-pestañas ilimitadas (Drive, Notas, Tareas, Inventario).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenSectionsCreator}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Entrar al Creador de Secciones</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs Selector */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveSubTab('modules')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'modules'
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-300" />
          <span>Gestión y Orden de Módulos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-400/30 text-[10px] font-extrabold text-indigo-200">
            Nuevo
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('trash')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'trash'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Papelera de Reciclaje ({deletedItems.length})</span>
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
          <Shield className="w-4 h-4" />
          <span>Usuarios & Accesos ({usersList.length})</span>
          {pendingUsers.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('system_roles')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'system_roles'
              ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-800 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-purple-300" />
          <span>Roles del Sistema (Firebase DB)</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/30 text-[10px] font-extrabold text-emerald-300">
            {customRoles.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('custom_sections')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'custom_sections'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-emerald-300" />
          <span>Creación de Secciones o Pestañas</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-400/30 text-[10px] font-extrabold text-emerald-200">
            {Array.isArray(config.customSections) ? config.customSections.length : DEFAULT_CUSTOM_SECTIONS.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ministries')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'ministries'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span>Ministerios</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-400/30 text-[10px] font-extrabold text-purple-200">
            {Array.isArray(config.ministries) ? config.ministries.length : DEFAULT_MINISTRIES.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('ecclesiastical_roles')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'ecclesiastical_roles'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-purple-300" />
          <span>Cargos Eclesiásticos</span>
          <span className="px-1.5 py-0.2 rounded-full bg-purple-400/30 text-[10px] font-extrabold text-purple-200">
            {getEffectiveEcclesiasticalRoles(config).length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('home_customizer')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'home_customizer'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-300" />
          <span>Personalizar Inicio</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-400/30 text-[10px] font-extrabold text-amber-200">
            RBAC
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('maintenance')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'maintenance'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Respaldo & Mantenimiento</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('system')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'system'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Diagnóstico del Sistema</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'database'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Base de Datos</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('lock_screen')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'lock_screen'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4 text-purple-300" />
          <span>Bloqueo & Salvapantallas</span>
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('app_updates')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 cursor-pointer ${
            activeSubTab === 'app_updates'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 text-cyan-300" />
          <span>Actualizaciones & Dispositivos</span>
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </button>
      </div>

      {/* SUBTAB 0: GESTIÓN Y ORDEN DE MÓDULOS */}
      {activeSubTab === 'modules' && (
        <AllModulesManagerView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onShowToast={(msg, type) => {
            setToastNotification({
              message: msg,
              type: type === 'danger' ? 'danger' : type === 'info' ? 'info' : 'success',
            });
          }}
        />
      )}

      {/* SUBTAB 1: PAPELERA DE RECICLAJE (RECYCLE BIN) */}
      {activeSubTab === 'trash' && (
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 dark:border-slate-800/60 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-purple-600" />
                  Papelera de Reciclaje del Sistema
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Cualquier elemento eliminado en miembros, familias, eventos, campamentos o finanzas se almacena aquí. Puedes recuperarlo al instante o destruirlo definitivamente.
                </p>
              </div>

              {deletedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsEmptyTrashConfirmOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Vaciar Papelera ({deletedItems.length})</span>
                </button>
              )}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={trashSearch}
                  onChange={(e) => setTrashSearch(e.target.value)}
                  placeholder="Buscar en la papelera por nombre o detalle..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white"
                />
              </div>

              <select
                value={trashFilter}
                onChange={(e) => setTrashFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="all">Todos los Tipos ({deletedItems.length})</option>
                <option value="member">Miembros / Feligreses</option>
                <option value="family">Familias</option>
                <option value="event">Eventos de Agenda</option>
                <option value="specialCoopEvent">Campamentos / Recaudación</option>
                <option value="financialTransaction">Finanzas / Diezmos</option>
                <option value="coopAccount">Cuentas Minicooperativa</option>
                <option value="coopTransaction">Movimientos Ahorro</option>
                <option value="microLoan">Préstamos Parroquiales</option>
                <option value="eventRegistration">Inscripciones a Eventos</option>
                <option value="systemUser">Usuarios de Acceso</option>
                <option value="ministry">Ministerios Eclesiales</option>
                <option value="customSection">Secciones Personalizadas</option>
                <option value="worshipSong">Canciones de Alabanza</option>
                <option value="worshipMusician">Músicos de Alabanza</option>
                <option value="worshipRehearsal">Ensayos de Alabanza</option>
                <option value="worshipSchedule">Programas de Alabanza</option>
                <option value="danceChoreography">Coreografías de Danza</option>
                <option value="danceDancer">Danzoras / Integrantes</option>
                <option value="danceRehearsal">Ensayos de Danza</option>
                <option value="danceWardrobe">Vestuarios de Danza</option>
                <option value="womenActivity">Actividades de Damas</option>
                <option value="womenLeader">Líderes de Damas</option>
                <option value="womenCellGroup">Células de Mujeres</option>
                <option value="womenPrayerRequest">Peticiones de Oración</option>
                <option value="usherServer">Servidores y Ujieres</option>
                <option value="usherDuty">Turnos de Servidores</option>
                <option value="theaterPlay">Obras de Teatro</option>
                <option value="theaterActor">Actores y Elenco</option>
                <option value="theaterRehearsal">Ensayos de Teatro</option>
                <option value="theaterCasting">Castings y Audiciones</option>
                <option value="ministryWorkPlan">Planes de Trabajo</option>
                <option value="chatGroup">Grupos de Chat</option>
              </select>
            </div>

            {/* Deleted Items List */}
            {filteredTrash.length > 0 ? (
              <div className="space-y-3 pt-2">
                {filteredTrash.map((item) => {
                  const badge = getItemTypeBadge(item.itemType);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-purple-300 dark:hover:border-purple-800 transition-all"
                    >
                      <div className="flex items-start space-x-3 truncate">
                        <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                          <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {typeof item.title === 'string' ? item.title : (item.title ? String((item.title as any)?.title || 'Elemento') : 'Elemento')}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                              {badge.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {typeof item.subtitle === 'string' ? item.subtitle : 'Sin detalles adicionales'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <span>Eliminado: {typeof item.deletedAt === 'string' ? item.deletedAt : String(item.deletedAt || '')}</span>
                            {item.deletedBy && <span>• Por: {typeof item.deletedBy === 'string' ? item.deletedBy : String(item.deletedBy)}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 w-full md:w-auto justify-end shrink-0">
                        {/* RESTORE BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleConfirmRestore(item)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Restaurar al sistema activo"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Recuperar</span>
                        </button>

                        {/* PERMANENT DELETE BUTTON */}
                        <button
                          type="button"
                          onClick={() => setItemToDeletePermanently(item)}
                          className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900 transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar por completo</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  La Papelera está Limpia
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No hay elementos en la papelera con los filtros actuales. Todo lo que se elimine en la app se guardará aquí.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: USUARIOS Y ROLES (USER MANAGEMENT CON FOTO Y CAMARA) */}
      {activeSubTab === 'users' && (
        <UserRolesManager
          config={config}
          systemUsers={usersList}
          currentUser={currentUser || null}
          customRoles={customRoles}
          onUpdateCustomRoles={onUpdateCustomRoles}
          onUpdateSystemUsers={(updated) => {
            setUsersList(updated);
            onUpdateSystemUsers(updated);
          }}
          onSendToTrash={onSendToTrash}
          isDeveloperView={true}
        />
      )}

      {/* SUBTAB: ROLES DEL SISTEMA (CREACIÓN Y GESTIÓN PERSISTENTE EN FIREBASE) */}
      {activeSubTab === 'system_roles' && (
        <SystemRolesManager
          config={config}
          systemUsers={usersList}
          currentUser={currentUser || null}
          customRoles={customRoles}
          onUpdateCustomRoles={(updated) => {
            if (onUpdateCustomRoles) {
              onUpdateCustomRoles(updated);
            }
          }}
          onSendToTrash={onSendToTrash}
          onShowToast={showToast}
        />
      )}

      {/* SUBTAB 3: RESPALDO Y MANTENIMIENTO */}

      {activeSubTab === 'maintenance' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Database className="w-5 h-5 text-purple-600" />
            Copia de Seguridad, Exportación e Importación
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={onExportData}
              className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-purple-950/20 hover:bg-purple-100/50 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-pointer"
            >
              <Download className="w-6 h-6 text-purple-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Exportar Base de Datos Completa</span>
              <span className="text-[10px] text-slate-500 text-center">Descarga archivo JSON con miembros, finanzas, eventos y papelera</span>
            </button>

            <label className="p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:bg-emerald-100/50 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-pointer">
              <Upload className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Restaurar Copia JSON</span>
              <span className="text-[10px] text-slate-500 text-center">Cargar archivo JSON previamente respaldado</span>
              <input type="file" accept=".json" onChange={onImportData} className="hidden" />
            </label>

            <button
              onClick={onResetData}
              className="p-5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 transition-all flex flex-col items-center justify-center space-y-2.5 cursor-pointer"
            >
              <RefreshCw className="w-6 h-6 text-rose-600" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300">Vaciar Base de Datos</span>
              <span className="text-[10px] text-rose-500 text-center">Dejar sistema 100% limpio para el Desarrollador</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 4: DIAGNÓSTICO DEL SISTEMA */}
      {activeSubTab === 'system' && (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Activity className="w-5 h-5 text-purple-600" />
            Métricas Globales del Sistema & Base de Datos
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="text-slate-500 font-bold">Directorio Feligreses</span>
              <p className="text-2xl font-black text-indigo-700 dark:text-indigo-300 mt-1">{stats.membersCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-slate-500 font-bold">Núcleos Familiares</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{stats.familiesCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-slate-500 font-bold">Eventos de Agenda</span>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">{stats.eventsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800">
              <span className="text-slate-500 font-bold">Campamentos / Recaudación</span>
              <p className="text-2xl font-black text-orange-700 dark:text-orange-300 mt-1">{stats.specialEventsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
              <span className="text-slate-500 font-bold">Transacciones Diezmos</span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{stats.transactionsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
              <span className="text-slate-500 font-bold">Cuentas Minicooperativa</span>
              <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">{stats.coopAccountsCount}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
              <span className="text-slate-500 font-bold">Usuarios de Acceso</span>
              <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">{usersList.length}</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-slate-500 font-bold">Objetos en Papelera</span>
              <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">{deletedItems.length}</p>
            </div>
          </div>

          {/* Quick shortcut to App Updates manager */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('app_updates')}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
            >
              <div className="flex items-center space-x-3 text-left">
                <ArrowUpCircle className="w-6 h-6 text-cyan-300 shrink-0" />
                <div>
                  <span className="font-black text-sm block">Lanzador Remoto de Actualizaciones a Dispositivos</span>
                  <span className="text-xs text-blue-100">
                    Emite avisos de actualización instantáneos a los teléfonos y computadoras con botón de instalación directa.
                  </span>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-white/20 font-bold text-xs shrink-0 ml-2">
                Gestionar ➔
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: CREACIÓN DE SECCIONES O PESTAÑAS (DONACIONES, MEDIOS, RECURSOS, MODULARES) */}
      {activeSubTab === 'custom_sections' && (
        <CustomSectionManagerView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onSendToTrash={onSendToTrash}
          onShowToast={showToast}
          autoOpenCreateTrigger={sectionsCreateTrigger}
        />
      )}

      {/* SUBTAB: GESTIÓN DE MINISTERIOS (CREAR, EDITAR, ELIMINAR Y MODO DE NAVEGACIÓN) */}
      {activeSubTab === 'ministries' && (
        <MinistryManagerView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onSendToTrash={onSendToTrash}
          onShowToast={showToast}
          autoOpenCreateTrigger={ministriesCreateTrigger}
        />
      )}

      {/* SUBTAB: GESTIÓN DE CARGOS ECLESIÁSTICOS & FUNCIONES ESPECÍFICAS */}
      {activeSubTab === 'ecclesiastical_roles' && (
        <EcclesiasticalRolesManager
          config={config}
          members={members}
          onUpdateConfig={onUpdateConfig || (() => {})}
          onSendToTrash={onSendToTrash}
          onShowToast={(msg, type) => showToast(msg, type === 'error' ? 'danger' : 'success')}
        />
      )}

      {/* SUBTAB: PERSONALIZAR INICIO (RBAC DASHBOARD WIDGETS) */}
      {activeSubTab === 'home_customizer' && (
        <DashboardCustomizerView
          config={config}
          onUpdateConfig={onUpdateConfig}
          onShowToast={showToast}
        />
      )}

      {/* SUBTAB 5: BASE DE DATOS FIRESTORE */}
      {activeSubTab === 'database' && (
        <FirestoreDatabaseExplorer
          onShowToast={showToast}
          initialCollection={databaseInitialCollection}
        />
      )}

      {/* SUBTAB: BLOQUEO DE PANTALLA & SALVAPANTALLAS */}
      {activeSubTab === 'lock_screen' && (
        <LockScreenSettingsTab
          config={lockScreenConfig || config.lockScreen || defaultLockScreenConfig}
          churchConfig={config}
          onUpdateConfig={
            onUpdateLockScreenConfig ||
            ((updated) => onUpdateConfig?.((prev) => ({ ...prev, lockScreen: updated })))
          }
          onTriggerLockNow={onTriggerLockNow || (() => {})}
          onShowToast={showToast}
          onNavigateToDatabase={(collection) => {
            if (collection) {
              setDatabaseInitialCollection(collection);
            }
            setActiveSubTab('database');
          }}
        />
      )}

      {/* SUBTAB: ACTUALIZACIONES REMOTAS & DISPOSITIVOS */}
      {activeSubTab === 'app_updates' && (
        <AppUpdatesTab
          config={config}
          currentUser={currentUser}
          onShowToast={showToast}
          onTriggerTestModal={onTriggerTestUpdateModal}
        />
      )}

      {/* MODAL: CREATE USER WITH PHOTO & CAMERA CAPTURE */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                Registrar Nuevo Usuario (Panel Dev)
              </h3>
              <button
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs sm:text-sm">
              {/* Photo Selector with Camera & Upload Support */}
              <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {newUserForm.avatarUrl ? (
                  <img
                    src={newUserForm.avatarUrl}
                    alt="Preview"
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-purple-500/40 shadow-xs"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 font-bold flex items-center justify-center text-xl">
                    <Users className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => setIsUserPhotoPickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Subir o Tomar Foto</span>
                  </button>
                  <p className="text-[10px] text-slate-400 mt-1">Cámara en vivo o archivo del dispositivo</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ing. Daniel Santos"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  placeholder="daniel.santos@montesinai.org"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Contraseña</label>
                  <input
                    type="text"
                    required
                    placeholder="123"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="+52 55 1234-5678"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Rol de Acceso Principal</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => {
                    const r = e.target.value as SystemRole;
                    const tabs = getDefaultAllowedTabsForRole(r);
                    setNewUserForm({ ...newUserForm, role: r, allowedTabs: tabs });
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Desarrollador">Desarrollador (Control Total + Papelera)</option>
                  <option value="Administrador">Administrador (Hasta Configuración)</option>
                  <option value="Contador">Contador (Finanzas & Cooperativa)</option>
                  <option value="Líder">Líder (Directorio & Agendas)</option>
                  <option value="Líder de Jóvenes">Líder de Jóvenes (Directorio, Agendas & Ministerios)</option>
                  <option value="Miembro">Miembro (Vista Básica)</option>
                  <option value="Alabanza">Alabanza (Módulo Alabanza)</option>
                  <option value="Danza">Danza (Módulo Danza)</option>
                  <option value="Damas">Damas (Módulo Damas)</option>
                  <option value="Servidores">Servidores (Módulo Servidores)</option>
                  <option value="Teatro">Teatro (Módulo Teatro)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-medium text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  Crear Usuario Activo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO CAPTURE MODAL FOR NEW USER */}
      <PhotoCaptureModal
        isOpen={isUserPhotoPickerOpen}
        onClose={() => setIsUserPhotoPickerOpen(false)}
        onPhotoSelected={(url) => setNewUserForm({ ...newUserForm, avatarUrl: url })}
        currentPhotoUrl={newUserForm.avatarUrl}
        title="Foto del Usuario"
        subtitle="Sube una imagen o toma una fotografía con tu cámara web"
      />

      {/* EDIT USER COMPLETE MODAL */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Editar Usuario Completo</h3>
                  <p className="text-xs text-purple-200/90 leading-tight">
                    Sincronización instantánea con la base de datos y permisos del sistema
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserToEdit(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEditUser} className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              {/* Photo & Avatar Section */}
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  {userToEdit.avatarUrl ? (
                    <img
                      src={userToEdit.avatarUrl}
                      alt={userToEdit.name}
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xl flex items-center justify-center shadow-md">
                      {userToEdit.name.charAt(0) || 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditUserPhotoPickerOpen(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
                    title="Cambiar fotografía"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Fotografía de Perfil
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Puedes tomarte una foto con la cámara o subir una imagen de tu dispositivo.
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditUserPhotoPickerOpen(true)}
                      className="px-3 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Cambiar Foto</span>
                    </button>
                    {userToEdit.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setUserToEdit({ ...userToEdit, avatarUrl: '' })}
                        className="px-2.5 py-1 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={userToEdit.name}
                    onChange={(e) => setUserToEdit({ ...userToEdit, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={userToEdit.email}
                    onChange={(e) => setUserToEdit({ ...userToEdit, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Password & Phone Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Contraseña / PIN de Acceso *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInEdit(!showPasswordInEdit)}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {showPasswordInEdit ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordInEdit ? 'text' : 'password'}
                      required
                      value={userToEdit.password || ''}
                      onChange={(e) => setUserToEdit({ ...userToEdit, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / Móvil
                  </label>
                  <input
                    type="text"
                    placeholder="+52 55 1234-5678"
                    value={userToEdit.phone || ''}
                    onChange={(e) => setUserToEdit({ ...userToEdit, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              {/* Role & Status Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rol Principal en el Sistema
                  </label>
                  <select
                    value={userToEdit.role}
                    onChange={(e) => {
                      const newRole = e.target.value as SystemRole;
                      const defaultTabs = getDefaultAllowedTabsForRole(newRole);
                      setUserToEdit({ ...userToEdit, role: newRole, allowedTabs: defaultTabs });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50 font-bold text-purple-900 dark:text-purple-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500/20"
                  >
                    <option value="Desarrollador">Desarrollador (Total + Papelera)</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Contador">Contador</option>
                    <option value="Líder de Jóvenes">Líder de Jóvenes</option>
                    <option value="Líder">Líder</option>
                    <option value="Miembro">Miembro</option>
                    <option value="Alabanza">Alabanza</option>
                    <option value="Danza">Danza</option>
                    <option value="Damas">Damas</option>
                    <option value="Servidores">Servidores</option>
                    <option value="Teatro">Teatro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de la Cuenta
                  </label>
                  <select
                    value={userToEdit.status || 'approved'}
                    onChange={(e) => setUserToEdit({ ...userToEdit, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs sm:text-sm"
                  >
                    <option value="approved">Aprobado y Activo</option>
                    <option value="pending">Pendiente de Aprobación</option>
                    <option value="rejected">Rechazado / Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Module Permissions Matrix */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold uppercase text-[11px] text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-600" />
                      Módulos y Pestañas Autorizadas ({userToEdit.allowedTabs?.length || 0}):
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTabs = getDefaultAllowedTabsForRole(userToEdit.role);
                        setUserToEdit({ ...userToEdit, allowedTabs: defaultTabs });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-200 transition-colors cursor-pointer"
                    >
                      Restablecer por Rol
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allTabIds = allAvailableTabs.map((t) => t.id);
                        setUserToEdit({ ...userToEdit, allowedTabs: allTabIds });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserToEdit({ ...userToEdit, allowedTabs: [] })}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {allAvailableTabs.map((tab) => {
                    const isChecked = userToEdit.allowedTabs?.includes(tab.id);
                    return (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => {
                          const currentTabs = userToEdit.allowedTabs || [];
                          const updatedTabs = isChecked
                            ? currentTabs.filter((t) => t !== tab.id)
                            : [...currentTabs, tab.id];
                          setUserToEdit({ ...userToEdit, allowedTabs: updatedTabs });
                        }}
                        className={`p-2.5 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 shadow-2xs'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        {isChecked ? (
                          <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0 ml-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 ml-1" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Sincronizar en Base de Datos</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PHOTO CAPTURE MODAL FOR EDIT USER */}
      {userToEdit && (
        <PhotoCaptureModal
          isOpen={isEditUserPhotoPickerOpen}
          onClose={() => setIsEditUserPhotoPickerOpen(false)}
          onPhotoSelected={(url) => setUserToEdit({ ...userToEdit, avatarUrl: url })}
          currentPhotoUrl={userToEdit.avatarUrl}
          title={`Foto de ${userToEdit.name}`}
          subtitle="Sube una foto desde tu dispositivo o tómate una foto con la cámara"
        />
      )}

      {/* CONFIRMATION MODAL: PERMANENT DELETE SINGLE ITEM */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar definitivamente este elemento?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción no se puede deshacer. El registro se destruirá permanentemente de la base de datos.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>
                  {typeof itemToDeletePermanently.title === 'string'
                    ? itemToDeletePermanently.title
                    : (itemToDeletePermanently.title ? String((itemToDeletePermanently.title as any)?.title || 'Elemento') : 'Elemento')}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700">
                  {typeof itemToDeletePermanently.itemType === 'string'
                    ? itemToDeletePermanently.itemType
                    : (typeof itemToDeletePermanently.itemType === 'object' && itemToDeletePermanently.itemType !== null
                        ? (itemToDeletePermanently.itemType as any).itemType || 'Elemento'
                        : 'Elemento')}
                </span>
              </div>
              {itemToDeletePermanently.subtitle && (
                <div className="text-slate-500 dark:text-slate-400">
                  {typeof itemToDeletePermanently.subtitle === 'string'
                    ? itemToDeletePermanently.subtitle
                    : String(itemToDeletePermanently.subtitle)}
                </div>
              )}
            </div>

            <div className="flex justify-end items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDeletePermanently(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmPermanentDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Definitivamente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: EMPTY ENTIRE RECYCLE BIN */}
      {isEmptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 shrink-0 animate-bounce">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Vaciar por completo la Papelera de Reciclaje?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Esta acción destruirá de forma permanente todos los <span className="font-bold text-rose-600">{deletedItems.length} elementos</span> almacenados en la papelera.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300">
              ⚠️ Ninguno de estos elementos podrá ser recuperado posteriormente.
            </div>

            <div className="flex justify-end items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyTrashConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEmptyTrash}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Vaciar Todo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: SEND USER TO TRASH */}
      {userToDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 shrink-0">
                <UserX className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Enviar usuario a la Papelera?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  El usuario perderá el acceso a la plataforma de inmediato y se almacenará en la Papelera de Reciclaje.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {userToDeleteConfirm.name}
              </div>
              <div className="text-slate-500 dark:text-slate-400">
                {userToDeleteConfirm.email} • Rol: {userToDeleteConfirm.role}
              </div>
            </div>

            <div className="flex justify-end items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Enviar a Papelera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION TOAST */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div
            className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between space-x-3 ${
              toastNotification.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : toastNotification.type === 'danger'
                ? 'bg-rose-900 text-white border-rose-700'
                : 'bg-slate-900 text-white border-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              {toastNotification.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
              {toastNotification.type === 'danger' && <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />}
              {toastNotification.type === 'info' && <Info className="w-5 h-5 text-sky-400 shrink-0" />}
              <span className="text-xs font-semibold">{toastNotification.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
