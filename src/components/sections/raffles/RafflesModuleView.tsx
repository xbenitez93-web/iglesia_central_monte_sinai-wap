import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Ticket,
  Trophy,
  Gift,
  Award,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  Filter,
  Share2,
  Copy,
  Volume2,
  VolumeX,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  AlertCircle,
  Phone,
  User,
  PartyPopper,
  Flame,
  RotateCcw,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Maximize2,
  Minimize2,
  Ban,
  Tv,
  UserX,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Camera,
  Eye,
  Tag,
  FolderPlus,
  Palette,
} from 'lucide-react';
import {
  CustomSectionItem,
  UserProfile,
  ChurchConfig,
  RaffleItem,
  RafflePrize,
  RaffleTicket,
  RaffleExcludedRecord,
  CustomSectionRafflesData,
  RaffleCategory,
  DEFAULT_RAFFLE_CATEGORIES,
} from '../../../types';
import {
  saveFirestoreDoc,
  deleteFirestoreDoc,
  syncFirestoreCollection,
  seedCollectionIfEmpty,
} from '../../../lib/firebase';
import { isDemoRaffle } from '../../../utils/raffleUtils';
import { raffleSound } from '../../../utils/raffleSounds';
import { triggerConfetti } from '../../../utils/confettiCanvas';

interface RafflesModuleViewProps {
  section: CustomSectionItem;
  currentUser?: UserProfile | null;
  config?: ChurchConfig;
  onUpdateSectionData?: (updatedSection: CustomSectionItem) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  onOpenSectionEditor?: () => void;
}

// Default church raffle templates for quick 1-click creation
const DEFAULT_RAFFLE_TEMPLATES: {
  title: string;
  category: string;
  description: string;
  ticketPrice: number;
  currency: string;
  totalTickets: number;
  bannerImageUrl: string;
  prizes: { place: number; name: string; description: string; imageUrl?: string; valueEstimated?: number }[];
}[] = [
  {
    title: 'Gran Sorteo Pro-Construcción del Templo',
    category: 'Pro-Templo',
    description: 'Recaudación especial para la ampliación del santuario principal y nuevas aulas infantiles.',
    ticketPrice: 10,
    currency: '$',
    totalTickets: 100,
    bannerImageUrl: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
    prizes: [
      {
        place: 1,
        name: 'Smart TV 55" UHD 4K',
        description: 'Televisor inteligente de última generación para el hogar',
        imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 450,
      },
      {
        place: 2,
        name: 'Bicicleta de Montaña Todo Terreno',
        description: 'Bicicleta rin 29 con suspensión y cambios Shimano',
        imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 280,
      },
      {
        place: 3,
        name: 'Freidora de Aire Digital XL',
        description: 'Cocina saludable con capacidad familiar de 6 litros',
        imageUrl: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 120,
      },
    ],
  },
  {
    title: 'Rifa Benéfica Instrumentos de Alabanza',
    category: 'Alabanza',
    description: 'Renovación de equipos de audio, cables, pedestales y microfonía para el ministerio de música.',
    ticketPrice: 5,
    currency: '$',
    totalTickets: 80,
    bannerImageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
    prizes: [
      {
        place: 1,
        name: 'Teclado Portátil Yamaha 61 Teclas',
        description: 'Teclado con sonidos estéreo y soporte incluido',
        imageUrl: 'https://images.unsplash.com/photo-1520523839898-507127054976?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 250,
      },
      {
        place: 2,
        name: 'Micrófono Inalámbrico Profesional Vocal',
        description: 'Sistema inalámbrico UHF de alta fidelidad',
        imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 150,
      },
    ],
  },
  {
    title: 'Sorteo Canasta Familiar Día de la Madre & Familia',
    category: 'Damas & Familia',
    description: 'Celebración y agasajo fraternal para bendecir a las familias de nuestra congregación.',
    ticketPrice: 5,
    currency: '$',
    totalTickets: 60,
    bannerImageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=800&q=80',
    prizes: [
      {
        place: 1,
        name: 'Mega Canasta Familiar de Alimentos & Delicatessen',
        description: 'Surtido completo con productos de primera calidad y dulces especiales',
        imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 180,
      },
      {
        place: 2,
        name: 'Cena Especial para 4 Personas',
        description: 'Vale de consumo en restaurante familiar de la ciudad',
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 100,
      },
    ],
  },
  {
    title: 'Sorteo Gratuito de Bienvenida para Nuevos & Jóvenes',
    category: 'Jóvenes',
    description: 'Sorteo especial de bienvenida para asistentes al congreso juvenil. ¡Inscripción 100% libre!',
    ticketPrice: 0,
    currency: '$',
    totalTickets: 50,
    bannerImageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    prizes: [
      {
        place: 1,
        name: 'Biblia de Estudio Reina Valera en Cuero',
        description: 'Edición especial con notas explicativas, mapas y concordancia',
        imageUrl: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 60,
      },
      {
        place: 2,
        name: 'Set Devocional + Camiseta Oficial del Congreso',
        description: 'Cuaderno de notas bíblicas, lapicero grabado y camiseta',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=400&q=80',
        valueEstimated: 35,
      },
    ],
  },
];

// Curated prize image presets for easy 1-click selection
const PRESET_PRIZE_IMAGES: { label: string; icon: string; url: string }[] = [
  {
    label: 'Smart TV 4K',
    icon: '📺',
    url: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Bicicleta de Montaña',
    icon: '🚲',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Canasta Familiar',
    icon: '🧺',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Air Fryer / Electrodoméstico',
    icon: '🍳',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Instrumentos de Alabanza',
    icon: '🎸',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Laptop / Tablet',
    icon: '💻',
    url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Pro-Templo / Altar',
    icon: '⛪',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Biblia / Estudio',
    icon: '📖',
    url: 'https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Tarjeta Regalo / Bono',
    icon: '💵',
    url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?auto=format&fit=crop&w=800&q=80',
  },
];

// Helper to generate tickets array
function generateTicketsArray(total: number, prefix = '#', price = 0): RaffleTicket[] {
  const tickets: RaffleTicket[] = [];
  const padLength = total >= 1000 ? 4 : total >= 100 ? 3 : 2;
  for (let i = 1; i <= total; i++) {
    tickets.push({
      number: i,
      ticketCode: `${prefix}${String(i).padStart(padLength, '0')}`,
      status: 'available',
      paymentMethod: price === 0 ? 'Gratis' : undefined,
    });
  }
  return tickets;
}

