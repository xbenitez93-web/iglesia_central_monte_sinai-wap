import React, { useState } from 'react';
// =================================================================================================
// ETIQUETA: IMPORTACIONES DE TIPOS Y MODELOS
// ¿Para qué es?: Importa las interfaces de TypeScript que definen la estructura de datos eclesiásticos.
// ¿Por qué se usa?: Garantiza la tipificación estricta (ChurchEvent, AgendaItem, VolunteerAssignment, etc.)
// =================================================================================================
import { AgendaItem, ChurchConfig, ChurchEvent, EventType, Member, VolunteerAssignment } from '../types';

// =================================================================================================
// ETIQUETA: ICONOGRAFÍA LUCIDE-REACT
// ¿Para qué es?: Proporciona iconos vectoriales visuales para botones, títulos y acciones.
// ¿Por qué se usa?: Mejora la experiencia visual y la identificación rápida de opciones.
// =================================================================================================
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  User,
  Users,
  Sparkles,
  CheckCircle,
  X,
  Edit,
  Trash2,
  BookOpen,
  ListOrdered,
  Mic,
  AlertTriangle,
  Check,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { PageHeroBanner } from './PageHeroBanner';
import { getActivePageThemeColor } from '../lib/pageTheme';

// =================================================================================================
// ETIQUETA: PROPIEDADES DEL COMPONENTE (EventsViewProps)
// ¿Para qué es?: Define qué datos y funciones callback recibe esta vista desde el componente padre (App.tsx).
// ¿Por qué se usa?: Permite la comunicación bidireccional (listar eventos, agregar, editar, eliminar y sincronizar).
// =================================================================================================
interface EventsViewProps {
  config?: ChurchConfig;
  events: ChurchEvent[];
  members: Member[];
  onAddEvent: (event: Omit<ChurchEvent, 'id'>) => void;
  onUpdateEvent: (event: ChurchEvent) => void;
  onDeleteEvent: (id: string) => void;
  onOpenAIAssistant: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
  onUpdateConfig?: (updatedConfig: ChurchConfig) => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  config,
  events,
  members,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenAIAssistant,
  isAddModalOpen,
  setIsAddModalOpen,
  onUpdateConfig,
}) => {
  // ===============================================================================================
  // ETIQUETA: ESTADOS LOCALES DE FILTRADO Y SELECCIÓN
  // ¿Para qué es?: Guarda el tipo de evento seleccionado para filtrar y el evento activo en el panel derecho.
  // ¿Por qué se usa?: Para permitir al usuario explorar y seleccionar qué culto/evento desea visualizar en detalle.
  // ===============================================================================================
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id || null);
  const pageColor = getActivePageThemeColor('events', config);

  // Mantener el evento seleccionado sincronizado con la lista más reciente de eventos
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

  // ===============================================================================================
  // ETIQUETA: ESTADO PARA EDICIÓN DE EVENTOS
  // ¿Para qué es?: Guarda el evento que se está modificando actualmente o null si es una creación nueva.
  // ¿Por qué se usa?: Determina si el modal de formulario funciona en modo "Crear" o en modo "Editar".
  // ===============================================================================================
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);

  // ===============================================================================================
  // ETIQUETA: ESTADO DEL FORMULARIO PRINCIPAL DE EVENTO
  // ¿Para qué es?: Almacena temporalmente los valores escritos en los campos del modal de evento.
  // ¿Por qué se usa?: Permite el enlace bidireccional (two-way binding) con los inputs del formulario.
  // ===============================================================================================
  const [formData, setFormData] = useState({
    title: '',
    type: 'Culto Dominical' as EventType,
    date: '',
    time: '10:00',
    location: 'Santuario Principal',
    description: '',
    speaker: '',
    verseText: '',
    status: 'Programado' as 'Programado' | 'En Curso' | 'Finalizado' | 'Cancelado',
    attendanceCount: 0,
    teamAssignments: [
      { role: 'Predicador', memberName: '' },
      { role: 'Director de Alabanza', memberName: '' },
      { role: 'Sonido y Multimedia', memberName: '' },
      { role: 'Ujier y Recepción', memberName: '' },
    ] as VolunteerAssignment[],
  });

  // ===============================================================================================
  // ETIQUETA: MODAL INTERACTIVO DE CONFIRMACIÓN DE ELIMINACIÓN
  // ¿Para qué es?: Maneja el diálogo de confirmación visual para eliminar eventos, guiones o roles.
  // ¿Por qué se usa?: Reemplaza los window.confirm() nativos del navegador que pueden fallar en iframes.
  // ===============================================================================================
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'event' | 'agendaItem' | 'teamAssignment';
    id: string;
    title: string;
    subtitle?: string;
    targetEventId?: string;
  } | null>(null);

  // ===============================================================================================
  // ETIQUETA: GESTIÓN DE BLOQUES DE GUION / PROGRAMA (AGENDA)
  // ¿Para qué es?: Permite agregar o editar bloques de tiempo específicos en el guion del culto.
  // ¿Por qué se usa?: Para que el equipo pastoral ordene la liturgia (oración, alabanza, mensaje, avisos).
  // ===============================================================================================
  const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
  const [editingAgendaItem, setEditingAgendaItem] = useState<AgendaItem | null>(null);
  const [agendaFormData, setAgendaFormData] = useState({
    time: '10:00',
    title: '',
    leader: '',
    notes: '',
  });

  // ===============================================================================================
  // ETIQUETA: LISTA DE TIPOS DE EVENTOS ECLESIALES
  // ¿Para qué es?: Array con todas las categorías de cultos y reuniones de la congregación.
  // ¿Por qué se usa?: Rellena los selectores de categorías y los botones de filtro rápido.
  // ===============================================================================================
  const eventTypes: EventType[] = [
    'Culto Dominical',
    'Estudio Bíblico',
    'Reunión de Jóvenes',
    'Culto de Oración',
    'Retiro / Taller',
    'Evangelismo',
    'Reunión de Líderes',
    'Escuela Dominical',
  ];

  // Filtra los eventos según la categoría seleccionada en las pestañas superiores
  const filteredEvents = events.filter(
    (e) => selectedType === 'all' || e.type === selectedType
  );

  // ===============================================================================================
  // ETIQUETA: FUNCIÓN PARA ABRIR FORMULARIO DE NUEVO EVENTO
  // ¿Para qué es?: Reinicia los campos a valores por defecto limpios y abre el modal.
  // ¿Por qué se usa?: Prepara el estado para crear un nuevo evento desde cero sin datos residuales.
  // ===============================================================================================
  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      type: 'Culto Dominical',
      date: new Date().toISOString().split('T')[0],
      time: '10:00',
      location: 'Santuario Principal',
      description: '',
      speaker: '',
      verseText: '',
      status: 'Programado',
      attendanceCount: 0,
      teamAssignments: [
        { role: 'Predicador', memberName: '' },
        { role: 'Director de Alabanza', memberName: '' },
        { role: 'Sonido y Multimedia', memberName: '' },
        { role: 'Ujier y Recepción', memberName: '' },
      ],
    });
    setIsAddModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: FUNCIÓN PARA ABRIR EDICIÓN DE UN EVENTO EXISTENTE
  // ¿Para qué es?: Carga los datos del evento recibido en los estados del formulario y abre el modal.
  // ¿Por qué se usa?: Permite al usuario modificar fechas, oradores, lugares o roles de un culto ya creado.
  // ===============================================================================================
  const handleOpenEdit = (ev: ChurchEvent) => {
    setEditingEvent(ev);
    setFormData({
      title: ev.title,
      type: ev.type,
      date: ev.date,
      time: ev.time,
      location: ev.location,
      description: ev.description,
      speaker: ev.speaker,
      verseText: ev.verseText || '',
      status: ev.status,
      attendanceCount: ev.attendanceCount || 0,
      teamAssignments: ev.teamAssignments || [],
    });
    setIsAddModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: GUARDAR / ENVIAR FORMULARIO DE EVENTO
  // ¿Para qué es?: Valida y envía el nuevo evento o la actualización al estado global de App.tsx.
  // ¿Por qué se usa?: Sincroniza la información con el almacenamiento persistente y la base de datos.
  // ===============================================================================================
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.date) return;

    if (editingEvent) {
      const updated: ChurchEvent = {
        ...editingEvent,
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        speaker: formData.speaker,
        verseText: formData.verseText,
        status: formData.status,
        attendanceCount: Number(formData.attendanceCount),
        teamAssignments: formData.teamAssignments,
      };
      onUpdateEvent(updated);
      setSelectedEventId(updated.id);
    } else {
      const newEv: Omit<ChurchEvent, 'id'> = {
        title: formData.title,
        type: formData.type,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        description: formData.description,
        speaker: formData.speaker,
        verseText: formData.verseText,
        status: formData.status,
        attendanceCount: Number(formData.attendanceCount),
        teamAssignments: formData.teamAssignments,
        agendaItems: [
          { id: `ag_${Date.now()}_1`, time: formData.time, title: 'Bienvenida y Oración Inicial', leader: formData.speaker || 'Pastor' },
          { id: `ag_${Date.now()}_2`, time: '10:15', title: 'Tiempo de Alabanza y Adoración', leader: 'Ministerio de Alabanza' },
          { id: `ag_${Date.now()}_3`, time: '10:45', title: 'Predicación de la Palabra', leader: formData.speaker || 'Pastor' },
          { id: `ag_${Date.now()}_4`, time: '11:30', title: 'Ministración y Despedida', leader: 'Equipo Pastoral' },
        ],
      };
      onAddEvent(newEv);
    }

    setIsAddModalOpen(false);
  };

  // ===============================================================================================
  // ETIQUETA: ACTUALIZAR ASISTENCIA FINAL DEL CULTO
  // ¿Para qué es?: Modifica rápidamente el número de feligreses que asistieron al evento.
  // ¿Por qué se usa?: Mantiene estadísticas actualizadas para reportes eclesiásticos.
  // ===============================================================================================
  const handleUpdateAttendance = (eventId: string, count: number) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const updated = { ...ev, attendanceCount: Math.max(0, count) };
    onUpdateEvent(updated);
  };

  // ===============================================================================================
  // ETIQUETA: EJECUTAR ACCIÓN DE ELIMINACIÓN CONFIRMADA (100% GARANTIZADA)
  // ¿Para qué es?: Procesa la eliminación una vez que el usuario presiona "Sí, Eliminar" en el modal.
  // ¿Por qué se usa?: Despacha la eliminación hacia App.tsx (con papelera de reciclaje) sin fallos.
  // ===============================================================================================
  const handleExecuteDelete = () => {
    if (!deleteConfirmTarget) return;

    const { type, id, targetEventId } = deleteConfirmTarget;

    if (type === 'event') {
      // 1. Ejecutar eliminación del evento principal
      onDeleteEvent(id);
      // 2. Si el evento eliminado era el que estaba seleccionado, seleccionar otro disponible
      const remaining = events.filter((e) => e.id !== id);
      setSelectedEventId(remaining.length > 0 ? remaining[0].id : null);
      // 3. Cerrar modal de edición si estaba abierto
      if (editingEvent?.id === id) {
        setIsAddModalOpen(false);
        setEditingEvent(null);
      }
    } else if (type === 'agendaItem' && selectedEvent) {
      // 1. Eliminar bloque específico del guion litúrgico
      const updatedAgenda = (selectedEvent.agendaItems || []).filter((item) => item.id !== id);
      const updatedEvent: ChurchEvent = {
        ...selectedEvent,
        agendaItems: updatedAgenda,
      };
      onUpdateEvent(updatedEvent);
    } else if (type === 'teamAssignment' && selectedEvent) {
      // 1. Eliminar asignación de rol del equipo de servidores
      const updatedTeams = (selectedEvent.teamAssignments || []).filter((_, idx) => String(idx) !== id);
      const updatedEvent: ChurchEvent = {
        ...selectedEvent,
        teamAssignments: updatedTeams,
      };
      onUpdateEvent(updatedEvent);
    }

    // Cerrar el modal de confirmación
    setDeleteConfirmTarget(null);
  };

  // ===============================================================================================
  // ETIQUETA: ABRIR CREADOR / EDITOR DE BLOQUES DEL GUION
  // ¿Para qué es?: Abre el modal para redactar un nuevo bloque de tiempo o editar uno existente.
  // ¿Por qué se usa?: Facilita la programación estructurada minuto a minuto del servicio.
  // ===============================================================================================
  const handleOpenAddAgendaItem = () => {
    setEditingAgendaItem(null);
    setAgendaFormData({
      time: selectedEvent?.time || '10:00',
      title: '',
      leader: '',
      notes: '',
    });
    setIsAgendaModalOpen(true);
  };

  const handleOpenEditAgendaItem = (item: AgendaItem) => {
    setEditingAgendaItem(item);
    setAgendaFormData({
      time: item.time,
      title: item.title,
      leader: item.leader,
      notes: item.notes || '',
    });
    setIsAgendaModalOpen(true);
  };

  // ===============================================================================================
  // ETIQUETA: GUARDAR BLOQUE DEL GUION (AGENDA ITEM)
  // ¿Para qué es?: Añade o actualiza el bloque de liturgia en el evento seleccionado.
  // ¿Por qué se usa?: Guarda en tiempo real los cambios del programa del culto.
  // ===============================================================================================
  const handleSaveAgendaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !agendaFormData.title.trim()) return;

    let updatedAgenda: AgendaItem[] = [];

    if (editingAgendaItem) {
      // Actualizar bloque existente
      updatedAgenda = (selectedEvent.agendaItems || []).map((item) =>
        item.id === editingAgendaItem.id
          ? {
              ...item,
              time: agendaFormData.time,
              title: agendaFormData.title,
              leader: agendaFormData.leader || 'Sin asignar',
              notes: agendaFormData.notes,
            }
          : item
      );
    } else {
      // Agregar nuevo bloque
      const newItem: AgendaItem = {
        id: `ag_${Date.now()}`,
        time: agendaFormData.time,
        title: agendaFormData.title,
        leader: agendaFormData.leader || 'Sin asignar',
        notes: agendaFormData.notes,
      };
      updatedAgenda = [...(selectedEvent.agendaItems || []), newItem];
    }

    const updatedEvent: ChurchEvent = {
      ...selectedEvent,
      agendaItems: updatedAgenda,
    };

    onUpdateEvent(updatedEvent);
    setIsAgendaModalOpen(false);
    setEditingAgendaItem(null);
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================================
          ETIQUETA: HERO BANNER DINÁMICO DE AGENDA Y CULTOS
          ¿Para qué es?: Encabezado superior con título, icono y botones de acción rápida.
          ¿Por qué se usa?: Da identidad visual a la sección y permite invocar el asistente IA o crear culto.
         ========================================================================================= */}
      <PageHeroBanner
        tabId="events"
        config={config}
        icon={CalendarIcon}
        defaultTitle="Agenda & Programación de Cultos"
        defaultSubtitle="Planificación de servicios, roles de servidores, agenda de reuniones y guion detallado del culto."
        defaultBadge="Calendario & Actividades"
        onUpdateConfig={onUpdateConfig}
        actionButtons={
          <>
            <button
              type="button"
              onClick={onOpenAIAssistant}
              className="px-3.5 py-2.5 rounded-2xl bg-amber-500/90 hover:bg-amber-600 text-white font-medium text-xs sm:text-sm shadow-md backdrop-blur-md transition-colors cursor-pointer flex items-center space-x-2 border border-white/20"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Generar Guion IA</span>
            </button>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-lg hover:bg-slate-100 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" style={{ color: pageColor }} />
              <span>Nuevo Evento</span>
            </button>
          </>
        }
      />

      {/* =========================================================================================
          ETIQUETA: PESTAÑAS DE FILTRADO POR TIPO DE REUNIÓN
          ¿Para qué es?: Filtros de botón redondeado para aislar Cultos, Estudios, Jóvenes, etc.
          ¿Por qué se usa?: Facilita la navegación rápida sin tener que buscar manualmente en listas largas.
         ========================================================================================= */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
            selectedType === 'all'
              ? 'text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
          }`}
          style={{
            backgroundColor: selectedType === 'all' ? pageColor : undefined,
          }}
        >
          Todos los Eventos ({events.length})
        </button>
        {eventTypes.map((type) => {
          const count = events.filter((e) => e.type === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedType === type
                  ? 'text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
              }`}
              style={{
                backgroundColor: selectedType === type ? pageColor : undefined,
              }}
            >
              {type} {count > 0 ? `(${count})` : ''}
            </button>
          );
        })}
      </div>

      {/* =========================================================================================
          ETIQUETA: CONTENEDOR PRINCIPAL EN DOS COLUMNAS
          - Columna Izquierda: Tarjetas de Eventos Agendados con sus respectivos botones de eliminación.
          - Columna Derecha: Inspector detallado del Culto seleccionado (Roles, Guion y Asistencia).
         ========================================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================================================================================
            COLUMNA IZQUIERDA: LISTA DE EVENTOS AGENDADOS
           ======================================================================================= */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Eventos Agendados ({filteredEvents.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Click para ver programa</span>
          </div>

          <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((ev) => {
                const isSelected = selectedEvent?.id === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer backdrop-blur-xl group ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-700'
                    }`}
                  >
                    {/* Fila Superior: Tipo, Fecha y Botón Eliminar de la Tarjeta */}
                    <div className="flex items-start justify-between">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-200 backdrop-blur-xs">
                        {ev.type}
                      </span>
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
                          {ev.date}
                        </span>

                        {/* Botón Editar Evento Rápido */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(ev);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar este evento"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* =======================================================================
                            ETIQUETA: BOTÓN DE ELIMINAR EVENTO (EN TARJETA)
                            ¿Para qué es?: Invoca el modal de confirmación para borrar este evento.
                            ¿Por qué se usa?: Garantiza eliminación segura y funcional al 100%.
                           ======================================================================= */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTarget({
                              type: 'event',
                              id: ev.id,
                              title: `¿Eliminar el evento "${ev.title}"?`,
                              subtitle: `Fecha: ${ev.date} • ${ev.type} • Lugar: ${ev.location}. Esta acción enviará el evento a la Papelera.`,
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                          title="Eliminar este evento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-2 leading-snug">
                      {ev.title}
                    </h4>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-500" />
                        {ev.time} hs
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="truncate">{ev.location}</span>
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                        👤 {ev.speaker || 'Sin expositor asignado'}
                      </span>
                      {ev.attendanceCount !== undefined && ev.attendanceCount > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                          <Users className="w-3.5 h-3.5" />
                          {ev.attendanceCount} Asistentes
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {ev.agendaItems?.length || 0} bloques en guion
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <CalendarIcon className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  No hay eventos registrados en esta categoría.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-xs hover:bg-indigo-700 cursor-pointer"
                >
                  + Agendar Primer Evento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* =======================================================================================
            COLUMNA DERECHA: DETALLE DEL CULTO / GUION LITÚRGICO Y ASIGNACIONES
           ======================================================================================= */}
        <div className="lg:col-span-7">
          {selectedEvent ? (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-lg space-y-6">
              
              {/* Encabezado del Evento Seleccionado con Botones de Editar y Eliminar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
                      {selectedEvent.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Estado: <strong>{selectedEvent.status}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center flex-wrap gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" /> {selectedEvent.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" /> {selectedEvent.time} hs
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-500" /> {selectedEvent.location}
                    </span>
                  </p>
                </div>

                {/* Botones de Acción en el Panel Superior del Detalle */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedEvent)}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Editar datos del evento"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Editar</span>
                  </button>

                  {/* ===========================================================================
                      ETIQUETA: BOTÓN ELIMINAR EVENTO (EN DETALLE DERECHO)
                      ¿Para qué es?: Permite borrar el evento visualizado activamente con confirmación.
                      ¿Por qué se usa?: Funcionalidad accesible desde la vista detallada.
                     =========================================================================== */}
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmTarget({
                        type: 'event',
                        id: selectedEvent.id,
                        title: `¿Eliminar el evento "${selectedEvent.title}"?`,
                        subtitle: `Esta acción enviará este evento (${selectedEvent.date}) a la Papelera de Reciclaje.`,
                      });
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-semibold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    title="Eliminar este evento"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Versículo Clave o Lema del Culto */}
              {selectedEvent.verseText && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-indigo-900 dark:text-indigo-200 text-xs italic font-serif leading-relaxed">
                  <BookOpen className="w-4 h-4 inline-block mr-1.5 text-indigo-600 dark:text-indigo-400" />
                  <strong>Versículo Lema:</strong> "{selectedEvent.verseText}"
                </div>
              )}

              {/* Descripción / Notas del Culto */}
              {selectedEvent.description && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                    Descripción / Enfoque del Culto:
                  </span>
                  <p className="leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {/* ===============================================================================
                  ETIQUETA: ROLES DE SERVICIO Y ASIGNACIONES DE VOLUNTARIOS
                  ¿Para qué es?: Visualiza quiénes estarán a cargo de predicar, música, sonido, etc.
                  ¿Por qué se usa?: Organiza a los servidores para cada reunión eclesial.
                 =============================================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" /> Roles de Servicio & Asignaciones
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedEvent)}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Modificar Roles</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(selectedEvent.teamAssignments || []).map((team, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs group"
                    >
                      <div className="truncate">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">
                          {team.role}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white truncate block">
                          {team.memberName ? `👤 ${team.memberName}` : '⚠️ Sin asignar'}
                        </span>
                      </div>

                      {/* Botón Eliminar Rol de Servicio específico */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteConfirmTarget({
                            type: 'teamAssignment',
                            id: String(idx),
                            title: `¿Eliminar el rol de "${team.role}"?`,
                            subtitle: `Se quitará este puesto de servicio del evento "${selectedEvent.title}".`,
                          });
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors opacity-80 hover:opacity-100 cursor-pointer"
                        title={`Eliminar puesto de ${team.role}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===============================================================================
                  ETIQUETA: GUION DEL CULTO / PROGRAMA MINUTO A MINUTO (AGENDA)
                  ¿Para qué es?: Lista y gestiona los bloques ordenados del culto (alabanza, prédica, etc.)
                  ¿Por qué se usa?: Cada bloque cuenta con botones funcionales para editar y eliminar.
                 =============================================================================== */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-purple-600" /> Guion del Culto / Programa ({selectedEvent.agendaItems?.length || 0})
                  </h4>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onOpenAIAssistant}
                      className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Optimizar con IA</span>
                    </button>

                    {/* Botón para Agregar Bloque al Guion */}
                    <button
                      type="button"
                      onClick={handleOpenAddAgendaItem}
                      className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Agregar Bloque</span>
                    </button>
                  </div>
                </div>

                {/* Lista de Bloques del Guion con Botones de Eliminar y Editar */}
                <div className="space-y-2">
                  {selectedEvent.agendaItems && selectedEvent.agendaItems.length > 0 ? (
                    selectedEvent.agendaItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs gap-3 hover:border-purple-300 transition-colors"
                      >
                        <div className="space-y-0.5 truncate flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-100 dark:border-purple-900">
                              {item.time} hs
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {item.title}
                            </span>
                          </div>
                          {item.notes && (
                            <p className="text-slate-500 text-[11px] mt-0.5 truncate">{item.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="px-2 py-1 rounded-lg bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-semibold">
                            👤 {item.leader}
                          </span>

                          {/* Botón Editar Bloque */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditAgendaItem(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            title="Editar bloque del guion"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* ===================================================================
                              ETIQUETA: BOTÓN ELIMINAR BLOQUE DEL GUION (AGENDA ITEM)
                              ¿Para qué es?: Abre confirmación para remover este bloque específico.
                              ¿Por qué se usa?: 100% operativo sin recargas ni errores.
                             =================================================================== */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteConfirmTarget({
                                type: 'agendaItem',
                                id: item.id,
                                title: `¿Eliminar el bloque "${item.title}"?`,
                                subtitle: `Se quitará este bloque (${item.time} hs - ${item.leader}) del guion de este culto.`,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            title="Eliminar este bloque"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-1.5">
                      <p className="text-xs text-slate-400 italic">Sin bloques de programa agregados aún.</p>
                      <button
                        type="button"
                        onClick={handleOpenAddAgendaItem}
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        + Agregar primer bloque litúrgico
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ===============================================================================
                  ETIQUETA: REGISTRO DE ASISTENCIA FINAL
                  ¿Para qué es?: Contador numérico de los asistentes presentes en el culto.
                  ¿Por qué se usa?: Permite guardar conteos reales de asistencia.
                 =============================================================================== */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Registro de Asistencia Final:
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    value={selectedEvent.attendanceCount || ''}
                    onChange={(e) =>
                      handleUpdateAttendance(selectedEvent.id, Number(e.target.value))
                    }
                    placeholder="0"
                    className="w-24 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30"
                  />
                  <span className="text-xs font-semibold text-slate-500">asistentes</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white/70 dark:bg-slate-900/70 rounded-3xl p-12 border border-slate-200/80 dark:border-slate-800 text-center text-slate-400 text-xs space-y-2">
              <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                Selecciona un evento de la lista izquierda para visualizar su guion y roles de servicio.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================================
          ETIQUETA: MODAL PARA AGENDAR O EDITAR EVENTO COMPLETO
          ¿Para qué es?: Formulario modal completo para registrar o modificar cultos.
          ¿Por qué se usa?: Incluye botón directo de "Eliminar Evento" en caso de estar editando.
         ========================================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingEvent ? 'Editar Evento / Culto' : 'Agendar Nuevo Evento / Culto'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingEvent(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Título del Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej. Culto Dominical de Celebración"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Tipo de Evento
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    {eventTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Lugar / Templo
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej. Santuario Principal"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Predicador / Expositor
                  </label>
                  <input
                    type="text"
                    value={formData.speaker}
                    onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
                    placeholder="Ej. Pr. Carlos Mendoza"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Versículo Clave / Lema
                  </label>
                  <input
                    type="text"
                    value={formData.verseText}
                    onChange={(e) => setFormData({ ...formData, verseText: e.target.value })}
                    placeholder="Ej. Juan 3:16"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Roles de Servicio dentro del Formulario */}
              <div>
                <label className="block font-semibold mb-1.5 text-slate-800 dark:text-slate-200">
                  Asignaciones de Servidores para este Culto:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  {formData.teamAssignments.map((team, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {team.role}:
                      </span>
                      <input
                        type="text"
                        value={team.memberName}
                        onChange={(e) => {
                          const updated = [...formData.teamAssignments];
                          updated[idx].memberName = e.target.value;
                          setFormData({ ...formData, teamAssignments: updated });
                        }}
                        placeholder="Nombre del servidor..."
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Descripción / Enfoque del Culto
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Detalles sobre el orden, propósito, Santa Cena, etc."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* Pie del Modal con Botón de Eliminar (si está editando) y Guardar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  {editingEvent && (
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmTarget({
                          type: 'event',
                          id: editingEvent.id,
                          title: `¿Eliminar el evento "${editingEvent.title}"?`,
                          subtitle: `Fecha: ${editingEvent.date}. El evento se enviará a la Papelera de Reciclaje.`,
                        });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar Evento</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingEvent(null);
                    }}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all flex items-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingEvent ? 'Guardar Cambios' : 'Agendar Evento'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL PARA AGREGAR / EDITAR BLOQUE DEL GUION (AGENDA ITEM)
          ¿Para qué es?: Diálogo para configurar el tiempo, título y encargado de cada segmento litúrgico.
          ¿Por qué se usa?: Brinda control granular sobre cada momento del culto.
         ========================================================================================= */}
      {isAgendaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-purple-600" />
                <span>{editingAgendaItem ? 'Editar Bloque del Guion' : 'Agregar Bloque al Guion'}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAgendaModalOpen(false);
                  setEditingAgendaItem(null);
                }}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgendaItem} className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Hora / Minuto *
                  </label>
                  <input
                    type="time"
                    required
                    value={agendaFormData.time}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-purple-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                    Encargado / Líder
                  </label>
                  <input
                    type="text"
                    value={agendaFormData.leader}
                    onChange={(e) => setAgendaFormData({ ...agendaFormData, leader: e.target.value })}
                    placeholder="Ej. Grupo de Alabanza"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Título del Bloque *
                </label>
                <input
                  type="text"
                  required
                  value={agendaFormData.title}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, title: e.target.value })}
                  placeholder="Ej. Alabanza, Testimonio, Anuncios, Santa Cena..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800 dark:text-slate-200">
                  Notas / Detalles del Bloque
                </label>
                <textarea
                  value={agendaFormData.notes}
                  onChange={(e) => setAgendaFormData({ ...agendaFormData, notes: e.target.value })}
                  rows={2}
                  placeholder="Canciones a entonar, peticiones específicas o tiempo asignado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAgendaModalOpen(false);
                    setEditingAgendaItem(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingAgendaItem ? 'Guardar Cambios' : 'Agregar al Guion'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================================
          ETIQUETA: MODAL SEGURO DE CONFIRMACIÓN DE ELIMINACIÓN (REACT PURO)
          ¿Para qué es?: Modal de seguridad con alerta en color rojo para confirmar cualquier borrado.
          ¿Por qué se usa?: Elimina por completo la dependencia de window.confirm() y garantiza ejecución al 100%.
         ========================================================================================= */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  {deleteConfirmTarget.title}
                </h3>
                {deleteConfirmTarget.subtitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {deleteConfirmTarget.subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 text-[11px] text-rose-800 dark:text-rose-300">
              ℹ️ Si eliminas un evento, se enviará a la <strong>Papelera de Reciclaje</strong> donde podrás recuperarlo en cualquier momento.
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Sí, Eliminar Ahora</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
