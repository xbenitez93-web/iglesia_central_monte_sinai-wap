import React, { useState } from 'react';
import {
  UsherServer,
  UsherRoster,
  UsherProtocolGuide,
  MinistryWorkPlan,
  ChurchConfig,
  Member,
} from '../../types';
import {
  ShieldCheck,
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
  ClipboardList,
  UserCheck,
  X,
  AlertCircle,
  Play,
  Share2,
  ListTodo,
} from 'lucide-react';
import { YouTubeModal } from '../YouTubeModal';
import { DateFilterControl, DateFilterPreset, filterItemsByDate } from '../DateFilterControl';
import { PageHeroBanner } from '../PageHeroBanner';
import { getActivePageThemeColor } from '../../lib/pageTheme';
import { MinistryWorkPlanTab } from './MinistryWorkPlanTab';
import { MinistryMembersDirectoryTab } from './MinistryMembersDirectoryTab';

interface UshersViewProps {
  config: ChurchConfig;
  servers: UsherServer[];
  rosters: UsherRoster[];
  plans?: MinistryWorkPlan[];
  members?: Member[];
  onAddMember?: (member: Omit<Member, 'id'>) => void;
  onUpdateMember?: (member: Member) => void;
  onAddServer: (server: Omit<UsherServer, 'id'>) => void;
  onUpdateServer?: (server: UsherServer) => void;
  onDeleteServer: (id: string) => void;
  onAddRoster: (roster: Omit<UsherRoster, 'id'>) => void;
  onUpdateRoster?: (roster: UsherRoster) => void;
  onDeleteRoster: (id: string) => void;
  onAddPlan?: (plan: Omit<MinistryWorkPlan, 'id'>) => void;
  onUpdatePlan?: (plan: MinistryWorkPlan) => void;
  onDeletePlan?: (id: string) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const UshersView: React.FC<UshersViewProps> = ({
  config,
  servers,
  rosters,
  plans = [],
  members = [],
  onAddMember,
  onUpdateMember,
  onAddServer,
  onUpdateServer,
  onDeleteServer,
  onAddRoster,
  onUpdateRoster,
  onDeleteRoster,
  onAddPlan,
  onUpdatePlan,
  onDeletePlan,
  onUpdateConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'servers' | 'members' | 'rosters' | 'protocols' | 'plans'>('servers');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const pageColor = getActivePageThemeColor('ushers', config);

  // Date filters
  const [serverDatePreset, setServerDatePreset] = useState<DateFilterPreset>('all');
  const [serverStartDate, setServerStartDate] = useState('');
  const [serverEndDate, setServerEndDate] = useState('');

  const [rosterDatePreset, setRosterDatePreset] = useState<DateFilterPreset>('all');
  const [rosterStartDate, setRosterStartDate] = useState('');
  const [rosterEndDate, setRosterEndDate] = useState('');

  const [protoDatePreset, setProtoDatePreset] = useState<DateFilterPreset>('all');
  const [protoStartDate, setProtoStartDate] = useState('');
  const [protoEndDate, setProtoEndDate] = useState('');

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

  // Custom Protocols State
  const [protocols, setProtocols] = useState<UsherProtocolGuide[]>(() => {
    const saved = localStorage.getItem('eclesia_usherProtocols');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'p1',
            title: '1. Recepción y Bienvenida a Visitas',
            category: 'Bienvenida a Nuevos',
            description:
              'Llegar 45 minutos antes del inicio. Recibir a los asistentes con una sonrisa cordial, saludo afectuoso, entrega del boletín y ubicación fluida en los asientos desde las primeras filas hacia atrás.',
            youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          },
          {
            id: 'p2',
            title: '2. Recolección de Ofrendas y Diezmos',
            category: 'Recolección de Ofrendas',
            description:
              'Posicionarse ordenadamente al llamado pastoral. Avanzar sincronizados por los pasillos con los alfolíes y llevarlos directamente al conteo seguro custodiado por dos delegados de tesorería.',
            youtubeUrl: '',
          },
          {
            id: 'p3',
            title: '3. Orden del Altar y Ministración',
            category: 'Orden en el Altar',
            description:
              'Durante el llamamiento al altar, mantener despejados los pasillos y contar con mantas de cobertura para damas que caen bajo el poder de Dios con reverencia y discreción.',
            youtubeUrl: '',
          },
          {
            id: 'p4',
            title: '4. Emergencias y Primeros Auxilios',
            category: 'Emergencias Médicas',
            description:
              'Identificar salidas de emergencia, botiquín e hidrantes. En caso de personas con descompensación, avisar al equipo médico y facilitar salida discreta.',
            youtubeUrl: '',
          },
        ];
  });

