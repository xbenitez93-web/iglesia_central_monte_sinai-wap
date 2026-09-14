import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, RefreshCw, ChevronDown, ChevronUp, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { CustomSectionItem, UserProfile } from '../../types';
import {
  getSectionExpirationInfo,
  formatExpirationDate,
  generatePresetDate,
  toLocalDatetimeInputValue,
} from '../../utils/sectionExpiration';

interface SectionExpirationBannerProps {
  section: CustomSectionItem;
  currentUser?: UserProfile | null;
  onUpdateSection?: (updatedSection: CustomSectionItem) => void;
  onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SectionExpirationBanner: React.FC<SectionExpirationBannerProps> = ({
  section,
  currentUser,
  onUpdateSection,
  onShowToast,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExtending, setIsExtending] = useState(false);
  const [extendedDate, setExtendedDate] = useState('');

  // Update clock every second for live countdown
  useEffect(() => {
    if (!section.expiration?.enabled) return;
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, [section.expiration?.enabled]);

  if (!section.expiration || !section.expiration.enabled || !section.expiration.expiresAt) {
    return null;
  }

  const expInfo = getSectionExpirationInfo(section, currentDate);
  const canManage =
    currentUser?.role === 'Desarrollador' ||
    currentUser?.role === 'Administrador';

  const handleQuickExtend = (preset: '1day' | '3days' | '1week' | '1month') => {
    const newExpiresAt = generatePresetDate(preset);
    const updated: CustomSectionItem = {
      ...section,
      expiration: {
        ...section.expiration!,
        enabled: true,
        expiresAt: newExpiresAt,
      },
    };
    if (onUpdateSection) {
      onUpdateSection(updated);
      onShowToast?.('Vigencia extendida exitosamente', 'success');
      setIsExtending(false);
    }
  };

  const handleCustomExtend = () => {
    if (!extendedDate) return;
    const updated: CustomSectionItem = {
      ...section,
      expiration: {
        ...section.expiration!,
        enabled: true,
        expiresAt: extendedDate,
      },
    };
    if (onUpdateSection) {
      onUpdateSection(updated);
      onShowToast?.('Nueva fecha de vencimiento configurada', 'success');
      setIsExtending(false);
    }
  };

  // 1. VENCIDO CON ACCIÓN 'BANNER'
  if (expInfo.isExpired && expInfo.action === 'banner') {
    return (
      <div className="w-full mb-6 rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 backdrop-blur-md shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300">
                  Sección Finalizada
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatExpirationDate(section.expiration.expiresAt)}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
                {section.expiration.expiredMessage ||
                  'El periodo de vigencia activa de esta sección ha concluido. Su contenido permanece disponible para consulta.'}
              </p>
            </div>
          </div>

          {canManage && (
            <div className="flex items-center space-x-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0">
              <button
                type="button"
                onClick={() => setIsExtending(!isExtending)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Extender Vigencia</span>
                {isExtending ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Panel de extensión rápida para Administradores */}
        {canManage && isExtending && (
          <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-800/60 flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
              Extensión rápida:
            </span>
            <button
              type="button"
              onClick={() => handleQuickExtend('1day')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-500 text-xs font-semibold"
            >
              +1 Día
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtend('3days')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-500 text-xs font-semibold"
            >
              +3 Días
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtend('1week')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-500 text-xs font-semibold"
            >
              +1 Semana
            </button>
            <button
              type="button"
              onClick={() => handleQuickExtend('1month')}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:border-amber-500 text-xs font-semibold"
            >
              +1 Mes
            </button>

            <div className="flex items-center space-x-1.5 ml-auto">
              <input
                type="datetime-local"
                value={extendedDate}
                onChange={(e) => setExtendedDate(e.target.value)}
                className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleCustomExtend}
                disabled={!extendedDate}
                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold"
              >
                Guardar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. SECCIÓN PROGRAMADA EN EL FUTURO
  if (expInfo.isScheduled) {
    return (
      <div className="w-full mb-6 rounded-2xl border border-blue-300 dark:border-blue-800/80 bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent p-4 sm:p-5 backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  Publicación Programada
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Disponible a partir del {formatExpirationDate(section.expiration.startsAt!)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Esta sección se activará automáticamente para toda la congregación al llegar la fecha programada.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. ACTIVA CON CRONÓMETRO REGRESIVO EN VIVO
  if (expInfo.isActive && section.expiration.showCountdown) {
    const isUrgent = expInfo.days === 0 && expInfo.hours < 6;

    return (
      <div
        className={`w-full mb-6 rounded-2xl border p-4 sm:p-5 backdrop-blur-md transition-all shadow-sm ${
          isUrgent
            ? 'border-rose-400 dark:border-rose-800 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent'
            : 'border-purple-200 dark:border-purple-900/60 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                isUrgent ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-600 text-white'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isUrgent
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                  }`}
                >
                  {isUrgent ? '¡Últimas Horas!' : 'Vigencia Activa'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Cierra el {formatExpirationDate(section.expiration.expiresAt)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Participa antes de la fecha límite programada para esta sección.
              </p>
            </div>
          </div>

          {/* Bloques de Cuenta Regresiva */}
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs min-w-[50px]">
              <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                {String(expInfo.days).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Días
              </span>
            </div>
            <span className="font-black text-slate-400 text-base leading-none">:</span>
            <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs min-w-[50px]">
              <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                {String(expInfo.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Horas
              </span>
            </div>
            <span className="font-black text-slate-400 text-base leading-none">:</span>
            <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs min-w-[50px]">
              <span className="text-base font-black text-slate-900 dark:text-white leading-none">
                {String(expInfo.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Min
              </span>
            </div>
            <span className="font-black text-slate-400 text-base leading-none">:</span>
            <div className="flex flex-col items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl shadow-xs min-w-[50px]">
              <span
                className={`text-base font-black leading-none ${
                  isUrgent ? 'text-rose-600 dark:text-rose-400' : 'text-purple-600 dark:text-purple-400'
                }`}
              >
                {String(expInfo.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                Seg
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
