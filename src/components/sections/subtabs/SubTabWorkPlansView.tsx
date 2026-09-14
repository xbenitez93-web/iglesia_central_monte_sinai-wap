import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Trash2,
  Edit2,
  X,
  Search,
  CheckSquare,
  Briefcase,
} from 'lucide-react';
import { SubTabWorkPlan, SubTabWorkPlanMilestone, CustomSectionSubTab } from '../../../types';

interface SubTabWorkPlansViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabWorkPlansView: React.FC<SubTabWorkPlansViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const plans = subTab.workPlansData?.plans || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabWorkPlan>>({
    title: '',
    objective: '',
    responsible: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    progress: 0,
    status: 'Planificado',
    milestones: [],
    notes: '',
  });

  const [milestoneInput, setMilestoneInput] = useState('');

  const filteredPlans = plans.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.objective && p.objective.toLowerCase().includes(search.toLowerCase())) ||
      (p.responsible && p.responsible.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      objective: '',
      responsible: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      progress: 0,
      status: 'Planificado',
      milestones: [],
      notes: '',
    });
    setEditingId(null);
    setMilestoneInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: SubTabWorkPlan) => {
    setForm({ ...plan, milestones: [...(plan.milestones || [])] });
    setEditingId(plan.id);
    setMilestoneInput('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = plans.filter((p) => p.id !== id);
    onUpdateSubTab({
      ...subTab,
      workPlansData: { plans: updated },
    });
    onShowToast('Plan de trabajo eliminado', 'info');
  };

  const handleToggleMilestone = (planId: string, milestoneId: string) => {
    const updated = plans.map((p) => {
      if (p.id !== planId) return p;
      const updatedMilestones = (p.milestones || []).map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      );
      const completedCount = updatedMilestones.filter((m) => m.completed).length;
      const newProgress =
        updatedMilestones.length > 0
          ? Math.round((completedCount / updatedMilestones.length) * 100)
          : p.progress;
      const newStatus =
        newProgress === 100 ? ('Completado' as const) : newProgress > 0 ? ('En Progreso' as const) : p.status;

      return {
        ...p,
        milestones: updatedMilestones,
        progress: newProgress,
        status: newStatus,
      };
    });

    onUpdateSubTab({
      ...subTab,
      workPlansData: { plans: updated },
    });
  };

  const handleAddMilestoneToForm = () => {
    if (!milestoneInput.trim()) return;
    const newM: SubTabWorkPlanMilestone = {
      id: `ms_${Date.now()}`,
      title: milestoneInput.trim(),
      completed: false,
    };
    setForm((prev) => ({
      ...prev,
      milestones: [...(prev.milestones || []), newM],
    }));
    setMilestoneInput('');
  };

  const handleRemoveMilestoneFromForm = (id: string) => {
    setForm((prev) => ({
      ...prev,
      milestones: (prev.milestones || []).filter((m) => m.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim()) {
      onShowToast('El título del plan es obligatorio', 'danger');
      return;
    }

    const completedMilestones = (form.milestones || []).filter((m) => m.completed).length;
    const calcProgress =
      form.milestones && form.milestones.length > 0
        ? Math.round((completedMilestones / form.milestones.length) * 100)
        : form.progress || 0;

    const newPlan: SubTabWorkPlan = {
      id: editingId || `plan_${Date.now()}`,
      title: form.title.trim(),
      objective: form.objective || '',
      responsible: form.responsible || '',
      startDate: form.startDate || '',
      dueDate: form.dueDate || '',
      progress: calcProgress,
      status: form.status || 'Planificado',
      milestones: form.milestones || [],
      notes: form.notes || '',
    };

    let updatedList: SubTabWorkPlan[];
    if (editingId) {
      updatedList = plans.map((p) => (p.id === editingId ? newPlan : p));
      onShowToast('Plan de trabajo actualizado', 'success');
    } else {
      updatedList = [...plans, newPlan];
      onShowToast('Nuevo plan de trabajo agregado', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      workPlansData: { plans: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Planificación de Trabajo & Proyectos'}
            </h3>
            <p className="text-xs text-slate-500">
              {plans.length} planes y metas registradas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plan..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'Planificado', 'En Progreso', 'Completado', 'En Pausa'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {st === 'all' ? `Todos (${plans.length})` : st}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {filteredPlans.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <CheckSquare className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay planes registrados</h4>
          <p className="text-xs text-slate-500">Crea tu primer plan de trabajo, objetivos y metas con el botón "Nuevo Plan".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlans.map((plan) => {
            const statusColors: Record<string, string> = {
              Planificado: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
              'En Progreso': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
              Completado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
              'En Pausa': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            };

            return (
              <div
                key={plan.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        statusColors[plan.status] || statusColors.Planificado
                      }`}
                    >
                      {plan.status}
                    </span>

                    {canEdit && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(plan)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(plan.id)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                      {plan.title}
                    </h4>
                    {plan.objective && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {plan.objective}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-600 dark:text-slate-300">Progreso General</span>
                      <span className="text-purple-600 dark:text-purple-400">{plan.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${plan.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  {plan.milestones && plan.milestones.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block">
                        Hitos & Tareas ({plan.milestones.filter((m) => m.completed).length}/{plan.milestones.length})
                      </span>
                      <div className="space-y-1">
                        {plan.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => canEdit && handleToggleMilestone(plan.id, m.id)}
                            className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              m.completed
                                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-slate-400 line-through'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-purple-300'
                            }`}
                          >
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="font-medium flex-1">{m.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  {plan.responsible && (
                    <div className="flex items-center space-x-1.5 truncate">
                      <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">Resp: <strong>{plan.responsible}</strong></span>
                    </div>
                  )}

                  {plan.dueDate && (
                    <div className="flex items-center space-x-1.5 justify-end">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Entrega: {plan.dueDate}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Plan de Trabajo' : 'Nuevo Plan de Trabajo'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica objetivos, fechas o hitos' : 'Planifica metas estratégicas y asigna tareas'}
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
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del Proyecto o Plan *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Organización de Retiro Espiritual 2026"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Objetivo Principal
                  </label>
                  <textarea
                    rows={2}
                    value={form.objective}
                    onChange={(e) => setForm({ ...form, objective: e.target.value })}
                    placeholder="Meta o propósito central a alcanzar..."
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Responsable / Encargado
                    </label>
                    <input
                      type="text"
                      value={form.responsible}
                      onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                      placeholder="Ej: Diácono Carlos"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estado Actual
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Planificado">Planificado</option>
                      <option value="En Progreso">En Progreso</option>
                      <option value="Completado">Completado</option>
                      <option value="En Pausa">En Pausa</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Inicio
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha Límite
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Milestones in Form */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                    Hitos & Tareas Específicas
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={milestoneInput}
                      onChange={(e) => setMilestoneInput(e.target.value)}
                      placeholder="Ej: Reservar local, contratar sonido..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMilestoneToForm();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddMilestoneToForm}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {(form.milestones || []).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <span className="font-medium">{m.title}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestoneFromForm(m.id)}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {(form.milestones || []).length === 0 && (
                      <p className="text-[11px] text-slate-400 italic py-1">No hay hitos añadidos todavía.</p>
                    )}
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
