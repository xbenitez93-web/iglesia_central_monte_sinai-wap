export type MemberStatus = 'Activo' | 'En Prueba' | 'Inactivo' | 'Visita';

export type EcclesiasticalRoleCategory =
  | 'Pastoral'
  | 'Liderazgo'
  | 'Liturgia & Alabanza'
  | 'Educación & Niños'
  | 'Servicio & Diaconado'
  | 'Medios & Tecnología'
  | 'Misiones & Evangelismo'
  | 'General';

export interface EcclesiasticalRole {
  id: string;
  name: string;
  description: string; // Desglose de funciones específicas y responsabilidades
  category: EcclesiasticalRoleCategory;
  color?: string; // Código Hex o clase de color (ej. #4f46e5)
  isSystem?: boolean; // Define si es un cargo nativo predeterminado
  createdAt?: string;
  updatedAt?: string;
}

export type MinistryRole = string;

export interface Member {
  id: string;
  fullName: string;
  photoUrl?: string;
  email: string;
  phone: string;
  address: string;
  status: MemberStatus;
  baptized: boolean;
  birthDate: string;
  baptismDate?: string;
  familyId?: string;
  familyName?: string;
  ministries?: string[]; // e.g. ['worship', 'dance', 'women', 'ushers', 'theater', 'kids', 'youth', 'evangelism', 'media', 'intercession']
  ministryRoles: MinistryRole[];
  notes?: string;
  joinDate: string;
}

export interface Family {
  id: string;
  familyName: string;
  address: string;
  phone: string;
  mainContactMemberId?: string;
  mainContactName?: string;
  memberIds: string[];
  notes?: string;
}

export type EventType = 
  | 'Culto Dominical' 
  | 'Estudio Bíblico' 
  | 'Reunión de Jóvenes' 
  | 'Culto de Oración' 
  | 'Retiro / Taller' 
  | 'Evangelismo' 
  | 'Reunión de Líderes'
  | 'Escuela Dominical';

export interface VolunteerAssignment {
  role: string;
  memberId?: string;
  memberName: string;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  leader: string;
  notes?: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  description: string;
  speaker: string;
  teamAssignments: VolunteerAssignment[];
  attendanceCount?: number;
  status: 'Programado' | 'En Curso' | 'Finalizado' | 'Cancelado';
  agendaItems: AgendaItem[];
  verseText?: string;
}

export type TransactionType = 'Diezmo' | 'Ofrenda General' | 'Ofrenda Especial' | 'Donación' | 'Egreso/Gasto';
export type PaymentMethod = 'Efectivo' | 'Transferencia Bancaria' | 'Tarjeta' | 'Cheque' | 'Otro';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  memberId?: string;
  memberName?: string;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  description: string;
  receiptNumber: string;
  status: 'Completado' | 'Pendiente';
}

export interface CategoryBudget {
  category: string;
  budgeted: number;
  spent: number;
}

// Minicooperativa / Caja de Ahorro Parroquial
export interface CoopAccount {
  id: string;
  memberId: string;
  memberName: string;
  accountNumber: string;
  currentBalance: number;
  totalDeposited: number;
  totalWithdrawn: number;
  openedDate: string;
  status: 'Activa' | 'Suspendida';
}

export interface CoopTransaction {
  id: string;
  accountId: string;
  memberName: string;
  type: 'Depósito' | 'Retiro' | 'Abono Crédito' | 'Interés Distribuido';
  amount: number;
  date: string;
  notes: string;
}

export interface LoanPayment {
  id: string;
  date: string;
  amount: number;
  receiptNumber: string;
  notes?: string;
}

export interface MicroLoan {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  purpose: string;
  installmentMonths: number;
  monthlyPayment: number;
  interestRatePercentage: number;
  status: 'Solicitado' | 'Aprobado' | 'En Pago' | 'Pagado' | 'Rechazado';
  requestDate: string;
  approvedDate?: string;
  remainingAmount: number;
  payments: LoanPayment[];
}

// User Authentication & Role Management
export type BuiltInSystemRole = 
  | 'Desarrollador'
  | 'Administrador'
  | 'Contador'
  | 'Líder de Jóvenes'
  | 'Líder'
  | 'Miembro'
  | 'Alabanza'
  | 'Danza'
  | 'Damas'
  | 'Servidores'
  | 'Teatro';

export type SystemRole = BuiltInSystemRole | (string & {});

export interface CustomRole {
  id: string; // e.g. 'role_secretaria', 'custom_role_172...'
  name: string; // e.g. 'Secretario(a) General'
  description: string;
  category: 'Pastoral' | 'Administración' | 'Liderazgo' | 'Ministerios' | 'Servicio' | 'Educación' | 'Medios & Tecnología' | 'General';
  color: string; // Hex color code for badges/accents, e.g. '#4f46e5'
  iconName?: string; // e.g. 'Shield', 'KeyRound', 'Users', 'Star', 'Sparkles', 'BookOpen', 'Heart', etc.
  allowedTabs: string[]; // Módulos autorizados por defecto para este rol
  isSystem?: boolean; // True si es un rol predeterminado de fábrica
  hierarchyLevel?: number; // 1: Developer, 2: Admin/Pastoral, 3: Staff/Accounting, 4: Leaders, 5: Members
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
}

export type RegistrationStatus = 'approved' | 'pending' | 'rejected';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  role: SystemRole;
  avatarUrl?: string;
  allowedTabs: string[]; // ['dashboard', 'directory', 'events', 'finances', 'coop', 'worship', 'dance', 'women', 'ushers', 'theater', 'settings', 'developer']
  status?: RegistrationStatus; // Default 'approved' for active users
  requestedAt?: string;
  requestedRoleInterest?: string;
  notes?: string;
}

// Recycle Bin / Papelera de Reciclaje
export type DeletedItemType = 
  | 'member' 
  | 'family' 
  | 'event' 
  | 'specialCoopEvent' 
  | 'eventRegistration'
  | 'financialTransaction' 
  | 'coopAccount' 
  | 'coopTransaction'
  | 'microLoan' 
  | 'systemUser'
  | 'ministry'
  | 'customSection'
  | 'worshipSong'
  | 'worshipMusician'
  | 'worshipRehearsal'
  | 'worshipSchedule'
  | 'danceChoreography'
  | 'danceDancer'
  | 'danceRehearsal'
  | 'danceWardrobe'
  | 'womenActivity'
  | 'womenLeader'
  | 'womenCellGroup'
  | 'womenPrayerRequest'
  | 'usherServer'
  | 'usherDuty'
  | 'worshipCasting'
  | 'danceCasting'
  | 'theaterPlay'
  | 'theaterActor'
  | 'theaterRehearsal'
  | 'theaterCasting'
  | 'ministryWorkPlan'
  | 'chatGroup'
  | 'ecclesiasticalRole'
  | 'customRole';

export interface DeletedItem {
  id: string;
  originalId: string;
  itemType: DeletedItemType;
  title: string;
  subtitle?: string;
  deletedAt: string;
  deletedBy?: string;
  payload: any;
}

// Special Events with Adult/Child pricing (Minicooperativa / Recaudación)
export interface SpecialCoopEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  adultPrice: number;
  childPrice: number;
  targetGoal: number;
  status: 'Abierto' | 'En Curso' | 'Finalizado';
}

