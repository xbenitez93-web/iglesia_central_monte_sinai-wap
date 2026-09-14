import React, { useState, useEffect } from 'react';
import { ChurchConfig, UserProfile } from '../types';
import {
  Church,
  Sparkles,
  Bell,
  UserCheck,
  Shield,
  ChevronDown,
  LogOut,
  Lock,
  Wifi,
  WifiOff,
  KeyRound,
  CheckCircle2,
  BookOpen,
  Shuffle,
  Sun,
  Moon,
} from 'lucide-react';
import { isTabAllowedForUser } from '../lib/rbac';

interface HeaderProps {
  config: ChurchConfig;
  currentUser?: UserProfile;
  systemUsers?: UserProfile[];
  onSwitchUser?: (user: UserProfile) => void;
  onLogout?: () => void;
  onNavigateToSettings?: () => void;
  onOpenAIAssistant: () => void;
  onOpenNotificationCenter?: () => void;
  onOpenInstallModal?: () => void;
  onOpenQuickGuide?: () => void;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
  unreadNotificationCount?: number;
  activeTab: string;
  activeVerse?: string;
  onNextRandomVerse?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  currentUser,
  systemUsers = [],
  onSwitchUser,
  onLogout,
  onNavigateToSettings,
  onOpenAIAssistant,
  onOpenNotificationCenter,
  onOpenInstallModal,
  onOpenQuickGuide,
  onToggleTheme,
  isDarkMode = false,
  unreadNotificationCount = 0,
  activeTab,
  activeVerse,
  onNextRandomVerse,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Switch User Password Modal State
  const [targetUserToSwitch, setTargetUserToSwitch] = useState<UserProfile | null>(null);
  const [switchPassword, setSwitchPassword] = useState('');
  const [switchError, setSwitchError] = useState('');