export const RafflesModuleView: React.FC<RafflesModuleViewProps> = ({
  section,
  currentUser,
  config,
  onUpdateSectionData,
  onShowToast,
  onOpenSectionEditor,
}) => {
  // Permission checks
  const isAdminOrLeader = useMemo(() => {
    if (!currentUser) return true;
    const role = currentUser.role || '';
    return (
      role === 'Desarrollador' ||
      role === 'Administrador' ||
      role === 'Contador' ||
      role === 'Líder' ||
      role === 'Líder de Jóvenes'
    );
  }, [currentUser]);

  // Main list of raffles (no demo raffles)
  const [raffles, setRaffles] = useState<RaffleItem[]>(() => {
    const existing = section.rafflesData?.raffles;
    if (existing && existing.length > 0) {
      return existing.filter((r) => !isDemoRaffle(r));
    }
    return [];
  });

  // Automatically remove any demo raffles if present in section.rafflesData
  useEffect(() => {
    const currentList = section.rafflesData?.raffles || [];
    const hasDemos = currentList.some(isDemoRaffle);
    if (hasDemos) {
      const sanitized = currentList.filter((r) => !isDemoRaffle(r));
      setRaffles(sanitized);
      if (onUpdateSectionData) {
        onUpdateSectionData({
          ...section,
          rafflesData: {
            ...section.rafflesData,
            raffles: sanitized,
          },
          updatedAt: new Date().toISOString(),
        });
      }
      currentList.filter(isDemoRaffle).forEach((demoR) => {
        if (demoR.id) {
          deleteFirestoreDoc('raffles', demoR.id).catch(() => {});
        }
      });
    } else {
      setRaffles(currentList);
    }
  }, [section.id, section.rafflesData]);

  // Active view filters
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'completed' | 'my_tickets'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Categories state & sync with Firebase Firestore
  const [categories, setCategories] = useState<RaffleCategory[]>(() => {
    if (section.rafflesData?.categories && section.rafflesData.categories.length > 0) {
      return section.rafflesData.categories;
    }
    return DEFAULT_RAFFLE_CATEGORIES;
  });
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<RaffleCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<RaffleCategory | null>(null);
  const [deleteFallbackCategory, setDeleteFallbackCategory] = useState<string>('General');
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#f59e0b',
  });

  // Real-time synchronization of raffleCategories with Firebase Firestore
  useEffect(() => {
    seedCollectionIfEmpty('raffleCategories', DEFAULT_RAFFLE_CATEGORIES);

    const unsub = syncFirestoreCollection<RaffleCategory>('raffleCategories', (items) => {
      if (items && Array.isArray(items) && items.length > 0) {
        setCategories(items);
      }
    });

    return () => unsub();
  }, []);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRaffle, setEditingRaffle] = useState<RaffleItem | null>(null);

  // Ticket Grid Modal
  const [ticketGridRaffle, setTicketGridRaffle] = useState<RaffleItem | null>(null);
  const [ticketFilter, setTicketFilter] = useState<'all' | 'available' | 'reserved' | 'sold' | 'winners' | 'excluded'>('all');
  const [ticketSearch, setTicketSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<{ raffleId: string; ticket: RaffleTicket } | null>(null);

  // Ticket reservation/purchase form state
  const [buyerForm, setBuyerForm] = useState<{
    buyerName: string;
    buyerPhone: string;
    buyerEmail: string;
    buyerNotes: string;
    paymentMethod: string;
    markAsPaid: boolean;
    isExcluded: boolean;
    exclusionReason: string;
  }>({
    buyerName: '',
    buyerPhone: '',
    buyerEmail: '',
    buyerNotes: '',
    paymentMethod: 'Efectivo',
    markAsPaid: false,
    isExcluded: false,
    exclusionReason: '',
  });

  // Live Raffle Drum (Tómbola) State
  const [drumRaffle, setDrumRaffle] = useState<RaffleItem | null>(null);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>('');
  const [isDrumSpinning, setIsDrumSpinning] = useState(false);
  const [displayTicketNumber, setDisplayTicketNumber] = useState<number | null>(null);
  const [displayTicketCode, setDisplayTicketCode] = useState<string>('');
  const [drumCandidateWinner, setDrumCandidateWinner] = useState<RaffleTicket | null>(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [onlySoldInDrum, setOnlySoldInDrum] = useState(true);
  const [drumPreventRepeatWinners, setDrumPreventRepeatWinners] = useState<boolean>(true);
  const [drumPreventRepeatBuyers, setDrumPreventRepeatBuyers] = useState<boolean>(false);
  const [drumExcludeAbsent, setDrumExcludeAbsent] = useState<boolean>(true);
  const [showExcludedDrawer, setShowExcludedDrawer] = useState<boolean>(false);
  const [showDisqualifyPrompt, setShowDisqualifyPrompt] = useState<boolean>(false);
  const [disqualifyReason, setDisqualifyReason] = useState<string>('No se presentó al llamado');
  const [isDrumFullscreen, setIsDrumFullscreen] = useState<boolean>(false);
  const [isGridFullscreen, setIsGridFullscreen] = useState<boolean>(false);
  const [drumProjectorTab, setDrumProjectorTab] = useState<'drum' | 'wall'>('drum');
  const [showDrumSettings, setShowDrumSettings] = useState<boolean>(false);
  const [wallSearchQuery, setWallSearchQuery] = useState<string>('');
  const [wallFilterStatus, setWallFilterStatus] = useState<'all' | 'sold' | 'available' | 'winner'>('all');

  // Range ticket assignment state
  const [rangeAssignOpen, setRangeAssignOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const [rangeBuyer, setRangeBuyer] = useState<string>('');
  const [rangePhone, setRangePhone] = useState<string>('');
  const [rangeMarkPaid, setRangeMarkPaid] = useState<boolean>(true);

  // "Consultar Mi Boleto" state
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupModalOpen, setLookupModalOpen] = useState(false);

  // "Ver Qué Se Sortea" (Prizes & Photos Gallery) state
  const [viewPrizesRaffle, setViewPrizesRaffle] = useState<RaffleItem | null>(null);

  // Fullscreen photo zoom preview state
  const [previewZoomImage, setPreviewZoomImage] = useState<{
    url: string;
    title: string;
    subtitle?: string;
    description?: string;
  } | null>(null);

  // Sync state changes with parent and Firestore
  const persistRaffles = async (updatedRaffles: RaffleItem[], toastMsg?: string) => {
    setRaffles(updatedRaffles);

    // Keep ticketGridRaffle in sync if open
    if (ticketGridRaffle) {
      const refreshed = updatedRaffles.find((r) => r.id === ticketGridRaffle.id) || null;
      setTicketGridRaffle(refreshed);
    }
    // Keep drumRaffle in sync if open
    if (drumRaffle) {
      const refreshed = updatedRaffles.find((r) => r.id === drumRaffle.id) || null;
      setDrumRaffle(refreshed);
    }

    if (onUpdateSectionData) {
      const updatedSection: CustomSectionItem = {
        ...section,
        rafflesData: {
          ...section.rafflesData,
          raffles: updatedRaffles,
        },
        updatedAt: new Date().toISOString(),
      };
      onUpdateSectionData(updatedSection);
    }

    // Save to Firestore collection 'raffles'
    try {
      for (const r of updatedRaffles) {
        await saveFirestoreDoc('raffles', r.id, r);
      }
      if (toastMsg) onShowToast(toastMsg, 'success');
    } catch (e) {
      console.warn('Error saving raffles to Firestore:', e);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalRaffles = raffles.length;
    const activeRaffles = raffles.filter((r) => r.status === 'active').length;

    let totalTicketsSold = 0;
    let totalTicketsAll = 0;
    let totalFundsRaised = 0;
    let totalPrizesCount = 0;

    raffles.forEach((r) => {
      totalTicketsAll += r.totalTickets || 0;
      totalPrizesCount += r.prizes?.length || 0;
      const sold = (r.tickets || []).filter((t) => t.status === 'sold');
      totalTicketsSold += sold.length;
      totalFundsRaised += sold.length * (r.ticketPrice || 0);
    });

    return {
      totalRaffles,
      activeRaffles,
      totalTicketsSold,
      totalTicketsAll,
      totalFundsRaised,
      totalPrizesCount,
    };
  }, [raffles]);

  // Filtered raffles list
  const filteredRaffles = useMemo(() => {
    return raffles.filter((r) => {
      if (filterTab === 'active' && r.status !== 'active') return false;
      if (filterTab === 'completed' && r.status !== 'completed') return false;
      if (filterTab === 'my_tickets') {
        const hasMyTickets = (r.tickets || []).some(
          (t) =>
            currentUser &&
            ((t.buyerEmail && t.buyerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
              (t.buyerName && t.buyerName.toLowerCase().includes(currentUser.name.toLowerCase())))
        );
        if (!hasMyTickets) return false;
      }

      // Filter by Category
      if (categoryFilter !== 'all' && (r.category || '') !== categoryFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchCat = (r.category || '').toLowerCase().includes(q);
        const matchPrize = (r.prizes || []).some((p) => p.name.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchCat && !matchPrize) return false;
      }

      return true;
    });
  }, [raffles, filterTab, searchQuery, currentUser, categoryFilter]);

  // Handle live ticket click
  const handleOpenTicketModal = (raffleId: string, ticket: RaffleTicket) => {
    setSelectedTicket({ raffleId, ticket });
    setBuyerForm({
      buyerName: ticket.buyerName || (currentUser?.name || ''),
      buyerPhone: ticket.buyerPhone || (currentUser?.phone || ''),
      buyerEmail: ticket.buyerEmail || (currentUser?.email || ''),
      buyerNotes: ticket.buyerNotes || '',
      paymentMethod: ticket.paymentMethod || 'Efectivo',
      markAsPaid: ticket.status === 'sold',
      isExcluded: Boolean(ticket.isExcluded),
      exclusionReason: ticket.exclusionReason || '',
    });
  };

  // Save ticket buyer/reservation
  const handleSaveTicket = async () => {
    if (!selectedTicket || !ticketGridRaffle) return;
    if (!buyerForm.buyerName.trim()) {
      onShowToast('Por favor ingresa el nombre del comprador o reservante', 'danger');
      return;
    }

    const nextStatus: 'available' | 'reserved' | 'sold' = buyerForm.markAsPaid
      ? 'sold'
      : ticketGridRaffle.ticketPrice === 0
      ? 'sold'
      : 'reserved';

    const updatedTickets = ticketGridRaffle.tickets.map((t) => {
      if (t.number === selectedTicket.ticket.number) {
        return {
          ...t,
          status: nextStatus,
          buyerName: buyerForm.buyerName.trim(),
          buyerPhone: buyerForm.buyerPhone.trim(),
          buyerEmail: buyerForm.buyerEmail.trim(),
          buyerNotes: buyerForm.buyerNotes.trim(),
          paymentMethod: buyerForm.paymentMethod,
          isExcluded: buyerForm.isExcluded,
          exclusionReason: buyerForm.isExcluded
            ? (buyerForm.exclusionReason.trim() || 'Descalificado manualmente')
            : undefined,
          soldAt: nextStatus === 'sold' ? (t.soldAt || new Date().toISOString()) : undefined,
          reservedAt: nextStatus === 'reserved' ? (t.reservedAt || new Date().toISOString()) : undefined,
          registeredBy: currentUser?.name || 'Administración',
        };
      }
      return t;
    });

    const updatedRaffle: RaffleItem = {
      ...ticketGridRaffle,
      tickets: updatedTickets,
      updatedAt: new Date().toISOString(),
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(
      newRaffles,
      nextStatus === 'sold'
        ? `🎟️ Boleto ${selectedTicket.ticket.ticketCode} vendido con éxito a ${buyerForm.buyerName}.`
        : `⏳ Boleto ${selectedTicket.ticket.ticketCode} apartado/reservado para ${buyerForm.buyerName}.`
    );

    setSelectedTicket(null);
  };

  // Release ticket back to available
  const handleReleaseTicket = async () => {
    if (!selectedTicket || !ticketGridRaffle) return;
    const tCode = selectedTicket.ticket.ticketCode;

    const updatedTickets = ticketGridRaffle.tickets.map((t) => {
      if (t.number === selectedTicket.ticket.number) {
        return {
          number: t.number,
          ticketCode: t.ticketCode,
          status: 'available' as const,
          paymentMethod: ticketGridRaffle.ticketPrice === 0 ? 'Gratis' : undefined,
        };
      }
      return t;
    });

    const updatedRaffle: RaffleItem = {
      ...ticketGridRaffle,
      tickets: updatedTickets,
      updatedAt: new Date().toISOString(),
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(newRaffles, `♻️ Boleto ${tCode} liberado y disponible nuevamente.`);
    setSelectedTicket(null);
  };

  // Mass range assignment
  const handleExecuteRangeAssign = async () => {
    if (!ticketGridRaffle) return;
    if (rangeStart < 1 || rangeEnd > ticketGridRaffle.totalTickets || rangeStart > rangeEnd) {
      onShowToast(`Rango no válido. Debe ser entre 1 y ${ticketGridRaffle.totalTickets}`, 'danger');
      return;
    }
    if (!rangeBuyer.trim()) {
      onShowToast('Ingresa el nombre o familia para el rango de boletos', 'danger');
      return;
    }

    const nextStatus: 'sold' | 'reserved' = rangeMarkPaid ? 'sold' : 'reserved';
    let assignedCount = 0;

    const updatedTickets = ticketGridRaffle.tickets.map((t) => {
      if (t.number >= rangeStart && t.number <= rangeEnd) {
        assignedCount++;
        return {
          ...t,
          status: nextStatus,
          buyerName: rangeBuyer.trim(),
          buyerPhone: rangePhone.trim(),
          soldAt: nextStatus === 'sold' ? new Date().toISOString() : undefined,
          reservedAt: nextStatus === 'reserved' ? new Date().toISOString() : undefined,
          registeredBy: currentUser?.name || 'Administración',
        };
      }
      return t;
    });

    const updatedRaffle: RaffleItem = {
      ...ticketGridRaffle,
      tickets: updatedTickets,
      updatedAt: new Date().toISOString(),
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(
      newRaffles,
      `✅ Se asignaron ${assignedCount} boletos (#${rangeStart} al #${rangeEnd}) a ${rangeBuyer}.`
    );

    setRangeAssignOpen(false);
  };

  // Open the Live Tómbola Drum
  const handleOpenDrum = (raffle: RaffleItem) => {
    setDrumRaffle(raffle);
    const firstUndrawnPrize = raffle.prizes.find((p) => !p.winnerTicketNumber) || raffle.prizes[0];
    setSelectedPrizeId(firstUndrawnPrize ? firstUndrawnPrize.id : '');
    setDrumCandidateWinner(null);
    setDisplayTicketNumber(null);
    setDisplayTicketCode('???');
    setDrumPreventRepeatWinners(raffle.preventRepeatWinners !== false);
    setDrumPreventRepeatBuyers(Boolean(raffle.preventRepeatBuyers));
    setDrumExcludeAbsent(true);
    setShowExcludedDrawer(false);
    setShowDisqualifyPrompt(false);
    setDisqualifyReason('No se presentó al llamado');
    setIsDrumFullscreen(false);
  };

  // Real-time counter of eligible, won, and excluded/absent tickets in the active drum
  const { drumEligibleCount, drumExcludedCount, drumAbsentExcludedCount } = useMemo(() => {
    if (!drumRaffle) return { drumEligibleCount: 0, drumExcludedCount: 0, drumAbsentExcludedCount: 0 };
    const alreadyWonTicketNumbers = new Set<number>();
    (drumRaffle.prizes || []).forEach((p) => {
      if (p.winnerTicketNumber !== undefined && p.winnerTicketNumber !== null) {
        alreadyWonTicketNumbers.add(p.winnerTicketNumber);
      }
    });
    (drumRaffle.tickets || []).forEach((t) => {
      if (t.isWinner) {
        alreadyWonTicketNumbers.add(t.number);
      }
    });

    const alreadyWonBuyerNames = new Set<string>();
    (drumRaffle.prizes || []).forEach((p) => {
      if (p.winnerBuyerName && p.winnerTicketNumber) {
        alreadyWonBuyerNames.add(p.winnerBuyerName.trim().toLowerCase());
      }
    });

    let eligible = 0;
    let wonExcluded = 0;
    let absentExcluded = 0;

    (drumRaffle.tickets || []).forEach((t) => {
      if (onlySoldInDrum && t.status !== 'sold') return;
      if (!onlySoldInDrum && (t.status !== 'sold' && t.status !== 'reserved' && t.status !== 'available')) return;

      const isWonTicket = alreadyWonTicketNumbers.has(t.number);
      const isWonBuyer = t.buyerName && alreadyWonBuyerNames.has(t.buyerName.trim().toLowerCase());
      const isAbsent = Boolean(t.isExcluded);

      if (isAbsent && drumExcludeAbsent) {
        absentExcluded++;
      } else if ((drumPreventRepeatWinners && isWonTicket) || (drumPreventRepeatBuyers && isWonBuyer)) {
        wonExcluded++;
      } else {
        eligible++;
      }
    });

    return {
      drumEligibleCount: eligible,
      drumExcludedCount: wonExcluded,
      drumAbsentExcludedCount: absentExcluded,
    };
  }, [drumRaffle, onlySoldInDrum, drumPreventRepeatWinners, drumPreventRepeatBuyers, drumExcludeAbsent]);

  // Wall of Tickets filter for live projector / drum modal
  const filteredWallTickets = useMemo(() => {
    if (!drumRaffle) return [];
    let list = drumRaffle.tickets || [];
    if (wallFilterStatus === 'sold') {
      list = list.filter((t) => t.status === 'sold');
    } else if (wallFilterStatus === 'available') {
      list = list.filter((t) => t.status === 'available');
    } else if (wallFilterStatus === 'winner') {
      const winningNums = new Set(drumRaffle.prizes.map((p) => p.winnerTicketNumber).filter(Boolean));
      list = list.filter((t) => winningNums.has(t.number) || t.isWinner);
    }
    if (wallSearchQuery.trim()) {
      const q = wallSearchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          String(t.number).includes(q) ||
          t.ticketCode.toLowerCase().includes(q) ||
          (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
          (t.buyerPhone && t.buyerPhone.includes(q))
      );
    }
    return list;
  }, [drumRaffle, wallFilterStatus, wallSearchQuery]);

  // Spin the Live Tómbola Drum with sound and suspense
  const handleSpinDrum = (raffleOverride?: RaffleItem) => {
    const activeRaffle = raffleOverride || drumRaffle;
    if (!activeRaffle || isDrumSpinning) return;

    // Gather already won ticket numbers from prizes and ticket flags
    const alreadyWonTicketNumbers = new Set<number>();
    (activeRaffle.prizes || []).forEach((p) => {
      if (p.winnerTicketNumber !== undefined && p.winnerTicketNumber !== null) {
        alreadyWonTicketNumbers.add(p.winnerTicketNumber);
      }
    });
    (activeRaffle.tickets || []).forEach((t) => {
      if (t.isWinner) {
        alreadyWonTicketNumbers.add(t.number);
      }
    });

    // Gather buyer names that already won if preventRepeatBuyers is active
    const alreadyWonBuyerNames = new Set<string>();
    (activeRaffle.prizes || []).forEach((p) => {
      if (p.winnerBuyerName && p.winnerTicketNumber) {
        alreadyWonBuyerNames.add(p.winnerBuyerName.trim().toLowerCase());
      }
    });

    // Filter candidate tickets strictly excluding already drawn ones and absent ones when enabled
    const eligibleTickets = activeRaffle.tickets.filter((t) => {
      if (onlySoldInDrum && t.status !== 'sold') return false;
      if (!onlySoldInDrum && (t.status !== 'sold' && t.status !== 'reserved' && t.status !== 'available')) return false;

      // Exclude tickets that already won a prize in this raffle
      if (drumPreventRepeatWinners && alreadyWonTicketNumbers.has(t.number)) {
        return false;
      }

      // Exclude same buyer if 1 prize per person option is checked
      if (drumPreventRepeatBuyers && t.buyerName && alreadyWonBuyerNames.has(t.buyerName.trim().toLowerCase())) {
        return false;
      }

      // Exclude tickets disqualified / absent (did not show up) if option is checked
      if (drumExcludeAbsent && t.isExcluded) {
        return false;
      }

      return true;
    });

    if (eligibleTickets.length === 0) {
      if (drumPreventRepeatWinners && alreadyWonTicketNumbers.size > 0) {
        onShowToast(
          'No quedan boletos elegibles sin premiar. Todos los boletos válidos ya han resultado ganadores o fueron excluidos para no repetirse.',
          'danger'
        );
      } else {
        onShowToast(
          onlySoldInDrum
            ? 'No hay boletos vendidos disponibles para sortear en la tómbola.'
            : 'No hay boletos disponibles en el sorteo.',
          'danger'
        );
      }
      return;
    }

    setIsDrumSpinning(true);
    setDrumCandidateWinner(null);
    setShowDisqualifyPrompt(false);

    // Pick random winning ticket from strictly eligible tickets
    const winner = eligibleTickets[Math.floor(Math.random() * eligibleTickets.length)];

    // Suspense easing animation
    let speed = 40; // ms per tick
    let iterations = 0;
    const maxIterations = 36; // total cycles

    const cycle = () => {
      iterations++;
      const randomT = eligibleTickets[Math.floor(Math.random() * eligibleTickets.length)];
      setDisplayTicketNumber(randomT.number);
      setDisplayTicketCode(randomT.ticketCode);

      if (!isSoundMuted) {
        raffleSound.playTick(1 + (iterations / maxIterations) * 0.4);
      }

      if (iterations < maxIterations) {
        // Slow down smoothly in the last 12 ticks
        if (iterations > maxIterations - 12) {
          speed += 28;
        } else if (iterations > maxIterations - 6) {
          speed += 60;
        }
        setTimeout(cycle, speed);
      } else {
        // Land on winner!
        setDisplayTicketNumber(winner.number);
        setDisplayTicketCode(winner.ticketCode);
        setDrumCandidateWinner(winner);
        setIsDrumSpinning(false);

        if (!isSoundMuted) {
          raffleSound.playFanfare();
        }
        triggerConfetti(4500);
      }
    };

    cycle();
  };

  // Disqualify / Exclude candidate ticket (e.g. Person did not show up / was absent)
  const handleDisqualifyCandidate = async (autoReSpin: boolean, customReason?: string) => {
    if (!drumRaffle || !drumCandidateWinner) return;

    const reason = customReason || disqualifyReason || 'No se presentó al llamado';
    const disqualifiedTicket = drumCandidateWinner;

    // Update ticket in raffle to isExcluded: true
    const updatedTickets = drumRaffle.tickets.map((t) => {
      if (t.number === disqualifiedTicket.number) {
        return {
          ...t,
          isExcluded: true,
          exclusionReason: reason,
        };
      }
      return t;
    });

    const newExcludedRecord: RaffleExcludedRecord = {
      ticketNumber: disqualifiedTicket.number,
      ticketCode: disqualifiedTicket.ticketCode,
      buyerName: disqualifiedTicket.buyerName || 'Participante',
      reason: reason,
      timestamp: new Date().toISOString(),
    };

    const existingRecords = drumRaffle.excludedTickets || [];
    const updatedExcludedRecords = [
      ...existingRecords.filter((r) => r.ticketNumber !== disqualifiedTicket.number),
      newExcludedRecord,
    ];

    const updatedRaffle: RaffleItem = {
      ...drumRaffle,
      tickets: updatedTickets,
      excludedTickets: updatedExcludedRecords,
      updatedAt: new Date().toISOString(),
    };

    // Update state immediately so drum has fresh data
    setDrumRaffle(updatedRaffle);
    setDrumCandidateWinner(null);
    setDisplayTicketCode('???');
    setDisplayTicketNumber(null);
    setShowDisqualifyPrompt(false);

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(
      newRaffles,
      `🚫 Boleto ${disqualifiedTicket.ticketCode} (${disqualifiedTicket.buyerName || 'Participante'}) excluido del sorteo por: «${reason}». No volverá a salir.`
    );

    if (autoReSpin) {
      setTimeout(() => {
        handleSpinDrum(updatedRaffle);
      }, 350);
    }
  };

  // Re-spin without excluding (Keep ticket in drum so it CAN repeat if drawn again)
  const handleReSpinWithoutExcluding = (autoReSpin: boolean) => {
    if (!drumCandidateWinner) return;
    const tCode = drumCandidateWinner.ticketCode;
    setDrumCandidateWinner(null);
    setDisplayTicketCode('???');
    setDisplayTicketNumber(null);
    setShowDisqualifyPrompt(false);
    onShowToast(`🔄 Boleto ${tCode} se mantiene en la tómbola (podrá volver a salir).`, 'info');

    if (autoReSpin) {
      setTimeout(() => {
        handleSpinDrum();
      }, 350);
    }
  };

  // Restore an excluded ticket back to the eligible pool
  const handleRestoreExcludedTicket = async (ticketNumber: number) => {
    if (!drumRaffle) return;

    const updatedTickets = drumRaffle.tickets.map((t) => {
      if (t.number === ticketNumber) {
        return {
          ...t,
          isExcluded: false,
          exclusionReason: undefined,
        };
      }
      return t;
    });

    const updatedExcludedRecords = (drumRaffle.excludedTickets || []).filter(
      (r) => r.ticketNumber !== ticketNumber
    );

    const updatedRaffle: RaffleItem = {
      ...drumRaffle,
      tickets: updatedTickets,
      excludedTickets: updatedExcludedRecords,
      updatedAt: new Date().toISOString(),
    };

    setDrumRaffle(updatedRaffle);
    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(
      newRaffles,
      `✅ Boleto #${ticketNumber} restituido a la tómbola. Podrá participar nuevamente.`
    );
  };

  // Proclaim & Confirm Winner for the Prize
  const handleConfirmWinner = async () => {
    if (!drumRaffle || !drumCandidateWinner || !selectedPrizeId) return;

    const currentPrize = drumRaffle.prizes.find((p) => p.id === selectedPrizeId);
    if (!currentPrize) return;

    const winnerName = drumCandidateWinner.buyerName || `Boleto ${drumCandidateWinner.ticketCode}`;
    const winnerPhone = drumCandidateWinner.buyerPhone || '';

    // Update prize in raffle
    const updatedPrizes = drumRaffle.prizes.map((p) => {
      if (p.id === selectedPrizeId) {
        return {
          ...p,
          winnerTicketNumber: drumCandidateWinner.number,
          winnerBuyerName: winnerName,
          winnerPhone: winnerPhone,
          winnerDeclaredAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // Mark the winning ticket so it permanently reflects isWinner and wonPrize
    const updatedTickets = drumRaffle.tickets.map((t) => {
      if (t.number === drumCandidateWinner.number) {
        return {
          ...t,
          isWinner: true,
          wonPrizeName: currentPrize.name,
          wonPrizePlace: currentPrize.place,
        };
      }
      return t;
    });

    // Mark all prizes assigned check
    const allPrizesWon = updatedPrizes.every((p) => Boolean(p.winnerTicketNumber));

    const updatedRaffle: RaffleItem = {
      ...drumRaffle,
      prizes: updatedPrizes,
      tickets: updatedTickets,
      status: allPrizesWon ? 'completed' : drumRaffle.status,
      closedAt: allPrizesWon ? new Date().toISOString() : drumRaffle.closedAt,
      updatedAt: new Date().toISOString(),
    };

    const newRaffles = raffles.map((r) => (r.id === updatedRaffle.id ? updatedRaffle : r));
    await persistRaffles(
      newRaffles,
      `🏆 ¡Ganador proclamado! ${winnerName} con el boleto ${drumCandidateWinner.ticketCode} se lleva: ${currentPrize.name}.`
    );

    // Pick next available undrawn prize
    const nextPrize = updatedPrizes.find((p) => !p.winnerTicketNumber);
    if (nextPrize) {
      setSelectedPrizeId(nextPrize.id);
      setDrumCandidateWinner(null);
      setDisplayTicketCode('???');
      setDisplayTicketNumber(null);
    }
  };

  // Delete raffle
  const handleDeleteRaffle = async (raffleId: string) => {
    const match = raffles.find((r) => r.id === raffleId);
    if (!match) return;

    const updated = raffles.filter((r) => r.id !== raffleId);
    setRaffles(updated);

    if (onUpdateSectionData) {
      onUpdateSectionData({
        ...section,
        rafflesData: {
          ...section.rafflesData,
          raffles: updated,
        },
        updatedAt: new Date().toISOString(),
      });
    }

    try {
      await deleteFirestoreDoc('raffles', raffleId);
      onShowToast(`Sorteo «${match.title}» eliminado con éxito`, 'info');
    } catch (e) {
      console.warn('Error deleting raffle:', e);
    }
  };

  // Create new raffle form
  const [newRaffleForm, setNewRaffleForm] = useState<{
    title: string;
    category: string;
    description: string;
    ticketPrice: number;
    currency: string;
    totalTickets: number;
    ticketPrefix: string;
    drawDate: string;
    bannerImageUrl: string;
    rulesAndTerms: string;
    preventRepeatWinners: boolean;
    preventRepeatBuyers: boolean;
    prizes: { place: number; name: string; description: string; imageUrl?: string; valueEstimated?: number }[];
  }>({
    title: '',
    category: categories[0]?.name || 'Pro-Templo',
    description: '',
    ticketPrice: 5,
    currency: '$',
    totalTickets: 100,
    ticketPrefix: '#',
    drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    bannerImageUrl: '',
    rulesAndTerms: 'Los fondos serán destinados a los proyectos de la congregación.',
    preventRepeatWinners: true,
    preventRepeatBuyers: false,
    prizes: [
      {
        place: 1,
        name: 'Premio Principal 1er Lugar',
        description: 'Descripción del premio principal',
        imageUrl: '',
        valueEstimated: 200,
      },
    ],
  });

  // Apply template into create form
  const handleApplyTemplate = (tplIdx: number) => {
    const tpl = DEFAULT_RAFFLE_TEMPLATES[tplIdx];
    if (!tpl) return;
    setNewRaffleForm({
      title: tpl.title,
      category: tpl.category,
      description: tpl.description,
      ticketPrice: tpl.ticketPrice,
      currency: tpl.currency,
      totalTickets: tpl.totalTickets,
      ticketPrefix: '#',
      drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      bannerImageUrl: tpl.bannerImageUrl,
      rulesAndTerms: 'Los fondos serán destinados exclusivamente al proyecto eclesial.',
      preventRepeatWinners: true,
      preventRepeatBuyers: false,
      prizes: tpl.prizes.map((p) => ({ ...p })),
    });
    onShowToast(`Plantilla «${tpl.title}» cargada en el formulario`, 'info');
  };

  // Open fresh blank create modal
  const handleOpenCreateModal = () => {
    setEditingRaffle(null);
    setNewRaffleForm({
      title: '',
      category: categories[0]?.name || 'Pro-Templo',
      description: '',
      ticketPrice: 5,
      currency: '$',
      totalTickets: 100,
      ticketPrefix: '#',
      drawDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      bannerImageUrl: '',
      rulesAndTerms: 'Los fondos serán destinados exclusivamente al proyecto eclesial.',
      preventRepeatWinners: true,
      preventRepeatBuyers: false,
      prizes: [
        {
          place: 1,
          name: '',
          description: '',
          imageUrl: '',
          valueEstimated: 0,
        },
      ],
    });
    setIsCreateModalOpen(true);
  };

  // Upload main raffle banner image via FileReader
  const handleUploadRaffleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('La imagen no debe superar los 8MB', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setNewRaffleForm((prev) => ({ ...prev, bannerImageUrl: res }));
      onShowToast('Imagen principal del sorteo cargada', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Upload image for a specific prize in the form via FileReader
  const handleUploadPrizeImage = (prizeIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      onShowToast('La imagen no debe superar los 8MB', 'danger');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setNewRaffleForm((prev) => {
        const updated = [...prev.prizes];
        if (updated[prizeIndex]) {
          updated[prizeIndex] = { ...updated[prizeIndex], imageUrl: res };
        }
        return { ...prev, prizes: updated };
      });
      onShowToast(`Foto cargada para el premio ${prizeIndex + 1}`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Save new or edited raffle
  const handleSaveRaffleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaffleForm.title.trim()) {
      onShowToast('El título del sorteo es obligatorio', 'danger');
      return;
    }
    if (newRaffleForm.prizes.length === 0) {
      onShowToast('Debes agregar al menos un premio a sortear', 'danger');
      return;
    }

    if (editingRaffle) {
      // Editing existing raffle
      const updatedItem: RaffleItem = {
        ...editingRaffle,
        title: newRaffleForm.title.trim(),
        category: newRaffleForm.category,
        description: newRaffleForm.description.trim(),
        ticketPrice: Number(newRaffleForm.ticketPrice) || 0,
        currency: newRaffleForm.currency || '$',
        drawDate: newRaffleForm.drawDate ? new Date(newRaffleForm.drawDate).toISOString() : undefined,
        bannerImageUrl: newRaffleForm.bannerImageUrl,
        rulesAndTerms: newRaffleForm.rulesAndTerms,
        preventRepeatWinners: newRaffleForm.preventRepeatWinners,
        preventRepeatBuyers: newRaffleForm.preventRepeatBuyers,
        prizes: newRaffleForm.prizes.map((p, idx) => {
          const existingPrize = editingRaffle.prizes[idx];
          return {
            id: existingPrize?.id || `prz_${Date.now()}_${idx + 1}`,
            place: p.place || idx + 1,
            name: p.name,
            description: p.description,
            imageUrl: p.imageUrl,
            valueEstimated: Number(p.valueEstimated) || 0,
            winnerTicketNumber: existingPrize?.winnerTicketNumber,
            winnerBuyerName: existingPrize?.winnerBuyerName,
            winnerPhone: existingPrize?.winnerPhone,
          };
        }),
        updatedAt: new Date().toISOString(),
      };

      const newRaffles = raffles.map((r) => (r.id === updatedItem.id ? updatedItem : r));
      await persistRaffles(newRaffles, `Sorteo «${updatedItem.title}» actualizado con éxito.`);
      setEditingRaffle(null);
      setIsCreateModalOpen(false);
    } else {
      // Creating brand new raffle
      const totalNum = Math.max(10, Math.min(1000, Number(newRaffleForm.totalTickets) || 100));
      const newId = `raffle_${Date.now()}`;
      const newRaffle: RaffleItem = {
        id: newId,
        title: newRaffleForm.title.trim(),
        category: newRaffleForm.category,
        description: newRaffleForm.description.trim(),
        status: 'active',
        ticketPrice: Number(newRaffleForm.ticketPrice) || 0,
        currency: newRaffleForm.currency || '$',
        totalTickets: totalNum,
        ticketPrefix: newRaffleForm.ticketPrefix || '#',
        drawDate: newRaffleForm.drawDate ? new Date(newRaffleForm.drawDate).toISOString() : undefined,
        bannerImageUrl:
          newRaffleForm.bannerImageUrl ||
          'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80',
        rulesAndTerms: newRaffleForm.rulesAndTerms,
        preventRepeatWinners: newRaffleForm.preventRepeatWinners,
        preventRepeatBuyers: newRaffleForm.preventRepeatBuyers,
        prizes: newRaffleForm.prizes.map((p, idx) => ({
          id: `prz_${Date.now()}_${idx + 1}`,
          place: p.place || idx + 1,
          name: p.name,
          description: p.description,
          imageUrl: p.imageUrl,
          valueEstimated: Number(p.valueEstimated) || 0,
        })),
        tickets: generateTicketsArray(totalNum, newRaffleForm.ticketPrefix || '#', Number(newRaffleForm.ticketPrice) || 0),
        allowPublicReservation: true,
        requirePaymentApproval: true,
        onlyDrawSoldTickets: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || 'Administración',
      };

      const newRaffles = [newRaffle, ...raffles];
      await persistRaffles(newRaffles, `🎉 ¡Sorteo «${newRaffle.title}» creado con ${totalNum} boletos!`);
      setIsCreateModalOpen(false);
    }
  };

  // Open edit modal for an existing raffle
  const handleOpenEditRaffle = (r: RaffleItem) => {
    setEditingRaffle(r);
    setNewRaffleForm({
      title: r.title,
      category: r.category || categories[0]?.name || 'Pro-Templo',
      description: r.description,
      ticketPrice: r.ticketPrice,
      currency: r.currency,
      totalTickets: r.totalTickets,
      ticketPrefix: r.ticketPrefix || '#',
      drawDate: r.drawDate ? r.drawDate.slice(0, 16) : '',
      bannerImageUrl: r.bannerImageUrl || '',
      rulesAndTerms: r.rulesAndTerms || '',
      preventRepeatWinners: r.preventRepeatWinners !== false,
      preventRepeatBuyers: Boolean(r.preventRepeatBuyers),
      prizes: r.prizes.map((p) => ({
        place: p.place,
        name: p.name,
        description: p.description || '',
        imageUrl: p.imageUrl || '',
        valueEstimated: p.valueEstimated || 0,
      })),
    });
    setIsCreateModalOpen(true);
  };

  // WhatsApp share ticket summary
  const handleShareWhatsAppTicket = (raffle: RaffleItem, ticket: RaffleTicket) => {
    const text = `🎟️ *COMPROBANTE DE BOLETO DE SORTEO* 🎟️\n\n📌 *Sorteo:* ${raffle.title}\n🔢 *Boleto Nº:* ${ticket.ticketCode}\n👤 *Titular:* ${ticket.buyerName || 'Participante'}\n💰 *Valor:* ${raffle.ticketPrice === 0 ? 'Gratis' : `${raffle.currency}${raffle.ticketPrice}`}\n📊 *Estado:* ${ticket.status === 'sold' ? 'PAGADO Y CONFIRMADO ✅' : 'RESERVADO ⏳'}\n📅 *Fecha del Sorteo:* ${raffle.drawDate ? new Date(raffle.drawDate).toLocaleDateString() : 'Por anunciar'}\n\n🙏 ¡Muchas gracias por apoyar esta hermosa causa para el Reino de Dios!`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // =========================================================================
  // GESTIÓN DE CATEGORÍAS DE SORTEO (CREAR, EDITAR, ELIMINAR Y SINCRONIZAR)
  // =========================================================================

  // Abrir modal de categorías
  const handleOpenCategoryModal = (catToEdit?: RaffleCategory) => {
    if (catToEdit) {
      setEditingCategory(catToEdit);
      setCategoryFormData({
        name: catToEdit.name,
        description: catToEdit.description || '',
        color: catToEdit.color || '#f59e0b',
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({
        name: '',
        description: '',
        color: '#f59e0b',
      });
    }
    setCategoryToDelete(null);
    setIsCategoryModalOpen(true);
  };

  // Guardar (Crear o Actualizar) Categoría en Firebase Firestore y estado local
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = categoryFormData.name.trim();
    if (!trimmedName) {
      onShowToast('El nombre de la categoría es obligatorio', 'danger');
      return;
    }

    // Validar duplicados
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory?.id
    );
    if (isDuplicate) {
      onShowToast('Ya existe una categoría con ese nombre', 'danger');
      return;
    }

    try {
      if (editingCategory) {
        // Actualizar categoría existente
        const oldName = editingCategory.name;
        const updatedCat: RaffleCategory = {
          ...editingCategory,
          name: trimmedName,
          description: categoryFormData.description.trim() || undefined,
          color: categoryFormData.color || '#f59e0b',
          updatedAt: new Date().toISOString(),
        };

        const updatedCategories = categories.map((c) =>
          c.id === editingCategory.id ? updatedCat : c
        );
        setCategories(updatedCategories);

        // Guardar en Firestore 'raffleCategories'
        await saveFirestoreDoc('raffleCategories', updatedCat.id, updatedCat);

        // Si el nombre cambió, actualizar todos los sorteos que usaban este nombre
        if (oldName !== trimmedName) {
          const updatedRaffles = raffles.map((r) =>
            r.category === oldName ? { ...r, category: trimmedName } : r
          );
          setRaffles(updatedRaffles);
          for (const r of updatedRaffles) {
            if (r.category === trimmedName) {
              await saveFirestoreDoc('raffles', r.id, r);
            }
          }
          if (onUpdateSectionData) {
            onUpdateSectionData({
              ...section,
              rafflesData: {
                ...section.rafflesData,
                categories: updatedCategories,
                raffles: updatedRaffles,
              },
            });
          }
          if (newRaffleForm.category === oldName) {
            setNewRaffleForm((prev) => ({ ...prev, category: trimmedName }));
          }
          if (categoryFilter === oldName) {
            setCategoryFilter(trimmedName);
          }
        } else {
          if (onUpdateSectionData) {
            onUpdateSectionData({
              ...section,
              rafflesData: {
                ...section.rafflesData,
                categories: updatedCategories,
                raffles,
              },
            });
          }
        }

        onShowToast(`Categoría «${trimmedName}» actualizada con éxito`, 'success');
      } else {
        // Crear nueva categoría
        const newCat: RaffleCategory = {
          id: `cat_${Date.now()}`,
          name: trimmedName,
          description: categoryFormData.description.trim() || undefined,
          color: categoryFormData.color || '#f59e0b',
          createdAt: new Date().toISOString(),
          createdBy: currentUser?.name || 'Administración',
        };

        const updatedCategories = [...categories, newCat];
        setCategories(updatedCategories);

        // Guardar en Firestore 'raffleCategories'
        await saveFirestoreDoc('raffleCategories', newCat.id, newCat);

        if (onUpdateSectionData) {
          onUpdateSectionData({
            ...section,
            rafflesData: {
              ...section.rafflesData,
              categories: updatedCategories,
              raffles,
            },
          });
        }

        // Auto-seleccionar en formulario de creación de sorteo
        setNewRaffleForm((prev) => ({ ...prev, category: newCat.name }));

        onShowToast(`Categoría «${trimmedName}» creada con éxito`, 'success');
      }

      setEditingCategory(null);
      setCategoryFormData({ name: '', description: '', color: '#f59e0b' });
    } catch (err) {
      console.error('Error al guardar categoría:', err);
      onShowToast('Error al guardar la categoría en Firebase', 'danger');
    }
  };

  // Solicitar eliminación de categoría
  const handleRequestDeleteCategory = (cat: RaffleCategory) => {
    if (categories.length <= 1) {
      onShowToast('Debe existir al menos una categoría en el sistema', 'danger');
      return;
    }
    const remaining = categories.filter((c) => c.id !== cat.id);
    setDeleteFallbackCategory(remaining[0]?.name || 'General');
    setCategoryToDelete(cat);
  };

  // Confirmar eliminación de categoría en Firestore y reasignar sorteos
  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const catName = categoryToDelete.name;
    const fallback = deleteFallbackCategory || 'General';

    try {
      // Eliminar de Firestore
      await deleteFirestoreDoc('raffleCategories', categoryToDelete.id);

      const remainingCategories = categories.filter((c) => c.id !== categoryToDelete.id);
      setCategories(remainingCategories);

      // Reasignar sorteos afectados
      const affectedRaffles = raffles.filter((r) => r.category === catName);
      let updatedRaffles = raffles;
      if (affectedRaffles.length > 0) {
        updatedRaffles = raffles.map((r) =>
          r.category === catName ? { ...r, category: fallback } : r
        );
        setRaffles(updatedRaffles);
        for (const r of updatedRaffles) {
          if (r.category === fallback) {
            await saveFirestoreDoc('raffles', r.id, r);
          }
        }
      }

      if (onUpdateSectionData) {
        onUpdateSectionData({
          ...section,
          rafflesData: {
            ...section.rafflesData,
            categories: remainingCategories,
            raffles: updatedRaffles,
          },
        });
      }

      if (newRaffleForm.category === catName) {
        setNewRaffleForm((prev) => ({ ...prev, category: fallback }));
      }
      if (categoryFilter === catName) {
        setCategoryFilter('all');
      }

      setCategoryToDelete(null);
      onShowToast(`Categoría «${catName}» eliminada correctamente`, 'info');
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      onShowToast('Error al eliminar la categoría de Firebase', 'danger');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP HEADER & METRICS BAR */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border border-amber-500/30 backdrop-blur-xl shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30">
              <Ticket className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {section.name || 'Sorteos & Rifas Pro-Fondos'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {stats.activeRaffles} Activos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                {section.description ||
                  'Gestión intuitiva de boletos numerados, recaudación pro-templo, tómbola digital en vivo y premiaciones.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLookupModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 text-slate-700 dark:text-slate-200 font-bold text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-500" />
              <span>Consultar Mi Boleto</span>
            </button>

            {isAdminOrLeader && (
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nuevo Sorteo</span>
              </button>
            )}

            {onOpenSectionEditor && (
              <button
                type="button"
                onClick={onOpenSectionEditor}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Personalizar banner y configuración de la sección"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* METRICS STRIP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Boletos Vendidos</p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {stats.totalTicketsSold}{' '}
                <span className="text-xs font-normal text-slate-400">/ {stats.totalTicketsAll}</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Recaudado Total</p>
              <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                ${stats.totalFundsRaised.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Premios en Juego</p>
              <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {stats.totalPrizesCount}{' '}
                <span className="text-xs font-normal text-slate-400">premios</span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-sm shadow-sm flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tómbola Digital</p>
              <p className="text-xs sm:text-sm font-black text-blue-600 dark:text-blue-400">
                Giro en Vivo 100%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER TABS, CATEGORY SELECT & SEARCH BAR */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Todos ({raffles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'active'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Activos ({raffles.filter((r) => r.status === 'active').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('completed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Finalizados ({raffles.filter((r) => r.status === 'completed').length})
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => setFilterTab('my_tickets')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterTab === 'my_tickets'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Mis Boletos
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar sorteo o premio..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {isAdminOrLeader && (
              <button
                type="button"
                onClick={() => handleOpenCategoryModal()}
                className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
                title="Administrar categorías de sorteos (Crear, Editar, Eliminar y Sincronizar)"
              >
                <Tag className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span className="hidden sm:inline">Categorías</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-black">
                  {categories.length}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Pills Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1 shrink-0 flex items-center space-x-1">
            <Tag className="w-3 h-3" />
            <span>Categoría:</span>
          </span>
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shrink-0 ${
              categoryFilter === 'all'
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Todas ({raffles.length})
          </button>
          {categories.map((cat) => {
            const count = raffles.filter((r) => r.category === cat.name).length;
            const isSelected = categoryFilter === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(isSelected ? 'all' : cat.name)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer shrink-0 flex items-center space-x-1.5 border ${
                  isSelected
                    ? 'border-transparent text-white shadow-sm'
                    : 'border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                }`}
                style={isSelected ? { backgroundColor: cat.color || '#f59e0b' } : undefined}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: isSelected ? '#ffffff' : cat.color || '#f59e0b' }}
                />
                <span>{cat.name}</span>
                <span className={`text-[10px] font-normal ${isSelected ? 'text-white/90' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. RAFFLES CARDS LIST */}
      {filteredRaffles.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Ticket className="w-12 h-12 text-amber-500/40 mx-auto" />
          <h3 className="font-extrabold text-slate-800 dark:text-white text-base">No se encontraron sorteos</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'Prueba modificando los términos de búsqueda.'
              : 'Aún no hay sorteos en esta categoría. Puedes crear uno rápidamente con las plantillas oficiales.'}
          </p>
          {isAdminOrLeader && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow transition-all inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primer Sorteo</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRaffles.map((raffle) => {
            const soldTickets = (raffle.tickets || []).filter((t) => t.status === 'sold');
            const reservedTickets = (raffle.tickets || []).filter((t) => t.status === 'reserved');
            const availableTickets = (raffle.tickets || []).filter((t) => t.status === 'available');
            const percentageSold = Math.round(
              ((soldTickets.length + reservedTickets.length) / Math.max(1, raffle.totalTickets)) * 100
            );
            const totalRevenue = soldTickets.length * (raffle.ticketPrice || 0);
            const maxPotential = (raffle.totalTickets || 0) * (raffle.ticketPrice || 0);

            return (
              <div
                key={raffle.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  {/* Banner / Cover */}
                  <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                    <img
                      src={
                        raffle.bannerImageUrl ||
                        'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={raffle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      {(() => {
                        const matchedCat = categories.find(
                          (c) => c.name.toLowerCase() === (raffle.category || '').toLowerCase()
                        );
                        return (
                          <span
                            className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md border border-white/20 shadow-sm flex items-center space-x-1"
                            style={{
                              backgroundColor: matchedCat?.color ? `${matchedCat.color}e6` : 'rgba(0,0,0,0.7)',
                              color: '#ffffff',
                            }}
                          >
                            <Tag className="w-3 h-3 text-white/90" />
                            <span>{raffle.category || 'General'}</span>
                          </span>
                        );
                      })()}

                      {raffle.preventRepeatWinners && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-black/60 text-emerald-300 backdrop-blur-md border border-emerald-500/40 flex items-center space-x-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Sin Repetidos</span>
                        </span>
                      )}

                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md ${
                          raffle.status === 'active'
                            ? 'bg-emerald-500/90 text-white shadow-md shadow-emerald-500/20'
                            : raffle.status === 'completed'
                            ? 'bg-purple-600/90 text-white'
                            : 'bg-slate-600/90 text-white'
                        }`}
                      >
                        {raffle.status === 'active'
                          ? 'En Curso'
                          : raffle.status === 'completed'
                          ? 'Finalizado'
                          : 'Borrador'}
                      </span>
                    </div>

                    {/* Title & Price on cover + What is raffled button */}
                    <div className="absolute bottom-3 left-4 right-4 text-white space-y-1.5">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewPrizesRaffle(raffle);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-amber-300 hover:text-white text-[11px] font-black backdrop-blur-md border border-amber-400/40 flex items-center space-x-1.5 shadow transition-all cursor-pointer"
                          title="Ver qué artículos y premios se sortean con sus fotos"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                          <span>¿Qué se sortea? ({raffle.prizes.length} premios con fotos)</span>
                        </button>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-md">
                          {raffle.title}
                        </h3>
                        <div className="text-right shrink-0 ml-2">
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white font-black text-xs sm:text-sm shadow-md">
                            {raffle.ticketPrice === 0 ? 'Gratis' : `${raffle.currency}${raffle.ticketPrice} / boleto`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {raffle.description}
                    </p>

                    {/* Draw Date & Countdown strip */}
                    {raffle.drawDate && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 text-amber-800 dark:text-amber-200 font-bold">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            Fecha del Sorteo: {new Date(raffle.drawDate).toLocaleDateString()} a las{' '}
                            {new Date(raffle.drawDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>En Vivo</span>
                        </span>
                      </div>
                    )}

                    {/* Progress Bar of Sold Tickets */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500 flex items-center space-x-1">
                          <span>Progreso de Boletos</span>
                          <span className="text-slate-900 dark:text-white font-extrabold">({percentageSold}%)</span>
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          Recaudado: <strong className="text-emerald-600">${totalRevenue.toLocaleString()}</strong> / $
                          {maxPotential.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, percentageSold)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          <strong className="text-emerald-600 font-bold">{soldTickets.length}</strong> vendidos
                        </span>
                        <span>
                          <strong className="text-amber-600 font-bold">{reservedTickets.length}</strong> apartados
                        </span>
                        <span>
                          <strong className="text-slate-500 font-bold">{availableTickets.length}</strong> disponibles
                        </span>
                      </div>
                    </div>

                    {/* Prizes Showcase */}
                    <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span>Premios en Juego ({raffle.prizes.length})</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setViewPrizesRaffle(raffle)}
                          className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver fotos y detalles</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {raffle.prizes.map((prize) => {
                          const hasWinner = Boolean(prize.winnerTicketNumber);
                          return (
                            <div
                              key={prize.id}
                              onClick={() => {
                                if (prize.imageUrl) {
                                  setPreviewZoomImage({
                                    url: prize.imageUrl,
                                    title: `${prize.place}º Premio: ${prize.name}`,
                                    subtitle:
                                      prize.description ||
                                      (prize.valueEstimated ? `Valor estimado: $${prize.valueEstimated}` : undefined),
                                  });
                                } else {
                                  setViewPrizesRaffle(raffle);
                                }
                              }}
                              className={`p-2.5 rounded-2xl border flex items-center space-x-2.5 transition-all cursor-pointer hover:shadow-md ${
                                hasWinner
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-950 dark:text-amber-200'
                                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                              }`}
                              title={prize.imageUrl ? 'Clic para ver foto en grande' : 'Clic para ver detalles'}
                            >
                              {prize.imageUrl ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400/50 shrink-0 shadow-sm group/thumb">
                                  <img
                                    src={prize.imageUrl}
                                    alt={prize.name}
                                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                    referrerPolicy="no-referrer"
                                  />
                                  <span className="absolute bottom-0 right-0 px-1 rounded-tl-md bg-black/80 text-[9px] font-black text-amber-300">
                                    {prize.place}º
                                  </span>
                                </div>
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                                  {prize.place === 1 ? '1º' : prize.place === 2 ? '2º' : `${prize.place}º`}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-extrabold truncate text-slate-900 dark:text-white">
                                  {prize.name}
                                </p>
                                {hasWinner ? (
                                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-400 flex items-center space-x-1">
                                    <span>🎉 Ganador: {prize.winnerBuyerName || 'Boleto #' + prize.winnerTicketNumber}</span>
                                  </p>
                                ) : (
                                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                                    {prize.valueEstimated ? (
                                      <span>Valor: ${prize.valueEstimated}</span>
                                    ) : (
                                      <span>En juego</span>
                                    )}
                                    {prize.imageUrl && (
                                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center space-x-0.5">
                                        <Camera className="w-2.5 h-2.5" />
                                        <span>Foto</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTicketGridRaffle(raffle);
                        setTicketFilter('all');
                        setTicketSearch('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>Ver Boletos ({raffle.totalTickets})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDrum(raffle)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Tómbola en Vivo</span>
                    </button>

                    {raffle.prizes.some((p) => Boolean(p.winnerTicketNumber)) && (
                      <button
                        type="button"
                        onClick={() => {
                          setTicketGridRaffle(raffle);
                          setTicketFilter('winners');
                          setTicketSearch('');
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Ver Ganadores</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    {isAdminOrLeader && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEditRaffle(raffle)}
                          className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Editar sorteo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRaffle(raffle.id)}
                          className="p-2 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                          title="Eliminar sorteo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: TÓMBOLA DIGITAL ANIMADA EN VIVO (PROJECTOR / HIGH-VISIBILITY)     */}
      {/* ========================================================================= */}
      {drumRaffle && (
        <div
          className={`fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center ${
            isDrumFullscreen ? 'p-0 w-screen h-screen' : 'p-2 sm:p-4 overflow-y-auto'
          } animate-fadeIn`}
        >
          <div
            className={`${
              isDrumFullscreen
                ? 'w-full h-full rounded-none border-none max-w-none flex flex-col justify-between p-3 sm:p-5 overflow-hidden'
                : 'rounded-3xl border border-amber-500/40 p-4 sm:p-6 max-w-4xl w-full shadow-2xl space-y-4 max-h-[94vh] overflow-y-auto'
            } bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white text-center relative overflow-hidden flex flex-col`}
          >
            {/* Ambient Lighting / Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-72 bg-amber-500/15 blur-3xl pointer-events-none" />

            {/* Header with Switch for Tombola / Muro de Boletos, Rules button, Sound, Fullscreen, Close */}
            <div className="flex flex-wrap items-center justify-between pb-2.5 border-b border-slate-800 shrink-0 gap-2">
              <div className="flex items-center space-x-2.5 text-left min-w-0">
                <div className="p-2 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-base sm:text-lg text-white truncate">Tómbola Digital en Vivo</h3>
                    {isDrumFullscreen && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 font-extrabold text-[10px] tracking-wider uppercase shrink-0">
                        Modo Proyector
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-300/80 truncate max-w-xs sm:max-w-md">{drumRaffle.title}</p>
                </div>
              </div>

              {/* View Switch Tabs: Tómbola vs Muro de Boletos */}
              <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-inner shrink-0">
                <button
                  type="button"
                  onClick={() => setDrumProjectorTab('drum')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    drumProjectorTab === 'drum'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tómbola</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrumProjectorTab('wall')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                    drumProjectorTab === 'wall'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Muro de Boletos ({drumEligibleCount})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {/* Toggle Rules & Switches */}
                <button
                  type="button"
                  onClick={() => setShowDrumSettings(!showDrumSettings)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                    showDrumSettings
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Configurar reglas, exclusiones y filtros de boletos"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline text-[11px]">Reglas</span>
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isSoundMuted
                      ? 'bg-slate-900 border-slate-800 text-slate-500'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  }`}
                  title={isSoundMuted ? 'Activar sonido' : 'Silenciar sonido'}
                >
                  {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>

                {/* Fullscreen / Projector Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDrumFullscreen(!isDrumFullscreen)}
                  className={`p-2 sm:px-3 rounded-xl border font-bold text-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
                    isDrumFullscreen
                      ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-amber-500/60 text-amber-300'
                  }`}
                  title={isDrumFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa / Proyector de Iglesia'}
                >
                  {isDrumFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">
                    {isDrumFullscreen ? 'Reducir' : 'Proyector'}
                  </span>
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setDrumRaffle(null)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Cerrar tómbola"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* COLLAPSIBLE RULES & FILTERS DRAWER */}
            {showDrumSettings && (
              <div className="p-3 sm:p-4 rounded-2xl bg-slate-900/95 border border-amber-500/30 space-y-2.5 text-left animate-fadeIn shrink-0 shadow-xl my-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reglas del Sorteo en Vivo</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowDrumSettings(false)}
                    className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Prevent Repeat Winning Tickets Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={drumPreventRepeatWinners}
                      onChange={(e) => setDrumPreventRepeatWinners(e.target.checked)}
                      disabled={isDrumSpinning}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                    <span className="ml-2 text-xs font-bold text-slate-200 flex items-center space-x-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>No repetir boletos ya ganadores</span>
                    </span>
                  </label>

                  {/* Prevent Repeat Buyers Switch (1 prize per person) */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={drumPreventRepeatBuyers}
                      onChange={(e) => setDrumPreventRepeatBuyers(e.target.checked)}
                      disabled={isDrumSpinning}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
                    <span className="ml-2 text-xs font-bold text-slate-200 flex items-center space-x-1">
                      <User className="w-3.5 h-3.5 text-purple-400" />
                      <span>1 premio por persona</span>
                    </span>
                  </label>

                  {/* Exclude Absent / No-Show Tickets Switch */}
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={drumExcludeAbsent}
                      onChange={(e) => setDrumExcludeAbsent(e.target.checked)}
                      disabled={isDrumSpinning}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    <span className="ml-2 text-xs font-bold text-slate-200 flex items-center space-x-1">
                      <Ban className="w-3.5 h-3.5 text-rose-400" />
                      <span>Excluir ausentes</span>
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
                  <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onlySoldInDrum}
                      onChange={(e) => setOnlySoldInDrum(e.target.checked)}
                      disabled={isDrumSpinning}
                      className="w-3.5 h-3.5 rounded text-amber-500 bg-slate-800 border-slate-700 cursor-pointer"
                    />
                    <span className="text-[11px] sm:text-xs font-medium">
                      Solo boletos pagados ({(drumRaffle.tickets || []).filter((t) => t.status === 'sold').length})
                    </span>
                  </label>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black">
                      🎯 {drumEligibleCount} elegibles
                    </span>
                    {drumExcludedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-black">
                        {drumExcludedCount} ya premiados
                      </span>
                    )}
                    {drumAbsentExcludedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowExcludedDrawer(!showExcludedDrawer)}
                        className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-black underline cursor-pointer"
                      >
                        {drumAbsentExcludedCount} ausentes/descartados
                      </button>
                    )}
                  </div>
                </div>

                {/* Excluded Tickets Drawer */}
                {showExcludedDrawer && (
                  <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 space-y-1.5 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-rose-300">Boletos Excluidos / Descartados</span>
                      <button
                        type="button"
                        onClick={() => setShowExcludedDrawer(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto divide-y divide-rose-900/40 text-xs">
                      {drumRaffle.tickets.filter((t) => t.isExcluded).map((t) => (
                        <div key={t.number} className="flex items-center justify-between py-1">
                          <div>
                            <span className="font-bold text-white mr-1.5">{t.ticketCode}</span>
                            <span className="text-slate-300">{t.buyerName || 'Participante'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRestoreExcludedTicket(t.number)}
                            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold cursor-pointer"
                          >
                            Restituir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MAIN CONTENT AREA: TOMBOLA VIEW OR WALL VIEW */}
            {drumProjectorTab === 'drum' ? (
              <div className="flex-1 min-h-0 flex flex-col justify-between py-1 sm:py-2 overflow-y-auto space-y-3">
                {/* ACTIVE PRIZE SELECTOR & DISPLAY BANNER */}
                {(() => {
                  const currentPrize = drumRaffle.prizes.find((p) => p.id === selectedPrizeId);
                  if (!currentPrize) return null;
                  return (
                    <div className="p-2 sm:p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-3 text-left shrink-0">
                      <div className="flex items-center space-x-3 min-w-0">
                        {currentPrize.imageUrl ? (
                          <img
                            src={currentPrize.imageUrl}
                            alt={currentPrize.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-amber-400 shadow-md shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                            onClick={() =>
                              setPreviewZoomImage({
                                url: currentPrize.imageUrl!,
                                title: `${currentPrize.place}º Lugar: ${currentPrize.name}`,
                                subtitle: currentPrize.description,
                              })
                            }
                          />
                        ) : (
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-amber-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                            {currentPrize.place === 1 ? '🥇' : currentPrize.place === 2 ? '🥈' : '🥉'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center space-x-1">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>Premio en Juego ({currentPrize.place}º Lugar)</span>
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-white truncate">{currentPrize.name}</h4>
                          {currentPrize.description && (
                            <p className="text-[11px] text-slate-300 truncate max-w-xs sm:max-w-md">{currentPrize.description}</p>
                          )}
                        </div>
                      </div>

                      {/* Change Prize Dropdown */}
                      <div className="shrink-0 flex items-center space-x-2">
                        <select
                          value={selectedPrizeId}
                          onChange={(e) => {
                            setSelectedPrizeId(e.target.value);
                            setDrumCandidateWinner(null);
                            setDisplayTicketCode('???');
                            setDisplayTicketNumber(null);
                          }}
                          disabled={isDrumSpinning}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-200 font-bold text-xs focus:ring-2 focus:ring-amber-400 cursor-pointer"
                        >
                          {drumRaffle.prizes.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.place}º: {p.name} {p.winnerTicketNumber ? '🏆 (Ganado)' : '⏳'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })()}

                {/* VISUAL TOMBOLA DRUM & LARGE DIGITS DISPLAY */}
                <div className="flex-1 flex flex-col items-center justify-center my-auto py-2 sm:py-3 relative">
                  {/* Rotating 3D Drum Cage */}
                  <div className="relative flex items-center justify-center mb-2 sm:mb-4">
                    <div
                      className={`w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 rounded-full border-4 border-dashed transition-all duration-700 flex items-center justify-center relative ${
                        isDrumSpinning
                          ? 'border-amber-400 animate-spin shadow-[0_0_50px_rgba(245,158,11,0.6)] bg-gradient-to-tr from-amber-500/20 via-orange-500/10 to-yellow-400/20'
                          : drumCandidateWinner
                          ? 'border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] bg-emerald-500/15'
                          : 'border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-slate-900/80'
                      }`}
                    >
                      <div className="absolute inset-3 rounded-full border-2 border-amber-300/40 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-0.5 bg-amber-400/30 absolute" />
                        <div className="h-full w-0.5 bg-amber-400/30 absolute" />
                        <div className="w-full h-0.5 bg-amber-400/30 rotate-45 absolute" />
                        <div className="w-full h-0.5 bg-amber-400/30 -rotate-45 absolute" />
                      </div>

                      <div className="p-3 sm:p-4 rounded-2xl bg-black/80 border border-amber-500/50 shadow-inner z-10">
                        <Sparkles
                          className={`w-7 h-7 sm:w-9 sm:h-9 transition-transform ${
                            isDrumSpinning ? 'text-amber-300 animate-pulse scale-125' : 'text-amber-400'
                          }`}
                        />
                      </div>

                      {/* Flying Tickets Badges When Spinning */}
                      {isDrumSpinning && (
                        <>
                          <span className="absolute -top-2 left-4 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] shadow animate-bounce">
                            🎟️ #{Math.floor(Math.random() * (drumRaffle.totalTickets || 100)) + 1}
                          </span>
                          <span className="absolute bottom-1 right-2 px-2 py-0.5 rounded bg-orange-400 text-slate-950 font-black text-[10px] shadow animate-pulse">
                            🎟️ #{Math.floor(Math.random() * (drumRaffle.totalTickets || 100)) + 1}
                          </span>
                          <span className="absolute top-1/2 -left-3 -translate-y-1/2 px-2 py-0.5 rounded bg-yellow-300 text-slate-950 font-black text-[10px] shadow">
                            🎟️ #{Math.floor(Math.random() * (drumRaffle.totalTickets || 100)) + 1}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Ticker Ribbon */}
                  {isDrumSpinning && (
                    <div className="w-full max-w-lg overflow-hidden py-1 mb-2">
                      <div className="flex items-center justify-center space-x-3 text-xs font-mono font-black text-amber-300/80 animate-pulse tracking-widest select-none">
                        <span>{`<<`}</span>
                        <span>BOLETO {displayTicketCode}</span>
                        <span>•</span>
                        <span>REVOLVIENDO {drumEligibleCount} BOLETOS</span>
                        <span>•</span>
                        <span>{`>>`}</span>
                      </div>
                    </div>
                  )}

                  {/* Giant Ticket Number Box */}
                  <div
                    className={`font-black font-mono tracking-widest px-8 sm:px-14 md:px-20 py-3 sm:py-5 rounded-3xl transition-all duration-300 select-none shadow-2xl ${
                      isDrumFullscreen
                        ? 'text-6xl sm:text-8xl md:text-9xl lg:text-[110px]'
                        : 'text-5xl sm:text-7xl md:text-8xl'
                    } ${
                      isDrumSpinning
                        ? 'scale-105 text-amber-300 bg-black/80 border-2 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.6)] animate-pulse'
                        : drumCandidateWinner
                        ? 'scale-105 text-emerald-300 bg-black/90 border-4 border-emerald-400 shadow-[0_0_60px_rgba(16,185,129,0.6)]'
                        : 'text-slate-400 bg-slate-900/90 border border-slate-800 shadow-inner'
                    }`}
                  >
                    {displayTicketCode}
                  </div>

                  {/* Candidate Winner Celebration Card */}
                  {drumCandidateWinner && (
                    <div className="animate-scaleUp space-y-2 sm:space-y-3 p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/25 to-amber-500/20 border-2 border-emerald-400 w-full max-w-xl shadow-2xl mt-3">
                      <div className="flex items-center justify-center space-x-2 text-amber-300 font-black text-xs sm:text-sm">
                        <PartyPopper className="w-5 h-5 text-amber-400" />
                        <span>¡NÚMERO EXTRAÍDO DE LA TÓMBOLA!</span>
                        <PartyPopper className="w-5 h-5 text-amber-400" />
                      </div>

                      <div className="bg-black/60 rounded-xl p-3 border border-emerald-500/40 text-center">
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 block">
                          Boleto {drumCandidateWinner.ticketCode}
                        </span>
                        <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white drop-shadow my-1">
                          {drumCandidateWinner.buyerName || 'Participante'}
                        </h3>
                        {drumCandidateWinner.buyerPhone && (
                          <div className="flex items-center justify-center space-x-3 text-xs sm:text-sm mt-1">
                            <span className="text-slate-300 flex items-center space-x-1">
                              <Phone className="w-4 h-4 text-amber-400" />
                              <span>{drumCandidateWinner.buyerPhone}</span>
                            </span>
                            <a
                              href={`https://api.whatsapp.com/send?phone=${drumCandidateWinner.buyerPhone.replace(/\D/g, '')}&text=${encodeURIComponent(
                                `¡Hola ${drumCandidateWinner.buyerName}! Tu boleto ${drumCandidateWinner.ticketCode} acaba de salir en el sorteo «${drumRaffle.title}». ¡Preséntate para reclamar tu premio!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow"
                            >
                              Enviar WhatsApp
                            </a>
                          </div>
                        )}
                        <p className="text-[11px] text-emerald-300 font-bold mt-1">
                          Estado del Boleto: {drumCandidateWinner.status === 'sold' ? 'Pagado & Confirmado ✅' : 'Registrado'}
                        </p>
                      </div>

                      {/* Decision buttons */}
                      {!showDisqualifyPrompt ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {isAdminOrLeader && (
                            <button
                              type="button"
                              onClick={handleConfirmWinner}
                              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                            >
                              <Trophy className="w-4 h-4 text-amber-300" />
                              <span>¡Sí está presente! Confirmar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setShowDisqualifyPrompt(true)}
                            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                          >
                            <Ban className="w-4 h-4" />
                            <span>No se presentó (Excluir)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReSpinWithoutExcluding(true)}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-black text-xs flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 transition-all"
                            title="Girar de nuevo manteniendo el boleto en la tómbola"
                          >
                            <RefreshCw className="w-4 h-4 text-blue-400" />
                            <span>Girar sin excluir</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-600 space-y-2.5 text-left animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-rose-200 uppercase tracking-wider flex items-center space-x-1.5">
                              <UserX className="w-4 h-4 text-rose-400" />
                              <span>Excluir Boleto {drumCandidateWinner.ticketCode} ({drumCandidateWinner.buyerName || 'Participante'})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowDisqualifyPrompt(false)}
                              className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900/50 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <select
                            value={disqualifyReason}
                            onChange={(e) => setDisqualifyReason(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 border border-rose-700 text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="No se presentó al llamado">No se presentó al 3er llamado en la sala</option>
                            <option value="No contestó la llamada ni WhatsApp">No contestó llamada telefónica ni mensaje</option>
                            <option value="Ausente del evento">Ausente del evento</option>
                            <option value="Boleto no califica por condición de sorteo">Boleto no califica por condición del sorteo</option>
                            <option value="Descalificado por tiempo límite vencido">Descalificado por tiempo límite vencido</option>
                          </select>
                          <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleDisqualifyCandidate(true)}
                              className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>🚫 Excluir y Volver a Sortear AHORA</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDisqualifyCandidate(false)}
                              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                            >
                              Solo Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Spin Button */}
                {!drumCandidateWinner && (
                  <div className="flex items-center justify-center pt-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSpinDrum()}
                      disabled={isDrumSpinning}
                      className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/30 transition-all flex items-center justify-center space-x-2.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Sparkles className={`w-5 h-5 ${isDrumSpinning ? 'animate-spin' : ''}`} />
                      <span>{isDrumSpinning ? 'Girando la Tómbola...' : '¡GIRAR TÓMBOLA AHORA!'}</span>
                    </button>
                  </div>
                )}

                {/* Bottom Prizes Status Strip */}
                <div className="pt-2 border-t border-slate-800 text-left shrink-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {drumRaffle.prizes.map((prz) => (
                      <div
                        key={prz.id}
                        onClick={() => {
                          if (!isDrumSpinning) {
                            setSelectedPrizeId(prz.id);
                            setDrumCandidateWinner(null);
                            setDisplayTicketCode('???');
                            setDisplayTicketNumber(null);
                          }
                        }}
                        className={`p-2 rounded-xl text-xs border flex items-center space-x-2 cursor-pointer transition-all ${
                          prz.winnerTicketNumber
                            ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                            : prz.id === selectedPrizeId
                            ? 'bg-amber-950/50 border-amber-500 text-amber-200 ring-2 ring-amber-400 scale-[1.02]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {prz.imageUrl ? (
                          <img
                            src={prz.imageUrl}
                            alt={prz.name}
                            className="w-8 h-8 rounded-lg object-cover border border-amber-500/40 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                            {prz.place}º
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold truncate text-white text-[11px]">{prz.name}</p>
                          <span className="text-[10px] text-slate-400">
                            {prz.winnerTicketNumber ? `🏆 Boleto #${prz.winnerTicketNumber}` : '⏳ Por sortear'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* View B: drumProjectorTab === 'wall' (Wall of Tickets for Projector) */
              <div className="flex-1 min-h-0 flex flex-col justify-between py-2 space-y-3 text-left overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shrink-0">
                  <div className="flex items-center space-x-2 flex-1 max-w-md">
                    <Search className="w-4 h-4 text-amber-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar por número (#042), código o nombre..."
                      value={wallSearchQuery}
                      onChange={(e) => setWallSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    {wallSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setWallSearchQuery('')}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setWallFilterStatus('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        wallFilterStatus === 'all'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos ({drumRaffle.tickets.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallFilterStatus('sold')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        wallFilterStatus === 'sold'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-emerald-400 hover:text-white'
                      }`}
                    >
                      Pagados ({(drumRaffle.tickets || []).filter((t) => t.status === 'sold').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallFilterStatus('available')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        wallFilterStatus === 'available'
                          ? 'bg-blue-500 text-white shadow'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Disponibles ({(drumRaffle.tickets || []).filter((t) => t.status === 'available').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallFilterStatus('winner')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        wallFilterStatus === 'winner'
                          ? 'bg-amber-400 text-slate-950 shadow'
                          : 'bg-slate-800 text-amber-300 hover:text-white'
                      }`}
                    >
                      Ganadores ({drumRaffle.prizes.filter((p) => Boolean(p.winnerTicketNumber)).length})
                    </button>
                  </div>
                </div>

                {/* Tickets Grid for Audience Screen */}
                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                    {filteredWallTickets.map((t) => {
                      const prizeWon = drumRaffle.prizes.find((p) => p.winnerTicketNumber === t.number);
                      return (
                        <div
                          key={t.number}
                          className={`p-2 rounded-xl text-center border transition-all select-none relative ${
                            prizeWon
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400 shadow-lg shadow-amber-500/20'
                              : t.status === 'sold'
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400'
                          }`}
                        >
                          {prizeWon && (
                            <div className="absolute -top-2 -right-1 text-sm">
                              🏆
                            </div>
                          )}
                          <span className="block font-black font-mono text-sm sm:text-base text-white">
                            {t.ticketCode}
                          </span>
                          <span className="block text-[10px] truncate text-slate-300 mt-0.5">
                            {t.buyerName || (t.status === 'sold' ? 'Pagado' : 'Disponible')}
                          </span>
                          {prizeWon && (
                            <span className="block text-[9px] font-black text-amber-300 truncate">
                              {prizeWon.place}º Lugar
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return to Tombola Button */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setDrumProjectorTab('drum')}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-amber-500/30"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Volver a la Tómbola para Girar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TABLERO INTERACTIVO DE BOLETOS NUMERADOS (TICKET GRID)           */}
      {/* ========================================================================= */}
      {ticketGridRaffle && (
        <div
          className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center ${
            isGridFullscreen ? 'p-0 w-screen h-screen' : 'p-3 sm:p-4 overflow-y-auto'
          } animate-fadeIn`}
        >
          <div
            className={`${
              isGridFullscreen
                ? 'w-full h-full rounded-none border-none max-w-none flex flex-col justify-between p-4 sm:p-6 overflow-y-auto'
                : 'rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 max-w-5xl w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto'
            } bg-white dark:bg-slate-900`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                    Tablero de Boletos: {ticketGridRaffle.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span>Total: <strong>{ticketGridRaffle.totalTickets}</strong> boletos</span>
                    <span>•</span>
                    <span>
                      Valor: <strong>{ticketGridRaffle.ticketPrice === 0 ? 'Gratis' : `${ticketGridRaffle.currency}${ticketGridRaffle.ticketPrice}`}</strong>
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {ticketGridRaffle.tickets.filter((t) => t.status === 'sold').length} Pagados
                    </span>
                    {ticketGridRaffle.prizes.filter((p) => Boolean(p.winnerTicketNumber)).length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-amber-600 dark:text-amber-400 font-black flex items-center space-x-1">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{ticketGridRaffle.prizes.filter((p) => Boolean(p.winnerTicketNumber)).length} Premiados</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewPrizesRaffle(ticketGridRaffle)}
                  className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700/60 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
                  title="Ver qué premios y fotos se sortean"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>¿Qué se sortea? ({ticketGridRaffle.prizes.length})</span>
                </button>

                {isAdminOrLeader && (
                  <button
                    type="button"
                    onClick={() => setRangeAssignOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 hover:bg-purple-200 text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Asignar Rango</span>
                  </button>
                )}
                {/* Fullscreen toggle */}
                <button
                  type="button"
                  onClick={() => setIsGridFullscreen(!isGridFullscreen)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  title={isGridFullscreen ? 'Salir de pantalla completa' : 'Pantalla Completa'}
                >
                  {isGridFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setTicketGridRaffle(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Legend & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTicketFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    ticketFilter === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Todos ({ticketGridRaffle.tickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('available')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketFilter === 'available'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>
                    Disponibles ({ticketGridRaffle.tickets.filter((t) => t.status === 'available').length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('reserved')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketFilter === 'reserved'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>
                    Apartados ({ticketGridRaffle.tickets.filter((t) => t.status === 'reserved').length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter('sold')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    ticketFilter === 'sold'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>
                    Pagados ({ticketGridRaffle.tickets.filter((t) => t.status === 'sold').length})
                  </span>
                </button>
                {/* Winners Tab Filter */}
                <button
                  type="button"
                  onClick={() => setTicketFilter('winners')}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                    ticketFilter === 'winners'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    Ganadores ({ticketGridRaffle.tickets.filter((t) => t.isWinner || ticketGridRaffle.prizes.some((p) => p.winnerTicketNumber === t.number)).length})
                  </span>
                </button>

                {/* Excluded / Absent Tab Filter */}
                <button
                  type="button"
                  onClick={() => setTicketFilter('excluded')}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 ${
                    ticketFilter === 'excluded'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                  }`}
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>
                    Excluidos ({ticketGridRaffle.tickets.filter((t) => t.isExcluded).length})
                  </span>
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  placeholder="Nº o comprador..."
                  className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* TICKET NUMBERS GRID */}
            <div
              className={`grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2 overflow-y-auto p-2 ${
                isGridFullscreen ? 'flex-1 max-h-none' : 'max-h-[54vh]'
              }`}
            >
              {ticketGridRaffle.tickets
                .filter((t) => {
                  const isWinningTicket = Boolean(
                    t.isWinner ||
                    ticketGridRaffle.prizes.some((p) => p.winnerTicketNumber === t.number)
                  );
                  if (ticketFilter === 'winners' && !isWinningTicket) return false;
                  if (ticketFilter === 'excluded' && !t.isExcluded) return false;
                  if (ticketFilter === 'available' && t.status !== 'available') return false;
                  if (ticketFilter === 'reserved' && t.status !== 'reserved') return false;
                  if (ticketFilter === 'sold' && t.status !== 'sold') return false;
                  if (ticketSearch.trim()) {
                    const q = ticketSearch.toLowerCase();
                    const matchNum = String(t.number).includes(q) || t.ticketCode.toLowerCase().includes(q);
                    const matchName = (t.buyerName || '').toLowerCase().includes(q);
                    if (!matchNum && !matchName) return false;
                  }
                  return true;
                })
                .map((ticket) => {
                  // Check if this ticket is a declared winner for any prize
                  const wonPrize = ticketGridRaffle.prizes.find(
                    (p) => p.winnerTicketNumber === ticket.number
                  );
                  const isWinningTicket = Boolean(ticket.isWinner || wonPrize);
                  const isExcludedTicket = Boolean(ticket.isExcluded);

                  let bgClass = 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 border-slate-200 text-slate-700';
                  if (isWinningTicket) {
                    bgClass =
                      'bg-gradient-to-br from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black border-2 border-amber-400 shadow-md shadow-amber-500/30 ring-2 ring-amber-300 scale-105';
                  } else if (isExcludedTicket) {
                    bgClass =
                      'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-2 border-rose-400/80 shadow-sm opacity-90 line-through';
                  } else if (ticket.status === 'sold') {
                    bgClass =
                      'bg-blue-600 hover:bg-blue-700 text-white font-bold border-blue-500 shadow-sm';
                  } else if (ticket.status === 'reserved') {
                    bgClass =
                      'bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm';
                  } else {
                    bgClass =
                      'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/60';
                  }

                  return (
                    <button
                      key={ticket.number}
                      type="button"
                      onClick={() => handleOpenTicketModal(ticketGridRaffle.id, ticket)}
                      className={`p-2.5 rounded-2xl border transition-all flex flex-col items-center justify-center cursor-pointer active:scale-95 group relative ${bgClass}`}
                      title={
                        isWinningTicket
                          ? `🏆 Boleto ${ticket.ticketCode} - Ganador de: ${wonPrize?.name || ticket.wonPrizeName || 'Premio'} (${ticket.buyerName})`
                          : isExcludedTicket
                          ? `🚫 Boleto ${ticket.ticketCode} - Excluido / Ausente (${ticket.exclusionReason || 'No se presentó'})`
                          : ticket.buyerName
                          ? `${ticket.ticketCode} - ${ticket.buyerName} (${ticket.status})`
                          : `${ticket.ticketCode} - Disponible`
                      }
                    >
                      {isWinningTicket ? (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-950 text-amber-300 flex items-center justify-center text-[10px] shadow border border-amber-400">
                          👑
                        </div>
                      ) : isExcludedTicket ? (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] shadow border border-white">
                          🚫
                        </div>
                      ) : null}
                      <span className="text-xs font-black tracking-tight">{ticket.ticketCode}</span>
                      <span className="text-[9px] truncate max-w-[62px] opacity-90">
                        {isWinningTicket
                          ? `${wonPrize ? `${wonPrize.place}º Lugar` : 'Ganador'}`
                          : isExcludedTicket
                          ? 'Ausente'
                          : ticket.buyerName
                          ? ticket.buyerName.split(' ')[0]
                          : 'Libre'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COMPRAR / RESERVAR / GESTIONAR BOLETO INDIVIDUAL                 */}
      {/* ========================================================================= */}
      {selectedTicket && ticketGridRaffle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black text-sm flex items-center justify-center">
                  {selectedTicket.ticket.ticketCode}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Gestionar Boleto {selectedTicket.ticket.ticketCode}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {ticketGridRaffle.ticketPrice === 0
                      ? 'Inscripción Gratuita'
                      : `Precio: ${ticketGridRaffle.currency}${ticketGridRaffle.ticketPrice}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Completo del Comprador / Participante *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={buyerForm.buyerName}
                    onChange={(e) => setBuyerForm({ ...buyerForm, buyerName: e.target.value })}
                    placeholder="Ej. Hno. Carlos Rodríguez"
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={buyerForm.buyerPhone}
                      onChange={(e) => setBuyerForm({ ...buyerForm, buyerPhone: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={buyerForm.paymentMethod}
                    onChange={(e) => setBuyerForm({ ...buyerForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Pago Móvil">Pago Móvil</option>
                    <option value="Tarjeta">Tarjeta / Online</option>
                    <option value="Gratis">Gratis</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas u Observaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={buyerForm.buyerNotes}
                  onChange={(e) => setBuyerForm({ ...buyerForm, buyerNotes: e.target.value })}
                  placeholder="Ej. Entregado en mano en el culto domingo"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Status Toggle (Paid vs Reserved) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    ¿Marcar como Boleto Pagado y Confirmado?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {buyerForm.markAsPaid
                      ? 'Boleto entra como confirmado oficial.'
                      : 'Quedará como apartado temporal pendiente de pago.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={buyerForm.markAsPaid}
                  onChange={(e) => setBuyerForm({ ...buyerForm, markAsPaid: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Exclusion / Absent Toggle */}
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center space-x-1.5">
                      <UserX className="w-3.5 h-3.5 text-rose-500" />
                      <span>¿Excluir / Descalificar de la tómbola?</span>
                    </p>
                    <p className="text-[11px] text-rose-600 dark:text-rose-400">
                      Si se marca, este boleto quedará bloqueado y no saldrá en el sorteo (para ausentes o descalificados).
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={buyerForm.isExcluded}
                    onChange={(e) => setBuyerForm({ ...buyerForm, isExcluded: e.target.checked })}
                    className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                </div>

                {buyerForm.isExcluded && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1">
                      Motivo de la exclusión:
                    </label>
                    <input
                      type="text"
                      value={buyerForm.exclusionReason}
                      onChange={(e) => setBuyerForm({ ...buyerForm, exclusionReason: e.target.value })}
                      placeholder="Ej. No se presentó al llamado en el evento"
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveTicket}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition-all flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{buyerForm.markAsPaid ? 'Guardar Venta Confirmada' : 'Guardar Apartado / Reserva'}</span>
              </button>

              {selectedTicket.ticket.buyerName && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleShareWhatsAppTicket(ticketGridRaffle, selectedTicket.ticket)}
                    className="py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-all flex items-center justify-center space-x-1"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReleaseTicket}
                    className="py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-all flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Liberar Boleto</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ASIGNACIÓN MASIVA DE RANGOS DE BOLETOS                           */}
      {/* ========================================================================= */}
      {rangeAssignOpen && ticketGridRaffle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-purple-600" />
                <span>Asignar Rango de Boletos</span>
              </h3>
              <button
                type="button"
                onClick={() => setRangeAssignOpen(false)}
                className="p-1 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número Desde
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={ticketGridRaffle.totalTickets}
                    value={rangeStart}
                    onChange={(e) => setRangeStart(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número Hasta
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={ticketGridRaffle.totalTickets}
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre o Familia Responsable *
                </label>
                <input
                  type="text"
                  value={rangeBuyer}
                  onChange={(e) => setRangeBuyer(e.target.value)}
                  placeholder="Ej. Familia Gómez / Grupo Juvenil"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  value={rangePhone}
                  onChange={(e) => setRangePhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chk-range-paid"
                  checked={rangeMarkPaid}
                  onChange={(e) => setRangeMarkPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="chk-range-paid" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Marcar de una vez como pagados
                </label>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleExecuteRangeAssign}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
              >
                Confirmar Asignación de Rango
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONSULTAR MI BOLETO (MIEMBROS / CONGREGANTES)                    */}
      {/* ========================================================================= */}
      {lookupModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Consultar Mis Boletos de Sorteo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ingresa tu nombre o número de teléfono para verificar tus números.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLookupModalOpen(false)}
                className="p-1 rounded-xl text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={lookupQuery}
                onChange={(e) => setLookupQuery(e.target.value)}
                placeholder="Ingresa tu nombre o teléfono..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Results list */}
            <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
              {(() => {
                if (!lookupQuery.trim()) {
                  return (
                    <p className="text-xs text-slate-400 text-center py-6">
                      Escribe tu nombre o celular arriba para ver tus boletos registrados.
                    </p>
                  );
                }

                const q = lookupQuery.toLowerCase();
                const matched: { raffle: RaffleItem; ticket: RaffleTicket }[] = [];

                raffles.forEach((r) => {
                  (r.tickets || []).forEach((t) => {
                    const matchName = (t.buyerName || '').toLowerCase().includes(q);
                    const matchPhone = (t.buyerPhone || '').toLowerCase().includes(q);
                    const matchCode = t.ticketCode.toLowerCase() === q;
                    if (matchName || matchPhone || matchCode) {
                      matched.push({ raffle: r, ticket: t });
                    }
                  });
                });

                if (matched.length === 0) {
                  return (
                    <p className="text-xs text-amber-600 dark:text-amber-400 text-center py-6">
                      No encontramos ningún boleto registrado con «{lookupQuery}».
                    </p>
                  );
                }

                return matched.map(({ raffle, ticket }) => {
                  const wonPrize = raffle.prizes.find((p) => p.winnerTicketNumber === ticket.number);
                  return (
                    <div
                      key={`${raffle.id}_${ticket.number}`}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center">
                          {ticket.ticketCode}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">
                            {raffle.title}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            A nombre de: <strong>{ticket.buyerName}</strong>
                          </p>
                          {wonPrize && (
                            <p className="text-[11px] font-black text-amber-600 dark:text-amber-400">
                              🎉 ¡Ganador del {wonPrize.place}º Premio: {wonPrize.name}!
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          ticket.status === 'sold'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {ticket.status === 'sold' ? 'Pagado' : 'Apartado'}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CREAR / EDITAR SORTEO (COMPREHENSIVE INTUITIVE CREATOR)          */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {editingRaffle ? 'Editar Sorteo Eclesial' : 'Crear Nuevo Sorteo Pro-Fondos'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configura los boletos, lista de premios con fotos, fecha del sorteo y precio.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Template Picker (Only for new raffles) */}
            {!editingRaffle && (
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Plantillas Rápidas con Premios y Boletos Listos:</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {DEFAULT_RAFFLE_TEMPLATES.map((tpl, idx) => (
                    <button
                      key={tpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(idx)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/80 dark:border-slate-700 hover:border-amber-500 text-left transition-all"
                    >
                      <p className="text-xs font-black truncate text-slate-900 dark:text-white">{tpl.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {tpl.totalTickets} boletos · {tpl.ticketPrice === 0 ? 'Gratis' : `$${tpl.ticketPrice}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveRaffleForm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título del Sorteo o Rifa *
                </label>
                <input
                  type="text"
                  value={newRaffleForm.title}
                  onChange={(e) => setNewRaffleForm({ ...newRaffleForm, title: e.target.value })}
                  placeholder="Ej. Gran Sorteo Pro-Construcción del Santuario"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Categoría del Sorteo
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal()}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Administrar todas las categorías"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Gestionar todas</span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="relative flex-1">
                      <select
                        value={newRaffleForm.category}
                        onChange={(e) => setNewRaffleForm({ ...newRaffleForm, category: e.target.value })}
                        className="w-full pl-3.5 pr-8 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-amber-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name} {cat.description ? `(${cat.description})` : ''}
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const selectedCat = categories.find((c) => c.name === newRaffleForm.category);
                        if (!selectedCat) return null;
                        return (
                          <span
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none shadow-sm"
                            style={{ backgroundColor: selectedCat.color || '#f59e0b' }}
                            title={`Color: ${selectedCat.name}`}
                          />
                        );
                      })()}
                    </div>

                    {/* Botón 1: Crear Categoría */}
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal()}
                      className="px-2.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-sm shadow-amber-500/20"
                      title="Crear nueva categoría"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nueva</span>
                    </button>

                    {/* Botón 2: Editar Categoría Seleccionada */}
                    {(() => {
                      const selectedCat = categories.find((c) => c.name === newRaffleForm.category);
                      return (
                        <button
                          type="button"
                          disabled={!selectedCat}
                          onClick={() => selectedCat && handleOpenCategoryModal(selectedCat)}
                          className="px-2.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-40"
                          title="Editar categoría seleccionada"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="hidden sm:inline">Editar</span>
                        </button>
                      );
                    })()}

                    {/* Botón 3: Eliminar Categoría Seleccionada */}
                    {(() => {
                      const selectedCat = categories.find((c) => c.name === newRaffleForm.category);
                      return (
                        <button
                          type="button"
                          disabled={!selectedCat || categories.length <= 1}
                          onClick={() => selectedCat && handleRequestDeleteCategory(selectedCat)}
                          className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-bold transition-all flex items-center shrink-0 cursor-pointer disabled:opacity-40"
                          title="Eliminar categoría seleccionada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      );
                    })()}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha y Hora Programada del Sorteo
                  </label>
                  <input
                    type="datetime-local"
                    value={newRaffleForm.drawDate}
                    onChange={(e) => setNewRaffleForm({ ...newRaffleForm, drawDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Causa del Sorteo
                </label>
                <textarea
                  rows={2}
                  value={newRaffleForm.description}
                  onChange={(e) => setNewRaffleForm({ ...newRaffleForm, description: e.target.value })}
                  placeholder="Explica a la congregación a qué fondo o proyecto se destinarán los recursos..."
                  className="w-full px-3.5 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* FOTO / PORTADA PRINCIPAL DEL SORTEO (¿Qué se sortea?) */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Foto / Portada Principal del Sorteo</span>
                  </h4>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                    Muestra a la congregación qué se sortea
                  </span>
                </div>

                {/* Banner preview if set */}
                {newRaffleForm.bannerImageUrl && (
                  <div className="relative h-36 rounded-2xl overflow-hidden border border-amber-300 dark:border-amber-700 group shadow-inner">
                    <img
                      src={newRaffleForm.bannerImageUrl}
                      alt="Portada Sorteo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setNewRaffleForm({ ...newRaffleForm, bannerImageUrl: '' })}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center space-x-1 shadow cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar Imagen</span>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-dashed border-amber-300 dark:border-amber-700 hover:border-amber-500 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-amber-600" />
                    <span>Subir Foto (Celular / PC)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadRaffleBanner}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-[2]">
                    <input
                      type="url"
                      value={newRaffleForm.bannerImageUrl}
                      onChange={(e) => setNewRaffleForm({ ...newRaffleForm, bannerImageUrl: e.target.value })}
                      placeholder="O pegar URL de foto web (https://...)"
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Preset quick buttons */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    O selecciona una foto rápida de muestra:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PRIZE_IMAGES.map((pst, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewRaffleForm({ ...newRaffleForm, bannerImageUrl: pst.url })}
                        className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center space-x-1 transition-all cursor-pointer"
                      >
                        <span>{pst.icon}</span>
                        <span>{pst.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* TICKET CONFIG */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Ticket className="w-4 h-4 text-amber-500" />
                  <span>Configuración de los Boletos</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">Precio del Boleto ($)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={newRaffleForm.ticketPrice}
                      onChange={(e) => setNewRaffleForm({ ...newRaffleForm, ticketPrice: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">0 = Sorteo Gratis</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">Moneda</label>
                    <select
                      value={newRaffleForm.currency}
                      onChange={(e) => setNewRaffleForm({ ...newRaffleForm, currency: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                      <option value="L">L (Lempira Hondureño - HNL)</option>
                      <option value="$">$ (USD / Dólares)</option>
                      <option value="€">€ (Euros)</option>
                      <option value="MXN">MXN ($ Pesos Mexicanos)</option>
                      <option value="COP">COP ($ Pesos Colombianos)</option>
                      <option value="PEN">PEN (S/ Soles Peruanos)</option>
                      <option value="GTQ">Q (Quetzales Guatemaltecos)</option>
                      <option value="CRC">₡ (Colones Costarricenses)</option>
                      <option value="Bs">Bs (Bolívares)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500">Cantidad Total de Boletos</label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      disabled={Boolean(editingRaffle)}
                      value={newRaffleForm.totalTickets}
                      onChange={(e) => setNewRaffleForm({ ...newRaffleForm, totalTickets: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Ej. 50, 100, 200...</span>
                  </div>
                </div>
              </div>

              {/* PRIZES LIST BUILDER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Lista de Premios ({newRaffleForm.prizes.length})</span>
                  </h4>

                  <button
                    type="button"
                    onClick={() => {
                      const nextPlace = newRaffleForm.prizes.length + 1;
                      setNewRaffleForm({
                        ...newRaffleForm,
                        prizes: [
                          ...newRaffleForm.prizes,
                          {
                            place: nextPlace,
                            name: `Premio ${nextPlace}º Lugar`,
                            description: '',
                            valueEstimated: 50,
                          },
                        ],
                      });
                    }}
                    className="px-2.5 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-200 transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Premio</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {newRaffleForm.prizes.map((prz, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5"
                    >
                      {/* Top row: Place, Name, Estimated Value, Delete */}
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {pIdx + 1}º
                        </div>
                        <input
                          type="text"
                          value={prz.name}
                          onChange={(e) => {
                            const updated = [...newRaffleForm.prizes];
                            updated[pIdx].name = e.target.value;
                            setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                          }}
                          placeholder={`Nombre del premio ${pIdx + 1}º (ej. Smart TV 55", Bicicleta...)`}
                          className="flex-1 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          required
                        />
                        <div className="flex items-center space-x-1 shrink-0">
                          <span className="text-[11px] font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            min={0}
                            value={prz.valueEstimated || ''}
                            onChange={(e) => {
                              const updated = [...newRaffleForm.prizes];
                              updated[pIdx].valueEstimated = Number(e.target.value);
                              setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                            }}
                            placeholder="Valor est."
                            className="w-20 px-2 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          />
                        </div>
                        {newRaffleForm.prizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = newRaffleForm.prizes.filter((_, idx) => idx !== pIdx);
                              setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                            }}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-950/50 cursor-pointer"
                            title="Eliminar este premio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Middle row: Description */}
                      <input
                        type="text"
                        value={prz.description || ''}
                        onChange={(e) => {
                          const updated = [...newRaffleForm.prizes];
                          updated[pIdx].description = e.target.value;
                          setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                        }}
                        placeholder="Descripción opcional (marca, modelo, características, condiciones...)"
                        className="w-full px-3 py-1 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                      />

                      {/* Bottom row: Prize Image upload & preview */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        {/* Image preview thumbnail */}
                        {prz.imageUrl ? (
                          <div className="flex items-center space-x-2 shrink-0">
                            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-amber-400 shadow-sm shrink-0">
                              <img
                                src={prz.imageUrl}
                                alt={prz.name}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...newRaffleForm.prizes];
                                updated[pIdx].imageUrl = undefined;
                                setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                              }}
                              className="text-[10px] text-rose-500 hover:underline font-bold"
                            >
                              Quitar foto
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center space-x-1 shrink-0">
                            <Camera className="w-3.5 h-3.5" />
                            <span>Foto del Premio:</span>
                          </span>
                        )}

                        {/* File upload input button */}
                        <label className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shrink-0">
                          <Upload className="w-3 h-3 text-amber-600" />
                          <span>{prz.imageUrl ? 'Cambiar Foto' : 'Subir Foto'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadPrizeImage(pIdx, e)}
                            className="hidden"
                          />
                        </label>

                        {/* URL input */}
                        <input
                          type="url"
                          value={prz.imageUrl || ''}
                          onChange={(e) => {
                            const updated = [...newRaffleForm.prizes];
                            updated[pIdx].imageUrl = e.target.value;
                            setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                          }}
                          placeholder="o pegar URL de foto..."
                          className="flex-1 px-2.5 py-1 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        />

                        {/* Quick preset selector dropdown */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const updated = [...newRaffleForm.prizes];
                              updated[pIdx].imageUrl = e.target.value;
                              setNewRaffleForm({ ...newRaffleForm, prizes: updated });
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="px-2 py-1 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <option value="" disabled>
                            Fotos de muestra...
                          </option>
                          {PRESET_PRIZE_IMAGES.map((pst, pI) => (
                            <option key={pI} value={pst.url}>
                              {pst.icon} {pst.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* REGLAS & POLÍTICA DE GANADORES (PREVENIR REPETIDOS) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2.5">
                <div className="flex items-center space-x-1.5 text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Control de Ganadores y Reglas de la Tómbola</span>
                </div>

                <div className="space-y-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRaffleForm.preventRepeatWinners}
                      onChange={(e) =>
                        setNewRaffleForm({ ...newRaffleForm, preventRepeatWinners: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        No repetir boletos ya premiados (Recomendado)
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Los boletos que ya salieron ganadores en un premio no podrán volver a ganar otro premio en este sorteo.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newRaffleForm.preventRepeatBuyers}
                      onChange={(e) =>
                        setNewRaffleForm({ ...newRaffleForm, preventRepeatBuyers: e.target.checked })
                      }
                      className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        Limitar a 1 premio por persona / comprador
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Si una misma persona compró varios boletos y ya ganó un premio, sus demás boletos quedarán exentos de los siguientes premios.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {editingRaffle ? 'Actualizar Sorteo' : 'Crear y Generar Boletos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 7: GALERÍA DE PREMIOS CON FOTOS (¿QUÉ SE ESTÁ SORTEANDO?)           */}
      {/* ========================================================================= */}
      {viewPrizesRaffle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Cover Banner if available */}
            {viewPrizesRaffle.bannerImageUrl && (
              <div className="relative h-44 sm:h-56 w-full shrink-0 overflow-hidden bg-slate-950">
                <img
                  src={viewPrizesRaffle.bannerImageUrl}
                  alt={viewPrizesRaffle.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute top-3 right-3">
                  <button
                    type="button"
                    onClick={() => setViewPrizesRaffle(null)}
                    className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider mb-1 inline-block">
                    {viewPrizesRaffle.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black leading-tight drop-shadow">
                    {viewPrizesRaffle.title}
                  </h3>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    Precios: {viewPrizesRaffle.ticketPrice === 0 ? 'Entrada Libre' : `${viewPrizesRaffle.currency}${viewPrizesRaffle.ticketPrice} por boleto`}
                  </p>
                </div>
              </div>
            )}

            {/* Modal Header if no banner */}
            {!viewPrizesRaffle.bannerImageUrl && (
              <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                      ¿Qué se está sorteando?
                    </h3>
                    <p className="text-xs text-slate-500">{viewPrizesRaffle.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewPrizesRaffle(null)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Content list of prizes with pictures */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Catálogo de Premios Oficiales ({viewPrizesRaffle.prizes.length})</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Toca cualquier foto para ampliarla y verla en pantalla completa.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {viewPrizesRaffle.prizes.map((prize) => {
                  const hasWinner = Boolean(prize.winnerTicketNumber);
                  return (
                    <div
                      key={prize.id}
                      className={`rounded-2xl border overflow-hidden flex flex-col transition-all ${
                        hasWinner
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:shadow-md'
                      }`}
                    >
                      {/* Prize Image or Placeholder */}
                      <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden group">
                        {prize.imageUrl ? (
                          <>
                            <img
                              src={prize.imageUrl}
                              alt={prize.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              referrerPolicy="no-referrer"
                              onClick={() =>
                                setPreviewZoomImage({
                                  url: prize.imageUrl!,
                                  title: `${prize.place}º Premio: ${prize.name}`,
                                  subtitle:
                                    prize.description ||
                                    (prize.valueEstimated ? `Valor estimado: $${prize.valueEstimated}` : undefined),
                                })
                              }
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setPreviewZoomImage({
                                  url: prize.imageUrl!,
                                  title: `${prize.place}º Premio: ${prize.name}`,
                                  subtitle:
                                    prize.description ||
                                    (prize.valueEstimated ? `Valor estimado: $${prize.valueEstimated}` : undefined),
                                })
                              }
                              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1.5 text-white font-bold text-xs"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ampliar Foto</span>
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800/50 p-4 text-center">
                            <Trophy className="w-8 h-8 text-amber-400 mb-1" />
                            <span className="text-xs font-bold">Premio sin foto adjunta</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {prize.valueEstimated ? `Valor estimado: $${prize.valueEstimated}` : 'Oficial'}
                            </span>
                          </div>
                        )}

                        {/* Place Badge on Image */}
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-xs shadow-md">
                            {prize.place === 1 ? '1º Lugar' : prize.place === 2 ? '2º Lugar' : `${prize.place}º Lugar`}
                          </span>
                        </div>

                        {/* Winner Banner on Image */}
                        {hasWinner && (
                          <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-xl bg-emerald-600/90 text-white text-[11px] font-black backdrop-blur-sm shadow flex items-center justify-between">
                            <span>🎉 ¡Ya fue ganado!</span>
                            <span>Boleto #{prize.winnerTicketNumber}</span>
                          </div>
                        )}
                      </div>

                      {/* Prize Details Card Body */}
                      <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                              {prize.name}
                            </h5>
                            {prize.valueEstimated ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                                Valor: ${prize.valueEstimated}
                              </span>
                            ) : null}
                          </div>

                          {prize.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              {prize.description}
                            </p>
                          )}
                        </div>

                        {hasWinner && (
                          <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 text-xs">
                            <p className="font-extrabold text-amber-800 dark:text-amber-300">
                              Ganador: {prize.winnerBuyerName || `Boleto #${prize.winnerTicketNumber}`}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Raffle Rules & Cause Note */}
              {viewPrizesRaffle.description && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  <p className="font-black text-slate-800 dark:text-white">Propósito de este sorteo:</p>
                  <p>{viewPrizesRaffle.description}</p>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewPrizesRaffle(null)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const r = viewPrizesRaffle;
                    setViewPrizesRaffle(null);
                    setTicketGridRaffle(r);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Ver Boletos y Participar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 9: GESTIÓN DE CATEGORÍAS (CREAR, EDITAR, ELIMINAR Y SINCRONIZAR)     */}
      {/* ========================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
          <div className="relative max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Categorías de Sorteos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crea, edita o elimina las categorías sincronizadas en tiempo real con Firebase.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setCategoryToDelete(null);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* 1. Form to Create or Edit Category */}
              <form
                onSubmit={handleSaveCategory}
                className={`p-4 rounded-2xl border transition-all ${
                  editingCategory
                    ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {editingCategory ? (
                      <Edit3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    )}
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white">
                      {editingCategory ? `Editar Categoría: «${editingCategory.name}»` : 'Crear Nueva Categoría'}
                    </h4>
                  </div>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryFormData({ name: '', description: '', color: '#f59e0b' });
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                    >
                      Cancelar Edición
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Nombre de la Categoría *
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                      placeholder="ej. Jóvenes, Campamento, Navidad, Pro-Misiones..."
                      className="w-full px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Descripción corta (Opcional)
                    </label>
                    <input
                      type="text"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      placeholder="ej. Para actividades del ministerio o recaudaciones específicas"
                      className="w-full px-3 py-2 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      Color Identificador y Vista Previa
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: 'Ámbar', hex: '#f59e0b' },
                        { label: 'Esmeralda', hex: '#10b981' },
                        { label: 'Índigo', hex: '#6366f1' },
                        { label: 'Púrpura', hex: '#8b5cf6' },
                        { label: 'Rosa', hex: '#ec4899' },
                        { label: 'Cielo', hex: '#0ea5e9' },
                        { label: 'Turquesa', hex: '#14b8a6' },
                        { label: 'Rosa Fuerte', hex: '#f43f5e' },
                        { label: 'Lima', hex: '#84cc16' },
                        { label: 'Pizarra', hex: '#64748b' },
                      ].map((preset) => (
                        <button
                          key={preset.hex}
                          type="button"
                          onClick={() => setCategoryFormData({ ...categoryFormData, color: preset.hex })}
                          className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                            categoryFormData.color === preset.hex
                              ? 'border-slate-900 dark:border-white scale-125 shadow-md ring-2 ring-amber-400/40'
                              : 'border-white/50 hover:scale-110'
                          }`}
                          style={{ backgroundColor: preset.hex }}
                          title={preset.label}
                        />
                      ))}
                      <div className="flex items-center space-x-1 pl-1">
                        <input
                          type="color"
                          value={categoryFormData.color}
                          onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                          className="w-7 h-7 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
                          title="Color personalizado"
                        />
                      </div>

                      <div className="ml-auto">
                        <span
                          className="px-3 py-1 rounded-full text-[11px] font-black text-white shadow-sm flex items-center space-x-1"
                          style={{ backgroundColor: categoryFormData.color }}
                        >
                          <Tag className="w-3 h-3 text-white/90" />
                          <span>{categoryFormData.name || 'Vista Previa'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryFormData({ name: '', description: '', color: '#f59e0b' });
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`px-4 py-2 rounded-xl text-white font-bold text-xs flex items-center space-x-1.5 shadow-md transition-all cursor-pointer ${
                        editingCategory
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                          : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                      }`}
                    >
                      {editingCategory ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Guardar Cambios</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          <span>Crear Categoría</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* 2. Delete Confirmation Banner if categoryToDelete is set */}
              {categoryToDelete && (
                <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-3 animate-fadeIn">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-300 shrink-0">
                      <Trash2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-xs font-black text-red-800 dark:text-red-200">
                        ¿Confirmas eliminar la categoría «{categoryToDelete.name}»?
                      </h5>
                      {(() => {
                        const affected = raffles.filter((r) => r.category === categoryToDelete.name);
                        if (affected.length > 0) {
                          return (
                            <div className="space-y-2">
                              <p className="text-xs text-red-700 dark:text-red-300">
                                Hay <strong>{affected.length} sorteo(s)</strong> clasificados en esta categoría.
                                Selecciona a qué categoría deseas reasignarlos antes de continuar:
                              </p>
                              <select
                                value={deleteFallbackCategory}
                                onChange={(e) => setDeleteFallbackCategory(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-xl text-xs font-bold border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              >
                                {categories
                                  .filter((c) => c.id !== categoryToDelete.id)
                                  .map((c) => (
                                    <option key={c.id} value={c.name}>
                                      Reasignar a: {c.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                          );
                        }
                        return (
                          <p className="text-xs text-red-600 dark:text-red-300">
                            No hay ningún sorteo vinculado actualmente a esta categoría. Se eliminará de Firebase de forma segura.
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setCategoryToDelete(null)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDeleteCategory}
                      className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm shadow-red-600/30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Categoría</span>
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Existing Categories List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Categorías Registradas ({categories.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Sincronizado con Firebase
                  </span>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  {categories.map((cat) => {
                    const count = raffles.filter((r) => r.category === cat.name).length;
                    const isBeingEdited = editingCategory?.id === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                          isBeingEdited
                            ? 'bg-amber-50/50 dark:bg-amber-950/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color || '#f59e0b' }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {cat.name}
                              </p>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                                {count} {count === 1 ? 'sorteo' : 'sorteos'}
                              </span>
                            </div>
                            {cat.description && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryModal(cat)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isBeingEdited
                                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title="Editar nombre, color o descripción"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRequestDeleteCategory(cat)}
                            disabled={categories.length <= 1}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              categories.length <= 1
                                ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400'
                                : 'border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 cursor-pointer'
                            }`}
                            title={
                              categories.length <= 1
                                ? 'Debe existir al menos una categoría'
                                : 'Eliminar categoría'
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                Las categorías se actualizan en tiempo real en los filtros y creación de sorteos.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setCategoryToDelete(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 8: ZOOM DE FOTO EN ALTA DEFINICIÓN (LIGHTBOX PREVIEW)                 */}
      {/* ========================================================================= */}
      {previewZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white pb-3">
              <div>
                <h4 className="text-base sm:text-lg font-black">{previewZoomImage.title}</h4>
                {previewZoomImage.subtitle && (
                  <p className="text-xs text-amber-300/90">{previewZoomImage.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="max-h-[75vh] w-full flex items-center justify-center rounded-2xl overflow-hidden border border-white/20 bg-black/50 shadow-2xl">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.title}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>

            <p className="text-slate-400 text-xs text-center mt-3">
              Toca fuera de la imagen o el botón «X» para cerrar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
