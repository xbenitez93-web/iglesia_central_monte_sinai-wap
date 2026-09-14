import React, { useState, useMemo } from 'react';
import {
  ChurchConfig,
  MinistryItem,
  DEFAULT_MINISTRIES,
  Member,
  MinistryWorkPlan,
  UserProfile,
  DeletedItem,
} from '../../types';
import { getMinistryIconComponent } from '../../utils/ministryIcons';
import { isMinistryAccessibleForUser } from '../../lib/rbac';
import {
  Sparkles,
  Search,
  Users,
  Target,
  Clock,
  User,
  Phone,
  Mail,
  ChevronRight,
  ArrowLeft,
  Sliders,
  ExternalLink,
  Layers,
  CheckCircle2,
  Calendar,
  Lock,
  ShieldAlert,
  X,
} from 'lucide-react';

interface MinistryHubViewProps {
  config: ChurchConfig;
  members: Member[];
  workPlans: MinistryWorkPlan[];
  currentUser: UserProfile | null;
  onSelectMinistryView: (ministryId: string) => void;
  onOpenDeveloperMinistries?: () => void;
}

export const MinistryHubView: React.FC<MinistryHubViewProps> = ({
  config,
  members,
  workPlans,
  currentUser,
  onSelectMinistryView,
  onOpenDeveloperMinistries,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [blockedMinistryAlert, setBlockedMinistryAlert] = useState<{
    name: string;
    reason?: string;
  } | null>(null);

  const ministries: MinistryItem[] = useMemo(() => {
    if (config.ministries && config.ministries.length > 0) {
      return [...config.ministries].sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return DEFAULT_MINISTRIES;
  }, [config.ministries]);

  const activeMinistries = useMemo(() => {
    return ministries.filter((m) => m.enabled);
  }, [ministries]);

  const filteredMinistries = useMemo(() => {
    return activeMinistries.filter((m) => {
      return (
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.shortName && m.shortName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (m.leaderName && m.leaderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [activeMinistries, searchQuery]);

  const isDeveloperOrAdmin =
    currentUser?.role === 'Desarrollador' ||
    currentUser?.role === 'Pastor' ||
    currentUser?.role === 'Administrador';

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* HERO BANNER */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Ministerios & Grupos de Servicio Eclesial</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Centro de Ministerios
            </h1>
            <p className="text-purple-200 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Explora los diferentes ministerios y áreas de servicio de la congregación. Consulta sus directores, planes de trabajo, convocatorias, integrantes y horarios de reunión.
            </p>
          </div>

          {isDeveloperOrAdmin && onOpenDeveloperMinistries && (
            <button
              type="button"
              onClick={onOpenDeveloperMinistries}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-purple-100 font-bold text-xs border border-white/20 flex items-center space-x-2 transition-all cursor-pointer backdrop-blur-sm self-start md:self-auto shrink-0"
            >
              <Sliders className="w-4 h-4 text-purple-300" />
              <span>Administrar Ministerios</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH AND QUICK SELECTOR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar ministerio por nombre o líder..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0 hidden sm:inline">
            Acceso Rápido:
          </span>
          {activeMinistries.map((m) => {
            const isAccessible = isMinistryAccessibleForUser(m.id, currentUser, members);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  if (isAccessible) {
                    onSelectMinistryView(m.id);
                  } else {
                    setBlockedMinistryAlert({
                      name: m.name,
                      reason: `Tu cuenta actual (${currentUser?.name || 'Usuario'} - Rol: ${currentUser?.role || 'Miembro'}) no tiene asignado el ministerio de ${m.name}. Solo los integrantes autorizados a este ministerio pueden ingresar.`,
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer shadow-2xs ${
                  isAccessible
                    ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-400 dark:hover:border-purple-600 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 hover:border-rose-300 hover:text-rose-500'
                }`}
                title={isAccessible ? `Acceder a ${m.name}` : `Acceso bloqueado: No perteneces a ${m.name}`}
              >
                {isAccessible ? (
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: m.color || '#7c3aed' }}
                  />
                ) : (
                  <Lock className="w-3 h-3 text-slate-400" />
                )}
                <span>{m.shortName || m.name}</span>
                {!isAccessible && (
                  <span className="text-[10px] font-bold text-slate-400">🔒</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* GRID DE TARJETAS DE MINISTERIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMinistries.map((ministry) => {
          const Icon = getMinistryIconComponent(ministry.iconName);
          const ministryColor = ministry.color || '#7c3aed';
          const ministryMembersCount = members.filter((mem) => mem.ministries?.includes(ministry.id)).length;
          const ministryPlansCount = workPlans.filter((p) => p.ministry === ministry.id).length;
          const isAccessible = isMinistryAccessibleForUser(ministry.id, currentUser, members);

          return (
            <div
              key={ministry.id}
              className={`rounded-3xl border shadow-sm transition-all flex flex-col justify-between overflow-hidden group ${
                isAccessible
                  ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700/60 hover:shadow-lg'
                  : 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 opacity-80 hover:opacity-100 border-dashed'
              }`}
            >
              {/* TOP COLOR BANNER */}
              <div
                className="h-20 p-4 flex items-start justify-between relative overflow-hidden transition-all"
                style={{
                  background: isAccessible
                    ? `linear-gradient(135deg, ${ministryColor} 0%, #1e1b4b 100%)`
                    : 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
                }}
              >
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md border border-white/30">
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex items-center space-x-1.5">
                  {!isAccessible && (
                    <span className="px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-amber-300 text-[10px] font-extrabold border border-amber-400/30 flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>Bloqueado</span>
                    </span>
                  )}
                  {ministry.badge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-extrabold border border-white/30">
                      {ministry.badge}
                    </span>
                  )}
                </div>
              </div>

              {/* CARD BODY */}
              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-lg font-extrabold transition-colors ${
                      isAccessible
                        ? 'text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {ministry.name}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {ministry.description}
                  </p>
                </div>

                {/* DETAILS */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  {ministry.leaderName && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1.5">
                        <User className="w-3.5 h-3.5 text-purple-500" />
                        <span>Líder Encargado(a):</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {ministry.leaderName}
                      </strong>
                    </div>
                  )}

                  {ministry.meetingSchedule && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reuniones / Ensayos:</span>
                      </span>
                      <strong className="text-slate-800 dark:text-slate-200">
                        {ministry.meetingSchedule}
                      </strong>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 pt-1">
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-500" />
                      <span>Integrantes:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      {ministryMembersCount} miembros
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center space-x-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Planes de Trabajo:</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                      {ministryPlansCount} planes
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                {isAccessible ? (
                  <button
                    type="button"
                    onClick={() => onSelectMinistryView(ministry.id)}
                    className="w-full mt-2 py-2.5 px-4 rounded-2xl text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-2 transition-all transform group-hover:scale-[1.02] cursor-pointer"
                    style={{
                      backgroundColor: ministryColor,
                    }}
                  >
                    <span>Acceder al Módulo</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBlockedMinistryAlert({
                      name: ministry.name,
                      reason: `Tu usuario actual (${currentUser?.name || 'Usuario'} • Rol: ${currentUser?.role || 'Miembro'}) no tiene asignado el ministerio de ${ministry.name}. Solo los miembros e integrantes asignados a este ministerio tienen acceso.`
                    })}
                    className="w-full mt-2 py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center space-x-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Módulo Bloqueado</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL / ALERT DE MINISTERIO BLOQUEADO */}
      {blockedMinistryAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Acceso Restringido
              </h3>
              <p className="text-xs font-extrabold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
                Ministerio de {blockedMinistryAlert.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 leading-relaxed">
                {blockedMinistryAlert.reason}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Tu Usuario:</span>
                <strong className="text-slate-800 dark:text-slate-200">{currentUser?.name || 'Invitado'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span>Tu Rol:</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                  {currentUser?.role || 'Miembro'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                Para solicitar acceso a este ministerio, comunícate con un Administrador o Desarrollador para que active la casilla correspondiente en "Usuarios & Roles".
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBlockedMinistryAlert(null)}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
