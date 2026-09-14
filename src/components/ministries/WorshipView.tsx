import React, { useState } from 'react';
import {
  WorshipSong,
  WorshipMusician,
  WorshipRehearsal,
  WorshipServiceSchedule,
  MinistryWorkPlan,
  MinistryCastingCall,
  ChurchConfig,
  Member,
} from '../../types';
import {
  Music,
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  ExternalLink,
  Mic,
  FileText,
  Volume2,
  Sparkles,
  Phone,
  CheckCircle2,
  X,
  Play,
  ListMusic,
  Share2,
  Video,
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

interface WorshipViewProps {
  config: ChurchConfig;
  songs: WorshipSong[];
  musicians: WorshipMusician[];
  rehearsals: WorshipRehearsal[];
  schedules: WorshipServiceSchedule[];
  castings?: MinistryCastingCall[];
  plans?: MinistryWorkPlan[];
  members?: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => void;
  onUpdateMember?: (member: Member) => void;
  onAddSong: (song: Omit<WorshipSong, 'id'>) => void;
  onUpdateSong: (song: WorshipSong) => void;
  onDeleteSong: (id: string) => void;
  onAddMusician: (musician: Omit<WorshipMusician, 'id'>) => void;
  onUpdateMusician?: (musician: WorshipMusician) => void;
  onDeleteMusician: (id: string) => void;
  onAddRehearsal: (rehearsal: Omit<WorshipRehearsal, 'id'>) => void;
  onUpdateRehearsal?: (rehearsal: WorshipRehearsal) => void;
  onDeleteRehearsal: (id: string) => void;
  onAddSchedule: (schedule: Omit<WorshipServiceSchedule, 'id'>) => void;
  onUpdateSchedule?: (schedule: WorshipServiceSchedule) => void;
  onDeleteSchedule: (id: string) => void;
  onAddCasting?: (casting: Omit<MinistryCastingCall, 'id'>) => void;
  onUpdateCasting?: (casting: MinistryCastingCall) => void;
  onDeleteCasting?: (id: string) => void;
  onAddPlan?: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan?: (plan: MinistryWorkPlan) => void;
  onDeletePlan?: (id: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const WorshipView: React.FC<WorshipViewProps> = ({
  config,
  songs,
  musicians,
  rehearsals,
  schedules,
  castings = [],
  plans = [],
  members = [],
  onAddMember,
  onUpdateMember,
  onAddSong,
  onUpdateSong,
  onDeleteSong,
  onAddMusician,
  onUpdateMusician,
  onDeleteMusician,
  onAddRehearsal,
  onUpdateRehearsal,
  onDeleteRehearsal,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'songs' | 'members' | 'casting' | 'musicians' | 'rehearsals' | 'schedules' | 'plans'>('songs');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [toneFilter, setToneFilter] = useState<string>('all');
  const pageColor = getActivePageThemeColor('worship', config);

  // Date filters for all tabs
  const [songDatePreset, setSongDatePreset] = useState<DateFilterPreset>('all');
  const [songStartDate, setSongStartDate] = useState('');
  const [songEndDate, setSongEndDate] = useState('');

  const [musicianDatePreset, setMusicianDatePreset] = useState<DateFilterPreset>('all');
  const [musicianStartDate, setMusicianStartDate] = useState('');
  const [musicianEndDate, setMusicianEndDate] = useState('');

  const [rehDatePreset, setRehDatePreset] = useState<DateFilterPreset>('all');
  const [rehStartDate, setRehStartDate] = useState('');
  const [rehEndDate, setRehEndDate] = useState('');

  const [schDatePreset, setSchDatePreset] = useState<DateFilterPreset>('all');
  const [schStartDate, setSchStartDate] = useState('');
  const [schEndDate, setSchEndDate] = useState('');

  // YouTube Modal State
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

  // Modals & Edit States
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<WorshipSong | null>(null);
  const [viewLyricsSong, setViewLyricsSong] = useState<WorshipSong | null>(null);

  const [isMusicianModalOpen, setIsMusicianModalOpen] = useState(false);
  const [editingMusician, setEditingMusician] = useState<WorshipMusician | null>(null);

  const [isRehearsalModalOpen, setIsRehearsalModalOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<WorshipRehearsal | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WorshipServiceSchedule | null>(null);

  // Forms
  const [songForm, setSongForm] = useState<Omit<WorshipSong, 'id'>>({
    title: '',
    artist: '',
    tone: 'G (Sol Mayor)',
    bpm: 70,
    category: 'Adoración',
    lyrics: '',
    chordsUrl: '',
    youtubeUrl: '',
    notes: '',
  });

  const [musicianForm, setMusicianForm] = useState<Omit<WorshipMusician, 'id'>>({
    name: '',
    role: 'Voz Principal',
    phone: '',
    status: 'Activo',
  });

  const [rehearsalForm, setRehearsalForm] = useState<Omit<WorshipRehearsal, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '19:00 - 21:00',
    location: 'Santuario Principal',
    songIds: [],
    directorName: '',
    youtubeUrl: '',
    notes: '',
  });

  const [scheduleForm, setScheduleForm] = useState<Omit<WorshipServiceSchedule, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    serviceType: 'Culto Dominical Mañana',
    worshipLeader: '',
    songIds: [],
    musicians: [],
    youtubeUrl: '',
    notes: '',
  });

  // Filter songs by search, category, tone, and date
  const filteredSongs = filterItemsByDate<WorshipSong>(
    songs.filter((s) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist ? s.artist.toLowerCase().includes(q) : false) ||
        (s.lyrics ? s.lyrics.toLowerCase().includes(q) : false);
      const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
      const matchesTone =
        toneFilter === 'all' || (s.tone ? s.tone.toLowerCase().includes((toneFilter || '').toLowerCase()) : false);
      return matchesSearch && matchesCategory && matchesTone;
    }),
    (s: WorshipSong) => s.date || '2026-01-01',
    songDatePreset,
    songStartDate,
    songEndDate
  );

  // Filter musicians
  const filteredMusicians = filterItemsByDate<WorshipMusician>(
    musicians.filter((m) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (m.name || '').toLowerCase().includes(q) ||
        (m.role ? m.role.toLowerCase().includes(q) : false) ||
        (m.instrument ? m.instrument.toLowerCase().includes(q) : false);
      return matchesSearch;
    }),
    (m: WorshipMusician) => m.date || m.joinDate || '2026-01-01',
    musicianDatePreset,
    musicianStartDate,
    musicianEndDate
  );

  // Filter rehearsals by date
  const filteredRehearsals = filterItemsByDate<WorshipRehearsal>(
    rehearsals,
    (r: WorshipRehearsal) => r.date,
    rehDatePreset,
    rehStartDate,
    rehEndDate
  );

  // Filter schedules by date
  const filteredSchedules = filterItemsByDate<WorshipServiceSchedule>(
    schedules,
    (s: WorshipServiceSchedule) => s.date,
    schDatePreset,
    schStartDate,
    schEndDate
  );

  // Handlers - Songs
  const handleOpenAddSong = () => {
    setEditingSong(null);
    setSongForm({
      title: '',
      artist: '',
      tone: 'G (Sol Mayor)',
      bpm: 70,
      category: 'Adoración',
      lyrics: '',
      chordsUrl: '',
      youtubeUrl: '',
      notes: '',
    });
    setIsSongModalOpen(true);
  };

  const handleOpenEditSong = (song: WorshipSong) => {
    setEditingSong(song);
    setSongForm({
      title: song.title,
      artist: song.artist,
      tone: song.tone,
      bpm: song.bpm || 70,
      category: song.category,
      lyrics: song.lyrics || '',
      chordsUrl: song.chordsUrl || '',
      youtubeUrl: song.youtubeUrl || '',
      notes: song.notes || '',
    });
    setIsSongModalOpen(true);
  };

  const handleSongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!songForm.title.trim()) return;

    if (editingSong) {
      onUpdateSong({
        ...songForm,
        id: editingSong.id,
      });
    } else {
      onAddSong(songForm);
    }

    setIsSongModalOpen(false);
    setEditingSong(null);
  };

  // Handlers - Musicians
  const handleOpenAddMusician = () => {
    setEditingMusician(null);
    setMusicianForm({ name: '', role: 'Voz Principal', phone: '', status: 'Activo' });
    setIsMusicianModalOpen(true);
  };

  const handleOpenEditMusician = (musician: WorshipMusician) => {
    setEditingMusician(musician);
    setMusicianForm({
      name: musician.name,
      role: musician.role,
      phone: musician.phone || '',
      status: musician.status,
    });
    setIsMusicianModalOpen(true);
  };

  const handleMusicianSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!musicianForm.name.trim()) return;

    if (editingMusician && onUpdateMusician) {
      onUpdateMusician({
        ...musicianForm,
        id: editingMusician.id,
      });
    } else {
      onAddMusician(musicianForm);
    }
    setIsMusicianModalOpen(false);
    setEditingMusician(null);
  };

  // Handlers - Rehearsals
  const handleOpenAddRehearsal = () => {
    setEditingRehearsal(null);
    setRehearsalForm({
      date: new Date().toISOString().split('T')[0],
      time: '19:00 - 21:00',
      location: 'Santuario Principal',
      songIds: [],
      directorName: '',
      youtubeUrl: '',
      notes: '',
    });
    setIsRehearsalModalOpen(true);
  };

  const handleOpenEditRehearsal = (reh: WorshipRehearsal) => {
    setEditingRehearsal(reh);
    setRehearsalForm({
      date: reh.date,
      time: reh.time,
      location: reh.location,
      songIds: reh.songIds || [],
      directorName: reh.directorName || '',
      youtubeUrl: reh.youtubeUrl || '',
      notes: reh.notes || '',
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

  // Handlers - Schedules
  const handleOpenAddSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      date: new Date().toISOString().split('T')[0],
      serviceType: 'Culto Dominical Mañana',
      worshipLeader: '',
      songIds: [],
      musicians: [],
      youtubeUrl: '',
      notes: '',
    });
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (sch: WorshipServiceSchedule) => {
    setEditingSchedule(sch);
    setScheduleForm({
      date: sch.date,
      serviceType: sch.serviceType,
      worshipLeader: sch.worshipLeader,
      songIds: sch.songIds || [],
      musicians: sch.musicians || [],
      youtubeUrl: sch.youtubeUrl || '',
      notes: sch.notes || '',
    });
    setIsScheduleModalOpen(true);
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSchedule && onUpdateSchedule) {
      onUpdateSchedule({
        ...scheduleForm,
        id: editingSchedule.id,
      });
    } else {
      onAddSchedule(scheduleForm);
    }
    setIsScheduleModalOpen(false);
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="worship"
        config={config}
        icon={Music}
        defaultTitle="Ministerio de Alabanza & Adoración"
        defaultSubtitle="Cancionero con tonos, acordes y enlaces a YouTube, control de músicos, programación de ensayos con filtros por fecha y cronogramas de servicios."
        defaultBadge="Ministerio de Alabanza & Adoración"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={handleOpenAddSong}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nueva Canción</span>
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

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300/40 dark:border-slate-800/40">
        <button
          onClick={() => setActiveSubTab('songs')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'songs'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'songs' ? pageColor : undefined,
            boxShadow: activeSubTab === 'songs' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Music className="w-4 h-4" />
          <span>Cancionero & Tonos ({songs.length})</span>
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
                  (m.ministries || []).includes('worship') ||
                  m.ministryRoles.some(
                    (r) =>
                      r.includes('Alabanza') ||
                      r.includes('Músico') ||
                      r.includes('Voz') ||
                      r.includes('Coro')
                  )
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
          onClick={() => setActiveSubTab('musicians')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'musicians'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'musicians' ? pageColor : undefined,
            boxShadow: activeSubTab === 'musicians' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Users className="w-4 h-4" />
          <span>Músicos y Voces ({musicians.length})</span>
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
          <span>Ensayos & Prácticas ({rehearsals.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'schedules'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'schedules' ? pageColor : undefined,
            boxShadow: activeSubTab === 'schedules' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Calendar className="w-4 h-4" />
          <span>Programación de Cultos ({schedules.length})</span>
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

      {/* 1. CANCIONERO TAB */}
      {activeSubTab === 'songs' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar por título, autor o letra..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">Todas las categorías</option>
                <option value="Adoración">Adoración</option>
                <option value="Júbilo">Júbilo</option>
                <option value="Apertura">Apertura</option>
                <option value="Comunión">Comunión</option>
                <option value="Ofrenda">Ofrenda</option>
                <option value="Especial">Especial</option>
              </select>

              <select
                value={toneFilter}
                onChange={(e) => setToneFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">Cualquier Tono</option>
                <option value="C">Do (C)</option>
                <option value="D">Re (D)</option>
                <option value="E">Mi (E)</option>
                <option value="F">Fa (F)</option>
                <option value="G">Sol (G)</option>
                <option value="A">La (A)</option>
                <option value="B">Si (B)</option>
                <option value="m">Menores (m)</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddSong}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Nueva Canción</span>
            </button>
          </div>

          {/* Date Filter for Songs */}
          <DateFilterControl
            preset={songDatePreset}
            onPresetChange={setSongDatePreset}
            startDate={songStartDate}
            onStartDateChange={setSongStartDate}
            endDate={songEndDate}
            onEndDateChange={setSongEndDate}
            label="Filtrar Cancionero por Fecha:"
          />

          {/* Songs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                        {song.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {song.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {song.artist || 'Dominio Público / Tradicional'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs">
                        {song.tone}
                      </span>
                      {song.bpm && (
                        <span className="block text-[10px] text-slate-400 font-semibold mt-0.5">
                          {song.bpm} BPM
                        </span>
                      )}
                    </div>
                  </div>

                  {song.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 line-clamp-2">
                      💡 {song.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* YouTube Video Helper Button */}
                    <button
                      onClick={() =>
                        setYoutubeModal({
                          isOpen: true,
                          url: song.youtubeUrl,
                          title: song.title,
                          subtitle: `${song.artist || ''} • Tono: ${song.tone}`,
                          notes: song.notes,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Ver Video / Tutorial de YouTube"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>YouTube</span>
                    </button>

                    {song.lyrics && (
                      <button
                        onClick={() => setViewLyricsSong(song)}
                        className="px-2.5 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Ver Letra Completa"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Letra</span>
                      </button>
                    )}

                    {song.chordsUrl && (
                      <a
                        href={song.chordsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Ver Acordes"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditSong(song)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                      title="Editar Canción"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSong(song.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Eliminar Canción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredSongs.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Music className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No se encontraron canciones
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Prueba ajustando los filtros de búsqueda o agrega una nueva canción al repertorio.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CASTING & AUDICIONES TAB */}
      {activeSubTab === 'casting' && (
        <MinistryCastingTab
          ministry="worship"
          ministryName="Ministerio de Alabanza & Adoración"
          castings={castings}
          referenceItems={songs.map((s) => ({ id: s.id, title: `${s.title} (${s.tone || 'General'})` }))}
          pageColor={pageColor}
          config={config}
          onAddCasting={(c) => onAddCasting && onAddCasting({ ...c, ministry: 'worship' })}
          onUpdateCasting={(c) => onUpdateCasting && onUpdateCasting(c)}
          onDeleteCasting={(id) => onDeleteCasting && onDeleteCasting(id)}
          onAddMusician={onAddMusician}
        />
      )}

      {/* 2. MÚSICOS & VOCES TAB */}
      {activeSubTab === 'musicians' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Equipo de Músicos y Cantantes</h3>
              <p className="text-xs text-slate-500">Directorio de talentos asignados a la alabanza</p>
            </div>
            <button
              onClick={handleOpenAddMusician}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Músico</span>
            </button>
          </div>

          {/* Date Filter for Musicians */}
          <DateFilterControl
            preset={musicianDatePreset}
            onPresetChange={setMusicianDatePreset}
            startDate={musicianStartDate}
            onStartDateChange={setMusicianStartDate}
            endDate={musicianEndDate}
            onEndDateChange={setMusicianEndDate}
            label="Filtrar Directorio de Músicos por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMusicians.map((m) => (
              <div
                key={m.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        m.status === 'Activo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {m.status}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</h4>
                    <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold">{m.role}</p>
                    {(m.date || m.joinDate) && (
                      <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">📅 {m.date || m.joinDate}</p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-600 dark:text-violet-300 flex items-center justify-center text-xs font-bold">
                    <Mic className="w-4 h-4" />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {m.phone ? (
                    <a
                      href={`tel:${m.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-violet-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{m.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditMusician(m)}
                      className="p-1 rounded-lg text-slate-400 hover:text-violet-600 cursor-pointer"
                      title="Editar Músico"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMusician(m.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Músico"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredMusicians.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay músicos registrados para estos filtros
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
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Ensayos & Prácticas de Banda</h3>
              <p className="text-xs text-slate-500">Cronograma de preparación musical, ensamble y videos de ayuda</p>
            </div>
            <button
              onClick={handleOpenAddRehearsal}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
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
            label="Filtrar Ensayos por Fecha:"
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
                      <span className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-extrabold text-xs">
                        📅 {r.date} • ⏰ {r.time}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                        Lugar: {r.location}
                      </h4>
                      {r.directorName && (
                        <p className="text-xs text-slate-500 mt-0.5">Director: {r.directorName}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditRehearsal(r)}
                        className="p-1 rounded-lg text-slate-400 hover:text-violet-600 cursor-pointer"
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

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setYoutubeModal({
                        isOpen: true,
                        url: r.youtubeUrl,
                        title: `Ensayo: ${r.date} • ${r.location}`,
                        subtitle: r.directorName ? `Director: ${r.directorName}` : 'Guía de ensayo en video',
                        notes: r.notes,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                    <span>{r.youtubeUrl ? 'Ver Video de Ensayo en YouTube' : 'Buscar Tutorial en YouTube'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredRehearsals.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay ensayos registrados para este rango de fechas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Puedes cambiar el filtro de fecha o presionar "Programar Ensayo" para agendar uno nuevo.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. PROGRAMACION DE CULTOS TAB */}
      {activeSubTab === 'schedules' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Programación de Cultos y Setlists</h3>
              <p className="text-xs text-slate-500">Orden de canciones y asignación de directores por servicio</p>
            </div>
            <button
              onClick={handleOpenAddSchedule}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Programación de Servicio</span>
            </button>
          </div>

          {/* Date Filter Control */}
          <DateFilterControl
            preset={schDatePreset}
            onPresetChange={setSchDatePreset}
            startDate={schStartDate}
            onStartDateChange={setSchStartDate}
            endDate={schEndDate}
            onEndDateChange={setSchEndDate}
            label="Filtrar Programación de Cultos por Fecha:"
          />

          <div className="space-y-4">
            {filteredSchedules.map((sc) => (
              <div
                key={sc.id}
                className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-violet-600 uppercase">
                      📅 {sc.date}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {sc.serviceType}
                    </h4>
                    <p className="text-xs text-slate-500">Director de Alabanza: <strong className="text-slate-800 dark:text-slate-200">{sc.worshipLeader}</strong></p>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button
                      onClick={() =>
                        setYoutubeModal({
                          isOpen: true,
                          url: sc.youtubeUrl,
                          title: `Culto: ${sc.serviceType} (${sc.date})`,
                          subtitle: `Director: ${sc.worshipLeader}`,
                          notes: sc.notes,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Ver Video / Setlist en YouTube"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>YouTube</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditSchedule(sc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 cursor-pointer"
                      title="Editar Programación"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteSchedule(sc.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Programación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Setlist Songs */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ListMusic className="w-4 h-4 text-violet-500" />
                      Setlist de Canciones ({sc.songIds.length})
                    </h5>
                    <div className="space-y-1.5">
                      {sc.songIds.map((sId, idx) => {
                        const s = songs.find((x) => x.id === sId);
                        return (
                          <div
                            key={sId}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-medium"
                          >
                            <span>
                              <strong className="text-violet-600 mr-2">{idx + 1}.</strong>
                              {s ? s.title : 'Canción Especial'}
                            </span>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {s ? s.tone : ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Band Members */}
                  <div className="space-y-2">
                    <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-violet-500" />
                      Músicos Convocados
                    </h5>
                    <div className="grid grid-cols-2 gap-1.5">
                      {sc.musicians.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs"
                        >
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">{m.role}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {sc.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-violet-50/50 dark:bg-violet-950/20 p-3 rounded-xl border border-violet-100 dark:border-violet-900/40">
                    📌 {sc.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {filteredSchedules.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay servicios programados para este rango de fechas
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Puedes ajustar el filtro o programar un nuevo servicio dominical o vigilia.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. PADRÓN DE MIEMBROS TAB */}
      {activeSubTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId="worship"
          ministryName="Alabanza & Música"
          themeColor={pageColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {/* 5. PLAN DE TRABAJO TAB */}
      {activeSubTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry="worship"
          ministryName="Ministerio de Alabanza"
          pageColor={pageColor}
          plans={plans.filter((p) => p.ministry === 'worship')}
          onAddPlan={(plan) => onAddPlan && onAddPlan({ ...plan, ministry: 'worship' })}
          onUpdatePlan={(plan) => onUpdatePlan && onUpdatePlan(plan)}
          onDeletePlan={(id) => onDeletePlan && onDeletePlan(id)}
          availableLeaders={musicians.map((m) => m.name)}
          config={config}
        />
      )}

      {/* SONG FORM MODAL */}
      {isSongModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-5 h-5 text-violet-600" />
                <span>{editingSong ? 'Editar Canción' : 'Nueva Canción para el Cancionero'}</span>
              </h3>
              <button onClick={() => setIsSongModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSongSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Título de la Canción *</label>
                <input
                  type="text"
                  required
                  value={songForm.title}
                  onChange={(e) => setSongForm({ ...songForm, title: e.target.value })}
                  placeholder="Ej. Way Maker (Aquí Estás)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Autor / Intérprete</label>
                  <input
                    type="text"
                    value={songForm.artist}
                    onChange={(e) => setSongForm({ ...songForm, artist: e.target.value })}
                    placeholder="Ej. Sinach / Generación 12"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tono Principal *</label>
                  <input
                    type="text"
                    required
                    value={songForm.tone}
                    onChange={(e) => setSongForm({ ...songForm, tone: e.target.value })}
                    placeholder="Ej. E (Mi Mayor) o G"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-violet-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={songForm.category}
                    onChange={(e) => setSongForm({ ...songForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Adoración">Adoración</option>
                    <option value="Júbilo">Júbilo</option>
                    <option value="Apertura">Apertura</option>
                    <option value="Comunión">Comunión</option>
                    <option value="Ofrenda">Ofrenda</option>
                    <option value="Especial">Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">BPM / Tiempo</label>
                  <input
                    type="number"
                    value={songForm.bpm || 70}
                    onChange={(e) => setSongForm({ ...songForm, bpm: parseInt(e.target.value) || 0 })}
                    placeholder="70"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video en YouTube para Ensayo</span>
                </label>
                <input
                  type="url"
                  value={songForm.youtubeUrl || ''}
                  onChange={(e) => setSongForm({ ...songForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Enlace a Cifrado / Acordes</label>
                <input
                  type="url"
                  value={songForm.chordsUrl || ''}
                  onChange={(e) => setSongForm({ ...songForm, chordsUrl: e.target.value })}
                  placeholder="https://la-cuerda.net/..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Letra Completa</label>
                <textarea
                  rows={4}
                  value={songForm.lyrics || ''}
                  onChange={(e) => setSongForm({ ...songForm, lyrics: e.target.value })}
                  placeholder="Escribe o pega aquí la letra de la canción..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Indicaciones para el ensamble</label>
                <input
                  type="text"
                  value={songForm.notes || ''}
                  onChange={(e) => setSongForm({ ...songForm, notes: e.target.value })}
                  placeholder="Ej: Inicia con solo de piano, coro fuerte con toda la banda"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSongModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {editingSong ? 'Guardar Cambios' : 'Registrar Canción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MUSICIAN MODAL */}
      {isMusicianModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-violet-600" />
                <span>{editingMusician ? 'Editar Músico / Cantante' : 'Registrar Músico / Cantante'}</span>
              </h3>
              <button onClick={() => setIsMusicianModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleMusicianSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={musicianForm.name}
                  onChange={(e) => setMusicianForm({ ...musicianForm, name: e.target.value })}
                  placeholder="Ej. Jonathan Morales"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Instrumento / Función *</label>
                <select
                  value={musicianForm.role}
                  onChange={(e) => setMusicianForm({ ...musicianForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Voz Principal">Voz Principal</option>
                  <option value="Coros">Coros / Voces</option>
                  <option value="Piano / Teclado">Piano / Teclado</option>
                  <option value="Guitarra Eléctrica">Guitarra Eléctrica</option>
                  <option value="Guitarra Acústica">Guitarra Acústica</option>
                  <option value="Bajo">Bajo</option>
                  <option value="Batería">Batería</option>
                  <option value="Saxofón">Saxofón / Vientos</option>
                  <option value="Sonido / Consola">Sonido / Consola</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={musicianForm.phone || ''}
                  onChange={(e) => setMusicianForm({ ...musicianForm, phone: e.target.value })}
                  placeholder="555-123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado</label>
                <select
                  value={musicianForm.status}
                  onChange={(e) => setMusicianForm({ ...musicianForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Activo">Activo</option>
                  <option value="Suplente">Suplente</option>
                  <option value="En Capacitación">En Capacitación</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMusicianModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {editingMusician ? 'Guardar Cambios' : 'Registrar'}
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
                <Clock className="w-5 h-5 text-violet-600" />
                <span>{editingRehearsal ? 'Editar Ensayo' : 'Programar Ensayo de Alabanza'}</span>
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
                    placeholder="19:00 - 21:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lugar del Ensayo</label>
                <input
                  type="text"
                  value={rehearsalForm.location}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, location: e.target.value })}
                  placeholder="Santuario Principal / Sala de Música"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Director del Ensayo</label>
                <input
                  type="text"
                  value={rehearsalForm.directorName}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, directorName: e.target.value })}
                  placeholder="Nombre del director de alabanza a cargo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* YouTube Video Guide */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video en YouTube para Ensayo</span>
                </label>
                <input
                  type="url"
                  value={rehearsalForm.youtubeUrl || ''}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas / Canciones a practicar</label>
                <textarea
                  rows={3}
                  value={rehearsalForm.notes || ''}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, notes: e.target.value })}
                  placeholder="Indicar canciones y dinámicas de preparación..."
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
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {editingRehearsal ? 'Guardar Cambios' : 'Agendar Ensayo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                <span>{editingSchedule ? 'Editar Programación de Culto' : 'Nueva Programación de Servicio'}</span>
              </h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha del Servicio *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.date}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tipo de Servicio *</label>
                  <select
                    value={scheduleForm.serviceType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Culto Dominical Mañana">Culto Dominical Mañana</option>
                    <option value="Culto Dominical Noche">Culto Dominical Noche</option>
                    <option value="Culto de Jóvenes">Culto de Jóvenes</option>
                    <option value="Culto de Oración / Miércoles">Culto de Oración / Miércoles</option>
                    <option value="Vigilia Especial">Vigilia Especial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Director(a) de Alabanza *</label>
                <input
                  type="text"
                  required
                  value={scheduleForm.worshipLeader}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, worshipLeader: e.target.value })}
                  placeholder="Ej. Pastor Jonathan / Hna. Sara"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video en YouTube para el Culto / Setlist</span>
                </label>
                <input
                  type="url"
                  value={scheduleForm.youtubeUrl || ''}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              {/* Canciones */}
              <div>
                <label className="block font-semibold mb-1">Seleccionar Canciones del Cancionero</label>
                <div className="max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  {songs.map((s) => {
                    const isSelected = scheduleForm.songIds.includes(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs ${
                          isSelected
                            ? 'bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-200 font-bold'
                            : 'hover:bg-slate-150 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setScheduleForm({ ...scheduleForm, songIds: [...scheduleForm.songIds, s.id] });
                              } else {
                                setScheduleForm({
                                  ...scheduleForm,
                                  songIds: scheduleForm.songIds.filter((id) => id !== s.id),
                                });
                              }
                            }}
                          />
                          <span>{s.title} ({s.artist || 'Tradicional'})</span>
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-bold">
                          {s.tone}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Notas Litúrgicas / Observaciones</label>
                <textarea
                  rows={2}
                  value={scheduleForm.notes || ''}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Ej: Iniciar con momento de gratitud, ofrenda tras la 3era canción..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold"
                >
                  {editingSchedule ? 'Guardar Cambios' : 'Guardar Programación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW LYRICS MODAL */}
      {viewLyricsSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {viewLyricsSong.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewLyricsSong.artist} • Tono: {viewLyricsSong.tone}
                </p>
              </div>
              <button onClick={() => setViewLyricsSong(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
              {viewLyricsSong.lyrics || 'No se ha cargado la letra todavía.'}
            </div>

            <div className="flex justify-between items-center pt-2">
              {viewLyricsSong.youtubeUrl && (
                <button
                  onClick={() => {
                    setYoutubeModal({
                      isOpen: true,
                      url: viewLyricsSong.youtubeUrl,
                      title: viewLyricsSong.title,
                      subtitle: `${viewLyricsSong.artist || ''} • Tono: ${viewLyricsSong.tone}`,
                      notes: viewLyricsSong.notes,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Ver en YouTube</span>
                </button>
              )}

              <button
                onClick={() => setViewLyricsSong(null)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs ml-auto"
              >
                Cerrar Letra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* YOUTUBE REHEARSAL HELPER MODAL */}
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
