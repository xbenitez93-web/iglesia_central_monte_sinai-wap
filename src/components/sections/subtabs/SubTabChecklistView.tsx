import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Tag,
  Filter,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { SubTabChecklistTask, CustomSectionSubTab } from '../../../types';

interface SubTabChecklistViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgente', color: '#dc2626', bg: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900' },
  high: { label: 'Alta', color: '#ea580c', bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900' },
  medium: { label: 'Media', color: '#0284c7', bg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900' },
  low: { label: 'Baja', color: '#64748b', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
};

const CATEGORY_PRESETS = [
  'General',
  'Alabanza & Música',
  'Sonido & Multimedia',
  'Protocolo & Bienvenida',
  'Aseo & Logística',
  'Refrigerio',
  'Escuela Bíblica',
  'Jóvenes',
  'Evangelismo',
  'Administración',
];

const COLOR_SWATCHES = [
  '#059669', // Emerald
  '#4f46e5', // Indigo
  '#7c3aed', // Purple
  '#dc2626', // Red
  '#ea580c', // Orange
  '#d97706', // Amber
  '#0284c7', // Sky Blue
  '#0d9488', // Teal
  '#db2777', // Pink
  '#475569', // Slate
];

export const SubTabChecklistView: React.FC<SubTabChecklistViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const tasks = subTab.checklistData?.tasks || [];

  // Filtering states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Quick Add State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('General');

  // Modal State for full add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<SubTabChecklistTask>>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    category: 'General',
    assignedTo: '',
    color: '#059669',
  });

  // Derived stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const urgentCount = tasks.filter((t) => !t.completed && (t.priority === 'urgent' || t.priority === 'high')).length;

  const categories = Array.from(new Set(tasks.map((t) => t.category).filter(Boolean))) as string[];

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (statusFilter === 'pending' && task.completed) return false;
    if (statusFilter === 'completed' && !task.completed) return false;

    // Priority filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchAssigned = task.assignedTo?.toLowerCase().includes(q);
      const matchCat = task.category?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssigned && !matchCat) return false;
    }

    return true;
  });

  // Actions
  const handleToggleTask = (id: string) => {
    const updatedTasks = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedAt: nextCompleted ? new Date().toISOString() : undefined,
        };
      }
      return t;
    });

    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });

    const target = tasks.find((t) => t.id === id);
    if (target) {
      if (!target.completed) {
        onShowToast(`¡Tarea completada: "${target.title}"!`, 'success');
      }
    }
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const newTask: SubTabChecklistTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: quickTitle.trim(),
      completed: false,
      priority: 'medium',
      category: quickCategory,
      color: '#059669',
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [newTask, ...tasks];
    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });

    setQuickTitle('');
    onShowToast('Tarea creada con éxito', 'success');
  };

  const handleOpenAddModal = () => {
    setTaskForm({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '12:00',
      category: 'General',
      assignedTo: '',
      color: '#059669',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: SubTabChecklistTask) => {
    setTaskForm({ ...task });
    setEditingId(task.id);
    setIsModalOpen(true);
  };

  const handleDuplicateTask = (task: SubTabChecklistTask) => {
    const duplicatedTask: SubTabChecklistTask = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${task.title} (Copia)`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedTasks = [duplicatedTask, ...tasks];
    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });
    onShowToast('Tarea duplicada', 'info');
  };

  const handleDeleteTask = (id: string) => {
    const updatedTasks = tasks.filter((t) => t.id !== id);
    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });
    onShowToast('Tarea eliminada', 'info');
  };

  const handleClearCompleted = () => {
    if (completedTasks === 0) return;
    const updatedTasks = tasks.filter((t) => !t.completed);
    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });
    onShowToast('Se eliminaron las tareas completadas', 'info');
  };

  const handleMarkAllComplete = () => {
    const updatedTasks = tasks.map((t) => ({
      ...t,
      completed: true,
      completedAt: new Date().toISOString(),
    }));
    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });
    onShowToast('Todas las tareas marcadas como completadas', 'success');
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title?.trim()) {
      onShowToast('El título de la tarea es obligatorio', 'danger');
      return;
    }

    const taskData: SubTabChecklistTask = {
      id: editingId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: taskForm.title.trim(),
      description: taskForm.description?.trim() || '',
      completed: editingId ? (tasks.find((t) => t.id === editingId)?.completed || false) : false,
      priority: taskForm.priority || 'medium',
      dueDate: taskForm.dueDate || '',
      dueTime: taskForm.dueTime || '',
      category: taskForm.category?.trim() || 'General',
      assignedTo: taskForm.assignedTo?.trim() || '',
      color: taskForm.color || '#059669',
      createdAt: editingId ? (tasks.find((t) => t.id === editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    };

    let updatedTasks: SubTabChecklistTask[];
    if (editingId) {
      updatedTasks = tasks.map((t) => (t.id === editingId ? taskData : t));
      onShowToast('Tarea actualizada', 'success');
    } else {
      updatedTasks = [taskData, ...tasks];
      onShowToast('Tarea creada con éxito', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      checklistData: { tasks: updatedTasks },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HEADER & PROGRESS STATS */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                {subTab.name || 'Lista de Tareas & Checklist'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organiza pendientes, asigna responsables, prioridades y verifica el cumplimiento de actividades.
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Tarea</span>
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar & Indicators */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center space-x-2">
              <span className="text-slate-700 dark:text-slate-200">
                Progreso General:
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                {completedTasks} de {totalTasks} tareas ({progressPercentage}%)
              </span>
            </div>
            {urgentCount > 0 && (
              <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400 font-extrabold text-[11px] bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-full">
                <Flame className="w-3.5 h-3.5" />
                <span>{urgentCount} urgente/alta prioridad</span>
              </div>
            )}
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. QUICK ADD TASK BAR */}
      {canEdit && (
        <form onSubmit={handleQuickAdd} className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              placeholder="Escribe el nombre de la tarea pendiente y presiona Enter..."
              className="w-full pl-3 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
            />
          </div>

          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
          >
            {CATEGORY_PRESETS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </form>
      )}

      {/* 3. FILTERS & SEARCH */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Todas ({totalTasks})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pendientes ({pendingTasks})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
              statusFilter === 'completed'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Completadas ({completedTasks})
          </button>
        </div>

        {/* Secondary filters & search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarea..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-36 sm:w-44"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
          >
            <option value="all">Prioridad: Todas</option>
            <option value="urgent">Urgente</option>
            <option value="high">Alta</option>
            <option value="medium">Media</option>
            <option value="low">Baja</option>
          </select>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200"
            >
              <option value="all">Categoría: Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}

          {canEdit && completedTasks > 0 && (
            <button
              type="button"
              onClick={handleClearCompleted}
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Limpiar completadas"
            >
              Limpiar ({completedTasks})
            </button>
          )}
        </div>
      </div>

      {/* 4. TASKS LIST */}
      {filteredTasks.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto opacity-80" />
          <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            {totalTasks === 0
              ? 'No hay tareas en esta lista'
              : 'No se encontraron tareas con los filtros seleccionados'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {totalTasks === 0
              ? 'Comienza agregando tu primera tarea o actividad con la barra rápida superior.'
              : 'Prueba cambiando los filtros o el término de búsqueda.'}
          </p>
          {totalTasks === 0 && canEdit && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md inline-flex items-center space-x-1.5 cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Tarea</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const priority = PRIORITY_CONFIG[task.priority || 'medium'];

            return (
              <div
                key={task.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  task.completed
                    ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 opacity-75'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Left: Checkbox + Title + Meta */}
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
                    title={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-extrabold text-slate-900 dark:text-white break-words ${
                          task.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Category Tag */}
                      {task.category && (
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.category}
                        </span>
                      )}

                      {/* Priority Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${priority.bg}`}
                      >
                        {priority.label}
                      </span>
                    </div>

                    {task.description && (
                      <p
                        className={`text-xs text-slate-500 dark:text-slate-400 leading-relaxed ${
                          task.completed ? 'line-through opacity-70' : ''
                        }`}
                      >
                        {task.description}
                      </p>
                    )}

                    {/* Meta info: Date & Assigned */}
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {task.dueDate && (
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                          {task.dueTime && <span>• {task.dueTime}</span>}
                        </span>
                      )}

                      {task.assignedTo && (
                        <span className="flex items-center space-x-1 font-semibold text-slate-600 dark:text-slate-300">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Asignado a: {task.assignedTo}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                {canEdit && (
                  <div className="flex items-center space-x-1 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleDuplicateTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Duplicar Tarea"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Tarea"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Eliminar Tarea"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. ADD / EDIT TASK MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Tarea' : 'Nueva Tarea / Actividad'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica los parámetros de la tarea' : 'Crea una tarea detallada con prioridad y responsable'}
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
            <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Tarea *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="Ej: Preparar lista de cantos, Probar micrófonos..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción / Instrucciones
                  </label>
                  <textarea
                    rows={3}
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Detalles de lo que se debe hacer, materiales necesarios..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                      <option value="urgent">Urgente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría / Área
                    </label>
                    <input
                      type="text"
                      list="category-suggestions"
                      value={taskForm.category}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}
                      placeholder="Ej: Alabanza, Logística..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                    <datalist id="category-suggestions">
                      {CATEGORY_PRESETS.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha Límite
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hora Límite
                    </label>
                    <input
                      type="time"
                      value={taskForm.dueTime}
                      onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Persona Responsable / Asignada
                  </label>
                  <input
                    type="text"
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    placeholder="Ej: Hermano Juan, Grupo de Jóvenes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {/* Color Tag Swatches */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Color de Etiqueta
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_SWATCHES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setTaskForm({ ...taskForm, color })}
                        className={`w-7 h-7 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                          taskForm.color === color
                            ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      >
                        {taskForm.color === color && (
                          <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                        )}
                      </button>
                    ))}
                  </div>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
