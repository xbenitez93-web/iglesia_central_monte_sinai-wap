import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Edit2,
  X,
  Search,
  Mic,
  FileCheck,
} from 'lucide-react';
import { SubTabCastingAudition, CustomSectionSubTab } from '../../../types';

interface SubTabCastingViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabCastingView: React.FC<SubTabCastingViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const auditions = subTab.castingData?.auditions || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabCastingAudition>>({
    candidateName: '',
    roleOrPosition: '',
    auditionDate: new Date().toISOString().split('T')[0],
    phone: '',
    email: '',
    status: 'Pendiente',
    score: 8,
    requirementsMet: '',
    juryNotes: '',
    videoOrAudioSampleUrl: '',
    photoUrl: '',
  });

  const filteredAuditions = auditions.filter((a) => {
    const matchSearch =
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.roleOrPosition.toLowerCase().includes(search.toLowerCase()) ||
      (a.juryNotes && a.juryNotes.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setForm({
      candidateName: '',
      roleOrPosition: '',
      auditionDate: new Date().toISOString().split('T')[0],
      phone: '',
      email: '',
      status: 'Pendiente',
      score: 8,
      requirementsMet: '',
      juryNotes: '',
      videoOrAudioSampleUrl: '',
      photoUrl: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (audition: SubTabCastingAudition) => {
    setForm({ ...audition });
    setEditingId(audition.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = auditions.filter((a) => a.id !== id);
    onUpdateSubTab({
      ...subTab,
      castingData: { auditions: updated },
    });
    onShowToast('Casting / Postulante eliminado', 'info');
  };

  const handleQuickStatusChange = (id: string, newStatus: SubTabCastingAudition['status']) => {
    const updated = auditions.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    onUpdateSubTab({
      ...subTab,
      castingData: { auditions: updated },
    });
    onShowToast(`Estado actualizado a «${newStatus}»`, 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.candidateName?.trim() || !form.roleOrPosition?.trim()) {
      onShowToast('El nombre del postulante y el rol al que audiciona son obligatorios', 'danger');
      return;
    }

    const newAudition: SubTabCastingAudition = {
      id: editingId || `cast_${Date.now()}`,
      candidateName: form.candidateName.trim(),
      roleOrPosition: form.roleOrPosition.trim(),
      auditionDate: form.auditionDate || new Date().toISOString().split('T')[0],
      phone: form.phone || '',
      email: form.email || '',
      status: form.status || 'Pendiente',
      score: form.score || 8,
      requirementsMet: form.requirementsMet || '',
      juryNotes: form.juryNotes || '',
      videoOrAudioSampleUrl: form.videoOrAudioSampleUrl || '',
      photoUrl: form.photoUrl || '',
    };

    let updatedList: SubTabCastingAudition[];
    if (editingId) {
      updatedList = auditions.map((a) => (a.id === editingId ? newAudition : a));
      onShowToast('Audición actualizada', 'success');
    } else {
      updatedList = [...auditions, newAudition];
      onShowToast('Postulante registrado en casting', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      castingData: { auditions: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Casting, Audiciones & Evaluaciones'}
            </h3>
            <p className="text-xs text-slate-500">
              {auditions.length} candidatos evaluados
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
              placeholder="Buscar postulante o rol..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-56"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Audición</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'Aprobado', 'En Revisión', 'Pendiente', 'No Seleccionado'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-violet-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {st === 'all' ? `Todos (${auditions.length})` : st}
          </button>
        ))}
      </div>

      {/* Auditions Grid */}
      {filteredAuditions.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <Mic className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay audiciones registradas</h4>
          <p className="text-xs text-slate-500">Registra audiciones de teatro, coro, música o danza con el botón "Nueva Audición".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAuditions.map((aud) => {
            const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
              Aprobado: { bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', icon: CheckCircle },
              'En Revisión': { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', icon: Clock },
              Pendiente: { bg: 'bg-blue-100 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', icon: Clock },
              'No Seleccionado': { bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300', icon: AlertCircle },
            };
            const currentStatus = statusConfig[aud.status] || statusConfig.Pendiente;
            const Icon = currentStatus.icon;

            return (
              <div
                key={aud.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${currentStatus.bg} ${currentStatus.text}`}>
                        <Icon className="w-3 h-3" />
                        <span>{aud.status}</span>
                      </span>

                      {aud.score !== undefined && (
                        <span className="flex items-center space-x-0.5 text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{aud.score}/10</span>
                        </span>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(aud)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(aud.id)}
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
                      {aud.candidateName}
                    </h4>
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                      Rol / Aspiración: <strong>{aud.roleOrPosition}</strong>
                    </p>
                  </div>

                  {aud.juryNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                      <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">
                        Observaciones del Jurado:
                      </span>
                      <p className="italic">«{aud.juryNotes}»</p>
                    </div>
                  )}
                </div>

                {/* Status Quick Switch */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Audición: {aud.auditionDate}</span>
                    {aud.phone && <span>Tel: {aud.phone}</span>}
                  </div>

                  {canEdit && (
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(aud.id, 'Aprobado')}
                        className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 hover:bg-emerald-100 text-[10px] font-bold"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(aud.id, 'En Revisión')}
                        className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 hover:bg-amber-100 text-[10px] font-bold"
                      >
                        Revisar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(aud.id, 'No Seleccionado')}
                        className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 text-[10px] font-bold"
                      >
                        Descartar
                      </button>
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
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Audición' : 'Nueva Postulación / Audición'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Actualiza la ficha de casting y calificación' : 'Registra aspirantes, roles y notas de evaluación'}
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
                    Nombre del Postulante *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.candidateName}
                    onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
                    placeholder="Ej: Sofía Ramírez"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rol o Personaje *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.roleOrPosition}
                      onChange={(e) => setForm({ ...form, roleOrPosition: e.target.value })}
                      placeholder="Ej: Voz Contralto, Actor Principal"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estado de Decisión
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Aprobado">Aprobado</option>
                      <option value="En Revisión">En Revisión</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="No Seleccionado">No Seleccionado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Puntuación (1 al 10)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={form.score}
                      onChange={(e) => setForm({ ...form, score: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Audición
                    </label>
                    <input
                      type="date"
                      value={form.auditionDate}
                      onChange={(e) => setForm({ ...form, auditionDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Muestra Audio / Video URL
                    </label>
                    <input
                      type="url"
                      value={form.videoOrAudioSampleUrl}
                      onChange={(e) => setForm({ ...form, videoOrAudioSampleUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notas y Veredicto del Jurado
                  </label>
                  <textarea
                    rows={2}
                    value={form.juryNotes}
                    onChange={(e) => setForm({ ...form, juryNotes: e.target.value })}
                    placeholder="Afinación, presencia escénica, puntualidad..."
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
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Audición
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
