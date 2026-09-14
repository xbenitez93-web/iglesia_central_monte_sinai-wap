import React, { useState, useMemo } from 'react';
import {
  X,
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
  Check,
  Database,
  Cloud,
  Eye,
  Info,
} from 'lucide-react';
import { ChurchConfig, CustomRole } from '../../types';
import { getAllAvailableSystemModules, SystemModuleInfo } from '../../lib/rbac';
import {
  ROLE_COLOR_PRESETS,
  ROLE_ICON_OPTIONS,
  SYSTEM_ROLE_CATEGORIES,
} from '../../data/systemRoles';
import { getMinistryIconComponent } from '../../utils/ministryIcons';

interface CustomRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: CustomRole | null;
  config: ChurchConfig;
  onSave: (role: CustomRole) => Promise<void> | void;
  isSaving?: boolean;
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

export const CustomRoleModal: React.FC<CustomRoleModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
  config,
  onSave,
  isSaving = false,
}) => {
  const allModules: SystemModuleInfo[] = useMemo(() => {
    return getAllAvailableSystemModules(config);
  }, [config]);

  // Group modules by category for clean matrix
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
      const cat = groups[mod.category] ? mod.category : 'General';
      groups[cat].push(mod);
    });

    return groups;
  }, [allModules]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CustomRole['category']>('General');
  const [color, setColor] = useState('#4f46e5');
  const [iconName, setIconName] = useState('Shield');
  const [allowedTabs, setAllowedTabs] = useState<string[]>(['dashboard', 'events', 'chat']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize or reset form when modal opens / roleToEdit changes
  React.useEffect(() => {
    if (isOpen) {
      if (roleToEdit) {
        setName(roleToEdit.name || '');
        setDescription(roleToEdit.description || '');
        setCategory(roleToEdit.category || 'General');
        setColor(roleToEdit.color || '#4f46e5');
        setIconName(roleToEdit.iconName || 'Shield');
        setAllowedTabs(roleToEdit.allowedTabs || ['dashboard', 'events', 'chat']);
      } else {
        setName('');
        setDescription('');
        setCategory('Liderazgo');
        setColor('#8b5cf6');
        setIconName('Shield');
        setAllowedTabs(['dashboard', 'directory', 'events', 'chat']);
      }
      setErrorMsg(null);
    }
  }, [isOpen, roleToEdit]);

  if (!isOpen) return null;

  const toggleTab = (tabId: string) => {
    setAllowedTabs((prev) =>
      prev.includes(tabId) ? prev.filter((id) => id !== tabId) : [...prev, tabId]
    );
  };

  const handleSelectAll = () => {
    // Excluir 'developer' por seguridad si no es explícitamente requerido
    const all = allModules.map((m) => m.id);
    setAllowedTabs(all);
  };

  const handleDeselectAll = () => {
    setAllowedTabs(['chat']);
  };

  const handleApplyPreset = (preset: 'basic' | 'admin' | 'ministry' | 'leader') => {
    switch (preset) {
      case 'basic':
        setAllowedTabs(['dashboard', 'events', 'chat']);
        break;
      case 'leader':
        setAllowedTabs(['dashboard', 'directory', 'events', 'chat']);
        break;
      case 'ministry':
        setAllowedTabs(['ministries', 'worship', 'dance', 'women', 'ushers', 'theater', 'chat']);
        break;
      case 'admin':
        setAllowedTabs(['dashboard', 'directory', 'events', 'finances', 'coop', 'ministries', 'settings', 'chat']);
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMsg('El nombre del rol es obligatorio.');
      return;
    }

    if (allowedTabs.length === 0) {
      setErrorMsg('Debes asignar al menos un módulo o sección autorizada para este rol.');
      return;
    }

    const roleData: CustomRole = {
      id: roleToEdit ? roleToEdit.id : `role_${Date.now()}`,
      name: cleanName,
      description: description.trim(),
      category: category || 'General',
      color: color || '#4f46e5',
      iconName: iconName || 'Shield',
      allowedTabs: allowedTabs,
      isSystem: roleToEdit ? Boolean(roleToEdit.isSystem) : false,
      createdAt: roleToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await onSave(roleData);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el rol en Firebase.');
    }
  };

  const SelectedIcon = ICON_MAP[iconName] || Shield;

  return (
    <div
      id="custom-role-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto"
    >
      <div
        id="custom-role-modal-container"
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header con gradiente distintivo */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 transition-colors"
              style={{ backgroundColor: color }}
            >
              <SelectedIcon className="w-6 h-6 text-white drop-shadow" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {roleToEdit ? `Editar Rol: ${roleToEdit.name}` : 'Crear Nuevo Rol de Sistema'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <Cloud className="w-3 h-3" />
                  Firebase DB
                </span>
              </div>
              <p className="text-xs text-purple-200 mt-0.5">
                {roleToEdit
                  ? 'Actualiza los permisos, color distintivo y módulos en Firebase'
                  : 'Define el nombre, permisos y módulos. Se guardará de inmediato en Firebase Firestore'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-medium text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tarjeta de Previsualización en Vivo */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-sm"
                style={{ backgroundColor: color }}
              >
                <SelectedIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {name.trim() || 'Nombre del Rol'}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold border"
                    style={{
                      borderColor: `${color}40`,
                      backgroundColor: `${color}15`,
                      color: color,
                    }}
                  >
                    {category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {description.trim() || 'Sin descripción ingresada aún'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {allowedTabs.length} {allowedTabs.length === 1 ? 'módulo' : 'módulos'} activos
              </span>
            </div>
          </div>

          {/* Nombre y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nombre del Rol *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Secretario(a) General, Tesorero, Pastor Juvenil"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Categoría Eclesial
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-purple-500/20"
              >
                {SYSTEM_ROLE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Descripción y Funciones del Rol
            </label>
            <textarea
              rows={2}
              placeholder="Explica qué funciones cumple este rol y qué tipo de usuarios deben tenerlo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Selector de Color e Ícono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Paleta de Color */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Color Distintivo
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {ROLE_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    title={preset.label}
                    onClick={() => setColor(preset.hex)}
                    className={`w-7 h-7 rounded-xl flex items-center justify-center transition-transform cursor-pointer ${
                      color === preset.hex ? 'scale-120 ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-110 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                  >
                    {color === preset.hex && <Check className="w-4 h-4 text-white drop-shadow" />}
                  </button>
                ))}
                <div className="flex items-center gap-1 ml-auto">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-7 h-7 p-0 rounded-lg border-0 cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-slate-500">{color}</span>
                </div>
              </div>
            </div>

            {/* Selector de Ícono */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Ícono Representativo
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {ROLE_ICON_OPTIONS.map((opt) => {
                  const IconComp = ICON_MAP[opt.id] || Shield;
                  const isSelected = iconName === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.label}
                      onClick={() => setIconName(opt.id)}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Matriz de Módulos & Pestañas Autorizadas */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <div>
                <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  Módulos y Secciones Autorizadas para este Rol
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Los usuarios asignados a este rol tendrán acceso inmediato a los módulos marcados.
                </p>
              </div>

              {/* Botones de presets rápidos */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Seleccionar Todo
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('basic')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Básico (Miembro)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('leader')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Liderazgo
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('admin')}
                  className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950 text-slate-700 dark:text-slate-300 hover:text-purple-700 dark:hover:text-purple-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Administración
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Limpiar
                </button>
              </div>
            </div>

            {/* Checklist agrupado por categoría */}
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {(Object.entries(categorizedModules) as [string, SystemModuleInfo[]][]).map(([catTitle, modules]) => {
                if (modules.length === 0) return null;
                return (
                  <div key={catTitle} className="space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {catTitle}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {modules.map((mod) => {
                        const isChecked = allowedTabs.includes(mod.id);
                        const IconComponent = getMinistryIconComponent(mod.iconName);

                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleTab(mod.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-purple-50/70 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700/60 shadow-xs'
                                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: isChecked ? `${mod.color || '#8b5cf6'}20` : '#e2e8f0',
                                  color: isChecked ? mod.color || '#8b5cf6' : '#64748b',
                                }}
                              >
                                <IconComponent className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {mod.label}
                                </p>
                                {mod.description && (
                                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                    {mod.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by outer div
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-600 pointer-events-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Informativo Firebase */}
          <div className="p-3 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-between text-[11px] text-indigo-700 dark:text-indigo-300">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              Colección Firestore: <code className="font-mono font-bold">customRoles</code>
            </span>
            <span className="font-medium text-[10px] text-indigo-500">
              Sincronización en tiempo real
            </span>
          </div>

          {/* Botones de acción */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Cloud className="w-4 h-4" />
              <span>{isSaving ? 'Guardando en Firebase...' : 'Guardar Rol en Firebase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
