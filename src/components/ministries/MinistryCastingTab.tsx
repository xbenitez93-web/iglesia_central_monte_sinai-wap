import React, { useState } from 'react';
import {
  MinistryCastingCall,
  MinistryCastingCandidate,
  MinistryCastingRole,
  ChurchConfig,
  WorshipMusician,
  DanceDancer,
  TheaterActor,
} from '../../types';
import {
  Sparkles,
  Users,
  UserCheck,
  UserPlus,
  Star,
  Calendar,
  Clock,
  MapPin,
  Search,
  Plus,
  Trash2,
  Edit3,
  FileText,
  CheckCircle2,
  AlertCircle,
  Phone,
  Play,
  Share2,
  Award,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Music,
  Theater,
  HelpCircle,
  Video,
  Mic,
  Flag,
} from 'lucide-react';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { YouTubeModal } from '../YouTubeModal';
import { MinistryCastingShareModal } from './MinistryCastingShareModal';

interface MinistryCastingTabProps {
  ministry: 'worship' | 'dance' | 'theater' | string;
  ministryName: string;
  castings: MinistryCastingCall[];
  referenceItems?: { id: string; title: string }[]; // Obra teatral, Canción, Coreografía o Evento vinculado
  pageColor: string;
  config?: ChurchConfig;
  onAddCasting: (casting: Omit<MinistryCastingCall, 'id'>) => void;
  onUpdateCasting: (casting: MinistryCastingCall) => void;
  onDeleteCasting: (id: string) => void;
  onAddMusician?: (musician: Omit<WorshipMusician, 'id'>) => void;
  onAddDancer?: (dancer: Omit<DanceDancer, 'id'>) => void;
  onAddActor?: (actor: Omit<TheaterActor, 'id'>) => void;
}

