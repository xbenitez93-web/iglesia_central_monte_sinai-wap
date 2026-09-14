import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Vote,
  Trophy,
  Crown,
  CheckCircle2,
  Plus,
  Trash2,
  Edit3,
  Share2,
  Upload,
  Camera,
  Clock,
  RotateCcw,
  Sliders,
  Check,
  X,
  Sparkles,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  Filter,
  BarChart3,
  Search,
  Users,
  Timer,
  Lock,
  ShieldAlert,
  Calendar,
} from 'lucide-react';
import {
  CustomSectionItem,
  PollItem,
  PollOption,
  UserProfile,
  ChurchConfig,
} from '../../../types';
import { saveFirestoreDoc, syncFirestoreCollection } from '../../../lib/firebase';
import {
  generatePresetDate,
  formatExpirationDate,
  toLocalDatetimeInputValue,
} from '../../../utils/sectionExpiration';

interface PollsModuleViewProps {
  section: CustomSectionItem;
  currentUser?: UserProfile | null;
  config?: ChurchConfig;
  onUpdateSectionData?: (updatedSection: CustomSectionItem) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onOpenSectionEditor?: () => void;
}

const DEFAULT_POLL_TEMPLATES: {
  title: string;
  category: string;
  description: string;
  options: { text: string; description: string; imageUrl?: string; color?: string }[];
}[] = [
  {
    title: 'Elección de Coordinador de Campamento Juvenil 2026',
    category: 'Elecciones',
    description: 'Vota con oración y responsabilidad por el hermano o hermana que liderará el equipo de logística y actividades.',
    options: [
      {
        text: 'Hno. David Morales',
        description: 'Líder del grupo de jóvenes universitarios, 5 años de servicio en campamentos.',
        imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        color: '#4f46e5',
      },
      {
        text: 'Hna. Gabriela Santos',
        description: 'Coordinadora de eventos y talleres espirituales con amplia experiencia en retiros.',
        imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        color: '#059669',
      },
      {
        text: 'Hno. Samuel Castillo',
        description: 'Director de audiovisuales y campista activo en misiones comunitarias.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
        color: '#d97706',
      },
    ],
  },
  {
    title: 'Votación de Lema y Tema del Congreso Anual',
    category: 'Congreso',
    description: 'Selecciona la temática espiritual que guiará los mensajes, alabanzas y talleres del congreso 2026.',
    options: [
      {
        text: '«Firmes en la Promesa» (Hebreos 10:23)',
        description: 'Enfoque en perseverancia, fidelidad y fe en tiempos difíciles.',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80',
        color: '#2563eb',
      },
      {
        text: '«Luz en las Tinieblas» (Mateo 5:14)',
        description: 'Enfoque en evangelismo, misiones locales e impacto social.',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
        color: '#7c3aed',
      },
      {
        text: '«Renovados por Su Espíritu» (Romanos 12:2)',
        description: 'Enfoque en avivamiento personal, santidad y transformación espiritual.',
        imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=400&q=80',
        color: '#db2777',
      },
    ],
  },
  {
    title: 'Prioridad de Proyecto de Remodelación Eclesial',
    category: 'Proyectos',
    description: 'Ayúdanos a priorizar la primera fase de construcción financiada con el fondo especial.',
    options: [
      {
        text: 'Nuevas Aulas para Escuela Dominical Infantil',
        description: 'Construcción y acondicionamiento con aire acondicionado y material didáctico.',
        imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80',
        color: '#0284c7',
      },
      {
        text: 'Sistema de Audio y Pantallas LED del Santuario',
        description: 'Renovación de consolas digitales, micrófonos inalámbricos y proyectores.',
        imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80',
        color: '#10b981',
      },
      {
        text: 'Mejora del Área de Cafetería & Parque Infantil',
        description: 'Área de comunión fraterna y juegos seguros para niños tras el culto dominical.',
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80',
        color: '#f59e0b',
      },
    ],
  },
];

