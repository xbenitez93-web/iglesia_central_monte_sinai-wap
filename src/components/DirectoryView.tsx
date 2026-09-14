import React, { useState, useMemo } from 'react';
// =================================================================================================
// ETIQUETA: IMPORTACIONES DE TIPOS DE DATOS Y MODELOS
// ¿Para qué es?: Importa las interfaces de TypeScript (Member, Family, MinistryRole, ChurchConfig, etc.).
// ¿Por qué se usa?: Garantiza la coherencia e integridad de los datos de feligreses y familias.
// =================================================================================================
import { ChurchConfig, EcclesiasticalRole, Family, Member, MemberStatus, MinistryRole } from '../types';
import { getEffectiveEcclesiasticalRoles, ECCLESIASTICAL_ROLE_CATEGORIES } from '../data/ecclesiasticalRoles';
import { EcclesiasticalRoleModal } from './roles/EcclesiasticalRoleModal';

// =================================================================================================
// ETIQUETA: ICONOS VECTORIALES DE LUCIDE-REACT
// ¿Para qué es?: Conjunto de iconos gráficos para acciones visuales (eliminar, editar, agregar, llamar, etc.).
// ¿Por qué se usa?: Proporciona una interfaz moderna, limpia e intuitiva.
// =================================================================================================
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  Plus,
  X,
  Edit2,
  Trash2,
  Heart,
  Calendar,
  Layers,
  GripVertical,
  Check,
  Camera,
  Image as ImageIcon,
  AlertTriangle,
} from 'lucide-react';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { PageHeroBanner } from './PageHeroBanner';
import { getActivePageThemeColor } from '../lib/pageTheme';
import { CHURCH_AVAILABLE_MINISTRIES } from '../lib/ministriesConstants';

