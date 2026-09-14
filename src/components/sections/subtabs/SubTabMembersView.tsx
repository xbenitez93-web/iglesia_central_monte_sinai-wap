import React, { useState } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  Trash2,
  Edit2,
  X,
  Search,
  UserCheck,
  User,
} from 'lucide-react';
import { SubTabMember, CustomSectionSubTab } from '../../../types';

interface SubTabMembersViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const SubTabMembersView: React.FC<SubTabMembersViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const members = subTab.membersData?.members || [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<SubTabMember>>({
    name: '',
    role: '',
    phone: '',
    email: '',
    photoUrl: '',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Activo',
    notes: '',
  });

  const filteredMembers = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.role.toLowerCase().includes(search.toLowerCase()) ||
      (m.phone && m.phone.includes(search)) ||
      (m.email && m.email.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleOpenAdd = () => {
    setForm({
      name: '',
      role: '',
      phone: '',
      email: '',
      photoUrl: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Activo',
      notes: '',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: SubTabMember) => {
    setForm({ ...member });
    setEditingId(member.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = members.filter((m) => m.id !== id);
    onUpdateSubTab({
      ...subTab,
      membersData: { members: updated },
    });
    onShowToast('Integrante eliminado', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.role?.trim()) {
      onShowToast('El nombre y el rol son obligatorios', 'danger');
      return;
    }

    const newMember: SubTabMember = {
      id: editingId || `mem_${Date.now()}`,
      name: form.name.trim(),
      role: form.role.trim(),
      phone: form.phone || '',
      email: form.email || '',
      photoUrl: form.photoUrl || '',
      joinDate: form.joinDate || new Date().toISOString().split('T')[0],
      status: form.status || 'Activo',
      notes: form.notes || '',
    };

    let updatedList: SubTabMember[];
    if (editingId) {
      updatedList = members.map((m) => (m.id === editingId ? newMember : m));
      onShowToast('Integrante actualizado con éxito', 'success');
    } else {
      updatedList = [...members, newMember];
      onShowToast('Integrante agregado al equipo', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      membersData: { members: updatedList },
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-slate-900 dark:text-white text-base">
              {subTab.name || 'Directorio de Integrantes & Equipo'}
            </h3>
            <p className="text-xs text-slate-500">
              {members.length} miembros registrados
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
              placeholder="Buscar integrante..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-40 sm:w-48"
            />
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Integrante</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex flex-wrap gap-1.5">
        {['all', 'Activo', 'En Capacitación', 'De Permiso', 'Inactivo'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
              statusFilter === st
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            {st === 'all' ? `Todos (${members.length})` : st}
          </button>
        ))}
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
          <UserCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No hay integrantes registrados</h4>
          <p className="text-xs text-slate-500">Agrega los miembros del equipo con el botón "Nuevo Integrante".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((m) => {
            const statusStyles: Record<string, string> = {
              Activo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
              'En Capacitación': 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
              'De Permiso': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
              Inactivo: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            };

            return (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    {m.photoUrl ? (
                      <img
                        src={m.photoUrl}
                        alt={m.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-base flex items-center justify-center border-2 border-teal-500/30">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white leading-tight">
                        {m.name}
                      </h4>
                      <p className="text-xs font-bold text-teal-600 dark:text-teal-400 mt-0.5">
                        {m.role}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${
                          statusStyles[m.status] || statusStyles.Activo
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(m)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact triggers & info */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    {m.phone && (
                      <a
                        href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{m.phone}</span>
                      </a>
                    )}

                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                      >
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[120px]">{m.email}</span>
                      </a>
                    )}
                  </div>

                  {m.notes && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      «{m.notes}»
                    </p>
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
                <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Integrante' : 'Nuevo Integrante'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Actualiza los datos del miembro o rol' : 'Registra un nuevo miembro del equipo o ministerio'}
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
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: David Hernández"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Rol / Cargo *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="Ej: Baterista, Coordinador"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estado
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Activo">Activo</option>
                      <option value="En Capacitación">En Capacitación</option>
                      <option value="De Permiso">De Permiso</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono / WhatsApp
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
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="miembro@correo.com"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Foto de Perfil URL (Opcional)
                  </label>
                  <input
                    type="url"
                    value={form.photoUrl}
                    onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                    placeholder="https://ejemplo.com/foto.jpg"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notas Adicionales
                  </label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Observaciones, disponibilidad..."
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
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
