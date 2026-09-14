import {
  ChurchConfig,
  ChurchEvent,
  CoopAccount,
  CoopTransaction,
  DEFAULT_CUSTOM_SECTIONS,
  DEFAULT_MINISTRIES,
  EventRegistration,
  Family,
  FinancialTransaction,
  Member,
  MicroLoan,
  SpecialCoopEvent,
  UserProfile,
} from '../types';
import { DEFAULT_ECCLESIASTICAL_ROLES } from './ecclesiasticalRoles';

export const initialConfig: ChurchConfig = {
  name: 'Iglesia Central Monte Sinaí',
  slogan: 'Fe, esperanza y amor para la comunidad',
  verse: '«Porque donde están dos o tres congregados en mi nombre, allí estoy yo en medio de ellos.» - Mateo 18:20',
  verseMode: 'random',
  denomination: 'Evangélica Interdenominacional',
  address: 'Av. Central 450, Ciudad Monte Sinaí',
  phone: '+52 (55) 5554-3210',
  email: 'contacto@montesinai.org',
  pastorName: 'Pastor General',
  logoUrl: 'https://images.unsplash.com/photo-1548625361-16a7353f86fb?w=200&auto=format&fit=crop&q=80',
  currencySymbol: '$',
  enableCoopModule: true,
  activeThemeId: 'indigo-royal',
  ministryNavDisplayMode: 'tabs',
  ministries: DEFAULT_MINISTRIES,
  customSections: DEFAULT_CUSTOM_SECTIONS,
  ecclesiasticalRoles: DEFAULT_ECCLESIASTICAL_ROLES,
  customTabColors: {
    dashboard: '#4f46e5',
    directory: '#6366f1',
    events: '#d97706',
    finances: '#059669',
    coop: '#ea580c',
    ministries: '#7c3aed',
    worship: '#7c3aed',
    dance: '#db2777',
    women: '#e11d48',
    ushers: '#0284c7',
    theater: '#9333ea',
    chat: '#2563eb',
    settings: '#4338ca',
    developer: '#6b21a8',
  },
  customCategories: [
    'Diezmos y Ofrendas',
    'Servicios Públicos (Luz/Agua/Internet)',
    'Mantenimiento y Equipamiento',
    'Honorarios Pastoral',
    'Ministerio Infantil y Juvenil',
    'Evangelismo y Misiones',
    'Fondo de Ayuda Social / Caridad',
    'Eventos y Confección',
  ],
};

// =========================================================================
// USUARIO CLAVE Y ÚNICO DEL SISTEMA: DESARROLLADOR (XAVI)
// =========================================================================
export const initialSystemUsers: UserProfile[] = [
  {
    id: 'u-dev-xavi',
    name: 'Xavi',
    email: 'xavi@montesinai.org',
    password: '3755',
    role: 'Desarrollador',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    allowedTabs: [
      'dashboard',
      'directory',
      'events',
      'finances',
      'coop',
      'worship',
      'dance',
      'women',
      'ushers',
      'theater',
      'chat',
      'settings',
      'developer',
    ],
    status: 'approved',
  },
];

export const initialSpecialEvents: SpecialCoopEvent[] = [];

export const initialEventRegistrations: EventRegistration[] = [];

export const initialMembers: Member[] = [];

export const initialFamilies: Family[] = [];

export const initialEvents: ChurchEvent[] = [];

export const initialTransactions: FinancialTransaction[] = [];

export const initialCoopAccounts: CoopAccount[] = [];

export const initialCoopTransactions: CoopTransaction[] = [];

export const initialMicroLoans: MicroLoan[] = [];
