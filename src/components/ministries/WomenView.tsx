import React, { useState } from 'react';
import {
  WomenActivity,
  WomenLeader,
  WomenCellGroup,
  WomenPrayerRequest,
  MinistryWorkPlan,
  ChurchConfig,
  Member,
} from '../../types';
import {
  Heart,
  Plus,
  Search,
  Users,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  MapPin,
  Phone,
  CheckCircle2,
  Sparkles,
  Coffee,
  X,
  BookOpen,
  Home,
  MessageCircle,
  Play,
  Share2,
  ListTodo,
  UserCheck,
} from 'lucide-react';
import { YouTubeModal } from '../YouTubeModal';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { PageHeroBanner } from '../PageHeroBanner';
import { getActivePageThemeColor } from '../../lib/pageTheme';
import { MinistryWorkPlanTab } from './MinistryWorkPlanTab';
import { MinistryMembersDirectoryTab } from './MinistryMembersDirectoryTab';

interface WomenViewProps {
  config: ChurchConfig;
  activities: WomenActivity[];
  leaders: WomenLeader[];
  cellGroups: WomenCellGroup[];
  prayerRequests: WomenPrayerRequest[];
  plans?: MinistryWorkPlan[];
  members?: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => void;
  onUpdateMember?: (member: Member) => void;
  onAddActivity: (activity: Omit<WomenActivity, 'id'>) => void;
  onUpdateActivity: (activity: WomenActivity) => void;
  onDeleteActivity: (id: string) => void;
  onAddLeader: (leader: Omit<WomenLeader, 'id'>) => void;
  onUpdateLeader?: (leader: WomenLeader) => void;
  onDeleteLeader: (id: string) => void;
  onAddCellGroup: (cell: Omit<WomenCellGroup, 'id'>) => void;
  onUpdateCellGroup?: (cell: WomenCellGroup) => void;
  onDeleteCellGroup: (id: string) => void;
  onAddPrayerRequest: (request: Omit<WomenPrayerRequest, 'id'>) => void;
  onUpdatePrayerRequest?: (request: WomenPrayerRequest) => void;
  onTogglePrayerAnswered: (id: string) => void;
  onDeletePrayerRequest: (id: string) => void;
  onAddPlan?: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan?: (plan: MinistryWorkPlan) => void;
  onDeletePlan?: (id: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const WomenView: React.FC<WomenViewProps> = ({
  config,
  activities,
  leaders,
  cellGroups,
  prayerRequests,
  plans = [],
  members = [],
  onAddMember,
  onUpdateMember,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  onAddLeader,
  onUpdateLeader,
  onDeleteLeader,
  onAddCellGroup,
  onUpdateCellGroup,
  onDeleteCellGroup,
  onAddPrayerRequest,
  onUpdatePrayerRequest,
  onTogglePrayerAnswered,
  onDeletePrayerRequest,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'activities' | 'members' | 'leaders' | 'cells' | 'prayers' | 'plans'>('activities');
  const [searchQuery, setSearchQuery] = useState('');
  const pageColor = getActivePageThemeColor('women', config);

  // Date filters for all subtabs
  const [actDatePreset, setActDatePreset] = useState<DateFilterPreset>('all');
  const [actStartDate, setActStartDate] = useState('');
  const [actEndDate, setActEndDate] = useState('');

  const [leaderDatePreset, setLeaderDatePreset] = useState<DateFilterPreset>('all');
  const [leaderStartDate, setLeaderStartDate] = useState('');
  const [leaderEndDate, setLeaderEndDate] = useState('');

  const [cellDatePreset, setCellDatePreset] = useState<DateFilterPreset>('all');
  const [cellStartDate, setCellStartDate] = useState('');
  const [cellEndDate, setCellEndDate] = useState('');

  const [prayDatePreset, setPrayDatePreset] = useState<DateFilterPreset>('all');
  const [prayStartDate, setPrayStartDate] = useState('');
  const [prayEndDate, setPrayEndDate] = useState('');

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
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<WomenActivity | null>(null);

  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [editingLeader, setEditingLeader] = useState<WomenLeader | null>(null);

  const [isCellModalOpen, setIsCellModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<WomenCellGroup | null>(null);

  const [isPrayerModalOpen, setIsPrayerModalOpen] = useState(false);
  const [editingPrayer, setEditingPrayer] = useState<WomenPrayerRequest | null>(null);

  // Forms
  const [activityForm, setActivityForm] = useState<Omit<WomenActivity, 'id'>>({
    title: '',
    type: 'Desayuno / Té de Damas',
    date: new Date().toISOString().split('T')[0],
    time: '09:00 - 12:00',
    location: 'Santuario Principal',
    speaker: '',
    budget: 3500,
    expectedAttendance: 60,
    youtubeUrl: '',
    notes: '',
  });

  const [leaderForm, setLeaderForm] = useState<Omit<WomenLeader, 'id'>>({
    name: '',
    position: 'Presidenta',
    phone: '',
  });

  const [cellForm, setCellForm] = useState<Omit<WomenCellGroup, 'id'>>({
    name: '',
    leaderName: '',
    hostName: '',
    address: '',
    meetingDayTime: 'Martes 18:30 hrs',
    phone: '',
    youtubeUrl: '',
  });

  const [prayerForm, setPrayerForm] = useState<Omit<WomenPrayerRequest, 'id'>>({
    requesterName: '',
    date: new Date().toISOString().split('T')[0],
    motive: '',
    category: 'Familia / Hijos',
    answered: false,
  });

  // Filtered lists
  const filteredActivities = filterItemsByDate<WomenActivity>(
    activities.filter(
      (a: WomenActivity) =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.location.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    (a: WomenActivity) => a.date,
    actDatePreset,
    actStartDate,
    actEndDate
  );

  const filteredLeaders = filterItemsByDate<WomenLeader>(
    leaders.filter((l) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (l.name || '').toLowerCase().includes(q) ||
        (l.position ? l.position.toLowerCase().includes(q) : false)
      );
    }),
    (l: WomenLeader) => l.date || '2026-01-01',
    leaderDatePreset,
    leaderStartDate,
    leaderEndDate
  );

  const filteredCells = filterItemsByDate<WomenCellGroup>(
    cellGroups.filter((c) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.leaderName ? c.leaderName.toLowerCase().includes(q) : false) ||
        (c.address ? c.address.toLowerCase().includes(q) : false)
      );
    }),
    (c: WomenCellGroup) => c.date || '2026-01-01',
    cellDatePreset,
    cellStartDate,
    cellEndDate
  );

