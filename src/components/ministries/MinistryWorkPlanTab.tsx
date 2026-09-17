import React, { useState } from 'react';
import {
  MinistryWorkPlan,
  MinistryWorkPlanTask,
  ChurchConfig,
} from '../../types';
import {
  Calendar,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  Target,
  DollarSign,
  User,
  AlertTriangle,
  FileText,
  Share2,
  Check,
  X,
  Play,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles,
  BarChart3,
  ListTodo,
  Download,
  Copy,
} from 'lucide-react';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { YouTubeModal } from '../YouTubeModal';
import { MinistryWorkPlanShareModal } from './MinistryWorkPlanShareModal';

// Helper to guarantee valid absolute link for external opening
export const ensureAbsoluteUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface MinistryWorkPlanTabProps {
  ministry: 'worship' | 'dance' | 'women' | 'ushers' | 'theater' | string;
  ministryName: string;
  pageColor: string;
  plans: MinistryWorkPlan[];
  onAddPlan: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan: (plan: MinistryWorkPlan) => void;
  onDeletePlan: (id: string) => void;
  availableLeaders?: string[];
  config?: ChurchConfig;
}

export const MinistryWorkPlanTab: React.FC<MinistryWorkPlanTabProps> = ({
  ministry,
  ministryName,
  pageColor,
  plans,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  availableLeaders = [],
  config,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Date filters
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MinistryWorkPlan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<MinistryWorkPlan | null>(null);
  const [shareModalPlan, setShareModalPlan] = useState<MinistryWorkPlan | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Expanded cards for tasks
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // YouTube modal
  const [youtubeModal, setYoutubeModal] = useState<{
    isOpen: boolean;
    url?: string;
    title: string;
    subtitle?: string;
    notes?: string;
  }>({
    isOpen: false,
    title: '',
  });

  // Form State
  const initialFormState: Omit<MinistryWorkPlan, 'id'> = {
    ministry,
    title: '',
    objective: '',
    period: 'Trimestral',
    periodName: '1er Trimestre 2026',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    responsibleLeader: availableLeaders[0] || '',
    budget: 0,
    status: 'Planificado',
    priority: 'Media',
    targetAudience: 'Toda la congregación',
    goals: [],
    tasks: [],
    notes: '',
    youtubeUrl: '',
    date: new Date().toISOString().split('T')[0],
  };

  const [formState, setFormState] = useState<Omit<MinistryWorkPlan, 'id'>>(initialFormState);
  const [newGoalInput, setNewGoalInput] = useState('');
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');

  // Filter plans
  const filteredPlans = filterItemsByDate<MinistryWorkPlan>(
    plans.filter((p) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (p.title || '').toLowerCase().includes(q) ||
        (p.objective ? p.objective.toLowerCase().includes(q) : false) ||
        (p.responsibleLeader ? p.responsibleLeader.toLowerCase().includes(q) : false) ||
        (p.periodName ? p.periodName.toLowerCase().includes(q) : false) ||
        (p.goals && Array.isArray(p.goals) ? p.goals.some((g) => (g || '').toLowerCase().includes(q)) : false);

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesPeriod = periodFilter === 'all' || p.period === periodFilter;
      const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPeriod && matchesPriority;
    }),
    (p: MinistryWorkPlan) => p.startDate || p.date || '2026-01-01',
    datePreset,
    startDate,
    endDate
  );

  // Statistics
  const totalPlans = plans.length;
  const inProgressPlans = plans.filter((p) => p.status === 'En Progreso').length;
  const completedPlans = plans.filter((p) => p.status === 'Completado').length;
  const totalBudget = plans.reduce((sum, p) => sum + (p.budget || 0), 0);

  const totalTasksCount = plans.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const completedTasksCount = plans.reduce(
    (sum, p) => sum + (p.tasks?.filter((t) => t.completed).length || 0),
    0
  );
  const globalProgress = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : (completedPlans > 0 ? Math.round((completedPlans / Math.max(1, totalPlans)) * 100) : 0);

  // Handlers
  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormState({
      ...initialFormState,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setNewGoalInput('');
    setNewTaskInput('');
    setNewTaskAssignee('');
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (plan: MinistryWorkPlan) => {
    setEditingPlan(plan);
    setFormState({
      ministry: plan.ministry,
      title: plan.title,
      objective: plan.objective,
      period: plan.period,
      periodName: plan.periodName || '',
      startDate: plan.startDate,
      endDate: plan.endDate,
      responsibleLeader: plan.responsibleLeader,
      budget: plan.budget || 0,
      status: plan.status,
      priority: plan.priority,
      targetAudience: plan.targetAudience || '',
      goals: [...(plan.goals || [])],
      tasks: [...(plan.tasks || [])],
      notes: plan.notes || '',
      youtubeUrl: plan.youtubeUrl || '',
      date: plan.date || new Date().toISOString().split('T')[0],
    });
    setNewGoalInput('');
    setNewTaskInput('');
    setNewTaskAssignee('');
    setIsFormModalOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.title.trim()) return;

    if (editingPlan) {
      onUpdatePlan({
        ...formState,
        id: editingPlan.id,
      });
    } else {
      onAddPlan(formState);
    }
    setIsFormModalOpen(false);
    setEditingPlan(null);
  };

  const handleAddGoal = () => {
    if (!newGoalInput.trim()) return;
    setFormState((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoalInput.trim()],
    }));
    setNewGoalInput('');
  };

  const handleRemoveGoal = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index),
    }));
  };

  const handleAddTask = () => {
    if (!newTaskInput.trim()) return;
    const newTask: MinistryWorkPlanTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: newTaskInput.trim(),
      completed: false,
      assignedTo: newTaskAssignee.trim() || undefined,
    };
    setFormState((prev) => ({
      ...prev,
      tasks: [...prev.tasks, newTask],
    }));
    setNewTaskInput('');
    setNewTaskAssignee('');
  };

  const handleRemoveTask = (taskId: string) => {
    setFormState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  // Toggle task completed in card directly
  const handleToggleCardTask = (plan: MinistryWorkPlan, taskId: string) => {
    const updatedTasks = plan.tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );

    // Auto update plan status if all tasks are done
    const allDone = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    const newStatus = allDone && plan.status === 'En Progreso' ? 'Completado' : plan.status;

    onUpdatePlan({
      ...plan,
      tasks: updatedTasks,
      status: newStatus,
    });
  };

  // Quick change status on card
  const handleQuickStatusChange = (plan: MinistryWorkPlan, newStatus: MinistryWorkPlan['status']) => {
    onUpdatePlan({
      ...plan,
      status: newStatus,
    });
  };

  // Confirm delete
  const handleConfirmDelete = () => {
    if (planToDelete) {
      onDeletePlan(planToDelete.id);
      setPlanToDelete(null);
    }
  };

  // Copy plan summary
  const handleCopyPlan = (plan: MinistryWorkPlan) => {
    const goalsText = plan.goals && plan.goals.length > 0
      ? `\n🎯 *Metas:*\n${plan.goals.map((g, i) => `  ${i + 1}. ${g}`).join('\n')}`
      : '';
    const tasksText = plan.tasks && plan.tasks.length > 0
      ? `\n📋 *Tareas y Avance:*\n${plan.tasks.map((t) => `  ${t.completed ? '✅' : '⏳'} ${t.description}${t.assignedTo ? ` (${t.assignedTo})` : ''}`).join('\n')}`
      : '';

    const text = `📌 *PLANIFICACIÓN DE TRABAJO - ${ministryName.toUpperCase()}*
⭐ *Proyecto:* ${plan.title}
🗓️ *Período:* ${plan.period} (${plan.periodName || 'Vigente'})
📅 *Vigencia:* ${plan.startDate} al ${plan.endDate}
👤 *Responsable:* ${plan.responsibleLeader}
📊 *Estado:* ${plan.status} | *Prioridad:* ${plan.priority}
💰 *Presupuesto:* $${(plan.budget || 0).toLocaleString('es-MX')}

📖 *Objetivo Principal:*
${plan.objective}${goalsText}${tasksText}${plan.notes ? `\n\n📝 *Notas:* ${plan.notes}` : ''}`;

    navigator.clipboard.writeText(text);
    setCopiedId(plan.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleExpandCard = (id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* 1. Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
            style={{ backgroundColor: pageColor }}
          >
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Planes Totales
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-white">
              {totalPlans}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500 text-white shrink-0 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              En Progreso
            </span>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">
              {inProgressPlans}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 text-white shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Completados
            </span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {completedPlans}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500 text-white shrink-0 shadow-xs">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Presupuesto
            </span>
            <span className="text-lg font-black text-blue-600 dark:text-blue-400 truncate block">
              ${totalBudget.toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500 text-white shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
              Cumplimiento
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                {globalProgress}%
              </span>
              <div className="flex-1 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${globalProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Control & Search Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar plan de trabajo en ${ministryName}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Todos los Estados</option>
              <option value="Planificado">Planificado</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
              <option value="Pausado">Pausado</option>
            </select>

            {/* Period Filter */}
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Todos los Períodos</option>
              <option value="Mensual">Mensual</option>
              <option value="Trimestral">Trimestral</option>
              <option value="Semestral">Semestral</option>
              <option value="Anual">Anual</option>
              <option value="Proyecto Especial">Proyecto Especial</option>
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
            >
              <option value="all">Todas las Prioridades</option>
              <option value="Urgente">Urgente</option>
              <option value="Alta">Alta</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>

            {/* Create Button */}
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 hover:opacity-95"
              style={{ backgroundColor: pageColor }}
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Plan de Trabajo</span>
            </button>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
          <DateFilterControl
            preset={datePreset}
            startDate={startDate}
            endDate={endDate}
            onPresetChange={setDatePreset}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            label="Filtrar por Fechas de Vigencia"
          />
        </div>
      </div>

      {/* 3. Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg"
            style={{ backgroundColor: pageColor }}
          >
            <ListTodo className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
              No hay planes de trabajo registrados
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Diseña metas trimestrales, mensuales o proyectos especiales con objetivos, checklist de tareas y presupuesto para {ministryName}.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 rounded-2xl text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-2 cursor-pointer hover:opacity-95"
            style={{ backgroundColor: pageColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Primer Plan de Trabajo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPlans.map((plan) => {
            const planTasks = plan.tasks || [];
            const completedCount = planTasks.filter((t) => t.completed).length;
            const progressPercent =
              planTasks.length > 0
                ? Math.round((completedCount / planTasks.length) * 100)
                : plan.status === 'Completado'
                ? 100
                : plan.status === 'En Progreso'
                ? 50
                : 10;

            const isExpanded = !!expandedCards[plan.id];

            return (
              <div
                key={plan.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                {/* Header Strip */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {/* Tags & Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Priority */}
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                          plan.priority === 'Urgente'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                            : plan.priority === 'Alta'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                            : plan.priority === 'Media'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {plan.priority}
                      </span>

                      {/* Period */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{plan.period}{plan.periodName ? ` • ${plan.periodName}` : ''}</span>
                      </span>

                      {/* Budget Badge */}
                      {plan.budget && plan.budget > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center space-x-1">
                          <DollarSign className="w-3 h-3" />
                          <span>${plan.budget.toLocaleString('es-MX')}</span>
                        </span>
                      ) : null}
                    </div>

                    {/* Quick Status Select */}
                    <div className="flex items-center space-x-1.5">
                      <select
                        value={plan.status}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            plan,
                            e.target.value as MinistryWorkPlan['status']
                          )
                        }
                        className={`text-[11px] font-black px-2.5 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                          plan.status === 'Completado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : plan.status === 'En Progreso'
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                            : plan.status === 'Pausado'
                            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        <option value="Planificado">Planificado</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="Completado">Completado</option>
                        <option value="Pausado">Pausado</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Leader */}
                  <div>
                    <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight">
                      {plan.title}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center space-x-1 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-amber-500" />
                        <span>Resp: {plan.responsibleLeader}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{plan.startDate} al {plan.endDate}</span>
                      </span>
                      {plan.targetAudience && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {plan.targetAudience}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Objective */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                      Propósito / Objetivo
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      {plan.objective}
                    </p>
                  </div>

                  {/* Goals / Metas */}
                  {plan.goals && plan.goals.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center space-x-1">
                        <Target className="w-3 h-3 text-indigo-500" />
                        <span>Metas Específicas ({plan.goals.length})</span>
                      </span>
                      <ul className="space-y-1">
                        {plan.goals.map((g, idx) => (
                          <li
                            key={idx}
                            className="text-xs text-slate-600 dark:text-slate-300 flex items-start space-x-1.5"
                          >
                            <span className="text-indigo-500 font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Progress Bar & Tasks */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
                        <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Tareas & Actividades ({completedCount}/{planTasks.length})</span>
                      </span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {progressPercent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          progressPercent === 100
                            ? 'bg-emerald-500'
                            : progressPercent >= 50
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Interactive Tasks Checklist */}
                    {planTasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {(isExpanded ? planTasks : planTasks.slice(0, 3)).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => handleToggleCardTask(plan, task.id)}
                            className={`w-full text-left p-2 rounded-xl border transition-all flex items-start space-x-2.5 cursor-pointer ${
                              task.completed
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900/40 text-slate-400 line-through'
                                : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-amber-400'
                            }`}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0 text-xs">
                              <p className="leading-snug">{task.description}</p>
                              {task.assignedTo && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold block mt-0.5">
                                  Asignado a: {task.assignedTo}
                                </span>
                              )}
                            </div>
                          </button>
                        ))}

                        {planTasks.length > 3 && (
                          <button
                            type="button"
                            onClick={() => toggleExpandCard(plan.id)}
                            className="text-[11px] font-bold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center space-x-1 cursor-pointer pt-1"
                          >
                            <span>
                              {isExpanded
                                ? 'Ver menos tareas'
                                : `Ver ${planTasks.length - 3} tareas más...`}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Reference Video Buttons: In-App Player & Direct YouTube Link */}
                  {plan.youtubeUrl && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setYoutubeModal({
                            isOpen: true,
                            url: ensureAbsoluteUrl(plan.youtubeUrl),
                            title: plan.title,
                            subtitle: `${plan.period} • ${plan.responsibleLeader}`,
                            notes: plan.notes,
                          })
                        }
                        className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 font-bold text-xs flex items-center justify-center space-x-2 border border-red-200 dark:border-red-900/60 cursor-pointer transition-colors"
                      >
                        <Play className="w-3.5 h-3.5 fill-red-600 text-red-600 shrink-0" />
                        <span className="truncate">Reproducir Video / Tutorial</span>
                      </button>

                      <a
                        href={ensureAbsoluteUrl(plan.youtubeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors shrink-0"
                        title="Abrir directamente en la web o app de YouTube"
                      >
                        <span>Abrir en YouTube</span>
                        <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer: PDF/JPG Export, Share, Edit, Delete */}
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-400">
                    Reg: {plan.date || plan.startDate}
                  </span>

                  <div className="flex flex-wrap items-center space-x-1.5">
                    {/* Share & Export Document (PDF / JPG / Carta Format) */}
                    <button
                      type="button"
                      onClick={() => setShareModalPlan(plan)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center space-x-1.5 border border-indigo-200 dark:border-indigo-900 cursor-pointer transition-colors"
                      title="Exportar a PDF, Imagen JPG o WhatsApp en formato Carta"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir / PDF / JPG</span>
                    </button>

                    {/* Quick WhatsApp Text Copy */}
                    <button
                      type="button"
                      onClick={() => handleCopyPlan(plan)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Copiar texto rápido para WhatsApp"
                    >
                      {copiedId === plan.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    {/* Edit Button - 100% Functional */}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(plan)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center space-x-1 border border-blue-200 dark:border-blue-900 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    {/* Delete Button - 100% Functional */}
                    <button
                      type="button"
                      onClick={() => setPlanToDelete(plan)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center space-x-1 border border-rose-200 dark:border-rose-900 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Form Modal (Create / Edit) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 bg-white dark:bg-slate-900 px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: pageColor }}
                >
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    {editingPlan ? 'Editar Plan de Trabajo' : 'Nuevo Plan de Trabajo'}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {ministryName}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Título del Proyecto o Plan *
                </label>
                <input
                  type="text"
                  required
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  placeholder="Ej: Taller de Capacitación, Retiro Anual, Campaña de Servicio..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-semibold"
                />
              </div>

              {/* Period and Period Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tipo de Período
                  </label>
                  <select
                    value={formState.period}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        period: e.target.value as MinistryWorkPlan['period'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:outline-hidden"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Proyecto Especial">Proyecto Especial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Identificador / Época
                  </label>
                  <input
                    type="text"
                    value={formState.periodName || ''}
                    onChange={(e) => setFormState({ ...formState, periodName: e.target.value })}
                    placeholder="Ej: 1er Trimestre 2026, Semana Santa, Octubre..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Fecha de Inicio *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.startDate}
                    onChange={(e) => setFormState({ ...formState, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Fecha de Finalización *
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.endDate}
                    onChange={(e) => setFormState({ ...formState, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Responsible Leader & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Líder o Equipo Responsable *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.responsibleLeader}
                    onChange={(e) =>
                      setFormState({ ...formState, responsibleLeader: e.target.value })
                    }
                    placeholder="Ej: Pastor de Alabanza, Directora de Danza..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Presupuesto Estimado ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formState.budget || 0}
                    onChange={(e) =>
                      setFormState({ ...formState, budget: Number(e.target.value) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Priority, Status & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Prioridad
                  </label>
                  <select
                    value={formState.priority}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        priority: e.target.value as MinistryWorkPlan['priority'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Urgente">Urgente</option>
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Estado
                  </label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({
                        ...formState,
                        status: e.target.value as MinistryWorkPlan['status'],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Planificado">Planificado</option>
                    <option value="En Progreso">En Progreso</option>
                    <option value="Completado">Completado</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Audiencia
                  </label>
                  <input
                    type="text"
                    value={formState.targetAudience || ''}
                    onChange={(e) =>
                      setFormState({ ...formState, targetAudience: e.target.value })
                    }
                    placeholder="Ej: Jóvenes, Damas, Músicos..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Propósito / Objetivo General *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formState.objective}
                  onChange={(e) => setFormState({ ...formState, objective: e.target.value })}
                  placeholder="Describe la meta espiritual y práctica que se busca alcanzar..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-hidden"
                />
              </div>

              {/* Goals Builder */}
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center space-x-1">
                  <Target className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Metas Específicas / Entregables</span>
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGoalInput}
                    onChange={(e) => setNewGoalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddGoal();
                      }
                    }}
                    placeholder="Escribe una meta y pulsa Agregar..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddGoal}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {formState.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {formState.goals.map((g, i) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1.5"
                      >
                        <span>{g}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGoal(i)}
                          className="text-indigo-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks Checklist Builder */}
              <div className="space-y-2 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase flex items-center space-x-1">
                  <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Checklist de Actividades y Tareas</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newTaskInput}
                    onChange={(e) => setNewTaskInput(e.target.value)}
                    placeholder="Descripción de la tarea..."
                    className="sm:col-span-2 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:outline-hidden"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newTaskAssignee}
                      onChange={(e) => setNewTaskAssignee(e.target.value)}
                      placeholder="Asignado a..."
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir</span>
                    </button>
                  </div>
                </div>

                {formState.tasks.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {formState.tasks.map((task) => (
                      <div
                        key={task.id}
                        className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                tasks: prev.tasks.map((t) =>
                                  t.id === task.id ? { ...t, completed: e.target.checked } : t
                                ),
                              }))
                            }
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span
                            className={`truncate ${
                              task.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            {task.description}
                          </span>
                          {task.assignedTo && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold shrink-0">
                              ({task.assignedTo})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* YouTube / Video URL & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Enlace de Video (YouTube, Facebook, TikTok, Instagram, etc.)
                  </label>
                  <input
                    type="url"
                    value={formState.youtubeUrl || ''}
                    onChange={(e) => setFormState({ ...formState, youtubeUrl: e.target.value })}
                    placeholder="https://... (YouTube, Facebook, TikTok, Instagram o MP4)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Notas u Observaciones
                  </label>
                  <input
                    type="text"
                    value={formState.notes || ''}
                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                    placeholder="Materiales requeridos, lugares, etc."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-white font-extrabold text-xs shadow-md transition-all cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: pageColor }}
                >
                  {editingPlan ? 'Guardar Cambios' : 'Crear Plan de Trabajo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal (100% Functional) */}
      {planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-slate-800 dark:text-white">
                ¿Eliminar Plan de Trabajo?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estás a punto de eliminar el plan{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  "{planToDelete.title}"
                </strong>{' '}
                ({planToDelete.period}). Esta acción removerá el plan y su checklist de tareas.
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-colors cursor-pointer"
              >
                Sí, Eliminar Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. YouTube Modal */}
      <YouTubeModal
        isOpen={youtubeModal.isOpen}
        onClose={() => setYoutubeModal({ isOpen: false, title: '' })}
        videoUrl={youtubeModal.url}
        title={youtubeModal.title}
        subtitle={youtubeModal.subtitle}
        notes={youtubeModal.notes}
      />

      {/* 7. Work Plan Share & Export Modal (Carta / Letter Format, PDF, JPG, WhatsApp) */}
      {shareModalPlan && (
        <MinistryWorkPlanShareModal
          isOpen={!!shareModalPlan}
          onClose={() => setShareModalPlan(null)}
          plan={shareModalPlan}
          ministryName={ministryName}
          ministry={ministry}
          pageColor={pageColor}
          config={config}
        />
      )}
    </div>
  );
};