export interface EventRegistration {
  id: string;
  eventId: string;
  memberName: string;
  memberId?: string;
  adultsCount: number;
  childrenCount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod | 'Cuenta Ahorro Minicooperativa';
  date: string;
  status: 'Pagado' | 'Abonado' | 'Pendiente';
  notes?: string;
}

// ----------------------------------------------------
// MINISTERIO DE ALABANZA
// ----------------------------------------------------
export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  tone: string; // Ej: G, D, Em, C
  bpm?: number;
  category: 'Adoración' | 'Júbilo' | 'Apertura' | 'Comunión' | 'Ofrenda' | 'Especial';
  lyrics?: string;
  chordsUrl?: string;
  audioUrl?: string;
  youtubeUrl?: string;
  date?: string;
  notes?: string;
}

export interface WorshipMusician {
  id: string;
  name: string;
  role: 'Voz Principal' | 'Coros' | 'Piano / Teclado' | 'Guitarra Eléctrica' | 'Guitarra Acústica' | 'Bajo' | 'Batería' | 'Saxofón' | 'Sonido / Consola';
  phone?: string;
  status: 'Activo' | 'Suplente' | 'En Capacitación';
  date?: string;
  joinDate?: string;
}

export interface WorshipRehearsal {
  id: string;
  date: string;
  time: string;
  location: string;
  songIds: string[];
  directorName: string;
  youtubeUrl?: string;
  notes?: string;
}

export interface WorshipServiceSchedule {
  id: string;
  date: string;
  serviceType: 'Culto Dominical Mañana' | 'Culto Dominical Noche' | 'Culto de Jóvenes' | 'Culto de Oración / Miércoles' | 'Vigilia Especial';
  worshipLeader: string;
  songIds: string[];
  musicians: { role: string; name: string }[];
  youtubeUrl?: string;
  notes?: string;
}

// ----------------------------------------------------
// MINISTERIO DE DANZA
// ----------------------------------------------------
export interface DanceChoreography {
  id: string;
  title: string;
  songTitle: string;
  artist: string;
  duration: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  implementsUsed: string[]; // Panderos, Mantos, Banderas, Cintas, Heraldo, Manos Libres
  assignedCostume: string;
  videoReferenceUrl?: string;
  youtubeUrl?: string;
  date?: string;
  notes?: string;
}

export interface DanceDancer {
  id: string;
  name: string;
  groupCategory: 'Infantil / Semillitas' | 'Juvenil' | 'Damas / Adultas';
  roleInGroup: 'Líder / Coreógrafa' | 'Capitana de Fila' | 'Danzarina';
  phone?: string;
  status: 'Activa' | 'En Preparación';
  date?: string;
  joinDate?: string;
}

export interface DanceRehearsal {
  id: string;
  date: string;
  time: string;
  location: string;
  choreographyIds: string[];
  youtubeUrl?: string;
  notes?: string;
}

export interface DanceWardrobeItem {
  id: string;
  name: string;
  color: string;
  category: 'Vestido' | 'Manto' | 'Banderas' | 'Panderos' | 'Cintas' | 'Túnica';
  quantity: number;
  availableSizes?: string;
  date?: string;
  notes?: string;
}

// ----------------------------------------------------
// MINISTERIO DE DAMAS
// ----------------------------------------------------
export interface WomenActivity {
  id: string;
  title: string;
  type: 'Desayuno / Té de Damas' | 'Taller / Capacitación' | 'Retiro Femenino' | 'Vigilia de Oración' | 'Célula Especial' | 'Visita de Amor';
  date: string;
  time: string;
  location: string;
  speaker: string;
  budget?: number;
  expectedAttendance?: number;
  youtubeUrl?: string;
  notes?: string;
}

export interface WomenLeader {
  id: string;
  name: string;
  position: 'Presidenta' | 'Vicepresidenta' | 'Secretaria' | 'Tesorera' | 'Vocal de Oración' | 'Coordinadora de Visitas';
  phone: string;
  date?: string;
  appointedDate?: string;
}

export interface WomenCellGroup {
  id: string;
  name: string;
  leaderName: string;
  hostName: string;
  address: string;
  meetingDayTime: string;
  phone?: string;
  youtubeUrl?: string;
  date?: string;
}

export interface WomenPrayerRequest {
  id: string;
  requesterName: string;
  date: string;
  motive: string;
  category: 'Salud' | 'Familia / Hijos' | 'Matrimonio' | 'Finanzas' | 'Espiritual' | string;
  answered: boolean;
}

// ----------------------------------------------------
// MINISTERIO DE SERVIDORES (UJIERES / PROTOCOLO)
// ----------------------------------------------------
export interface UsherServer {
  id: string;
  name: string;
  phone?: string;
  role?: string;
  assignedArea?: string;
  preferredArea?: 'Entrada Principal' | 'Pasillo / Asientos' | 'Ofrendas' | 'Parqueo / Seguridad' | 'Santa Cena' | 'Limpieza y Orden';
  availability?: 'Domingos Mañana' | 'Domingos Tarde' | 'Miércoles' | 'Todos los Servicios';
  status: 'Activo' | 'Capacitación' | 'Descanso' | string;
  date?: string;
  joinDate?: string;
}

export interface UsherRoster {
  id: string;
  serviceDate: string;
  serviceType: string;
  leaderInCharge: string;
  assignments: { area: string; serverName: string; responsibility?: string }[];
  youtubeUrl?: string;
  date?: string;
  notes?: string;
}

export interface UsherDutySchedule {
  id: string;
  date: string;
  serviceType: string;
  captain: string;
  assignments: {
    station: 'Entrada Principal' | 'Pasillo / Ubicación' | 'Ofrendas' | 'Estacionamiento' | 'Recepción y Bienvenida' | 'Orden General';
    serverName: string;
  }[];
  notes?: string;
}

export interface UsherProtocolGuide {
  id: string;
  title: string;
  category: 'Bienvenida a Nuevos' | 'Recolección de Ofrendas' | 'Santa Cena' | 'Emergencias Médicas' | 'Orden en el Altar';
  description: string;
  youtubeUrl?: string;
}

// ----------------------------------------------------
// MINISTERIO DE TEATRO Y ARTES ESCÉNICAS
// ----------------------------------------------------
export interface TheaterActor {
  id: string;
  name: string;
  role: string;
  phone?: string;
  status: 'Activo' | 'En preparación' | 'Invitado' | string;
  date?: string;
  joinDate?: string;
}

export interface TheaterPlay {
  id: string;
  title: string;
  genre?: string;
  theme?: 'Evangelístico' | 'Semana Santa / Pascua' | 'Navidad' | 'Día de la Madre / Familia' | 'Juventud' | 'Reflexión / Comedia' | string;
  duration?: string;
  durationMinutes?: number;
  director?: string;
  synopsis: string;
  script?: string;
  scriptText?: string;
  targetAudience?: 'General' | 'Niños' | 'Jóvenes' | 'Matrimonios' | string;
  characters?: { name: string; actorName: string; costumeNotes?: string }[];
  status: 'En Ensayos' | 'Lista para Estreno' | 'Presentada' | 'En preparación' | 'Completada' | string;
  youtubeUrl?: string;
  date?: string;
  notes?: string;
}

export interface TheaterRehearsal {
  id: string;
  playId: string;
  playTitle: string;
  date: string;
  time: string;
  location: string;
  sceneDescription: string;
  youtubeUrl?: string;
  notes?: string;
}

