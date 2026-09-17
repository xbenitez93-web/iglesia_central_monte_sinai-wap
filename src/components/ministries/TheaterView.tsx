import React, { useState } from 'react';
import {
  TheaterPlay,
  TheaterActor,
  TheaterRehearsal,
  TheaterCastingCall,
  MinistryWorkPlan,
  ChurchConfig,
  Member,
} from '../../types';
import {
  Drama,
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  FileText,
  Video,
  X,
  Phone,
  CheckCircle2,
  Sparkles,
  Clapperboard,
  BookOpen,
  Play,
  Share2,
  ListTodo,
  Award,
  UserCheck,
} from 'lucide-react';
import { YouTubeModal } from '../YouTubeModal';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { PageHeroBanner } from '../PageHeroBanner';
import { getActivePageThemeColor } from '../../lib/pageTheme';
import { MinistryWorkPlanTab } from './MinistryWorkPlanTab';
import { TheaterCastingTab } from './TheaterCastingTab';
import { MinistryMembersDirectoryTab } from './MinistryMembersDirectoryTab';

interface TheaterViewProps {
  config: ChurchConfig;
  plays: TheaterPlay[];
  actors: TheaterActor[];
  rehearsals: TheaterRehearsal[];
  castings?: TheaterCastingCall[];
  plans?: MinistryWorkPlan[];
  members?: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => void;
  onUpdateMember?: (member: Member) => void;
  onAddPlay: (play: Omit<TheaterPlay, 'id'>) => void;
  onUpdatePlay: (play: TheaterPlay) => void;
  onDeletePlay: (id: string) => void;
  onAddActor: (actor: Omit<TheaterActor, 'id'>) => void;
  onUpdateActor?: (actor: TheaterActor) => void;
  onDeleteActor: (id: string) => void;
  onAddRehearsal: (rehearsal: Omit<TheaterRehearsal, 'id'>) => void;
  onUpdateRehearsal?: (rehearsal: TheaterRehearsal) => void;
  onDeleteRehearsal: (id: string) => void;
  onAddCasting?: (casting: Omit<TheaterCastingCall, 'id'>) => void;
  onUpdateCasting?: (casting: TheaterCastingCall) => void;
  onDeleteCasting?: (id: string) => void;
  onAddPlan?: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan?: (plan: MinistryWorkPlan) => void;
  onDeletePlan?: (id: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const TheaterView: React.FC<TheaterViewProps> = ({
  config,
  plays,
  actors,
  rehearsals,
  castings = [],
  plans = [],
  members = [],
  onAddMember,
  onUpdateMember,
  onAddPlay,
  onUpdatePlay,
  onDeletePlay,
  onAddActor,
  onUpdateActor,
  onDeleteActor,
  onAddRehearsal,
  onUpdateRehearsal,
  onDeleteRehearsal,
  onAddCasting,
  onUpdateCasting,
  onDeleteCasting,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'plays' | 'members' | 'casting' | 'actors' | 'rehearsals' | 'plans'>('plays');
  const [searchQuery, setSearchQuery] = useState('');
  const pageColor = getActivePageThemeColor('theater', config);

  // Date filters for all tabs
  const [playDatePreset, setPlayDatePreset] = useState<DateFilterPreset>('all');
  const [playStartDate, setPlayStartDate] = useState('');
  const [playEndDate, setPlayEndDate] = useState('');

  const [actorDatePreset, setActorDatePreset] = useState<DateFilterPreset>('all');
  const [actorStartDate, setActorStartDate] = useState('');
  const [actorEndDate, setActorEndDate] = useState('');

  const [rehDatePreset, setRehDatePreset] = useState<DateFilterPreset>('all');
  const [rehStartDate, setRehStartDate] = useState('');
  const [rehEndDate, setRehEndDate] = useState('');

  // YouTube modal
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

  // Modals & Editing states
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [editingPlay, setEditingPlay] = useState<TheaterPlay | null>(null);
  const [viewScriptPlay, setViewScriptPlay] = useState<TheaterPlay | null>(null);

  const [isActorModalOpen, setIsActorModalOpen] = useState(false);
  const [editingActor, setEditingActor] = useState<TheaterActor | null>(null);

  const [isRehearsalModalOpen, setIsRehearsalModalOpen] = useState(false);
  const [editingRehearsal, setEditingRehearsal] = useState<TheaterRehearsal | null>(null);

  // Forms
  const [playForm, setPlayForm] = useState<Omit<TheaterPlay, 'id'>>({
    title: '',
    genre: 'Evangelístico',
    duration: '15 min',
    director: '',
    synopsis: '',
    script: '',
    status: 'En preparación',
    targetAudience: 'Toda la congregación',
    youtubeUrl: '',
    notes: '',
  });

  const [actorForm, setActorForm] = useState<Omit<TheaterActor, 'id'>>({
    name: '',
    role: 'Actor Principal',
    phone: '',
    status: 'Activo',
  });

  const [rehearsalForm, setRehearsalForm] = useState<Omit<TheaterRehearsal, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    time: '18:00 - 20:00',
    playId: '',
    location: 'Salón de Actos',
    youtubeUrl: '',
    notes: '',
  });

  const filteredPlays = filterItemsByDate<TheaterPlay>(
    plays.filter((p) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.director ? p.director.toLowerCase().includes(q) : false) ||
        (p.genre ? p.genre.toLowerCase().includes(q) : false)
      );
    }),
    (p: TheaterPlay) => p.date || '2026-01-01',
    playDatePreset,
    playStartDate,
    playEndDate
  );

  const filteredActors = filterItemsByDate<TheaterActor>(
    actors.filter((a) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (a.name || '').toLowerCase().includes(q) ||
        (a.role ? a.role.toLowerCase().includes(q) : false)
      );
    }),
    (a: TheaterActor) => a.date || '2026-01-01',
    actorDatePreset,
    actorStartDate,
    actorEndDate
  );

  const filteredRehearsals = filterItemsByDate<TheaterRehearsal>(
    rehearsals,
    (r: TheaterRehearsal) => r.date,
    rehDatePreset,
    rehStartDate,
    rehEndDate
  );

  // Handlers - Plays
  const handleOpenAddPlay = () => {
    setEditingPlay(null);
    setPlayForm({
      title: '',
      genre: 'Evangelístico',
      duration: '15 min',
      director: '',
      synopsis: '',
      script: '',
      status: 'En preparación',
      targetAudience: 'Toda la congregación',
      youtubeUrl: '',
      notes: '',
    });
    setIsPlayModalOpen(true);
  };

  const handleOpenEditPlay = (p: TheaterPlay) => {
    setEditingPlay(p);
    setPlayForm({
      title: p.title,
      genre: p.genre,
      duration: p.duration,
      director: p.director,
      synopsis: p.synopsis,
      script: p.script || '',
      status: p.status,
      targetAudience: p.targetAudience,
      youtubeUrl: p.youtubeUrl || '',
      notes: p.notes || '',
    });
    setIsPlayModalOpen(true);
  };

  const handlePlaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playForm.title.trim()) return;

    if (editingPlay) {
      onUpdatePlay({
        ...playForm,
        id: editingPlay.id,
      });
    } else {
      onAddPlay(playForm);
    }

    setIsPlayModalOpen(false);
    setEditingPlay(null);
  };

  // Handlers - Actors
  const handleOpenAddActor = () => {
    setEditingActor(null);
    setActorForm({ name: '', role: 'Actor Principal', phone: '', status: 'Activo' });
    setIsActorModalOpen(true);
  };

  const handleOpenEditActor = (a: TheaterActor) => {
    setEditingActor(a);
    setActorForm({
      name: a.name,
      role: a.role,
      phone: a.phone || '',
      status: a.status,
    });
    setIsActorModalOpen(true);
  };

  const handleActorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorForm.name.trim()) return;

    if (editingActor && onUpdateActor) {
      onUpdateActor({
        ...actorForm,
        id: editingActor.id,
      });
    } else {
      onAddActor(actorForm);
    }
    setIsActorModalOpen(false);
    setEditingActor(null);
  };

  // Handlers - Rehearsals
  const handleOpenAddRehearsal = () => {
    setEditingRehearsal(null);
    setRehearsalForm({
      date: new Date().toISOString().split('T')[0],
      time: '18:00 - 20:00',
      playId: plays.length > 0 ? plays[0].id : '',
      location: 'Salón de Actos',
      youtubeUrl: '',
      notes: '',
    });
    setIsRehearsalModalOpen(true);
  };

  const handleOpenEditRehearsal = (r: TheaterRehearsal) => {
    setEditingRehearsal(r);
    setRehearsalForm({
      date: r.date,
      time: r.time,
      playId: r.playId,
      location: r.location,
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

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="theater"
        config={config}
        icon={Drama}
        defaultTitle="Obras Teatrales & Dramatizaciones"
        defaultSubtitle="Guiones bíblicos, monólogos, pantomimas, casting de actores, ensayos con filtros por fecha y enlaces de YouTube para practicar escenas y mímicas."
        defaultBadge="Ministerio de Teatro, Drama & Pantomima"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={handleOpenAddPlay}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nueva Obra</span>
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
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
        <button
          onClick={() => setActiveSubTab('plays')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'plays'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'plays' ? pageColor : undefined,
            boxShadow: activeSubTab === 'plays' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Clapperboard className="w-4 h-4" />
          <span>Obras & Guiones ({plays.length})</span>
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
                  (m.ministries || []).includes('theater') ||
                  m.ministryRoles.some((r) => r.includes('Teatro') || r.includes('Drama') || r.includes('Actor'))
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
          <Sparkles className="w-4 h-4" />
          <span>Casting & Audiciones ({castings.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('actors')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'actors'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'actors' ? pageColor : undefined,
            boxShadow: activeSubTab === 'actors' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Users className="w-4 h-4" />
          <span>Elenco & Actores ({actors.length})</span>
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
          <span>Ensayos de Teatro ({rehearsals.length})</span>
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

      {/* 1. OBRAS TAB */}
      {activeSubTab === 'plays' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar obra, director o género..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddPlay}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Nueva Obra</span>
            </button>
          </div>

          {/* Date Filter for Plays */}
          <DateFilterControl
            preset={playDatePreset}
            onPresetChange={setPlayDatePreset}
            startDate={playStartDate}
            onStartDateChange={setPlayStartDate}
            endDate={playEndDate}
            onEndDateChange={setPlayEndDate}
            label="Filtrar Obras por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlays.map((p) => (
              <div
                key={p.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md hover:shadow-lg transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {p.genre}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {p.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Director: <strong>{p.director}</strong>
                      </p>
                    </div>

                    <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs shrink-0">
                      ⏱️ {p.duration}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    📖 <strong>Sinopsis:</strong> {p.synopsis}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Audiencia: {p.targetAudience}</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{p.status}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5">
                    {/* YouTube Button */}
                    <button
                      onClick={() =>
                        setYoutubeModal({
                          isOpen: true,
                          url: p.youtubeUrl,
                          title: p.title,
                          subtitle: `Director: ${p.director} • ${p.genre}`,
                          notes: p.synopsis,
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Ver Ejemplo / Guía en YouTube"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>YouTube</span>
                    </button>

                    {p.script && (
                      <button
                        onClick={() => setViewScriptPlay(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Ver Libreto Completo"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Libreto</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditPlay(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 cursor-pointer"
                      title="Editar Obra"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePlay(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Obra"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPlays.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Clapperboard className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay obras teatrales encontradas para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 2. CASTING & AUDICIONES TAB */}
      {activeSubTab === 'casting' && (
        <TheaterCastingTab
          castings={castings}
          plays={plays}
          actors={actors}
          pageColor={pageColor}
          config={config}
          onAddCasting={(casting) => onAddCasting && onAddCasting(casting)}
          onUpdateCasting={(casting) => onUpdateCasting && onUpdateCasting(casting)}
          onDeleteCasting={(id) => onDeleteCasting && onDeleteCasting(id)}
          onAddActor={onAddActor}
        />
      )}

      {/* 3. ACTORES TAB */}
      {activeSubTab === 'actors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Elenco y Actores de Drama</h3>
              <p className="text-xs text-slate-500">Talentos dedicados al ministerio de actuación</p>
            </div>
            <button
              onClick={handleOpenAddActor}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Actor</span>
            </button>
          </div>

          {/* Date Filter for Actors */}
          <DateFilterControl
            preset={actorDatePreset}
            onPresetChange={setActorDatePreset}
            startDate={actorStartDate}
            onStartDateChange={setActorStartDate}
            endDate={actorEndDate}
            onEndDateChange={setActorEndDate}
            label="Filtrar Actores por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredActors.map((a) => (
              <div
                key={a.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
                      {a.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        a.status === 'Activo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{a.name}</h4>
                  {a.date && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">📅 {a.date}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {a.phone ? (
                    <a
                      href={`tel:${a.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-amber-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{a.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditActor(a)}
                      className="p-1 rounded-lg text-slate-400 hover:text-amber-600 cursor-pointer"
                      title="Editar Actor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteActor(a.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Actor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActors.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay actores encontrados para estos filtros
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
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Ensayos y Prácticas de Escenas</h3>
              <p className="text-xs text-slate-500">Cronograma de preparación actoral y vestuario con filtros por fecha</p>
            </div>
            <button
              onClick={handleOpenAddRehearsal}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Ensayo</span>
            </button>
          </div>

          {/* Date Filter */}
          <DateFilterControl
            preset={rehDatePreset}
            onPresetChange={setRehDatePreset}
            startDate={rehStartDate}
            onStartDateChange={setRehStartDate}
            endDate={rehEndDate}
            onEndDateChange={setRehEndDate}
            label="Filtrar Ensayos de Teatro por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRehearsals.map((r) => {
              const play = plays.find((x) => x.id === r.playId);
              return (
                <div
                  key={r.id}
                  className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-xs">
                          📅 {r.date} • ⏰ {r.time}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2">
                          Obra: {play ? play.title : 'Ensayo General de Mímica'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">Lugar: {r.location}</p>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditRehearsal(r)}
                          className="p-1 rounded-lg text-slate-400 hover:text-amber-600 cursor-pointer"
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
                          url: r.youtubeUrl || play?.youtubeUrl,
                          title: `Ensayo: ${play?.title || 'Teatro'} (${r.date})`,
                          subtitle: `Lugar: ${r.location}`,
                          notes: r.notes,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>{r.youtubeUrl || play?.youtubeUrl ? 'Ver Video en YouTube' : 'Buscar Referencia en YouTube'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredRehearsals.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay ensayos de teatro agendados en el rango de fechas seleccionado
              </h3>
            </div>
          )}
        </div>
      )}

      {/* PADRÓN DE MIEMBROS TAB */}
      {activeSubTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId="theater"
          ministryName="Teatro & Pantomima"
          themeColor={pageColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {/* 4. PLAN DE TRABAJO TAB */}
      {activeSubTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry="theater"
          ministryName="Ministerio de Teatro & Pantomima"
          pageColor={pageColor}
          plans={plans.filter((p) => p.ministry === 'theater')}
          onAddPlan={(plan) => onAddPlan && onAddPlan({ ...plan, ministry: 'theater' })}
          onUpdatePlan={(plan) => onUpdatePlan && onUpdatePlan(plan)}
          onDeletePlan={(id) => onDeletePlan && onDeletePlan(id)}
          availableLeaders={actors.map((a) => a.name)}
          config={config}
        />
      )}

      {/* PLAY MODAL */}
      {isPlayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-amber-600" />
                <span>{editingPlay ? 'Editar Obra Teatral' : 'Registrar Obra Teatral'}</span>
              </h3>
              <button onClick={() => setIsPlayModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePlaySubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Título de la Obra *</label>
                <input
                  type="text"
                  required
                  value={playForm.title}
                  onChange={(e) => setPlayForm({ ...playForm, title: e.target.value })}
                  placeholder="Ej. El Ladrón en la Cruz / La Puerta Estrecha"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Género</label>
                  <select
                    value={playForm.genre}
                    onChange={(e) => setPlayForm({ ...playForm, genre: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Evangelístico">Evangelístico</option>
                    <option value="Drama Bíblico">Drama Bíblico</option>
                    <option value="Pantomima / Mímica">Pantomima / Mímica</option>
                    <option value="Monólogo">Monólogo</option>
                    <option value="Navideño / Pascua">Navideño / Pascua</option>
                    <option value="Comedia con Mensaje">Comedia con Mensaje</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    value={playForm.duration}
                    onChange={(e) => setPlayForm({ ...playForm, duration: e.target.value })}
                    placeholder="Ej. 15 min"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Director(a) de la Obra</label>
                  <input
                    type="text"
                    value={playForm.director}
                    onChange={(e) => setPlayForm({ ...playForm, director: e.target.value })}
                    placeholder="Ej. Hna. Patricia"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Estado</label>
                  <select
                    value={playForm.status}
                    onChange={(e) => setPlayForm({ ...playForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="En preparación">En preparación</option>
                    <option value="Lista para estreno">Lista para estreno</option>
                    <option value="Presentada">Presentada</option>
                  </select>
                </div>
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video para Ensayo / Referencia (YouTube, Facebook, TikTok, Instagram, etc.)</span>
                </label>
                <input
                  type="url"
                  value={playForm.youtubeUrl || ''}
                  onChange={(e) => setPlayForm({ ...playForm, youtubeUrl: e.target.value })}
                  placeholder="https://... (YouTube, Facebook, TikTok, Instagram o MP4)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Sinopsis Breve</label>
                <textarea
                  rows={2}
                  value={playForm.synopsis}
                  onChange={(e) => setPlayForm({ ...playForm, synopsis: e.target.value })}
                  placeholder="Resumen del argumento principal de la obra..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Libreto / Guion Completo con Diálogos</label>
                <textarea
                  rows={4}
                  value={playForm.script || ''}
                  onChange={(e) => setPlayForm({ ...playForm, script: e.target.value })}
                  placeholder="Escribe o pega aquí el guion y los diálogos de los personajes..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPlayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {editingPlay ? 'Guardar Cambios' : 'Registrar Obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTOR MODAL */}
      {isActorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                <span>{editingActor ? 'Editar Actor / Actriz' : 'Registrar Actor / Actriz'}</span>
              </h3>
              <button onClick={() => setIsActorModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActorSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={actorForm.name}
                  onChange={(e) => setActorForm({ ...actorForm, name: e.target.value })}
                  placeholder="Ej. Lucas Morales"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Rol en el Elenco</label>
                <select
                  value={actorForm.role}
                  onChange={(e) => setActorForm({ ...actorForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Actor Principal">Actor Principal</option>
                  <option value="Actor Secundario">Actor Secundario</option>
                  <option value="Mimo / Expresión Corporal">Mimo / Expresión Corporal</option>
                  <option value="Voz en Off / Narrador">Voz en Off / Narrador</option>
                  <option value="Tramoya / Escenografía">Tramoya / Escenografía</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={actorForm.phone || ''}
                  onChange={(e) => setActorForm({ ...actorForm, phone: e.target.value })}
                  placeholder="555-778899"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado</label>
                <select
                  value={actorForm.status}
                  onChange={(e) => setActorForm({ ...actorForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Activo">Activo</option>
                  <option value="En Capacitación">En Capacitación</option>
                  <option value="Suplente">Suplente</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {editingActor ? 'Guardar Cambios' : 'Registrar'}
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
                <Clock className="w-5 h-5 text-amber-600" />
                <span>{editingRehearsal ? 'Editar Ensayo de Teatro' : 'Programar Ensayo de Teatro'}</span>
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
                    placeholder="18:00 - 20:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Obra a Ensayar</label>
                <select
                  value={rehearsalForm.playId}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, playId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">-- Ensayo General / Ejercicios de Mímica --</option>
                  {plays.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.genre})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Lugar del Ensayo</label>
                <input
                  type="text"
                  value={rehearsalForm.location}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, location: e.target.value })}
                  placeholder="Salón de Actos / Santuario"
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
                <label className="block font-semibold mb-1">Notas / Escenas a repasar</label>
                <textarea
                  rows={3}
                  value={rehearsalForm.notes || ''}
                  onChange={(e) => setRehearsalForm({ ...rehearsalForm, notes: e.target.value })}
                  placeholder="Traer vestuario y utilería para escena 2..."
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
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  {editingRehearsal ? 'Guardar Cambios' : 'Agendar Ensayo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SCRIPT MODAL */}
      {viewScriptPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Libreto: {viewScriptPlay.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Director: {viewScriptPlay.director} • Género: {viewScriptPlay.genre}
                </p>
              </div>
              <button onClick={() => setViewScriptPlay(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200/60 dark:border-slate-800 font-mono text-xs whitespace-pre-line leading-relaxed text-slate-800 dark:text-slate-200">
              {viewScriptPlay.script || 'No se ha cargado el libreto completo todavía.'}
            </div>

            <div className="flex justify-between items-center pt-2">
              {viewScriptPlay.youtubeUrl && (
                <button
                  onClick={() => {
                    setYoutubeModal({
                      isOpen: true,
                      url: viewScriptPlay.youtubeUrl,
                      title: viewScriptPlay.title,
                      subtitle: `Director: ${viewScriptPlay.director}`,
                      notes: viewScriptPlay.synopsis,
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center space-x-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Ver en YouTube</span>
                </button>
              )}

              <button
                onClick={() => setViewScriptPlay(null)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs ml-auto"
              >
                Cerrar Libreto
              </button>
            </div>
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
