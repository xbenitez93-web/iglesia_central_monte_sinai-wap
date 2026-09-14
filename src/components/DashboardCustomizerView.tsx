import React, { useState } from 'react';
import {
  ChurchConfig,
  DashboardRolePermissions,
  DashboardSectionId,
  SystemRole,
} from '../types';
import {
  ALL_DASHBOARD_SECTIONS,
  ALL_ROLES_LIST,
  DEFAULT_ROLE_DASHBOARD_PERMISSIONS,
  getDashboardPermissionsForRole,
} from '../utils/dashboardPermissions';
import {
  LayoutDashboard,
  Shield,
  DollarSign,
  Users,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Sparkles,
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
  Flame,
  Search,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

interface DashboardCustomizerViewProps {
  config: ChurchConfig;
  onUpdateConfig?: (updated: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onShowToast?: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export const DashboardCustomizerView: React.FC<DashboardCustomizerViewProps> = ({
  config,
  onUpdateConfig,
  onShowToast,
}) => {
  const [selectedRole, setSelectedRole] = useState<SystemRole>('Miembro');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Get current permissions for selected role
  const currentPermissions = getDashboardPermissionsForRole(config, selectedRole);

  const handleToggleSection = (sectionId: DashboardSectionId) => {
    if (!onUpdateConfig) return;

    const newValue = !currentPermissions[sectionId];
    const roleKey = selectedRole;

    onUpdateConfig((prev) => {
      const existingPermissions = prev.dashboardRolePermissions || {};
      const currentRolePerms = existingPermissions[roleKey] || getDashboardPermissionsForRole(prev, roleKey);

      const updated = {
        ...prev,
        dashboardRolePermissions: {
          ...existingPermissions,
          [roleKey]: {
            ...currentRolePerms,
            [sectionId]: newValue,
          },
        },
      };

      return updated;
    });

    if (onShowToast) {
      onShowToast(
        `Sección "${ALL_DASHBOARD_SECTIONS.find((s) => s.id === sectionId)?.shortLabel}" ${
          newValue ? 'activada' : 'ocultada'
        } para el rol ${selectedRole}`,
        'success'
      );
    }
  };

  const handleApplyPreset = (preset: 'all_on' | 'no_finance' | 'spiritual_only' | 'reset') => {
    if (!onUpdateConfig) return;

    let newPerms: DashboardRolePermissions;

    if (preset === 'reset') {
      newPerms = { ...DEFAULT_ROLE_DASHBOARD_PERMISSIONS[selectedRole] };
    } else if (preset === 'all_on') {
      newPerms = {
        heroBanner: true,
        quickShortcuts: true,
        pendingApprovals: true,
        kpiMembers: true,
        kpiEvents: true,
        kpiFinances: true,
        kpiCoop: true,
        nextService: true,
        quickActions: true,
        recentFinances: true,
        ministriesSummary: true,
      };
    } else if (preset === 'no_finance') {
      newPerms = {
        ...currentPermissions,
        quickShortcuts: false,
        kpiFinances: false,
        kpiCoop: false,
        recentFinances: false,
        quickActions: false,
      };
    } else {
      // spiritual only
      newPerms = {
        heroBanner: true,
        quickShortcuts: false,
        pendingApprovals: false,
        kpiMembers: true,
        kpiEvents: true,
        kpiFinances: false,
        kpiCoop: false,
        nextService: true,
        quickActions: false,
        recentFinances: false,
        ministriesSummary: true,
      };
    }

    onUpdateConfig((prev) => ({
      ...prev,
      dashboardRolePermissions: {
        ...(prev.dashboardRolePermissions || {}),
        [selectedRole]: newPerms,
      },
    }));

    if (onShowToast) {
      const presetNames = {
        all_on: 'Activar Todo',
        no_finance: 'Ocultar Datos Financieros',
        spiritual_only: 'Solo Espiritual / Agenda',
        reset: 'Restablecer por Defecto',
      };
      onShowToast(`Plantilla "${presetNames[preset]}" aplicada a ${selectedRole}`, 'info');
    }
  };

  const handleApplyToAllRoles = (sectionId: DashboardSectionId, value: boolean) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const existing = prev.dashboardRolePermissions || {};
      const nextRolePerms: Record<string, Partial<Record<DashboardSectionId, boolean>>> = {};

      ALL_ROLES_LIST.forEach((r) => {
        const rPerms = existing[r] || getDashboardPermissionsForRole(prev, r);
        nextRolePerms[r] = {
          ...rPerms,
          [sectionId]: value,
        };
      });

      return {
        ...prev,
        dashboardRolePermissions: nextRolePerms,
      };
    });

    if (onShowToast) {
      onShowToast(
        `Sección "${ALL_DASHBOARD_SECTIONS.find((s) => s.id === sectionId)?.shortLabel}" ${
          value ? 'activada' : 'desactivada'
        } para TODOS los roles`,
        'success'
      );
    }
  };

  // Filtered sections
  const filteredSections = ALL_DASHBOARD_SECTIONS.filter((sec) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (sec.title || '').toLowerCase().includes(q) ||
      (sec.description || '').toLowerCase().includes(q) ||
      (sec.shortLabel || '').toLowerCase().includes(q);

    const matchesCategory = filterCategory === 'all' || sec.category === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Encabezado y Acciones', 'Métricas y KPIs', 'Tableros y Contenido'];

  const activeCount = Object.values(currentPermissions).filter(Boolean).length;
  const totalCount = ALL_DASHBOARD_SECTIONS.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>CONTROL DE PRIVACIDAD & WIDGETS DE INICIO (RBAC)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Personalizar Pantalla de Inicio por Rol
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Define exactamente qué bloques, métricas financieras, accesos de agenda y resúmenes puede ver cada rol de usuario al entrar a la pantalla de <strong>Inicio</strong>. Oculta datos financieros sensibles a miembros regulares con total precisión.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Simular Vista de {selectedRole}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>1. Selecciona el Rol a Configurar</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Los cambios se guardan y sincronizan automáticamente en Firestore para todos los usuarios con este rol.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Activos en Inicio:
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
              {activeCount} / {totalCount} bloques
            </span>
          </div>
        </div>

        {/* Roles Grid / Pills */}
        <div className="flex flex-wrap gap-2">
          {ALL_ROLES_LIST.map((role) => {
            const isSelected = selectedRole === role;
            const rolePerms = getDashboardPermissionsForRole(config, role);
            const count = Object.values(rolePerms).filter(Boolean).length;
            const isFinancialHidden = !rolePerms.kpiFinances && !rolePerms.recentFinances;

            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30 scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{role}</span>
                {isFinancialHidden && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] ${
                      isSelected
                        ? 'bg-indigo-700 text-indigo-200'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}
                    title="Datos financieros ocultos para este rol"
                  >
                    🔒 Sin Finanzas
                  </span>
                )}
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-800/80 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {count}/{totalCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Quick Actions for Selected Role */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Plantillas Rápidas para Rol: <span className="text-indigo-600 dark:text-indigo-400">{selectedRole}</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Aplica configuraciones estándar con un solo clic.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleApplyPreset('all_on')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Activar Todo</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('no_finance')}
              className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Ocultar Datos Financieros</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('spiritual_only')}
              className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Solo Espiritual / Cultos</span>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('reset')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Recomendado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar bloque de inicio..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'all' ? 'Todos los Bloques' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* List of Dashboard Blocks with Live Toggles */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const isEnabled = Boolean(currentPermissions[section.id]);

          return (
            <div
              key={section.id}
              className={`p-5 rounded-3xl border transition-all ${
                isEnabled
                  ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/60 shadow-md'
                  : 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Section Info */}
                <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      isEnabled
                        ? section.isFinancial
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                          : 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    {section.isFinancial ? (
                      <DollarSign className="w-5 h-5" />
                    ) : section.category === 'Encabezado y Acciones' ? (
                      <LayoutDashboard className="w-5 h-5" />
                    ) : section.category === 'Métricas y KPIs' ? (
                      <Layers className="w-5 h-5" />
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {section.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {section.category}
                      </span>
                      {section.isFinancial && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Dato Financiero Privado</span>
                        </span>
                      )}
                      {section.isAdministrative && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Administración
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {section.description}
                    </p>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                      Recomendación: {section.defaultRecommendation}
                    </p>
                  </div>
                </div>

                {/* Right Side: Toggle Switch & Batch Action */}
                <div className="flex items-center space-x-3 shrink-0 self-end md:self-auto">
                  {/* Master Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleSection(section.id)}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-sm ${
                      isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isEnabled ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Visible para {selectedRole}</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 text-slate-400" />
                        <span>Oculto para {selectedRole}</span>
                      </>
                    )}
                  </button>

                  {/* Apply to All Roles Quick Dropdown */}
                  <div className="hidden sm:flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleApplyToAllRoles(section.id, true)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-500 hover:text-emerald-600 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Activar este bloque en TODOS los roles"
                    >
                      Todos Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyToAllRoles(section.id, false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 text-[10px] font-bold transition-colors cursor-pointer"
                      title="Ocultar este bloque en TODOS los roles"
                    >
                      Todos No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* LIVE SIMULATOR MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Simulación de Pantalla de Inicio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Así es exactamente como verá la pantalla un usuario con rol: <strong>{selectedRole}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                Resumen de visibilidad: <strong>{activeCount}</strong> secciones habilitadas y <strong>{totalCount - activeCount}</strong> secciones ocultas para <strong>{selectedRole}</strong>.
              </div>

              <div className="space-y-2.5">
                {ALL_DASHBOARD_SECTIONS.map((sec) => {
                  const visible = Boolean(currentPermissions[sec.id]);
                  return (
                    <div
                      key={sec.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                        visible
                          ? 'bg-white dark:bg-slate-800 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white'
                          : 'bg-slate-100/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 line-through'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {visible ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold">{sec.title}</p>
                          <p className="text-[11px] no-underline font-normal text-slate-500">
                            {sec.category} • {sec.isFinancial ? 'Financiero' : 'Público'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-xl ${
                          visible
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {visible ? 'VISIBLE' : 'OCULTO'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
