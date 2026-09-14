import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  RotateCcw,
  Edit3,
  ChevronUp,
  ChevronDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Eye,
  EyeOff,
  Plus,
  Compass,
  CheckCircle2,
  Layers,
  Bell,
  MessageCircle,
  ExternalLink,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { ChurchConfig, AppCustomModuleConfig } from '../../types';
import {
  UnifiedModuleItem,
  getUnifiedModulesList,
  reorderModulesList,
  applyNewModuleOrder,
} from '../../utils/moduleRegistry';
import { getMinistryIconComponent } from '../../utils/ministryIcons';
import { ModuleEditorModal } from './ModuleEditorModal';

interface AllModulesManagerViewProps {
  config: ChurchConfig;
  onUpdateConfig?: (updated: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
  onNavigateTab?: (tabId: string) => void;
}

export const AllModulesManagerView: React.FC<AllModulesManagerViewProps> = ({
  config,
  onUpdateConfig,
  onShowToast,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingModule, setEditingModule] = useState<UnifiedModuleItem | null>(null);

  // Compute unified list
  const unifiedModules = useMemo(() => {
    return getUnifiedModulesList(config);
  }, [config]);

  // Filtered list
  const filteredModules = useMemo(() => {
    return unifiedModules.filter((mod) => {
      const matchesSearch =
        mod.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.defaultLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (mod.subtitle && mod.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' ||
        mod.category === selectedCategory ||
        (selectedCategory === 'buttons' && mod.actionButtons.length > 0);

      return matchesSearch && matchesCat;
    });
  }, [unifiedModules, searchQuery, selectedCategory]);

  // Reorder handler
  const handleReorder = (moduleId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    if (!onUpdateConfig) return;

    const newOrderIds = reorderModulesList(unifiedModules, moduleId, direction);
    onUpdateConfig((prev) => applyNewModuleOrder(prev, newOrderIds));

    const movedMod = unifiedModules.find((m) => m.id === moduleId);
    if (onShowToast) {
      onShowToast(`Orden actualizado: "${movedMod?.label || moduleId}" movido`, 'info');
    }
  };

  // Toggle Visibility in Top Nav
  const handleToggleNavVisibility = (moduleId: string, currentVal: boolean) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const currentMods = { ...(prev.modulesConfig || {}) };
      currentMods[moduleId] = {
        ...(currentMods[moduleId] || { id: moduleId }),
        showInTopNav: !currentVal,
      };
      return {
        ...prev,
        modulesConfig: currentMods,
      };
    });

