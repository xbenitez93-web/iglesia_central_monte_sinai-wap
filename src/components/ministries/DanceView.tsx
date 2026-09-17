import React, { useState } from 'react';
import {
  DanceChoreography,
  DanceDancer,
  DanceRehearsal,
  DanceWardrobeItem,
  MinistryWorkPlan,
  MinistryCastingCall,
  ChurchConfig,
  Member,
} from '../../types';
import {
  Sparkles,
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  Shirt,
  Flag,
  Video,
  X,
  Phone,
  CheckCircle2,
  Tag,
  Layers,
  Play,
  ListTodo,
  Award,
  UserCheck,
} from 'lucide-react';
import { YouTubeModal } from '../YouTubeModal';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { PageHeroBanner } from '../PageHeroBanner';
import { getActivePageThemeColor } from '../../lib/pageTheme';
import { MinistryWorkPlanTab } from './MinistryWorkPlanTab';
import { MinistryCastingTab } from './MinistryCastingTab';
import { MinistryMembersDirectoryTab } from './MinistryMembersDirectoryTab';

interface DanceViewProps {
  config: ChurchConfig;
  choreographies: DanceChoreography[];
  dancers: DanceDancer[];
  rehearsals: DanceRehearsal[];
  wardrobe: DanceWardrobeItem[];
  castings?: MinistryCastingCall[];
  plans?: MinistryWorkPlan[];
  members?: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => void;
  onUpdateMember?: (member: Member) => void;
  onAddChoreography: (choreo: Omit<DanceChoreography, 'id'>) => void;
  onUpdateChoreography: (choreo: DanceChoreography) => void;
  onDeleteChoreography: (id: string) => void;
  onAddDancer: (dancer: Omit<DanceDancer, 'id'>) => void;
  onUpdateDancer?: (dancer: DanceDancer) => void;
  onDeleteDancer: (id: string) => void;
  onAddRehearsal: (rehearsal: Omit<DanceRehearsal, 'id'>) => void;
  onUpdateRehearsal?: (rehearsal: DanceRehearsal) => void;
  onDeleteRehearsal: (id: string) => void;
  onAddWardrobeItem: (item: Omit<DanceWardrobeItem, 'id'>) => void;
  onUpdateWardrobeItem?: (item: DanceWardrobeItem) => void;
  onDeleteWardrobeItem: (id: string) => void;
  onAddCasting?: (casting: Omit<MinistryCastingCall, 'id'>) => void;
  onUpdateCasting?: (casting: MinistryCastingCall) => void;
  onDeleteCasting?: (id: string) => void;
  onAddPlan?: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan?: (plan: MinistryWorkPlan) => void;
  onDeletePlan?: (id: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const DanceView: React.FC<DanceViewProps> = ({
  config,
  choreographies,
  dancers,
  rehearsals,
  wardrobe,
  castings = [],
  plans = [],
  members = [],
  onAddMember,
  onUpdateMember,
  onAddChoreography,
  onUpdateChoreography,
  onDeleteChoreography,
  onAddDancer,
  onUpdateDancer,
  onDeleteDancer,
  onAddRehearsal,
  onUpdateRehearsal,
  onDeleteRehearsal,
  onAddWardrobeItem,
  onUpdateWardrobeItem,
  onDeleteWardrobeItem,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'choreographies' | 'members' | 'casting' | 'dancers' | 'rehearsals' | 'wardrobe' | 'plans'>('choreographies');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const pageColor = getActivePageThemeColor('dance', config);

  // Date filters for all tabs
  const [choreoDatePreset, setChoreoDatePreset] = useState<DateFilterPreset>('all');
  const [choreoStartDate, setChoreoStartDate] = useState('');
  const [choreoEndDate, setChoreoEndDate] = useState('');

  const [dancerDatePreset, setDancerDatePreset] = useState<DateFilterPreset>('all');
  const [dancerStartDate, setDancerStartDate] = useState('');
  const [dancerEndDate, setDancerEndDate] = useState('');

  const [rehDatePreset, setRehDatePreset] = useState<DateFilterPreset>('all');
  const [rehStartDate, setRehStartDate] = useState('');
  const [rehEndDate, setRehEndDate] = useState('');

  const [wardrobeDatePreset, setWardrobeDatePreset] = useState<DateFilterPreset>('all');
  const [wardrobeStartDate, setWardrobeStartDate] = useState('');
  const [wardrobeEndDate, setWardrobeEndDate] = useState('');

  // YouTube Modal state
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

  // Modals & Edit states
  const [isChoreoModalOpen, setIsChoreoModalOpen] = useState(false);
  const [editingChoreo, setEditingChoreo] = useState<DanceChoreography | null>(null);

  const [isDancerModalOpen, setIsDancerModalOpen] = useState(false);
  const [editingDancer, setEditingDancer] = useState<DanceDancer | null>(null);

  const [isRehearsalModalOpen, setIsRehearsalModalOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<DanceRehearsal | null>(null);

  const [isWardrobeModalOpen, setIsWardrobeModalOpen] = useState(false);
  const [editingWardrobe, setEditingWardrobe] = useState<DanceWardrobeItem | null>(null);

  // Forms
  const [choreoForm, setChoreoForm] = useState<Omit<DanceChoreography, 'id'>>({
    title: '',
    songTitle: '',
    artist: '',
    duration: '4:00 min',
    difficulty: 'Intermedio',
    implementsUsed: ['Banderas de Gloria'],
    assignedCostume: 'Túnica Blanca y Manto Dorado',
    videoReferenceUrl: '',
    youtubeUrl: '',
    notes: '',
  });

  const [dancerForm, setDancerForm] = useState<Omit<DanceDancer, 'id'>>({
    name: '',
    groupCategory: 'Juvenil',
    roleInGroup: 'Danzarina',
    phone: '',
    status: 'Activa',
  });

  const [rehearsalForm, setRehearsalForm] = useState<Omit<DanceRehearsal, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '17:00 - 19:00',
    location: 'Salón Multiusos',
    choreographyIds: [],
    youtubeUrl: '',
    notes: '',
  });

  const [wardrobeForm, setWardrobeForm] = useState<Omit<DanceWardrobeItem, 'id'>>({
    name: '',
    color: 'Dorado / Blanco',
    category: 'Manto',
    quantity: 12,
    availableSizes: 'Unitalla',
    notes: '',
  });

  // Filtering
  const filteredChoreographies = filterItemsByDate<DanceChoreography>(
    choreographies.filter((c) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (c.title || '').toLowerCase().includes(q) ||
        (c.songTitle ? c.songTitle.toLowerCase().includes(q) : false) ||
        (c.artist ? c.artist.toLowerCase().includes(q) : false)
      );
    }),
    (c: DanceChoreography) => c.date || '2026-01-01',
    choreoDatePreset,
    choreoStartDate,
    choreoEndDate
  );