  React.useEffect(() => {
    localStorage.setItem('eclesia_usherProtocols', JSON.stringify(protocols));
  }, [protocols]);

  // Modals & Editing state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<UsherServer | null>(null);

  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [editingRoster, setEditingRoster] = useState<UsherRoster | null>(null);

  const [isProtocolModalOpen, setIsProtocolModalOpen] = useState(false);
  const [editingProtocol, setEditingProtocol] = useState<UsherProtocolGuide | null>(null);

  // Forms
  const [serverForm, setServerForm] = useState<Omit<UsherServer, 'id'>>({
    name: '',
    role: 'Ujier General',
    assignedArea: 'Puerta Principal',
    phone: '',
    status: 'Activo',
    date: new Date().toISOString().split('T')[0],
  });

  const [rosterForm, setRosterForm] = useState<Omit<UsherRoster, 'id'>>({
    serviceDate: new Date().toISOString().split('T')[0],
    serviceType: 'Culto Dominical Mañana',
    leaderInCharge: '',
    assignments: [
      { area: 'Puerta Principal', serverName: '', responsibility: 'Bienvenida' },
      { area: 'Pasillo Central', serverName: '', responsibility: 'Ubicación' },
      { area: 'Alfolíes / Ofrendas', serverName: '', responsibility: 'Colecta' },
    ],
    youtubeUrl: '',
    notes: '',
  });

  const [protocolForm, setProtocolForm] = useState<Omit<UsherProtocolGuide, 'id'>>({
    title: '',
    category: 'Bienvenida a Nuevos',
    description: '',
    youtubeUrl: '',
  });

  // Filtered lists
  const filteredServers = filterItemsByDate<UsherServer>(
    servers.filter((s) => {
      const q = (searchQuery || '').toLowerCase();
      const matchesSearch =
        (s.name || '').toLowerCase().includes(q) ||
        (s.assignedArea ? s.assignedArea.toLowerCase().includes(q) : false);
      const matchesRole = roleFilter === 'all' || s.role === roleFilter;
      return matchesSearch && matchesRole;
    }),
    (s: UsherServer) => s.date || s.joinDate || '2026-01-01',
    serverDatePreset,
    serverStartDate,
    serverEndDate
  );

