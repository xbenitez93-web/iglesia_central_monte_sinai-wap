import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Users,
  Plus,
  Search,
  Send,
  Heart,
  Sparkles,
  BookOpen,
  Bell,
  CheckCircle2,
  Trash2,
  Reply,
  CornerDownRight,
  Smile,
  Info,
  Calendar,
  UserCheck,
  UserPlus,
  LogOut,
  X,
  Flame,
  ThumbsUp,
  Filter,
  Shield,
  Clock,
  Pencil,
  AlertTriangle,
  Palette,
  Lock,
  Check,
} from 'lucide-react';
import { saveFirestoreDoc, deleteFirestoreDoc, syncFirestoreCollection } from '../lib/firebase';

const DEFAULT_GROUPS = [];

const DEFAULT_MESSAGES = [];

const EMOJI_OPTIONS = ['⛪', '🎵', '🏡', '🔥', '🙏', '🤝', '📖', '✨', '🕊️', '👑', '🌿', '❤️', '🍞', '🛡️', '🎺', '💡'];

const CATEGORY_OPTIONS = [
  'General',
  'Células',
  'Ministerios',
  'Jóvenes',
  'Damas',
  'Varones',
  'Intercesión',
  'Estudio Bíblico',
];

const COLOR_GRADIENT_OPTIONS = [
  { id: 'indigo', label: 'Índigo Real', class: 'from-indigo-600 to-blue-700' },
  { id: 'emerald', label: 'Esmeralda Fe', class: 'from-emerald-600 to-teal-700' },
  { id: 'purple', label: 'Violeta Adoración', class: 'from-purple-600 to-violet-700' },
  { id: 'rose', label: 'Rosa Intercesión', class: 'from-rose-600 to-pink-700' },
  { id: 'amber', label: 'Fuego Ferviente', class: 'from-amber-500 to-orange-600' },
  { id: 'cyan', label: 'Cyan Servidores', class: 'from-cyan-600 to-blue-800' },
  { id: 'slate', label: 'Grafito Moderno', class: 'from-slate-700 to-slate-900' },
];

