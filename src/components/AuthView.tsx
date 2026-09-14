import React, { useState, useRef } from 'react';
import { ChurchConfig, SystemRole, UserProfile } from '../types';
import {
  Church,
  Lock,
  Mail,
  User,
  Phone,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  KeyRound,
  Shield,
  Bell,
  Sparkles,
  Camera,
  BookOpen,
} from 'lucide-react';
import { PhotoCaptureModal } from './PhotoCaptureModal';

interface AuthViewProps {
  config: ChurchConfig;
  systemUsers: UserProfile[];
  onLoginSuccess: (user: UserProfile) => void;
  onRegisterUser: (newUser: UserProfile) => void;
  activeVerse?: string;
}

export const AuthView: React.FC<AuthViewProps> = ({
  config,
  systemUsers,
  onLoginSuccess,
  onRegisterUser,
  activeVerse,
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRoleInterest, setRegRoleInterest] = useState<SystemRole>('Miembro');
  const [regAvatarUrl, setRegAvatarUrl] = useState('');
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [regNotes, setRegNotes] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUser(user);
    setLoginEmail(user.email);
    setLoginPassword('');
    setLoginError(null);

    if (user.status === 'pending') {
      setLoginError(
        '⚠️ Esta cuenta está PENDIENTE de aprobación por la administración. No podrás ingresar hasta que sea aprobada.'
      );
      return;
    }

    if (user.status === 'rejected') {
      setLoginError('❌ Esta cuenta fue rechazada por la administración.');
      return;
    }

    // Auto-focus the password field
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 100);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const inputClean = loginEmail.trim().toLowerCase();
    const foundUser = systemUsers.find(
      (u) =>
        (u.email || '').trim().toLowerCase() === inputClean ||
        (u.name || '').trim().toLowerCase() === inputClean ||
        (u.id || '').trim().toLowerCase() === inputClean
    );

    if (!foundUser) {
      setLoginError('No se encontró ningún usuario con este correo o nombre.');
      return;
    }

    // Always require and strictly check password
    if (!loginPassword || foundUser.password !== loginPassword.trim()) {
      setLoginError('Contraseña incorrecta. Por favor introduce la contraseña correcta para ingresar.');
      return;
    }

    // Check account registration status
    if (foundUser.status === 'pending') {
      setLoginError(
        '⚠️ Tu cuenta está PENDIENTE de aprobación por el Administrador o Desarrollador. Ya se le ha notificado.'
      );
      return;
    }

    if (foundUser.status === 'rejected') {
      setLoginError('❌ Esta cuenta fue rechazada por la administración.');
      return;
    }

    // Login successful
    onLoginSuccess(foundUser);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Por favor completa todos los campos obligatorios.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    const emailClean = regEmail.trim().toLowerCase();
    const existing = systemUsers.find(
      (u) => (u.email || '').trim().toLowerCase() === emailClean
    );

    if (existing) {
      setRegError('Ya existe un usuario registrado con este correo electrónico.');
      return;
    }

    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      phone: regPhone.trim(),
      role: regRoleInterest,
      avatarUrl: regAvatarUrl || `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      allowedTabs: [], // No tabs allowed until admin/dev approves
      status: 'pending',
      requestedAt: new Date().toISOString(),
      requestedRoleInterest: regRoleInterest,
      notes: regNotes.trim(),
    };

    onRegisterUser(newUser);
    setRegSuccess(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white/10 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/20 dark:border-slate-800/80 shadow-2xl overflow-hidden relative z-10 text-white">
        
        {/* Header Branding */}
        <div className="p-6 sm:p-8 text-center border-b border-white/10 bg-white/5 relative">
          <div className="flex justify-center mb-3">
            {config.logoUrl ? (
              <div className="relative group">
                <img
                  src={config.logoUrl}
                  alt={config.name || 'Logo del Sistema'}
                  className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-indigo-500/20 border-2 border-white/30 bg-white/10"
                />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
                <Church className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {config.name || 'Iglesia Central'}
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200/80 mt-1 max-w-md mx-auto">
            {config.slogan || 'Sistema de Gestión Eclesial y Membresía'}
          </p>

          {/* Tab Selector */}
          <div className="mt-6 inline-flex p-1 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md">
            <button
              onClick={() => {
                setActiveMode('login');
                setRegSuccess(false);
              }}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                activeMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              onClick={() => {
                setActiveMode('register');
                setRegSuccess(false);
              }}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center space-x-2 ${
                activeMode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Solicitar Cuenta</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {activeMode === 'login' ? (
            /* LOGIN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              {selectedUser && !loginError && (
                <div className="p-3 rounded-2xl bg-indigo-600/20 border border-indigo-400/40 text-indigo-200 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {selectedUser.avatarUrl && (
                      <img
                        src={selectedUser.avatarUrl}
                        alt={selectedUser.name}
                        className="w-6 h-6 rounded-full object-cover ring-1 ring-indigo-400"
                      />
                    )}
                    <span>
                      Usuario seleccionado: <strong>{selectedUser.name}</strong> ({selectedUser.role}). Por favor introduce tu contraseña.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setLoginEmail('');
                      setLoginPassword('');
                    }}
                    className="text-xs text-indigo-300 hover:text-white ml-2 underline"
                  >
                    Cambiar
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Ej. Xavi o ejemplo@iglesia.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 focus:bg-white/20 text-white placeholder-slate-400 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    ref={passwordInputRef}
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 focus:bg-white/20 text-white placeholder-slate-400 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Ingresar al Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* DEMO ACCESO RAPIDO */}
              <div className="pt-5 border-t border-white/10 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300/80 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Seleccionar Usuario Registrado:
                  </span>
                  <span className="text-[10px] text-slate-400">
                    (Requiere ingresar contraseña)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {systemUsers.map((usr) => {
                    const isSelected =
                      selectedUser?.id === usr.id ||
                      (loginEmail && (
                        loginEmail.trim().toLowerCase() === (usr.email || '').toLowerCase() ||
                        loginEmail.trim().toLowerCase() === (usr.name || '').toLowerCase()
                      ));
                    return (
                      <button
                        key={usr.id}
                        type="button"
                        onClick={() => handleSelectUser(usr)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400/50 text-white shadow-sm'
                            : usr.status === 'pending'
                            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 text-amber-200'
                            : 'bg-white/5 border-white/10 hover:bg-white/15 text-white'
                        }`}
                      >
                        {usr.avatarUrl ? (
                          <img
                            src={usr.avatarUrl}
                            alt={usr.name}
                            className={`w-8 h-8 rounded-full object-cover shrink-0 ring-1 ${
                              isSelected ? 'ring-indigo-400' : 'ring-white/30'
                            }`}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {usr.name.charAt(0)}
                          </div>
                        )}
                        <div className="truncate">
                          <div className="font-bold text-xs truncate flex items-center gap-1">
                            <span>{usr.name}</span>
                            {usr.role === 'Desarrollador' && (
                              <span className="text-[9px] bg-purple-500/30 border border-purple-400/40 text-purple-200 font-extrabold px-1 py-0.2 rounded">
                                DEV
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-300 truncate">
                            {usr.role}{' '}
                            {usr.status === 'pending' && (
                              <span className="text-amber-400 font-bold">(Pendiente)</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          ) : regSuccess ? (
            /* SUCCESS CONFIRMATION REGISTRATION NOTIFICATION */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold mb-2">
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>Notificación Enviada al Administrador</span>
                </span>
                <h3 className="text-xl font-bold text-white">¡Solicitud Registrada con Éxito!</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-md mx-auto">
                  Tu solicitud ha sido enviada al Pastor / Administrador (Pr. Carlos Mendoza). Tan pronto como revise tus datos, apruebe tu cuenta y te asigne tus roles y permisos de acceso, podrás ingresar al sistema con tu correo y contraseña.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Solicitante:</span>
                  <span className="font-bold text-white">{regName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correo:</span>
                  <span className="font-bold text-white">{regEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estado de Cuenta:</span>
                  <span className="font-bold text-amber-400">Pendiente de Roles</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('login');
                  setRegSuccess(false);
                }}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          ) : (
            /* REGISTRATION FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {regError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2.5">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div className="p-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 text-indigo-200 text-xs flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Al registrarte, el Pastor/Administrador recibirá una notificación para autorizar tus permisos.</span>
              </div>

              {/* User Photo Capture / Upload for Registration */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  {regAvatarUrl ? (
                    <img
                      src={regAvatarUrl}
                      alt="Foto de Registro"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-indigo-400 shadow-md shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-bold flex items-center justify-center text-lg shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <h5 className="font-bold text-xs text-white">Foto de Perfil del Usuario</h5>
                    <p className="text-[10px] text-indigo-200/70">
                      {regAvatarUrl ? 'Foto adjuntada' : 'Opcional: Sube o tómate una foto'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 cursor-pointer transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{regAvatarUrl ? 'Cambiar Foto' : 'Tomar / Subir'}</span>
                  </button>
                  {regAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setRegAvatarUrl('')}
                      className="p-1.5 text-xs text-rose-300 hover:text-rose-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Nombre Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Teléfono (WhatsApp)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+52 (55) 0000-0000"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="juan.perez@email.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Rol o Área de Interés
                </label>
                <select
                  value={regRoleInterest}
                  onChange={(e) => setRegRoleInterest(e.target.value as SystemRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-white/15 text-white text-xs outline-none font-bold cursor-pointer"
                >
                  <option value="Miembro">Miembro</option>
                  <option value="Líder de Jóvenes">Líder de Jóvenes</option>
                  <option value="Líder">Líder (Directorio & Agendas)</option>
                  <option value="Contador">Contador / Tesorero</option>
                  <option value="Administrador">Administrador</option>
                  <option value="Alabanza">Ministerio de Alabanza</option>
                  <option value="Danza">Ministerio de Danza</option>
                  <option value="Damas">Ministerio de Damas</option>
                  <option value="Servidores">Ministerio de Servidores / Ujieres</option>
                  <option value="Teatro">Ministerio de Teatro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                  Nota / Mensaje para el Pastor o Administrador
                </label>
                <textarea
                  rows={2}
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  placeholder="Ej. Soy voluntario en Escuela Dominical y requiero acceso a la agenda."
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/15 focus:border-indigo-400 text-white placeholder-slate-400 text-xs outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                <span>Enviar Solicitud al Administrador</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Inspirational Scripture Banner upon entering the system */}
        {(() => {
          const verseToShow =
            config.verseMode === 'fixed'
              ? (config.verse || activeVerse)
              : (activeVerse || config.verse);

          if (!verseToShow) return null;

          return (
            <div className="px-6 py-3 bg-black/30 border-t border-white/10 text-center">
              <div className="max-w-md mx-auto flex items-center justify-center space-x-2 text-xs font-serif italic text-indigo-200/90 leading-relaxed">
                <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0 inline-block" />
                <p className="whitespace-normal">{verseToShow}</p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Photo Capture & Upload Modal */}
      <PhotoCaptureModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onPhotoSelected={(url) => setRegAvatarUrl(url)}
        currentPhotoUrl={regAvatarUrl}
        title="Foto de Perfil del Usuario"
        subtitle="Sube una foto o tómate una captura con la cámara de tu dispositivo"
      />
    </div>
  );
};
