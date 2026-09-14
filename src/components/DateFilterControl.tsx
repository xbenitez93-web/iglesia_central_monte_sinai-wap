import React from 'react';
import { Calendar, Filter, X } from 'lucide-react';

export type DateFilterPreset = 'all' | 'today' | 'this_week' | 'this_month' | 'upcoming' | 'past';

interface DateFilterControlProps {
  preset: DateFilterPreset;
  onPresetChange: (preset: DateFilterPreset) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export function filterItemsByDate<T extends Record<string, any>>(
  items: T[],
  getDateFn: (item: T) => string | undefined,
  preset: DateFilterPreset,
  startDate: string,
  endDate: string
): T[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Start of week (Monday)
  const currentDay = now.getDay();
  const diffToMonday = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diffToMonday));
  const mondayStr = monday.toISOString().split('T')[0];
  
  // End of week (Sunday)
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = sunday.toISOString().split('T')[0];

  // Month
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  return items.filter((item) => {
    const rawDate = getDateFn(item);
    if (!rawDate) return true;
    
    // Normalize date string (e.g. "2026-08-25" or "2026-08-25T10:00:00")
    const dateStr = rawDate.split('T')[0];

    // If custom range active
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;

    if (preset === 'today') {
      return dateStr === todayStr;
    }
    if (preset === 'this_week') {
      return dateStr >= mondayStr && dateStr <= sundayStr;
    }
    if (preset === 'this_month') {
      return dateStr.startsWith(monthPrefix);
    }
    if (preset === 'upcoming') {
      return dateStr >= todayStr;
    }
    if (preset === 'past') {
      return dateStr < todayStr;
    }

    return true;
  });
}

export const DateFilterControl: React.FC<DateFilterControlProps> = ({
  preset,
  onPresetChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  label = 'Filtrar por Fecha:',
}) => {
  const hasActiveFilter = preset !== 'all' || startDate !== '' || endDate !== '';

  const handleClear = () => {
    onPresetChange('all');
    onStartDateChange('');
    onEndDateChange('');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>{label}</span>
        </div>
        {hasActiveFilter && (
          <button
            onClick={handleClear}
            className="inline-flex items-center space-x-1 text-xs text-rose-400 hover:text-rose-300 transition-colors font-medium"
          >
            <X className="w-3.5 h-3.5" />
            <span>Limpiar filtros de fecha</span>
          </button>
        )}
      </div>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-1.5">
        {[
          { id: 'all', label: 'Todas las fechas' },
          { id: 'today', label: 'Hoy' },
          { id: 'this_week', label: 'Esta Semana' },
          { id: 'this_month', label: 'Este Mes' },
          { id: 'upcoming', label: 'Próximos / Futuros' },
          { id: 'past', label: 'Histórico / Pasados' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onPresetChange(btn.id as DateFilterPreset)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              preset === btn.id
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 shrink-0">Desde:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 w-full focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div className="flex items-center space-x-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="text-xs text-slate-400 shrink-0">Hasta:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-transparent text-xs text-slate-200 w-full focus:outline-none [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
};
