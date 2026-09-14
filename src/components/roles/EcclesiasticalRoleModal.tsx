import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Shield, Tag, FileText, Palette } from 'lucide-react';
import { EcclesiasticalRole, EcclesiasticalRoleCategory } from '../../types';
import { ECCLESIASTICAL_ROLE_CATEGORIES } from '../../data/ecclesiasticalRoles';

interface EcclesiasticalRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleToEdit?: EcclesiasticalRole | null;
  onSave: (role: EcclesiasticalRole) => void;
  existingRoles?: EcclesiasticalRole[];
}

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#6366f1', // Indigo light
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#0d9488', // Teal
  '#06b6d4', // Cyan
  '#0284c7', // Sky
  '#64748b', // Slate
];

export const EcclesiasticalRoleModal: React.FC<EcclesiasticalRoleModalProps> = ({
  isOpen,
  onClose,
  roleToEdit,
  onSave,
  existingRoles = [],
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EcclesiasticalRoleCategory>('Liderazgo');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name || '');
      setCategory(roleToEdit.category || 'Liderazgo');
      setDescription(roleToEdit.description || '');
      setColor(roleToEdit.color || '#4f46e5');
    } else {
      setName('');
      setCategory('Liderazgo');
      setDescription('');
      setColor('#4f46e5');
    }
    setError(null);
  }, [roleToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Por favor ingresa el nombre del cargo eclesiástico.');
      return;
    }

    // Check duplicate name (excluding the current role if editing)
    const isDuplicate = existingRoles.some(
      (r) =>
        r.name.toLowerCase() === trimmedName.toLowerCase() &&
        (!roleToEdit || r.id !== roleToEdit.id)
    );

    if (isDuplicate) {
      setError(`Ya existe un cargo eclesiástico registrado con el nombre "${trimmedName}".`);
      return;
    }

    const newRole: EcclesiasticalRole = {
      id: roleToEdit ? roleToEdit.id : `role_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: trimmedName,
      category,
      description: description.trim(),
      color,
      isSystem: roleToEdit?.isSystem || false,
      createdAt: roleToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-md">
              <Sparkles className="w-5 h-5 text-purple-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {roleToEdit ? 'Editar Cargo Eclesiástico' : 'Nuevo Cargo Eclesiástico'}
              </h2>
              <p className="text-xs text-purple-100/90">
                {roleToEdit
                  ? 'Modifica las funciones específicas y atributos del cargo'
                  : 'Registra un nuevo rol con sus funciones congregacionales'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4.5 flex-1">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Nombre del Cargo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Nombre del Cargo / Rol Eclesiástico *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Coordinador de Discipulado, Diaconisa de Protocolo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Categoría Ministerial */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-purple-500" />
              <span>Área / Categoría Ministerial *</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              {ECCLESIASTICAL_ROLE_CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.id);
                      if (!roleToEdit) {
                        setColor(cat.defaultColor);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <span className="truncate">{cat.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Funciones Específicas & Responsabilidades */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>Funciones Específicas & Responsabilidades</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla las funciones litúrgicas, logísticas, pastorales o de servicio asignadas a este cargo..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Este desglose se visualizará en la pestaña de Ministerios y en el expediente de cada servidor.
            </p>
          </div>

          {/* Color Distintivo */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-500" />
              <span>Color Distintivo del Cargo</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                    color === c ? 'scale-115 ring-3 ring-indigo-500/40 shadow-sm' : 'hover:scale-105 opacity-90'
                  }`}
                  title={c}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-700 cursor-pointer p-0 bg-transparent"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Vista Previa de la Tarjeta */}
          <div className="pt-2">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5">
              Vista previa del Cargo
            </span>
            <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-start space-x-3">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 mt-1"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {name || 'Nombre del Cargo'}
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {description || 'Sin funciones específicas registradas.'}
                </p>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{roleToEdit ? 'Guardar Cambios' : 'Crear Cargo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
