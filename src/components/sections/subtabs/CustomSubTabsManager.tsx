import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Tv,
  Link2,
  Target,
  BookOpen,
  Music,
  Users,
  Sparkles,
  Timer,
  FileText,
  CheckSquare,
  Vote,
  Ticket,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  LayoutGrid,
} from 'lucide-react';
import { CustomSectionSubTab, CustomSubTabType } from '../../../types';

interface CustomSubTabsManagerProps {
  subTabs: CustomSectionSubTab[];
  onChangeSubTabs: (updated: CustomSectionSubTab[]) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
}

export const SUBTAB_PRESET_TYPES: {
  type: CustomSubTabType;
  label: string;
  defaultName: string;
  description: string;
  icon: any;
  color: string;
  bgLight: string;
}[] = [
  {
    type: 'calendar',
    label: 'Calendario & Cronograma',
    defaultName: 'Calendario de Actividades',
    description: 'Fechas, horarios, lugares, expositores y agenda de eventos.',
    icon: Calendar,
    color: '#059669',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600',
  },
  {
    type: 'videos',
    label: 'Videos & Grabaciones',
    defaultName: 'Galería de Videos',
    description: 'Reproductor de YouTube/Vimeo, transmisiones y sermones.',
    icon: Tv,
    color: '#dc2626',
    bgLight: 'bg-red-50 dark:bg-red-950/50 text-red-600',
  },
  {
    type: 'links',
    label: 'Enlaces & Accesos Rápidos',
    defaultName: 'Enlaces de Interés',
    description: 'Directorio de sitios web, formularios y recursos en la nube.',
    icon: Link2,
    color: '#0284c7',
    bgLight: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600',
  },
  {
    type: 'work_plans',
    label: 'Planificación de Trabajo',
    defaultName: 'Plan de Trabajo & Metas',
    description: 'Proyectos, objetivos, barras de progreso y listas de tareas.',
    icon: Target,
    color: '#7c3aed',
    bgLight: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600',
  },
  {
    type: 'library',
    label: 'Biblioteca & Libros',
    defaultName: 'Biblioteca Digital',
    description: 'Libros digitales, guías en PDF, devocionales y descargas.',
    icon: BookOpen,
    color: '#d97706',
    bgLight: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600',
  },
  {
    type: 'music',
    label: 'Música & Cancionero',
    defaultName: 'Repertorio Musical',
    description: 'Canciones, tonos/acordes, BPM, letras, partituras y audios.',
    icon: Music,
    color: '#db2777',
    bgLight: 'bg-pink-50 dark:bg-pink-950/50 text-pink-600',
  },
  {
    type: 'members',
    label: 'Integrantes & Equipo',
    defaultName: 'Integrantes del Equipo',
    description: 'Directorio de colaboradores, roles, contactos y WhatsApp.',
    icon: Users,
    color: '#0d9488',
    bgLight: 'bg-teal-50 dark:bg-teal-950/50 text-teal-600',
  },
  {
    type: 'casting',
    label: 'Casting & Audiciones',
    defaultName: 'Casting & Postulaciones',
    description: 'Audiciones para roles/música, puntuación del jurado y estado.',
    icon: Sparkles,
    color: '#8b5cf6',
    bgLight: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600',
  },
  {
    type: 'rehearsals',
    label: 'Ensayos & Prácticas',
    defaultName: 'Ensayos & Prácticas',
    description: 'Programación de ensayos, setlist y control de asistencia.',
    icon: Timer,
    color: '#4f46e5',
    bgLight: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600',
  },
  {
    type: 'notes',
    label: 'Notas & Documentos',
    defaultName: 'Notas & Comunicados',
    description: 'Información general, anuncios y contenido editorial.',
    icon: FileText,
    color: '#475569',
    bgLight: 'bg-slate-100 dark:bg-slate-800 text-slate-600',
  },
  {
    type: 'checklist',
    label: 'Tareas & Checklist',
    defaultName: 'Lista de Tareas',
    description: 'Tareas pendientes y verificación de actividades.',
    icon: CheckSquare,
    color: '#059669',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600',
  },
  {
    type: 'polls',
    label: 'Encuestas & Votaciones',
    defaultName: 'Votaciones & Encuestas',
    description: 'Votaciones interactivas con fotos de candidatos, conteo en vivo y ganadores.',
    icon: Vote,
    color: '#9333ea',
    bgLight: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600',
  },
  {
    type: 'raffles',
    label: 'Sorteos & Rifas Pro-Fondos',
    defaultName: 'Sorteos & Rifas',
    description: 'Sorteos con boletos numerados, recaudación de fondos, tómbola digital en vivo y premios.',
    icon: Ticket,
    color: '#d97706',
    bgLight: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600',
  },
];

