import React, { useState } from 'react';
import {
  BookOpen,
  X,
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  PiggyBank,
  Music,
  Heart,
  UserCheck,
  Drama,
  MessageSquare,
  Palette,
  Shield,
  Cloud,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Sparkles,
  SunMoon,
  Lightbulb,
  ArrowRight,
  Smartphone,
} from 'lucide-react';
import { TabType } from './Navigation';

interface QuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnStartup: boolean;
  onToggleShowOnStartup: (enabled: boolean) => void;
  onNavigateToTab?: (tab: TabType) => void;
}

interface GuideSection {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ElementType;
  badge: string;
  color: string;
  targetTab?: TabType;
  description: string;
  highlights: {
    icon: string;
    title: string;
    text: string;
  }[];
  proTip: string;
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'dashboard',
    title: '1. Panel de Control (Dashboard)',
    shortTitle: 'Panel General',
    icon: LayoutDashboard,
    badge: 'Centro de Mando',
    color: 'from-indigo-600 to-blue-600',
    targetTab: 'dashboard',
    description:
      'El centro neurálgico con estadísticas en vivo de miembros, eventos activos, resumen de finanzas y accesos rápidos directos.',
    highlights: [
      {
        icon: '⚡',
        title: 'Accesos Rápidos',
        text: 'Botones para registrar miembros, programar cultos o registrar diezmos en 1 solo clic.',
      },
      {
        icon: '📊',
        title: 'Métricas Dinámicas',
        text: 'Visualiza la salud de la congregación con conteos actualizados en tiempo real.',
      },
      {
        icon: '🤖',
        title: 'Asistente IA Pastoral',
        text: 'Genera bosquejos de sermones, devocionales y consejos pastorales impulsados por IA.',
      },
    ],
    proTip: 'Usa el botón del Asistente Pastoral en la esquina superior para ideas de prédicas y estudios bíblicos.',
  },
  {
    id: 'directory',
    title: '2. Directorio de Miembros y Familias',
    shortTitle: 'Directorio',
    icon: Users,
    badge: 'Gestión Pastoral',
    color: 'from-blue-600 to-cyan-600',
    targetTab: 'directory',
    description:
      'Administra la base de datos de miembros, núcleos familiares, fotografías con cámara integrada y asignación de ministerios.',
    highlights: [
      {
        icon: '📸',
        title: 'Fotos y Cámara',
        text: 'Toma fotos directamente con la cámara de tu móvil/laptop o sube imágenes de perfil.',
      },
      {
        icon: '🏡',
        title: 'Núcleos Familiares',
        text: 'Agrupa familias completas para seguimiento pastoral conjunto y vinculación de hijos y cónyuges.',
      },
      {
        icon: '🏷️',
        title: 'Filtros y Búsqueda',
        text: 'Filtra por estado (Activo, En Prueba, Visita), ministerio o búsqueda por nombre y teléfono.',
      },
    ],
    proTip: 'Al crear un miembro puedes asignarle su familia y se sincronizará automáticamente en ambas vistas.',
  },
  {
    id: 'events',
    title: '3. Agenda y Eventos Congregacionales',
    shortTitle: 'Agenda & Cultos',
    icon: Calendar,
    badge: 'Calendario',
    color: 'from-amber-500 to-orange-600',
    targetTab: 'events',
    description:
      'Planifica cultos dominicales, estudios bíblicos, reuniones de líderes y vigilias con cronogramas por minuto.',
    highlights: [
      {
        icon: '⏱️',
        title: 'Agenda Minuto a Minuto',
        text: 'Define la estructura del culto: Alabanza, Ofrenda, Mensaje y Ministración con encargados.',
      },
      {
        icon: '🤝',
        title: 'Asignación de Servidores',
        text: 'Asigna ujieres, músicos, predicadores y sonidistas para cada culto programado.',
      },
      {
        icon: '🔔',
        title: 'Recordatorios y Notificaciones',
        text: 'Envía alertas a los miembros sobre los próximos eventos y actividades especiales.',
      },
    ],
    proTip: 'Puedes clonar la agenda de un culto anterior para agilizar la preparación del siguiente domingo.',
  },
  {
    id: 'finances',
    title: '4. Finanzas y Minicooperativa',
    shortTitle: 'Finanzas & Ahorro',
    icon: DollarSign,
    badge: 'Mayordomía',
    color: 'from-emerald-600 to-teal-600',
    targetTab: 'finances',
    description:
      'Control transparente de diezmos, ofrendas, donaciones y el módulo solidario de Minicooperativa de ahorro y micropréstamos.',
    highlights: [
      {
        icon: '💳',
        title: 'Diezmos y Ofrendas',
        text: 'Registra entradas por efectivo, transferencia bancaria o tarjeta con recibos descargables.',
      },
      {
        icon: '🐖',
        title: 'Cuentas de Ahorro Solidarias',
        text: 'Permite a los miembros ahorrar para proyectos familiares o actividades eclesiales.',
      },
      {
        icon: '⛺',
        title: 'Eventos Pro-Fondos & Abonos',
        text: 'Gestiona campamentos y retiros con precios de adultos/niños y abonos parciales.',
      },
    ],
    proTip: 'Cada transacción genera un comprobante con número de recibo listo para imprimir o enviar por PDF.',
  },
  {
    id: 'ministries',
    title: '5. Módulos Ministeriales Especializados',
    shortTitle: 'Ministerios',
    icon: Music,
    badge: '5 Ministerios',
    color: 'from-purple-600 to-pink-600',
    targetTab: 'worship',
    description:
      'Módulos a la medida para Alabanza, Danza, Damas, Ujieres y Teatro con cancioneros, castings y planes de trabajo.',
    highlights: [
      {
        icon: '🎵',
        title: 'Alabanza & Danza',
        text: 'Cancionero con acordes, tonos, audios, enlaces de YouTube, coreografías y vestuario.',
      },
      {
        icon: '🌸',
        title: 'Damas & Células',
        text: 'Control de células de hogar, motivos de oración contestados y reuniones de confraternidad.',
      },
      {
        icon: '🎭',
        title: 'Ujieres, Teatro & Castings',
        text: 'Roles de servicio, guiones teatrales, utilería, audiciones y planes de trabajo con checklist.',
      },
    ],
    proTip: 'Cada ministerio cuenta con su propia pestaña de Castings para evaluar aspirantes de forma estructurada.',
  },
  {
    id: 'chat',
    title: '6. Comunión y Grupos de Chat',
    shortTitle: 'Chat & Grupos',
    icon: MessageSquare,
    badge: 'Comunidad',
    color: 'from-blue-600 to-indigo-700',
    targetTab: 'chat',
    description:
      'Espacio de edificación para interactuar en grupos de células, intercesión, ministerios y anuncios oficiales.',
    highlights: [
      {
        icon: '💬',
        title: 'Mensajería en Tiempo Real',
        text: 'Envía mensajes, respuestas y reacciones con emojis entre líderes y miembros.',
      },
      {
        icon: '🙏',
        title: 'Peticiones y Testimonios',
        text: 'Tipos de mensajes especiales para peticiones de oración y versículos inspiradores.',
      },
      {
        icon: '🔒',
        title: 'Grupos por Categoría',
        text: 'Organización por Jóvenes, Damas, Varones, Células y Estudios Bíblicos.',
      },
    ],
    proTip: 'Cualquier petición de oración publicada en el chat queda visible al instante para intercesión colectiva.',
  },
  {
    id: 'customization',
    title: '7. Temas, Modo Claro / Oscuro y Logos',
    shortTitle: 'Personalización',
    icon: Palette,
    badge: 'Diseño 100%',
    color: 'from-rose-600 to-purple-600',
    targetTab: 'settings',
    description:
      'Personaliza completamente la apariencia visual con modo Claro / Oscuro al 100%, paletas de color y subida de logos propios.',
    highlights: [
      {
        icon: '🌓',
        title: 'Modo Claro y Oscuro Completo',
        text: 'Alterna entre fondo blanco de alto contraste o tema oscuro relajante con 1 solo clic.',
      },
      {
        icon: '🖼️',
        title: 'Logos de Iglesia y Secciones',
        text: 'Sube el logo oficial de la iglesia y logos específicos para cada sección y ministerio.',
      },
      {
        icon: '🎨',
        title: 'Colores por Pestaña',
        text: 'Personaliza los colores de cada módulo para identificar cada área al instante.',
      },
    ],
    proTip: 'Puedes cambiar entre Modo Claro y Oscuro desde el botón de la cabecera en cualquier momento.',
  },
  {
    id: 'sync',
    title: '8. Sincronización Real Multi-Dispositivo',
    shortTitle: 'Sincronización Nube',
    icon: Cloud,
    badge: 'Firebase en Vivo',
    color: 'from-teal-600 to-emerald-700',
    description:
      'Todos los cambios realizados en cualquier teléfono, tableta o computadora se reflejan al instante en los demás dispositivos.',
    highlights: [
      {
        icon: '🔄',
        title: 'En Tiempo Real 100%',
        text: 'Logos, fotos de perfil, miembros, diezmos y configuraciones se transmiten al instante.',
      },
      {
        icon: '🛡️',
        title: 'Seguridad en la Nube',
        text: 'Los datos están protegidos y respaldados en la base de datos Firestore de Firebase.',
      },
      {
        icon: '📱',
        title: 'Multi-Plataforma',
        text: 'Úsalo desde tu teléfono Android/iOS, tableta o computadora sin perder información.',
      },
    ],
    proTip: 'Si editas una foto o cambias un logo en tu móvil, aparecerá de inmediato en la computadora del pastor.',
  },
];