// =================================================================================================
// ETIQUETA: PROPIEDADES DEL COMPONENTE DIRECTORYVIEW (DirectoryViewProps)
// ¿Para qué es?: Define todos los datos y funciones callback que el componente padre (App.tsx) suministra.
// ¿Por qué se usa?: Permite sincronizar las altas, bajas, ediciones y eliminaciones de miembros y familias.
// =================================================================================================
interface DirectoryViewProps {
  config?: ChurchConfig;
  members: Member[];
  families: Family[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddFamily: (family: Omit<Family, 'id'>) => void;
  onUpdateFamily?: (family: Family) => void;
  onDeleteFamily?: (id: string) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => void;
  onOpenDeveloperTab?: (subTab?: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  config,
  members,
  families,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onAddFamily,
  onUpdateFamily,
  onDeleteFamily,
  isAddModalOpen,
  setIsAddModalOpen,
  onUpdateConfig,
  onOpenDeveloperTab,
}) => {
  // ===============================================================================================
  // ETIQUETA: ESTADOS DE NAVEGACIÓN Y FILTRADO DENTRO DEL DIRECTORIO
  // ¿Para qué es?: Controla si se visualiza la pestaña de miembros, familias o ministerios, y los filtros activos.
  // ¿Por qué se usa?: Brinda una búsqueda instantánea por nombre, estado espiritual o ministerio.
  // ===============================================================================================
  const [subTab, setSubTab] = useState<'members' | 'families' | 'ministries'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const pageColor = getActivePageThemeColor('directory', config);

  // ===============================================================================================
  // ETIQUETA: ESTADOS PARA EDICIÓN Y VISTA DE EXPEDIENTE DE MIEMBROS
  // ¿Para qué es?: Guarda la referencia al miembro que se está editando o cuyo expediente se está consultando.
  // ¿Por qué se usa?: Permite abrir modales específicos con la información pre-cargada.
  // ===============================================================================================
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // ===============================================================================================
  // ETIQUETA: ESTADO DEL FORMULARIO DE MIEMBRO
  // ¿Para qué es?: Campos controlados de datos personales, teléfono, dirección, foto y ministerios.
  // ¿Por qué se usa?: Enlaza los inputs con el estado de React para validar y guardar miembros.
  // ===============================================================================================
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    status: 'Activo' as MemberStatus,
    baptized: true,
    birthDate: '',
    baptismDate: '',
    familyId: '',
    familyName: '',
    ministries: [] as string[],
    ministryRoles: [] as MinistryRole[],
    notes: '',
    photoUrl: '',
  });

  const [isDragOverDropzone, setIsDragOverDropzone] = useState(false);
  const [isMemberPhotoModalOpen, setIsMemberPhotoModalOpen] = useState(false);

  // ===============================================================================================
  // ETIQUETA: ESTADOS PARA CREACIÓN Y EDICIÓN DE FAMILIAS
  // ¿Para qué es?: Almacena los datos del formulario de núcleos familiares y el objeto en edición.
  // ¿Por qué se usa?: Permite registrar o actualizar el apellido familiar, dirección y teléfono principal.
  // ===============================================================================================
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [familyFormData, setFamilyFormData] = useState({
    familyName: '',
    address: '',
    phone: '',
    mainContactName: '',
    notes: '',
  });

  // ===============================================================================================
  // ETIQUETA: ESTADO PARA GESTIONAR INTEGRANTES DE UNA FAMILIA
  // ¿Para qué es?: Guarda la familia a la cual se le están agregando o quitando feligreses.
  // ¿Por qué se usa?: Muestra la interfaz de dos columnas para enlazar o desvincular miembros rápidamente.
  // ===============================================================================================
  const [managingFamily, setManagingFamily] = useState<Family | null>(null);
  const [memberSearchInFamilyModal, setMemberSearchInFamilyModal] = useState('');
  const [familyModalMemberTab, setFamilyModalMemberTab] = useState<'all' | 'unassigned'>('all');

  // ===============================================================================================
  // ETIQUETA: MODAL SEGURO DE CONFIRMACIÓN DE ELIMINACIÓN (REACT PURO)
  // ¿Para qué es?: Gestiona la confirmación visual e interactiva para borrar miembros, familias o desvincular.
  // ¿Por qué se usa?: Reemplaza los confirm() del navegador para evitar bloqueos y fallos en iframes.
  // ===============================================================================================
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'member' | 'family' | 'unlinkMemberFromFamily';
    id: string;
    title: string;
    subtitle?: string;
    extraData?: any;
  } | null>(null);

  // Lista de cargos eclesiásticos efectivos y dinámicos configurados en la congregación
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleToEditInModal, setRoleToEditInModal] = useState<EcclesiasticalRole | null>(null);

  const effectiveRoles = useMemo(() => {
    return getEffectiveEcclesiasticalRoles(config);
  }, [config]);

  const allRoles: MinistryRole[] = useMemo(() => {
    return effectiveRoles.map((r) => r.name);
  }, [effectiveRoles]);

  const handleSaveEcclesiasticalRole = (newOrUpdatedRole: EcclesiasticalRole) => {
    if (onUpdateConfig) {
      onUpdateConfig((prev) => {
        const currentList = getEffectiveEcclesiasticalRoles(prev);
        const isEdit = currentList.some((r) => r.id === newOrUpdatedRole.id);
        let updatedList: EcclesiasticalRole[];
        if (isEdit) {
          updatedList = currentList.map((r) => (r.id === newOrUpdatedRole.id ? newOrUpdatedRole : r));
        } else {
          updatedList = [...currentList, newOrUpdatedRole];
        }
        return {
          ...prev,
          ecclesiasticalRoles: updatedList,
        };
      });
    }

    // Si el usuario está registrando o editando un miembro, auto-asignarle el cargo recién creado
    setFormData((prev) => {
      if (!prev.ministryRoles.includes(newOrUpdatedRole.name)) {
        return {
          ...prev,
          ministryRoles: [...prev.ministryRoles, newOrUpdatedRole.name],
        };
      }
      return prev;
    });
  };

  // ===============================================================================================
  // ETIQUETA: FILTRADO REACTIVO DE MIEMBROS
  // ¿Para qué es?: Evalúa la barra de búsqueda y los selectores de estado y ministerio.
  // ¿Por qué se usa?: Muestra en tiempo real solo los feligreses que coinciden con los criterios.
  // ===============================================================================================
  const filteredMembers = members.filter((m) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(searchQuery) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.familyName ? m.familyName.toLowerCase().includes(q) : false);

    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;
    const matchesRole = selectedRole === 'all' || (m.ministryRoles && m.ministryRoles.includes(selectedRole as MinistryRole));

    return matchesSearch && matchesStatus && matchesRole;
  });

  // ===============================================================================================
  // ETIQUETA: ABRIR CREADOR DE MIEMBRO
  // ¿Para qué es?: Restablece el formulario a blanco y abre el modal de registro.
  // ¿Por qué se usa?: Asegura que no queden datos antiguos cargados en el formulario.
  // ===============================================================================================
  const handleOpenCreateMember = () => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      status: 'Activo',
      baptized: true,
      birthDate: '',
      baptismDate: '',
      familyId: '',
      familyName: '',
      ministries: [],
      ministryRoles: ['Voluntario General'],
      notes: '',
      photoUrl: '',
    });
    setIsAddModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: ABRIR EDICIÓN DE MIEMBRO
  // ¿Para qué es?: Llena el formulario con los datos del feligrés seleccionado y abre el modal.
  // ¿Por qué se usa?: Permite modificar teléfonos, dirección, foto o ministerios de un miembro.
  // ===============================================================================================
  const handleOpenEditMember = (m: Member) => {
    setEditingMember(m);
    let matchedFamId = m.familyId || '';
    if (!matchedFamId && m.familyName) {
      const found = families.find(
        (f) => (f.familyName || '').toLowerCase() === (m.familyName || '').toLowerCase()
      );
      if (found) matchedFamId = found.id;
    }

    setFormData({
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      address: m.address,
      status: m.status,
      baptized: m.baptized,
      birthDate: m.birthDate,
      baptismDate: m.baptismDate || '',
      familyId: matchedFamId,
      familyName: m.familyName || '',
      ministries: m.ministries || [],
      ministryRoles: m.ministryRoles || [],
      notes: m.notes || '',
      photoUrl: m.photoUrl || '',
    });
    setIsAddModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: SELECCIONAR FAMILIA PARA UN MIEMBRO
  // ¿Para qué es?: Asocia al miembro con una familia existente y hereda su dirección.
  // ¿Por qué se usa?: Automatiza la vinculación de grupos familiares.
  // ===============================================================================================
  const handleSelectFamilyForMember = (fam: Family | null) => {
    if (fam) {
      setFormData((prev) => ({
        ...prev,
        familyId: fam.id,
        familyName: fam.familyName,
        address: prev.address ? prev.address : (fam.address || ''),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        familyId: '',
        familyName: '',
      }));
    }
  };

  // Drag & Drop para arrastrar familia al miembro
  const handleDragStartFamily = (e: React.DragEvent, fam: Family) => {
    e.dataTransfer.setData('text/plain', fam.id);
  };

  const handleDropFamilyOnZone = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverDropzone(false);
    const famId = e.dataTransfer.getData('text/plain');
    if (famId) {
      const fam = families.find((f) => f.id === famId);
      if (fam) {
        handleSelectFamilyForMember(fam);
      }
    }
  };

  // Activar o desactivar ministerio al que pertenece
  const handleToggleMinistry = (minId: string) => {
    const current = formData.ministries || [];
    if (current.includes(minId)) {
      setFormData({
        ...formData,
        ministries: current.filter((id) => id !== minId),
      });
    } else {
      setFormData({
        ...formData,
        ministries: [...current, minId],
      });
    }
  };

  // Activar o desactivar rol ministerial en el formulario
  const handleToggleRole = (role: MinistryRole) => {
    if (formData.ministryRoles.includes(role)) {
      setFormData({
        ...formData,
        ministryRoles: formData.ministryRoles.filter((r) => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        ministryRoles: [...formData.ministryRoles, role],
      });
    }
  };

  // ===============================================================================================
  // ETIQUETA: ENVIAR FORMULARIO DE MIEMBRO
  // ¿Para qué es?: Guarda el miembro nuevo o actualiza el existente en App.tsx.
  // ¿Por qué se usa?: Persiste la información en la base de datos y estado global.
  // ===============================================================================================
  const handleSubmitMemberForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;

    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        status: formData.status,
        baptized: formData.baptized,
        birthDate: formData.birthDate,
        baptismDate: formData.baptismDate,
        familyId: formData.familyId || undefined,
        familyName: formData.familyName ? formData.familyName.trim() : undefined,
        ministries: formData.ministries || [],
        ministryRoles: formData.ministryRoles,
        notes: formData.notes.trim(),
        photoUrl: formData.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      });
    } else {
      onAddMember({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        status: formData.status,
        baptized: formData.baptized,
        birthDate: formData.birthDate,
        baptismDate: formData.baptismDate,
        familyId: formData.familyId || undefined,
        familyName: formData.familyName ? formData.familyName.trim() : undefined,
        ministries: formData.ministries || [],
        ministryRoles: formData.ministryRoles,
        notes: formData.notes.trim(),
        joinDate: new Date().toISOString().split('T')[0],
        photoUrl: formData.photoUrl || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      });
    }

    setIsAddModalOpen(false);
  };

  // ===============================================================================================
  // ETIQUETA: CREAR / EDITAR FAMILIA
  // ¿Para qué es?: Controla los modales y estados para registrar o actualizar datos familiares.
  // ¿Por qué se usa?: Facilita la administración de familias en la congregación.
  // ===============================================================================================
  const handleOpenCreateFamily = () => {
    setEditingFamily(null);
    setFamilyFormData({
      familyName: '',
      address: '',
      phone: '',
      mainContactName: '',
      notes: '',
    });
    setIsFamilyModalOpen(true);
  };

  const handleOpenEditFamily = (fam: Family) => {
    setEditingFamily(fam);
    setFamilyFormData({
      familyName: fam.familyName,
      address: fam.address || '',
      phone: fam.phone || '',
      mainContactName: fam.mainContactName || '',
      notes: fam.notes || '',
    });
    setIsFamilyModalOpen(true);
  };

  const handleSubmitFamilyForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyFormData.familyName.trim()) return;

    if (editingFamily && onUpdateFamily) {
      onUpdateFamily({
        ...editingFamily,
        familyName: familyFormData.familyName.trim(),
        address: familyFormData.address.trim(),
        phone: familyFormData.phone.trim(),
        mainContactName: familyFormData.mainContactName.trim(),
        notes: familyFormData.notes.trim(),
      });
    } else {
      onAddFamily({
        familyName: familyFormData.familyName.trim(),
        address: familyFormData.address.trim(),
        phone: familyFormData.phone.trim(),
        mainContactName: familyFormData.mainContactName.trim(),
        notes: familyFormData.notes.trim(),
        memberIds: [],
      });
    }

    setIsFamilyModalOpen(false);
    setEditingFamily(null);
    setFamilyFormData({ familyName: '', address: '', phone: '', mainContactName: '', notes: '' });
  };

  // ===============================================================================================
  // ETIQUETA: QUITAR O AGREGAR INTEGRANTE A UNA FAMILIA
  // ¿Para qué es?: Desvincula o asocia a un miembro individual a la familia correspondiente.
  // ¿Por qué se usa?: Actualiza simultáneamente el objeto Member y el array memberIds de la Family.
  // ===============================================================================================
  const handleRemoveMemberFromFamily = (member: Member, family: Family) => {
    onUpdateMember({
      ...member,
      familyId: undefined,
      familyName: undefined,
    });
    if (onUpdateFamily) {
      const updatedMemberIds = (family.memberIds || []).filter((id) => id !== member.id);
      onUpdateFamily({
        ...family,
        memberIds: updatedMemberIds,
      });
    }
  };

  const handleAddMemberToFamily = (member: Member, family: Family) => {
    onUpdateMember({
      ...member,
      familyId: family.id,
      familyName: family.familyName,
      address: member.address || family.address || '',
    });
    if (onUpdateFamily) {
      const currentIds = family.memberIds || [];
      const updatedMemberIds = currentIds.includes(member.id) ? currentIds : [...currentIds, member.id];
      onUpdateFamily({
        ...family,
        memberIds: updatedMemberIds,
      });
    }
  };

  const handleCreateNewMemberForFamily = (family: Family) => {
    setEditingMember(null);
    setFormData({
      fullName: '',
      email: '',
      phone: family.phone || '',
      address: family.address || '',
      status: 'Activo',
      baptized: true,
      birthDate: '',
      baptismDate: '',
      familyId: family.id,
      familyName: family.familyName,
      ministryRoles: ['Voluntario General'],
      notes: '',
      photoUrl: '',
    });
    setManagingFamily(null);
    setIsAddModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: EJECUTAR ELIMINACIÓN CONFIRMADA (100% GARANTIZADA)
  // ¿Para qué es?: Despacha la acción de borrado de miembro, familia o desvinculación a App.tsx.
  // ¿Por qué se usa?: Envía el objeto a la Papelera de reciclaje y actualiza el estado sin errores.
  // ===============================================================================================
  const handleExecuteDelete = () => {
    if (!deleteConfirmTarget) return;

    const { type, id, extraData } = deleteConfirmTarget;

    if (type === 'family') {
      // 1. Ejecutar eliminación de la familia
      if (onDeleteFamily) {
        onDeleteFamily(id);
      }
      // 2. Cerrar modales asociados
      if (editingFamily?.id === id) {
        setIsFamilyModalOpen(false);
        setEditingFamily(null);
      }
      if (managingFamily?.id === id) {
        setManagingFamily(null);
      }
    } else if (type === 'member') {
      // 1. Ejecutar eliminación del miembro
      onDeleteMember(id);
      // 2. Cerrar modales asociados
      if (viewingMember?.id === id) {
        setViewingMember(null);
      }
      if (editingMember?.id === id) {
        setIsAddModalOpen(false);
        setEditingMember(null);
      }
    } else if (type === 'unlinkMemberFromFamily' && extraData?.member && extraData?.family) {
      // 1. Desvincular integrante de la familia
      handleRemoveMemberFromFamily(extraData.member, extraData.family);
    }

    // Cerrar el modal de confirmación
    setDeleteConfirmTarget(null);
  };

  // Sincronizar la familia activa en el modal de gestión con el array principal
  const activeManagingFamily = managingFamily
    ? families.find((f) => f.id === managingFamily.id) || managingFamily
    : null;

  const activeFamilyMembers = activeManagingFamily
    ? members.filter(
        (m) => m.familyId === activeManagingFamily.id || m.familyName === activeManagingFamily.familyName
      )
    : [];

  const nonFamilyMembers = activeManagingFamily
    ? members.filter(
        (m) => !(m.familyId === activeManagingFamily.id || m.familyName === activeManagingFamily.familyName)
      )
    : [];

  const filteredCandidateMembers = nonFamilyMembers.filter((m) => {
    const q = (memberSearchInFamilyModal || '').toLowerCase();
    const matchesSearch =
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.phone || '').includes(memberSearchInFamilyModal) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.familyName ? m.familyName.toLowerCase().includes(q) : false);
    const matchesUnassigned = familyModalMemberTab === 'all' || (!m.familyId && !m.familyName);
    return matchesSearch && matchesUnassigned;
  });

  return (
    <div className="space-y-6">
      {/* =========================================================================================
          ETIQUETA: HERO BANNER DINÁMICO DEL DIRECTORIO
          ¿Para qué es?: Banner superior con icono, título y accesos para agregar miembros o familias.
          ¿Por qué se usa?: Identidad visual unificada con el tema de la iglesia.
         ========================================================================================= */}
      <PageHeroBanner
        tabId="directory"
        config={config}
        icon={Users}
        defaultTitle="Directorio Eclesiástico"
        defaultSubtitle="Gestión completa de miembros, familias, registros fotográficos y asignaciones ministeriales."
        defaultBadge="Comunidad & Membresía"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              type="button"
              onClick={handleOpenCreateMember}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Agregar Miembro</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreateFamily}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs border border-white/30 shadow-md transition-all flex items-center space-x-2 cursor-pointer hover:bg-white/10"
              style={{
                backgroundColor: `${pageColor}bb`,
                borderColor: `${pageColor}80`,
              }}
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva Familia</span>
            </button>
          </>
        }
      />

      {/* =========================================================================================
          ETIQUETA: SELECTOR DE SUB-PESTAÑAS (Miembros, Familias, Ministerios)
          ¿Para qué es?: Permite alternar entre la lista de personas, los grupos familiares o los roles.
          ¿Por qué se usa?: Organiza la información en secciones limpias y especializadas.
         ========================================================================================= */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('members')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            subTab === 'members'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          style={{
            backgroundColor: subTab === 'members' ? pageColor : undefined,
          }}
        >
          Feligreses / Miembros ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('families')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            subTab === 'families'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          style={{
            backgroundColor: subTab === 'families' ? pageColor : undefined,
          }}
        >
          <Heart className="w-4 h-4" />
          <span>Familias ({families.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab('ministries')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
            subTab === 'ministries'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
          style={{
            backgroundColor: subTab === 'ministries' ? pageColor : undefined,
          }}
        >
          <Layers className="w-4 h-4" />
          <span>Ministerios ({allRoles.length})</span>
        </button>
      </div>

      {/* =========================================================================================
          ETIQUETA: PESTAÑA DE MIEMBROS / FELIGRESES
         ========================================================================================= */}
      {subTab === 'members' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono, correo o familia..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">-- Todos los Estados --</option>
                <option value="Activo">Activos</option>
                <option value="En Prueba">En Prueba / Visita</option>
                <option value="Inactivo">Inactivos</option>
              </select>
            </div>

            <div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
              >
                <option value="all">-- Todos los Ministerios --</option>
                {allRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cuadrícula de Tarjetas de Miembros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={member.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                        alt={member.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-slate-700 shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                          {member.fullName}
                        </h3>
                        {member.familyName && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            👥 {member.familyName}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        member.status === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : member.status === 'En Prueba'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>

                  {/* Datos de Contacto */}
                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{member.phone || 'Sin teléfono'}</span>
                    </div>
                    <div className="flex items-center space-x-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email || 'Sin correo'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.address || 'Sin dirección'}</span>
                    </div>
                  </div>

                  {/* Badges de Ministerios */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {member.ministryRoles.map((role, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acciones de la Tarjeta del Miembro */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setViewingMember(member)}
                    className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Ver Expediente
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditMember(member)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      title="Editar Miembro"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* =========================================================================
                        ETIQUETA: BOTÓN ELIMINAR MIEMBRO CON CONFIRMACIÓN SEGURA
                        ¿Para qué es?: Invoca el modal de confirmación React para borrar este miembro.
                        ¿Por qué se usa?: 100% garantizado sin bloqueos de navegador.
                       ========================================================================= */}
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmTarget({
                          type: 'member',
                          id: member.id,
                          title: `¿Eliminar al feligrés "${member.fullName}"?`,
                          subtitle: `Esta acción enviará su ficha personal a la Papelera de Reciclaje.`,
                        });
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                      title="Eliminar Miembro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: PESTAÑA DE FAMILIAS (CON BOTONES DE ELIMINACIÓN 100% FUNCIONALES)
         ========================================================================================= */}
      {subTab === 'families' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Total: <strong>{families.length}</strong> núcleos familiares registrados
            </span>
            <button
              type="button"
              onClick={handleOpenCreateFamily}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Familia</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {families.map((fam) => {
              const familyMembers = members.filter(
                (m) => m.familyId === fam.id || m.familyName === fam.familyName
              );
              return (
                <div
                  key={fam.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>{fam.familyName}</span>
                      </h3>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {familyMembers.length} Integrantes
                        </span>

                        {/* Botón Editar Familia */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditFamily(fam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Familia"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* =====================================================================
                            ETIQUETA: BOTÓN DE ELIMINAR FAMILIA (EN TARJETA)
                            ¿Para qué es?: Abre el modal de confirmación para eliminar la familia.
                            ¿Por qué se usa?: 100% operativo sin confirm() bloqueados por el navegador.
                           ===================================================================== */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmTarget({
                              type: 'family',
                              id: fam.id,
                              title: `¿Eliminar el registro de la familia ${fam.familyName}?`,
                              subtitle: `Se desvincularán los ${familyMembers.length} integrantes de esta familia y el registro se enviará a la Papelera.`,
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Eliminar Familia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                      <span>{fam.address || 'Sin dirección registrada'}</span>
                    </p>

                    {fam.phone && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                        <span>{fam.phone}</span>
                      </p>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Miembros de la Familia ({familyMembers.length}):
                        </span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                        {familyMembers.length > 0 ? (
                          familyMembers.map((fm) => (
                            <div
                              key={fm.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/50 group/member hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                              <div className="flex items-center space-x-2 truncate">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {fm.fullName.charAt(0)}
                                </div>
                                <div className="truncate">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate leading-tight">
                                    {fm.fullName}
                                  </span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {fm.ministryRoles[0] || 'Miembro'}
                                  </span>
                                </div>
                              </div>

                              {/* Botón Quitar Miembro de Familia */}
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteConfirmTarget({
                                    type: 'unlinkMemberFromFamily',
                                    id: fm.id,
                                    title: `¿Quitar a ${fm.fullName} de la ${fam.familyName}?`,
                                    subtitle: `El feligrés permanecerá activo en el directorio general pero sin familia vinculada.`,
                                    extraData: { member: fm, family: fam },
                                  });
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
                                title={`Quitar a ${fm.fullName} de esta familia`}
                              >
                                <UserMinus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-center">
                            <p className="text-xs text-slate-400 italic">No hay miembros vinculados aún.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones Inferiores de la Tarjeta */}
                  <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setManagingFamily(fam)}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer shadow-xs border border-indigo-100 dark:border-indigo-900/50"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Gestionar Integrantes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: PESTAÑA DE MINISTERIOS
         ========================================================================================= */}
      {subTab === 'ministries' && (
        <div className="space-y-6">
          {/* Ministerios Oficiales del Sistema */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Padrón de Miembros por Ministerio Eclesiástico</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CHURCH_AVAILABLE_MINISTRIES.map((ministry) => {
                const ministryMembers = members.filter(
                  (m) =>
                    (m.ministries || []).includes(ministry.id) ||
                    (ministry.id === 'worship' && m.ministryRoles.some((r) => r.includes('Alabanza') || r.includes('Músico') || r.includes('Voz') || r.includes('Coro'))) ||
                    (ministry.id === 'dance' && m.ministryRoles.some((r) => r.includes('Danza') || r.includes('Pandero') || r.includes('Mantos'))) ||
                    (ministry.id === 'women' && m.ministryRoles.some((r) => r.includes('Damas') || r.includes('Femenil'))) ||
                    (ministry.id === 'ushers' && m.ministryRoles.some((r) => r.includes('Ujier') || r.includes('Servidor') || r.includes('Protocolo'))) ||
                    (ministry.id === 'theater' && m.ministryRoles.some((r) => r.includes('Teatro') || r.includes('Drama') || r.includes('Actor')))
                );

                return (
                  <div
                    key={ministry.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ministry.color }} />
                          <span>{ministry.name}</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">{ministry.description}</p>
                      </div>
                      <span
                        className="text-xs font-extrabold px-2.5 py-1 rounded-full text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: ministry.color }}
                      >
                        {ministryMembers.length} {ministryMembers.length === 1 ? 'miembro' : 'miembros'}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {ministryMembers.length > 0 ? (
                        ministryMembers.map((rm) => (
                          <div
                            key={rm.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-xs border border-slate-100 dark:border-slate-800/60"
                          >
                            <div className="flex items-center space-x-2.5 min-w-0">
                              <img
                                src={rm.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                                alt={rm.fullName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                  {rm.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {rm.familyName || 'Sin grupo familiar'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                              {rm.phone && (
                                <a
                                  href={`tel:${rm.phone}`}
                                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                  title={rm.phone}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setViewingMember(rm)}
                                className="px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-[11px] hover:bg-indigo-100 transition-colors"
                              >
                                Ver Ficha
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          No hay miembros registrados aún en este ministerio.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desglose por Cargos Específicos */}
          <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>Desglose por Cargos & Funciones Específicas</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {effectiveRoles.length} Cargos
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualiza y gestiona las funciones y responsabilidades ministeriales asignadas a cada cargo.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setRoleToEditInModal(null);
                    setIsRoleModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Cargo Eclesiástico</span>
                </button>

                {onOpenDeveloperTab && (
                  <button
                    type="button"
                    onClick={() => onOpenDeveloperTab('ecclesiastical_roles')}
                    className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Administrar cargos en Desarrollador"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-purple-500" />
                    <span className="hidden sm:inline">Administrar en Desarrollador</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {effectiveRoles.map((role) => {
                const roleMembers = members.filter((m) => m.ministryRoles?.includes(role.name));
                const catConfig = ECCLESIASTICAL_ROLE_CATEGORIES.find((c) => c.id === role.category);

                return (
                  <div
                    key={role.id || role.name}
                    className="bg-white dark:bg-slate-900 rounded-3xl p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Color Top Border */}
                    <div
                      className="absolute top-0 left-0 right-0 h-1"
                      style={{ backgroundColor: role.color || '#4f46e5' }}
                    />

                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: role.color || '#4f46e5' }}
                          />
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {role.name}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              catConfig?.badgeBg || 'bg-slate-100 dark:bg-slate-800'
                            } ${catConfig?.badgeText || 'text-slate-700 dark:text-slate-300'}`}
                          >
                            {role.category}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {roleMembers.length}
                          </span>
                        </div>
                      </div>

                      {/* Desglose de Funciones Específicas */}
                      {role.description && (
                        <div className="bg-slate-50/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Funciones Específicas:</span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                            {role.description}
                          </p>
                        </div>
                      )}

                      {/* Lista de Miembros Asignados */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                          <span>Miembros Asignados:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleToEditInModal(role);
                              setIsRoleModalOpen(true);
                            }}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Editar Funciones</span>
                          </button>
                        </div>

                        <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                          {roleMembers.length > 0 ? (
                            roleMembers.map((rm) => (
                              <div
                                key={rm.id}
                                className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 text-xs"
                              >
                                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {rm.fullName}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2">{rm.phone || rm.status}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-slate-400 italic">Sin miembros asignados.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL DE EXPEDIENTE DEL MIEMBRO (CON BOTÓN DE ELIMINACIÓN)
         ========================================================================================= */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-200" />
                <div>
                  <h3 className="text-base font-bold leading-tight">Expediente de Miembro</h3>
                  <p className="text-xs text-indigo-100/90 leading-tight">Detalles y ficha personal del feligrés</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Cerrar ficha"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <img
                  src={viewingMember.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                  alt={viewingMember.fullName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-300 dark:border-indigo-700 shrink-0 shadow-xs"
                />
                <div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {viewingMember.fullName}
                  </h4>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                    {viewingMember.familyName ? `👥 ${viewingMember.familyName}` : 'Sin grupo familiar'}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {viewingMember.status}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Teléfono:</span>
                  <span className="font-semibold">{viewingMember.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Correo Electrónico:</span>
                  <span className="font-semibold">{viewingMember.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Dirección:</span>
                  <span className="font-semibold">{viewingMember.address || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Bautizado en Agua:</span>
                  <span className="font-semibold">{viewingMember.baptized ? 'Sí' : 'No'}</span>
                </div>
                {viewingMember.birthDate && (
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Fecha de Nacimiento:</span>
                    <span className="font-semibold">{viewingMember.birthDate}</span>
                  </div>
                )}
                {viewingMember.ministryRoles && viewingMember.ministryRoles.length > 0 && (
                  <div className="py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 block mb-1">Ministerios / Cargos:</span>
                    <div className="flex flex-wrap gap-1">
                      {viewingMember.ministryRoles.map((r) => (
                        <span
                          key={r}
                          className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {viewingMember.notes && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold block mb-1 text-slate-900 dark:text-white">Notas Pastorales:</span>
                  <p className="whitespace-pre-line leading-relaxed">{viewingMember.notes}</p>
                </div>
              )}
            </div>

            {/* Footer con Botones de Eliminar y Editar */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const m = viewingMember;
                  setDeleteConfirmTarget({
                    type: 'member',
                    id: m.id,
                    title: `¿Eliminar al feligrés "${m.fullName}"?`,
                    subtitle: `Esta acción enviará su expediente a la Papelera de Reciclaje.`,
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Miembro</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const m = viewingMember;
                    setViewingMember(null);
                    handleOpenEditMember(m);
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Editar Datos
                </button>
                <button
                  type="button"
                  onClick={() => setViewingMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL PARA AGREGAR / EDITAR MIEMBRO (CON BOTÓN DE ELIMINACIÓN)
         ========================================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs shadow-xs">
                  <UserPlus className="w-5 h-5 text-indigo-100" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                    <span>{editingMember ? 'Editar Datos del Miembro' : 'Registrar Nuevo Miembro'}</span>
                  </h3>
                  <p className="text-xs text-indigo-100/90 leading-tight">
                    Complete la información personal, ministerial y grupo familiar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitMemberForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm">
                
                {/* Foto del Miembro */}
                <div className="flex items-center space-x-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <div className="relative group shrink-0">
                    <img
                      src={formData.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                      alt="Foto"
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setIsMemberPhotoModalOpen(true)}
                      className="absolute inset-0 bg-slate-900/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Cambiar Foto"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 dark:text-white block">Fotografía del Miembro</span>
                    <button
                      type="button"
                      onClick={() => setIsMemberPhotoModalOpen(true)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Subir o Tomar Foto</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ej. Juan Pérez Rodríguez"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                      Estado del Miembro
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as MemberStatus })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                    >
                      <option value="Activo">Activo</option>
                      <option value="En Prueba">En Prueba / Visita</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Teléfono / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+52 55..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Correo Electrónico</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Dirección Residencial</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Calle, Número, Colonia, Ciudad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Asignación de Familia */}
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Núcleo / Grupo Familiar
                  </label>
                  <select
                    value={formData.familyId || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        handleSelectFamilyForMember(null);
                      } else {
                        const fam = families.find((f) => f.id === val);
                        if (fam) handleSelectFamilyForMember(fam);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="">-- Sin Familia Asignada / Ninguna --</option>
                    {families.map((fam) => (
                      <option key={fam.id} value={fam.id}>
                        👥 {fam.familyName} {fam.address ? `• ${fam.address}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2 sm:pt-6">
                    <input
                      type="checkbox"
                      id="baptized"
                      checked={formData.baptized}
                      onChange={(e) => setFormData({ ...formData, baptized: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500 cursor-pointer"
                    />
                    <label htmlFor="baptized" className="font-semibold text-xs text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                      ¿Miembro Bautizado en Agua?
                    </label>
                  </div>
                </div>

                {/* Selección de Ministerios Congregacionales */}
                <div>
                  <label className="block font-semibold mb-1.5 text-slate-800 dark:text-slate-200 flex items-center justify-between">
                    <span>Ministerios a los que pertenece:</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      Aparecerá en el padrón de cada ministerio
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    {CHURCH_AVAILABLE_MINISTRIES.map((min) => {
                      const isSelected = (formData.ministries || []).includes(min.id);
                      return (
                        <button
                          type="button"
                          key={min.id}
                          onClick={() => handleToggleMinistry(min.id)}
                          className={`text-xs px-2.5 py-1.5 rounded-xl border font-bold text-left transition-all flex items-center space-x-2 cursor-pointer ${
                            isSelected
                              ? 'text-white shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400'
                          }`}
                          style={{
                            backgroundColor: isSelected ? min.color : undefined,
                            borderColor: isSelected ? min.color : undefined,
                          }}
                        >
                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isSelected ? 'bg-white' : ''
                            }`}
                            style={{
                              backgroundColor: isSelected ? '#ffffff' : min.color,
                            }}
                          />
                          <span className="truncate">{min.shortName}</span>
                          {isSelected && <Check className="w-3 h-3 ml-auto text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selección de Cargos / Roles */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-semibold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                      Cargos / Roles Eclesiásticos:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRoleToEditInModal(null);
                        setIsRoleModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Cargo Eclesiástico</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    {effectiveRoles.map((role) => {
                      const selected = formData.ministryRoles.includes(role.name);
                      return (
                        <button
                          type="button"
                          key={role.id || role.name}
                          onClick={() => handleToggleRole(role.name)}
                          title={role.description || role.name}
                          className={`text-xs px-2.5 py-1 rounded-xl border font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                            selected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: selected ? '#ffffff' : (role.color || '#4f46e5') }}
                          />
                          <span>{role.name}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    Puedes seleccionar uno o varios cargos eclesiásticos para este feligrés o crear un nuevo cargo si no figura en la lista.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Notas Pastorales / Observaciones</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Peticiones de oración, traslados, talentos, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  {editingMember && (
                    <button
                      type="button"
                      onClick={() => {
                        const m = editingMember;
                        setDeleteConfirmTarget({
                          type: 'member',
                          id: m.id,
                          title: `¿Eliminar al feligrés "${m.fullName}"?`,
                          subtitle: `Esta acción enviará su ficha a la Papelera de Reciclaje.`,
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Miembro</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingMember(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingMember ? 'Guardar Cambios' : 'Registrar Miembro'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL PARA AGREGAR / EDITAR FAMILIA (CON BOTÓN DE ELIMINACIÓN)
         ========================================================================================= */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-200" />
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {editingFamily ? 'Editar Datos de Familia' : 'Registrar Nueva Familia'}
                  </h3>
                  <p className="text-xs text-rose-100/90 leading-tight">Gestión del núcleo o grupo familiar</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFamilyModalOpen(false);
                  setEditingFamily(null);
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFamilyForm} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs sm:text-sm">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Nombre de la Familia *</label>
                  <input
                    type="text"
                    required
                    value={familyFormData.familyName}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, familyName: e.target.value })}
                    placeholder="Ej. Familia Rodríguez"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Dirección Familiar</label>
                  <input
                    type="text"
                    value={familyFormData.address}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, address: e.target.value })}
                    placeholder="Calle, Colonia, Ciudad"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Teléfono Principal</label>
                    <input
                      type="text"
                      value={familyFormData.phone}
                      onChange={(e) => setFamilyFormData({ ...familyFormData, phone: e.target.value })}
                      placeholder="+52 55..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Contacto Principal</label>
                    <input
                      type="text"
                      value={familyFormData.mainContactName}
                      onChange={(e) => setFamilyFormData({ ...familyFormData, mainContactName: e.target.value })}
                      placeholder="Ej. Juan Rodríguez"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">Notas / Observaciones Familiares</label>
                  <textarea
                    value={familyFormData.notes}
                    onChange={(e) => setFamilyFormData({ ...familyFormData, notes: e.target.value })}
                    rows={2}
                    placeholder="Peticiones de oración, visitas requeridas, etc."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {editingFamily && (
                  <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Integrantes ({members.filter((m) => m.familyId === editingFamily.id || m.familyName === editingFamily.familyName).length})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const famToManage = editingFamily;
                        setIsFamilyModalOpen(false);
                        setEditingFamily(null);
                        setManagingFamily(famToManage);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Gestionar Miembros</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer con Botón de Eliminar Familia (si está en edición) y Guardar */}
              <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div>
                  {editingFamily && (
                    <button
                      type="button"
                      onClick={() => {
                        const fam = editingFamily;
                        setDeleteConfirmTarget({
                          type: 'family',
                          id: fam.id,
                          title: `¿Eliminar la familia ${fam.familyName}?`,
                          subtitle: `Esta acción desvinculará a los miembros y enviará la familia a la Papelera.`,
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Familia</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFamilyModalOpen(false);
                      setEditingFamily(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-2xs transition-colors"
                  >
                    {editingFamily ? 'Guardar Cambios' : 'Crear Familia'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL DE GESTIÓN DE INTEGRANTES DE FAMILIA (CON ELIMINACIÓN Y DESVINCULACIÓN)
         ========================================================================================= */}
      {activeManagingFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-indigo-600 text-white flex items-center justify-between shrink-0 shadow-xs z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-white/15 backdrop-blur-xs shadow-xs text-white">
                  <Heart className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold leading-tight flex items-center gap-2">
                    <span>Gestionar Integrantes: {activeManagingFamily.familyName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold">
                      {activeFamilyMembers.length} {activeFamilyMembers.length === 1 ? 'Miembro' : 'Miembros'}
                    </span>
                  </h3>
                  <p className="text-xs text-rose-100/90 leading-tight">
                    {activeManagingFamily.address || 'Sin dirección registrada'} {activeManagingFamily.phone ? `• Tel: ${activeManagingFamily.phone}` : ''}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setManagingFamily(null);
                  setMemberSearchInFamilyModal('');
                }}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Two-Column Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-0">
              {/* COLUMNA IZQUIERDA: INTEGRANTES ACTUALES */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/60 pb-2.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>Integrantes Actuales ({activeFamilyMembers.length})</span>
                    </h4>
                    <span className="text-[11px] text-slate-500">Núcleo familiar</span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {activeFamilyMembers.length > 0 ? (
                      activeFamilyMembers.map((fm) => (
                        <div
                          key={fm.id}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            {fm.photoUrl ? (
                              <img
                                src={fm.photoUrl}
                                alt={fm.fullName}
                                className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-indigo-200 dark:ring-indigo-900"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {fm.fullName.charAt(0)}
                              </div>
                            )}
                            <div className="truncate">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {fm.fullName}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                                  {fm.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                {fm.ministryRoles[0] || 'Miembro general'} {fm.phone ? `• ${fm.phone}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Botón Quitar de Familia Seguro */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmTarget({
                                type: 'unlinkMemberFromFamily',
                                id: fm.id,
                                title: `¿Quitar a ${fm.fullName} de la ${activeManagingFamily.familyName}?`,
                                subtitle: `El feligrés permanecerá activo pero se quitará de este núcleo familiar.`,
                                extraData: { member: fm, family: activeManagingFamily },
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1 transition-colors cursor-pointer shrink-0"
                            title={`Quitar de la ${activeManagingFamily.familyName}`}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                        <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-500 font-medium">
                          Esta familia no tiene ningún miembro asignado actualmente.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Seleccione personas desde la columna derecha para agregarlas a esta familia.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Al quitar un miembro, queda disponible como feligrés individual.</span>
                </div>
              </div>

              {/* COLUMNA DERECHA: BUSCAR Y AGREGAR INTEGRANTES */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-slate-700/60 pb-2.5">
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Agregar Personas a esta Familia</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCreateNewMemberForFamily(activeManagingFamily)}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Nuevo Miembro</span>
                    </button>
                  </div>

                  {/* Buscador y Filtros */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={memberSearchInFamilyModal}
                        onChange={(e) => setMemberSearchInFamilyModal(e.target.value)}
                        placeholder="Buscar por nombre, teléfono, correo..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setFamilyModalMemberTab('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          familyModalMemberTab === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Todos ({nonFamilyMembers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFamilyModalMemberTab('unassigned')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          familyModalMemberTab === 'unassigned'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        Sin Familia ({nonFamilyMembers.filter((m) => !m.familyId && !m.familyName).length})
                      </button>
                    </div>
                  </div>

                  {/* Lista de Feligreses Candidatos */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {filteredCandidateMembers.length > 0 ? (
                      filteredCandidateMembers.map((cand) => (
                        <div
                          key={cand.id}
                          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                        >
                          <div className="flex items-center space-x-2.5 truncate">
                            {cand.photoUrl ? (
                              <img
                                src={cand.photoUrl}
                                alt={cand.fullName}
                                className="w-8 h-8 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                {cand.fullName.charAt(0)}
                              </div>
                            )}
                            <div className="truncate">
                              <span className="font-bold text-xs text-slate-900 dark:text-white block truncate leading-tight">
                                {cand.fullName}
                              </span>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                                {cand.familyName ? (
                                  <span className="text-amber-600 dark:text-amber-400 font-medium">
                                    En: {cand.familyName}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                    Sin familia asignada
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddMemberToFamily(cand, activeManagingFamily)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer shrink-0"
                            title={`Agregar a la ${activeManagingFamily.familyName}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar</span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 space-y-1">
                        <p className="text-xs text-slate-500 font-medium">No se encontraron feligreses disponibles.</p>
                        <p className="text-[11px] text-slate-400">Intente con otra búsqueda o filtre por "Todos".</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span>Al agregar un miembro, heredará la dirección familiar si no tenía una.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer con Botón de Eliminar Familia Completa y Cerrar */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 p-4 shrink-0 bg-slate-50 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  const fam = activeManagingFamily;
                  setDeleteConfirmTarget({
                    type: 'family',
                    id: fam.id,
                    title: `¿Eliminar toda la familia ${fam.familyName}?`,
                    subtitle: `Esta acción desvinculará a los ${activeFamilyMembers.length} integrantes y enviará la familia a la Papelera.`,
                  });
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Familia Completa</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setManagingFamily(null);
                  setMemberSearchInFamilyModal('');
                }}
                className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Listo / Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL SEGURO DE CONFIRMACIÓN DE ELIMINACIÓN (REACT PURO)
          ¿Para qué es?: Alerta flotante de confirmación para eliminar miembros, familias o desvincular.
          ¿Por qué se usa?: 100% libre de bloqueos de navegador, seguro y persistente.
         ========================================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {deleteConfirmTarget.title}
                </h3>
                {deleteConfirmTarget.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {deleteConfirmTarget.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300">
              ℹ️ Los registros eliminados van a la <strong>Papelera de Reciclaje</strong> para recuperación en caso de error.
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Proceder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Captura y Carga Fotográfica */}
      <PhotoCaptureModal
        isOpen={isMemberPhotoModalOpen}
        onClose={() => setIsMemberPhotoModalOpen(false)}
        onPhotoSelected={(url) => setFormData({ ...formData, photoUrl: url })}
        currentPhotoUrl={formData.photoUrl}
        title={formData.fullName ? `Foto de ${formData.fullName}` : 'Fotografía del Feligrés'}
        subtitle="Sube una foto o tómate una captura con la cámara de tu dispositivo"
      />

      {/* Modal para Crear / Editar Cargos Eclesiásticos */}
      <EcclesiasticalRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setRoleToEditInModal(null);
        }}
        roleToEdit={roleToEditInModal}
        onSave={handleSaveEcclesiasticalRole}
        existingRoles={effectiveRoles}
      />
    </div>
  );
};