export interface TheaterPropItem {
  id: string;
  itemName: string;
  category: 'Utilería' | 'Vestuario' | 'Escenografía' | 'Efectos / Sonido';
  playTitle?: string;
  quantity: number;
  responsibleName: string;
  status: 'Disponible' | 'En Elaboración' | 'Necesita Reparación';
}

export interface MinistryCastingCandidate {
  id: string;
  name: string;
  phone?: string;
  age?: number | string;
  applyingRole: string;
  category?: string; // e.g. "Voz", "Instrumento", "Danza", "Actuación", "Técnica"
  experienceLevel?: 'Principiante' | 'Intermedio' | 'Avanzado / Con Experiencia';
  skills?: string[];
  status: 'Seleccionado (Titular)' | 'Suplente / Cover' | 'En Evaluación' | 'No Seleccionado';
  scores?: {
    diction?: number; // 1-5 (Teatro / Dicción)
    expression?: number; // 1-5 (Expresión escénica / Gracia)
    memorization?: number; // 1-5 (Memoria / Repertorio)
    commitment?: number; // 1-5 (Puntualidad y Compromiso)
    pitch?: number; // 1-5 (Alabanza / Afinación y Oído)
    rhythm?: number; // 1-5 (Ritmo / Tiempo)
    technique?: number; // 1-5 (Técnica / Destreza)
    coordination?: number; // 1-5 (Danza / Coordinación)
    custom1Name?: string;
    custom1Score?: number;
    custom2Name?: string;
    custom2Score?: number;
  };
  overallRating?: number; // 1-5
  auditionNotes?: string;
  assignedPlayId?: string;
  assignedRole?: string;
  date?: string;
}

export interface MinistryCastingRole {
  id: string;
  roleName: string;
  characterType: string; // e.g. "Protagónico", "Voz Principal", "Instrumento Armónico", "Banderas & Mantos", etc.
  description: string;
  gender?: 'Masculino' | 'Femenino' | 'Indistinto';
  ageRange?: string;
  quantity?: number;
}

export interface MinistryCastingCall {
  id: string;
  ministry?: 'worship' | 'dance' | 'theater' | string;
  title: string;
  playId?: string;
  playTitle?: string;
  director: string;
  date: string;
  time: string;
  location: string;
  status: 'Convocatoria Abierta' | 'En Proceso de Audición' | 'Elenco Confirmado' | 'Cerrado';
  rolesNeeded: MinistryCastingRole[];
  requirements?: string;
  auditionScriptSnippet?: string; // Texto, pasaje o canción de prueba
  youtubeReferenceUrl?: string;
  candidates: MinistryCastingCandidate[];
  notes?: string;
}

// Aliases for backwards compatibility
export type TheaterCastingCandidate = MinistryCastingCandidate;
export type TheaterCastingRole = MinistryCastingRole;
export type TheaterCastingCall = MinistryCastingCall;
export type WorshipCastingCall = MinistryCastingCall;
export type DanceCastingCall = MinistryCastingCall;

// ----------------------------------------------------
// PLANIFICACIÓN DE TRABAJO MINISTERIAL (TODOS LOS MINISTERIOS)
// ----------------------------------------------------
export interface MinistryWorkPlanTask {
  id: string;
  description: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
}

export interface MinistryWorkPlan {
  id: string;
  ministry: 'worship' | 'dance' | 'women' | 'ushers' | 'theater' | string;
  title: string;
  objective: string;
  period: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual' | 'Proyecto Especial';
  periodName?: string; // Ej: "1er Trimestre 2026", "Mes de la Familia", "Semana Santa"
  startDate: string;
  endDate: string;
  responsibleLeader: string;
  budget?: number;
  status: 'Planificado' | 'En Progreso' | 'Completado' | 'Pausado';
  priority: 'Urgente' | 'Alta' | 'Media' | 'Baja';
  targetAudience?: string;
  goals: string[]; // Metas / Objetivos específicos
  tasks: MinistryWorkPlanTask[]; // Checklist de tareas con progreso
  notes?: string;
  youtubeUrl?: string;
  date?: string; // Fecha de registro/modificación
  createdAt?: string;
  updatedAt?: string;
}

// Themes & Tab Colors
export interface TabColorConfig {
  dashboard?: string;
  directory?: string;
  events?: string;
  finances?: string;
  coop?: string;
  ministries?: string;
  worship?: string;
  dance?: string;
  women?: string;
  ushers?: string;
  theater?: string;
  chat?: string;
  settings?: string;
  developer?: string;
  [tabId: string]: string | undefined;
}

// Custom Sub-Tabs & Content for Ministries
export interface MinistryCustomTabItem {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  url?: string;
  fileUrl?: string;
  date?: string;
  checked?: boolean;
  assignedTo?: string;
  quantity?: number;
  status?: string;
  notes?: string;
}

export interface MinistryCustomTab {
  id: string;
  name: string;
  iconName?: string;
  type: 'notes' | 'resources' | 'checklist' | 'custom_list';
  description?: string;
  content?: string;
  items?: MinistryCustomTabItem[];
  createdAt?: string;
}