export const QuickGuideModal: React.FC<QuickGuideModalProps> = ({
  isOpen,
  onClose,
  showOnStartup,
  onToggleShowOnStartup,
  onNavigateToTab,
}) => {
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  if (!isOpen) return null;

  const currentSection = GUIDE_SECTIONS[activeSectionIndex];
  const isFirst = activeSectionIndex === 0;
  const isLast = activeSectionIndex === GUIDE_SECTIONS.length - 1;

  const handleNext = () => {
    if (!isLast) {
      setActiveSectionIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setActiveSectionIndex((prev) => prev - 1);
    }
  };

  const handleJumpToTab = (tab?: TabType) => {
    if (tab && onNavigateToTab) {
      onNavigateToTab(tab);
      onClose();
    }
  };

  const SectionIcon = currentSection.icon;

  return (
    <div
      id="quick-guide-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="quick-guide-modal-content"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Guía Rápida & Tutorial del Sistema
                </h2>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  Paso {activeSectionIndex + 1} de {GUIDE_SECTIONS.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aprende a sacar el máximo provecho a todas las herramientas de la plataforma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            title="Cerrar guía"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modular Step Navigation Pills */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-100/70 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {GUIDE_SECTIONS.map((sec, idx) => {
            const isActive = idx === activeSectionIndex;
            const Icon = sec.icon;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSectionIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.shortTitle}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Section Hero Banner */}
          <div
            className={`rounded-2xl p-5 sm:p-6 bg-gradient-to-r ${currentSection.color} text-white shadow-lg relative overflow-hidden`}
          >
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold tracking-wide uppercase">
                  <Sparkles className="w-3 h-3" />
                  {currentSection.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-black">{currentSection.title}</h3>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                  {currentSection.description}
                </p>
              </div>

              {currentSection.targetTab && (
                <button
                  onClick={() => handleJumpToTab(currentSection.targetTab)}
                  className="self-start sm:self-center px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Abrir este módulo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {currentSection.highlights.map((h, i) => (
              <div
                key={i}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all shadow-xs"
              >
                <div className="text-2xl">{h.icon}</div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {h.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {h.text}
                </p>
              </div>
            ))}
          </div>

          {/* Pro Tip Card */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start gap-3 text-amber-900 dark:text-amber-200 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-200/70 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
              <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-300" />
            </div>
            <div className="space-y-0.5">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Consejo Práctico
              </span>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                {currentSection.proTip}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Startup Checkbox & Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Startup Checkbox */}
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="quick-guide-startup-checkbox"
              checked={showOnStartup}
              onChange={(e) => onToggleShowOnStartup(e.target.checked)}
              className="w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer"
            />
            <span>Abrir la guía rápida cuando se inicie la app</span>
          </label>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrev}
              disabled={isFirst}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isFirst
                  ? 'opacity-40 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400'
                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Comenzar a usar la app!</span>
                </>
              ) : (
                <>
                  <span>Siguiente</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