  const filteredDancers = filterItemsByDate<DanceDancer>(
    dancers.filter((d) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch = (d.name || '').toLowerCase().includes(q);
      const matchesGroup = groupFilter === 'all' || d.groupCategory === groupFilter;
      return matchesSearch && matchesGroup;
    }),
    (d: DanceDancer) => d.date || d.joinDate || '2026-01-01',
    dancerDatePreset,
    dancerStartDate,
    dancerEndDate
  );

  const filteredRehearsals = filterItemsByDate<DanceRehearsal>(
    rehearsals,
    (r: DanceRehearsal) => r.date,
    rehDatePreset,
    rehStartDate,
    rehEndDate
  );

  const filteredWardrobe = filterItemsByDate<DanceWardrobeItem>(
    wardrobe.filter((w) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (w.name || '').toLowerCase().includes(q) ||
        (w.color ? w.color.toLowerCase().includes(q) : false) ||
        (w.category ? w.category.toLowerCase().includes(q) : false)
      );
    }),
    (w: DanceWardrobeItem) => w.date || '2026-01-01',
    wardrobeDatePreset,
    wardrobeStartDate,
    wardrobeEndDate
  );

  // Handlers - Choreographies
  const handleOpenAddChoreo = () => {
    setEditingChoreo(null);
    setChoreoForm({
      title: '',
      songTitle: '',
      artist: '',
      duration: '4:00 min',
      difficulty: 'Intermedio',
      implementsUsed: ['Banderas'],
      assignedCostume: '',
      videoReferenceUrl: '',
      youtubeUrl: '',
      notes: '',
    });
    setIsChoreoModalOpen(true);
  };

  const handleOpenEditChoreo = (c: DanceChoreography) => {
    setEditingChoreo(c);
    setChoreoForm({
      title: c.title,
      songTitle: c.songTitle,
      artist: c.artist,
      duration: c.duration,
      difficulty: c.difficulty,
      implementsUsed: c.implementsUsed || [],
      assignedCostume: c.assignedCostume || '',
      videoReferenceUrl: c.videoReferenceUrl || '',
      youtubeUrl: c.youtubeUrl || c.videoReferenceUrl || '',
      notes: c.notes || '',
    });
    setIsChoreoModalOpen(true);
  };

  const handleChoreoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreoForm.title.trim()) return;

    if (editingChoreo) {
      onUpdateChoreography({
        ...choreoForm,
        id: editingChoreo.id,
      });
    } else {
      onAddChoreography(choreoForm);
    }
    setIsChoreoModalOpen(false);
    setEditingChoreo(null);
  };

  // Handlers - Dancers
  const handleOpenAddDancer = () => {
    setEditingDancer(null);
    setDancerForm({
      name: '',
      groupCategory: 'Juvenil',
      roleInGroup: 'Danzarina',
      phone: '',
      status: 'Activa',
    });
    setIsDancerModalOpen(true);
  };

  const handleOpenEditDancer = (d: DanceDancer) => {
    setEditingDancer(d);
    setDancerForm({
      name: d.name,
      groupCategory: d.groupCategory,
      roleInGroup: d.roleInGroup,
      phone: d.phone || '',
      status: d.status,
    });
    setIsDancerModalOpen(true);
  };

  const handleDancerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dancerForm.name.trim()) return;

    if (editingDancer && onUpdateDancer) {
      onUpdateDancer({
        ...dancerForm,
        id: editingDancer.id,
      });
    } else {
      onAddDancer(dancerForm);
    }
    setIsDancerModalOpen(false);
    setEditingDancer(null);
  };

  // Handlers - Rehearsals
  const handleOpenAddRehearsal = () => {
    setEditingRehearsal(null);
    setRehearsalForm({
      date: new Date().toISOString().split('T')[0],
      time: '17:00 - 19:00',
      location: 'Salón Multiusos',
      choreographyIds: [],
      youtubeUrl: '',
      notes: '',
    });
    setIsRehearsalModalOpen(true);
  };

  const handleOpenEditRehearsal = (r: DanceRehearsal) => {
    setEditingRehearsal(r);
    setRehearsalForm({
      date: r.date,
      time: r.time,
      location: r.location,
      choreographyIds: r.choreographyIds || [],
      youtubeUrl: r.youtubeUrl || '',
      notes: r.notes || '',
    });
    setIsRehearsalModalOpen(true);
  };

  const handleRehearsalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRehearsal && onUpdateRehearsal) {
      onUpdateRehearsal({
        ...rehearsalForm,
        id: editingRehearsal.id,
      });
    } else {
      onAddRehearsal(rehearsalForm);
    }
    setIsRehearsalModalOpen(false);
    setEditingRehearsal(null);
  };

  // Handlers - Wardrobe
  const handleOpenAddWardrobe = () => {
    setEditingWardrobe(null);
    setWardrobeForm({
      name: '',
      color: 'Dorado / Blanco',
      category: 'Manto',
      quantity: 12,
      availableSizes: 'Unitalla',
      notes: '',
    });
    setIsWardrobeModalOpen(true);
  };

  const handleOpenEditWardrobe = (w: DanceWardrobeItem) => {
    setEditingWardrobe(w);
    setWardrobeForm({
      name: w.name,
      color: w.color,
      category: w.category,
      quantity: w.quantity,
      availableSizes: w.availableSizes || 'Unitalla',
      notes: w.notes || '',
    });
    setIsWardrobeModalOpen(true);
  };

  const handleWardrobeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardrobeForm.name.trim()) return;

    if (editingWardrobe && onUpdateWardrobeItem) {
      onUpdateWardrobeItem({
        ...wardrobeForm,
        id: editingWardrobe.id,
      });
    } else {
      onAddWardrobeItem(wardrobeForm);
    }
    setIsWardrobeModalOpen(false);
    setEditingWardrobe(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="dance"
        config={config}
        icon={Sparkles}
        defaultTitle="Danza, Pandero, Mantos y Banderas"
        defaultSubtitle="Catálogo de coreografías, tutoriales y videos de YouTube para ensayos, registro de danzores por categorías, inventario de vestuario y cronograma de ensayos."
        defaultBadge="Ministerio de Danza & Artes"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={handleOpenAddChoreo}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nueva Coreografía</span>
            </button>
            <button
              onClick={handleOpenAddRehearsal}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs border border-white/30 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              style={{
                backgroundColor: `${pageColor}bb`,
                borderColor: `${pageColor}80`,
              }}
            >
              <Clock className="w-4 h-4" />
              <span>Agendar Ensayo</span>
            </button>
          </>
        }
      />

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300/40 dark:border-slate-800/40">
        <button
          onClick={() => setActiveSubTab('choreographies')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'choreographies'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'choreographies' ? pageColor : undefined,
            boxShadow: activeSubTab === 'choreographies' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Sparkles className="w-4 h-4" />
          <span>Coreografías ({choreographies.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('members')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'members'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'members' ? pageColor : undefined,
            boxShadow: activeSubTab === 'members' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <UserCheck className="w-4 h-4" />
          <span>
            Integrantes / Padrón (
            {
              members.filter(
                (m) =>
                  (m.ministries || []).includes('dance') ||
                  m.ministryRoles.some((r) => r.includes('Danza') || r.includes('Pandero') || r.includes('Mantos'))
              ).length
            }
            )
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('casting')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'casting'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'casting' ? pageColor : undefined,
            boxShadow: activeSubTab === 'casting' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Award className="w-4 h-4" />
          <span>Casting & Audiciones ({castings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('dancers')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'dancers'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'dancers' ? pageColor : undefined,
            boxShadow: activeSubTab === 'dancers' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Users className="w-4 h-4" />
          <span>Danzores ({dancers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rehearsals')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'rehearsals'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'rehearsals' ? pageColor : undefined,
            boxShadow: activeSubTab === 'rehearsals' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Clock className="w-4 h-4" />
          <span>Ensayos ({rehearsals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('wardrobe')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'wardrobe'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'wardrobe' ? pageColor : undefined,
            boxShadow: activeSubTab === 'wardrobe' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Shirt className="w-4 h-4" />
          <span>Vestuario & Mantos ({wardrobe.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('plans')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'plans'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'plans' ? pageColor : undefined,
            boxShadow: activeSubTab === 'plans' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <ListTodo className="w-4 h-4" />
          <span>Plan de Trabajo ({plans.length})</span>
        </button>
      </div>

      {/* 1. COREOGRAFÍAS TAB */}
      {activeSubTab === 'choreographies' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por coreografía, canción o artista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddChoreo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Coreografía</span>
            </button>
          </div>

          {/* Date Filter for Choreographies */}
          <DateFilterControl
            preset={choreoDatePreset}
            onPresetChange={setChoreoDatePreset}
            startDate={choreoStartDate}
            onStartDateChange={setChoreoStartDate}
            endDate={choreoEndDate}
            onEndDateChange={setChoreoEndDate}
            label="Filtrar Coreografías por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredChoreographies.map((c) => {
              const videoUrl = c.youtubeUrl || c.videoReferenceUrl;
              return (
                <div
                  key={c.id}
                  className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-pink-100 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800">
                          {c.difficulty}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                          {c.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Canción: <strong>{c.songTitle}</strong> {c.artist ? `(${c.artist})` : ''}
                        </p>
                        {c.date && (
                          <p className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">📅 {c.date}</p>
                        )}
                      </div>

                      <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                        ⏱️ {c.duration}
                      </span>
                    </div>

                    {/* Implements Tags */}
                    {c.implementsUsed && c.implementsUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.implementsUsed.map((imp, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-100 dark:border-rose-900/40"
                          >
                            🚩 {imp}
                          </span>
                        ))}
                      </div>
                    )}

                    {c.assignedCostume && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                        👗 <strong>Vestuario:</strong> {c.assignedCostume}
                      </p>
                    )}

                    {c.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                        💡 {c.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {/* YouTube Button */}
                    <button
                      onClick={() =>
                        setYoutubeModal({
                          isOpen: true,
                          url: videoUrl,
                          title: c.title,
                          subtitle: `Canción: ${c.songTitle} • Dificultad: ${c.difficulty}`,
                          notes: c.notes,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>{videoUrl ? 'Ver Video en YouTube' : 'Buscar Guía en YouTube'}</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditChoreo(c)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 cursor-pointer"
                        title="Editar Coreografía"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteChoreography(c.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar Coreografía"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredChoreographies.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Sparkles className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay coreografías registradas para este rango de fechas
              </h3>
            </div>
          )}
        </div>
      )}

      {/* CASTING & AUDICIONES TAB */}
      {activeSubTab === 'casting' && (
        <MinistryCastingTab
          ministry="dance"
          ministryName="Ministerio de Danza & Artes"
          castings={castings}
          referenceItems={choreographies.map((c) => ({ id: c.id, title: `${c.title} (${c.songTitle})` }))}
          pageColor={pageColor}
          config={config}
          onAddCasting={(c) => onAddCasting && onAddCasting({ ...c, ministry: 'dance' })}
          onUpdateCasting={(c) => onUpdateCasting && onUpdateCasting(c)}
          onDeleteCasting={(id) => onDeleteCasting && onDeleteCasting(id)}
          onAddDancer={onAddDancer}
        />
      )}

      {/* 2. DANZARINAS TAB */}
      {activeSubTab === 'dancers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar danzarina..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">Todas las Categorías</option>
                <option value="Infantil / Semillitas">Infantil / Semillitas</option>
                <option value="Juvenil">Juvenil</option>
                <option value="Damas / Adultas">Damas / Adultas</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddDancer}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Danzores</span>
            </button>
          </div>

          {/* Date Filter for Dancers */}
          <DateFilterControl
            preset={dancerDatePreset}
            onPresetChange={setDancerDatePreset}
            startDate={dancerStartDate}
            onStartDateChange={setDancerStartDate}
            endDate={dancerEndDate}
            onEndDateChange={setDancerEndDate}
            label="Filtrar Danzarinas por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredDancers.map((d) => (
              <div
                key={d.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-extrabold text-[10px]">
                      {d.groupCategory}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.status === 'Activa'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {d.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{d.name}</h4>
                  <p className="text-xs text-pink-600 dark:text-pink-400 font-semibold">{d.roleInGroup}</p>
                  {(d.date || d.joinDate) && (
                    <p className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">📅 {d.date || d.joinDate}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {d.phone ? (
                    <a
                      href={`tel:${d.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-pink-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{d.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditDancer(d)}
                      className="p-1 rounded-lg text-slate-400 hover:text-pink-600 cursor-pointer"
                      title="Editar Danzarina"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDancer(d.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Danzarina"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDancers.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay danzarinas encontradas para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 3. ENSAYOS TAB */}
      {activeSubTab === 'rehearsals' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cronograma de Ensayos de Danza</h3>
              <p className="text-xs text-slate-500">Prácticas de pasos, patrones y dinámicas con pandero y mantos</p>
            </div>
            <button
              onClick={handleOpenAddRehearsal}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Ensayo</span>
            </button>
          </div>

          {/* Date Filter Control */}
          <DateFilterControl
            preset={rehDatePreset}
            onPresetChange={setRehDatePreset}
            startDate={rehStartDate}
            onStartDateChange={setRehStartDate}
            endDate={rehEndDate}
            onEndDateChange={setRehEndDate}
            label="Filtrar Ensayos de Danza por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRehearsals.map((r) => (
              <div
                key={r.id}
                className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2.5 py-1 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300 font-extrabold text-xs">
                        📅 {r.date} • ⏰ {r.time}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                        Lugar: {r.location}
                      </h4>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditRehearsal(r)}
                        className="p-1 rounded-lg text-slate-400 hover:text-pink-600 cursor-pointer"
                        title="Editar Ensayo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteRehearsal(r.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar Ensayo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                      📝 {r.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setYoutubeModal({
                        isOpen: true,
                        url: r.youtubeUrl,
                        title: `Ensayo de Danza: ${r.date} • ${r.location}`,
                        subtitle: 'Tutorial y guía de pasos en video',
                        notes: r.notes,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                    <span>{r.youtubeUrl ? 'Ver Video en YouTube' : 'Buscar Tutorial en YouTube'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRehearsals.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay ensayos de danza en el rango de fechas seleccionado
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 4. VESTUARIO & IMPLEMENTOS TAB */}
      {activeSubTab === 'wardrobe' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Inventario de Vestuario e Implementos</h3>
              <p className="text-xs text-slate-500">Mantos, panderos, túnicas, banderas y cintas sagradas</p>
            </div>
            <button
              onClick={handleOpenAddWardrobe}
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Implemento</span>
            </button>
          </div>

          {/* Date Filter for Wardrobe */}
          <DateFilterControl
            preset={wardrobeDatePreset}
            onPresetChange={setWardrobeDatePreset}
            startDate={wardrobeStartDate}
            onStartDateChange={setWardrobeStartDate}
            endDate={wardrobeEndDate}
            onEndDateChange={setWardrobeEndDate}
            label="Filtrar Inventario por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredWardrobe.map((w) => (
              <div
                key={w.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                      {w.category}
                    </span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      Cant: {w.quantity}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{w.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">🎨 Color: {w.color}</p>
                  {w.availableSizes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">📏 Tallas: {w.availableSizes}</p>
                  )}
                  {w.date && (
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">📅 {w.date}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    {w.notes ? `💡 ${w.notes}` : 'Disponible'}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditWardrobe(w)}
                      className="p-1 rounded-lg text-slate-400 hover:text-pink-600 cursor-pointer"
                      title="Editar Implemento"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteWardrobeItem(w.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Implemento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredWardrobe.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Shirt className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay implementos o vestuario encontrados para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* PADRÓN DE MIEMBROS TAB */}
      {activeSubTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId="dance"
          ministryName="Danza & Artes Escénicas"
          themeColor={pageColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {/* 5. PLAN DE TRABAJO TAB */}
      {activeSubTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry="dance"
          ministryName="Ministerio de Danza"
          pageColor={pageColor}
          plans={plans.filter((p) => p.ministry === 'dance')}
          onAddPlan={(plan) => onAddPlan && onAddPlan({ ...plan, ministry: 'dance' })}
          onUpdatePlan={(plan) => onUpdatePlan && onUpdatePlan(plan)}
          onDeletePlan={(id) => onDeletePlan && onDeletePlan(id)}
          availableLeaders={dancers.map((d) => d.name)}
          config={config}
        />
      )}

      {/* CHOREOGRAPHY MODAL */}
      {isChoreoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-600" />
                <span>{editingChoreo ? 'Editar Coreografía' : 'Nueva Coreografía de Danza'}</span>
              </h3>
              <button onClick={() => setIsChoreoModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChoreoSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre de la Coreografía *</label>
                <input
                  type="text"
                  required
                  value={choreoForm.title}
                  onChange={(e) => setChoreoForm({ ...choreoForm, title: e.target.value })}
                  placeholder="Ej. Rios de Gloria / Danza de Victoria"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Canción *</label>
                  <input
                    type="text"
                    required
                    value={choreoForm.songTitle}
                    onChange={(e) => setChoreoForm({ ...choreoForm, songTitle: e.target.value })}
                    placeholder="Ej. La Cosecha"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Artista / Autor</label>
                  <input
                    type="text"
                    value={choreoForm.artist}
                    onChange={(e) => setChoreoForm({ ...choreoForm, artist: e.target.value })}
                    placeholder="Ej. Marcos Witt"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dificultad</label>
                  <select
                    value={choreoForm.difficulty}
                    onChange={(e) => setChoreoForm({ ...choreoForm, difficulty: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Duración Aproximada</label>
                  <input
                    type="text"
                    value={choreoForm.duration}
                    onChange={(e) => setChoreoForm({ ...choreoForm, duration: e.target.value })}
                    placeholder="Ej. 4:15 min"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video para Ensayo (YouTube, Facebook, TikTok, Instagram, etc.)</span>
                </label>
                <input
                  type="url"
                  value={choreoForm.youtubeUrl || choreoForm.videoReferenceUrl || ''}
                  onChange={(e) =>
                    setChoreoForm({
                      ...choreoForm,
                      youtubeUrl: e.target.value,
                      videoReferenceUrl: e.target.value,
                    })
                  }
                  placeholder="https://... (YouTube, Facebook, TikTok, Instagram o MP4)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Vestuario Asignado</label>
                <input
                  type="text"
                  value={choreoForm.assignedCostume}
                  onChange={(e) => setChoreoForm({ ...choreoForm, assignedCostume: e.target.value })}
                  placeholder="Ej. Túnica Blanca, Manto Azul Rey y Corona Dorada"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Patrones de Danza</label>
                <textarea
                  rows={3}
                  value={choreoForm.notes || ''}
                  onChange={(e) => setChoreoForm({ ...choreoForm, notes: e.target.value })}
                  placeholder="Instrucciones sobre formación, entradas y salidas..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsChoreoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold"
                >
                  {editingChoreo ? 'Guardar Cambios' : 'Registrar Coreografía'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DANCER MODAL */}
      {isDancerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-600" />
                <span>{editingDancer ? 'Editar Danzarina' : 'Registrar Danzarina'}</span>
              </h3>
              <button onClick={() => setIsDancerModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDancerSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={dancerForm.name}
                  onChange={(e) => setDancerForm({ ...dancerForm, name: e.target.value })}
                  placeholder="Ej. Sofía Benítez"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={dancerForm.groupCategory}
                    onChange={(e) => setDancerForm({ ...dancerForm, groupCategory: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Infantil / Semillitas">Infantil / Semillitas</option>
                    <option value="Juvenil">Juvenil</option>
                    <option value="Damas / Adultas">Damas / Adultas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rol en el Grupo</label>
                  <select
                    value={dancerForm.roleInGroup}
                    onChange={(e) => setDancerForm({ ...dancerForm, roleInGroup: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Líder / Coreógrafa">Líder / Coreógrafa</option>
                    <option value="Capitana de Fila">Capitana de Fila</option>
                    <option value="Danzarina">Danzarina</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={dancerForm.phone || ''}
                  onChange={(e) => setDancerForm({ ...dancerForm, phone: e.target.value })}
                  placeholder="555-123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado</label>
                <select
                  value={dancerForm.status}
                  onChange={(e) => setDancerForm({ ...dancerForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Activa">Activa</option>
                  <option value="En Preparación">En Preparación</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDancerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold"
                >
                  {editingDancer ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REHEARSAL MODAL */}
      {isRehearsalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-pink-600" />
                <span>{editingRehearsal ? 'Editar Ensayo de Danza' : 'Programar Ensayo de Danza'}</span>
              </h3>
              <button onClick={() => setIsRehearsalModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRehearsalSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={rehearsalForm.date}
                    onChange={(e) => setRehearsalForm({ ...rehearsalForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Horario *</label>
                  <input
                    type="text"
                    required
                    value={rehearsalForm.time}
                    onChange={(e) => setRehearsalForm({ ...rehearsalForm, time: e.target.value })}
                    placeholder="17:00 - 19:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lugar</label>
                <input
                  type="text"
                  value={rehearsalForm.location}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, location: e.target.value })}
                  placeholder="Salón Multiusos / Templo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video para Ensayo (YouTube, Facebook, TikTok, Instagram, etc.)</span>
                </label>
                <input
                  type="url"
                  value={rehearsalForm.youtubeUrl || ''}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, youtubeUrl: e.target.value })}
                  placeholder="https://... (YouTube, Facebook, TikTok, Instagram o MP4)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Implementos requeridos</label>
                <textarea
                  rows={3}
                  value={rehearsalForm.notes || ''}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, notes: e.target.value })}
                  placeholder="Traer pandero y faja de ensayo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRehearsalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold"
                >
                  {editingRehearsal ? 'Guardar Cambios' : 'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WARDROBE MODAL */}
      {isWardrobeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Shirt className="w-5 h-5 text-pink-600" />
                <span>{editingWardrobe ? 'Editar Implemento' : 'Registrar Implemento / Vestuario'}</span>
              </h3>
              <button onClick={() => setIsWardrobeModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWardrobeSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre del Elemento *</label>
                <input
                  type="text"
                  required
                  value={wardrobeForm.name}
                  onChange={(e) => setWardrobeForm({ ...wardrobeForm, name: e.target.value })}
                  placeholder="Ej. Manto de Adoración Real"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={wardrobeForm.category}
                    onChange={(e) => setWardrobeForm({ ...wardrobeForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Manto">Manto</option>
                    <option value="Banderas">Banderas</option>
                    <option value="Panderos">Panderos</option>
                    <option value="Vestido">Vestido</option>
                    <option value="Cintas">Cintas</option>
                    <option value="Túnica">Túnica</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Cantidad *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={wardrobeForm.quantity}
                    onChange={(e) => setWardrobeForm({ ...wardrobeForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Color Principal</label>
                  <input
                    type="text"
                    value={wardrobeForm.color}
                    onChange={(e) => setWardrobeForm({ ...wardrobeForm, color: e.target.value })}
                    placeholder="Ej. Dorado / Blanco"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tallas Disponibles</label>
                  <input
                    type="text"
                    value={wardrobeForm.availableSizes || ''}
                    onChange={(e) => setWardrobeForm({ ...wardrobeForm, availableSizes: e.target.value })}
                    placeholder="Unitalla / S, M, L"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Estado</label>
                <input
                  type="text"
                  value={wardrobeForm.notes || ''}
                  onChange={(e) => setWardrobeForm({ ...wardrobeForm, notes: e.target.value })}
                  placeholder="Ej: En estante 2, lavados y listos"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWardrobeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold"
                >
                  {editingWardrobe ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* YOUTUBE MODAL */}
      <YouTubeModal
        isOpen={youtubeModal.isOpen}
        onClose={() => setYoutubeModal({ isOpen: false, title: '' })}
        videoUrl={youtubeModal.url}
        title={youtubeModal.title}
        subtitle={youtubeModal.subtitle}
        notes={youtubeModal.notes}
      />
    </div>
  );
};