export const ChatView = ({ currentUser, config, onSendToTrash }) => {
  const currentUserId = currentUser?.id || 'u_guest';
  const currentUserName = currentUser?.name || 'Usuario';
  const currentUserRole = currentUser?.role || 'Miembro';
  const currentUserAvatar =
    currentUser?.avatar ||
    currentUser?.avatarUrl ||
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';

  // ===============================================================================================
  // ETIQUETA: CONTROL DE PRIVILEGIOS Y ROLES RBAC (canManageGroups)
  // ¿Para qué es?: Valida estrictamente si el usuario actual es "Administrador" o "Desarrollador".
  // ¿Por qué se usa?: Cumple la regla de seguridad: NADIE más puede modificar ni eliminar grupos.
  // ===============================================================================================
  const canManageGroups =
    currentUserRole === 'Administrador' || currentUserRole === 'Desarrollador';

  // Persistence State
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('eclesia_chatGroups');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing chat groups', e);
      }
    }
    return DEFAULT_GROUPS;
  });

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('eclesia_chatMessages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing chat messages', e);
      }
    }
    return DEFAULT_MESSAGES;
  });

  useEffect(() => {
    localStorage.setItem('eclesia_chatGroups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('eclesia_chatMessages', JSON.stringify(messages));
  }, [messages]);

  // Sincronización con Firestore para grupos y mensajes
  useEffect(() => {
    const unsubGroups = syncFirestoreCollection('chatGroups', (docs) => {
      if (docs && docs.length > 0) {
        setGroups(docs);
      }
    });

    const unsubMessages = syncFirestoreCollection('chatMessages', (docs) => {
      if (docs && docs.length > 0) {
        setMessages(docs);
      }
    });

    return () => {
      if (unsubGroups) unsubGroups();
      if (unsubMessages) unsubMessages();
    };
  }, []);

  // Sincronización en tiempo real ante eventos externos (ej. Restaurar de papelera)
  useEffect(() => {
    const handleStorageSync = () => {
      const savedGroups = localStorage.getItem('eclesia_chatGroups');
      if (savedGroups) {
        try {
          setGroups(JSON.parse(savedGroups));
        } catch (e) {}
      }
    };
    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // View & Filter States
  const [activeGroupId, setActiveGroupId] = useState(() => {
    return groups.length > 0 ? groups[0].id : 'grp_general';
  });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMyGroups, setOnlyMyGroups] = useState(false);

  // Message Input States
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState('standard');
  const [verseRef, setVerseRef] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);

  // Modals
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [isGroupInfoModalOpen, setIsGroupInfoModalOpen] = useState(false);

  // Target groups for Edit / Delete operations
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);

  // New Group Form State
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    description: '',
    category: 'Células',
    avatarEmoji: '🏡',
    colorTheme: 'from-indigo-600 to-blue-700',
    leaderName: currentUserName,
    meetingSchedule: 'Miércoles 7:30 PM',
  });

  // Edit Group Form State
  const [editGroupForm, setEditGroupForm] = useState({
    id: '',
    name: '',
    description: '',
    category: 'Células',
    avatarEmoji: '🏡',
    colorTheme: 'from-indigo-600 to-blue-700',
    leaderName: '',
    meetingSchedule: '',
  });

  const messagesEndRef = useRef(null);

  const activeGroup = groups.find((g) => g.id === activeGroupId) || (groups.length > 0 ? groups[0] : null);

  const isUserMemberOfActiveGroup =
    activeGroup && activeGroup.memberIds && activeGroup.memberIds.includes(currentUserId);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGroupId]);

  // Group Filtering
  const filteredGroups = groups.filter((grp) => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (grp.name || '').toLowerCase().includes(q) ||
      (grp.description || '').toLowerCase().includes(q) ||
      (grp.leaderName || '').toLowerCase().includes(q);

    const matchesCategory = categoryFilter === 'all' || grp.category === categoryFilter;

    const matchesMembership = !onlyMyGroups || (grp.memberIds && grp.memberIds.includes(currentUserId));

    return matchesSearch && matchesCategory && matchesMembership;
  });

  // Messages in active group
  const activeGroupMessages = activeGroup ? messages.filter((m) => m.groupId === activeGroup.id) : [];

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA UNIRSE / SALIR DEL GRUPO (handleToggleJoinGroup)
  // ¿Para qué es?: Permite a cualquier miembro de la iglesia participar en los grupos de su interés.
  // ===============================================================================================
  const handleToggleJoinGroup = (groupId) => {
    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id === groupId) {
          const currentMembers = g.memberIds || [];
          const isMember = currentMembers.includes(currentUserId);
          const updatedMembers = isMember
            ? currentMembers.filter((id) => id !== currentUserId)
            : [...currentMembers, currentUserId];
          const updatedGroup = { ...g, memberIds: updatedMembers };
          saveFirestoreDoc('chatGroups', updatedGroup.id, updatedGroup);
          return updatedGroup;
        }
        return g;
      })
    );
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA ENVIAR MENSAJES (handleSendMessage)
  // ¿Para qué es?: Publica texto, versículos, peticiones de oración o avisos con formato enriquecido.
  // ===============================================================================================
  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeGroup) return;

    const newMessage = {
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      groupId: activeGroup.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: currentUserAvatar,
      content: messageText.trim(),
      messageType: messageType,
      verseReference: messageType === 'verse' && verseRef.trim() ? verseRef.trim() : undefined,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderName: replyingTo.senderName,
            content: replyingTo.content,
          }
        : undefined,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMessage]);
    saveFirestoreDoc('chatMessages', newMessage.id, newMessage);

    setMessageText('');
    setVerseRef('');
    setMessageType('standard');
    setReplyingTo(null);

    // Auto-unir al grupo si el usuario escribe en él
    if (!activeGroup.memberIds || !activeGroup.memberIds.includes(currentUserId)) {
      handleToggleJoinGroup(activeGroup.id);
    }
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA REACCIONES EMOJI (handleToggleReaction)
  // ¿Para qué es?: Permite interactuar con oraciones, bendiciones y apoyo a los mensajes.
  // ===============================================================================================
  const handleToggleReaction = (messageId, emoji) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReactions = { ...(msg.reactions || {}) };
          const userList = existingReactions[emoji] || [];

          if (userList.includes(currentUserId)) {
            const filtered = userList.filter((uid) => uid !== currentUserId);
            if (filtered.length === 0) {
              delete existingReactions[emoji];
            } else {
              existingReactions[emoji] = filtered;
            }
          } else {
            existingReactions[emoji] = [...userList, currentUserId];
          }

          const updated = { ...msg, reactions: existingReactions };
          saveFirestoreDoc('chatMessages', updated.id, updated);
          return updated;
        }
        return msg;
      })
    );
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA ELIMINAR MENSAJE (handleDeleteMessage)
  // ¿Para qué es?: Permite borrar mensajes propios o a los Administradores/Desarrolladores moderar.
  // ===============================================================================================
  const handleDeleteMessage = (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    deleteFirestoreDoc('chatMessages', messageId);
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA CREAR GRUPO PEQUEÑO (handleCreateGroup)
  // ¿Para qué es?: Registra un nuevo grupo o canal en la iglesia.
  // ¿Por qué se usa?: Exclusivo para Administrador y Desarrollador.
  // ===============================================================================================
  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!canManageGroups || !newGroupForm.name.trim()) return;

    const createdGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupForm.name.trim(),
      description: newGroupForm.description.trim() || 'Grupo pequeño de crecimiento y comunión en la fe.',
      category: newGroupForm.category,
      avatarEmoji: newGroupForm.avatarEmoji,
      colorTheme: newGroupForm.colorTheme || 'from-indigo-600 to-blue-700',
      createdBy: currentUserName,
      createdById: currentUserId,
      createdAt: new Date().toISOString().split('T')[0],
      memberIds: [currentUserId],
      leaderName: newGroupForm.leaderName.trim() || currentUserName,
      meetingSchedule: newGroupForm.meetingSchedule.trim() || 'Por definir',
    };

    setGroups((prev) => [createdGroup, ...prev]);
    saveFirestoreDoc('chatGroups', createdGroup.id, createdGroup);

    setActiveGroupId(createdGroup.id);
    setIsNewGroupModalOpen(false);
    setNewGroupForm({
      name: '',
      description: '',
      category: 'Células',
      avatarEmoji: '🏡',
      colorTheme: 'from-indigo-600 to-blue-700',
      leaderName: currentUserName,
      meetingSchedule: 'Miércoles 7:30 PM',
    });

    // Mensaje de bienvenida inicial
    const welcomeMsg = {
      id: `msg_init_${Date.now()}`,
      groupId: createdGroup.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: currentUserRole,
      senderAvatar: currentUserAvatar,
      content: `¡Bienvenidos al nuevo canal "${createdGroup.name}"! Iniciamos este espacio para bendecirnos y crecer juntos en el Señor.`,
      messageType: 'announcement',
      timestamp: new Date().toISOString(),
      reactions: { '🙏': [currentUserId] },
    };
    setMessages((prev) => [...prev, welcomeMsg]);
    saveFirestoreDoc('chatMessages', welcomeMsg.id, welcomeMsg);
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA ABRIR EDICIÓN DE GRUPO (handleOpenEditGroupModal)
  // ¿Para qué es?: Abre el formulario con los datos cargados del grupo seleccionado.
  // ¿Por qué se usa?: Solo accesible por roles Administrador y Desarrollador.
  // ===============================================================================================
  const handleOpenEditGroupModal = (grp) => {
    if (!canManageGroups || !grp) return;
    setGroupToEdit(grp);
    setEditGroupForm({
      id: grp.id,
      name: grp.name || '',
      description: grp.description || '',
      category: grp.category || 'Células',
      avatarEmoji: grp.avatarEmoji || '🏡',
      colorTheme: grp.colorTheme || 'from-indigo-600 to-blue-700',
      leaderName: grp.leaderName || '',
      meetingSchedule: grp.meetingSchedule || '',
    });
    setIsEditGroupModalOpen(true);
    setIsGroupInfoModalOpen(false);
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA GUARDAR EDICIÓN DE GRUPO (handleSaveEditGroup)
  // ¿Para qué es?: Aplica las modificaciones de nombre, categoría, horario, líder y estilo al grupo.
  // ===============================================================================================
  const handleSaveEditGroup = (e) => {
    if (e) e.preventDefault();
    if (!canManageGroups || !groupToEdit || !editGroupForm.name.trim()) return;

    setGroups((prevGroups) =>
      prevGroups.map((g) => {
        if (g.id === groupToEdit.id) {
          const updated = {
            ...g,
            name: editGroupForm.name.trim(),
            description: editGroupForm.description.trim(),
            category: editGroupForm.category,
            avatarEmoji: editGroupForm.avatarEmoji,
            colorTheme: editGroupForm.colorTheme,
            leaderName: editGroupForm.leaderName.trim() || g.leaderName,
            meetingSchedule: editGroupForm.meetingSchedule.trim() || g.meetingSchedule,
          };
          saveFirestoreDoc('chatGroups', updated.id, updated);
          return updated;
        }
        return g;
      })
    );

    setIsEditGroupModalOpen(false);
    setGroupToEdit(null);
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA ABRIR MODAL DE ELIMINACIÓN (handleOpenDeleteGroupModal)
  // ¿Para qué es?: Despliega la ventana de confirmación segura antes de borrar un grupo eclesial.
  // ¿Por qué se usa?: Protege la congregación contra eliminaciones no deseadas.
  // ===============================================================================================
  const handleOpenDeleteGroupModal = (grp) => {
    if (!canManageGroups || !grp) return;
    setGroupToDelete(grp);
    setIsDeleteGroupModalOpen(true);
    setIsGroupInfoModalOpen(false);
  };

  // ===============================================================================================
  // ETIQUETA: CONTROLADOR PARA CONFIRMAR ELIMINACIÓN DE GRUPO (handleConfirmDeleteGroup)
  // ¿Para qué es?: Elimina el grupo seleccionado, lo envía a la Papelera de Reciclaje y reasigna la vista.
  // ===============================================================================================
  const handleConfirmDeleteGroup = () => {
    if (!canManageGroups || !groupToDelete) return;

    // Enviar a la papelera de reciclaje para respaldo seguro
    if (onSendToTrash) {
      onSendToTrash(
        'chatGroup',
        groupToDelete.id,
        `Grupo: ${groupToDelete.name}`,
        `${groupToDelete.category} • Líder: ${groupToDelete.leaderName}`,
        groupToDelete
      );
    }

    const remainingGroups = groups.filter((g) => g.id !== groupToDelete.id);
    setGroups(remainingGroups);
    deleteFirestoreDoc('chatGroups', groupToDelete.id);

    // Limpiar mensajes asociados al grupo
    setMessages((prev) => prev.filter((m) => m.groupId !== groupToDelete.id));

    // Si el grupo eliminado estaba activo, cambiar automáticamente
    if (activeGroupId === groupToDelete.id) {
      if (remainingGroups.length > 0) {
        setActiveGroupId(remainingGroups[0].id);
      } else {
        setActiveGroupId('');
      }
    }

    setIsDeleteGroupModalOpen(false);
    setGroupToDelete(null);
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div id="chat-module-container" className="space-y-4">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl border border-indigo-500/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-300" />
              <span>Comunión, Células & Grupos Pequeños</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Chat & Red de Grupos Eclesia
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/80 max-w-2xl">
              Conéctate en tiempo real con tus células, ministerios y hermanos en la fe. Comparte peticiones de oración, avisos y versículos bíblicos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {canManageGroups ? (
              <button
                id="btn-create-chat-group"
                onClick={() => setIsNewGroupModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-white text-indigo-950 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition-all flex items-center space-x-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 text-indigo-900" />
                <span>Crear Grupo Pequeño</span>
              </button>
            ) : (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-indigo-200 border border-white/15 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-indigo-300" />
                <span>Gestión reservada a Admin y Dev</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Interface: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* Left Column: Groups List & Filters */}
        <div className="lg:col-span-4 flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden">
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Grupos & Canales ({groups.length})</span>
              </h3>
              <button
                onClick={() => setOnlyMyGroups(!onlyMyGroups)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
                  onlyMyGroups
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {onlyMyGroups ? '✓ Mis Grupos' : 'Todos'}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar grupo o líder..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                Todos
              </button>
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 max-h-[500px]">
            {filteredGroups.map((grp) => {
              const isSelected = grp.id === activeGroupId;
              const isMember = grp.memberIds && grp.memberIds.includes(currentUserId);

              return (
                <div
                  key={grp.id}
                  id={`chat-group-item-${grp.id}`}
                  onClick={() => setActiveGroupId(grp.id)}
                  className={`p-3 rounded-2xl transition-all cursor-pointer border text-left flex items-start space-x-3 group relative ${
                    isSelected
                      ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 shadow-xs'
                      : 'bg-white/50 dark:bg-slate-800/40 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs bg-gradient-to-br ${
                      grp.colorTheme || 'from-indigo-600 to-blue-700'
                    } text-white`}
                  >
                    {grp.avatarEmoji || '💬'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {grp.name}
                      </h4>
                      
                      <div className="flex items-center space-x-1 shrink-0">
                        {isMember && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold shrink-0">
                            Miembro
                          </span>
                        )}
                        
                        {/* BOTONES DE EDITAR Y ELIMINAR POR GRUPO (Solo Admin y Desarrollador) */}
                        {canManageGroups && (
                          <div className="flex items-center space-x-0.5 ml-1">
                            <button
                              type="button"
                              id={`btn-edit-group-list-${grp.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditGroupModal(grp);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 dark:hover:text-indigo-300 transition-colors"
                              title="Editar este grupo (Solo Admin/Dev)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              id={`btn-delete-group-list-${grp.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDeleteGroupModal(grp);
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/60 dark:hover:text-rose-300 transition-colors"
                              title="Eliminar este grupo (Solo Admin/Dev)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {grp.description}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        {grp.category}
                      </span>
                      <span>👥 {grp.memberIds?.length || 1} miembros</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No se encontraron grupos para este filtro.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Room & Messages */}
        <div className="lg:col-span-8 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-md overflow-hidden min-h-[580px]">
          {activeGroup ? (
            <>
              {/* Group Header */}
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm bg-gradient-to-br ${
                      activeGroup.colorTheme || 'from-indigo-600 to-blue-700'
                    } text-white`}
                  >
                    {activeGroup.avatarEmoji || '💬'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                        {activeGroup.name}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {activeGroup.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Líder: <strong>{activeGroup.leaderName}</strong> • {activeGroup.memberIds?.length || 1} miembros
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                  {/* BOTONES EXCLUSIVOS PARA ADMINISTRADOR Y DESARROLLADOR EN EL ENCABEZADO */}
                  {canManageGroups && (
                    <>
                      <button
                        type="button"
                        id="btn-edit-active-group"
                        onClick={() => handleOpenEditGroupModal(activeGroup)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 flex items-center space-x-1.5 transition-all cursor-pointer"
                        title="Editar Grupo (Solo Administradores y Desarrolladores)"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Editar</span>
                      </button>

                      <button
                        type="button"
                        id="btn-delete-active-group"
                        onClick={() => handleOpenDeleteGroupModal(activeGroup)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/80 flex items-center space-x-1.5 transition-all cursor-pointer"
                        title="Eliminar Grupo (Solo Administradores y Desarrolladores)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleToggleJoinGroup(activeGroup.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      isUserMemberOfActiveGroup
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {isUserMemberOfActiveGroup ? (
                      <>
                        <LogOut className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Salir del Grupo</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Unirme al Grupo</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsGroupInfoModalOpen(true)}
                    className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    title="Detalles del Grupo"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Feed Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 max-h-[460px] bg-slate-50/30 dark:bg-slate-950/20">
                {activeGroupMessages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  const reactions = msg.reactions || {};

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col space-y-1 ${
                        isMine ? 'items-end' : 'items-start'
                      }`}
                    >
                      {/* Sender Info (for others) */}
                      {!isMine && (
                        <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 pl-1">
                          <img
                            src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                            alt={msg.senderName}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {msg.senderName}
                          </span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400">
                            • {msg.senderRole}
                          </span>
                        </div>
                      )}

                      {/* Reply Quoted Preview */}
                      {msg.replyTo && (
                        <div
                          className={`text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 max-w-md ${
                            isMine ? 'rounded-br-xs' : 'rounded-bl-xs'
                          }`}
                        >
                          <div className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            <CornerDownRight className="w-3 h-3" />
                            <span>En respuesta a {msg.replyTo.senderName}</span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 truncate text-[11px]">
                            {msg.replyTo.content}
                          </p>
                        </div>
                      )}

                      {/* Message Bubble Card */}
                      <div
                        className={`group relative max-w-lg rounded-2xl p-3.5 shadow-xs transition-all ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : msg.messageType === 'prayer'
                            ? 'bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-white rounded-tl-xs'
                            : msg.messageType === 'verse'
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white rounded-tl-xs'
                            : msg.messageType === 'announcement'
                            ? 'bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-slate-900 dark:text-white rounded-tl-xs'
                            : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white rounded-tl-xs'
                        }`}
                      >
                        {/* Type Badge Header */}
                        {msg.messageType === 'prayer' && (
                          <div className="flex items-center space-x-1 text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 mb-1">
                            <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                            <span>Petición de Oración</span>
                          </div>
                        )}
                        {msg.messageType === 'verse' && (
                          <div className="flex items-center space-x-1 text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 mb-1">
                            <BookOpen className="w-3 h-3" />
                            <span>Palabra & Versículo {msg.verseReference ? `(${msg.verseReference})` : ''}</span>
                          </div>
                        )}
                        {msg.messageType === 'announcement' && (
                          <div className="flex items-center space-x-1 text-[10px] font-extrabold uppercase text-blue-600 dark:text-blue-400 mb-1">
                            <Bell className="w-3 h-3" />
                            <span>Aviso Congregacional</span>
                          </div>
                        )}

                        {/* Content */}
                        <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>

                        {/* Timestamp & Actions */}
                        <div
                          className={`flex items-center justify-between text-[10px] pt-2 mt-1 border-t ${
                            isMine
                              ? 'border-indigo-500/40 text-indigo-200'
                              : 'border-slate-200/60 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <span>{formatMessageTime(msg.timestamp)}</span>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="p-1 rounded-md hover:bg-black/10 transition-colors cursor-pointer"
                              title="Responder"
                            >
                              <Reply className="w-3 h-3" />
                            </button>

                            {(isMine || currentUserRole === 'Administrador' || currentUserRole === 'Desarrollador') && (
                              <button
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 rounded-md hover:bg-rose-500/20 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reactions Row */}
                      <div className="flex flex-wrap items-center gap-1 pl-1">
                        {['🙏', '❤️', '🙌', '👍', '🔥'].map((emoji) => {
                          const userList = reactions[emoji] || [];
                          const count = userList.length;
                          const hasReacted = userList.includes(currentUserId);

                          if (count === 0 && !isMine) {
                            return null;
                          }

                          return (
                            <button
                              key={emoji}
                              onClick={() => handleToggleReaction(msg.id, emoji)}
                              className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-all cursor-pointer flex items-center space-x-1 ${
                                hasReacted
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-bold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                              }`}
                            >
                              <span>{emoji}</span>
                              {count > 0 && <span>{count}</span>}
                            </button>
                          );
                        })}

                        {/* Quick Add Reaction Button */}
                        <div className="relative group/react inline-block">
                          <button className="text-[10px] p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                            <Smile className="w-3 h-3" />
                          </button>
                          <div className="hidden group-hover/react:flex absolute bottom-full left-0 mb-1 p-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 space-x-1 z-10">
                            {['🙏', '❤️', '🙌', '👍', '🔥'].map((emoji) => (
                              <button
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="hover:scale-125 transition-transform p-1 text-xs cursor-pointer"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {activeGroupMessages.length === 0 && (
                  <div className="p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                    <h4 className="font-bold text-sm text-slate-600 dark:text-slate-300">
                      ¡Inicia la conversación en este grupo!
                    </h4>
                    <p className="text-xs">
                      Comparte un saludo, una petición de oración o una palabra de bendición.
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Reply className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      Respondiendo a <strong>{replyingTo.senderName}</strong>: "{replyingTo.content}"
                    </span>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Bottom Message Input Form */}
              <div className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 space-y-2">
                {/* Message Type Selector */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="text-slate-400 font-bold mr-1">Tipo:</span>
                  <button
                    type="button"
                    onClick={() => setMessageType('standard')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      messageType === 'standard'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    💬 Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('prayer')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      messageType === 'prayer'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    🙏 Petición de Oración
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('verse')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      messageType === 'verse'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    📖 Versículo Bíblico
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('announcement')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      messageType === 'announcement'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    📢 Aviso Oficial
                  </button>
                </div>

                {/* Verse Ref input if type is verse */}
                {messageType === 'verse' && (
                  <input
                    type="text"
                    placeholder="Referencia bíblica (ej. Juan 3:16, Filipenses 4:13)..."
                    value={verseRef}
                    onChange={(e) => setVerseRef(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-slate-800 dark:text-slate-200 outline-none"
                  />
                )}

                {/* Text Field & Send Button */}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder={`Escribe un mensaje para ${activeGroup.name}...`}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim()}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Enviar</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-sm font-semibold">No hay grupos disponibles. Crea uno nuevo para comenzar.</p>
            </div>
          )}
        </div>
      </div>

      {/* =============================================================================================== */}
      {/* MODAL 1: CREAR NUEVO GRUPO PEQUEÑO (Solo Admin y Desarrollador) */}
      {/* =============================================================================================== */}
      {isNewGroupModalOpen && canManageGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>Crear Nuevo Grupo Pequeño o Célula</span>
              </h3>
              <button
                onClick={() => setIsNewGroupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Grupo / Célula *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Célula Monte Sion - Familia Rodríguez"
                  value={newGroupForm.name}
                  onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newGroupForm.category}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ícono / Emoji
                  </label>
                  <div className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setNewGroupForm({ ...newGroupForm, avatarEmoji: emoji })}
                        className={`text-lg p-1.5 rounded-xl border transition-transform cursor-pointer shrink-0 ${
                          newGroupForm.avatarEmoji === emoji
                            ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-500 scale-110'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selector de Color y Gradiente */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estilo de Color / Tema Visual
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {COLOR_GRADIENT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setNewGroupForm({ ...newGroupForm, colorTheme: opt.class })}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                        newGroupForm.colorTheme === opt.class
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${opt.class} shrink-0`} />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Líder o Anfitrión(a)
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del hermano(a) líder"
                    value={newGroupForm.leaderName}
                    onChange={(e) => setNewGroupForm({ ...newGroupForm, leaderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horario de Reunión
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Miércoles 7:30 PM"
                    value={newGroupForm.meetingSchedule}
                    onChange={(e) =>
                      setNewGroupForm({ ...newGroupForm, meetingSchedule: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción & Propósito
                </label>
                <textarea
                  rows={2}
                  placeholder="Breve propósito y visión del grupo..."
                  value={newGroupForm.description}
                  onChange={(e) =>
                    setNewGroupForm({ ...newGroupForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* MODAL 2: EDITAR GRUPO (Solo Admin y Desarrollador) */}
      {/* =============================================================================================== */}
      {isEditGroupModalOpen && canManageGroups && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <span>Editar Grupo: {groupToEdit?.name}</span>
              </h3>
              <button
                onClick={() => setIsEditGroupModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditGroup} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Grupo / Célula *
                </label>
                <input
                  type="text"
                  required
                  value={editGroupForm.name}
                  onChange={(e) => setEditGroupForm({ ...editGroupForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editGroupForm.category}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold outline-none"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ícono / Emoji
                  </label>
                  <div className="flex space-x-1 overflow-x-auto py-1 scrollbar-none">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setEditGroupForm({ ...editGroupForm, avatarEmoji: emoji })}
                        className={`text-lg p-1.5 rounded-xl border transition-transform cursor-pointer shrink-0 ${
                          editGroupForm.avatarEmoji === emoji
                            ? 'bg-indigo-100 dark:bg-indigo-950 border-indigo-500 scale-110'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selector de Color y Gradiente */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Estilo de Color / Tema Visual
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {COLOR_GRADIENT_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setEditGroupForm({ ...editGroupForm, colorTheme: opt.class })}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 transition-all cursor-pointer ${
                        editGroupForm.colorTheme === opt.class
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${opt.class} shrink-0`} />
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Líder o Anfitrión(a)
                  </label>
                  <input
                    type="text"
                    value={editGroupForm.leaderName}
                    onChange={(e) => setEditGroupForm({ ...editGroupForm, leaderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horario de Reunión
                  </label>
                  <input
                    type="text"
                    value={editGroupForm.meetingSchedule}
                    onChange={(e) =>
                      setEditGroupForm({ ...editGroupForm, meetingSchedule: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción & Propósito
                </label>
                <textarea
                  rows={2}
                  value={editGroupForm.description}
                  onChange={(e) =>
                    setEditGroupForm({ ...editGroupForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditGroupModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN DE GRUPO (Solo Admin y Desarrollador) */}
      {/* =============================================================================================== */}
      {isDeleteGroupModalOpen && canManageGroups && groupToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                ¿Eliminar el grupo "{groupToDelete.name}"?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Esta acción removerá el grupo eclesial y sus mensajes asociados. El grupo será enviado a la <strong>Papelera de Reciclaje</strong> para recuperación en caso necesario.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Categoría:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{groupToDelete.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Líder:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{groupToDelete.leaderName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Miembros:</span>
                <span className="font-bold text-emerald-600">{groupToDelete.memberIds?.length || 1} hermanos(as)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteGroupModalOpen(false);
                  setGroupToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGroup}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Eliminar Grupo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================================================== */}
      {/* MODAL 4: DETALLES DEL GRUPO (Información Completa) */}
      {/* =============================================================================================== */}
      {isGroupInfoModalOpen && activeGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{activeGroup.avatarEmoji}</span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  {activeGroup.name}
                </h3>
              </div>
              <button
                onClick={() => setIsGroupInfoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">
                  Descripción
                </span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {activeGroup.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Líder
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeGroup.leaderName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Categoría
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {activeGroup.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Reunión
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {activeGroup.meetingSchedule || 'No especificado'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Miembros
                  </span>
                  <span className="font-bold text-emerald-600">
                    {activeGroup.memberIds?.length || 1} hermanos(as)
                  </span>
                </div>
              </div>

              {/* Botones de gestión en el pie del modal */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                {canManageGroups ? (
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditGroupModal(activeGroup)}
                      className="px-3 py-2 rounded-xl text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Editar Grupo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDeleteGroupModal(activeGroup)}
                      className="px-3 py-2 rounded-xl text-xs font-extrabold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/80 border border-rose-200 dark:border-rose-800 flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    * Solo Administradores y Desarrolladores pueden modificar este grupo.
                  </div>
                )}
                
                <button
                  onClick={() => setIsGroupInfoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs cursor-pointer ml-auto"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
