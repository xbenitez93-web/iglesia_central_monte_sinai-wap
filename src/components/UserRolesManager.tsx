import React, { useState, useMemo } from 'react';
import {
  ChurchConfig,
  SystemRole,
  CustomRole,
  UserProfile,
  DeletedItem,
} from '../types';
import {
  getAllAvailableSystemModules,
  getDefaultAllowedTabsForRole,
  SystemModuleInfo,
} from '../lib/rbac';
import { getAllEffectiveRoles } from '../data/systemRoles';
import { CustomRoleModal } from './roles/CustomRoleModal';
import { getMinistryIconComponent } from '../utils/ministryIcons';
import {
  Shield,
  UserPlus,
  Bell,
  CheckCircle2,
  Edit3,
  UserX,
  Trash2,
  Eye,
  KeyRound,
  Camera,
  X,
  Check,
  Search,
  Users,
  ShieldCheck,
  Layers,
  Sparkles,
  Lock,
  Mail,
  Phone,
  Filter,
  User,
  AlertCircle,
  CheckCircle,
  Cloud,
} from 'lucide-react';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { saveFirestoreDoc, deleteFirestoreDoc } from '../lib/firebase';

interface UserRolesManagerProps {
  config: ChurchConfig;
  systemUsers: UserProfile[];
  currentUser: UserProfile | null;
  customRoles?: CustomRole[];
  onUpdateCustomRoles?: (roles: CustomRole[]) => void;
  onUpdateSystemUsers: (users: UserProfile[]) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  isDeveloperView?: boolean;
}

