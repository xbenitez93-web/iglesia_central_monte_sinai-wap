import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit2,
  X,
  Search,
  Tag,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SubTabCalendarEvent, CustomSectionSubTab } from '../../../types';

interface SubTabCalendarViewProps {
  subTab: CustomSectionSubTab;
  onUpdateSubTab: (updatedSubTab: CustomSectionSubTab) => void;
  onShowToast: (message: string, type?: 'success' | 'danger' | 'info') => void;
  canEdit?: boolean;
}

export const CALENDAR_COLOR_TAGS = [
  { color: '#059669', label: 'Cultos & Servicios', bgClass: 'bg-emerald-500' },
  { color: '#0284c7', label: 'Alabanza & Música', bgClass: 'bg-sky-500' },
  { color: '#7c3aed', label: 'Jóvenes & Universitarios', bgClass: 'bg-purple-500' },
  { color: '#dc2626', label: 'Conferencias & Especiales', bgClass: 'bg-red-500' },
  { color: '#ea580c', label: 'Evangelismo & Misiones', bgClass: 'bg-orange-500' },
  { color: '#d97706', label: 'Ensayos & Prácticas', bgClass: 'bg-amber-500' },
  { color: '#db2777', label: 'Damas & Niños', bgClass: 'bg-pink-500' },
  { color: '#4f46e5', label: 'Líderes & Directiva', bgClass: 'bg-indigo-500' },
  { color: '#0d9488', label: 'Ayuno, Vigilias & Oración', bgClass: 'bg-teal-500' },
  { color: '#475569', label: 'Administrativo', bgClass: 'bg-slate-500' },
];

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export const SubTabCalendarView: React.FC<SubTabCalendarViewProps> = ({
  subTab,
  onUpdateSubTab,
  onShowToast,
  canEdit = true,
}) => {
  const events = subTab.calendarData?.events || [];

  // View mode: 'grid' (real monthly calendar) or 'list' (agenda)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Month navigation state (defaults to current date)
  const today = new Date();
  const [currentDate, setCurrentDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));

  // Filters
  const [search, setSearch] = useState('');
  const [selectedColorFilter, setSelectedColorFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<SubTabCalendarEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    location: 'Santuario Principal',
    description: '',
    speakerOrLeader: '',
    category: 'Cultos & Servicios',
    color: '#059669',
  });

  const categories = Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  // Month Grid calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

  // Generate calendar cells (42 cells: 6 rows of 7 days)
  const calendarCells: {
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
  }[] = [];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 1. Previous month trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const prevDayNum = totalDaysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, prevDayNum);
    const dateStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-${String(prevDayNum).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: prevDayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // 2. Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
    });
  }

  // 3. Next month leading days (to fill 35 or 42 grid cells)
  const remainingCells = 42 - calendarCells.length;
  for (let n = 1; n <= remainingCells; n++) {
    const nextMonthDate = new Date(year, month + 1, n);
    const dateStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: n,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
    });
  }

  // Double Click on calendar day cell handler
  const handleDayDoubleClick = (dateStr: string) => {
    if (!canEdit) return;
    setForm({
      title: '',
      date: dateStr,
      time: '19:00',
      location: 'Santuario Principal',
      description: '',
      speakerOrLeader: '',
      category: 'Cultos & Servicios',
      color: '#059669',
    });
    setEditingId(null);
    setIsModalOpen(true);
    onShowToast(`Creando evento para el ${dateStr}`, 'info');
  };

  const handleOpenAdd = () => {
    setForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      location: 'Santuario Principal',
      description: '',
      speakerOrLeader: '',
      category: 'Cultos & Servicios',
      color: '#059669',
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (event: SubTabCalendarEvent) => {
    setForm({ ...event });
    setEditingId(event.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = events.filter((e) => e.id !== id);
    onUpdateSubTab({
      ...subTab,
      calendarData: { events: updated },
    });
    onShowToast('Evento eliminado del calendario', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.date) {
      onShowToast('El título y la fecha son obligatorios', 'danger');
      return;
    }

    const newEvent: SubTabCalendarEvent = {
      id: editingId || `cal_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: form.title.trim(),
      date: form.date,
      time: form.time || '',
      location: form.location || '',
      description: form.description || '',
      speakerOrLeader: form.speakerOrLeader || '',
      category: form.category || 'General',
      color: form.color || '#059669',
    };

    let updatedList: SubTabCalendarEvent[];
    if (editingId) {
      updatedList = events.map((ev) => (ev.id === editingId ? newEvent : ev));
      onShowToast('Evento actualizado con éxito', 'success');
    } else {
      updatedList = [...events, newEvent];
      onShowToast('Evento programado con éxito', 'success');
    }

    onUpdateSubTab({
      ...subTab,
      calendarData: { events: updatedList },
    });
    setIsModalOpen(false);
  };

  // Filtered events
  const filteredEvents = events.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
      (e.speakerOrLeader && e.speakerOrLeader.toLowerCase().includes(search.toLowerCase())) ||
      (e.location && e.location.toLowerCase().includes(search.toLowerCase()));

    const matchColor = selectedColorFilter === 'all' || e.color === selectedColorFilter;
    const matchCat = selectedCategoryFilter === 'all' || e.category === selectedCategoryFilter;

    return matchSearch && matchColor && matchCat;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. HEADER & CONTROLS */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg">
                {subTab.name || 'Calendario de Actividades'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {events.length} actividades programadas en este calendario
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Calendario Mensual</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista / Agenda</span>
              </button>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Evento</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Tag Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Month Navigation for Grid View */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm min-w-[170px] text-center">
              {MONTH_NAMES[month]} {year}
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleGoToToday}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-700 dark:text-slate-300 hover:text-emerald-600 font-bold text-xs border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Hoy
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, expositor, lugar..."
              className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white w-full md:w-64"
            />
          </div>
        </div>

        {/* Color Tag Badges / Filters */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-bold">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Filtrar por etiqueta de color:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedColorFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedColorFilter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos los Colores
            </button>

            {CALENDAR_COLOR_TAGS.map((tag) => {
              const count = events.filter((e) => e.color === tag.color).length;
              const isSelected = selectedColorFilter === tag.color;

              return (
                <button
                  key={`${tag.color}_${tag.label}`}
                  type="button"
                  onClick={() => setSelectedColorFilter(isSelected ? 'all' : tag.color)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                    isSelected
                      ? 'ring-2 ring-emerald-500 border-transparent text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                  }`}
                  style={isSelected ? { backgroundColor: tag.color } : {}}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span>{tag.label}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-black/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Helpful Tip */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-xs font-medium flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>💡 Tip interactivo:</strong> Haz <strong>doble clic</strong> en cualquier día de la cuadrícula del calendario para abrir la ventana y agregar una actividad en esa fecha.
          </span>
        </div>
      </div>

      {/* 2. REAL MONTHLY CALENDAR GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-center text-xs font-black text-slate-700 dark:text-slate-300 py-3">
            {DAY_NAMES.map((day, idx) => (
              <div key={`day_header_${day}_${idx}`} className={idx === 0 || idx === 6 ? 'text-emerald-600 dark:text-emerald-400' : ''}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {calendarCells.map((cell, idx) => {
              // Get events for this specific day
              const dayEvents = filteredEvents.filter((e) => e.date === cell.dateStr);

              return (
                <div
                  key={`${cell.dateStr}_${idx}`}
                  onDoubleClick={() => handleDayDoubleClick(cell.dateStr)}
                  className={`min-h-[105px] sm:min-h-[125px] p-1.5 sm:p-2 transition-all flex flex-col justify-between group relative select-none cursor-pointer ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20'
                      : 'bg-slate-50/60 dark:bg-slate-950/40 opacity-40 hover:opacity-70'
                  }`}
                  title="Doble clic para agregar evento en este día"
                >
                  {/* Top Bar of the day cell */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform group-hover:scale-110 ${
                        cell.isToday
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-300'
                          : cell.isCurrentMonth
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick Add icon on hover */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDayDoubleClick(cell.dateStr);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-200 transition-all text-[10px] font-bold"
                        title="Agregar evento aquí"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Events list for this day */}
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[75px] sm:max-h-[90px] scrollbar-thin">
                    {dayEvents.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(ev);
                        }}
                        className="px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold text-white flex items-center space-x-1 truncate shadow-xs hover:brightness-110 cursor-pointer transition-transform hover:scale-[1.02]"
                        style={{ backgroundColor: ev.color || '#059669' }}
                        title={`${ev.title} (${ev.time || 'Todo el día'}) - ${ev.location || ''}`}
                      >
                        {ev.time && (
                          <span className="text-[9px] opacity-90 font-mono font-normal shrink-0">
                            {ev.time}
                          </span>
                        )}
                        <span className="truncate">{ev.title}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Day Status Indicator */}
                  {dayEvents.length > 0 && (
                    <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-right pt-0.5">
                      {dayEvents.length} {dayEvents.length === 1 ? 'actividad' : 'actividades'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. LIST / AGENDA VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4 animate-fadeIn">
          {filteredEvents.length === 0 ? (
            <div className="p-10 text-center rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
              <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto" />
              <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-base">
                No hay actividades registradas con los filtros actuales
              </h4>
              <p className="text-xs text-slate-500">
                Agrega un nuevo evento con el botón superior o haciendo doble clic en el calendario mensual.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEvents
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: ev.color || '#059669' }}
                          />
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {ev.category || 'General'}
                          </span>
                        </div>

                        {canEdit && (
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(ev)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Editar Evento"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev.id)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              title="Eliminar Evento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <h4 className="font-black text-base text-slate-900 dark:text-white leading-snug">
                        {ev.title}
                      </h4>

                      {ev.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {ev.date}
                        </span>
                        {ev.time && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="flex items-center space-x-1 font-semibold text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ev.time}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {ev.location && (
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}

                      {ev.speakerOrLeader && (
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Encargado / Expositor: <strong>{ev.speakerOrLeader}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* 4. ADD / EDIT EVENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    {editingId ? 'Editar Actividad' : 'Nueva Actividad / Evento'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {editingId ? 'Modifica los datos del evento programado' : 'Registra una nueva fecha en el calendario'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre de la Actividad / Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Ej: Culto de Alabanza, Retiro Juvenil, Escuela Bíblica..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                  />
                </div>

                {/* Color Tag Palette Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Color / Etiqueta de la Fecha
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CALENDAR_COLOR_TAGS.map((tag) => (
                      <button
                        key={`${tag.color}_${tag.label}`}
                        type="button"
                        onClick={() => setForm({ ...form, color: tag.color, category: tag.label })}
                        className={`p-1.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                          form.color === tag.color
                            ? 'ring-2 ring-emerald-500 border-emerald-500 scale-105 bg-slate-50 dark:bg-slate-800'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full shadow-xs shrink-0 flex items-center justify-center"
                          style={{ backgroundColor: tag.color }}
                        >
                          {form.color === tag.color && (
                            <CheckCircle2 className="w-3 h-3 text-white drop-shadow" />
                          )}
                        </span>
                        <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 truncate w-full text-center">
                          {tag.label.split(' ')[0]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => setForm({ ...form, time: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lugar / Salón
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="Ej: Santuario Principal"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Ej: Jóvenes, Damas, etc."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Líder / Expositor / Responsable
                  </label>
                  <input
                    type="text"
                    value={form.speakerOrLeader}
                    onChange={(e) => setForm({ ...form, speakerOrLeader: e.target.value })}
                    placeholder="Ej: Pastor o Líder asignado"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Descripción o Detalles
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Requisitos, vestimenta, instrucciones para los asistentes..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2 shrink-0 bg-slate-50/70 dark:bg-slate-900/90 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  {editingId ? 'Guardar Cambios' : 'Programar Actividad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