export const MinistryCastingTab: React.FC<MinistryCastingTabProps> = ({
  ministry,
  ministryName,
  castings,
  referenceItems = [],
  pageColor,
  config,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onAddMusician,
  onAddDancer,
  onAddActor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refFilter, setRefFilter] = useState<string>('all');

  // Date filters
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Expanded cards state
  const [expandedCastings, setExpandedCastings] = useState<Record<string, boolean>>({});

  // Modals
  const [isCastingModalOpen, setIsCastingModalOpen] = useState(false);
  const [editingCasting, setEditingCasting] = useState<MinistryCastingCall | null>(null);

  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [targetCastingId, setTargetCastingId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<MinistryCastingCandidate | null>(null);

  const [shareModalCasting, setShareModalCasting] = useState<MinistryCastingCall | null>(null);

  const [viewScriptModal, setViewScriptModal] = useState<{
    isOpen: boolean;
    title: string;
    scriptText: string;
    requirements?: string;
  }>({
    isOpen: false,
    title: '',
    scriptText: '',
  });

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

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [promotedCandidateId, setPromotedCandidateId] = useState<string | null>(null);

  // Criteria Configuration based on Ministry
  const getCriteriaMeta = () => {
    switch (ministry) {
      case 'worship':
        return {
          c1Name: 'pitch',
          c1Label: 'Afinación y Oído Musical',
          c1Desc: 'Precisión tonal, afinación en registro y armonización',
          c2Name: 'rhythm',
          c2Label: 'Tiempo, Métrica y Ritmo',
          c2Desc: 'Precisión de tempo, uso de metrónomo y groove',
          c3Name: 'technique',
          c3Label: 'Técnica Instrumental / Vocal',
          c3Desc: 'Destreza, articulación, dinámica y rango sonoro',
          c4Name: 'commitment',
          c4Label: 'Compromiso & Actitud Espiritual',
          c4Desc: 'Puntualidad, disposición a aprender y testimonio',
          rolePresets: [
            { roleName: 'Voz Principal (Lead Vocal)', characterType: 'Vocal', description: 'Rango amplio, liderazgo de alabanza y unción' },
            { roleName: 'Soprano (1ra Voz)', characterType: 'Vocal', description: 'Registro agudo brillante, buen oído para coros' },
            { roleName: 'Contralto (2da Voz)', characterType: 'Vocal', description: 'Registro medio/grave cálido, armonización' },
            { roleName: 'Tenor (3ra Voz)', characterType: 'Vocal', description: 'Voz masculina aguda, potencia y ensamble' },
            { roleName: 'Piano / Teclado Principal', characterType: 'Armonía', description: 'Acompañamiento, colchones (pads), progresiones y oído' },
            { roleName: 'Batería Acústica', characterType: 'Ritmo', description: 'Control dinámico, tiempo sólido con clic, fills limpios' },
            { roleName: 'Bajo Eléctrico', characterType: 'Armonía & Ritmo', description: 'Groove, definición tonal, ensamble con bombo' },
            { roleName: 'Guitarra Eléctrica', characterType: 'Melodía / Efectos', description: 'Efectos (delay/reverb ambient), arpegios y solos' },
            { roleName: 'Guitarra Acústica', characterType: 'Armonía', description: 'Rasgueo rítmico prolijo y afinación estable' },
            { roleName: 'Saxofón / Vientos', characterType: 'Melodía', description: 'Líneas melódicas, solos y dinámica expresiva' },
          ],
          defaultTitle: 'Audición de Nuevos Músicos & Voces',
          defaultLocation: 'Sala de Ensayo de Alabanza / Auditorio',
          scriptLabel: 'Canciones o Pasajes de Prueba',
          scriptPlaceholder: 'Ejemplo: 1. "La Bondad de Dios" (Tono G) - Estrofa y Coro\n2. "Cuerdas de Amor" (Tono D) - Solo o improvisación',
        };
      case 'dance':
        return {
          c1Name: 'coordination',
          c1Label: 'Coordinación, Métrica y Ritmo',
          c1Desc: 'Sincronía con el compás musical y movimientos corporales',
          c2Name: 'expression',
          c2Label: 'Expresión, Gracia y Unción',
          c2Desc: 'Proyección espiritual, gozo, reverencia y presencia',
          c3Name: 'technique',
          c3Label: 'Manejo de Instrumento & Técnica',
          c3Desc: 'Destreza en banderas, mantos, pandero o saltos/giros',
          c4Name: 'commitment',
          c4Label: 'Disciplina & Compromiso',
          c4Desc: 'Puntualidad a ensayos, cuidado de uniforme y testimonio',
          rolePresets: [
            { roleName: 'Danzarina de Banderas & Heraldos', characterType: 'Instrumento', description: 'Manejo ágil de asta, trazos firmes y sincronía' },
            { roleName: 'Danzarina de Mantos & Velos', characterType: 'Instrumento', description: 'Fluidez, suavidad en el aire y movimientos amplios' },
            { roleName: 'Panderos & Percusión Sacra', characterType: 'Instrumento', description: 'Patrones rítmicos bíblicos marcados con precisión' },
            { roleName: 'Cintas & Streamers', characterType: 'Instrumento', description: 'Figuras espirales continuas sin enredos' },
            { roleName: 'Danza Litúrgica / Profética', characterType: 'Expresión', description: 'Interpretación lírica profunda de la adoración' },
            { roleName: 'Danza Contemporánea / Urbana', characterType: 'Coreografía', description: 'Fuerza, suelo, saltos y movimientos enérgicos' },
            { roleName: 'Semillero Infantil de Danza', characterType: 'Formativo', description: 'Niñas y jovencitas en formación técnica y espiritual' },
          ],
          defaultTitle: 'Audición para Elenco de Danza & Banderas',
          defaultLocation: 'Salón de Danza / Auditorio Principal',
          scriptLabel: 'Secuencia Coreográfica o Canción de Prueba',
          scriptPlaceholder: 'Ejemplo: Secuencia básica de 8 tiempos con manto o bandera al ritmo de "Digno es el Cordero". Se evaluará fluidez y postura.',
        };
      default: // theater
        return {
          c1Name: 'diction',
          c1Label: 'Dicción y Proyección Vocal',
          c1Desc: 'Claridad al hablar, volumen sin gritar y modulación',
          c2Name: 'expression',
          c2Label: 'Expresión Corporal y Presencia',
          c2Desc: 'Gestualidad, postura escénica y manejo del espacio',
          c3Name: 'memorization',
          c3Label: 'Memorización & Improvisación',
          c3Desc: 'Retención de parlamentos y capacidad de reacción',
          c4Name: 'commitment',
          c4Label: 'Compromiso & Trabajo en Equipo',
          c4Desc: 'Puntualidad a ensayos y actitud colaborativa',
          rolePresets: [
            { roleName: 'Papel Protagónico', characterType: 'Protagónico', description: 'Personaje central con peso dramático y diálogos extensos' },
            { roleName: 'Papel Secundario / Soporte', characterType: 'Secundario', description: 'Personaje de acompañamiento con escenas clave' },
            { roleName: 'Narrador(a) / Voz en Off', characterType: 'Narrador', description: 'Excelente dicción, timbre pausado y narración elocuente' },
            { roleName: 'Mímica / Pantomima Expresiva', characterType: 'Pantomima / Mímica', description: 'Dominio total del rostro y cuerpo sin palabras habladas' },
            { roleName: 'Coro Escénico / Extras', characterType: 'Coro / Extras', description: 'Pueblo, discípulos o multitud en escenas masivas' },
          ],
          defaultTitle: 'Casting General de Actuación & Pantomima',
          defaultLocation: 'Auditorio Principal / Sala de Artes',
          scriptLabel: 'Monólogo o Guion de Audición',
          scriptPlaceholder: 'Ejemplo de monólogo corto:\n"Pensé que todo estaba perdido... hasta que una voz en medio de la tormenta me dijo: No temas, Yo estoy contigo..."',
        };
    }
  };

  const meta = getCriteriaMeta();

  // Casting Form State
  const [castingForm, setCastingForm] = useState<Omit<MinistryCastingCall, 'id'>>({
    ministry,
    title: '',
    playId: '',
    playTitle: '',
    director: config?.pastorName || `Director(a) de ${ministryName}`,
    date: new Date().toISOString().split('T')[0],
    time: '18:00 - 20:00',
    location: meta.defaultLocation,
    status: 'Convocatoria Abierta',
    rolesNeeded: [],
    requirements: '',
    auditionScriptSnippet: '',
    youtubeReferenceUrl: '',
    candidates: [],
    notes: '',
  });

  // Candidate Form State
  const [candidateForm, setCandidateForm] = useState<Omit<MinistryCastingCandidate, 'id'>>({
    name: '',
    phone: '',
    age: '',
    applyingRole: '',
    category: 'General',
    experienceLevel: 'Intermedio',
    status: 'En Evaluación',
    scores: {
      diction: 4,
      expression: 4,
      memorization: 4,
      commitment: 4,
      pitch: 4,
      rhythm: 4,
      technique: 4,
      coordination: 4,
    },
    overallRating: 4,
    auditionNotes: '',
    assignedRole: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Toggle card expansion
  const toggleExpanded = (id: string) => {
    setExpandedCastings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Create Casting
  const handleOpenCreateCasting = () => {
    setEditingCasting(null);
    setCastingForm({
      ministry,
      title: '',
      playId: '',
      playTitle: '',
      director: config?.pastorName || `Director(a) de ${ministryName}`,
      date: new Date().toISOString().split('T')[0],
      time: '18:00 - 20:00',
      location: meta.defaultLocation,
      status: 'Convocatoria Abierta',
      rolesNeeded: [
        {
          id: `role_${Date.now()}_1`,
          roleName: meta.rolePresets[0].roleName,
          characterType: meta.rolePresets[0].characterType,
          description: meta.rolePresets[0].description,
          gender: 'Indistinto',
          ageRange: '18 - 45 años',
        },
      ],
      requirements: '• Puntualidad y asistencia obligatoria a ensayos.\n• Testimonio cristiano activo y membresía.\n• Disposición a recibir instrucción técnica.',
      auditionScriptSnippet: '',
      youtubeReferenceUrl: '',
      candidates: [],
      notes: '',
    });
    setIsCastingModalOpen(true);
  };

  // Open Edit Casting
  const handleOpenEditCasting = (casting: MinistryCastingCall) => {
    setEditingCasting(casting);
    setCastingForm({
      ministry: casting.ministry || ministry,
      title: casting.title,
      playId: casting.playId || '',
      playTitle: casting.playTitle || '',
      director: casting.director,
      date: casting.date,
      time: casting.time,
      location: casting.location,
      status: casting.status,
      rolesNeeded: casting.rolesNeeded || [],
      requirements: casting.requirements || '',
      auditionScriptSnippet: casting.auditionScriptSnippet || '',
      youtubeReferenceUrl: casting.youtubeReferenceUrl || '',
      candidates: casting.candidates || [],
      notes: casting.notes || '',
    });
    setIsCastingModalOpen(true);
  };

  // Submit Casting
  const handleSaveCasting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!castingForm.title.trim()) return;

    if (editingCasting) {
      onUpdateCasting({
        ...editingCasting,
        ...castingForm,
      });
    } else {
      onAddCasting(castingForm);
    }
    setIsCastingModalOpen(false);
  };

  // Add Role in Form
  const handleAddRoleInForm = (preset?: { roleName: string; characterType: string; description: string }) => {
    const newRole: MinistryCastingRole = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      roleName: preset?.roleName || '',
      characterType: preset?.characterType || 'General',
      description: preset?.description || '',
      gender: 'Indistinto',
      ageRange: 'Cualquier edad',
    };
    setCastingForm((prev) => ({
      ...prev,
      rolesNeeded: [...prev.rolesNeeded, newRole],
    }));
  };

  // Remove Role in Form
  const handleRemoveRoleInForm = (id: string) => {
    setCastingForm((prev) => ({
      ...prev,
      rolesNeeded: prev.rolesNeeded.filter((r) => r.id !== id),
    }));
  };

  // Open Candidate Modal
  const handleOpenAddCandidate = (castingId: string) => {
    const parentCasting = castings.find((c) => c.id === castingId);
    const defaultRole = parentCasting?.rolesNeeded?.[0]?.roleName || '';

    setTargetCastingId(castingId);
    setEditingCandidate(null);
    setCandidateForm({
      name: '',
      phone: '',
      age: '',
      applyingRole: defaultRole,
      category: 'General',
      experienceLevel: 'Intermedio',
      status: 'En Evaluación',
      scores: {
        diction: 4,
        expression: 4,
        memorization: 4,
        commitment: 4,
        pitch: 4,
        rhythm: 4,
        technique: 4,
        coordination: 4,
      },
      overallRating: 4,
      auditionNotes: '',
      assignedRole: defaultRole,
      date: new Date().toISOString().split('T')[0],
    });
    setIsCandidateModalOpen(true);
  };

  // Open Edit Candidate
  const handleOpenEditCandidate = (castingId: string, cand: MinistryCastingCandidate) => {
    setTargetCastingId(castingId);
    setEditingCandidate(cand);
    setCandidateForm({
      name: cand.name,
      phone: cand.phone || '',
      age: cand.age || '',
      applyingRole: cand.applyingRole,
      category: cand.category || 'General',
      experienceLevel: cand.experienceLevel || 'Intermedio',
      status: cand.status,
      scores: cand.scores || {
        diction: 4,
        expression: 4,
        memorization: 4,
        commitment: 4,
        pitch: 4,
        rhythm: 4,
        technique: 4,
        coordination: 4,
      },
      overallRating: cand.overallRating || 4,
      auditionNotes: cand.auditionNotes || '',
      assignedRole: cand.assignedRole || cand.applyingRole,
      date: cand.date || new Date().toISOString().split('T')[0],
    });
    setIsCandidateModalOpen(true);
  };

  // Save Candidate
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCastingId || !candidateForm.name.trim()) return;

    const parentCasting = castings.find((c) => c.id === targetCastingId);
    if (!parentCasting) return;

    // Calculate overall average
    const sc = candidateForm.scores || {};
    let vals: number[] = [];
    if (ministry === 'worship') {
      vals = [sc.pitch || 4, sc.rhythm || 4, sc.technique || 4, sc.commitment || 4];
    } else if (ministry === 'dance') {
      vals = [sc.coordination || 4, sc.expression || 4, sc.technique || 4, sc.commitment || 4];
    } else {
      vals = [sc.diction || 4, sc.expression || 4, sc.memorization || 4, sc.commitment || 4];
    }
    const avg = Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));

    let updatedCandidates: MinistryCastingCandidate[];

    if (editingCandidate) {
      updatedCandidates = (parentCasting.candidates || []).map((c) =>
        c.id === editingCandidate.id
          ? {
              ...editingCandidate,
              ...candidateForm,
              overallRating: avg,
            }
          : c
      );
    } else {
      const newCand: MinistryCastingCandidate = {
        id: `cand_${Date.now()}`,
        ...candidateForm,
        overallRating: avg,
      };
      updatedCandidates = [...(parentCasting.candidates || []), newCand];
    }

    onUpdateCasting({
      ...parentCasting,
      candidates: updatedCandidates,
    });

    setIsCandidateModalOpen(false);
  };

  // Delete Candidate
  const handleDeleteCandidate = (castingId: string, candidateId: string) => {
    const parentCasting = castings.find((c) => c.id === castingId);
    if (!parentCasting) return;

    onUpdateCasting({
      ...parentCasting,
      candidates: (parentCasting.candidates || []).filter((c) => c.id !== candidateId),
    });
  };

  // Promote Selected Candidate to Official Ministry Roster
  const handlePromoteToRoster = (casting: MinistryCastingCall, cand: MinistryCastingCandidate) => {
    if (ministry === 'worship' && onAddMusician) {
      onAddMusician({
        name: cand.name,
        role: cand.assignedRole || cand.applyingRole || 'Voz / Instrumentista',
        instruments: [cand.assignedRole || cand.applyingRole || 'General'],
        phone: cand.phone || '',
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
      });
      setPromotedCandidateId(cand.id);
      setTimeout(() => setPromotedCandidateId(null), 3500);
    } else if (ministry === 'dance' && onAddDancer) {
      onAddDancer({
        name: cand.name,
        group: 'Principal',
        role: cand.assignedRole || cand.applyingRole || 'Danzarina',
        specialties: [cand.assignedRole || cand.applyingRole || 'General'],
        phone: cand.phone || '',
        active: true,
        joinedDate: new Date().toISOString().split('T')[0],
      });
      setPromotedCandidateId(cand.id);
      setTimeout(() => setPromotedCandidateId(null), 3500);
    } else if (ministry === 'theater' && onAddActor) {
      onAddActor({
        name: cand.name,
        characterTypes: [cand.assignedRole || cand.applyingRole || 'Protagónico'],
        phone: cand.phone || '',
        status: 'Activo',
        experienceLevel: cand.experienceLevel || 'Intermedio',
        notes: `Seleccionado en casting "${casting.title}"`,
      });
      setPromotedCandidateId(cand.id);
      setTimeout(() => setPromotedCandidateId(null), 3500);
    }
  };

  // Quick WhatsApp Text Copy
  const handleCopyWhatsAppText = (casting: MinistryCastingCall) => {
    const rolesText = (casting.rolesNeeded || [])
      .map((r) => `• *${r.roleName}* (${r.characterType}): ${r.description}`)
      .join('\n');

    const text = `🎭 *CONVOCATORIA & AUDICIONES*\n🏛️ *${config?.name || 'Iglesia Central'}* - ${ministryName}\n\n📌 *Convocatoria:* ${casting.title}\n${casting.playTitle ? `🎬 *Proyecto / Ref:* ${casting.playTitle}\n` : ''}👤 *Director/Evaluador:* ${casting.director}\n🗓️ *Fecha:* ${casting.date} • ⏰ *Hora:* ${casting.time}\n📍 *Lugar:* ${casting.location}\n⚡ *Estado:* ${casting.status}\n\n📋 *Roles / Puestos Solicitados:*\n${rolesText || 'Ver detalles'}\n\n${casting.requirements ? `✅ *Requisitos:* ${casting.requirements}\n` : ''}${casting.auditionScriptSnippet ? `📜 *Pauta / Texto de Prueba:* ${casting.auditionScriptSnippet}\n` : ''}\n¡Te esperamos para formar parte de este ministerio!`;

    navigator.clipboard.writeText(text);
    setCopiedId(casting.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  // Filter castings
  const filteredCastings = castings.filter((casting) => {
    const matchesSearch =
      casting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      casting.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (casting.playTitle && casting.playTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      casting.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (casting.rolesNeeded || []).some((r) => r.roleName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || casting.status === statusFilter;
    const matchesRef = refFilter === 'all' || casting.playId === refFilter || casting.playTitle === refFilter;

    // Date filter
    const matchesDate = filterItemsByDate([casting], (c) => c.date, datePreset, startDate, endDate).length > 0;

    return matchesSearch && matchesStatus && matchesRef && matchesDate;
  });

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
            style={{ backgroundColor: pageColor }}
          >
            {ministry === 'worship' ? (
              <Music className="w-6 h-6" />
            ) : ministry === 'dance' ? (
              <Sparkles className="w-6 h-6" />
            ) : (
              <Theater className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>Casting & Audiciones</span>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-black text-white"
                style={{ backgroundColor: pageColor }}
              >
                {castings.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convocatorias, evaluación técnica de talentos y selección oficial de {ministryName}
            </p>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={handleOpenCreateCasting}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer shrink-0"
          style={{
            backgroundColor: pageColor,
            boxShadow: `0 8px 20px -4px ${pageColor}60`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Convocatoria de Casting</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar casting, rol, director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">Todos los Estados</option>
            <option value="Convocatoria Abierta">🟢 Convocatoria Abierta</option>
            <option value="En Proceso de Audición">🟡 En Proceso de Audición</option>
            <option value="Elenco Confirmado">🔵 Elenco Confirmado</option>
            <option value="Cerrado">⚪ Cerrado</option>
          </select>
        </div>

        {/* Reference Project Filter (if any) */}
        {referenceItems.length > 0 && (
          <div>
            <select
              value={refFilter}
              onChange={(e) => setRefFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Todas las Obras / Proyectos</option>
              {referenceItems.map((ref) => (
                <option key={ref.id} value={ref.id}>
                  {ref.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date Filter */}
        <div className={referenceItems.length > 0 ? '' : 'sm:col-span-2 lg:col-span-2'}>
          <DateFilterControl
            preset={datePreset}
            startDate={startDate}
            endDate={endDate}
            onPresetChange={setDatePreset}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        </div>
      </div>

      {/* Castings List */}
      {filteredCastings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-xs">
          <div
            className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center text-white/90 shadow-md"
            style={{ backgroundColor: pageColor }}
          >
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white">
            No se encontraron convocatorias de casting
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
            Crea una nueva convocatoria de audición para convocar talentos, evaluar candidatos y estructurar el elenco de {ministryName}.
          </p>
          <button
            onClick={handleOpenCreateCasting}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
            style={{ backgroundColor: pageColor }}
          >
            <Plus className="w-4 h-4" />
            <span>Crear Convocatoria</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCastings.map((casting) => {
            const isExpanded = expandedCastings[casting.id] !== false; // expanded by default
            const roles = casting.rolesNeeded || [];
            const candidates = casting.candidates || [];
            const titularesCount = candidates.filter((c) => c.status === 'Seleccionado (Titular)').length;
            const coversCount = candidates.filter((c) => c.status === 'Suplente / Cover').length;
            const inEvalCount = candidates.filter((c) => c.status === 'En Evaluación').length;
            const coveragePercent = roles.length > 0 ? Math.min(100, Math.round((titularesCount / roles.length) * 100)) : 100;

            return (
              <div
                key={casting.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm overflow-hidden transition-all"
              >
                {/* Casting Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5"
                      style={{ backgroundColor: pageColor }}
                    >
                      <Award className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
                          style={{
                            backgroundColor:
                              casting.status === 'Elenco Confirmado'
                                ? '#dcfce7'
                                : casting.status === 'En Proceso de Audición'
                                ? '#fef3c7'
                                : '#e0f2fe',
                            color:
                              casting.status === 'Elenco Confirmado'
                                ? '#15803d'
                                : casting.status === 'En Proceso de Audición'
                                ? '#b45309'
                                : '#0369a1',
                          }}
                        >
                          {casting.status}
                        </span>

                        {casting.playTitle && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                            {casting.playTitle}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white leading-tight">
                        {casting.title}
                      </h3>

                      <div className="flex items-center flex-wrap gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center space-x-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{casting.date}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{casting.time}</span>
                        </span>
                        <span className="flex items-center space-x-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{casting.location}</span>
                        </span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Evaluador: {casting.director}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Share */}
                  <div className="flex items-center flex-wrap gap-1.5 shrink-0 self-end md:self-center">
                    {/* Share Modal Trigger (PDF & JPG Carta) */}
                    <button
                      onClick={() => setShareModalCasting(casting)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
                      title="Compartir y Exportar en PDF / JPG Formato Carta Oficial con Doble Logo"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir (Carta)</span>
                    </button>

                    {/* WhatsApp Quick Copy */}
                    <button
                      onClick={() => handleCopyWhatsAppText(casting)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs transition-colors cursor-pointer"
                      title="Copiar texto para WhatsApp"
                    >
                      {copiedId === casting.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === casting.id ? '¡Copiado!' : 'WhatsApp'}</span>
                    </button>

                    {/* Script / Song Snippet modal */}
                    {casting.auditionScriptSnippet && (
                      <button
                        onClick={() =>
                          setViewScriptModal({
                            isOpen: true,
                            title: casting.title,
                            scriptText: casting.auditionScriptSnippet || '',
                            requirements: casting.requirements,
                          })
                        }
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-bold text-xs transition-colors cursor-pointer"
                        title="Ver pauta / material de audición"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-500" />
                        <span>Pauta</span>
                      </button>
                    )}

                    {/* YouTube reference */}
                    {casting.youtubeReferenceUrl && (
                      <button
                        onClick={() =>
                          setYoutubeModal({
                            isOpen: true,
                            url: casting.youtubeReferenceUrl,
                            title: `Referencia: ${casting.title}`,
                            subtitle: casting.playTitle,
                            notes: casting.requirements,
                          })
                        }
                        className="p-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold text-xs transition-colors cursor-pointer"
                        title="Ver video de referencia en YouTube"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}

                    {/* Edit Casting */}
                    <button
                      onClick={() => handleOpenEditCasting(casting)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Editar convocatoria"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete Casting */}
                    <button
                      onClick={() => onDeleteCasting(casting.id)}
                      className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Eliminar convocatoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Toggle Collapse */}
                    <button
                      onClick={() => toggleExpanded(casting.id)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer ml-1"
                      title={isExpanded ? 'Colapsar detalles' : 'Expandir detalles'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Progress / Coverage Bar */}
                <div className="px-4 sm:px-5 py-2.5 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-3 sm:space-x-5">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Roles solicitados: <strong className="text-slate-900 dark:text-white">{roles.length}</strong>
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Aspirantes evaluados: <strong className="text-slate-900 dark:text-white">{candidates.length}</strong>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                      Titulares: {titularesCount}
                    </span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                      Suplentes: {coversCount}
                    </span>
                  </div>

                  {roles.length > 0 && (
                    <div className="flex items-center space-x-2 w-full sm:w-48">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">
                        Cobertura: {coveragePercent}%
                      </span>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${coveragePercent}%`,
                            backgroundColor: pageColor,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Expanded Content: Roles Grid & Candidates Table */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5">
                    {/* 1. Roles Requeridos */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                          <Users className="w-3.5 h-3.5" style={{ color: pageColor }} />
                          <span>Puestos & Perfiles Convocados ({roles.length})</span>
                        </h4>
                      </div>

                      {roles.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No se han definido perfiles específicos para este casting.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {roles.map((role) => {
                            const titular = candidates.find(
                              (c) =>
                                c.status === 'Seleccionado (Titular)' &&
                                (c.assignedRole === role.roleName || c.applyingRole === role.roleName)
                            );
                            const cover = candidates.find(
                              (c) =>
                                c.status === 'Suplente / Cover' &&
                                (c.assignedRole === role.roleName || c.applyingRole === role.roleName)
                            );

                            return (
                              <div
                                key={role.id}
                                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-black text-xs text-slate-900 dark:text-white truncate">
                                      {role.roleName}
                                    </span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 shrink-0">
                                      {role.characterType}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                                    {role.description || 'Sin descripción'}
                                  </p>
                                  {(role.gender || role.ageRange) && (
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                      {role.gender && <span>{role.gender}</span>}
                                      {role.ageRange && <span>• {role.ageRange}</span>}
                                    </div>
                                  )}
                                </div>

                                {/* Assigned person badge */}
                                <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10.5px]">
                                  {titular ? (
                                    <div className="flex items-center space-x-1 text-emerald-700 dark:text-emerald-400 font-bold">
                                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                                      <span className="truncate">Titular: {titular.name}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 font-semibold">
                                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                      <span>Vacante por asignar</span>
                                    </div>
                                  )}
                                  {cover && (
                                    <div className="text-indigo-600 dark:text-indigo-400 text-[10px] truncate mt-0.5">
                                      Suplente: {cover.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. Aspirantes & Evaluaciones */}
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                          <Award className="w-3.5 h-3.5" style={{ color: pageColor }} />
                          <span>Fichas de Aspirantes & Calificación ({candidates.length})</span>
                        </h4>

                        <button
                          onClick={() => handleOpenAddCandidate(casting.id)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Evaluar Aspirante</span>
                        </button>
                      </div>

                      {candidates.length === 0 ? (
                        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Aún no hay aspirantes evaluados en esta convocatoria.
                          </p>
                          <button
                            onClick={() => handleOpenAddCandidate(casting.id)}
                            className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            + Agregar primera ficha de evaluación
                          </button>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                                <th className="pb-2">Aspirante</th>
                                <th className="pb-2">Puesto Solicitado</th>
                                <th className="pb-2 text-center">Nivel</th>
                                <th className="pb-2 text-center">Puntaje</th>
                                <th className="pb-2 text-center">Veredicto</th>
                                <th className="pb-2">Observaciones</th>
                                <th className="pb-2 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {candidates.map((cand) => (
                                <tr
                                  key={cand.id}
                                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  {/* Candidate info */}
                                  <td className="py-2.5 pr-2 font-bold text-slate-800 dark:text-white">
                                    <div className="flex items-center space-x-2">
                                      <div
                                        className="w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: pageColor }}
                                      >
                                        {cand.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate font-black">{cand.name}</p>
                                        {cand.phone && (
                                          <a
                                            href={`https://wa.me/${cand.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-0.5"
                                          >
                                            <Phone className="w-2.5 h-2.5" />
                                            <span>{cand.phone}</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Role */}
                                  <td className="py-2.5 pr-2 text-slate-700 dark:text-slate-300 font-medium">
                                    {cand.applyingRole}
                                    {cand.assignedRole && cand.assignedRole !== cand.applyingRole && (
                                      <span className="block text-[10px] text-amber-600 dark:text-amber-400">
                                        Asignado: {cand.assignedRole}
                                      </span>
                                    )}
                                  </td>

                                  {/* Experience */}
                                  <td className="py-2.5 px-2 text-center text-slate-500 dark:text-slate-400 text-[11px]">
                                    {cand.experienceLevel || 'Intermedio'}
                                  </td>

                                  {/* Score */}
                                  <td className="py-2.5 px-2 text-center">
                                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black text-xs border border-amber-200 dark:border-amber-800">
                                      <Star className="w-3 h-3 fill-current text-amber-500" />
                                      <span>{cand.overallRating ? cand.overallRating : '-'}</span>
                                    </div>
                                  </td>

                                  {/* Verdict */}
                                  <td className="py-2.5 px-2 text-center">
                                    <span
                                      className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block"
                                      style={{
                                        backgroundColor:
                                          cand.status === 'Seleccionado (Titular)'
                                            ? '#dcfce7'
                                            : cand.status === 'Suplente / Cover'
                                            ? '#e0e7ff'
                                            : cand.status === 'En Evaluación'
                                            ? '#fef3c7'
                                            : '#fee2e2',
                                        color:
                                          cand.status === 'Seleccionado (Titular)'
                                            ? '#15803d'
                                            : cand.status === 'Suplente / Cover'
                                            ? '#4338ca'
                                            : cand.status === 'En Evaluación'
                                            ? '#b45309'
                                            : '#b91c1c',
                                      }}
                                    >
                                      {cand.status}
                                    </span>
                                  </td>

                                  {/* Notes */}
                                  <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400 text-xs italic max-w-[160px] truncate">
                                    {cand.auditionNotes || 'Sin notas'}
                                  </td>

                                  {/* Actions */}
                                  <td className="py-2.5 pl-2 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      {/* Promote to official roster if selected */}
                                      {cand.status === 'Seleccionado (Titular)' && (
                                        <button
                                          onClick={() => handlePromoteToRoster(casting, cand)}
                                          className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors cursor-pointer"
                                          title={`Agregar a la lista oficial de integrantes de ${ministryName}`}
                                        >
                                          {promotedCandidateId === cand.id ? (
                                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          ) : (
                                            <UserCheck className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleOpenEditCandidate(casting.id, cand)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                        title="Editar evaluación"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCandidate(casting.id, cand.id)}
                                        className="p-1 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                        title="Eliminar aspirante"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE / EDIT CASTING CALL */}
      {isCastingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <Award className="w-5 h-5" style={{ color: pageColor }} />
                <span>{editingCasting ? 'Editar Convocatoria de Casting' : 'Nueva Convocatoria de Casting'}</span>
              </h3>
              <button
                onClick={() => setIsCastingModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCasting} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título de la Convocatoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder={meta.defaultTitle}
                  value={castingForm.title}
                  onChange={(e) => setCastingForm({ ...castingForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Reference Project / Play Link (if any) */}
              {referenceItems.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Proyecto / Obra Vinculada (Opcional)
                  </label>
                  <select
                    value={castingForm.playId || ''}
                    onChange={(e) => {
                      const selectedRef = referenceItems.find((p) => p.id === e.target.value);
                      setCastingForm({
                        ...castingForm,
                        playId: e.target.value,
                        playTitle: selectedRef ? selectedRef.title : '',
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Convocatoria General del Ministerio --</option>
                    {referenceItems.map((ref) => (
                      <option key={ref.id} value={ref.id}>
                        {ref.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Logistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Director / Evaluador a Cargo
                  </label>
                  <input
                    type="text"
                    required
                    value={castingForm.director}
                    onChange={(e) => setCastingForm({ ...castingForm, director: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de Convocatoria
                  </label>
                  <select
                    value={castingForm.status}
                    onChange={(e) => setCastingForm({ ...castingForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Convocatoria Abierta">🟢 Convocatoria Abierta</option>
                    <option value="En Proceso de Audición">🟡 En Proceso de Audición</option>
                    <option value="Elenco Confirmado">🔵 Elenco Confirmado</option>
                    <option value="Cerrado">⚪ Cerrado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Audiciones
                  </label>
                  <input
                    type="date"
                    required
                    value={castingForm.date}
                    onChange={(e) => setCastingForm({ ...castingForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horario
                  </label>
                  <input
                    type="text"
                    placeholder="18:00 - 20:00"
                    value={castingForm.time}
                    onChange={(e) => setCastingForm({ ...castingForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lugar / Salón de Audición
                </label>
                <input
                  type="text"
                  placeholder={meta.defaultLocation}
                  value={castingForm.location}
                  onChange={(e) => setCastingForm({ ...castingForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* ROLES BUILDER */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Roles / Puestos Requeridos ({castingForm.rolesNeeded.length})
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAddRoleInForm()}
                    className="flex items-center space-x-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Agregar Rol Personalizado</span>
                  </button>
                </div>

                {/* Quick Add Presets Bar */}
                <div className="flex items-center flex-wrap gap-1.5 mb-3">
                  <span className="text-[11px] font-bold text-slate-400">Plantillas rápidas:</span>
                  {meta.rolePresets.slice(0, 5).map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddRoleInForm(preset)}
                      className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-bold transition-colors cursor-pointer"
                    >
                      + {preset.roleName}
                    </button>
                  ))}
                </div>

                {castingForm.rolesNeeded.length === 0 ? (
                  <p className="text-xs italic text-slate-400">
                    Haz clic en "+ Agregar Rol" o selecciona una plantilla rápida arriba para convocar puestos específicos.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
                    {castingForm.rolesNeeded.map((role, idx) => (
                      <div
                        key={role.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 items-start sm:items-center"
                      >
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 w-full">
                          <input
                            type="text"
                            placeholder="Nombre del Rol / Puesto"
                            value={role.roleName}
                            onChange={(e) => {
                              const updated = [...castingForm.rolesNeeded];
                              updated[idx].roleName = e.target.value;
                              setCastingForm({ ...castingForm, rolesNeeded: updated });
                            }}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Tipo (Vocal, Ritmo, Manto...)"
                            value={role.characterType}
                            onChange={(e) => {
                              const updated = [...castingForm.rolesNeeded];
                              updated[idx].characterType = e.target.value;
                              setCastingForm({ ...castingForm, rolesNeeded: updated });
                            }}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                          <input
                            type="text"
                            placeholder="Descripción / Perfil requerido"
                            value={role.description}
                            onChange={(e) => {
                              const updated = [...castingForm.rolesNeeded];
                              updated[idx].description = e.target.value;
                              setCastingForm({ ...castingForm, rolesNeeded: updated });
                            }}
                            className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoleInForm(role.id)}
                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer shrink-0"
                          title="Eliminar rol"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements & Snippet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Requisitos de Convocatoria
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Compromiso de puntualidad, asistencia a ensayos, testimonio activo..."
                  value={castingForm.requirements}
                  onChange={(e) => setCastingForm({ ...castingForm, requirements: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {meta.scriptLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={meta.scriptPlaceholder}
                  value={castingForm.auditionScriptSnippet}
                  onChange={(e) => setCastingForm({ ...castingForm, auditionScriptSnippet: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Enlace de Video de Referencia (YouTube, Facebook, TikTok, Instagram, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://... (YouTube, Facebook, TikTok, Instagram o MP4)"
                  value={castingForm.youtubeReferenceUrl || ''}
                  onChange={(e) => setCastingForm({ ...castingForm, youtubeReferenceUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCastingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md cursor-pointer"
                  style={{ backgroundColor: pageColor }}
                >
                  {editingCasting ? 'Guardar Cambios' : 'Crear Convocatoria'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVALUATE / EDIT CANDIDATE */}
      {isCandidateModalOpen && targetCastingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5" style={{ color: pageColor }} />
                <span>{editingCandidate ? 'Editar Ficha de Aspirante' : 'Ficha de Evaluación de Aspirante'}</span>
              </h3>
              <button
                onClick={() => setIsCandidateModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre Completo del Aspirante *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: David Morales"
                    value={candidateForm.name}
                    onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+54 9 11 ..."
                    value={candidateForm.phone || ''}
                    onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Puesto / Rol al que Aspira
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateForm.applyingRole}
                    onChange={(e) => setCandidateForm({ ...candidateForm, applyingRole: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nivel de Experiencia
                  </label>
                  <select
                    value={candidateForm.experienceLevel}
                    onChange={(e) => setCandidateForm({ ...candidateForm, experienceLevel: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Principiante">Principiante (En formación)</option>
                    <option value="Intermedio">Intermedio (Buen nivel)</option>
                    <option value="Avanzado / Con Experiencia">Avanzado / Con Experiencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Veredicto / Asignación
                  </label>
                  <select
                    value={candidateForm.status}
                    onChange={(e) => setCandidateForm({ ...candidateForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-bold"
                  >
                    <option value="Seleccionado (Titular)">🌟 Seleccionado (Titular)</option>
                    <option value="Suplente / Cover">🔄 Suplente / Cover</option>
                    <option value="En Evaluación">⏳ En Evaluación</option>
                    <option value="No Seleccionado">❌ No Seleccionado</option>
                  </select>
                </div>
              </div>

              {/* CRITERIOS DE EVALUACIÓN (1 a 5 Estrellas) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Star className="w-3.5 h-3.5 fill-current text-amber-500" />
                  <span>Calificación Técnica (1 a 5)</span>
                </h4>

                {/* Criterio 1 */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{meta.c1Label}</span>
                    <span className="text-[10px] text-slate-400">{meta.c1Desc}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const currentVal = (candidateForm.scores as any)?.[meta.c1Name] || 4;
                      return (
                        <button
                          key={`${meta.c1Name}_${val}`}
                          type="button"
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              scores: { ...candidateForm.scores, [meta.c1Name]: val },
                            })
                          }
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                            currentVal >= val
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Criterio 2 */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{meta.c2Label}</span>
                    <span className="text-[10px] text-slate-400">{meta.c2Desc}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const currentVal = (candidateForm.scores as any)?.[meta.c2Name] || 4;
                      return (
                        <button
                          key={`${meta.c2Name}_${val}`}
                          type="button"
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              scores: { ...candidateForm.scores, [meta.c2Name]: val },
                            })
                          }
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                            currentVal >= val
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Criterio 3 */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{meta.c3Label}</span>
                    <span className="text-[10px] text-slate-400">{meta.c3Desc}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const currentVal = (candidateForm.scores as any)?.[meta.c3Name] || 4;
                      return (
                        <button
                          key={`${meta.c3Name}_${val}`}
                          type="button"
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              scores: { ...candidateForm.scores, [meta.c3Name]: val },
                            })
                          }
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                            currentVal >= val
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Criterio 4 */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-white block">{meta.c4Label}</span>
                    <span className="text-[10px] text-slate-400">{meta.c4Desc}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const currentVal = (candidateForm.scores as any)?.[meta.c4Name] || 4;
                      return (
                        <button
                          key={`${meta.c4Name}_${val}`}
                          type="button"
                          onClick={() =>
                            setCandidateForm({
                              ...candidateForm,
                              scores: { ...candidateForm.scores, [meta.c4Name]: val },
                            })
                          }
                          className={`w-6 h-6 rounded-lg text-xs font-bold transition-all ${
                            currentVal >= val
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notas de Audición & Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej: Excelente afinación, muy buen carisma. Trabajar en dinámicas suaves..."
                  value={candidateForm.auditionNotes}
                  onChange={(e) => setCandidateForm({ ...candidateForm, auditionNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black text-white shadow-md cursor-pointer"
                  style={{ backgroundColor: pageColor }}
                >
                  Guardar Ficha de Aspirante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW AUDITION SCRIPT / SONG SNIPPET */}
      {viewScriptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Pauta de Audición: {viewScriptModal.title}</span>
              </h3>
              <button
                onClick={() => setViewScriptModal({ isOpen: false, title: '', scriptText: '' })}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {viewScriptModal.requirements && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 mb-1">Requisitos:</h4>
                  <p className="text-amber-800 dark:text-amber-200 whitespace-pre-line leading-relaxed">
                    {viewScriptModal.requirements}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Material de Prueba:
                </h4>
                <pre className="text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {viewScriptModal.scriptText}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* YOUTUBE MODAL */}
      <YouTubeModal
        isOpen={youtubeModal.isOpen}
        onClose={() => setYoutubeModal({ isOpen: false, title: '' })}
        url={youtubeModal.url}
        title={youtubeModal.title}
        subtitle={youtubeModal.subtitle}
        notes={youtubeModal.notes}
      />

      {/* SHARE MODAL (LETTER FORMAT PDF & JPG WITH DUAL LOGOS) */}
      {shareModalCasting && (
        <MinistryCastingShareModal
          isOpen={!!shareModalCasting}
          onClose={() => setShareModalCasting(null)}
          casting={shareModalCasting}
          ministryName={ministryName}
          ministry={ministry}
          pageColor={pageColor}
          config={config}
        />
      )}
    </div>
  );
};