export const UserRolesManager: React.FC<UserRolesManagerProps> = ({
  config,
  systemUsers,
  currentUser,
  customRoles = [],
  onUpdateCustomRoles,
  onUpdateSystemUsers,
  onSendToTrash,
  isDeveloperView = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Dynamic system modules
  const allModules: SystemModuleInfo[] = useMemo(() => {
    return getAllAvailableSystemModules(config);
  }, [config]);

  // Dynamic effective roles (Native + Custom Roles from Firebase)
  const effectiveRoles = useMemo(() => {
    return getAllEffectiveRoles(customRoles);
  }, [customRoles]);

  const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
  const [isSavingCustomRole, setIsSavingCustomRole] = useState(false);

  const handleSaveCustomRoleFromUserModal = async (roleData: CustomRole) => {
    setIsSavingCustomRole(true);
    try {
      await saveFirestoreDoc('customRoles', roleData.id, roleData);
      const updated = [...customRoles.filter((r) => r.id !== roleData.id), roleData];
      if (onUpdateCustomRoles) {
        onUpdateCustomRoles(updated);
      }
      showToast(`Rol "${roleData.name}" guardado exitosamente en Firebase.`, 'success');
    } catch (err: any) {
      showToast(`Error al guardar rol en Firebase: ${err?.message || err}`, 'error');
    } finally {
      setIsSavingCustomRole(false);
    }
  };

  // Group modules by category for intuitive checklist rendering
  const categorizedModules: Record<string, SystemModuleInfo[]> = useMemo(() => {
    const groups: Record<string, SystemModuleInfo[]> = {
      'General': [],
      'Administración': [],
      'Ministerios': [],
      'Secciones Personalizadas': [],
      'Comunidad': [],
      'Técnico': [],
    };

    allModules.forEach((mod) => {
      if (!groups[mod.category]) {
        groups[mod.category] = [];
      }
      groups[mod.category].push(mod);
    });

    return groups;
  }, [allModules]);


  // Modals state
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  const [isNewUserPhotoPickerOpen, setIsNewUserPhotoPickerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserProfile | null>(null);
  const [isEditUserPhotoPickerOpen, setIsEditUserPhotoPickerOpen] = useState(false);
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<UserProfile | null>(null);
  const [showPasswordInEdit, setShowPasswordInEdit] = useState(false);
  const [showPasswordInNew, setShowPasswordInNew] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: SystemRole;
    avatarUrl: string;
    allowedTabs: string[];
    status: 'approved' | 'pending';
  }>({
    name: '',
    email: '',
    password: '123',
    phone: '',
    role: 'Miembro',
    avatarUrl: '',
    allowedTabs: getDefaultAllowedTabsForRole('Miembro', customRoles),
    status: 'approved',
  });

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((curr) => (curr?.text === text ? null : curr));
    }, 3500);
  };

  // Pending vs Active users
  const pendingUsers = useMemo(() => {
    return systemUsers.filter((u) => u.status === 'pending');
  }, [systemUsers]);

  const activeUsers = useMemo(() => {
    return systemUsers.filter((u) => u.status !== 'pending' && u.status !== 'rejected');
  }, [systemUsers]);

  // Filtered users for main list
  const filteredUsers = useMemo(() => {
    return systemUsers.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || '').includes(searchQuery);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      const userStatus = u.status || 'approved';
      const matchesStatus = statusFilter === 'all' || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [systemUsers, searchQuery, roleFilter, statusFilter]);

  // Handlers
  const handleApproveUser = (userId: string) => {
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        let tabs = u.allowedTabs;
        if (!tabs || tabs.length === 0) {
          tabs = getDefaultAllowedTabsForRole(u.role, customRoles);
        }
        const approvedUser: UserProfile = {
          ...u,
          status: 'approved',
          allowedTabs: tabs,
        };
        saveFirestoreDoc('systemUsers', approvedUser.id, approvedUser);
        return approvedUser;
      }
      return u;
    });
    onUpdateSystemUsers(updated);
    showToast('Usuario aprobado con éxito. Ya tiene acceso a sus módulos autorizados.', 'success');
  };

  const handleRejectUser = (userId: string) => {
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        const rejectedUser: UserProfile = { ...u, status: 'rejected', allowedTabs: [] };
        saveFirestoreDoc('systemUsers', rejectedUser.id, rejectedUser);
        return rejectedUser;
      }
      return u;
    });
    onUpdateSystemUsers(updated);
    showToast('Solicitud de usuario rechazada.', 'info');
  };

  const handleChangeRole = (userId: string, newRole: SystemRole) => {
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        const defaultTabs = getDefaultAllowedTabsForRole(newRole, customRoles);
        const updatedUser: UserProfile = { ...u, role: newRole, allowedTabs: defaultTabs };
        saveFirestoreDoc('systemUsers', updatedUser.id, updatedUser);
        return updatedUser;
      }
      return u;
    });
    onUpdateSystemUsers(updated);
    showToast(`Rol de usuario actualizado a "${newRole}".`, 'success');
  };

  const handleToggleTabForUser = (userId: string, tabId: string) => {
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        const currentTabs = u.allowedTabs || [];
        const hasTab = currentTabs.includes(tabId);
        const newTabs = hasTab
          ? currentTabs.filter((t) => t !== tabId)
          : [...currentTabs, tabId];
        const updatedUser: UserProfile = { ...u, allowedTabs: newTabs };
        saveFirestoreDoc('systemUsers', updatedUser.id, updatedUser);
        return updatedUser;
      }
      return u;
    });
    onUpdateSystemUsers(updated);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) {
      showToast('Por favor completa el nombre y el correo electrónico.', 'error');
      return;
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim().toLowerCase(),
      password: newUserForm.password.trim() || '123',
      phone: newUserForm.phone.trim(),
      role: newUserForm.role,
      allowedTabs: newUserForm.allowedTabs,
      avatarUrl: newUserForm.avatarUrl || `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      status: newUserForm.status,
    };

    const nextUsers = [...systemUsers, newUser];
    onUpdateSystemUsers(nextUsers);
    saveFirestoreDoc('systemUsers', newUser.id, newUser);

    setIsNewUserModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      password: '123',
      phone: '',
      role: 'Miembro',
      avatarUrl: '',
      allowedTabs: getDefaultAllowedTabsForRole('Miembro', customRoles),
      status: 'approved',
    });
    showToast(`Usuario "${newUser.name}" creado y sincronizado exitosamente.`, 'success');
  };

  const handleStartEditUser = (user: UserProfile) => {
    setUserToEdit({
      ...user,
      password: user.password || '123',
      allowedTabs: user.allowedTabs && user.allowedTabs.length > 0 ? user.allowedTabs : getDefaultAllowedTabsForRole(user.role, customRoles),
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
      email: userToEdit.email.trim().toLowerCase(),
      password: userToEdit.password?.trim() || '123',
      phone: userToEdit.phone?.trim() || '',
      allowedTabs: userToEdit.allowedTabs || [],
      status: userToEdit.status || 'approved',
    };

    const nextUsers = systemUsers.map((u) => (u.id === normalizedUser.id ? normalizedUser : u));
    onUpdateSystemUsers(nextUsers);
    saveFirestoreDoc('systemUsers', normalizedUser.id, normalizedUser);

    showToast(`Usuario "${normalizedUser.name}" actualizado y permisos sincronizados con éxito.`, 'success');
    setUserToEdit(null);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDeleteConfirm) return;
    const user = userToDeleteConfirm;
    const updated = systemUsers.filter((u) => u.id !== user.id);
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
        deletedBy: currentUser?.name || 'Administrador',
        payload: user,
      });
    }
    setUserToDeleteConfirm(null);
    showToast(`Usuario "${user.name}" enviado a la Papelera de Reciclaje.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center space-x-2.5 text-xs sm:text-sm font-bold animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30'
              : 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Summary */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Gestión de Usuarios, Roles & Módulos Autorizados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aprueba nuevos registros, asigna roles eclesiásticos y activa permisos individuales para módulos principales, ministerios y secciones personalizadas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateRoleModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
              title="Crear un nuevo rol persistente en Firebase Firestore"
            >
              <KeyRound className="w-4 h-4" />
              <span>+ Crear Rol (Firebase)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewUserModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">Total Usuarios</span>
            <p className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-100">{systemUsers.length}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Pendientes</span>
              {pendingUsers.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              )}
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-900 dark:text-amber-100">{pendingUsers.length}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Activos / Aprobados</span>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-100">{activeUsers.length}</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Módulos Dinámicos</span>
            <p className="text-xl sm:text-2xl font-black text-indigo-900 dark:text-indigo-100">{allModules.length}</p>
          </div>
        </div>

        {/* PENDING APPROVAL REQUESTS SECTION */}
        {pendingUsers.length > 0 && (
          <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500 text-white font-bold animate-pulse">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    Solicitudes de Registro Pendientes de Aprobación
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs">
                      {pendingUsers.length} pendientes
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Nuevos usuarios se han registrado. El Administrador o Desarrollador pueden aprobarlos, asignarles su rol y habilitar sus secciones.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {pendingUsers.map((pUser) => (
                <div
                  key={pUser.id}
                  className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                      {pUser.avatarUrl ? (
                        <img
                          src={pUser.avatarUrl}
                          alt={pUser.name}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-500/40 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-base flex items-center justify-center shrink-0">
                          {pUser.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h5 className="font-extrabold text-slate-900 dark:text-white text-sm">
                            {pUser.name}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                            Pendiente
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {pUser.email} {pUser.phone && `• Tel: ${pUser.phone}`}
                        </p>
                        {pUser.requestedRoleInterest && (
                          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">
                            Rol solicitado: <span className="font-bold">{pUser.requestedRoleInterest}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rol a Asignar:</span>
                        <select
                          value={pUser.role}
                          onChange={(e) => handleChangeRole(pUser.id, e.target.value as SystemRole)}
                          className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/80 text-xs font-bold text-purple-900 dark:text-purple-200"
                        >
                          {effectiveRoles.map((r) => (
                            <option key={r.id} value={r.name}>
                              {r.name} {!r.isSystem ? '★ (Firebase)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartEditUser(pUser)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar & Módulos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveUser(pUser.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprobar y Dar Acceso</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectUser(pUser.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs border border-rose-200 dark:border-rose-900 transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Rechazar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuarios por nombre, correo o teléfono..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todos los Roles</option>
              {effectiveRoles.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} {!r.isSystem ? '★' : ''}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              <option value="all">Todos los Estados</option>
              <option value="approved">Aprobados</option>
              <option value="pending">Pendientes</option>
              <option value="rejected">Rechazados</option>
            </select>
          </div>
        </div>

        {/* USER LIST MATRIX */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Lista de Usuarios Registrados ({filteredUsers.length})
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              💡 Haz clic en los módulos de cada usuario para activar/desactivar permisos al instante.
            </span>
          </div>

          {filteredUsers.length > 0 ? (
            <div className="space-y-4">
              {filteredUsers.map((user) => {
                const isCurrentSessionUser = user.id === currentUser?.id;
                const allowedTabs = user.allowedTabs || [];

                return (
                  <div
                    key={user.id}
                    className={`p-5 rounded-3xl border transition-all space-y-4 ${
                      user.status === 'pending'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : user.status === 'rejected'
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-purple-300 dark:hover:border-purple-800'
                    }`}
                  >
                    {/* User Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-purple-500/20 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black text-base flex items-center justify-center shrink-0">
                            {user.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                              {user.name}
                            </h4>
                            {isCurrentSessionUser && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Tu Sesión Actual
                              </span>
                            )}
                            {user.status === 'pending' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Pendiente
                              </span>
                            )}
                            {user.status === 'rejected' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                Rechazado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {user.email} {user.phone && `• Tel: ${user.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Quick Role Selector */}
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Rol:</span>
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value as SystemRole)}
                            className="px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50 text-xs font-bold text-purple-900 dark:text-purple-200 cursor-pointer"
                          >
                            {effectiveRoles.map((r) => (
                              <option key={r.id} value={r.name}>
                                {r.name} {!r.isSystem ? '★' : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEditUser(user)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 hover:bg-purple-200 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold text-xs border border-purple-200 dark:border-purple-800 transition-all flex items-center space-x-1.5 cursor-pointer"
                          title="Editar datos, contraseña, foto y módulos"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Editar Usuario</span>
                        </button>

                        {/* Delete Button */}
                        {!isCurrentSessionUser && (
                          <button
                            type="button"
                            onClick={() => setUserToDeleteConfirm(user)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Enviar usuario a la Papelera"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DYNAMIC MODULE PERMISSION PILLS */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          Páginas & Módulos Habilitados ({allowedTabs.length}):
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Toca para activar/desactivar)
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {allModules.map((mod) => {
                          const Icon = getMinistryIconComponent(mod.iconName);
                          const isEnabled = allowedTabs.includes(mod.id);

                          return (
                            <button
                              type="button"
                              key={mod.id}
                              onClick={() => handleToggleTabForUser(user.id, mod.id)}
                              title={mod.description || mod.label}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                                isEnabled
                                  ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                              }`}
                            >
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: isEnabled ? (mod.color || '#7c3aed') : '#94a3b8',
                                }}
                              />
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[130px]">{mod.shortLabel || mod.label}</span>
                              {mod.isCustomSection && (
                                <span className="text-[9px] px-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold">
                                  Sección
                                </span>
                              )}
                              {mod.isMinistry && (
                                <span className="text-[9px] px-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold">
                                  Min
                                </span>
                              )}
                              {isEnabled ? (
                                <Check className="w-3 h-3 text-purple-600 dark:text-purple-400 stroke-[3] shrink-0" />
                              ) : (
                                <span className="text-slate-300 dark:text-slate-600 text-xs">○</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-850 border border-dashed border-slate-200 dark:border-slate-800 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No se encontraron usuarios con estos filtros
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Intenta buscar con otro término o limpia los filtros de rol y estado.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW USER MODAL */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Registrar Nuevo Usuario</h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Crea una cuenta con contraseña y autoriza módulos y secciones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewUserModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
                <div className="relative">
                  {newUserForm.avatarUrl ? (
                    <img
                      src={newUserForm.avatarUrl}
                      alt="Avatar"
                      className="w-16 h-16 rounded-full object-cover ring-4 ring-purple-500/30 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xl flex items-center justify-center shadow-md">
                      {newUserForm.name ? newUserForm.name.charAt(0) : <User className="w-8 h-8" />}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsNewUserPhotoPickerOpen(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
                    title="Subir foto o tomar con la cámara"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-sm">
                    Fotografía del Usuario
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Toma una foto con tu cámara o selecciona una imagen desde tu dispositivo.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsNewUserPhotoPickerOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 transition-colors cursor-pointer flex items-center space-x-1.5 inline-flex"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Tomar / Subir Fotografía</span>
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newUserForm.name}
                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="correo@ejemplo.com"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700 dark:text-slate-300">
                      Contraseña / PIN *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPasswordInNew(!showPasswordInNew)}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      {showPasswordInNew ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPasswordInNew ? 'text' : 'password'}
                      required
                      value={newUserForm.password}
                      onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500/20"
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
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rol Principal en el Sistema
                  </label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => {
                      const newRole = e.target.value as SystemRole;
                      const defaultTabs = getDefaultAllowedTabsForRole(newRole, customRoles);
                      setNewUserForm({ ...newUserForm, role: newRole, allowedTabs: defaultTabs });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50 font-bold text-purple-900 dark:text-purple-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500/20"
                  >
                    {effectiveRoles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} {!r.isSystem ? '★ (Firebase)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs sm:text-sm"
                  >
                    <option value="approved">Aprobado y Activo Directamente</option>
                    <option value="pending">Pendiente de Aprobación</option>
                  </select>
                </div>
              </div>

              {/* Categorized Module Checklist */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-extrabold uppercase text-[11px] text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    Páginas & Módulos Autorizados ({newUserForm.allowedTabs.length}):
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTabs = getDefaultAllowedTabsForRole(newUserForm.role);
                        setNewUserForm({ ...newUserForm, allowedTabs: defaultTabs });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-200 cursor-pointer"
                    >
                      Por Defecto de Rol
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = allModules.map((m) => m.id);
                        setNewUserForm({ ...newUserForm, allowedTabs: allIds });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewUserForm({ ...newUserForm, allowedTabs: [] })}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 text-[11px] font-semibold cursor-pointer"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                {/* Categorized Checkboxes */}
                <div className="space-y-3 pt-1 max-h-60 overflow-y-auto pr-1">
                  {(Object.entries(categorizedModules) as [string, SystemModuleInfo[]][]).map(([category, modules]) => {
                    if (modules.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md inline-block">
                          {category} ({modules.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {modules.map((mod) => {
                            const isChecked = newUserForm.allowedTabs.includes(mod.id);
                            const Icon = getMinistryIconComponent(mod.iconName);


                            return (
                              <button
                                type="button"
                                key={mod.id}
                                onClick={() => {
                                  const current = newUserForm.allowedTabs;
                                  const updated = isChecked
                                    ? current.filter((t) => t !== mod.id)
                                    : [...current, mod.id];
                                  setNewUserForm({ ...newUserForm, allowedTabs: updated });
                                }}
                                className={`p-2.5 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <Icon className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{mod.label}</span>
                                </div>
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
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar y Crear Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">
                    Editar Usuario: {userToEdit.name}
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Modifica credenciales, rol y autorizaciones de módulos
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
            <form onSubmit={handleSaveEditUser} className="p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
              {/* Avatar Section */}
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
                      {userToEdit.name ? userToEdit.name.charAt(0) : 'U'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditUserPhotoPickerOpen(true)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
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

              {/* Name & Email */}
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Password & Phone */}
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
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-purple-500/20"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Rol Principal en el Sistema
                  </label>
                  <select
                    value={userToEdit.role}
                    onChange={(e) => {
                      const newRole = e.target.value as SystemRole;
                      const defaultTabs = getDefaultAllowedTabsForRole(newRole, customRoles);
                      setUserToEdit({ ...userToEdit, role: newRole, allowedTabs: defaultTabs });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/50 font-bold text-purple-900 dark:text-purple-200 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500/20"
                  >
                    {effectiveRoles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name} {!r.isSystem ? '★ (Firebase)' : ''}
                      </option>
                    ))}
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

              {/* Categorized Modules Checklist */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-extrabold uppercase text-[11px] text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-purple-600" />
                    Módulos & Secciones Autorizadas ({userToEdit.allowedTabs?.length || 0}):
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTabs = getDefaultAllowedTabsForRole(userToEdit.role);
                        setUserToEdit({ ...userToEdit, allowedTabs: defaultTabs });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold hover:bg-purple-200 cursor-pointer"
                    >
                      Restablecer por Rol
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = allModules.map((m) => m.id);
                        setUserToEdit({ ...userToEdit, allowedTabs: allIds });
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserToEdit({ ...userToEdit, allowedTabs: [] })}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-rose-600 text-[11px] font-semibold cursor-pointer"
                    >
                      Ninguno
                    </button>
                  </div>
                </div>

                <div className="space-y-3 pt-1 max-h-60 overflow-y-auto pr-1">
                  {(Object.entries(categorizedModules) as [string, SystemModuleInfo[]][]).map(([category, modules]) => {
                    if (modules.length === 0) return null;
                    return (
                      <div key={category} className="space-y-1.5">
                        <div className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md inline-block">
                          {category} ({modules.length})
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {modules.map((mod) => {
                            const isChecked = userToEdit.allowedTabs?.includes(mod.id);
                            const Icon = getMinistryIconComponent(mod.iconName);

                            return (
                              <button
                                type="button"
                                key={mod.id}
                                onClick={() => {
                                  const current = userToEdit.allowedTabs || [];
                                  const updated = isChecked
                                    ? current.filter((t) => t !== mod.id)
                                    : [...current, mod.id];
                                  setUserToEdit({ ...userToEdit, allowedTabs: updated });
                                }}
                                className={`p-2.5 rounded-xl text-left text-xs font-semibold border flex items-center justify-between transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-800 shadow-2xs'
                                    : 'bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                                }`}
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <Icon className="w-4 h-4 shrink-0" />
                                  <span className="truncate">{mod.label}</span>
                                </div>
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
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUserToEdit(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30 cursor-pointer flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {userToDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Enviar usuario a la Papelera?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                El usuario <span className="font-bold text-slate-800 dark:text-slate-200">{userToDeleteConfirm.name}</span> ({userToDeleteConfirm.email}) será enviado a la Papelera de Reciclaje. Podrás recuperarlo o eliminarlo permanentemente más tarde.
              </p>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Enviar a Papelera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR ROL DIRECTO EN FIREBASE */}
      <CustomRoleModal
        isOpen={isCreateRoleModalOpen}
        onClose={() => setIsCreateRoleModalOpen(false)}
        config={config}
        onSave={handleSaveCustomRoleFromUserModal}
        isSaving={isSavingCustomRole}
      />

      {/* PHOTO CAPTURE MODALS */}
      <PhotoCaptureModal
        isOpen={isNewUserPhotoPickerOpen}
        onClose={() => setIsNewUserPhotoPickerOpen(false)}
        onPhotoSelected={(url) => {
          setNewUserForm((prev) => ({ ...prev, avatarUrl: url }));
          setIsNewUserPhotoPickerOpen(false);
          showToast('Fotografía de usuario cargada con éxito.', 'success');
        }}
        title="Fotografía para Nuevo Usuario"
      />

      <PhotoCaptureModal
        isOpen={isEditUserPhotoPickerOpen}
        onClose={() => setIsEditUserPhotoPickerOpen(false)}
        onPhotoSelected={(url) => {
          if (userToEdit) {
            setUserToEdit({ ...userToEdit, avatarUrl: url });
          }
          setIsEditUserPhotoPickerOpen(false);
          showToast('Fotografía de usuario actualizada.', 'success');
        }}
        title="Actualizar Fotografía de Perfil"
      />
    </div>
  );
};
