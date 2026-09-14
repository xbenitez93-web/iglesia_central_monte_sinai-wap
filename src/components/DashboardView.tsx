import React from 'react';
import {
  ChurchConfig,
  ChurchEvent,
  CoopAccount,
  FinancialTransaction,
  Member,
  MicroLoan,
  UserProfile,
} from '../types';
import {
  Users,
  Calendar,
  DollarSign,
  PiggyBank,
  UserPlus,
  CalendarPlus,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
  HandHeart,
  ChevronRight,
  ShieldCheck,
  Bell,
  UserCheck,
  UserX,
  CheckCircle2,
  Lock,
  Music,
  Drama,
  MessageSquare,
  Database,
  Settings,
  Maximize2,
  Zap,
  Heart,
  BookOpen,
  Volume2,
  Shield,
  Layers,
} from 'lucide-react';
import { TabType } from './Navigation';
import { getDashboardPermissionsForRole } from '../utils/dashboardPermissions';

interface DashboardViewProps {
  members: Member[];
  events: ChurchEvent[];
  transactions: FinancialTransaction[];
  coopAccounts: CoopAccount[];
  microLoans: MicroLoan[];
  config: ChurchConfig;
  currentUser?: UserProfile;
  systemUsers?: UserProfile[];
  onUpdateSystemUsers?: (updated: UserProfile[]) => void;
  setActiveTab: (tab: TabType) => void;
  onOpenAIAssistant: () => void;
  onOpenAddMember: () => void;
  onOpenAddEvent: () => void;
  onOpenAddTransaction: () => void;
  onTriggerLockNow?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  events,
  transactions,
  coopAccounts,
  microLoans,
  config,
  currentUser,
  systemUsers = [],
  onUpdateSystemUsers,
  setActiveTab,
  onOpenAIAssistant,
  onOpenAddMember,
  onOpenAddEvent,
  onOpenAddTransaction,
  onTriggerLockNow,
}) => {
  // Get active dashboard RBAC permissions for the current user's role
  const userRole = currentUser?.role || 'Miembro';
  const permissions = getDashboardPermissionsForRole(config, userRole);

  // Check module permissions from currentUser
  const allowedTabs = currentUser?.allowedTabs;
  const hasDirectory = !allowedTabs || allowedTabs.includes('directory');
  const hasEvents = !allowedTabs || allowedTabs.includes('events');
  const hasFinances = !allowedTabs || allowedTabs.includes('finances');
  const hasCoop = config.enableCoopModule && (!allowedTabs || allowedTabs.includes('coop'));

  // Pending user registration requests
  const pendingUsers = systemUsers.filter((u) => u.status === 'pending');
  const isAdmin = currentUser?.role === 'Pastor / Administrador' || currentUser?.role === 'Administrador' || currentUser?.role === 'Desarrollador' || !currentUser;

  const handleQuickApproveUser = (userId: string) => {
    if (!onUpdateSystemUsers) return;
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'approved' as const,
          allowedTabs: ['dashboard', 'directory', 'events'] as TabType[],
        };
      }
      return u;
    });
    onUpdateSystemUsers(updated);
  };

  const handleQuickRejectUser = (userId: string) => {
    if (!onUpdateSystemUsers) return;
    const updated = systemUsers.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: 'rejected' as const,
          allowedTabs: [] as TabType[],
        };
      }
      return u;
    });
    onUpdateSystemUsers(updated);
  };

  // Calculations
  const activeMembersCount = members.filter((m) => m.status === 'Activo').length;

  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. 2026-07

  const monthlyIncome = transactions
    .filter((t) => t.type !== 'Egreso/Gasto' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyExpense = transactions
    .filter((t) => t.type === 'Egreso/Gasto' && t.date.startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + t.amount, 0);

  const coopTotalFund = coopAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
  const pendingLoansCount = microLoans.filter((l) => l.status === 'Solicitado').length;

  const upcomingEvents = [...events]
    .filter((e) => e.status === 'Programado')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  const nextMainEvent = upcomingEvents[0];

  const showMembersCard = permissions.kpiMembers && hasDirectory;
  const showEventsCard = permissions.kpiEvents && hasEvents;
  const showFinancesCard = permissions.kpiFinances && hasFinances;
  const showCoopCard = permissions.kpiCoop && hasCoop;
  const showAnyKpi = showMembersCard || showEventsCard || showFinancesCard || showCoopCard;

  const showNextService = permissions.nextService && hasEvents;
  const showQuickActions = permissions.quickActions && (hasDirectory || hasEvents || hasFinances);
  const showRecentFinances = permissions.recentFinances && hasFinances;
  const showMinistriesSummary = permissions.ministriesSummary && hasDirectory;

  const showLeftColumn = showNextService || showQuickActions;
  const showRightColumn = showRecentFinances || showMinistriesSummary;

  return (
    <div className="space-y-6">
      {/* Welcome Hero Banner */}
      {permissions.heroBanner && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/90 via-indigo-800/85 to-purple-900/90 backdrop-blur-2xl text-white p-6 sm:p-8 shadow-xl border border-white/20">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-indigo-100 border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {currentUser ? `SISTEMA ECLESIAL • ROL: ${currentUser.role.toUpperCase()}` : 'PANEL DE ADMINISTRACIÓN ECLESIAL'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {currentUser ? `Bienvenido, ${currentUser.name}` : `Bienvenido a ${config.name}`}
              </h2>
              <p className="text-sm text-indigo-100/90 leading-relaxed">
                {config.name} • {config.slogan}. Administración transparente de congregantes, agenda de cultos y vida comunitaria.
              </p>
            </div>

            {permissions.quickShortcuts && (
              <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
                {hasFinances && (
                  <button
                    onClick={onOpenAddTransaction}
                    className="px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white text-indigo-900 font-semibold text-xs sm:text-sm shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center space-x-2 border border-white/40"
                  >
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>Diezmo / Entrada</span>
                  </button>
                )}
                <button
                  onClick={onOpenAIAssistant}
                  className="px-4 py-2.5 rounded-xl bg-amber-500/90 hover:bg-amber-600 text-white font-semibold text-xs sm:text-sm shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center space-x-2 border border-white/30"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Asistente IA</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PENDING REGISTRATION NOTIFICATION BANNER FOR ADMINS */}
      {permissions.pendingApprovals && isAdmin && pendingUsers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/15 border-2 border-amber-500/40 backdrop-blur-xl shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30 shrink-0 animate-pulse">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Solicitudes de Registro Pendientes de Revisión</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs">
                    {pendingUsers.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Hay nuevos usuarios esperando aprobación y asignación de roles para ingresar al sistema.
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <span>Gestionar en Ajustes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {pendingUsers.map((pUser) => (
              <div
                key={pUser.id}
                className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {pUser.avatarUrl ? (
                    <img
                      src={pUser.avatarUrl}
                      alt={pUser.name}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-amber-400/40 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {pUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="truncate text-xs">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{pUser.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{pUser.email}</p>
                    {pUser.requestedRoleInterest && (
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                        Interés: {pUser.requestedRoleInterest}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickApproveUser(pUser.id)}
                    className="p-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                    title="Aprobar Acceso"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Aprobar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRejectUser(pUser.id)}
                    className="p-1.5 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs transition-colors cursor-pointer"
                    title="Rechazar Solicitud"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {showAnyKpi && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Members Card */}
          {showMembersCard && (
            <div
              onClick={() => setActiveTab('directory')}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 hover:border-indigo-300/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Miembros Registrados
                </span>
                <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {members.length}
                </span>
                <span className="text-xs font-medium text-emerald-700 bg-emerald-50/80 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-800/50">
                  {activeMembersCount} Activos
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>Directorio de congregantes</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          )}

          {/* Next Event Card */}
          {showEventsCard && (
            <div
              onClick={() => setActiveTab('events')}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 hover:border-indigo-300/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Agenda & Cultos
                </span>
                <div className="p-2.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {upcomingEvents.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">Próximos</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 truncate font-medium">
                {nextMainEvent ? nextMainEvent.title : 'Sin eventos agendados'}
              </p>
            </div>
          )}

          {/* Monthly Finances Card */}
          {showFinancesCard && (
            <div
              onClick={() => setActiveTab('finances')}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 hover:border-indigo-300/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Ingresos del Mes
                </span>
                <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline space-x-2">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {config.currencySymbol}{monthlyIncome.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span className="flex items-center text-rose-600 dark:text-rose-400">
                  <TrendingDown className="w-3.5 h-3.5 mr-1" /> Egresos: {config.currencySymbol}{monthlyExpense.toFixed(2)}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          )}

          {/* Minicooperative Card */}
          {showCoopCard && (
            <div
              onClick={() => setActiveTab('coop')}
              className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 hover:border-indigo-300/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Fondo Minicooperativa
                </span>
                <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform backdrop-blur-xs">
                  <PiggyBank className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {config.currencySymbol}{coopTotalFund.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
                {pendingLoansCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                    {pendingLoansCount} Solicitudes
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center justify-between">
                <span>Caja de ahorro eclesial</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </p>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Section */}
      {(showLeftColumn || showRightColumn) && (
        <div className={`grid grid-cols-1 ${showLeftColumn && showRightColumn ? 'lg:grid-cols-3' : ''} gap-6`}>
          {/* Left 2-Columns: Next Service & Servant Rosters */}
          {showLeftColumn && (
            <div className={`${showRightColumn ? 'lg:col-span-2' : ''} space-y-6`}>
              {/* Next Main Service Banner */}
              {showNextService && (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/40 dark:border-slate-800/60 pb-3">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Próximo Culto de la Congregación
                      </h3>
                    </div>
                    <button
                      onClick={() => setActiveTab('events')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Ver toda la agenda</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {nextMainEvent ? (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-slate-700/50 gap-3">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                            {nextMainEvent.type}
                          </span>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                            {nextMainEvent.title}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {nextMainEvent.date} a las {nextMainEvent.time} hrs • {nextMainEvent.location}
                          </p>
                        </div>
                        <div className="shrink-0">
                          <span className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-xs">
                            Predicador: {nextMainEvent.speaker}
                          </span>
                        </div>
                      </div>

                      {nextMainEvent.verseText && (
                        <p className="text-xs italic text-indigo-900 dark:text-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 backdrop-blur-xs">
                          {nextMainEvent.verseText}
                        </p>
                      )}

                      {/* Servant Rosters for Event */}
                      <div>
                        <h5 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2.5">
                          Servidores Asignados:
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {nextMainEvent.teamAssignments.map((team, idx) => (
                            <div
                              key={`${team.role}_${team.memberName}_${idx}`}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-white/40 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 backdrop-blur-xs"
                            >
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {team.role}:
                              </span>
                              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                {team.memberName}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 py-4 text-center">No hay próximos eventos configurados.</p>
                  )}
                </div>
              )}

              {/* Quick Actions Panel: Master Multi-Action Deck */}
              {showQuickActions && (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          Botonera de Acciones Eclesiales
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Acceso directo a funciones ministeriales, salvapantallas y herramientas
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                      +14 Funciones
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {hasDirectory && (
                      <button
                        type="button"
                        onClick={onOpenAddMember}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                      >
                        <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-1.5 group-hover:scale-110 transition-transform">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                          Nuevo Miembro
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Ficha pastoral</span>
                      </button>
                    )}

                    {hasEvents && (
                      <button
                        type="button"
                        onClick={onOpenAddEvent}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-purple-50/70 dark:hover:bg-purple-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                      >
                        <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform">
                          <CalendarPlus className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                          Agendar Culto
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Calendario</span>
                      </button>
                    )}

                    {hasFinances && (
                      <button
                        type="button"
                        onClick={onOpenAddTransaction}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                      >
                        <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                          Registrar Diezmo
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Finanzas santas</span>
                      </button>
                    )}

                    {/* Bloquear Pantalla Inmediatamente */}
                    {onTriggerLockNow && (
                      <button
                        type="button"
                        onClick={() => onTriggerLockNow()}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/30 hover:bg-amber-500/20 dark:hover:bg-amber-900/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                      >
                        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                          <Lock className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200 text-center">
                          Bloquear Pantalla
                        </span>
                        <span className="text-[10px] text-amber-600/80 dark:text-amber-400/70 font-normal">Salvapantallas</span>
                      </button>
                    )}

                    {/* Asistente IA Pastoral */}
                    <button
                      type="button"
                      onClick={onOpenAIAssistant}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-purple-500/30 bg-purple-500/10 dark:bg-purple-950/30 hover:bg-purple-500/20 dark:hover:bg-purple-900/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200 text-center">
                        Pastoral IA
                      </span>
                      <span className="text-[10px] text-purple-600/80 dark:text-purple-400/70 font-normal">Sermones y guía</span>
                    </button>

                    {/* Alabanza y Música */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('worship')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-rose-50/70 dark:hover:bg-rose-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-rose-50/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Music className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Alabanza & Música
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Cancionero y pistas</span>
                    </button>

                    {/* Danza Cristiana */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('dance')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-pink-50/70 dark:hover:bg-pink-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-pink-50/80 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Heart className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Ministerio Danza
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Coreografías y panderos</span>
                    </button>

                    {/* Teatro Cristiano */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('theater')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-amber-50/70 dark:hover:bg-amber-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Drama className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Teatro & Guiones
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Obras bíblicas</span>
                    </button>

                    {/* Ujieres & Servidores */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('ushers')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-cyan-50/70 dark:hover:bg-cyan-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Ujieres / Protocolo
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Turnos y servicio</span>
                    </button>

                    {/* Sociedad de Damas */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('women')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-fuchsia-50/70 dark:hover:bg-fuchsia-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-fuchsia-50/80 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Sociedad Femenil
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Actividades damas</span>
                    </button>

                    {/* Cooperativa & Ahorro */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('coop')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <PiggyBank className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Cooperativa Eclesial
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Ahorro y créditos</span>
                    </button>

                    {/* Configuración del Sistema & Salvapantallas */}
                    <button
                      type="button"
                      onClick={() => setActiveTab('settings')}
                      className="flex flex-col items-center justify-center p-3 rounded-2xl border border-white/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all cursor-pointer group backdrop-blur-md active:scale-95"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mb-1.5 group-hover:scale-110 transition-transform">
                        <Settings className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 text-center">
                        Ajustes & Pantalla
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">Configurar templo</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Right 1-Column: Recent Financial Movements & Ministry Breakdown */}
          {showRightColumn && (
            <div className="space-y-6">
              {/* Recent Financial Transactions */}
              {showRecentFinances && (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/40 dark:border-slate-800/60 pb-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Movimientos Financieros
                    </h3>
                    <button
                      onClick={() => setActiveTab('finances')}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Ver todo
                    </button>
                  </div>

                  <div className="space-y-3">
                    {transactions.slice(0, 4).map((tx) => {
                      const isIncome = tx.type !== 'Egreso/Gasto';
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/40 dark:bg-slate-800/50 border border-white/40 dark:border-slate-700/50 backdrop-blur-xs"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-900 dark:text-white">
                              {tx.type} - {tx.memberName || tx.category}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {tx.date} • {tx.paymentMethod}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold ${
                              isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {isIncome ? '+' : '-'}{config.currencySymbol}{tx.amount.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Active Ministries Summary */}
              {showMinistriesSummary && (
                <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/60 dark:border-slate-800/60 shadow-lg shadow-slate-900/5 space-y-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Ministerios en Servicio
                  </h3>
                  <div className="space-y-2 text-xs">
                    {[
                      { name: 'Alabanza y Música', count: members.filter(m => m.ministryRoles.includes('Director de Alabanza') || m.ministryRoles.includes('Músico')).length },
                      { name: 'Escuela Dominical', count: members.filter(m => m.ministryRoles.includes('Maestro Escuela Dominical')).length },
                      { name: 'Diaconado y Ujieres', count: members.filter(m => m.ministryRoles.includes('Diácono') || m.ministryRoles.includes('Ujier / Recepción')).length },
                      { name: 'Jóvenes y Multimedia', count: members.filter(m => m.ministryRoles.includes('Líder de Jóvenes') || m.ministryRoles.includes('Equipo de Sonido / Media')).length },
                    ].map((m) => (
                      <div key={m.name} className="flex items-center justify-between p-2.5 rounded-xl border border-white/40 dark:border-slate-800/60 bg-white/30 dark:bg-slate-800/40 backdrop-blur-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{m.name}</span>
                        <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100/80 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {m.count} colaboradores
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
