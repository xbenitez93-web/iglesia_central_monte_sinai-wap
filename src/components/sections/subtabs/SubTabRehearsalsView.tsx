import React, { useState } from 'react';
import {
  Timer,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  User,
  Trash2,
  Edit2,
  X,
  Search,
  ListOrdered,
  CalendarCheck,
  Mic2,
} from 'lucide-react';
import { SubTabRehearsal, SubTabRehearsalAttendee, CustomSectionSubTab } from '../../../types';

interface SubTabRehearsalsViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabRehearsalsView: React.FC<SubTabRehearsalsViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const rehearsals = subTab.rehearsalsData?.rehearsals || [];
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabRehearsal>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '21:00',
    location: 'Santuario Principal',
    agendaOrSetlist: '',
    directorOrLeader: '',
    status: 'Programado',
    attendees: [],
  });

  const [attendeeInput, setAttendeeInput] = useState('');

  const filteredRehearsals = rehearsals.filter((r) => {
    return (
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase())) ||
      (r.directorOrLeader && r.directorOrLeader.toLowerCase().includes(search.toLowerCase())) ||
      (r.agendaOrSetlist && r.agendaOrSetlist.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleOpenAdd = () => {
    setForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '19:00',
      endTime: '21:00',
      location: 'Santuario Principal',
      agendaOrSetlist: '',
      directorOrLeader: '',
      status: 'Programado',
      attendees: [],
    });
    setEditingId(null);
    setAttendeeInput('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rehearsal: SubTabRehearsal) => {
    setForm({ ...rehearsal, attendees: [...(rehearsal.attendees || [])] });
    setEditingId(rehearsal.id);
    setAttendeeInput('');
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = rehearsals.filter((r) => r.id !== id);
    onUpdateSubTab({
      ...subTab,
      rehearsalsData: { rehearsals: updated },
    });
    onShowToast('Ensayo eliminado', 'info');
  };

  const handleToggleAttendance = (rehearsalId: string, attendeeIndex: number) => {
    const updated = rehearsals.map((r) => {
      if (r.id !== rehearsalId) return r;
      const atts = [...(r.attendees || [])];
      if (atts[attendeeIndex]) {
        atts[attendeeIndex].attended = !atts[attendeeIndex].attended;
      }
      return { ...r, attendees: atts };
    });

    onUpdateSubTab({
      ...subTab,
      rehearsalsData: { rehearsals: updated },
    });
  };

  const handleAddAttendeeToForm = () => {
    if (!attendeeInput.trim()) return;
    const newA: SubTabRehearsalAttendee = {
      name: attendeeInput.trim(),
      confirmed: true,
      attended: false,
    };
    setForm((prev) => ({
      ...prev,
      attendees: [...(prev.attendees || []), newA],
    }));
    setAttendeeInput('');
  };

  const handleRemoveAttendeeFromForm = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attendees: (prev.attendees || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.date) {
      onShowToast('El nombre del ensayo y la fecha son obligatorios', 'danger');
      return;
    }

    const newRehearsal: SubTabRehearsal = {
      id: editingId || `reh_${Date.now()}`,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime || '19:00',
      endTime: form.endTime || '',
      location: form.location || 'Santuario Principal',
      agendaOrSetlist: form.agendaOrSetlist || '',
      directorOrLeader: form.directorOrLeader || '',
      status: form.status || 'Programado',
      attendees: form.attendees || [],
    };

    let updatedList: SubTabRehearsal[];
    if (editingId) {
      updatedList = rehearsals.map((r) => (r.id === editingId ? newRehearsal : r));
      onShowToast('Ensayo actualizado', 'success');
    } else {
      updatedList = [...rehearsals, newRehearsal];
      onShowToast('Ensayo programado exitosamente', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      rehearsalsData: { rehearsals: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Ensayos, Prácticas & Asistencia'}
            </h3>
            <p className="text-xs text-slate-500">
              {rehearsals.length} sesiones de ensayo programadas
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
              placeholder="Buscar ensayo..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programar Ensayo</span>
            </button>
          )}
        </div>
      </div>

      {/* Rehearsals Grid */}
      {filteredRehearsals.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <CalendarCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay ensayos programados</h4>
          <p className="text-xs text-slate-500">Programa la próxima práctica con el botón "Programar Ensayo".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRehearsals.map((reh) => {
            const attendedCount = (reh.attendees || []).filter((a) => a.attended).length;
            const totalAttendees = (reh.attendees || []).length;

            return (
              <div
                key={reh.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                        {reh.date}
                      </span>
                      <span className="flex items-center space-x-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{reh.startTime}{reh.endTime ? ` - ${reh.endTime}` : ''}</span>
                      </span>
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(reh)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(reh.id)}
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
                      {reh.title}
                    </h4>
                    {reh.location && (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{reh.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Agenda / Setlist */}
                  {reh.agendaOrSetlist && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <span className="font-extrabold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center space-x-1">
                        <ListOrdered className="w-3 h-3" />
                        <span>Temas / Repertorio a Ensayar:</span>
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                        {reh.agendaOrSetlist}
                      </p>
                    </div>
                  )}

                  {/* Attendees & Attendance Tracker */}
                  {reh.attendees && reh.attendees.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                        <span>Control de Asistencia</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {attendedCount} / {totalAttendees} Presentes
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                        {reh.attendees.map((att, attIdx) => (
                          <div
                            key={attIdx}
                            onClick={() => canEdit && handleToggleAttendance(reh.id, attIdx)}
                            className={`flex items-center space-x-1.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              att.attended
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-bold'
                                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {att.attended ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {reh.directorOrLeader && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Director / Líder: <strong>{reh.directorOrLeader}</strong></span>
                  </div>
                )}
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
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Mic2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Ensayo' : 'Programar Nuevo Ensayo'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica el horario, repertorio o asistentes' : 'Planifica una sesión de ensayo, repertorio y pase de lista'}
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
                    Nombre del Ensayo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Ensayo General Alabanza Sábado"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Inicio
                    </label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fin
                    </label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lugar / Salón
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Ej: Santuario Principal"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Director / Encargado
                    </label>
                    <input
                      type="text"
                      value={form.directorOrLeader}
                      onChange={(e) => setForm({ ...form, directorOrLeader: e.target.value })}
                      placeholder="Ej: Líder David"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Repertorio / Setlist / Agenda
                  </label>
                  <textarea
                    rows={2}
                    value={form.agendaOrSetlist}
                    onChange={(e) => setForm({ ...form, agendaOrSetlist: e.target.value })}
                    placeholder="1. Digno y Santo (G)&#10;2. La Bondad de Dios (D)&#10;3. Grande es el Señor (C)"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                {/* Attendees List in Form */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-white">
                    Integrantes Convocados al Ensayo
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      placeholder="Nombre del integrante..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAttendeeToForm();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddAttendeeToForm}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-sm"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {(form.attendees || []).map((att, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                      >
                        <span>{att.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendeeFromForm(idx)}
                          className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Ensayo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