  const filteredRosters = filterItemsByDate<UsherRoster>(
    rosters.filter((r) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (r.serviceType || '').toLowerCase().includes(q) ||
        (r.leaderInCharge ? r.leaderInCharge.toLowerCase().includes(q) : false)
      );
    }),
    (r: UsherRoster) => r.serviceDate,
    rosterDatePreset,
    rosterStartDate,
    rosterEndDate
  );

  const filteredProtocols = filterItemsByDate<UsherProtocolGuide>(
    protocols.filter((p) => {
      const q = (searchQuery || '').toLowerCase();
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.category ? p.category.toLowerCase().includes(q) : false) ||
        (p.description ? p.description.toLowerCase().includes(q) : false)
      );
    }),
    (p: any) => p.date || '2026-01-01',
    protoDatePreset,
    protoStartDate,
    protoEndDate
  );

  // Handlers - Servers
  const handleOpenAddServer = () => {
    setEditingServer(null);
    setServerForm({
      name: '',
      role: 'Ujier General',
      assignedArea: 'Puerta Principal',
      phone: '',
      status: 'Activo',
      date: new Date().toISOString().split('T')[0],
    });
    setIsServerModalOpen(true);
  };

  const handleOpenEditServer = (s: UsherServer) => {
    setEditingServer(s);
    setServerForm({
      name: s.name,
      role: s.role || 'Ujier General',
      assignedArea: s.assignedArea || 'Puerta Principal',
      phone: s.phone || '',
      status: s.status,
      date: s.date || s.joinDate || new Date().toISOString().split('T')[0],
    });
    setIsServerModalOpen(true);
  };

  const handleServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverForm.name.trim()) return;

    if (editingServer && onUpdateServer) {
      onUpdateServer({
        ...serverForm,
        id: editingServer.id,
      });
    } else {
      onAddServer(serverForm);
    }
    setIsServerModalOpen(false);
    setEditingServer(null);
  };

  // Handlers - Rosters
  const handleOpenAddRoster = () => {
    setEditingRoster(null);
    setRosterForm({
      serviceDate: new Date().toISOString().split('T')[0],
      serviceType: 'Culto Dominical Mañana',
      leaderInCharge: '',
      assignments: [
        { area: 'Puerta Principal', serverName: '', responsibility: 'Bienvenida' },
        { area: 'Pasillo Central', serverName: '', responsibility: 'Ubicación' },
        { area: 'Alfolíes / Ofrendas', serverName: '', responsibility: 'Colecta' },
      ],
      youtubeUrl: '',
      notes: '',
    });
    setIsRosterModalOpen(true);
  };

  const handleOpenEditRoster = (r: UsherRoster) => {
    setEditingRoster(r);
    setRosterForm({
      serviceDate: r.serviceDate,
      serviceType: r.serviceType,
      leaderInCharge: r.leaderInCharge,
      assignments: r.assignments && r.assignments.length > 0 ? r.assignments : [
        { area: 'Puerta Principal', serverName: '', responsibility: 'Bienvenida' },
      ],
      youtubeUrl: r.youtubeUrl || '',
      notes: r.notes || '',
    });
    setIsRosterModalOpen(true);
  };

  const handleRosterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rosterForm.leaderInCharge.trim()) return;

    if (editingRoster && onUpdateRoster) {
      onUpdateRoster({
        ...rosterForm,
        id: editingRoster.id,
      });
    } else {
      onAddRoster(rosterForm);
    }
    setIsRosterModalOpen(false);
    setEditingRoster(null);
  };

  // Handlers - Protocols
  const handleOpenAddProtocol = () => {
    setEditingProtocol(null);
    setProtocolForm({
      title: '',
      category: 'Bienvenida a Nuevos',
      description: '',
      youtubeUrl: '',
    });
    setIsProtocolModalOpen(true);
  };

  const handleOpenEditProtocol = (p: UsherProtocolGuide) => {
    setEditingProtocol(p);
    setProtocolForm({
      title: p.title,
      category: p.category,
      description: p.description,
      youtubeUrl: p.youtubeUrl || '',
    });
    setIsProtocolModalOpen(true);
  };

  const handleProtocolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!protocolForm.title.trim()) return;

    if (editingProtocol) {
      setProtocols((prev) =>
        prev.map((p) => (p.id === editingProtocol.id ? { ...protocolForm, id: p.id } : p))
      );
    } else {
      const newP: UsherProtocolGuide = {
        ...protocolForm,
        id: `proto_${Date.now()}`,
      };
      setProtocols((prev) => [...prev, newP]);
    }
    setIsProtocolModalOpen(false);
    setEditingProtocol(null);
  };

  const handleDeleteProtocol = (id: string) => {
    setProtocols((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Dynamic Header Banner */}
      <PageHeroBanner
        tabId="ushers"
        config={config}
        icon={ShieldCheck}
        defaultTitle="Servidores & Protocolo"
        defaultSubtitle="Organización de ujieres, logística de bienvenida a visitas, recolección de ofrendas, orden en el santuario, asignación de turnos por culto con filtro de fechas y videos de capacitación en YouTube."
        defaultBadge="Ministerio de Servidores & Ujieres"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              onClick={handleOpenAddServer}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nuevo Servidor</span>
            </button>
            <button
              onClick={handleOpenAddRoster}
              className="px-4 py-2.5 rounded-2xl text-white font-bold text-xs border border-white/30 shadow-md transition-all flex items-center space-x-2 cursor-pointer"
              style={{
                backgroundColor: `${pageColor}bb`,
                borderColor: `${pageColor}80`,
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>Crear Turno de Culto</span>
            </button>
          </>
        }
      />

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
        <button
          onClick={() => setActiveSubTab('servers')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'servers'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'servers' ? pageColor : undefined,
            boxShadow: activeSubTab === 'servers' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Servidores ({servers.length})</span>
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
                  (m.ministries || []).includes('ushers') ||
                  m.ministryRoles.some((r) => r.includes('Ujier') || r.includes('Servidor') || r.includes('Protocolo'))
              ).length
            }
            )
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('rosters')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'rosters'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'rosters' ? pageColor : undefined,
            boxShadow: activeSubTab === 'rosters' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <Calendar className="w-4 h-4" />
          <span>Turnos & Asignaciones de Culto ({rosters.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('protocols')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'protocols'
              ? 'text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40'
          }`}
          style={{
            backgroundColor: activeSubTab === 'protocols' ? pageColor : undefined,
            boxShadow: activeSubTab === 'protocols' ? `0 4px 14px ${pageColor}50` : undefined,
          }}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Protocolos de Servicio & Videos</span>
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

      {/* 1. SERVIDORES TAB */}
      {activeSubTab === 'servers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar servidor o área..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="all">Todos los Roles</option>
                <option value="Jefe de Servidores">Jefe de Servidores</option>
                <option value="Ujier General">Ujier General</option>
                <option value="Recepción & Bienvenida">Recepción & Bienvenida</option>
                <option value="Seguridad & Parqueo">Seguridad & Parqueo</option>
                <option value="Ofrendas & Alfolíes">Ofrendas & Alfolíes</option>
                <option value="Protocolo Pastoral">Protocolo Pastoral</option>
              </select>
            </div>

            <button
              onClick={handleOpenAddServer}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Servidor</span>
            </button>
          </div>

          {/* Date Filter for Servers */}
          <DateFilterControl
            preset={serverDatePreset}
            onPresetChange={setServerDatePreset}
            startDate={serverStartDate}
            onStartDateChange={setServerStartDate}
            endDate={serverEndDate}
            onEndDateChange={setServerEndDate}
            label="Filtrar Directorio de Servidores por Fecha:"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredServers.map((s) => (
              <div
                key={s.id}
                className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                      {s.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'Activo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{s.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">📍 {s.assignedArea}</p>
                  {s.date && (
                    <p className="text-[10px] text-emerald-600 font-semibold">📅 {s.date}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  {s.phone ? (
                    <a
                      href={`tel:${s.phone}`}
                      className="text-slate-600 dark:text-slate-300 hover:text-emerald-600 flex items-center space-x-1"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{s.phone}</span>
                    </a>
                  ) : (
                    <span className="text-slate-400 text-[11px]">Sin teléfono</span>
                  )}

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditServer(s)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors"
                      title="Editar Servidor"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteServer(s.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                      title="Eliminar Servidor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServers.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay servidores encontrados para estos filtros
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 2. ROSTERS TAB */}
      {activeSubTab === 'rosters' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Asignación de Turnos de Servidores</h3>
              <p className="text-xs text-slate-500">Distribución de puestos, puertas, ofrendas y pasillos por culto</p>
            </div>
            <button
              onClick={handleOpenAddRoster}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Turno de Culto</span>
            </button>
          </div>

          {/* Date Filter */}
          <DateFilterControl
            preset={rosterDatePreset}
            onPresetChange={setRosterDatePreset}
            startDate={rosterStartDate}
            onStartDateChange={setRosterStartDate}
            endDate={rosterEndDate}
            onEndDateChange={setRosterEndDate}
            label="Filtrar Turnos de Servidores por Fecha:"
          />

          <div className="space-y-4">
            {filteredRosters.map((ros) => (
              <div
                key={ros.id}
                className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">
                      📅 {ros.serviceDate}
                    </span>
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {ros.serviceType}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Líder / Capitán de Turno: <strong className="text-slate-800 dark:text-slate-200">{ros.leaderInCharge}</strong>
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                    <button
                      onClick={() =>
                        setYoutubeModal({
                          isOpen: true,
                          url: ros.youtubeUrl,
                          title: `Turno de Ujieres: ${ros.serviceType} (${ros.serviceDate})`,
                          subtitle: `Capitán: ${ros.leaderInCharge}`,
                          notes: ros.notes,
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                      title="Ver Video / Tutorial de Protocolo en YouTube"
                    >
                      <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                      <span>YouTube</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditRoster(ros)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 cursor-pointer transition-colors"
                      title="Editar Turno"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteRoster(ros.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer transition-colors"
                      title="Eliminar Turno"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    Asignaciones por Puesto ({ros.assignments.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {ros.assignments.map((asgn, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs flex justify-between items-center"
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">{asgn.area}</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{asgn.serverName}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          {asgn.responsibility}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {ros.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    📌 {ros.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {filteredRosters.length === 0 && (
            <div className="bg-white/60 dark:bg-slate-900/60 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No hay turnos registrados en este rango de fechas
              </h3>
            </div>
          )}
        </div>
      )}

      {/* 3. PROTOCOLOS TAB */}
      {activeSubTab === 'protocols' && (
        <div className="space-y-4">
          <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-4 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Manual de Protocolo & Capacitación en Video</h3>
              <p className="text-xs text-slate-500">Pautas estándar de excelencia, etiqueta y atención en la casa de Dios</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleOpenAddProtocol}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar Protocolo</span>
              </button>
            </div>
          </div>

          {/* Date Filter for Protocols */}
          <DateFilterControl
            preset={protoDatePreset}
            onPresetChange={setProtoDatePreset}
            startDate={protoStartDate}
            onStartDateChange={setProtoStartDate}
            endDate={protoEndDate}
            onEndDateChange={setProtoEndDate}
            label="Filtrar Protocolos por Fecha:"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProtocols.map((proto) => (
              <div
                key={proto.id}
                className="bg-white/80 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 uppercase">
                      {proto.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditProtocol(proto)}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 cursor-pointer"
                        title="Editar Protocolo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProtocol(proto.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar Protocolo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{proto.title}</span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {proto.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Guía Oficial de Servidores</span>
                  <button
                    onClick={() =>
                      setYoutubeModal({
                        isOpen: true,
                        url: proto.youtubeUrl,
                        title: proto.title,
                        subtitle: proto.category,
                        notes: proto.description,
                      })
                    }
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                    title="Ver Video Tutorial en YouTube"
                  >
                    <Play className="w-3.5 h-3.5 fill-red-600 dark:fill-red-400" />
                    <span>Ver en YouTube</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PADRÓN DE MIEMBROS TAB */}
      {activeSubTab === 'members' && (
        <MinistryMembersDirectoryTab
          ministryId="ushers"
          ministryName="Servidores & Ujieres"
          themeColor={pageColor}
          members={members}
          onUpdateMember={onUpdateMember}
          onAddMember={onAddMember}
        />
      )}

      {/* 4. PLAN DE TRABAJO TAB */}
      {activeSubTab === 'plans' && (
        <MinistryWorkPlanTab
          ministry="ushers"
          ministryName="Ministerio de Servidores y Ujieres"
          pageColor={pageColor}
          plans={plans.filter((p) => p.ministry === 'ushers')}
          onAddPlan={(plan) => onAddPlan && onAddPlan({ ...plan, ministry: 'ushers' })}
          onUpdatePlan={(plan) => onUpdatePlan && onUpdatePlan(plan)}
          onDeletePlan={(id) => onDeletePlan && onDeletePlan(id)}
          availableLeaders={servers.map((s) => s.name)}
          config={config}
        />
      )}

      {/* SERVER MODAL */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>{editingServer ? 'Editar Servidor(a)' : 'Registrar Servidor(a)'}</span>
              </h3>
              <button onClick={() => setIsServerModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleServerSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={serverForm.name}
                  onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                  placeholder="Ej. Roberto Sánchez"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Rol / Especialidad</label>
                <select
                  value={serverForm.role}
                  onChange={(e) => setServerForm({ ...serverForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Jefe de Servidores">Jefe de Servidores</option>
                  <option value="Ujier General">Ujier General</option>
                  <option value="Recepción & Bienvenida">Recepción & Bienvenida</option>
                  <option value="Seguridad & Parqueo">Seguridad & Parqueo</option>
                  <option value="Ofrendas & Alfolíes">Ofrendas & Alfolíes</option>
                  <option value="Protocolo Pastoral">Protocolo Pastoral</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Área Asignada Frecuente</label>
                <input
                  type="text"
                  value={serverForm.assignedArea}
                  onChange={(e) => setServerForm({ ...serverForm, assignedArea: e.target.value })}
                  placeholder="Ej. Puerta Principal / Pasillo Central"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  value={serverForm.phone || ''}
                  onChange={(e) => setServerForm({ ...serverForm, phone: e.target.value })}
                  placeholder="555-432100"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Estado</label>
                <select
                  value={serverForm.status}
                  onChange={(e) => setServerForm({ ...serverForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Activo">Activo</option>
                  <option value="En Capacitación">En Capacitación</option>
                  <option value="Permiso Temporal">Permiso Temporal</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsServerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {editingServer ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROSTER MODAL */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <span>{editingRoster ? 'Editar Turno de Ujieres' : 'Nuevo Turno de Servidores'}</span>
              </h3>
              <button onClick={() => setIsRosterModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRosterSubmit} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Fecha del Culto *</label>
                  <input
                    type="date"
                    required
                    value={rosterForm.serviceDate}
                    onChange={(e) => setRosterForm({ ...rosterForm, serviceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Tipo de Servicio *</label>
                  <select
                    value={rosterForm.serviceType}
                    onChange={(e) => setRosterForm({ ...rosterForm, serviceType: e.target.value as any })}
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
                <label className="block font-semibold mb-1">Líder / Capitán de Turno *</label>
                <input
                  type="text"
                  required
                  value={rosterForm.leaderInCharge}
                  onChange={(e) => setRosterForm({ ...rosterForm, leaderInCharge: e.target.value })}
                  placeholder="Ej. Diácono Mario Peña"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              {/* YouTube Video URL */}
              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video en YouTube para Capacitación / Pauta</span>
                </label>
                <input
                  type="url"
                  value={rosterForm.youtubeUrl || ''}
                  onChange={(e) => setRosterForm({ ...rosterForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Instrucciones Especiales / Notas</label>
                <textarea
                  rows={3}
                  value={rosterForm.notes || ''}
                  onChange={(e) => setRosterForm({ ...rosterForm, notes: e.target.value })}
                  placeholder="Ej: Servicio de Santa Cena, preparar copas y pan a las 18:00 hrs..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRosterModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {editingRoster ? 'Guardar Cambios' : 'Crear Turno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROTOCOL MODAL */}
      {isProtocolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span>{editingProtocol ? 'Editar Guía de Protocolo' : 'Nuevo Protocolo de Servidores'}</span>
              </h3>
              <button onClick={() => setIsProtocolModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProtocolSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1">Título de la Guía o Pauta *</label>
                <input
                  type="text"
                  required
                  value={protocolForm.title}
                  onChange={(e) => setProtocolForm({ ...protocolForm, title: e.target.value })}
                  placeholder="Ej. 5. Protocolo de Atención en Santa Cena"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Categoría</label>
                <select
                  value={protocolForm.category}
                  onChange={(e) => setProtocolForm({ ...protocolForm, category: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                >
                  <option value="Bienvenida a Nuevos">Bienvenida a Nuevos</option>
                  <option value="Recolección de Ofrendas">Recolección de Ofrendas</option>
                  <option value="Santa Cena">Santa Cena</option>
                  <option value="Emergencias Médicas">Emergencias Médicas</option>
                  <option value="Orden en el Altar">Orden en el Altar</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción y Pautas</label>
                <textarea
                  rows={4}
                  required
                  value={protocolForm.description}
                  onChange={(e) => setProtocolForm({ ...protocolForm, description: e.target.value })}
                  placeholder="Describe las instrucciones paso a paso para el equipo..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 flex items-center space-x-1 text-red-600 dark:text-red-400">
                  <Play className="w-3.5 h-3.5 fill-red-600" />
                  <span>Enlace de Video de Capacitación en YouTube</span>
                </label>
                <input
                  type="url"
                  value={protocolForm.youtubeUrl || ''}
                  onChange={(e) => setProtocolForm({ ...protocolForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProtocolModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {editingProtocol ? 'Guardar Cambios' : 'Crear Protocolo'}
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