  const filteredPrayers = filterItemsByDate<WomenPrayerRequest>(
    prayerRequests.filter((p: WomenPrayerRequest) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (p.requesterName || '').toLowerCase().includes(q) ||
        (p.motive ? p.motive.toLowerCase().includes(q) : false)
      );
    }),
    (p: WomenPrayerRequest) => p.date,
    prayDatePreset,
    prayStartDate,
    prayEndDate
  );

  // Handlers - Activities
  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setActivityForm({
      title: '',
      type: 'Desayuno / Té de Damas',
      date: new Date().toISOString().split('T')[0],
      time: '09:00 - 12:00',
      location: 'Santuario Principal',
      speaker: '',
      budget: 3500,
      expectedAttendance: 60,
      youtubeUrl: '',
      notes: '',
    });
    setIsActivityModalOpen(true);
  };

  const handleOpenEditActivity = (act: WomenActivity) => {
    setEditingActivity(act);
    setActivityForm({
      title: act.title,
      type: act.type,
      date: act.date,
      time: act.time,
      location: act.location,
      speaker: act.speaker,
      budget: act.budget || 0,
      expectedAttendance: act.expectedAttendance || 0,
      youtubeUrl: act.youtubeUrl || '',
      notes: act.notes || '',
    });
    setIsActivityModalOpen(true);
  };

  const handleActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityForm.title.trim()) return;

    if (editingActivity) {
      onUpdateActivity({
        ...activityForm,
        id: editingActivity.id,
      });
    } else {
      onAddActivity(activityForm);
    }

    setIsActivityModalOpen(false);
    setEditingActivity(null);
  };

  // Handlers - Leaders
  const handleOpenAddLeader = () => {
    setEditingLeader(null);
    setLeaderForm({ name: '', position: 'Presidenta', phone: '' });
    setIsLeaderModalOpen(true);
  };

  const handleOpenEditLeader = (l: WomenLeader) => {
    setEditingLeader(l);
    setLeaderForm({
      name: l.name,
      position: l.position,
      phone: l.phone || '',
    });
    setIsLeaderModalOpen(true);
  };

  const handleLeaderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaderForm.name.trim()) return;

    if (editingLeader && onUpdateLeader) {
      onUpdateLeader({
        ...leaderForm,
        id: editingLeader.id,
      });
    } else {
      onAddLeader(leaderForm);
    }
    setIsLeaderModalOpen(false);
    setEditingLeader(null);
  };

  // Handlers - Cell Groups
  const handleOpenAddCell = () => {
    setEditingCell(null);
    setCellForm({
      name: '',
      leaderName: '',
      hostName: '',
      address: '',
      meetingDayTime: 'Martes 18:30 hrs',
      phone: '',
      youtubeUrl: '',
    });
    setIsCellModalOpen(true);
  };

  const handleOpenEditCell = (c: WomenCellGroup) => {
    setEditingCell(c);
    setCellForm({
      name: c.name,
      leaderName: c.leaderName,
      hostName: c.hostName || '',
      address: c.address,
      meetingDayTime: c.meetingDayTime,
      phone: c.phone || '',
      youtubeUrl: c.youtubeUrl || '',
    });
    setIsCellModalOpen(true);
  };

  const handleCellSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellForm.name.trim()) return;

    if (editingCell && onUpdateCellGroup) {
      onUpdateCellGroup({
        ...cellForm,
        id: editingCell.id,
      });
    } else {
      onAddCellGroup(cellForm);
    }
    setIsCellModalOpen(false);
    setEditingCell(null);
  };

  // Handlers - Prayer Requests
  const handleOpenAddPrayer = () => {
    setEditingPrayer(null);
    setPrayerForm({
      requesterName: '',
      date: new Date().toISOString().split('T')[0],
      motive: '',
      category: 'Familia / Hijos',
      answered: false,
    });
    setIsPrayerModalOpen(true);
  };

  const handleOpenEditPrayer = (p: WomenPrayerRequest) => {
    setEditingPrayer(p);
    setPrayerForm({
      requesterName: p.requesterName,
      date: p.date,
      motive: p.motive,
      category: p.category,
      answered: p.answered,
    });
    setIsPrayerModalOpen(true);
  };

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerForm.motive.trim()) return;

    if (editingPrayer && onUpdatePrayerRequest) {
      onUpdatePrayerRequest({
        ...prayerForm,
        id: editingPrayer.id,
      });
    } else {
      onAddPrayerRequest(prayerForm);
    }
    setIsPrayerModalOpen(false);
    setEditingPrayer(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="women"
        config={config}
        icon={Heart}
        defaultTitle="Sociedad Femenil & Células de Hogar"
        defaultSubtitle="Organización de congresos, desayunos, grupos de oración con filtros por fecha, cadena de intercesión y enlaces a conferencias en YouTube."
        defaultBadge="Ministerio de Damas & Mujeres de Fe"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={handleOpenAddActivity}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nueva Actividad</span>
            </button>
            <button
              onClick={handleOpenAddPrayer}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs border border-white/30 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              style={{
                backgroundColor: `${pageColor}bb`,
                borderColor: `${pageColor}80`,
              }}
            >
              <Heart className="w-4 h-4" />
              <span>Petición de Oración</span>
            </button>
          </>
        }
      />

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-300/40 dark:border-slate-800/40">
        <button
          onClick={() => setActiveSubTab('activities')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'activities'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'activities' ? pageColor : undefined,
            boxShadow: activeSubTab === 'activities' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Coffee className="w-4 h-4" />
          <span>Actividades & Congresos ({activities.length})</span>
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
                  (m.ministries || []).includes('women') ||
                  m.ministryRoles.some((r) => r.includes('Damas') || r.includes('Femenil'))
              ).length
            }
            )
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('leaders')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'leaders'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'leaders' ? pageColor : undefined,
            boxShadow: activeSubTab === 'leaders' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Users className="w-4 h-4" />
          <span>Directiva Femenil ({leaders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cells')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'cells'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'cells' ? pageColor : undefined,
            boxShadow: activeSubTab === 'cells' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Home className="w-4 h-4" />
          <span>Células & Casas de Paz ({cellGroups.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('prayers')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'prayers'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'prayers' ? pageColor : undefined,
            boxShadow: activeSubTab === 'prayers' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Heart className="w-4 h-4" />
          <span>Cadena de Oración ({prayerRequests.length})</span>
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

      {/* 1. ACTIVIDADES TAB */}
      {activeSubTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por tema, expositora o lugar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
              />
            </div>

            <button
              onClick={handleOpenAddActivity}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Actividad de Damas</span>
            </button>
          </div>

          {/* Date Filter */}
          <DateFilterControl
            preset={actDatePreset}
            onPresetChange={setActDatePreset}
            startDate={actStartDate}
            onStartDateChange={setActStartDate}
            endDate={actEndDate}
            onEndDateChange={setActEndDate}
            label="Filtrar Actividades y Congresos por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActivities.map((act) => (
              <div
                key={act.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        {act.type}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Expositora: <strong className="text-slate-700 dark:text-slate-300">{act.speaker || 'Equipo Pastoral'}</strong>
                      </p>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs shrink-0">
                      📅 {act.date}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Horario</span>
                      <span className="font-semibold">{act.time}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase">Lugar</span>
                      <span className="font-semibold">{act.location}</span>
                    </div>
                    {act.budget ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Presupuesto</span>
                        <span className="font-semibold">${act.budget.toLocaleString()}</span>
                      </div>
                    ) : null}
                    {act.expectedAttendance ? (
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Meta Asistencia</span>
                        <span className="font-semibold">{act.expectedAttendance} mujeres</span>
                      </div>
                    ) : null}
                  </div>

                  {act.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      📝 {act.notes}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setYoutubeModal({
                        isOpen: true,
                        url: act.youtubeUrl,
                        title: act.title,
                        subtitle: `Expositora: ${act.speaker || 'Damas'} • Fecha: ${act.date}`,
                        notes: act.notes,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                    <span>{act.youtubeUrl ? 'Ver Video / Conferencia en YouTube' : 'Buscar en YouTube'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditActivity(act)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Editar Actividad"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteActivity(act.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Actividad"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No se encontraron actividades en el rango de fechas seleccionado
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 2. DIRECTIVA TAB */}
      {activeSubTab === 'leaders' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Directiva & Comité de Damas</h3>
              <p className="text-xs text-slate-500">Líderes coordinadoras del ministerio femenil</p>
            </div>
            <button
              onClick={handleOpenAddLeader}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Líder</span>
            </button>
          </div>

          {/* Date Filter for Leaders */}
          <DateFilterControl
            preset={leaderDatePreset}
            onPresetChange={setLeaderDatePreset}
            startDate={leaderStartDate}
            onStartDateChange={setLeaderStartDate}
            endDate={leaderEndDate}
            onEndDateChange={setLeaderEndDate}
            label="Filtrar Directiva por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredLeaders.map((l) => (
              <div
                key={l.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[10px]">
                    {l.position}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{l.name}</h4>
                  {l.date && (
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">📅 {l.date}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {l.phone ? (
                    <a
                      href={`tel:${l.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{l.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditLeader(l)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Editar Líder"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteLeader(l.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Líder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLeaders.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay líderes registradas para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 3. CÉLULAS TAB */}
      {activeSubTab === 'cells' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Células y Grupos de Damas</h3>
              <p className="text-xs text-slate-500">Reuniones de edificación en hogares y familias</p>
            </div>
            <button
              onClick={handleOpenAddCell}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Célula</span>
            </button>
          </div>

          {/* Date Filter for Cells */}
          <DateFilterControl
            preset={cellDatePreset}
            onPresetChange={setCellDatePreset}
            startDate={cellStartDate}
            onStartDateChange={setCellStartDate}
            endDate={cellEndDate}
            onEndDateChange={setCellEndDate}
            label="Filtrar Células por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCells.map((c) => (
              <div
                key={c.id}
                className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{c.name}</h4>
                      <p className="text-xs text-rose-600 font-semibold mt-0.5">Líder: {c.leaderName}</p>
                      {c.date && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">📅 {c.date}</p>
                      )}
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                      {c.meetingDayTime}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{c.address}</span>
                    </p>
                    {c.hostName && (
                      <p className="text-slate-500">Anfitriona: <strong>{c.hostName}</strong></p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {c.phone ? (
                    <a
                      href={`tel:${c.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-rose-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{c.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditCell(c)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Editar Célula"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteCellGroup(c.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Célula"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCells.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay células encontradas para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 4. CADENA DE ORACIÓN TAB */}
      {activeSubTab === 'prayers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Cadena de Oración e Intercesión</h3>
              <p className="text-xs text-slate-500">Motivos de oración presentados por las hermanas de la congregación</p>
            </div>
            <button
              onClick={handleOpenAddPrayer}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Petición</span>
            </button>
          </div>

          {/* Date Filter */}
          <DateFilterControl
            preset={prayDatePreset}
            onPresetChange={setPrayDatePreset}
            startDate={prayStartDate}
            onStartDateChange={setPrayStartDate}
            endDate={prayEndDate}
            onEndDateChange={setPrayEndDate}
            label="Filtrar Peticiones de Oración por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrayers.map((p) => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border shadow-md space-y-3 flex flex-col justify-between transition-all ${
                  p.answered
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-extrabold text-[10px]">
                        {p.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                        Solicita: {p.requesterName}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold">📅 {p.date}</span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                    🙏 "{p.motive}"
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onTogglePrayerAnswered(p.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                      p.answered
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{p.answered ? '¡Oración Respondida!' : 'Marcar Respondida'}</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditPrayer(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Editar Petición"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeletePrayerRequest(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Eliminar Petición"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PADRÓN DE MIEMBROS TAB */}
      {activeSubTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId="women"
          ministryName="Ministerio Femenil / Damas"
          themeColor={pageColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {/* 5. PLAN DE TRABAJO TAB */}
      {activeSubTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry="women"
          ministryName="Ministerio de Damas"
          pageColor={pageColor}
          plans={plans.filter((p) => p.ministry === 'women')}
          onAddPlan={(plan) => onAddPlan && onAddPlan({ ...plan, ministry: 'women' })}
          onUpdatePlan={(plan) => onUpdatePlan && onUpdatePlan(plan)}
          onDeletePlan={(id) => onDeletePlan && onDeletePlan(id)}
          availableLeaders={leaders.map((l) => l.name)}
          config={config}
        />
      )}

      {/* ACTIVITY MODAL */}
      {isActivityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coffee className="w-5 h-5 text-rose-600" />
                <span>{editingActivity ? 'Editar Actividad' : 'Nueva Actividad de Damas'}</span>
              </h3>
              <button onClick={() => setIsActivityModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActivitySubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre / Título de la Actividad *</label>
                <input
                  type="text"
                  required
                  value={activityForm.title}
                  onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
                  placeholder="Ej. Congreso de Mujeres 'Ungidas para Vencer'"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tipo de Evento</label>
                  <select
                    value={activityForm.type}
                    onChange={(e) => setActivityForm({ ...activityForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Desayuno / Té de Damas">Desayuno / Té de Damas</option>
                    <option value="Congreso / Retiro">Congreso / Retiro</option>
                    <option value="Vigilia de Oración">Vigilia de Oración</option>
                    <option value="Taller de Capacitación">Taller de Capacitación</option>
                    <option value="Evangelismo Femenil">Evangelismo Femenil</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={activityForm.date}
                    onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Horario</label>
                  <input
                    type="text"
                    value={activityForm.time}
                    onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
                    placeholder="09:00 - 13:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Lugar</label>
                  <input
                    type="text"
                    value={activityForm.location}
                    onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                    placeholder="Santuario Principal / Hotel"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Expositora / Invitada Especial</label>
                <input
                  type="text"
                  value={activityForm.speaker}
                  onChange={(e) => setActivityForm({ ...activityForm, speaker: e.target.value })}
                  placeholder="Ej. Pastora Raquel Gómez"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video / Conferencia en YouTube</span>
                </label>
                <input
                  type="url"
                  value={activityForm.youtubeUrl || ''}
                  onChange={(e) => setActivityForm({ ...activityForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Presupuesto Estimado</label>
                  <input
                    type="number"
                    value={activityForm.budget || 0}
                    onChange={(e) => setActivityForm({ ...activityForm, budget: parseFloat(e.target.value) || 0 })}
                    placeholder="3500"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Meta de Asistencia</label>
                  <input
                    type="number"
                    value={activityForm.expectedAttendance || 0}
                    onChange={(e) => setActivityForm({ ...activityForm, expectedAttendance: parseInt(e.target.value) || 0 })}
                    placeholder="60"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Detalles / Notas del Evento</label>
                <textarea
                  rows={2}
                  value={activityForm.notes || ''}
                  onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                  placeholder="Tema central, comisiones de refrigerio, recuerdos..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsActivityModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {editingActivity ? 'Guardar Cambios' : 'Registrar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LEADER MODAL */}
      {isLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-600" />
                <span>{editingLeader ? 'Editar Líder de Damas' : 'Registrar Líder de Damas'}</span>
              </h3>
              <button onClick={() => setIsLeaderModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaderSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={leaderForm.name}
                  onChange={(e) => setLeaderForm({ ...leaderForm, name: e.target.value })}
                  placeholder="Ej. Martha de López"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Cargo Directivo</label>
                <select
                  value={leaderForm.position}
                  onChange={(e) => setLeaderForm({ ...leaderForm, position: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Presidenta">Presidenta</option>
                  <option value="Vicepresidenta">Vicepresidenta</option>
                  <option value="Secretaria">Secretaria</option>
                  <option value="Tesorera">Tesorera</option>
                  <option value="Coordinadora de Oración">Coordinadora de Oración</option>
                  <option value="Vocal">Vocal</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={leaderForm.phone || ''}
                  onChange={(e) => setLeaderForm({ ...leaderForm, phone: e.target.value })}
                  placeholder="555-987654"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsLeaderModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {editingLeader ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CELL MODAL */}
      {isCellModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Home className="w-5 h-5 text-rose-600" />
                <span>{editingCell ? 'Editar Célula de Damas' : 'Registrar Célula de Damas'}</span>
              </h3>
              <button onClick={() => setIsCellModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCellSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre de la Célula *</label>
                <input
                  type="text"
                  required
                  value={cellForm.name}
                  onChange={(e) => setCellForm({ ...cellForm, name: e.target.value })}
                  placeholder="Ej. Célula 'Manantial de Vida'"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Líder a Cargo *</label>
                <input
                  type="text"
                  required
                  value={cellForm.leaderName}
                  onChange={(e) => setCellForm({ ...cellForm, leaderName: e.target.value })}
                  placeholder="Nombre de la líder"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Anfitriona del Hogar</label>
                <input
                  type="text"
                  value={cellForm.hostName || ''}
                  onChange={(e) => setCellForm({ ...cellForm, hostName: e.target.value })}
                  placeholder="Hna. Dueña de la casa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Dirección del Hogar *</label>
                <input
                  type="text"
                  required
                  value={cellForm.address}
                  onChange={(e) => setCellForm({ ...cellForm, address: e.target.value })}
                  placeholder="Calle, Número y Colonia"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Día y Horario de Reunión</label>
                <input
                  type="text"
                  value={cellForm.meetingDayTime}
                  onChange={(e) => setCellForm({ ...cellForm, meetingDayTime: e.target.value })}
                  placeholder="Martes 18:30 hrs"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono de Contacto</label>
                <input
                  type="tel"
                  value={cellForm.phone || ''}
                  onChange={(e) => setCellForm({ ...cellForm, phone: e.target.value })}
                  placeholder="555-123456"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCellModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {editingCell ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRAYER REQUEST MODAL */}
      {isPrayerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                <span>{editingPrayer ? 'Editar Petición de Oración' : 'Registrar Petición de Oración'}</span>
              </h3>
              <button onClick={() => setIsPrayerModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePrayerSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre de quien solicita *</label>
                <input
                  type="text"
                  required
                  value={prayerForm.requesterName}
                  onChange={(e) => setPrayerForm({ ...prayerForm, requesterName: e.target.value })}
                  placeholder="Ej. Hna. Carmen Ruiz"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={prayerForm.date}
                    onChange={(e) => setPrayerForm({ ...prayerForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Categoría</label>
                  <select
                    value={prayerForm.category}
                    onChange={(e) => setPrayerForm({ ...prayerForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="Familia / Hijos">Familia / Hijos</option>
                    <option value="Salud / Sanidad">Salud / Sanidad</option>
                    <option value="Finanzas / Trabajo">Finanzas / Trabajo</option>
                    <option value="Vida Espiritual">Vida Espiritual</option>
                    <option value="Matrimonios">Matrimonios</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Motivo / Descripción de la Petición *</label>
                <textarea
                  rows={3}
                  required
                  value={prayerForm.motive}
                  onChange={(e) => setPrayerForm({ ...prayerForm, motive: e.target.value })}
                  placeholder="Escribe la necesidad de oración..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPrayerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  {editingPrayer ? 'Guardar Cambios' : 'Registrar'}
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