// Dynamic Ministry Definition & Management
export interface MinistryItem {
  id: string; // e.g. 'worship', 'dance', 'women', 'ushers', 'theater', or 'youth', 'kids', 'media', etc.
  name: string;
  shortName?: string;
  description: string;
  leaderName?: string;
  leaderPhone?: string;
  leaderEmail?: string;
  iconName: string; // Key corresponding to Lucide icon name, e.g. 'Music', 'Sparkles', 'Heart', 'UserCheck', 'Drama', 'Flame', 'BookOpen', 'Video', 'Baby', 'Shield', 'Users', 'Church', 'Smile', 'Radio', 'Globe', 'Calendar', 'Megaphone', 'Star', 'Palette', 'Cross'
  color: string; // Hex color e.g. '#7c3aed'
  enabled: boolean;
  order: number;
  type?: 'worship' | 'dance' | 'women' | 'ushers' | 'theater' | 'custom';
  badge?: string;
  meetingSchedule?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerGradient?: 'glow' | 'deep' | 'vibrant' | 'minimal';
  bannerLogoPosition?: 'side' | 'background' | 'both' | 'none';
  bannerLogoOpacity?: number;
  coverImageUrl?: string;
  logoUrl?: string;
  enabledTabs?: string[]; // ['plans', 'members', 'castings', 'resources', 'notes']
  customTabs?: MinistryCustomTab[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_MINISTRIES: MinistryItem[] = [
  {
    id: 'worship',
    name: 'Alabanza y Adoración',
    shortName: 'Alabanza',
    description: 'Coordinación musical, repertorio, ensayos, músicos y vocalistas para el servicio dominical.',
    leaderName: 'Director de Alabanza',
    iconName: 'Music',
    color: '#7c3aed',
    enabled: true,
    order: 1,
    type: 'worship',
    badge: 'Ministerio Musical',
    meetingSchedule: 'Jueves y Sábados 6:00 PM',
  },
  {
    id: 'dance',
    name: 'Danza & Expresión',
    shortName: 'Danza',
    description: 'Coreografías proféticas, ensamble de mantos y panderos, vestuarios y ensayos.',
    leaderName: 'Líder de Danza',
    iconName: 'Sparkles',
    color: '#db2777',
    enabled: true,
    order: 2,
    type: 'dance',
    badge: 'Danza Profética',
    meetingSchedule: 'Viernes 5:00 PM',
  },
  {
    id: 'women',
    name: 'Sociedad de Damas',
    shortName: 'Damas',
    description: 'Células de damas, actividades, peticiones de oración y apoyo social a la congregación.',
    leaderName: 'Presidenta de Damas',
    iconName: 'Heart',
    color: '#e11d48',
    enabled: true,
    order: 3,
    type: 'women',
    badge: 'Comité Femenil',
    meetingSchedule: 'Miércoles 4:00 PM',
  },
  {
    id: 'ushers',
    name: 'Servidores & Ujieres',
    shortName: 'Servidores',
    description: 'Protocolo de bienvenida, orden en el santuario, asignaciones por servicio y roles de apoyo.',
    leaderName: 'Coordinador de Servidores',
    iconName: 'UserCheck',
    color: '#0284c7',
    enabled: true,
    order: 4,
    type: 'ushers',
    badge: 'Protocolo y Bienvenida',
    meetingSchedule: 'Domingos 8:30 AM',
  },
  {
    id: 'theater',
    name: 'Teatro & Artes Dramáticas',
    shortName: 'Teatro',
    description: 'Obras teatrales, dramas evangelísticos, elenco de actores, ensayos y utilería.',
    leaderName: 'Director de Teatro',
    iconName: 'Drama',
    color: '#9333ea',
    enabled: true,
    order: 5,
    type: 'theater',
    badge: 'Artes Escénicas',
    meetingSchedule: 'Sábados 4:00 PM',
  },
];

// Chat & Small Groups Types
export type ChatGroupCategory =
  | 'General'
  | 'Células'
  | 'Ministerios'
  | 'Jóvenes'
  | 'Damas'
  | 'Varones'
  | 'Intercesión'
  | 'Estudio Bíblico';

export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  category: ChatGroupCategory;
  avatarEmoji: string;
  colorTheme: string;
  createdBy: string;
  createdById: string;
  createdAt: string;
  memberIds: string[];
  leaderName: string;
  meetingSchedule?: string;
  isPrivate?: boolean;
}

export type ChatMessageType = 'standard' | 'prayer' | 'verse' | 'announcement' | 'testimony';

export interface ChatMessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  content: string;
  messageType: ChatMessageType;
  timestamp: string; // ISO date or time string
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  verseReference?: string;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
}

export type DashboardSectionId =
  | 'heroBanner'          // Banner de bienvenida eclesial con rol y nombre
  | 'quickShortcuts'      // Botones rápidos del banner (Diezmo/Entrada, Asistente IA)
  | 'pendingApprovals'    // Banner de aprobaciones de usuarios pendientes
  | 'kpiMembers'          // Tarjeta KPI: Miembros Registrados & Activos
  | 'kpiEvents'           // Tarjeta KPI: Agenda & Cultos Próximos
  | 'kpiFinances'         // Tarjeta KPI: Ingresos y Egresos del Mes (Financiero)
  | 'kpiCoop'             // Tarjeta KPI: Fondo Minicooperativa & Créditos
  | 'nextService'         // Bloque Principal: Próximo Culto & Servidores Asignados
  | 'quickActions'        // Acciones Rápidas Eclesiales (Nuevo Miembro, Agendar, Diezmo)
  | 'recentFinances'      // Lista: Movimientos Financieros Recientes (Privado)
  | 'ministriesSummary';  // Lista: Resumen de Ministerios en Servicio

export type DashboardRolePermissions = Record<DashboardSectionId, boolean>;

export type ModuleActionButtonActionType =
  | 'whatsapp'
  | 'phone'
  | 'url'
  | 'navigate'
  | 'modal'
  | 'email'
  | 'copy';

export interface ModuleActionButton {
  id: string;
  label: string;
  icon?: string;
  actionType: ModuleActionButtonActionType;
  targetUrl?: string; // Teléfono para whatsapp/llamadas, URL web, email
  targetTab?: string; // ID de la pestaña/módulo para navegación interna
  modalType?: 'prayer' | 'donate' | 'info' | 'contact';
  payload?: string; // Texto a copiar o mensaje predeterminado de whatsapp
  variant?: 'primary' | 'secondary' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'purple' | 'sky' | 'outline';
}

export interface AppCustomModuleConfig {
  id: string;
  label?: string;
  shortName?: string;
  subtitle?: string;
  iconName?: string;
  color?: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple' | 'blue';
  enabled?: boolean;
  order?: number;
  showInTopNav?: boolean;
  allowedRoles?: string[];
  actionButtons?: ModuleActionButton[];
  customNotice?: {
    text: string;
    type?: 'info' | 'announcement' | 'warning' | 'success';
  };
}

export interface ChurchConfig {
  name: string;
  slogan: string;
  verse: string;
  verseMode?: 'random' | 'fixed'; // 'random': muestra un versículo bíblico aleatorio en cada ingreso al sistema; 'fixed': muestra el versículo lema fijo
  denomination: string;
  address: string;
  phone: string;
  email: string;
  pastorName: string;
  logoUrl?: string;
  currencySymbol: string;
  customCategories: string[];
  enableCoopModule: boolean;
  activeThemeId?: string;
  themeMode?: 'light' | 'dark' | 'system';
  showQuickGuideOnStartup?: boolean;
  customTabColors?: TabColorConfig;
  customBanners?: Record<
    string,
    {
      title?: string;
      subtitle?: string;
      badge?: string;
      gradientStyle?: 'glow' | 'deep' | 'vibrant' | 'minimal';
      logoUrl?: string;
      logoPosition?: 'side' | 'background' | 'both' | 'none';
      logoOpacity?: number;
    }
  >;
  ministryLogos?: Record<string, string>;
  ministries?: MinistryItem[];
  ministryNavDisplayMode?: 'grouped' | 'tabs'; // 'grouped': show under a unified 'Ministerios' tab/hub; 'tabs': individual tabs for each active ministry
  customSections?: CustomSectionItem[];
  pushNotificationsEnabled?: boolean;
  notifyEvents?: boolean;
  notifyMeetings?: boolean;
  notifyCoop?: boolean;
  notifySound?: boolean;
  dashboardRolePermissions?: Record<string, Partial<Record<DashboardSectionId, boolean>>>;
  lockScreen?: LockScreenConfig;
  ecclesiasticalRoles?: EcclesiasticalRole[];
  customRoles?: CustomRole[];
  modulesConfig?: Record<string, AppCustomModuleConfig>;
  moduleNavOrder?: string[];
}

// Bloqueo de Pantalla & Salvapantallas por Inactividad
export type LockScreenTheme =
  | 'monte_sinai'
  | 'aurora'
  | 'sunset'
  | 'worship_night'
  | 'eternal_peace'
  | 'emerald_glory'
  | 'custom_color';

export type LockScreenAnimation =
  | 'particles'
  | 'aurora_waves'
  | 'ambient_glow'
  | 'celestial_stars'
  | 'subtle_pulse'
  | 'none';

export type LockScreenBackgroundType = 'gradient' | 'video' | 'image';

export interface CustomUserVideoPreset {
  id: string;
  name: string;
  blobKey: string;
  size?: number;
  type?: string;
  createdAt: number;
  url?: string;
  serverUrl?: string; // Permanent universal cross-device URL (e.g. /uploads/video_...mp4)
  thumbnailUrl?: string;
}

