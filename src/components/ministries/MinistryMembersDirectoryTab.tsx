import React, { useState } from 'react';
import { Member, MemberStatus, MinistryRole } from '../../types';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Filter,
  Plus,
  X,
  Edit2,
  Trash2,
  Heart,
  Share2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Shield,
  Check,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { PhotoCaptureModal } from '../PhotoCaptureModal';

interface MinistryMembersDirectoryTabProps {
  ministryId: string;
  ministryName: string;
  themeColor: string;
  members: Member[];
  onUpdateMember: (member: Member) => void;
  onAddMember: (member: Omit<Member, 'id'>) => void;
}

export const MinistryMembersDirectoryTab: React.FC<MinistryMembersDirectoryTabProps> = ({
  ministryId,
  ministryName,
  themeColor,
  members,
  onUpdateMember,
  onAddMember,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [baptizedFilter, setBaptizedFilter] = useState<string>('all');

  // Modals
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [unlinkConfirmMember, setUnlinkConfirmMember] = useState<Member | null>(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // New member form
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Activo' as MemberStatus,
    baptized: true,
    birthDate: '',
    baptismDate: '',
    ministryRoles: [] as MinistryRole[],
    notes: '',
    photoUrl: '',
  });

  // Filter members who belong to this ministry
  const ministryMembers = members.filter((m) => {
    // Check if explicitly has ministryId in ministries array or matches by legacy role
    const hasMinistryTag = m.ministries && m.ministries.includes(ministryId);
    if (hasMinistryTag) return true;

    // Fallback heuristic for legacy data
    if (ministryId === 'worship' && m.ministryRoles?.some((r) => r.includes('Alabanza') || r.includes('Músico') || r.includes('Sonido'))) return true;
    if (ministryId === 'women' && m.ministryRoles?.some((r) => r.includes('Damas'))) return true;
    if (ministryId === 'ushers' && m.ministryRoles?.some((r) => r.includes('Ujier') || r.includes('Recepción'))) return true;

    return false;
  });

  // Other members available in church directory to link
  const nonMinistryMembers = members.filter(
    (m) => !ministryMembers.some((mm) => mm.id === m.id)
  );

  const filteredMembers = ministryMembers.filter((m) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.notes ? m.notes.toLowerCase().includes(q) : false);

    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    const matchesBaptism =
      baptizedFilter === 'all' ||
      (baptizedFilter === 'yes' && m.baptized) ||
      (baptizedFilter === 'no' && !m.baptized);

    return matchesSearch && matchesStatus && matchesBaptism;
  });

  const activeCount = ministryMembers.filter((m) => m.status === 'Activo').length;
  const baptizedCount = ministryMembers.filter((m) => m.baptized).length;

  const handleLinkMember = (member: Member) => {
    const currentMinistries = member.ministries || [];
    if (!currentMinistries.includes(ministryId)) {
      onUpdateMember({
        ...member,
        ministries: [...currentMinistries, ministryId],
      });
    }
  };

  const handleUnlinkMember = (member: Member) => {
    const currentMinistries = member.ministries || [];
    onUpdateMember({
      ...member,
      ministries: currentMinistries.filter((id) => id !== ministryId),
    });
    setUnlinkConfirmMember(null);
  };

  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    onAddMember({
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      status: formData.status,
      baptized: formData.baptized,
      birthDate: formData.birthDate || new Date().toISOString().split('T')[0],
      baptismDate: formData.baptismDate || undefined,
      ministries: [ministryId],
      ministryRoles: formData.ministryRoles,
      notes: formData.notes.trim(),
      photoUrl: formData.photoUrl || undefined,
      joinDate: new Date().toISOString().split('T')[0],
    });

    setIsNewMemberModalOpen(false);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      status: 'Activo',
      baptized: true,
      birthDate: '',
      baptismDate: '',
      ministryRoles: [],
      notes: '',
      photoUrl: '',
    });
  };

  const handleUpdateExistingMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editingMember.fullName.trim()) return;

    onUpdateMember(editingMember);
    setEditingMember(null);
  };

  const handlePrintRoster = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Ministry Stats & Action Bar */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: themeColor }}
          >
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Integrantes del Ministerio de {ministryName}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {ministryMembers.length} Registrados
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Miembros del Directorio general asignados oficialmente a este ministerio
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintRoster}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Imprimir lista de integrantes"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir Padrón</span>
          </button>

          <button
            type="button"
            onClick={() => setIsLinkModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
          >
            <Plus className="w-4 h-4 text-indigo-500" />
            <span>Vincular del Directorio ({nonMinistryMembers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setIsNewMemberModalOpen(true)}
            className="px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md"
            style={{ backgroundColor: themeColor }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Nuevo Miembro</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Integrantes
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {ministryMembers.length}
          </span>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Miembros Activos
          </span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeCount}
          </span>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Bautizados
          </span>
          <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
            {baptizedCount}
          </span>
        </div>

        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            En Prueba / Nuevos
          </span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {ministryMembers.filter((m) => m.status === 'En Prueba').length}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar integrante de ${ministryName} por nombre, teléfono o correo...`}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-2 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">Todos los Estados</option>
            <option value="Activo">Activo</option>
            <option value="En Prueba">En Prueba</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Visita">Visita</option>
          </select>

          <select
            value={baptizedFilter}
            onChange={(e) => setBaptizedFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="all">Bautismo (Todos)</option>
            <option value="yes">Bautizados</option>
            <option value="no">No Bautizados</option>
          </select>
        </div>
      </div>

      {/* Member Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-white/90 shadow-md"
            style={{ backgroundColor: `${themeColor}25`, color: themeColor }}
          >
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No se encontraron integrantes
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {ministryMembers.length === 0
                ? `Aún no hay miembros asignados a ${ministryName}. Puedes vincular miembros existentes del Directorio o registrar uno nuevo.`
                : 'Ningún miembro coincide con los filtros de búsqueda aplicados.'}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => setIsLinkModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              Vincular del Directorio
            </button>
            <button
              type="button"
              onClick={() => setIsNewMemberModalOpen(true)}
              className="px-4 py-2 rounded-xl text-white font-bold text-xs cursor-pointer shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              Registrar Nuevo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const cleanPhone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
            return (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.fullName}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0"
                          style={{ backgroundColor: themeColor }}
                        >
                          {member.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {member.fullName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              member.status === 'Activo'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : member.status === 'En Prueba'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {member.status}
                          </span>
                          {member.baptized && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Bautizado(a)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingMember(member)}
                      className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      title="Editar ficha"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                    {member.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 truncate">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{member.phone}</span>
                        </div>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold flex items-center gap-1 transition-colors"
                          >
                            <MessageCircle className="w-3 h-3" /> WhatsApp
                          </a>
                        )}
                      </div>
                    )}

                    {member.email && (
                      <div className="flex items-center space-x-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}

                    {member.address && (
                      <div className="flex items-center space-x-2 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate text-[11px]">{member.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Ministry Roles or Notes */}
                  {member.notes && (
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 italic">
                      "{member.notes}"
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Ingreso: {member.joinDate || 'Registrado'}
                  </span>

                  <button
                    type="button"
                    onClick={() => setUnlinkConfirmMember(member)}
                    className="text-[11px] text-rose-500 hover:text-rose-700 font-medium hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3 h-3" /> Desvincular de {ministryName}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Vincular miembros existentes del Directorio General */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Vincular Integrante a {ministryName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecciona miembros registrados en el Directorio General
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search filter in link modal */}
            <div className="py-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={linkSearchQuery}
                  onChange={(e) => setLinkSearchQuery(e.target.value)}
                  placeholder="Buscar miembro del directorio para agregar..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Members List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {nonMinistryMembers
                .filter((m) => {
                  const q = (linkSearchQuery || '').toLowerCase();
                  return (
                    (m.fullName || '').toLowerCase().includes(q) ||
                    (m.phone || '').toLowerCase().includes(q) ||
                    (m.email || '').toLowerCase().includes(q)
                  );
                })
                .map((member) => (
                  <div
                    key={member.id}
                    className="pt-2 flex items-center justify-between py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl px-2.5 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.fullName}
                          className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                          {member.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {member.fullName}
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          {member.phone || member.email || 'Sin contacto'} • {member.status}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleLinkMember(member)}
                      className="px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center space-x-1 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Asignar</span>
                    </button>
                  </div>
                ))}

              {nonMinistryMembers.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-8">
                  Todos los miembros del Directorio ya están asignados a este ministerio.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsLinkModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Confirmación para desvincular miembro del ministerio */}
      {unlinkConfirmMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Desvincular a {unlinkConfirmMember.fullName}?
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                El miembro será retirado del ministerio de <strong>{ministryName}</strong>, pero permanecerá intacto en el Directorio General de la iglesia.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUnlinkConfirmMember(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleUnlinkMember(unlinkConfirmMember)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Confirmar Desvinculación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Registrar Nuevo Miembro directamente */}
      {isNewMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Registrar Integrante en {ministryName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Se guardará en este ministerio y en el Directorio General
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMemberModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ej: Hermano Juan Pérez"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+52 (55) ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Espiritual
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Prueba">En Prueba</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Visita">Visita</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.baptized}
                      onChange={(e) => setFormData({ ...formData, baptized: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>¿Bautizado(a) en agua?</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas o Habilidades en el Ministerio
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Toca guitarra acústica y canta voz tenor..."
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  Guardar Integrante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Editar datos rápidos de un integrante existente */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Editar Ficha: {editingMember.fullName}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExistingMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={editingMember.fullName}
                  onChange={(e) => setEditingMember({ ...editingMember, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editingMember.email}
                    onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado Espiritual
                  </label>
                  <select
                    value={editingMember.status}
                    onChange={(e) => setEditingMember({ ...editingMember, status: e.target.value as MemberStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Prueba">En Prueba</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Visita">Visita</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMember.baptized}
                      onChange={(e) => setEditingMember({ ...editingMember, baptized: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>¿Bautizado(a) en agua?</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas / Habilidades
                </label>
                <textarea
                  value={editingMember.notes || ''}
                  onChange={(e) => setEditingMember({ ...editingMember, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer"
                  style={{ backgroundColor: themeColor }}
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
