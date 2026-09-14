import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  RotateCcw,
  Users,
  Shield,
  Layers,
  FileText,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react';
import { ChurchConfig, DeletedItem, EcclesiasticalRole, EcclesiasticalRoleCategory, Member } from '../../types';
import {
  DEFAULT_ECCLESIASTICAL_ROLES,
  ECCLESIASTICAL_ROLE_CATEGORIES,
  getEffectiveEcclesiasticalRoles,
} from '../../data/ecclesiasticalRoles';
import { EcclesiasticalRoleModal } from './EcclesiasticalRoleModal';

interface EcclesiasticalRolesManagerProps {
  config: ChurchConfig;
  members: Member[];
  onUpdateConfig: (newConfigOrFn: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onSendToTrash?: (item: DeletedItem) => void;
  onShowToast: (message: string, type: 'success' | 'danger' | 'info') => void;
}

export const EcclesiasticalRolesManager: React.FC<EcclesiasticalRolesManagerProps> = ({
  config,
  members,
  onUpdateConfig,
  onSendToTrash,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<EcclesiasticalRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<EcclesiasticalRole | null>(null);

  // Get active roles list
  const roles = useMemo(() => {
    return getEffectiveEcclesiasticalRoles(config);
  }, [config]);

  // Filter roles
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      const matchesSearch =
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || role.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [roles, searchQuery, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    let totalAssigned = 0;
    const activeRolesCount = roles.length;
    const membersWithRoles = members.filter((m) => m.ministryRoles && m.ministryRoles.length > 0).length;

    roles.forEach((r) => {
      const count = members.filter((m) => m.ministryRoles?.includes(r.name)).length;
      if (count > 0) totalAssigned += 1;
    });

    return { activeRolesCount, totalAssigned, membersWithRoles };
  }, [roles, members]);

  // Handle Save (Create or Edit)
  const handleSaveRole = (newOrUpdatedRole: EcclesiasticalRole) => {
    const isEdit = roles.some((r) => r.id === newOrUpdatedRole.id);

    onUpdateConfig((prev) => {
      const currentList = getEffectiveEcclesiasticalRoles(prev);
      let updatedList: EcclesiasticalRole[];

      if (isEdit) {
        updatedList = currentList.map((r) => (r.id === newOrUpdatedRole.id ? newOrUpdatedRole : r));
      } else {
        updatedList = [...currentList, newOrUpdatedRole];
      }

      return {
        ...prev,
        ecclesiasticalRoles: updatedList,
      };
    });

    onShowToast(
      isEdit
        ? `Cargo "${newOrUpdatedRole.name}" actualizado correctamente.`
        : `Nuevo cargo "${newOrUpdatedRole.name}" registrado con éxito.`,
      'success'
    );
  };

  // Handle Delete
  const confirmDeleteRole = () => {
    if (!roleToDelete) return;

    // Send to trash if handler available
    if (onSendToTrash) {
      onSendToTrash({
        id: roleToDelete.id,
        itemType: 'ecclesiasticalRole' as any,
        title: `Cargo: ${roleToDelete.name}`,
        subtitle: `Categoría: ${roleToDelete.category} - ${roleToDelete.description.substring(0, 60)}...`,
        date: new Date().toISOString(),
        originalData: roleToDelete,
      });
    }

    onUpdateConfig((prev) => {
      const currentList = getEffectiveEcclesiasticalRoles(prev);
      const updatedList = currentList.filter((r) => r.id !== roleToDelete.id);
      return {
        ...prev,
        ecclesiasticalRoles: updatedList,
      };
    });

    onShowToast(`El cargo "${roleToDelete.name}" fue eliminado del catálogo eclesiástico.`, 'info');
    setRoleToDelete(null);
  };

  // Reset to default roles
  const handleResetDefaults = () => {
    if (
      window.confirm(
        '¿Deseas restablecer el catálogo de cargos eclesiásticos a los valores predeterminados de la congregación?'
      )
    ) {
      onUpdateConfig((prev) => ({
        ...prev,
        ecclesiasticalRoles: DEFAULT_ECCLESIASTICAL_ROLES,
      }));
      onShowToast('Cargos eclesiásticos restablecidos a la configuración predeterminada.', 'success');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-purple-950/70 via-indigo-950/60 to-slate-900 border-2 border-purple-500/30 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-start space-x-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 shrink-0">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white">
                Gestión de Cargos & Funciones Eclesiásticas
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 font-extrabold text-[11px]">
                {roles.length} Cargos Activos
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
              Crea, edita y administra los cargos eclesiásticos de la congregación con su desglose de funciones específicas y responsabilidades ministeriales. Estos cargos se sincronizan en tiempo real en la ficha de registro de miembros y en la pestaña Ministerios del Directorio.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white/90 font-bold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Restablecer cargos originales"
          >
            <RotateCcw className="w-3.5 h-3.5 text-purple-300" />
            <span className="hidden sm:inline">Restablecer Originales</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Crear Cargo Eclesiástico</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {stats.activeRolesCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Cargos Eclesiásticos Configurados
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {stats.membersWithRoles}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Servidores con Cargos Asignados
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white leading-none">
              {stats.totalAssigned} / {stats.activeRolesCount}
            </div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Cargos con Miembros Activos
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cargo, funciones o categoría..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            Todas ({roles.length})
          </button>
          {ECCLESIASTICAL_ROLE_CATEGORIES.map((cat) => {
            const count = roles.filter((r) => r.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoles.map((role) => {
          const roleMembers = members.filter((m) => m.ministryRoles?.includes(role.name));
          const catConfig = ECCLESIASTICAL_ROLE_CATEGORIES.find((c) => c.id === role.category);

          return (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Line */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: role.color || '#4f46e5' }}
              />

              <div className="space-y-3 pt-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: role.color || '#4f46e5' }}
                    />
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {role.name}
                    </h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                      catConfig?.badgeBg || 'bg-slate-100 dark:bg-slate-800'
                    } ${catConfig?.badgeText || 'text-slate-700 dark:text-slate-300'}`}
                  >
                    {role.category}
                  </span>
                </div>

                {/* Desglose de Funciones Específicas */}
                <div className="bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                    <FileText className="w-3 h-3 text-emerald-500" />
                    <span>Funciones & Responsabilidades:</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {role.description || 'Sin funciones específicas registradas.'}
                  </p>
                </div>

                {/* Members Assigned */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Servidores Asignados:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono">
                      {roleMembers.length}
                    </span>
                  </div>

                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {roleMembers.length > 0 ? (
                      roleMembers.map((rm) => (
                        <div
                          key={rm.id}
                          className="flex items-center justify-between px-2 py-1 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 text-xs"
                        >
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {rm.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2 shrink-0">{rm.phone || rm.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 italic py-1">
                        Ningún miembro tiene asignado este cargo actualmente.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoleToEdit(role);
                    setIsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Editar Funciones</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleToDelete(role)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                  title="Eliminar cargo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRoles.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron cargos eclesiásticos
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No hay cargos que coincidan con "${searchQuery}".`
              : 'No hay cargos configurados en esta categoría.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setRoleToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-md cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Cargo Eclesiástico</span>
          </button>
        </div>
      )}

      {/* Create / Edit Role Modal */}
      <EcclesiasticalRoleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setRoleToEdit(null);
        }}
        roleToEdit={roleToEdit}
        onSave={handleSaveRole}
        existingRoles={roles}
      />

      {/* Confirm Delete Dialog */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar Cargo Eclesiástico?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {roleToDelete.name}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <p>
                Esta acción eliminará el cargo del catálogo eclesiástico disponible.
              </p>
              {members.filter((m) => m.ministryRoles?.includes(roleToDelete.name)).length > 0 && (
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 font-medium text-xs">
                  ⚠️ Atención: Actualmente hay{' '}
                  <strong>
                    {members.filter((m) => m.ministryRoles?.includes(roleToDelete.name)).length} miembros
                  </strong>{' '}
                  con este cargo asignado en el directorio.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRoleToDelete(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteRole}
                className="px-4.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar Eliminación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