export interface LockScreenMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  mediaType?: string; // 'image/jpeg', 'video/mp4', etc.
  url: string; // Base64 data URL, remote URL o blob reference
  thumbnail?: string; // Preview data URL o thumbnail
  size?: number; // Tamaño en bytes
  sizeFormatted?: string; // e.g. "2.4 MB"
  isActiveInLockScreen?: boolean;
  source: 'device_upload' | 'preset' | 'camera_capture' | 'external_url';
  durationSeconds?: number;
  width?: number;
  height?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface LockScreenConfig {
  enabled: boolean;
  timeoutMinutes: number; // Ej: 0.5 (30s), 1, 2, 3, 5, 10, 15, 30, 60
  theme: LockScreenTheme;
  primaryColor?: string; // Ej: #4f46e5
  secondaryColor?: string; // Ej: #7c3aed
  animationType: LockScreenAnimation;
  backgroundType: LockScreenBackgroundType;
  mediaUrl?: string; // Object URL, remote URL o Base64
  mediaType?: 'image' | 'video';
  mediaName?: string;
  presetVideoId?: string; // Preset de video espiritual incorporado
  customVideoPresetId?: string; // ID del preset de video personalizado subido por el usuario
  videoMuted: boolean;
  videoOpacity: number; // 0.1 a 1.0 (opacidad del oscurecimiento de fondo)
  blurAmount: number; // 0 a 20 (px de desenfoque ambiental)
  showClock: boolean;
  showDate: boolean;
  showVerse: boolean;
  showChurchLogo: boolean;
  logoUrl?: string; // Logotipo específico para la pantalla de bloqueo (o hereda el de la iglesia)
  showSystemStatus: boolean;
  customHeading?: string; // Por defecto: 'Iglesia Central Monte Sinaí'
  customSubheading?: string;
  requirePasswordToUnlock: boolean;
  unlockPin?: string; // Opcional PIN de desbloqueo rápido (ej. '3755')
  updatedAt?: number;
  updatedBy?: string;
}

// Custom Sections / Tabs Creator Types
export type CustomSectionType =
  | 'donations'       // Donaciones / Ofrendas / Cuentas Bancarias / Zelle / Metas
  | 'media'           // Transmisiones en vivo, Podcasts, Radio, Videos
  | 'resources'       // Documentos descargables, Guías, Drive, Materiales
  | 'custom_page'     // Página personalizada modular con sub-pestañas
  | 'announcements'   // Tablón de noticias y boletines
  | 'prayer_wall'     // Muro de peticiones y testimonios
  | 'contact'         // Sedes, horarios, mapa y contactos
  | 'page_builder'    // Creador visual de módulos con textos, botones, progressbar, menús, frames
  | 'polls'           // Encuestas & Votaciones con imágenes, conteo de votos y ganadores en vivo
  | 'raffles';        // Sorteos & Rifas pro-fondos con boletos numerados, premios, tómbola digital y ganadores en vivo

// Visual Page & Module Builder Types
export type PageElementType =
  | 'text'
  | 'label'
  | 'button'
  | 'progressbar'
  | 'menu'
  | 'frame'
  | 'banner'
  | 'image'
  | 'video'
  | 'stats'
  | 'divider';

export interface PageMenuItem {
  id: string;
  label: string;
  description?: string;
  iconName?: string;
  badge?: string;
  badgeColor?: string;
  actionType?: 'navigate' | 'url' | 'whatsapp' | 'phone' | 'toast' | 'copy' | 'donations' | 'share' | 'prayer_modal' | 'email';
  targetTab?: string;
  url?: string;
  payload?: string;
}

export interface PageElementItem {
  id: string;
  type: PageElementType;
  // Common properties
  title?: string;
  subtitle?: string;
  content?: string; // body text, markdown, verse, quote
  align?: 'left' | 'center' | 'right';
  color?: string; // primary or text color hex
  bgColor?: string; // background color hex
  gradientPreset?: 'indigo-purple' | 'emerald-teal' | 'rose-pink' | 'amber-orange' | 'blue-cyan' | 'dark-slate' | 'royal-gold';
  themePreset?: string;
  // Text specific
  textVariant?: 'h1' | 'h2' | 'h3' | 'paragraph' | 'verse' | 'quote' | 'lead';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  // Label / Badge specific
  badgeText?: string;
  badgeColor?: string;
  badgeVariant?: 'solid' | 'soft' | 'outline' | 'gradient';
  iconName?: string;
  // Button specific
  buttonVariant?: 'primary' | 'secondary' | 'outline' | 'gradient' | 'danger' | 'soft';
  buttonSize?: 'sm' | 'md' | 'lg' | 'full';
  buttonActionType?: 'navigate' | 'url' | 'whatsapp' | 'phone' | 'toast' | 'copy' | 'donations' | 'share' | 'prayer_modal' | 'email' | 'download';
  buttonTargetTab?: string;
  buttonUrl?: string;
  buttonPayload?: string;
  // Banner specific
  bannerGradientStyle?: 'glow' | 'deep' | 'vibrant' | 'minimal' | 'gold' | 'emerald' | 'sunset' | 'royal' | 'dark_luxury';
  bannerHeight?: 'compact' | 'normal' | 'tall';
  bannerOverlayOpacity?: number;
  bannerCtaText?: string;
  bannerCtaActionType?: 'navigate' | 'url' | 'whatsapp' | 'phone' | 'toast' | 'copy' | 'donations' | 'share' | 'prayer_modal' | 'email' | 'download';
  bannerCtaTargetTab?: string;
  bannerCtaUrl?: string;
  bannerCtaPayload?: string;
  // Progressbar specific
  progressCurrent?: number;
  progressTotal?: number;
  progressPercentage?: number; // 0 - 100
  progressLabel?: string;
  progressColor?: string; // color hex or preset
  progressStyle?: 'linear' | 'gradient' | 'striped';
  showPercentageNumber?: boolean;
  hasActionButton?: boolean;
  actionButtonText?: string;
  actionButtonTab?: string;
  // Menu specific
  menuType?: 'grid' | 'list' | 'accordion';
  menuColumns?: 1 | 2 | 3 | 4;
  menuItems?: PageMenuItem[];
  // Frame / Container specific
  frameStyle?: 'card' | 'glass' | 'hero' | 'alert' | 'bordered';
  frameAlertTone?: 'info' | 'success' | 'warning' | 'error';
  childElements?: PageElementItem[];
  // Image / Video specific
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string; // YouTube or MP4
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  // Stats specific
  statValue?: string;
  statLabel?: string;
  statTrend?: string;
  statIcon?: string;
}

export type CustomSubTabType =
  | 'calendar'     // Calendarios / Fechas / Cronogramas
  | 'videos'       // Galería de Videos / Transmisiones / Grabaciones
  | 'links'        // Enlaces de interés / Enlaces rápidos
  | 'work_plans'   // Planificaciones de trabajo / Metas / Actividades
  | 'library'      // Biblioteca de Recursos / Libros / Guías / PDFs
  | 'music'        // Música / Cancionero / Repertorio / Partituras / Audios
  | 'members'      // Integrantes / Equipo / Roles / Directorio
  | 'casting'      // Casting / Audiciones / Evaluaciones
  | 'rehearsals'   // Ensayos / Prácticas / Lista de Asistencia
  | 'notes'        // Notas / Contenido / Comunicados
  | 'checklist'    // Lista de chequeo / Tareas
  | 'resources'    // Recursos descargables
  | 'custom_list'  // Lista genérica
  | 'polls'        // Encuestas & Votaciones interactivas con imágenes y conteo en vivo
  | 'raffles';     // Sorteos & Rifas pro-fondos con boletos numerados, tómbola digital y ganadores