  // Online / Offline Detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handlePromptSwitchUser = (user: UserProfile) => {
    if (user.id === currentUser?.id) {
      setIsUserMenuOpen(false);
      return;
    }
    setTargetUserToSwitch(user);
    setSwitchPassword('');
    setSwitchError('');
    setIsUserMenuOpen(false);
  };

  const handleConfirmSwitchPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserToSwitch) return;

    // Check user password
    const expectedPassword = targetUserToSwitch.password || '123';
    if (switchPassword.trim() === expectedPassword) {
      if (onSwitchUser) {
        onSwitchUser(targetUserToSwitch);
      }
      setTargetUserToSwitch(null);
      setSwitchPassword('');
      setSwitchError('');
    } else {
      setSwitchError('Contraseña incorrecta.');
    }
  };

  const activeUser = currentUser || {
    id: 'default',
    name: 'Usuario Administrador',
    email: 'admin@iglesia.org',
    role: 'Pastor / Administrador' as const,
    allowedTabs: ['dashboard', 'directory', 'events', 'finances', 'coop', 'settings'],
  };

  const pendingUsers = systemUsers.filter((u) => u.status === 'pending');

  return (
    <header className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-b border-white/60 dark:border-slate-800/60 sticky top-0 z-30 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Church Name & Identity */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/90 to-purple-700/90 backdrop-blur-md text-white flex items-center justify-center shadow-md shadow-indigo-500/10 shrink-0 border border-white/20 overflow-hidden">
            {config.logoUrl ? (
              <img
                src={config.logoUrl}
                alt={config.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Church className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                {config.name}
              </h1>
              <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 backdrop-blur-xs">
                {config.denomination}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
              {config.slogan}
            </p>
          </div>
        </div>

        {/* Header Right Actions, Sync Status & Current Logged-in User */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Real-time Firebase & Offline Sync Indicator */}
          <div
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
              isOnline
                ? 'bg-emerald-50/90 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/80'
                : 'bg-amber-50/90 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/80'
            }`}
            title={
              isOnline
                ? 'Base de datos Firestore sincronizada en tiempo real'
                : 'Modo sin conexión: Datos guardados localmente. Se sincronizarán automáticamente al reconectar.'
            }
          >
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Firebase Sincronizado</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <WifiOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Local Offline Activo</span>
              </>
            )}
          </div>

          {/* Guía Rápida & Tutorial Button */}
          {onOpenQuickGuide && (
            <button
              onClick={onOpenQuickGuide}
              id="header-quick-guide-btn"
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs transition-all cursor-pointer"
              title="Abrir Guía Rápida y Tutorial del Sistema"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden sm:inline">Guía Rápida</span>
            </button>
          )}

          {/* Light / Dark Mode Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              id="header-theme-toggle-btn"
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
              title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}

          <button
            onClick={onOpenAIAssistant}
            id="ai-pastoral-assistant-btn"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/90 to-amber-600/90 hover:from-amber-600 hover:to-amber-700 text-white font-medium text-xs sm:text-sm shadow-md shadow-amber-500/10 backdrop-blur-md transition-all transform active:scale-98 cursor-pointer border border-white/20"
          >
            <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
            <span className="hidden xs:inline">Asistente IA</span>
          </button>

          {/* Logged in User Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/70 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-md rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs text-xs text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
              title="Cambiar usuario o perfil de acceso"
            >
              {activeUser.avatarUrl ? (
                <img
                  src={activeUser.avatarUrl}
                  alt={activeUser.name}
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-500/40"
                />
              ) : (
                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              )}
              <div className="text-left hidden sm:block">
                <div className="font-bold text-slate-900 dark:text-white leading-tight truncate max-w-[120px]">
                  {activeUser.name}
                </div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">
                  {activeUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu for Quick Role/User Switching */}
            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 dark:border-slate-800/80 z-50 py-2 text-slate-800 dark:text-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Usuario Conectado
                    </p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {activeUser.name}
                    </p>
                    <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Rol: {activeUser.role}
                    </span>
                  </div>

                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                    <span>Cambiar de Perfil (Pide Contraseña)</span>
                    <Shield className="w-3.5 h-3.5 text-indigo-500" />
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 px-1.5">
                    {systemUsers.map((usr) => (
                      <button
                        key={usr.id}
                        onClick={() => handlePromptSwitchUser(usr)}
                        className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          usr.id === activeUser.id
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 font-semibold text-indigo-700 dark:text-indigo-300'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {usr.avatarUrl ? (
                          <img
                            src={usr.avatarUrl}
                            alt={usr.name}
                            className="w-6 h-6 rounded-full object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {usr.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate flex-1">
                          <p className="font-medium leading-tight truncate">{usr.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{usr.role}</p>
                        </div>
                        <KeyRound className="w-3 h-3 text-slate-400" />
                      </button>
                    ))}
                  </div>

                  {/* Quick Guide & Settings Shortcuts */}
                  <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 px-1.5 space-y-0.5">
                    {onOpenQuickGuide && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenQuickGuide();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Ver Guía del Sistema</span>
                      </button>
                    )}
                  </div>

                  {/* LOGOUT BUTTON */}
                  {onLogout && (
                    <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-800 px-1.5">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center space-x-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* PUSH NOTIFICATION BELL (Visible to all users) */}
          <div className="relative">
            <button
              onClick={() => {
                if (onOpenNotificationCenter) {
                  onOpenNotificationCenter();
                } else {
                  setIsNotifOpen(!isNotifOpen);
                }
              }}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              title="Avisos, Notificaciones Push y Recordatorios"
            >
              <Bell className="w-5 h-5" />
              {(unreadNotificationCount > 0 || pendingUsers.length > 0) && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs animate-bounce">
                  {unreadNotificationCount + pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: VERIFICACIÓN DE CONTRASEÑA AL CAMBIAR DE USUARIO */}
      {targetUserToSwitch && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-150"
          onClick={() => setTargetUserToSwitch(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              {targetUserToSwitch.avatarUrl ? (
                <img
                  src={targetUserToSwitch.avatarUrl}
                  alt={targetUserToSwitch.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-500/30"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 flex items-center justify-center font-bold text-lg">
                  {targetUserToSwitch.name.charAt(0)}
                </div>
              )}
              <div className="truncate">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                  {targetUserToSwitch.name}
                </h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold truncate">
                  {targetUserToSwitch.role}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmSwitchPassword} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Ingresa la contraseña para acceder a este perfil:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    autoFocus
                    value={switchPassword}
                    onChange={(e) => {
                      setSwitchPassword(e.target.value);
                      setSwitchError('');
                    }}
                    placeholder="Contraseña del usuario"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                {switchError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5">
                    {switchError}
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setTargetUserToSwitch(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Verificar & Entrar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspirational Verse Banner Strip - Mensaje Diario Completo */}
      {(() => {
        const displayedVerse =
          config.verseMode === 'fixed'
            ? (config.verse || activeVerse)
            : (activeVerse || config.verse);

        if (!displayedVerse) return null;

        return (
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90 dark:from-slate-950/90 dark:via-indigo-950/40 dark:to-slate-950/90 backdrop-blur-md border-t border-indigo-100/60 dark:border-slate-800/80 px-4 py-2 text-center shadow-xs transition-colors duration-300">
            <div className="max-w-4xl mx-auto flex items-center justify-center space-x-2 text-xs sm:text-sm font-serif italic text-indigo-950 dark:text-indigo-200 leading-relaxed">
              <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 inline-block" />
              <p className="whitespace-normal break-words">
                {displayedVerse}
              </p>
              {onNextRandomVerse && config.verseMode !== 'fixed' && (
                <button
                  type="button"
                  onClick={onNextRandomVerse}
                  title="Cambiar a otro versículo bíblico al azar"
                  className="p-1 rounded-full text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 hover:bg-indigo-100/80 dark:hover:bg-indigo-900/60 transition-colors shrink-0 ml-1.5 cursor-pointer inline-flex items-center"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })()}
    </header>
  );
};
