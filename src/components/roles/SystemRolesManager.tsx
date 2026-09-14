import React, { useState, useMemo } from 'react';
import {
  Shield,
  KeyRound,
  Plus,
  Search,
  Edit2,
  Trash2,
  Users,
  Star,
  Sparkles,
  UserCheck,
  BookOpen,
  Heart,
  DollarSign,
  Compass,
  Music,
  Award,
  Lock,
  Layers,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Database,
  Filter,
} from 'lucide-react';
import { ChurchConfig, CustomRole, DeletedItem, UserProfile } from '../../types';
import {
  getAllEffectiveRoles,
  SYSTEM_ROLE_CATEGORIES,
  DEFAULT_SYSTEM_ROLES,
} from '../../data/systemRoles';
import { CustomRoleModal } from './CustomRoleModal';
import { saveFirestoreDoc, deleteFirestoreDoc } from '../../lib/firebase';
import { getAllAvailableSystemModules } from '../../lib/rbac';

interface SystemRolesManagerProps {
  config: ChurchConfig;
  systemUsers: UserProfile[];
  currentUser: UserProfile | null;
  customRoles: CustomRole[];
  onUpdateCustomRoles: (roles: CustomRole[]) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onOpenCreateUserWithRole?: (roleName: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Shield,
  KeyRound,
  Users,
  Star,
  Sparkles,
  UserCheck,
  BookOpen,
  Heart,
  DollarSign,
  Compass,
  Music,
  Award,
  Lock,
  Layers,
};

export const SystemRolesManager: React.FC<SystemRolesManagerProps> = ({
  config,
  systemUsers,
  currentUser,
  customRoles,
  onUpdateCustomRoles,
  onSendToTrash,
  onShowToast,
  onOpenCreateUserWithRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<CustomRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Combine native system roles and custom roles from Firebase
  const allRoles = useMemo(() => {
    return getAllEffectiveRoles(customRoles);
  }, [customRoles]);

  // System modules for labels
  const allModulesMap = useMemo(() => {
    const modules = getAllAvailableSystemModules(config);
    const map = new Map<string, string>();
    modules.forEach((m) => {
      map.set(m.id, m.label);
    });
    return map;
  }, [config]);

  // Filtered roles
  const filteredRoles = useMemo(() => {
    return allRoles.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [allRoles, searchQuery, categoryFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = allRoles.length;
    const customCount = customRoles.length;
    const nativeCount = DEFAULT_SYSTEM_ROLES.length;
    const assignedUsers = systemUsers.length;
    return { total, customCount, nativeCount, assignedUsers };
  }, [allRoles, customRoles, systemUsers]);

  // Handle Save Role to Firebase
  const handleSaveRole = async (roleData: CustomRole) => {
    setIsSaving(true);
    try {
      // 1. Guardar en Firebase Firestore (colección 'customRoles')
      await saveFirestoreDoc('customRoles', roleData.id, roleData);

      // 2. Actualizar estado local
      const existsIndex = customRoles.findIndex((r) => r.id === roleData.id);
      let updatedCustomRoles: CustomRole[];
      if (existsIndex >= 0) {
        updatedCustomRoles = customRoles.map((r) => (r.id === roleData.id ? roleData : r));
      } else {
        updatedCustomRoles = [...customRoles, roleData];
      }
      onUpdateCustomRoles(updatedCustomRoles);

      onShowToast(
        existsIndex >= 0
          ? `Rol "${roleData.name}" actualizado con éxito en Firebase Firestore.`
          : `Nuevo rol "${roleData.name}" creado y guardado en Firebase Firestore.`,
        'success'
      );
    } catch (err: any) {
      console.error('Error saving role in Firebase:', err);
      onShowToast(`Error al guardar el rol en Firebase: ${err?.message || err}`, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Confirm Delete Role
  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    const role = roleToDelete;

    // Verificar si es un rol del sistema protegido
    if (role.isSystem && role.name === 'Desarrollador') {
      onShowToast('El rol de Desarrollador es el núcleo maestro del sistema y no puede eliminarse.', 'danger');
      setRoleToDelete(null);
      return;
    }

    try {
      // 1. Eliminar de Firebase Firestore
      await deleteFirestoreDoc('customRoles', role.id);

      // 2. Si hay papelera de reciclaje, enviar copia de seguridad
      if (onSendToTrash) {
        onSendToTrash({
          id: `del_role_${Date.now()}`,
          originalId: role.id,
          itemType: 'customRole',
          title: role.name,
          subtitle: `Categoría: ${role.category} • ${role.allowedTabs?.length || 0} módulos`,
          deletedAt: new Date().toLocaleString('es-MX'),
          deletedBy: currentUser?.name || 'Desarrollador',
          payload: role,
        });
      }

      // 3. Actualizar estado local
      const updated = customRoles.filter((r) => r.id !== role.id);
      onUpdateCustomRoles(updated);

      onShowToast(`Rol "${role.name}" eliminado de Firebase Firestore.`, 'danger');
    } catch (err: any) {
      console.error('Error deleting role from Firebase:', err);
      onShowToast(`Error al eliminar rol de Firebase: ${err?.message || err}`, 'danger');
    } finally {
      setRoleToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior con Métricas y Botón Principal */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-white/10">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-purple-500/30 text-purple-200 border border-purple-400/40">
              <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Base de Datos Firebase Firestore Sincronizada</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <KeyRound className="w-7 h-7 sm:w-8 sm:h-8 text-purple-400" />
              Roles y Permisos del Sistema
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Crea nuevos roles personalizados con asignación modular granular (RBAC). Cada rol creado
              se guarda de forma persistente en la colección <code className="text-purple-300 font-mono font-bold">customRoles</code> de Firebase Firestore y queda disponible de inmediato para asignar a usuarios y registros.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setRoleToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-purple-600/40 hover:shadow-purple-600/60 transition-all flex items-center space-x-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Crear Nuevo Rol (Firebase)</span>
            </button>
          </div>
        </div>

        {/* Métricas rápidas */}
        <div className="relative z-10 mt-6 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-purple-200 font-bold block">Total Roles Activos</span>
            <span className="text-xl sm:text-2xl font-black text-white">{stats.total}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-emerald-300 font-bold block">Roles en Firebase DB</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400">{stats.customCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-blue-200 font-bold block">Roles Nativos</span>
            <span className="text-xl sm:text-2xl font-black text-blue-300">{stats.nativeCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] text-amber-200 font-bold block">Usuarios Asignados</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300">{stats.assignedUsers}</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar rol por nombre o descripción..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-purple-500/20"
          >
            <option value="all">Todas las Categorías ({allRoles.length})</option>
            {SYSTEM_ROLE_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRoles.map((role) => {
          const IconComp = ICON_MAP[role.iconName || 'Shield'] || Shield;
          const assignedUsers = systemUsers.filter(
            (u) => (u.role || '').toLowerCase().trim() === role.name.toLowerCase().trim()
          );
          const isCustom = !role.isSystem || customRoles.some((cr) => cr.id === role.id);

          return (
            <div
              key={role.id}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 dark:border-slate-800/90 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between group"
            >
              {/* Header con Color de Acento */}
              <div>
                <div
                  className="h-2.5 w-full transition-all"
                  style={{ backgroundColor: role.color || '#4f46e5' }}
                />

                <div className="p-5 sm:p-6 space-y-4">
                  {/* Título, Ícono y Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                        style={{ backgroundColor: role.color || '#4f46e5' }}
                      >
                        <IconComp className="w-6 h-6 drop-shadow" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>{role.name}</span>
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                            style={{
                              borderColor: `${role.color || '#4f46e5'}40`,
                              backgroundColor: `${role.color || '#4f46e5'}15`,
                              color: role.color || '#4f46e5',
                            }}
                          >
                            {role.category || 'General'}
                          </span>

                          {isCustom ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Cloud className="w-2.5 h-2.5" />
                              Firebase DB
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Nativo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 min-h-[32px]">
                    {role.description || 'Sin descripción detallada disponible.'}
                  </p>

                  {/* Usuarios asignados */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {assignedUsers.length}{' '}
                        {assignedUsers.length === 1 ? 'usuario asignado' : 'usuarios asignados'}
                      </span>
                    </div>

                    {assignedUsers.length > 0 && (
                      <div className="flex items-center -space-x-2 overflow-hidden">
                        {assignedUsers.slice(0, 3).map((u) => (
                          <div
                            key={u.id}
                            title={u.name}
                            className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-purple-200 dark:bg-purple-800 flex items-center justify-center text-[10px] font-bold overflow-hidden"
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              u.name.charAt(0)
                            )}
                          </div>
                        ))}
                        {assignedUsers.length > 3 && (
                          <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                            +{assignedUsers.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Módulos y Pestañas Autorizadas */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      <span>Módulos Autorizados</span>
                      <span>{role.allowedTabs?.length || 0} activos</span>
                    </div>

                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {(role.allowedTabs || []).map((tabId) => (
                        <span
                          key={tabId}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
                        >
                          {allModulesMap.get(tabId) || tabId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-850/40 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoleToEdit(role);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 text-purple-700 dark:text-purple-300 text-xs font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Permisos</span>
                </button>

                {/* Botón Eliminar solo para roles personalizados creados */}
                {isCustom && role.name !== 'Desarrollador' && (
                  <button
                    type="button"
                    onClick={() => setRoleToDelete(role)}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Eliminar Rol de Firebase"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="text-center py-12 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8 space-y-3">
          <KeyRound className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">No se encontraron roles</h3>
          <p className="text-xs text-slate-500">
            Intenta con otro término de búsqueda o cambia la categoría seleccionada.
          </p>
        </div>
      )}

      {/* Modal para Crear y Editar Roles */}
      <CustomRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRoleToEdit(null);
        }}
        roleToEdit={roleToEdit}
        config={config}
        onSave={handleSaveRole}
        isSaving={isSaving}
      />

      {/* Modal de Confirmación para Eliminar Rol */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  ¿Eliminar este Rol?
                </h3>
                <p className="text-xs text-slate-500">Esta acción se registrará en Firebase</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Estás a punto de eliminar el rol <strong className="text-slate-900 dark:text-white">"{roleToDelete.name}"</strong> de Firebase Firestore.
              {systemUsers.filter((u) => u.role === roleToDelete.name).length > 0 && (
                <span className="block mt-2 font-bold text-amber-600 dark:text-amber-400">
                  Advertencia: Hay {systemUsers.filter((u) => u.role === roleToDelete.name).length} usuario(s) asignado(s) actualmente a este rol.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRole}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Sí, Eliminar Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