// Modelos para Encuestas & Votaciones Interactivas
export interface PollOption {
  id: string;
  text: string;
  description?: string;
  imageUrl?: string; // Foto del candidato, proyecto o alternativa
  votesCount: number;
  voterUserIds?: string[]; // IDs/emails de usuarios que han votado por esta opción
  color?: string; // Color personalizado de la tarjeta/barra
}

export interface PollItem {
  id: string;
  title: string;
  description?: string;
  category?: string; // 'Elecciones', 'Proyectos', 'Juvenil', 'General', etc.
  status: 'active' | 'closed' | 'draft';
  allowMultipleVotes?: boolean;
  showResultsBeforeVoting?: boolean;
  createdAt?: string;
  expiresAt?: string; // Fecha límite de votación opcional
  onExpireAction?:
    | 'close_and_show_winner'
    | 'close_and_lock'
    | 'close_and_hide_results'
    | 'close_with_custom_message'
    | 'hide_poll'; // Qué opción tendrá la encuesta al terminar la cuenta regresiva
  showLiveCountdown?: boolean; // Mostrar cronómetro en vivo en la tarjeta
  expiredCustomMessage?: string; // Mensaje personalizado al terminar la cuenta regresiva
  closedAt?: string; // Fecha y hora en que se cerró la encuesta
  winnerOptionId?: string; // ID de la opción ganadora proclamada al cerrar
  closedByCountdown?: boolean; // Indica si se cerró automáticamente por vencimiento de cuenta regresiva
  createdBy?: string;
  options: PollOption[];
  totalVotes?: number;
  featuredImageUrl?: string;
}

export interface CustomSectionPollsData {
  polls: PollItem[];
  allowAnonymousVoting?: boolean;
}

// Modelos para Sorteos & Rifas Pro-Fondos
export interface RafflePrize {
  id: string;
  place: number; // 1 = 1er premio, 2 = 2do premio, etc.
  name: string; // ej. "Smart TV Samsung 55 pulgadas 4K"
  description?: string;
  imageUrl?: string; // Foto del premio
  valueEstimated?: number;
  winnerTicketNumber?: number; // Número del boleto ganador
  winnerBuyerName?: string; // Nombre del afortunado ganador
  winnerPhone?: string;
  winnerDeclaredAt?: string; // Fecha y hora en que salió sorteado
}

export interface RaffleTicket {
  number: number; // 1, 2, 3...
  ticketCode: string; // ej. "#001", "#045"
  status: 'available' | 'reserved' | 'sold'; // 'available' = libre | 'reserved' = apartado | 'sold' = pagado/confirmado
  buyerName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerNotes?: string;
  paymentMethod?: 'Efectivo' | 'Zelle' | 'Transferencia' | 'Tarjeta' | 'Gratis' | string;
  soldAt?: string;
  reservedAt?: string;
  registeredBy?: string; // Nombre o ID de usuario que registró la venta
  isWinner?: boolean; // True si este boleto ya salió ganador
  wonPrizeName?: string; // Nombre del premio ganado
  wonPrizePlace?: number; // Lugar del premio ganado (1, 2, 3...)
  isExcluded?: boolean; // True si este boleto fue descalificado o excluido del sorteo (ej. no se presentó)
  exclusionReason?: string; // Motivo de la exclusión (ej. 'No se presentó', 'Descalificado manualmente')
}

export interface RaffleExcludedRecord {
  ticketNumber: number;
  ticketCode: string;
  buyerName?: string;
  reason: string;
  timestamp: string;
}

export interface RaffleItem {
  id: string;
  title: string;
  description: string;
  category?: string; // 'Pro-Templo', 'Jóvenes', 'Misiones', 'Damas', 'Navidad', 'Benéfico', 'General'
  status: 'active' | 'completed' | 'draft' | 'paused';
  ticketPrice: number; // 0 = Gratis
  currency: string; // '$', 'USD', 'EUR', 'MXN', 'COP', etc.
  totalTickets: number; // ej. 50, 100, 200, 500
  ticketPrefix?: string; // ej. "#", "Nº "
  drawDate?: string; // Fecha y hora programada del sorteo (ISO string)
  bannerImageUrl?: string; // Imagen principal del sorteo o premios
  rulesAndTerms?: string; // Bases o condiciones del sorteo
  prizes: RafflePrize[];
  tickets: RaffleTicket[];
  excludedTickets?: RaffleExcludedRecord[]; // Registro histórico de boletos excluidos/descalificados durante la tómbola
  allowPublicReservation?: boolean; // Permite a los miembros elegir y reservar números directamente
  requirePaymentApproval?: boolean; // Las reservas quedan pendientes hasta que el admin/líder las marque como pagadas
  onlyDrawSoldTickets?: boolean; // Por defecto true: solo participan boletos vendidos en la tómbola
  preventRepeatWinners?: boolean; // Por defecto true: boletos que ya ganaron no vuelven a salir en sorteos siguientes
  preventRepeatBuyers?: boolean; // Si es true: una misma persona no puede ganar más de un premio
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  createdBy?: string;
}

export interface RaffleCategory {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color or badge styling
  icon?: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export const DEFAULT_RAFFLE_CATEGORIES: RaffleCategory[] = [
  { id: 'cat_pro_templo', name: 'Pro-Templo', description: 'Pro-Construcción y Mantenimiento del Templo', color: '#f59e0b', isDefault: true },
  { id: 'cat_alabanza', name: 'Alabanza', description: 'Ministerio de Alabanza y Música', color: '#8b5cf6', isDefault: true },
  { id: 'cat_jovenes', name: 'Jóvenes', description: 'Ministerio Juvenil y Campamentos', color: '#3b82f6', isDefault: true },
  { id: 'cat_damas', name: 'Damas & Familia', description: 'Ministerio de Damas y Familias', color: '#ec4899', isDefault: true },
  { id: 'cat_misiones', name: 'Misiones', description: 'Misiones, Evangelismo y Obra Social', color: '#10b981', isDefault: true },
  { id: 'cat_benefico', name: 'Acción Social', description: 'Caridad y Apoyo Comunitario', color: '#06b6d4', isDefault: true },
  { id: 'cat_general', name: 'General', description: 'Eventos Generales de la Congregación', color: '#64748b', isDefault: true },
];

export interface CustomSectionRafflesData {
  raffles: RaffleItem[];
  categories?: RaffleCategory[];
  defaultCurrency?: string;
  contactPhone?: string;
  paymentInstructions?: string; // ej. "Zelle: donaciones@iglesiacentral.org o Efectivo en mesa de información"
}

export interface SubTabCalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
  speakerOrLeader?: string;
  category?: string;
  color?: string;
}

export interface SubTabVideo {
  id: string;
  title: string;
  videoUrl: string; // YouTube, Vimeo, direct MP4, or cloud drive video
  description?: string;
  date?: string;
  duration?: string;
  speakerOrChannel?: string;
  thumbnailUrl?: string;
  category?: string;
}