export const CustomSubTabsManager: React.FC<CustomSubTabsManagerProps> = ({
  subTabs,
  onChangeSubTabs,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    name: string;
    type: CustomSubTabType;
    description: string;
    badge: string;
  }>({
    name: '',
    type: 'calendar',
    description: '',
    badge: '',
  });

  const handleOpenAdd = (presetType: CustomSubTabType = 'calendar') => {
    const preset = SUBTAB_PRESET_TYPES.find((p) => p.type === presetType) || SUBTAB_PRESET_TYPES[0];
    setForm({
      name: preset.defaultName,
      type: preset.type,
      description: preset.description,
      badge: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tab: CustomSectionSubTab) => {
    setForm({
      name: tab.name,
      type: tab.type,
      description: tab.description || '',
      badge: tab.badge || '',
    });
    setEditingId(tab.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = subTabs.filter((t) => t.id !== id);
    onChangeSubTabs(updated);
    onShowToast('Pestaña eliminada', 'info');
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === subTabs.length - 1)
    ) {
      return;
    }
    const updated = [...subTabs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChangeSubTabs(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      onShowToast('El nombre de la pestaña es obligatorio', 'danger');
      return;
    }

    const preset = SUBTAB_PRESET_TYPES.find((p) => p.type === form.type);

    let updatedList: CustomSectionSubTab[];
    if (editingId) {
      updatedList = subTabs.map((tab) => {
        if (tab.id !== editingId) return tab;
        return {
          ...tab,
          name: form.name.trim(),
          type: form.type,
          description: form.description,
          badge: form.badge,
        };
      });
      onShowToast('Pestaña actualizada', 'success');
    } else {
      const newTab: CustomSectionSubTab = {
        id: `tab_${Date.now()}`,
        name: form.name.trim(),
        type: form.type,
        description: form.description,
        badge: form.badge,
        colorTheme: preset?.color,
        createdAt: new Date().toISOString(),
      };
      updatedList = [...subTabs, newTab];
      onShowToast(`Pestaña «${newTab.name}» agregada con éxito`, 'success');
    }

    onChangeSubTabs(updatedList);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Quick Add Preset Buttons */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center space-x-2">
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Agregar Pestañas a esta Sección ({subTabs.length})</span>
          </label>
          <span className="text-[11px] text-slate-500">Haz clic en una plantilla para crear una pestaña</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {SUBTAB_PRESET_TYPES.map((preset) => {
            const Icon = preset.icon;
            const isAlreadyAdded = subTabs.some((t) => t.type === preset.type);

            return (
              <button
                key={preset.type}
                type="button"
                onClick={() => handleOpenAdd(preset.type)}
                className={`p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all hover:scale-[1.02] cursor-pointer ${
                  isAlreadyAdded
                    ? 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                }`}
              >
                <div className={`p-2 rounded-lg ${preset.bgLight} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {preset.label}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">
                    {isAlreadyAdded ? '✓ Ya agregada' : 'Agregar'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Configured Sub-Tabs List */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">
          Pestañas Activas en la Sección ({subTabs.length})
        </h4>

        {subTabs.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
            <Layers className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-xs text-slate-600 dark:text-slate-300">
              No has configurado pestañas aún para esta sección.
            </p>
            <p className="text-[11px] text-slate-500">
              Selecciona cualquiera de las opciones de arriba (Calendario, Videos, Enlaces, Música, Casting, etc.) para agregarla.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {subTabs.map((tab, idx) => {
              const preset = SUBTAB_PRESET_TYPES.find((p) => p.type === tab.type) || SUBTAB_PRESET_TYPES[0];
              const Icon = preset.icon;

              return (
                <div
                  key={tab.id}
                  className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex flex-col space-y-0.5 shrink-0">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === subTabs.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 disabled:opacity-20"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    </div>

                    <div className={`p-2.5 rounded-xl ${preset.bgLight} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                          {tab.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                          {preset.label}
                        </span>
                        {tab.badge && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
                            {tab.badge}
                          </span>
                        )}
                      </div>
                      {tab.description && (
                        <p className="text-[11px] text-slate-400 truncate max-w-md">
                          {tab.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(tab)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar Nombre / Configuración"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tab.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Eliminar Pestaña"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit SubTab Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Pestaña' : 'Nueva Pestaña'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica la configuración del submódulo' : 'Selecciona el tipo de contenido para tu pestaña'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Módulo / Pestaña *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const newType = e.target.value as CustomSubTabType;
                      const preset = SUBTAB_PRESET_TYPES.find((p) => p.type === newType);
                      setForm({
                        ...form,
                        type: newType,
                        name: preset?.defaultName || form.name,
                        description: preset?.description || form.description,
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {SUBTAB_PRESET_TYPES.map((p) => (
                      <option key={p.type} value={p.type}>
                        {p.label} — ({p.description})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Pestaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Calendario, Audiciones de Teatro, Cancionero..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Insignia o Badge (Opcional)
                  </label>
                  <input
                    type="text"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                    placeholder="Ej: Nuevo, 2026, Oficial..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción o Subtítulo
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Instrucciones para los miembros..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-50/70 dark:bg-slate-900/90 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Pestaña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
