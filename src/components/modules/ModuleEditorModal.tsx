import React, { useState } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  ArrowRight,
  Mail,
  Copy,
  Info,
  Check,
  Eye,
  EyeOff,
  Bell,
  Heart,
  DollarSign,
  Palette,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  ChurchConfig,
  AppCustomModuleConfig,
  ModuleActionButton,
  ModuleActionButtonActionType,
} from '../../types';
import { UnifiedModuleItem } from '../../utils/moduleRegistry';
import {
  MINISTRY_ICON_OPTIONS,
  MINISTRY_COLOR_PRESETS,
  getMinistryIconComponent,
} from '../../utils/ministryIcons';

interface ModuleEditorModalProps {
  module: UnifiedModuleItem;
  allModules: UnifiedModuleItem[];
  config: ChurchConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (moduleId: string, updatedConfig: AppCustomModuleConfig) => void;
  onReset: (moduleId: string) => void;
  onShowToast?: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

export const ModuleEditorModal: React.FC<ModuleEditorModalProps> = ({
  module,
  allModules,
  config,
  isOpen,
  onClose,
  onSave,
  onReset,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const currentSaved = config.modulesConfig?.[module.id] || {};

  const [activeTab, setActiveTab] = useState<'general' | 'buttons' | 'notice'>('general');

  // General fields
  const [label, setLabel] = useState(currentSaved.label || module.label || module.defaultLabel);
  const [subtitle, setSubtitle] = useState(currentSaved.subtitle || module.subtitle || '');
  const [iconName, setIconName] = useState(currentSaved.iconName || module.iconName);
  const [color, setColor] = useState(currentSaved.color || module.color);
  const [badge, setBadge] = useState(currentSaved.badge || '');
  const [badgeColor, setBadgeColor] = useState<'indigo' | 'emerald' | 'rose' | 'amber' | 'purple' | 'blue'>(
    currentSaved.badgeColor || 'indigo'
  );
  const [showInTopNav, setShowInTopNav] = useState(
    currentSaved.showInTopNav !== undefined ? currentSaved.showInTopNav : module.showInTopNav
  );
  const [enabled, setEnabled] = useState(
    currentSaved.enabled !== undefined ? currentSaved.enabled : module.enabled
  );

  // Buttons list
  const [actionButtons, setActionButtons] = useState<ModuleActionButton[]>(
    currentSaved.actionButtons && currentSaved.actionButtons.length > 0
      ? [...currentSaved.actionButtons]
      : [...module.actionButtons]
  );

  // Notice / Announcement
  const [noticeText, setNoticeText] = useState(currentSaved.customNotice?.text || '');
  const [noticeType, setNoticeType] = useState<'info' | 'announcement' | 'warning' | 'success'>(
    currentSaved.customNotice?.type || 'info'
  );
  const [noticeActive, setNoticeActive] = useState(!!currentSaved.customNotice?.text);

  // Icon search & category
  const [iconSearch, setIconSearch] = useState('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('Todos');

  // Handle adding new button
  const handleAddButton = () => {
    const newBtn: ModuleActionButton = {
      id: `btn_${Date.now()}`,
      label: 'Nuevo Botón',
      actionType: 'url',
      targetUrl: 'https://',
      icon: 'ExternalLink',
      variant: 'emerald',
    };
    setActionButtons((prev) => [...prev, newBtn]);
    setActiveTab('buttons');
  };

  const handleUpdateButton = (index: number, updates: Partial<ModuleActionButton>) => {
    setActionButtons((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveButton = (index: number) => {
    setActionButtons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveButton = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      setActionButtons((prev) => {
        const next = [...prev];
        const temp = next[index];
        next[index] = next[index - 1];
        next[index - 1] = temp;
        return next;
      });
    } else if (direction === 'down' && index < actionButtons.length - 1) {
      setActionButtons((prev) => {
        const next = [...prev];
        const temp = next[index];
        next[index] = next[index + 1];
        next[index + 1] = temp;
        return next;
      });
    }
  };

  // Filtered icons
  const categories = ['Todos', 'Módulos del Sistema', 'Acciones & Botones', 'Donaciones & Finanzas', 'Artes & Música', 'Grupos & Familias', 'Servicio & Protocolo', 'Espiritual & Misiones', 'Media & Creatividad', 'Recursos & Varios'];
  const filteredIcons = MINISTRY_ICON_OPTIONS.filter((opt) => {
    const matchesSearch =
      opt.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      opt.key.toLowerCase().includes(iconSearch.toLowerCase());
    const matchesCat = selectedIconCategory === 'Todos' || opt.category === selectedIconCategory;
    return matchesSearch && matchesCat;
  });

  const handleSave = () => {
    const updated: AppCustomModuleConfig = {
      id: module.id,
      label: label.trim() || module.defaultLabel,
      subtitle: subtitle.trim(),
      iconName,
      color,
      badge: badge.trim() || undefined,
      badgeColor,
      showInTopNav,
      enabled,
      order: module.order,
      actionButtons: actionButtons.filter((b) => b.label.trim() !== ''),
      customNotice: noticeActive && noticeText.trim()
        ? {
            text: noticeText.trim(),
            type: noticeType,
          }
        : undefined,
    };

    onSave(module.id, updated);
    if (onShowToast) {
      onShowToast(`Módulo "${updated.label}" actualizado con éxito`, 'success');
    }
    onClose();
  };

  const handleResetToFactory = () => {
    if (window.confirm(`¿Restablecer el módulo "${module.defaultLabel}" a sus valores originales de fábrica?`)) {
      onReset(module.id);
      if (onShowToast) {
        onShowToast(`Módulo restablecido a valores originales`, 'info');
      }
      onClose();
    }
  };

  const SelectedIcon = getMinistryIconComponent(iconName);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center space-x-3.5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: color }}
            >
              <SelectedIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {module.categoryLabel}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {module.id}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Editar Módulo: {label || module.defaultLabel}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>General & Apariencia</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('buttons')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'buttons'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Botones de Acción ({actionButtons.length})</span>
            {actionButtons.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notice')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'notice'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Aviso o Banner Destacado</span>
            {noticeActive && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: GENERAL & APARIENCIA */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Row 1: Nombre & Subtítulo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre / Etiqueta de la Pestaña
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder={module.defaultLabel}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Nombre original del sistema: <strong>{module.defaultLabel}</strong>
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lema o Subtítulo Eclesial
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Descripción o propósito pastoral de este módulo"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Aparece en la cabecera cuando se abre el módulo
                  </span>
                </div>
              </div>

              {/* Row 2: Insignia (Badge) & Visibilidad */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Insignia / Badge en la Pestaña (Opcional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      placeholder="Ej: Nuevo, En Vivo, 3, VIP"
                      maxLength={12}
                      className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                    <select
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value as any)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold"
                    >
                      <option value="indigo">Índigo</option>
                      <option value="emerald">Esmeralda</option>
                      <option value="rose">Rosa/Rojo</option>
                      <option value="amber">Ámbar</option>
                      <option value="purple">Púrpura</option>
                      <option value="blue">Azul</option>
                    </select>
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Pequeño distintivo visual en la pestaña superior
                  </span>
                </div>

                {/* Toggles */}
                <div className="flex flex-col justify-center space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mostrar en Barra Superior</span>
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showInTopNav}
                        onChange={(e) => setShowInTopNav(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>

                  {module.canDisable && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                        <Check className="w-3.5 h-3.5 text-slate-400" />
                        <span>Módulo Habilitado</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => setEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-indigo-500" />
                  <span>Color Distintivo del Módulo</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {MINISTRY_COLOR_PRESETS.map((preset) => {
                    const isSelected = (color || '').toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setColor(preset.hex)}
                        title={preset.name}
                        className={`px-2 py-1.5 rounded-xl border flex items-center space-x-1.5 transition-all text-left text-xs font-bold ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 scale-102'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="truncate text-[11px]">{preset.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
                {/* Custom HEX */}
                <div className="mt-2.5 flex items-center space-x-3">
                  <span className="text-xs text-slate-500 font-medium">Color Personalizado (HEX):</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#4f46e5"
                      className="w-28 px-3 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                    />
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer overflow-hidden p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span>Icono del Módulo (Selecciona uno)</span>
                  </label>
                  <input
                    type="text"
                    value={iconSearch}
                    onChange={(e) => setIconSearch(e.target.value)}
                    placeholder="Buscar icono por nombre..."
                    className="px-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Categories */}
                <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-none mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedIconCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                        selectedIconCategory === cat
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                  {filteredIcons.map((opt) => {
                    const IconComp = opt.icon;
                    const isSelected = iconName === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setIconName(opt.key)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 ring-2 ring-indigo-500/30'
                            : 'border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <IconComp
                          className="w-5 h-5"
                          style={{ color: isSelected ? color : undefined }}
                        />
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full">
                          {opt.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOTONES DE ACCIÓN ("agregarle botones o algo más") */}
          {activeTab === 'buttons' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    <span>Botones de Acción para este Módulo</span>
                  </h4>
                  <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 mt-0.5">
                    Aparecerán de forma interactiva en la cabecera cuando cualquier usuario visite este módulo (ej: WhatsApp, llamadas, enlaces web, donaciones o accesos rápidos).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer shrink-0 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Agregar Botón</span>
                </button>
              </div>

              {actionButtons.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium">
                    Aún no hay botones interactivos configurados en este módulo.
                  </p>
                  <button
                    type="button"
                    onClick={handleAddButton}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar el primer botón</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {actionButtons.map((btn, index) => {
                    const BtnIcon = getMinistryIconComponent(btn.icon || 'ExternalLink');
                    return (
                      <div
                        key={btn.id || index}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        {/* Button Bar Top */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center space-x-2">
                            <span className="w-6 h-6 rounded-lg bg-indigo-600/10 text-indigo-600 font-extrabold text-xs flex items-center justify-center">
                              #{index + 1}
                            </span>
                            <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center text-slate-700 dark:text-slate-200">
                              <BtnIcon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-white">
                              {btn.label || 'Botón sin nombre'}
                            </span>
                          </div>

                          {/* Reorder and Delete controls */}
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleMoveButton(index, 'up')}
                              disabled={index === 0}
                              title="Subir"
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveButton(index, 'down')}
                              disabled={index === actionButtons.length - 1}
                              title="Bajar"
                              className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 disabled:opacity-30 cursor-pointer"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveButton(index)}
                              title="Eliminar botón"
                              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Label */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Texto del Botón
                            </label>
                            <input
                              type="text"
                              value={btn.label}
                              onChange={(e) => handleUpdateButton(index, { label: e.target.value })}
                              placeholder="Ej: WhatsApp Pastoral"
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                            />
                          </div>

                          {/* Action Type */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Tipo de Acción
                            </label>
                            <select
                              value={btn.actionType}
                              onChange={(e) => {
                                const action = e.target.value as ModuleActionButtonActionType;
                                let defIcon = 'ExternalLink';
                                let defVariant = btn.variant;
                                if (action === 'whatsapp') {
                                  defIcon = 'MessageCircle';
                                  defVariant = 'emerald';
                                } else if (action === 'phone') {
                                  defIcon = 'PhoneCall';
                                  defVariant = 'sky';
                                } else if (action === 'navigate') {
                                  defIcon = 'ArrowRight';
                                  defVariant = 'indigo';
                                } else if (action === 'copy') {
                                  defIcon = 'Copy';
                                  defVariant = 'secondary';
                                } else if (action === 'email') {
                                  defIcon = 'Mail';
                                  defVariant = 'purple';
                                }
                                handleUpdateButton(index, {
                                  actionType: action,
                                  icon: defIcon,
                                  variant: defVariant,
                                });
                              }}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                            >
                              <option value="whatsapp">💬 Chat de WhatsApp</option>
                              <option value="phone">📞 Llamada Telefónica</option>
                              <option value="url">🔗 Enlace Web Externo</option>
                              <option value="navigate">🧭 Ir a otro Módulo (Navegación)</option>
                              <option value="copy">📋 Copiar Datos (Portapapeles)</option>
                              <option value="email">✉️ Correo Electrónico</option>
                            </select>
                          </div>

                          {/* Style Variant */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                              Estilo Visual / Color
                            </label>
                            <select
                              value={btn.variant || 'emerald'}
                              onChange={(e) => handleUpdateButton(index, { variant: e.target.value as any })}
                              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                            >
                              <option value="emerald">Verde Esmeralda (WhatsApp / Éxito)</option>
                              <option value="indigo">Índigo Real (Primario)</option>
                              <option value="sky">Azul Cielo (Llamadas / Web)</option>
                              <option value="amber">Ámbar Fuego (Destacado)</option>
                              <option value="rose">Rosa / Rubí</option>
                              <option value="purple">Púrpura Noble</option>
                              <option value="secondary">Gris / Neutro</option>
                              <option value="outline">Contorno Elegante</option>
                            </select>
                          </div>
                        </div>

                        {/* Action details depending on actionType */}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {btn.actionType === 'whatsapp' && (
                            <>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Número de WhatsApp (con código de país)
                                </label>
                                <input
                                  type="text"
                                  value={btn.targetUrl || ''}
                                  onChange={(e) => handleUpdateButton(index, { targetUrl: e.target.value })}
                                  placeholder="+1234567890"
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                  Mensaje Prellenado (Opcional)
                                </label>
                                <input
                                  type="text"
                                  value={btn.payload || ''}
                                  onChange={(e) => handleUpdateButton(index, { payload: e.target.value })}
                                  placeholder="Hola, me comunico desde la app de la iglesia..."
                                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                                />
                              </div>
                            </>
                          )}

                          {btn.actionType === 'phone' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Número Telefónico para Llamar
                              </label>
                              <input
                                type="tel"
                                value={btn.targetUrl || ''}
                                onChange={(e) => handleUpdateButton(index, { targetUrl: e.target.value })}
                                placeholder="+1 (555) 123-4567"
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          )}

                          {btn.actionType === 'url' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                URL Web (https://...)
                              </label>
                              <input
                                type="url"
                                value={btn.targetUrl || ''}
                                onChange={(e) => handleUpdateButton(index, { targetUrl: e.target.value })}
                                placeholder="https://youtube.com/c/iglesia o https://zoom.us/..."
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
                              />
                            </div>
                          )}

                          {btn.actionType === 'navigate' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Módulo o Pestaña de Destino
                              </label>
                              <select
                                value={btn.targetTab || 'dashboard'}
                                onChange={(e) => handleUpdateButton(index, { targetTab: e.target.value })}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold"
                              >
                                {allModules.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.label} ({m.categoryLabel})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {btn.actionType === 'copy' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Texto a Copiar con un Toque (ej. Datos Bancarios o Dirección)
                              </label>
                              <textarea
                                value={btn.payload || ''}
                                onChange={(e) => handleUpdateButton(index, { payload: e.target.value })}
                                placeholder="Banco Central - Cta: 1234-5678-9012 - Titular: Iglesia Central"
                                rows={2}
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          )}

                          {btn.actionType === 'email' && (
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                                Dirección de Correo Electrónico
                              </label>
                              <input
                                type="email"
                                value={btn.targetUrl || ''}
                                onChange={(e) => handleUpdateButton(index, { targetUrl: e.target.value })}
                                placeholder="pastoral@iglesia.org"
                                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVISO O BANNER DESTACADO ("o algo más") */}
          {activeTab === 'notice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                    <Bell className="w-4 h-4 text-amber-500" />
                    <span>Aviso o Anuncio Destacado del Módulo</span>
                  </h4>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noticeActive}
                      onChange={(e) => setNoticeActive(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
                  </label>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                  Si está activo, aparecerá una alerta destacada en la parte superior de la página cuando cualquier persona entre a este módulo.
                </p>
              </div>

              {noticeActive && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Mensaje
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'info', label: 'Informativo', color: 'bg-blue-600' },
                        { id: 'announcement', label: 'Anuncio / Evento', color: 'bg-purple-600' },
                        { id: 'warning', label: 'Alerta / Recordatorio', color: 'bg-amber-600' },
                        { id: 'success', label: 'Celebración / Éxito', color: 'bg-emerald-600' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNoticeType(t.id as any)}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center space-x-1.5 ${
                            noticeType === t.id
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${t.color}`} />
                          <span>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Texto del Mensaje
                    </label>
                    <textarea
                      value={noticeText}
                      onChange={(e) => setNoticeText(e.target.value)}
                      placeholder="Escribe el mensaje que verán todos los miembros al ingresar a esta sección..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* REAL-TIME PREVIEW CARD */}
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Vista Previa en Tiempo Real</span>
              </span>
              <span className="text-[11px] text-slate-400">Así se verá en la interfaz</span>
            </div>

            {/* 1. Preview of Tab in Navigation Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center space-x-2">
              <div
                className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs"
                style={{ backgroundColor: color }}
              >
                <SelectedIcon className="w-4 h-4" />
                <span>{label || module.defaultLabel}</span>
                {badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/25 font-extrabold uppercase">
                    {badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400 italic">Pestaña activa en la barra superior</span>
            </div>

            {/* 2. Preview of Page Header Buttons */}
            {actionButtons.length > 0 && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Botones de acción interactivos en la cabecera:
                </span>
                <div className="flex flex-wrap gap-2">
                  {actionButtons.map((btn, idx) => {
                    const BIcon = getMinistryIconComponent(btn.icon || 'ExternalLink');
                    let bgClasses = 'bg-emerald-600 text-white shadow-emerald-500/20';
                    if (btn.variant === 'indigo') bgClasses = 'bg-indigo-600 text-white shadow-indigo-500/20';
                    if (btn.variant === 'sky') bgClasses = 'bg-sky-600 text-white shadow-sky-500/20';
                    if (btn.variant === 'amber') bgClasses = 'bg-amber-600 text-white shadow-amber-500/20';
                    if (btn.variant === 'rose') bgClasses = 'bg-rose-600 text-white shadow-rose-500/20';
                    if (btn.variant === 'purple') bgClasses = 'bg-purple-600 text-white shadow-purple-500/20';
                    if (btn.variant === 'secondary') bgClasses = 'bg-slate-700 text-white';
                    if (btn.variant === 'outline') bgClasses = 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700';

                    return (
                      <span
                        key={btn.id || idx}
                        className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs ${bgClasses}`}
                      >
                        <BIcon className="w-3.5 h-3.5" />
                        <span>{btn.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between flex-wrap gap-2">
          <button
            type="button"
            onClick={handleResetToFactory}
            className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center space-x-1.5 cursor-pointer"
            title="Restablecer este módulo a sus configuraciones de fábrica"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Valores de Fábrica</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all cursor-pointer hover:scale-102"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Módulo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