export interface SubTabLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;
  iconName?: string;
  badge?: string;
}

export interface SubTabWorkPlanMilestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  assignedTo?: string;
}

export interface SubTabWorkPlan {
  id: string;
  title: string;
  objective?: string;
  responsible?: string;
  startDate?: string;
  dueDate?: string;
  progress: number; // 0 - 100
  status: 'Planificado' | 'En Progreso' | 'Completado' | 'En Pausa';
  milestones?: SubTabWorkPlanMilestone[];
  budget?: number;
  notes?: string;
}

export interface SubTabLibraryResource {
  id: string;
  title: string;
  author?: string;
  category?: string; // Libros, Guías, Manuales, Devocionales, Estudios
  fileUrl?: string;
  coverUrl?: string;
  pagesOrSize?: string;
  description?: string;
  format?: 'PDF' | 'EPUB' | 'DOCX' | 'PPTX' | 'ZIP' | 'Enlace';
  dateAdded?: string;
}

export interface SubTabSong {
  id: string;
  title: string;
  artistOrAuthor?: string;
  keyTone?: string; // e.g. "Sol Mayor (G)", "Re Mayor (D)"
  tempoBpm?: number; // e.g. 120
  audioUrl?: string; // MP3, Spotify, Drive or YouTube link
  chordsUrlOrText?: string;
  sheetMusicUrl?: string; // PDF Partitura
  category?: string; // Alabanza, Adoración, Especial, Himno, Coral
  lyrics?: string;
}

export interface SubTabMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  joinDate?: string;
  status: 'Activo' | 'En Capacitación' | 'De Permiso' | 'Inactivo';
  notes?: string;
}

export interface SubTabCastingAudition {
  id: string;
  candidateName: string;
  roleOrPosition: string; // e.g. "Voz Principal", "Guitarrista", "Actor Protagónico", "Danza"
  auditionDate: string;
  phone?: string;
  email?: string;
  status: 'Aprobado' | 'En Revisión' | 'Pendiente' | 'No Seleccionado';
  score?: number; // 1 to 10
  requirementsMet?: string;
  juryNotes?: string;
  videoOrAudioSampleUrl?: string;
  photoUrl?: string;
}

export interface SubTabRehearsalAttendee {
  name: string;
  role?: string;
  confirmed: boolean;
  attended?: boolean;
}

export interface SubTabRehearsal {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime?: string;
  location: string;
  agendaOrSetlist?: string;
  directorOrLeader?: string;
  status: 'Programado' | 'Realizado' | 'Cancelado';
  attendees?: SubTabRehearsalAttendee[];
}