    if (onShowToast) {
      onShowToast(
        !currentVal
          ? 'Módulo visible en la barra de navegación'
          : 'Módulo ocultado de la barra de navegación',
        'info'
      );
    }
  };

  // Reset all module order to factory default
  const handleResetOrder = () => {
    if (
      window.confirm(
        '¿Deseas restablecer el orden de todos los módulos a la disposición inicial predeterminada?'
      )
    ) {
      if (!onUpdateConfig) return;

      onUpdateConfig((prev) => {
        const { moduleNavOrder, ...rest } = prev;
        return {
          ...rest,
          moduleNavOrder: undefined,
        };
      });

      if (onShowToast) {
        onShowToast('Orden de módulos restablecido al predeterminado de fábrica', 'success');
      }
    }
  };

  // Save module settings from modal
  const handleSaveModule = (moduleId: string, updatedConfig: AppCustomModuleConfig) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const currentMods = { ...(prev.modulesConfig || {}) };
      currentMods[moduleId] = {
        ...(currentMods[moduleId] || {}),
        ...updatedConfig,
      };
      return {
        ...prev,
        modulesConfig: currentMods,
      };
    });
  };

  // Reset single module settings
  const handleResetModule = (moduleId: string) => {
    if (!onUpdateConfig) return;

    onUpdateConfig((prev) => {
      const currentMods = { ...(prev.modulesConfig || {}) };
      delete currentMods[moduleId];
      return {
        ...prev,
        modulesConfig: currentMods,
      };
    });
  };

  // Stats
  const totalCount = unifiedModules.length;
  const visibleInNavCount = unifiedModules.filter((m) => m.showInTopNav && m.enabled).length;
  const withButtonsCount = unifiedModules.filter((m) => m.actionButtons.length > 0).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-16 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Control Integral de Navegación & Módulos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestor y Editor de Todos los Módulos
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Personaliza el orden de aparición en la barra superior (<strong>subir o bajar módulos</strong>), edita sus nombres, iconos y colores temáticos, y <strong>agrega botones de acción interactivos</strong> (WhatsApp, llamadas, enlaces externos, donaciones) o avisos a cada sección de la iglesia.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 text-center">
              <span className="text-2xl font-black text-white">{totalCount}</span>
              <span className="text-[11px] font-bold text-slate-400 block">Total Módulos</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 text-center">
              <span className="text-2xl font-black text-emerald-400">{visibleInNavCount}</span>
              <span className="text-[11px] font-bold text-emerald-300/80 block">En Barra</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-500/10 backdrop-blur-md border border-blue-500/20 text-center">
              <span className="text-2xl font-black text-blue-400">{withButtonsCount}</span>
              <span className="text-[11px] font-bold text-blue-300/80 block">Con Botones</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-300 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>
              Cualquier cambio de orden o edición se refleja de inmediato en la barra de navegación y en la cabecera.
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetOrder}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition-all flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
            title="Restablece el orden de los módulos a la disposición de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer Orden Original</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar módulo por nombre, ID o descripción..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'core', label: 'Principales' },
            { id: 'ministry', label: 'Ministerios' },
            { id: 'custom', label: 'Personalizados' },
            { id: 'buttons', label: 'Con Botones' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modules List */}
      <div className="space-y-3">
        {filteredModules.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <Compass className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm font-semibold">No se encontraron módulos con ese criterio.</p>
          </div>
        ) : (
          filteredModules.map((mod, index) => {
            const Icon = getMinistryIconComponent(mod.iconName);
            const isFirst = mod.order === 1;
            const isLast = mod.order === unifiedModules.length;
            const isRenamed = mod.label !== mod.defaultLabel;

            return (
              <div
                key={mod.id}
                className="group p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Reorder controls + Avatar + Info */}
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  {/* Position Badge & Move Controls */}
                  <div className="flex flex-col items-center justify-center space-y-1 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReorder(mod.id, 'up')}
                      disabled={isFirst}
                      title="Subir posición (mover antes en la barra superior)"
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 cursor-pointer transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black text-slate-900 dark:text-white px-1.5 font-mono">
                      #{mod.order}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleReorder(mod.id, 'down')}
                      disabled={isLast}
                      title="Bajar posición (mover después en la barra superior)"
                      className="p-1 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-20 cursor-pointer transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Module Avatar */}
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: mod.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Module Text Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                        {mod.label}
                      </span>
                      {isRenamed && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          (Original: {mod.defaultLabel})
                        </span>
                      )}
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900">
                        {mod.categoryLabel}
                      </span>
                      {mod.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold uppercase bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          Badge: {mod.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {mod.subtitle}
                    </p>

                    {/* Action buttons preview chips */}
                    {mod.actionButtons.length > 0 && (
                      <div className="flex items-center space-x-1.5 mt-2 flex-wrap gap-y-1">
                        <span className="text-[10px] font-bold text-slate-400">Botones agregados:</span>
                        {mod.actionButtons.map((b, bi) => {
                          const BIcon = getMinistryIconComponent(b.icon || 'ExternalLink');
                          return (
                            <span
                              key={b.id || bi}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800"
                            >
                              <BIcon className="w-3 h-3" />
                              <span>{b.label}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Custom notice indicator */}
                    {mod.customNotice && (
                      <div className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                        <Bell className="w-3 h-3" />
                        <span className="truncate max-w-xs">Aviso: {mod.customNotice.text}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Quick actions (Move to top, Toggle visibility, Edit Button) */}
                <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                  {/* Move to top button */}
                  {!isFirst && (
                    <button
                      type="button"
                      onClick={() => handleReorder(mod.id, 'top')}
                      title="Mover al primer lugar de la barra superior"
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ArrowUpToLine className="w-4 h-4" />
                    </button>
                  )}

                  {/* Toggle Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleNavVisibility(mod.id, mod.showInTopNav)}
                    title={
                      mod.showInTopNav
                        ? 'Visible en la barra superior (clic para ocultar)'
                        : 'Oculto de la barra superior (clic para mostrar)'
                    }
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      mod.showInTopNav
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 line-through'
                    }`}
                  >
                    {mod.showInTopNav ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>En Barra</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Oculto</span>
                      </>
                    )}
                  </button>

                  {/* Edit Module Button */}
                  <button
                    type="button"
                    onClick={() => setEditingModule(mod)}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-105"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Módulo</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Editor Modal */}
      {editingModule && (
        <ModuleEditorModal
          module={editingModule}
          allModules={unifiedModules}
          config={config}
          isOpen={!!editingModule}
          onClose={() => setEditingModule(null)}
          onSave={handleSaveModule}
          onReset={handleResetModule}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