export const PollsModuleView: React.FC<PollsModuleViewProps> = ({
  section,
  currentUser,
  config,
  onUpdateSectionData,
  onShowToast,
  onOpenSectionEditor,
}) => {
  // Current user identification for voting
  const voterKey = currentUser?.id || currentUser?.email || 'guest_user';
  const voterDisplayName = currentUser?.name || currentUser?.email || 'Congregante';
  const isAdminOrLeader =
    currentUser?.role === 'Desarrollador' ||
    currentUser?.role === 'Administrador' ||
    currentUser?.role === 'Pastor' ||
    currentUser?.role === 'Líder' ||
    currentUser?.role === 'Líder de Jóvenes';

  // Local polls list initialized from section data
  const [polls, setPolls] = useState<PollItem[]>(() => {
    const sectionPolls = section.pollsData?.polls;
    if (Array.isArray(sectionPolls) && sectionPolls.length > 0) {
      return sectionPolls;
    }
    // Default seed poll if empty
    const seed: PollItem = {
      id: `poll_seed_${Date.now()}`,
      title: DEFAULT_POLL_TEMPLATES[0].title,
      description: DEFAULT_POLL_TEMPLATES[0].description,
      category: DEFAULT_POLL_TEMPLATES[0].category,
      status: 'active',
      createdAt: new Date().toISOString(),
      options: DEFAULT_POLL_TEMPLATES[0].options.map((opt, i) => ({
        id: `opt_${i + 1}`,
        text: opt.text,
        description: opt.description,
        imageUrl: opt.imageUrl,
        color: opt.color,
        votesCount: i === 0 ? 12 : i === 1 ? 9 : 5,
        voterUserIds: [],
      })),
      totalVotes: 26,
    };
    return [seed];
  });

  // Real-time Firestore sync with dedicated polls collection
  useEffect(() => {
    const unsub = syncFirestoreCollection<PollItem>(
      'polls',
      (items) => {
        if (items && items.length > 0) {
          // Merge with current section polls if items are specific to this section or general
          setPolls((prev) => {
            // Keep remote items updated
            const updated = [...prev];
            items.forEach((item) => {
              const idx = updated.findIndex((p) => p.id === item.id);
              if (idx >= 0) {
                updated[idx] = item;
              } else {
                updated.unshift(item);
              }
            });
            return updated;
          });
        }
      },
      undefined,
      (err) => console.log('Polls sync listener notice:', err)
    );

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPollId, setEditingPollId] = useState<string | null>(null);
  const [deleteConfirmPollId, setDeleteConfirmPollId] = useState<string | null>(null);
  const [resetConfirmPollId, setResetConfirmPollId] = useState<string | null>(null);

  // Form State for creating/editing polls
  const [formData, setFormData] = useState<{
    id: string;
    title: string;
    description: string;
    category: string;
    status: 'active' | 'closed' | 'draft';
    allowMultipleVotes: boolean;
    enableCountdown: boolean;
    expiresAt: string;
    onExpireAction:
      | 'close_and_show_winner'
      | 'close_and_lock'
      | 'close_and_hide_results'
      | 'close_with_custom_message'
      | 'hide_poll';
    showLiveCountdown: boolean;
    expiredCustomMessage: string;
    options: {
      id: string;
      text: string;
      description: string;
      imageUrl: string;
      color: string;
    }[];
  }>({
    id: '',
    title: '',
    description: '',
    category: 'Elecciones',
    status: 'active',
    allowMultipleVotes: false,
    enableCountdown: false,
    expiresAt: '',
    onExpireAction: 'close_and_show_winner',
    showLiveCountdown: true,
    expiredCustomMessage: '',
    options: [
      { id: 'opt_1', text: '', description: '', imageUrl: '', color: '#4f46e5' },
      { id: 'opt_2', text: '', description: '', imageUrl: '', color: '#059669' },
    ],
  });

  // Photo upload target ref
  const optionImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingOptionIndex, setUploadingOptionIndex] = useState<number | null>(null);

  // Real-time ticking for live countdown clocks & automated expiration check
  const [nowTimestamp, setNowTimestamp] = useState<number>(() => Date.now());
  const processedExpiredRef = useRef<Set<string>>(new Set());
  const [revealedResultsPollIds, setRevealedResultsPollIds] = useState<Set<string>>(new Set());

  // Toggle leader preview of hidden poll results (when action is close_and_hide_results)
  const handleToggleRevealHiddenResults = (pollId: string) => {
    setRevealedResultsPollIds((prev) => {
      const next = new Set(prev);
      if (next.has(pollId)) next.delete(pollId);
      else next.add(pollId);
      return next;
    });
  };

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    polls.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [polls]);

  // Filtered polls
  const filteredPolls = useMemo(() => {
    return polls.filter((p) => {
      // If poll expired with 'hide_poll' action and user is not admin, hide it from public view
      if (p.status === 'closed' && p.onExpireAction === 'hide_poll' && !isAdminOrLeader) {
        return false;
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.options.some((o) => o.text.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;

      return matchSearch && matchStatus && matchCategory;
    });
  }, [polls, searchQuery, statusFilter, categoryFilter, isAdminOrLeader]);

  // Helper to persist poll updates to state, section config, and Firestore
  const persistPolls = (updatedPolls: PollItem[], toastMsg?: string) => {
    setPolls(updatedPolls);

    // 1. Update in section object
    const updatedSection: CustomSectionItem = {
      ...section,
      pollsData: {
        ...section.pollsData,
        polls: updatedPolls,
      },
      updatedAt: new Date().toISOString(),
    };

    if (onUpdateSectionData) {
      onUpdateSectionData(updatedSection);
    }

    if (toastMsg) {
      onShowToast(toastMsg, 'success');
    }
  };

  // Automatic Poll Closure Handler: triggers when countdown reaches zero
  // Persists to local state, parent section config, and Firestore collection 'polls'
  const handleAutoCloseExpiredPoll = async (poll: PollItem) => {
    if (poll.status !== 'active') return;

    // Determine leading candidate or option
    const sorted = [...poll.options].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));
    const winnerOpt = sorted[0];
    const hasWinner = winnerOpt && (winnerOpt.votesCount || 0) > 0;

    const closedPoll: PollItem = {
      ...poll,
      status: 'closed',
      closedAt: new Date().toISOString(),
      closedByCountdown: true,
      winnerOptionId: hasWinner ? winnerOpt.id : undefined,
    };

    // Update in local component state
    setPolls((prev) => prev.map((p) => (p.id === poll.id ? closedPoll : p)));

    // Update section in ChurchConfig & LocalStorage
    if (onUpdateSectionData) {
      const updatedSection: CustomSectionItem = {
        ...section,
        pollsData: {
          ...section.pollsData,
          polls: polls.map((p) => (p.id === poll.id ? closedPoll : p)),
        },
        updatedAt: new Date().toISOString(),
      };
      onUpdateSectionData(updatedSection);
    }

    // Direct Firestore collection synchronization
    try {
      await saveFirestoreDoc('polls', closedPoll.id, closedPoll);
    } catch (e) {
      console.warn('Auto-close Firestore poll sync error:', e);
    }

    const actionNotification =
      poll.onExpireAction === 'close_and_show_winner'
        ? 'Cerrada oficialmente y proclamando ganador con podio 🏆'
        : poll.onExpireAction === 'close_and_hide_results'
        ? 'Cerrada y resultados puestos en custodia pastoral 🔒'
        : poll.onExpireAction === 'close_with_custom_message'
        ? 'Cerrada con comunicado de agradecimiento 📢'
        : poll.onExpireAction === 'hide_poll'
        ? 'Cerrada y archivada automáticamente 🙈'
        : 'Cerrada y bloqueada para nuevos votos 🔒';

    onShowToast(`⏱️ «${poll.title}»: ¡Cuenta regresiva concluida! ${actionNotification}`, 'info');
  };

  // Interval loop: updates nowTimestamp every second and triggers auto-close on expiry
  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNowTimestamp(current);

      polls.forEach((p) => {
        if (p.status === 'active' && p.expiresAt) {
          const deadline = new Date(p.expiresAt).getTime();
          if (!isNaN(deadline) && deadline <= current && !processedExpiredRef.current.has(p.id)) {
            processedExpiredRef.current.add(p.id);
            handleAutoCloseExpiredPoll(p);
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [polls]);

  // Quick Extend time for leaders/pastors
  const handleExtendPollDeadline = async (pollId: string, minutes: number) => {
    const target = polls.find((p) => p.id === pollId);
    if (!target) return;

    const base =
      target.expiresAt && new Date(target.expiresAt).getTime() > Date.now()
        ? new Date(target.expiresAt)
        : new Date();
    base.setMinutes(base.getMinutes() + minutes);

    const updatedPoll: PollItem = {
      ...target,
      status: 'active', // Reabre si estaba cerrada
      expiresAt: base.toISOString(),
      closedByCountdown: false,
    };

    processedExpiredRef.current.delete(pollId);

    const updatedList = polls.map((p) => (p.id === pollId ? updatedPoll : p));
    persistPolls(
      updatedList,
      `⏱️ Vigencia de votación extendida ${
        minutes >= 1440
          ? `${Math.round(minutes / 1440)} día(s)`
          : `${Math.round(minutes / 60)} hora(s)`
      }.`
    );

    try {
      await saveFirestoreDoc('polls', updatedPoll.id, updatedPoll);
    } catch (e) {
      console.warn('Extend poll Firestore sync error:', e);
    }
  };

  // Voting handler: casts vote for an option
  const handleVote = async (pollId: string, optionId: string) => {
    const targetPoll = polls.find((p) => p.id === pollId);
    if (!targetPoll) return;

    if (targetPoll.status === 'closed') {
      onShowToast('Esta encuesta ha finalizado. No se reciben más votos.', 'info');
      return;
    }

    // Check if user already voted for this option
    const currentOption = targetPoll.options.find((o) => o.id === optionId);
    const alreadyVotedThis = currentOption?.voterUserIds?.includes(voterKey);

    let updatedOptions: PollOption[] = [];

    if (alreadyVotedThis) {
      // Retract vote
      updatedOptions = targetPoll.options.map((opt) => {
        if (opt.id === optionId) {
          const newVoters = (opt.voterUserIds || []).filter((id) => id !== voterKey);
          return {
            ...opt,
            votesCount: Math.max(0, (opt.votesCount || 0) - 1),
            voterUserIds: newVoters,
          };
        }
        return opt;
      });
      onShowToast('Has retirado tu voto de esta opción.', 'info');
    } else {
      // If single choice: remove user's vote from any other options first
      updatedOptions = targetPoll.options.map((opt) => {
        const hadVoted = (opt.voterUserIds || []).includes(voterKey);
        let newCount = opt.votesCount || 0;
        let newVoters = opt.voterUserIds || [];

        if (hadVoted && !targetPoll.allowMultipleVotes) {
          newCount = Math.max(0, newCount - 1);
          newVoters = newVoters.filter((id) => id !== voterKey);
        }

        if (opt.id === optionId) {
          newCount += 1;
          newVoters = [...newVoters, voterKey];
        }

        return {
          ...opt,
          votesCount: newCount,
          voterUserIds: newVoters,
        };
      });

      onShowToast(`¡Tu voto por "${currentOption?.text}" ha sido registrado!`, 'success');
    }

    // Recalculate total votes
    const newTotalVotes = updatedOptions.reduce((acc, curr) => acc + (curr.votesCount || 0), 0);

    const updatedPoll: PollItem = {
      ...targetPoll,
      options: updatedOptions,
      totalVotes: newTotalVotes,
    };

    const updatedPollsList = polls.map((p) => (p.id === pollId ? updatedPoll : p));
    persistPolls(updatedPollsList);

    // Save directly to Firestore collection 'polls' as well for instant multi-user sync
    try {
      await saveFirestoreDoc('polls', updatedPoll.id, updatedPoll);
    } catch (e) {
      console.warn('Firestore poll write note:', e);
    }
  };

  // Toggle status: close / reopen
  const handleToggleStatus = async (pollId: string) => {
    const targetPoll = polls.find((p) => p.id === pollId);
    if (!targetPoll) return;

    const newStatus: 'active' | 'closed' = targetPoll.status === 'active' ? 'closed' : 'active';
    const updatedPoll: PollItem = { ...targetPoll, status: newStatus };
    const updatedList = polls.map((p) => (p.id === pollId ? updatedPoll : p));

    persistPolls(
      updatedList,
      newStatus === 'closed'
        ? 'Encuesta finalizada y cerrada oficialmente.'
        : 'Encuesta reabierta para votación.'
    );

    try {
      await saveFirestoreDoc('polls', updatedPoll.id, updatedPoll);
    } catch (e) {
      console.warn('Firestore poll update note:', e);
    }
  };

  // Reset votes
  const handleResetVotes = async (pollId: string) => {
    const targetPoll = polls.find((p) => p.id === pollId);
    if (!targetPoll) return;

    const updatedOptions = targetPoll.options.map((opt) => ({
      ...opt,
      votesCount: 0,
      voterUserIds: [],
    }));

    const updatedPoll: PollItem = {
      ...targetPoll,
      options: updatedOptions,
      totalVotes: 0,
    };

    const updatedList = polls.map((p) => (p.id === pollId ? updatedPoll : p));
    persistPolls(updatedList, 'El conteo de votos ha sido reiniciado a cero.');
    setResetConfirmPollId(null);

    try {
      await saveFirestoreDoc('polls', updatedPoll.id, updatedPoll);
    } catch (e) {
      console.warn('Firestore poll reset note:', e);
    }
  };

  // Delete poll
  const handleDeletePoll = async (pollId: string) => {
    const updatedList = polls.filter((p) => p.id !== pollId);
    persistPolls(updatedList, 'Encuesta eliminada correctamente.');
    setDeleteConfirmPollId(null);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormData({
      id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: '',
      description: '',
      category: 'Elecciones',
      status: 'active',
      allowMultipleVotes: false,
      enableCountdown: false,
      expiresAt: '',
      onExpireAction: 'close_and_show_winner',
      showLiveCountdown: true,
      expiredCustomMessage: '',
      options: [
        { id: `opt_${Date.now()}_1`, text: '', description: '', imageUrl: '', color: '#4f46e5' },
        { id: `opt_${Date.now()}_2`, text: '', description: '', imageUrl: '', color: '#059669' },
      ],
    });
    setEditingPollId(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (poll: PollItem) => {
    const hasExp = Boolean(poll.expiresAt);
    let formattedExpiresAt = '';
    if (poll.expiresAt) {
      try {
        formattedExpiresAt = toLocalDatetimeInputValue(new Date(poll.expiresAt));
      } catch {
        formattedExpiresAt = poll.expiresAt;
      }
    }

    setFormData({
      id: poll.id,
      title: poll.title,
      description: poll.description || '',
      category: poll.category || 'General',
      status: poll.status,
      allowMultipleVotes: !!poll.allowMultipleVotes,
      enableCountdown: hasExp,
      expiresAt: formattedExpiresAt,
      onExpireAction: poll.onExpireAction || 'close_and_show_winner',
      showLiveCountdown: poll.showLiveCountdown !== false,
      expiredCustomMessage: poll.expiredCustomMessage || '',
      options: poll.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        description: opt.description || '',
        imageUrl: opt.imageUrl || '',
        color: opt.color || '#4f46e5',
      })),
    });
    setEditingPollId(poll.id);
    setIsCreateModalOpen(true);
  };

  // Apply template to form
  const handleApplyTemplate = (tpl: typeof DEFAULT_POLL_TEMPLATES[0]) => {
    setFormData({
      ...formData,
      title: tpl.title,
      category: tpl.category,
      description: tpl.description,
      options: tpl.options.map((opt, i) => ({
        id: `opt_${Date.now()}_${i + 1}`,
        text: opt.text,
        description: opt.description,
        imageUrl: opt.imageUrl || '',
        color: opt.color || '#4f46e5',
      })),
    });
    onShowToast('Plantilla aplicada al formulario.', 'info');
  };

  // Add Option to form
  const handleAddOption = () => {
    const colors = ['#4f46e5', '#059669', '#d97706', '#db2777', '#7c3aed', '#0284c7', '#ea580c'];
    const nextColor = colors[formData.options.length % colors.length];
    setFormData({
      ...formData,
      options: [
        ...formData.options,
        {
          id: `opt_${Date.now()}_${formData.options.length + 1}`,
          text: '',
          description: '',
          imageUrl: '',
          color: nextColor,
        },
      ],
    });
  };

  // Remove Option from form
  const handleRemoveOption = (index: number) => {
    if (formData.options.length <= 2) {
      onShowToast('Una encuesta debe tener al menos 2 opciones.', 'info');
      return;
    }
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  // Handle image upload from file/camera
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingOptionIndex === null) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Por favor selecciona un archivo de imagen válido.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const updatedOptions = [...formData.options];
      if (updatedOptions[uploadingOptionIndex]) {
        updatedOptions[uploadingOptionIndex].imageUrl = dataUrl;
        setFormData({ ...formData, options: updatedOptions });
        onShowToast('Foto cargada exitosamente para la opción.', 'success');
      }
      setUploadingOptionIndex(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Save form (create or edit)
  const handleSavePollForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      onShowToast('Por favor ingresa el título o pregunta de la encuesta.', 'danger');
      return;
    }

    const validOptions = formData.options.filter((o) => o.text.trim() !== '');
    if (validOptions.length < 2) {
      onShowToast('Debes ingresar al menos 2 opciones con nombre.', 'danger');
      return;
    }

    // Resolve expiration date and options
    let resolvedExpiresAt: string | undefined = undefined;
    if (formData.enableCountdown && formData.expiresAt) {
      try {
        resolvedExpiresAt = new Date(formData.expiresAt).toISOString();
      } catch {
        resolvedExpiresAt = formData.expiresAt;
      }
    }

    if (editingPollId) {
      // Edit existing
      const existing = polls.find((p) => p.id === editingPollId);
      const existingOptionsMap = new Map<string, PollOption>((existing?.options || []).map((o) => [o.id, o]));

      const finalOptions: PollOption[] = validOptions.map((opt) => {
        const prevOpt = existingOptionsMap.get(opt.id);
        return {
          id: opt.id,
          text: opt.text.trim(),
          description: opt.description.trim(),
          imageUrl: opt.imageUrl.trim(),
          color: opt.color,
          votesCount: prevOpt ? prevOpt.votesCount : 0,
          voterUserIds: prevOpt ? prevOpt.voterUserIds : [],
        };
      });

      const totalVotes = finalOptions.reduce((acc, curr) => acc + curr.votesCount, 0);

      // If user reset or changed countdown, clear from processed expiry set so it can trigger properly
      if (resolvedExpiresAt) {
        processedExpiredRef.current.delete(editingPollId);
      }

      const updatedPoll: PollItem = {
        id: editingPollId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        allowMultipleVotes: formData.allowMultipleVotes,
        expiresAt: resolvedExpiresAt,
        onExpireAction: formData.enableCountdown ? formData.onExpireAction : undefined,
        showLiveCountdown: formData.enableCountdown ? formData.showLiveCountdown : undefined,
        expiredCustomMessage: formData.enableCountdown ? formData.expiredCustomMessage.trim() : undefined,
        closedByCountdown: formData.status === 'active' ? false : existing?.closedByCountdown,
        options: finalOptions,
        totalVotes,
      };

      const updatedList = polls.map((p) => (p.id === editingPollId ? updatedPoll : p));
      persistPolls(updatedList, 'Encuesta actualizada correctamente.');

      try {
        await saveFirestoreDoc('polls', updatedPoll.id, updatedPoll);
      } catch (err) {
        console.warn('Firestore poll save note:', err);
      }
    } else {
      // Create new
      const newPoll: PollItem = {
        id: formData.id || `poll_${Date.now()}`,
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        allowMultipleVotes: formData.allowMultipleVotes,
        expiresAt: resolvedExpiresAt,
        onExpireAction: formData.enableCountdown ? formData.onExpireAction : undefined,
        showLiveCountdown: formData.enableCountdown ? formData.showLiveCountdown : undefined,
        expiredCustomMessage: formData.enableCountdown ? formData.expiredCustomMessage.trim() : undefined,
        createdAt: new Date().toISOString(),
        options: validOptions.map((opt) => ({
          id: opt.id,
          text: opt.text.trim(),
          description: opt.description.trim(),
          imageUrl: opt.imageUrl.trim(),
          color: opt.color,
          votesCount: 0,
          voterUserIds: [],
        })),
        totalVotes: 0,
      };

      const updatedList = [newPoll, ...polls];
      persistPolls(updatedList, '¡Nueva encuesta creada exitosamente!');

      try {
        await saveFirestoreDoc('polls', newPoll.id, newPoll);
      } catch (err) {
        console.warn('Firestore poll create note:', err);
      }
    }

    setIsCreateModalOpen(false);
    setEditingPollId(null);
  };

  // Share Poll to WhatsApp or Clipboard
  const handleSharePoll = (poll: PollItem) => {
    let msg = `📊 *${poll.title}*\n`;
    if (poll.description) msg += `${poll.description}\n\n`;
    msg += `*Opciones y Resultados:*\n`;

    const total = poll.totalVotes || 0;
    const sortedOptions = [...poll.options].sort((a, b) => (b.votesCount || 0) - (a.votesCount || 0));

    sortedOptions.forEach((opt, idx) => {
      const pct = total > 0 ? Math.round(((opt.votesCount || 0) / total) * 100) : 0;
      const medal = idx === 0 && (opt.votesCount || 0) > 0 ? '👑 ' : `${idx + 1}. `;
      msg += `${medal}${opt.text}: ${opt.votesCount || 0} votos (${pct}%)\n`;
    });

    msg += `\nParticipa en la app oficial de la congregación.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(msg);
      onShowToast('¡Resultados de la encuesta copiados al portapapeles!', 'success');
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Stats
  const totalVotesAcrossAllPolls = useMemo(() => {
    return polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);
  }, [polls]);

  const activePollsCount = useMemo(() => {
    return polls.filter((p) => p.status === 'active').length;
  }, [polls]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hidden file input for option images */}
      <input
        ref={optionImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* Top Header & Stats Summary */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 text-xs font-black">
              <Vote className="w-3.5 h-3.5" />
              <span>Módulo de Encuestas & Votaciones Eclesiales</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {section.name || 'Encuestas & Elecciones'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {section.description ||
                'Participa activamente en la toma de decisiones, votaciones de proyectos, elecciones pastorales y consultas con conteo de votos en vivo.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onOpenSectionEditor && (
              <button
                type="button"
                onClick={onOpenSectionEditor}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center space-x-2 transition-all cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                <Sliders className="w-4 h-4 text-purple-600" />
                <span>Editar Sección</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-purple-600/25 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Nueva Encuesta</span>
            </button>
          </div>
        </div>

        {/* Quick metrics bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30">
            <span className="text-[10px] font-extrabold text-purple-700 dark:text-purple-300 uppercase tracking-wider block">
              Encuestas Activas
            </span>
            <span className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-100">
              {activePollsCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
              Total de Votos
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-100">
              {totalVotesAcrossAllPolls}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
            <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-300 uppercase tracking-wider block">
              Total Encuestas
            </span>
            <span className="text-xl sm:text-2xl font-black text-blue-900 dark:text-blue-100">
              {polls.length}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
            <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">
              Tu Usuario
            </span>
            <span className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-100 truncate block">
              {voterDisplayName}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, descripción o nombre de candidato..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Todas ({polls.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Abiertas ({activePollsCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('closed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'closed'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Finalizadas
          </button>
        </div>

        {/* Category Pills */}
        {categories.length > 2 && (
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 md:pl-3 pt-2 md:pt-0">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-black'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat === 'all' ? 'Categorías' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Polls Listing */}
      {filteredPolls.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center mx-auto text-purple-600">
            <Vote className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-lg text-slate-800 dark:text-white">
              No se encontraron encuestas
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Crea tu primera encuesta o votación con imágenes de candidatos o proyectos para comenzar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-600/20 cursor-pointer inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Encuesta Ahora</span>
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPolls.map((poll) => {
            const totalVotes = poll.totalVotes || 0;
            const isClosed = poll.status === 'closed';

            // Expiration and countdown state calculation
            const hasExp = Boolean(poll.expiresAt);
            const expDate = hasExp ? new Date(poll.expiresAt!) : null;
            const isExpValid = expDate && !isNaN(expDate.getTime());
            const remainingMs = isExpValid ? Math.max(0, expDate.getTime() - nowTimestamp) : 0;
            const days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

            // Hidden results mode check (when action is close_and_hide_results)
            const isResultsCustodyActive = isClosed && poll.onExpireAction === 'close_and_hide_results';
            const isResultsRevealedByLeader = revealedResultsPollIds.has(poll.id);
            const shouldMaskResults = isResultsCustodyActive && !isResultsRevealedByLeader && !isAdminOrLeader;

            // Find current winning option(s)
            const sortedOptions = [...poll.options].sort(
              (a, b) => (b.votesCount || 0) - (a.votesCount || 0)
            );
            const topOption = sortedOptions[0];
            const hasVotes = topOption && (topOption.votesCount || 0) > 0;

            // Check if current user has voted in this poll
            const userVotedOption = poll.options.find((o) =>
              (o.voterUserIds || []).includes(voterKey)
            );

            // Action labels helper
            const expireActionLabel =
              poll.onExpireAction === 'close_and_show_winner'
                ? '🏆 Proclama Ganador Oficial al llegar a cero'
                : poll.onExpireAction === 'close_and_lock'
                ? '🔒 Cierra y Bloquea Votación al llegar a cero'
                : poll.onExpireAction === 'close_and_hide_results'
                ? '👁️ Cierra y Pasa Resultados a Custodia Pastoral'
                : poll.onExpireAction === 'close_with_custom_message'
                ? '📢 Publica Comunicado al llegar a cero'
                : poll.onExpireAction === 'hide_poll'
                ? '🙈 Cierra y Archiva del Listado al llegar a cero'
                : '🔒 Cierre Programado';

            return (
              <div
                key={poll.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all hover:border-purple-300 dark:hover:border-purple-900/60"
              >
                {/* Poll Card Top Header */}
                <div className="p-6 sm:p-7 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50/50 to-white dark:from-slate-800/30 dark:to-slate-900 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status badge */}
                      {isClosed ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase">
                          <Lock className="w-3 h-3 text-slate-500" />
                          <span>Finalizada</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          <span>Votación Activa</span>
                        </span>
                      )}

                      {poll.category && (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold">
                          {poll.category}
                        </span>
                      )}

                      {poll.expiresAt && !isClosed && (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <Clock className="w-3 h-3 text-amber-500" />
                          <span>Cierre: {formatExpirationDate(poll.expiresAt)}</span>
                        </span>
                      )}

                      {userVotedOption && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-black">
                          <Check className="w-3 h-3 text-blue-600" />
                          <span>Ya votaste</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                      {poll.title}
                    </h3>

                    {poll.description && (
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                        {poll.description}
                      </p>
                    )}
                  </div>

                  {/* Poll Actions Dropdown / Toolbar */}
                  <div className="flex items-center space-x-2 shrink-0 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSharePoll(poll)}
                      title="Compartir o enviar por WhatsApp"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    {isAdminOrLeader && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(poll.id)}
                          title={isClosed ? 'Reabrir encuesta' : 'Cerrar y declarar ganador'}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1 ${
                            isClosed
                              ? 'bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-100 hover:bg-amber-200 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <Vote className="w-3.5 h-3.5" />
                          <span>{isClosed ? 'Reabrir' : 'Cerrar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(poll)}
                          title="Editar encuesta y opciones"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setResetConfirmPollId(poll.id)}
                          title="Reiniciar conteo de votos"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmPollId(poll.id)}
                          title="Eliminar encuesta"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ⏱️ LIVE COUNTDOWN TIMER BANNER (ACTIVE POLLS) */}
                {!isClosed && hasExp && isExpValid && poll.showLiveCountdown !== false && (
                  <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-b border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Left: Info and Expire Action Description */}
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center space-x-1.5">
                            <Timer className="w-3.5 h-3.5" />
                            <span>Cuenta Regresiva Activa en Tiempo Real</span>
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {expireActionLabel}
                        </p>
                      </div>

                      {/* Center / Right: 4 Countdown Display Digit Boxes */}
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1.5 text-center">
                          <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 shadow-sm min-w-[48px]">
                            <span className="text-lg font-black font-mono text-slate-900 dark:text-white leading-none block">
                              {String(days).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Días</span>
                          </div>
                          <span className="font-mono font-black text-amber-500">:</span>
                          <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 shadow-sm min-w-[48px]">
                            <span className="text-lg font-black font-mono text-slate-900 dark:text-white leading-none block">
                              {String(hours).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Horas</span>
                          </div>
                          <span className="font-mono font-black text-amber-500">:</span>
                          <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/60 shadow-sm min-w-[48px]">
                            <span className="text-lg font-black font-mono text-slate-900 dark:text-white leading-none block">
                              {String(minutes).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Min</span>
                          </div>
                          <span className="font-mono font-black text-amber-500">:</span>
                          <div className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-400 dark:border-purple-600 shadow-sm min-w-[48px] animate-pulse">
                            <span className="text-lg font-black font-mono text-purple-600 dark:text-purple-400 leading-none block">
                              {String(seconds).padStart(2, '0')}
                            </span>
                            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase">Seg</span>
                          </div>
                        </div>

                        {/* Leader quick extend and force close controls */}
                        {isAdminOrLeader && (
                          <div className="flex items-center space-x-1 pl-2 border-l border-slate-300 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => handleExtendPollDeadline(poll.id, 60)}
                              title="Extender 1 hora más"
                              className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-all"
                            >
                              +1h
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendPollDeadline(poll.id, 1440)}
                              title="Extender 1 día más"
                              className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-white/80 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs transition-all"
                            >
                              +1d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAutoCloseExpiredPoll(poll)}
                              title="Cerrar la votación inmediatamente"
                              className="px-2 py-1 text-[10px] font-extrabold rounded-lg bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-xs transition-all"
                            >
                              Cerrar Ahora
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 🔒 CLOSED NOTICES & EXPIRATION OUTCOMES */}
                {isClosed && (
                  <div className="px-6 py-3.5 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Lock className="w-4 h-4 text-slate-500" />
                      <span>
                        Votación Concluida{' '}
                        {poll.closedAt || poll.expiresAt
                          ? `el ${formatExpirationDate(poll.closedAt || poll.expiresAt!)}`
                          : ''}
                      </span>
                      {poll.closedByCountdown && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                          ⏱️ Cierre Automático por Cuenta Regresiva
                        </span>
                      )}
                    </div>

                    {isResultsCustodyActive && isAdminOrLeader && (
                      <button
                        type="button"
                        onClick={() => handleToggleRevealHiddenResults(poll.id)}
                        className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 cursor-pointer transition-all self-start sm:self-auto"
                      >
                        {isResultsRevealedByLeader
                          ? '🙈 Ocultar Conteo (Modo Privado)'
                          : '👁️ Revelar Conteo Reservado (Modo Pastoral)'}
                      </button>
                    )}
                  </div>
                )}

                {/* CUSTOM COMMUNIQUE BANNER (IF CONFIGURED) */}
                {isClosed && poll.onExpireAction === 'close_with_custom_message' && poll.expiredCustomMessage && (
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border-b border-purple-200 dark:border-purple-900/40 flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0 mt-0.5 shadow-sm">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 block">
                        Comunicado Oficial de la Votación
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 mt-0.5 leading-relaxed">
                        «{poll.expiredCustomMessage}»
                      </p>
                    </div>
                  </div>
                )}

                {/* PASTORAL CUSTODY BANNER (WHEN RESULTS ARE HIDDEN) */}
                {isResultsCustodyActive && !isResultsRevealedByLeader && !isAdminOrLeader && (
                  <div className="px-6 py-5 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/10 border-b border-indigo-200 dark:border-indigo-900/40 flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shrink-0 shadow-md">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
                        🔒 Resultados en Custodia Pastoral
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        La cuenta regresiva ha concluido satisfactoriamente y los votos emitidos han sido resguardados confidencialmente en la base de datos de Firebase. El resultado oficial será proclamado en la reunión congregacional por el pastorado.
                      </p>
                    </div>
                  </div>
                )}

                {/* WINNER / LEADER SPOTLIGHT BANNER */}
                {hasVotes && !shouldMaskResults && (
                  <div className="px-6 py-4 bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-indigo-500/10 border-b border-amber-200/50 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 shrink-0">
                        {isClosed ? <Trophy className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                          {isClosed ? '🏆 Ganador Oficial de la Elección' : '👑 Liderando el Conteo'}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {topOption.text}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-lg font-black text-slate-900 dark:text-white block">
                          {topOption.votesCount} votos
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          {totalVotes > 0
                            ? `${Math.round(((topOption.votesCount || 0) / totalVotes) * 100)}% del total`
                            : '0%'}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-xs shadow-sm">
                        1º Lugar
                      </span>
                    </div>
                  </div>
                )}

                {/* OPTIONS GRID WITH IMAGES */}
                <div className="p-6 sm:p-7">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {poll.options.map((option, idx) => {
                      const votes = option.votesCount || 0;
                      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                      const isVotedByMe = (option.voterUserIds || []).includes(voterKey);

                      // Rank calculation
                      const rankIndex = sortedOptions.findIndex((o) => o.id === option.id);
                      const isFirst = rankIndex === 0 && votes > 0;
                      const isSecond = rankIndex === 1 && votes > 0;
                      const isThird = rankIndex === 2 && votes > 0;

                      return (
                        <div
                          key={option.id}
                          className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden relative ${
                            isVotedByMe
                              ? 'border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/20 bg-purple-50/30 dark:bg-purple-950/20'
                              : isFirst
                              ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/10'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-400'
                          }`}
                        >
                          {/* Rank Ribbon */}
                          {votes > 0 && (
                            <div className="absolute top-3 left-3 z-10">
                              {isFirst && (
                                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-[10px] shadow-sm flex items-center space-x-1">
                                  <Crown className="w-3 h-3" />
                                  <span>1º Lugar</span>
                                </span>
                              )}
                              {isSecond && (
                                <span className="px-2.5 py-1 rounded-xl bg-slate-400 text-white font-black text-[10px] shadow-sm flex items-center space-x-1">
                                  <Award className="w-3 h-3" />
                                  <span>2º Lugar</span>
                                </span>
                              )}
                              {isThird && (
                                <span className="px-2.5 py-1 rounded-xl bg-amber-700 text-white font-black text-[10px] shadow-sm flex items-center space-x-1">
                                  <Award className="w-3 h-3" />
                                  <span>3º Lugar</span>
                                </span>
                              )}
                            </div>
                          )}

                          {/* "Tu Selección" Badge */}
                          {isVotedByMe && (
                            <div className="absolute top-3 right-3 z-10">
                              <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-black text-[10px] shadow-md shadow-purple-600/30 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Tu Voto ✓</span>
                              </span>
                            </div>
                          )}

                          {/* Image Thumbnail */}
                          {option.imageUrl ? (
                            <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                              <img
                                src={option.imageUrl}
                                alt={option.text}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                              <div className="absolute bottom-2.5 left-3 right-3 text-white">
                                <h4 className="font-extrabold text-sm drop-shadow-sm line-clamp-1">
                                  {option.text}
                                </h4>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="h-28 w-full p-4 flex flex-col justify-end text-white"
                              style={{
                                background: `linear-gradient(135deg, ${option.color || '#4f46e5'} 0%, #1e1b4b 100%)`,
                              }}
                            >
                              <Vote className="w-6 h-6 opacity-30 mb-2" />
                              <h4 className="font-black text-sm drop-shadow-sm line-clamp-1">
                                {option.text}
                              </h4>
                            </div>
                          )}

                          {/* Details & Votes */}
                          <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                                {option.text}
                              </h4>
                              {option.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                  {option.description}
                                </p>
                              )}
                            </div>

                            {/* Percentage Bar & Vote Count */}
                            <div className="space-y-2 pt-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-extrabold text-slate-700 dark:text-slate-300">
                                  {shouldMaskResults
                                    ? '•••'
                                    : `${votes} ${votes === 1 ? 'voto' : 'votos'}`}
                                </span>
                                <span className="font-black text-purple-600 dark:text-purple-400">
                                  {shouldMaskResults ? '•••' : `${percentage}%`}
                                </span>
                              </div>

                              {/* Progress bar track */}
                              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    shouldMaskResults
                                      ? 'bg-slate-300 dark:bg-slate-700'
                                      : isFirst
                                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                      : isVotedByMe
                                      ? 'bg-gradient-to-r from-purple-600 to-indigo-500'
                                      : 'bg-gradient-to-r from-purple-500 to-indigo-400'
                                  }`}
                                  style={{ width: shouldMaskResults ? '0%' : `${percentage}%` }}
                                />
                              </div>
                            </div>

                            {/* Vote Action Button */}
                            <button
                              type="button"
                              disabled={isClosed}
                              onClick={() => handleVote(poll.id, option.id)}
                              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm ${
                                isClosed
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : isVotedByMe
                                  ? 'bg-purple-700 text-white shadow-purple-600/30 hover:bg-purple-800'
                                  : 'bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-600 text-purple-700 dark:text-purple-300 hover:text-white border border-purple-200 dark:border-purple-800 hover:border-transparent'
                              }`}
                            >
                              {shouldMaskResults ? (
                                <>
                                  <Lock className="w-4 h-4" />
                                  <span>Votación Cerrada • Custodia Pastoral</span>
                                </>
                              ) : isClosed ? (
                                <>
                                  <Lock className="w-4 h-4" />
                                  <span>Votación Concluida</span>
                                </>
                              ) : isVotedByMe ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Tu Opción Seleccionada (Clic para retirar)</span>
                                </>
                              ) : (
                                <>
                                  <Vote className="w-4 h-4" />
                                  <span>Votar por esta opción</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Footer Info */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>
                        Total de votos registrados: <strong>{totalVotes}</strong>
                      </span>
                    </span>

                    {poll.allowMultipleVotes ? (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        ✓ Esta encuesta permite seleccionar múltiples opciones
                      </span>
                    ) : (
                      <span>Un solo voto por usuario registrado</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE / EDIT POLL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
            <form onSubmit={handleSavePollForm}>
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
                    <Vote className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">
                      {editingPollId ? 'Editar Encuesta' : 'Nueva Encuesta & Votación'}
                    </h3>
                    <p className="text-xs text-white/80">
                      Configura la pregunta, opciones, imágenes de candidatos y fecha límite.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Template Presets (when creating new) */}
              {!editingPollId && (
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border-b border-purple-100 dark:border-purple-900/40">
                  <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 block mb-2">
                    ⚡ Plantillas Rápidas con Fotos:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_POLL_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.title}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-bold border border-purple-200 dark:border-purple-800 transition-all cursor-pointer shadow-sm"
                      >
                        {tpl.title.split(' ')[0]} {tpl.title.split(' ')[1]}...
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Body Form */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Title */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Pregunta o Título de la Encuesta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Elección de Coordinador de Jóvenes 2026..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                {/* Category & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Ej: Elecciones, Proyectos, Campamentos..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                      Estado de Votación
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'active' | 'closed' | 'draft',
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="active">Abierta (Recibiendo votos)</option>
                      <option value="closed">Cerrada (Con Ganador Oficial)</option>
                      <option value="draft">Borrador (Oculta a la congregación)</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                    Descripción o Instrucciones
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Instrucciones para los votantes, requisitos o detalles de la elección..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white leading-relaxed"
                  />
                </div>

                {/* CONFIGURACIÓN DE CUENTA REGRESIVA & VENCIMIENTO AUTOMÁTICO */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-indigo-500/5 border border-amber-200 dark:border-purple-900/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-amber-500 text-white shadow-sm">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Cuenta Regresiva & Vencimiento Automático
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Programa fecha, hora y la acción automática al llegar el cronómetro a cero.
                        </p>
                      </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enableCountdown}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          let defaultExp = formData.expiresAt;
                          if (checked && !defaultExp) {
                            defaultExp = generatePresetDate('1day');
                          }
                          setFormData({
                            ...formData,
                            enableCountdown: checked,
                            expiresAt: defaultExp,
                          });
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  {formData.enableCountdown && (
                    <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 animate-fadeIn">
                      {/* Date & Time Picker */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                          <span>Fecha y Hora Exacta de Cierre:</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold">
                            Sincronizado en Tiempo Real
                          </span>
                        </label>
                        <input
                          type="datetime-local"
                          required={formData.enableCountdown}
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      {/* Quick Presets */}
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                          Preajustes Rápidos de Tiempo:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: '+1 Hora', preset: '1hour' as const },
                            { label: '+6 Horas', preset: '6hours' as const },
                            { label: '+1 Día (24h)', preset: '1day' as const },
                            { label: '+3 Días', preset: '3days' as const },
                            { label: '+1 Semana', preset: '1week' as const },
                            { label: 'Fin de Mes', preset: 'end_of_month' as const },
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                const newDate = generatePresetDate(item.preset);
                                setFormData({ ...formData, expiresAt: newDate });
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-600 transition-all cursor-pointer shadow-xs"
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expiration Action Selector */}
                      <div>
                        <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
                          <span>¿Qué opción tendrá la encuesta al terminar la cuenta regresiva?</span>
                        </label>
                        <select
                          value={formData.onExpireAction}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              onExpireAction: e.target.value as PollItem['onExpireAction'],
                            })
                          }
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold"
                        >
                          <option value="close_and_show_winner">
                            🏆 1. Cerrar y Proclamar Ganador Oficial (Bloquea votos y proclama en podio al más votado)
                          </option>
                          <option value="close_and_lock">
                            🔒 2. Cerrar y Bloquear Votación (Bloquea votos manteniendo visibles los resultados finales)
                          </option>
                          <option value="close_and_hide_results">
                            👁️ 3. Cerrar y Ocultar Resultados (Resultados en custodia pastoral hasta anuncio oficial)
                          </option>
                          <option value="close_with_custom_message">
                            📢 4. Cerrar con Mensaje Personalizado (Muestra un comunicado redactado al finalizar)
                          </option>
                          <option value="hide_poll">
                            🙈 5. Ocultar Encuesta Automáticamente (Archiva la encuesta del listado público al vencer)
                          </option>
                        </select>
                      </div>

                      {/* Custom Message input if close_with_custom_message */}
                      {formData.onExpireAction === 'close_with_custom_message' && (
                        <div className="animate-fadeIn">
                          <label className="block text-xs font-black text-slate-700 dark:text-slate-300 mb-1">
                            Comunicado Oficial / Mensaje de Agradecimiento al Vencer
                          </label>
                          <textarea
                            rows={2}
                            value={formData.expiredCustomMessage}
                            onChange={(e) =>
                              setFormData({ ...formData, expiredCustomMessage: e.target.value })
                            }
                            placeholder="Ej: La votación ha concluido. Agradecemos su fiel participación en la edificación de la congregación."
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                      )}

                      {/* Show Live Countdown Badge toggle */}
                      <div className="flex items-center space-x-2 pt-1">
                        <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={formData.showLiveCountdown}
                            onChange={(e) =>
                              setFormData({ ...formData, showLiveCountdown: e.target.checked })
                            }
                            className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                          />
                          <span>Mostrar reloj de cuenta regresiva en vivo (Días, Horas, Minutos, Segundos) en la tarjeta</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Multi-choice toggle */}
                <div className="flex items-center pt-2">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.allowMultipleVotes}
                      onChange={(e) =>
                        setFormData({ ...formData, allowMultipleVotes: e.target.checked })
                      }
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Permitir a los votantes seleccionar múltiples opciones en esta encuesta</span>
                  </label>
                </div>

                {/* OPTIONS BUILDER WITH IMAGE UPLOAD */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>Opciones o Candidatos ({formData.options.length})</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-black flex items-center space-x-1 cursor-pointer transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Opción</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.options.map((option, idx) => (
                      <div
                        key={option.id}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-700 dark:text-purple-300">
                            Opción #{idx + 1}
                          </span>
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        {/* Text & Color */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-3">
                            <input
                              type="text"
                              required
                              value={option.text}
                              onChange={(e) => {
                                const next = [...formData.options];
                                next[idx].text = e.target.value;
                                setFormData({ ...formData, options: next });
                              }}
                              placeholder="Nombre de la opción / Candidato *"
                              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <input
                              type="color"
                              value={option.color}
                              onChange={(e) => {
                                const next = [...formData.options];
                                next[idx].color = e.target.value;
                                setFormData({ ...formData, options: next });
                              }}
                              className="w-full h-9 rounded-xl border-0 cursor-pointer p-0"
                              title="Color de acento de la opción"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <input
                            type="text"
                            value={option.description}
                            onChange={(e) => {
                              const next = [...formData.options];
                              next[idx].description = e.target.value;
                              setFormData({ ...formData, options: next });
                            }}
                            placeholder="Descripción breve, versículo o lema del candidato..."
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                          />
                        </div>

                        {/* Image URL or Upload Button */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                          <div className="flex-1">
                            <input
                              type="url"
                              value={option.imageUrl}
                              onChange={(e) => {
                                const next = [...formData.options];
                                next[idx].imageUrl = e.target.value;
                                setFormData({ ...formData, options: next });
                              }}
                              placeholder="URL de imagen (https://...)"
                              className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setUploadingOptionIndex(idx);
                                optionImageInputRef.current?.click();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer shadow-sm"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Subir Foto</span>
                            </button>

                            {option.imageUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = [...formData.options];
                                  next[idx].imageUrl = '';
                                  setFormData({ ...formData, options: next });
                                }}
                                className="text-xs text-red-500 hover:underline cursor-pointer"
                              >
                                Quitar foto
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Image Preview */}
                        {option.imageUrl && (
                          <div className="flex items-center space-x-3 pt-1">
                            <img
                              src={option.imageUrl}
                              alt="Vista previa"
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover border border-purple-400"
                            />
                            <span className="text-[11px] text-slate-500">
                              Vista previa de la imagen cargada
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-300 dark:border-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-600/25 cursor-pointer"
                >
                  {editingPollId ? 'Guardar Cambios' : 'Crear Encuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE */}
      {deleteConfirmPollId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                ¿Eliminar esta encuesta?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Se eliminarán los datos y el conteo de votos de esta encuesta. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmPollId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleDeletePoll(deleteConfirmPollId)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-red-600 text-white hover:bg-red-700 cursor-pointer shadow-md shadow-red-600/20"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: RESET VOTES */}
      {resetConfirmPollId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">
                ¿Reiniciar conteo de votos?
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Todos los votos actuales de todas las opciones volverán a cero (0) y los congregantes podrán votar nuevamente.
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmPollId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleResetVotes(resetConfirmPollId)}
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-md shadow-amber-600/20"
              >
                Sí, Reiniciar Votos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