export interface SubTabChecklistTask {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string;
  dueTime?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  assignedTo?: string;
  color?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface CustomSectionSubTab {
  id: string;
  name: string;
  iconName?: string;
  type: CustomSubTabType;
  description?: string;
  content?: string;
  badge?: string;
  colorTheme?: string;
  order?: number;
  active?: boolean;
  // Specific data stores
  calendarData?: { events: SubTabCalendarEvent[] };
  videosData?: { videos: SubTabVideo[] };
  linksData?: { links: SubTabLink[] };
  workPlansData?: { plans: SubTabWorkPlan[] };
  libraryData?: { resources: SubTabLibraryResource[] };
  musicData?: { songs: SubTabSong[] };
  membersData?: { members: SubTabMember[] };
  castingData?: { auditions: SubTabCastingAudition[] };
  rehearsalsData?: { rehearsals: SubTabRehearsal[] };
  checklistData?: { tasks: SubTabChecklistTask[] };
  pollsData?: CustomSectionPollsData;
  rafflesData?: CustomSectionRafflesData;
  // Legacy / generic items
  items?: {
    id: string;
    title: string;
    subtitle?: string;
    category?: string;
    url?: string;
    fileUrl?: string;
    date?: string;
    checked?: boolean;
    assignedTo?: string;
    quantity?: number;
    status?: string;
    notes?: string;
  }[];
  createdAt?: string;
}

export interface DonationPaymentMethod {
  id: string;
  title: string; // Ej: "Zelle Parroquial", "Banco Chase", "PayPal Iglesia"
  type: 'zelle' | 'bank' | 'paypal' | 'bizum' | 'card' | 'crypto' | 'other';
  accountName: string; // Titular de la cuenta
  accountNumberOrEmail: string; // No. de Cuenta / Email Zelle / Teléfono
  bankName?: string; // Nombre del Banco
  routingOrSwift?: string; // Número de Ruta / SWIFT / CLABE
  qrCodeUrl?: string; // Imagen del código QR de pago
  instructions?: string; // Ej: "Incluir nombre y apellido en el concepto"
  colorTheme?: string;
  active: boolean;
}

export interface DonationCampaign {
  id: string;
  title: string; // Ej: "Pro-Templo 2026", "Misiones Internacionales", "Canasta de Amor"
  description: string;
  targetGoal: number; // Meta en divisa
  currentAmount: number; // Monto recaudado actual
  deadline?: string;
  active: boolean;
  coverImageUrl?: string;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  amount: number;
  method: string;
  campaignId?: string;
  campaignTitle?: string;
  date: string;
  referenceNumber?: string;
  receiptPhotoUrl?: string;
  status: 'Confirmado' | 'Pendiente';
  notes?: string;
  isAnonymous?: boolean;
}

export interface CustomSectionExpirationConfig {
  enabled: boolean;
  expiresAt?: string; // ISO string e.g. "2026-10-01T23:59:00"
  startsAt?: string; // ISO string for scheduled start e.g. "2026-09-01T00:00:00"
  expirationAction?: 'hide' | 'lock' | 'banner'; // 'hide': ocultar | 'lock': bloquear acceso con aviso | 'banner': mantener visible con franja de finalizado
  showCountdown?: boolean; // Mostrar cronómetro/contador regresivo en vivo
  expiredMessage?: string; // Mensaje personalizado al expirar
}

export interface CustomSectionItem {
  id: string; // Unique key e.g. "donations", "transmisiones", "misiones"
  name: string; // Display title, e.g. "Donaciones", "Transmisiones en Vivo"
  shortName?: string; // Compact title for top nav
  slug: string; // URL / state key
  description: string;
  sectionType: CustomSectionType;
  iconName: string; // Lucide icon key
  color: string; // Primary hex color
  enabled: boolean;
  order: number;
  badge?: string; // e.g. "Ofrendar", "En Vivo", "Nuevo"
  showInTopNav: boolean; // Show in top navigation bar
  allowedRoles?: (SystemRole | string)[]; // Specific roles authorized to see this page. If empty or includes 'Todos', visible to all congregation.
  isPublic?: boolean; // Default true (congregation public access)
  publishedVersion?: string; // Latest release version attached to this module
  expiration?: CustomSectionExpirationConfig; // Configuración de tiempo de vencimiento y vigencia
  banner: {
    title: string;
    subtitle: string;
    badge?: string;
    gradientStyle?: 'glow' | 'deep' | 'vibrant' | 'minimal' | 'gold' | 'emerald';
    logoUrl?: string; // Uploaded logo or image
    logoPosition?: 'side' | 'background' | 'both' | 'none';
    logoOpacity?: number; // 0.05 to 1.0
    bgPattern?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  // Data for 'donations' section
  donationsData?: {
    versePrompt?: string; // Texto bíblico sobre ofrendar
    enableDonorRegistration?: boolean; // Permitir a miembros registrar su ofrenda
    showFundraisingCampaigns?: boolean; // Mostrar metas con barras de progreso
    showRecentDonations?: boolean; // Mostrar muro de aportes recientes
    methods: DonationPaymentMethod[];
    campaigns: DonationCampaign[];
    records: DonationRecord[];
  };
  // Data for 'media' section
  mediaData?: {
    liveStreamUrl?: string; // YouTube / Facebook / Vimeo embed
    streamTitle?: string;
    streamSchedule?: string;
    radioStreamUrl?: string;
    spotifyPlaylistUrl?: string;
    recentVideos?: { id: string; title: string; youtubeUrl: string; date: string; speaker?: string }[];
  };
  // Data for 'resources' section
  resourcesData?: {
    categories?: string[];
    files: { id: string; title: string; category: string; url: string; size?: string; format?: string; date: string; description?: string }[];
  };
  // Sub-tabs for modular multi-tab sections
  subTabs?: CustomSectionSubTab[];
  // Data for 'custom_page' section
  customContent?: {
    subTabs?: CustomSectionSubTab[];
    bodyText?: string;
    featuredImage?: string;
    cards?: { title: string; text: string; imageUrl?: string; tag?: string; linkUrl?: string }[];
  };
  // Data for 'announcements' section
  announcementsData?: {
    announcements: {
      id: string;
      title: string;
      content: string;
      date: string;
      badge?: string;
      author?: string;
      imageUrl?: string;
      linkUrl?: string;
    }[];
  };
  // Data for 'prayer_wall' section
  prayerData?: {
    requests: {
      id: string;
      name: string;
      request: string;
      date: string;
      prayerCount?: number;
      answered?: boolean;
      testimony?: string;
    }[];
  };
  // Data for 'contact' section
  contactData?: {
    address?: string;
    phone?: string;
    email?: string;
    officeHours?: string;
    servicesSchedule?: string;
    mapEmbedUrl?: string;
    socialLinks?: { platform: string; url: string }[];
  };
  // Data for 'polls' section
  pollsData?: CustomSectionPollsData;
  // Data for 'raffles' section
  rafflesData?: CustomSectionRafflesData;
  // Page elements for visual builder ('page_builder' or custom modular sections)
  pageElements?: PageElementItem[];
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_CUSTOM_SECTIONS: CustomSectionItem[] = [
  {
    id: 'donations',
    name: 'Donaciones & Ofrendas',
    shortName: 'Donaciones',
    slug: 'donaciones',
    description: 'Canales oficiales de donación, diezmos, ofrendas especiales, Zelle, cuentas bancarias y campañas pro-templo.',
    sectionType: 'donations',
    iconName: 'HeartHandshake',
    color: '#059669',
    enabled: true,
    order: 10,
    badge: 'Ofrendar',
    showInTopNav: true,
    banner: {
      title: 'Donaciones, Diezmos & Ofrendas',
      subtitle: 'Sembrando con gozo y gratitud en la obra del Reino de Dios',
      badge: 'Canales Oficiales Eclesiales',
      gradientStyle: 'emerald',
      logoPosition: 'side',
      logoOpacity: 0.25,
      primaryColor: '#059669',
      secondaryColor: '#047857',
    },
    donationsData: {
      versePrompt: '«Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, porque Dios ama al dador alegre.» — 2 Corintios 9:7',
      enableDonorRegistration: true,
      showFundraisingCampaigns: true,
      showRecentDonations: true,
      methods: [
        {
          id: 'meth_zelle_1',
          title: 'Zelle Oficial',
          type: 'zelle',
          accountName: 'Iglesia Central',
          accountNumberOrEmail: 'donaciones@iglesiacentral.org',
          instructions: 'Por favor indique en la nota si es Diezmo, Ofrenda General o Pro-Templo.',
          colorTheme: '#7c3aed',
          active: true,
        },
        {
          id: 'meth_bank_1',
          title: 'Transferencia Bancaria (Chase Bank)',
          type: 'bank',
          accountName: 'Iglesia Central Ministerio Internacional',
          bankName: 'JPMorgan Chase Bank',
          accountNumberOrEmail: '987654321012',
          routingOrSwift: '021000021',
          instructions: 'Depósitos y transferencias ACH. Comprobante al correo finanzas@iglesiacentral.org',
          colorTheme: '#0284c7',
          active: true,
        },
        {
          id: 'meth_paypal_1',
          title: 'PayPal Internacional & Tarjetas',
          type: 'paypal',
          accountName: 'Iglesia Central',
          accountNumberOrEmail: 'paypal.me/iglesiacentral',
          instructions: 'Acepta donaciones con tarjetas de débito o crédito internacionales.',
          colorTheme: '#0079C1',
          active: true,
        },
      ],
      campaigns: [
        {
          id: 'camp_pro_templo',
          title: 'Campaña Pro-Construcción del Templo',
          description: 'Recaudación para la ampliación del santuario principal y nuevas aulas infantiles.',
          targetGoal: 50000,
          currentAmount: 32450,
          deadline: '2026-12-31',
          active: true,
        },
        {
          id: 'camp_misiones',
          title: 'Fondo Misiones & Ayuda Social',
          description: 'Soporte alimentario para familias de escasos recursos y apoyo a misioneros en el campo.',
          targetGoal: 15000,
          currentAmount: 9800,
          active: true,
        },
      ],
      records: [
        {
          id: 'rec_1',
          donorName: 'Familia Benítez',
          amount: 250,
          method: 'Zelle Oficial',
          campaignTitle: 'Campaña Pro-Construcción del Templo',
          date: '2026-08-28',
          status: 'Confirmado',
          notes: 'Ofrenda Pro-Templo',
        },
        {
          id: 'rec_2',
          donorName: 'Anónimo',
          amount: 100,
          method: 'Transferencia Bancaria',
          campaignTitle: 'Fondo Misiones & Ayuda Social',
          date: '2026-08-29',
          status: 'Confirmado',
          notes: 'Misiones',
        },
      ],
    },
  },
];

export type NotificationCategory =
  | 'events'
  | 'meetings'
  | 'coop'
  | 'general'
  | 'system'
  | 'finances'
  | 'ministries'
  | 'admin'
  | 'security';

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  message?: string;
  category: NotificationCategory;
  date?: string;
  time?: string;
  timestamp: number | string;
  read: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  targetTab?: string;
  actionUrl?: string;
  authorName?: string;
  sender?: string;
  relatedEntityId?: string;
}

// System App Updates & Remote Broadcast Types
export interface AppUpdateRelease {
  id: string;
  version: string;
  versionCode: number;
  title: string;
  changelog: string[];
  releaseNotes?: string;
  isMandatory: boolean;
  downloadUrl?: string;
  apkUrl?: string;
  publishedAt: number;
  publishedBy: string;
  isActive: boolean;
  minSupportedVersion?: string;
}

export interface AppUpdateHistoryItem extends AppUpdateRelease {
  archivedAt?: number;
}

export type TabType =
  | 'dashboard'
  | 'directory'
  | 'events'
  | 'finances'
  | 'coop'
  | 'ministries'
  | 'worship'
  | 'dance'
  | 'women'
  | 'ushers'
  | 'theater'
  | 'settings'
  | 'developer'
  | 'help'
  | string;


