import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Calendar,
  Clock,
  PiggyBank,
  Users,
  Sparkles,
  Send,
  Trash2,
  Volume2,
  Check,
  Smartphone,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { AppNotification, NotificationCategory } from '../types';
import {
  getNotificationPermission,
  isPushSupported,
  requestNotificationPermission,
  triggerNativePush,
} from '../lib/pushNotifications';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAll: () => void;
  onSendCustomPush: (notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  onNavigateToTab?: (tabName: string) => void;
  canSendBroadcast?: boolean;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAll,
  onSendCustomPush,
  onNavigateToTab,
  canSendBroadcast = true,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | NotificationCategory>('all');
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Form for new broadcast
  const [broadcastForm, setBroadcastForm] = useState<{
    title: string;
    body: string;
    category: NotificationCategory;
    priority: 'normal' | 'high' | 'urgent';
    targetTab: string;
    authorName: string;
  }>({
    title: '',
    body: '',
    category: 'events',
    priority: 'high',
    targetTab: 'events',
    authorName: 'Pastorado / Liderazgo',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermissionState(getNotificationPermission());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === 'granted') {
      triggerNativePush(
        '🔔 ¡Notificaciones Push Activadas!',
        'Recibirás recordatorios de cultos, ensayos y avisos de la Minicooperativa al instante.',
        { tag: 'welcome-push' }
      );
    }
  };

  const handleSendTestPush = () => {
    const success = triggerNativePush(
      '⛪ Iglesia Central Monte Sinaí',
      '¡Esta es una notificación de prueba en tiempo real! Tu dispositivo está conectado y listo para recibir avisos.',
      { tag: 'test-push' }
    );
    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
    if (!success && permissionState !== 'granted') {
      handleRequestPermission();
    }
  };

  const handleBroadcastSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.body) return;

    onSendCustomPush({
      title: broadcastForm.title,
      body: broadcastForm.body,
      category: broadcastForm.category,
      priority: broadcastForm.priority,
      targetTab: broadcastForm.targetTab,
      authorName: broadcastForm.authorName,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    // Also trigger native push on current device
    triggerNativePush(`📢 ${broadcastForm.title}`, broadcastForm.body, {
      tag: `church-broadcast-${Date.now()}`,
    });

    setBroadcastForm({
      title: '',
      body: '',
      category: 'events',
      priority: 'high',
      targetTab: 'events',
      authorName: 'Pastorado / Liderazgo',
    });
    setIsBroadcastModalOpen(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (selectedFilter === 'all') return true;
    return n.category === selectedFilter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'events':
        return <Calendar className="w-4 h-4 text-amber-500" />;
      case 'meetings':
        return <Clock className="w-4 h-4 text-indigo-500" />;
      case 'coop':
        return <PiggyBank className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const getCategoryBadge = (category: NotificationCategory) => {
    switch (category) {
      case 'events':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
            Evento / Culto
          </span>
        );
      case 'meetings':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300">
            Reunión / Ensayo
          </span>
        );
      case 'coop':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
            Minicooperativa
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300">
            General
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex min-h-full items-start sm:items-center justify-center bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Centro de Notificaciones Push
                {unreadCount > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
                    {unreadCount} sin leer
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Avisos de eventos, cultos solemnes, ensayos ministeriales y novedades de la cooperativa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PUSH STATUS BANNER & ACTION BAR */}
        <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-purple-50/40 to-slate-50/80 dark:from-slate-800/80 dark:via-indigo-950/40 dark:to-slate-900/80 border-b border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Estado Push en este dispositivo:
              </span>
              {permissionState === 'granted' ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Activas & Autorizadas
                </span>
              ) : permissionState === 'denied' ? (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Bloqueadas en navegador
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Pendiente de permiso
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {permissionState !== 'granted' && (
                <button
                  type="button"
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Activar Notificaciones Push</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSendTestPush}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                title="Prueba el sonido y aviso emergente del navegador"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{testNotificationSent ? '¡Enviada!' : 'Probar Notificación'}</span>
              </button>

              {canSendBroadcast && (
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Aviso Push</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 pt-2.5 gap-2 overflow-x-auto scrollbar-none">
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                Todos ({notifications.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('events')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  selectedFilter === 'events'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Eventos</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('meetings')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  selectedFilter === 'meetings'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Reuniones</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFilter('coop')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                  selectedFilter === 'coop'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Cooperativa</span>
              </button>
            </div>

            {notifications.length > 0 && (
              <div className="flex items-center space-x-2 shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={onMarkAllAsRead}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Leer todas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClearAll}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Borrar historial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => !notif.read && onMarkAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all relative ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    : 'bg-indigo-50/40 dark:bg-slate-800/80 border-indigo-200 dark:border-indigo-800/80 shadow-xs ring-1 ring-indigo-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getCategoryIcon(notif.category)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {getCategoryBadge(notif.category)}
                        {notif.priority === 'urgent' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            URGENTE
                          </span>
                        )}
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                        )}
                        <span className="text-[11px] text-slate-400">
                          {notif.date} {notif.time ? `• ${notif.time}` : ''}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {notif.body}
                      </p>

                      {notif.authorName && (
                        <p className="text-[10px] text-slate-400 pt-0.5">
                          Emitido por: <strong className="text-slate-600 dark:text-slate-300">{notif.authorName}</strong>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {notif.targetTab && onNavigateToTab && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToTab(notif.targetTab!);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Ir al módulo"
                      >
                        <span>Ver</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotification(notif.id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Eliminar aviso"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Bell className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No hay notificaciones en este filtro
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Todos los avisos de la congregación están al día. Cuando haya nuevos eventos o cultos aparecerán aquí.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <span className="text-[11px] text-slate-500">
            Sincronización Web Push & Sound Engine v2.0
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* SUB-MODAL: EMITIR AVISO PUSH A LA CONGREGACIÓN */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto p-4 flex min-h-full items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Emitir Aviso Push Congregacional
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Título del Anuncio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Anuncio de Vigilia Especial"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Categoría del Aviso
                </label>
                <select
                  value={broadcastForm.category}
                  onChange={(e) =>
                    setBroadcastForm({
                      ...broadcastForm,
                      category: e.target.value as NotificationCategory,
                      targetTab:
                        e.target.value === 'events'
                          ? 'events'
                          : e.target.value === 'coop'
                          ? 'coop'
                          : e.target.value === 'meetings'
                          ? 'worship'
                          : 'dashboard',
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                >
                  <option value="events">📅 Evento o Culto Especial</option>
                  <option value="meetings">⏰ Reunión de Ministerio o Ensayo</option>
                  <option value="coop">💰 Actualización de Minicooperativa</option>
                  <option value="general">📢 Mensaje General de Pastoreo</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Mensaje / Contenido *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escribe el texto detallado de la notificación..."
                  value={broadcastForm.body}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, body: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Prioridad
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) =>
                      setBroadcastForm({
                        ...broadcastForm,
                        priority: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">Alta (Destacado)</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Módulo Destino
                  </label>
                  <select
                    value={broadcastForm.targetTab}
                    onChange={(e) =>
                      setBroadcastForm({ ...broadcastForm, targetTab: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium"
                  >
                    <option value="events">Agendas y Eventos</option>
                    <option value="coop">Minicooperativa</option>
                    <option value="worship">Alabanza</option>
                    <option value="dance">Danza</option>
                    <option value="women">Damas</option>
                    <option value="ushers">Servidores</option>
                    <option value="theater">Teatro</option>
                    <option value="dashboard">Inicio</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Emitido por
                </label>
                <input
                  type="text"
                  value={broadcastForm.authorName}
                  onChange={(e) =>
                    setBroadcastForm({ ...broadcastForm, authorName: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Notificación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
