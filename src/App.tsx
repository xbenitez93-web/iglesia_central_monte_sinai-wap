import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppNotification,
  ChurchConfig,
  ChurchEvent,
  CoopAccount,
  CoopTransaction,
  DeletedItem,
  DeletedItemType,
  EventRegistration,
  Family,
  FinancialTransaction,
  Member,
  MicroLoan,
  SpecialCoopEvent,
  UserProfile,
  WorshipSong,
  WorshipMusician,
  WorshipRehearsal,
  WorshipServiceSchedule,
  DanceChoreography,
  DanceDancer,
  DanceRehearsal,
  DanceWardrobeItem,
  WomenActivity,
  WomenLeader,
  WomenCellGroup,
  WomenPrayerRequest,
  UsherServer,
  UsherRoster,
  TheaterPlay,
  TheaterActor,
  TheaterRehearsal,
  TheaterCastingCall,
  MinistryCastingCall,
  MinistryWorkPlan,
  LockScreenConfig,
  NotificationCategory,
  CustomRole,
} from './types';
import {
  initialConfig,
  initialEvents,
  initialFamilies,
  initialMembers,
  initialTransactions,
  initialCoopAccounts,
  initialCoopTransactions,
  initialMicroLoans,
  initialSpecialEvents,
  initialEventRegistrations,
  initialSystemUsers,
} from './data/mockData';
import {
  getRandomBibleVerse,
  getRandomBibleVerseExcluding,
} from './data/bibleVerses';
import {
  initialMinistryWorkPlans,
  initialWorshipSongs,
  initialWorshipMusicians,
  initialWorshipRehearsals,
  initialWorshipSchedules,
  initialWorshipCastings,
  initialDanceChoreographies,
  initialDanceDancers,
  initialDanceRehearsals,
  initialDanceWardrobe,
  initialDanceCastings,
  initialWomenActivities,
  initialWomenLeaders,
  initialWomenCellGroups,
  initialWomenPrayerRequests,
  initialUsherServers,
  initialTheaterPlays,
  initialTheaterRehearsals,
  initialTheaterCastings,
} from './data/ministriesData';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { churchThemes } from './data/themes';
import { DashboardView } from './components/DashboardView';
import { DirectoryView } from './components/DirectoryView';
import { EventsView } from './components/EventsView';
import { FinancesView } from './components/FinancesView';
import { CoopView } from './components/CoopView';
import { SettingsView } from './components/SettingsView';
import { DeveloperView } from './components/DeveloperView';
import { WorshipView } from './components/ministries/WorshipView';
import { DanceView } from './components/ministries/DanceView';
import { WomenView } from './components/ministries/WomenView';
import { UshersView } from './components/ministries/UshersView';
import { TheaterView } from './components/ministries/TheaterView';
import { MinistryHubView } from './components/ministries/MinistryHubView';
import { GenericMinistryView } from './components/ministries/GenericMinistryView';
import { CustomSectionRenderer } from './components/sections/CustomSectionRenderer';
import { DEFAULT_MINISTRIES, MinistryItem, DEFAULT_CUSTOM_SECTIONS, CustomSectionItem } from './types';
import { ChatView } from './components/ChatView.jsx';
import { AIPastoralAssistantModal } from './components/AIPastoralAssistantModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { InstallAppModal } from './components/InstallAppModal';
import { AppUpdateModal } from './components/AppUpdateModal';
import { AppUpdateRelease } from './types';
import { CURRENT_APP_VERSION, isNewerVersion, DEFAULT_INITIAL_RELEASE } from './version';
import { AuthView } from './components/AuthView';
import { PageThemeHeader } from './components/PageThemeHeader';
import { QuickGuideModal } from './components/QuickGuideModal';
import { getActivePageThemeColor } from './lib/pageTheme';
import { Lock, ShieldAlert, Clock } from 'lucide-react';
import { getSectionExpirationInfo, formatExpirationDate } from './utils/sectionExpiration';
import {
  getEffectiveAllowedTabs,
  isTabAllowedForUser,
  isMinistryAccessibleForUser,
  isCustomSectionAccessibleForUser,
} from './lib/rbac';
import { initialChurchNotifications, triggerNativePush, updateAppBadge } from './lib/pushNotifications';
import { LockScreenOverlay } from './components/LockScreenOverlay';
import {
  defaultLockScreenConfig,
  sanitizeLockScreenConfig,
  safeStringifyLockScreenConfig,
} from './data/lockScreenPresets';
import { getEffectiveEcclesiasticalRoles } from './data/ecclesiasticalRoles';
import { useInactivityTimer } from './hooks/useInactivityTimer';
import {
  syncFirestoreCollection,
  syncFirestoreDoc,
  saveFirestoreDoc,
  deleteFirestoreDoc,
  seedCollectionIfEmpty,
} from './lib/firebase';
import { sanitizeCustomSectionsNoDemoRaffles } from './utils/raffleUtils';

// =========================================================================
// INICIALIZACIÓN PERSISTENTE
// Los datos se sincronizan directamente con Firebase Firestore en tiempo real
// =========================================================================

export function sanitizeDeletedItem(rawItem: any, fallbackUser?: string): DeletedItem | null {
  if (!rawItem || typeof rawItem !== 'object') return null;

  let item = rawItem;
  // If the object itself has itemType as a DeletedItem object (due to nested call)
  if (item.itemType && typeof item.itemType === 'object') {
    const inner = item.itemType;
    item = {
      ...inner,
      id: item.id || inner.id,
      deletedAt: item.deletedAt || inner.deletedAt,
      deletedBy: item.deletedBy || inner.deletedBy,
    };
  }

  const rawItemType = typeof item.itemType === 'string' ? item.itemType : 'customSection';
  const rawTitle = typeof item.title === 'string' ? item.title : (item.title ? String((item.title as any)?.title || 'Elemento') : 'Elemento');
  const rawSubtitle = typeof item.subtitle === 'string' ? item.subtitle : (item.subtitle ? String(item.subtitle) : undefined);
  const rawDeletedAt = typeof item.deletedAt === 'string' ? item.deletedAt : new Date().toISOString();
  const rawDeletedBy = typeof item.deletedBy === 'string' ? item.deletedBy : (fallbackUser || 'Usuario');
  const rawOriginalId = typeof item.originalId === 'string' ? item.originalId : String(item.id || Date.now());

  return {
    id: typeof item.id === 'string' ? item.id : `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    originalId: rawOriginalId,
    itemType: rawItemType as DeletedItemType,
    title: rawTitle,
    subtitle: rawSubtitle,
    deletedAt: rawDeletedAt,
    deletedBy: rawDeletedBy,
    payload: item.payload,
  };
}

export default function App() {
  // Load state from localStorage or default initial data
  const [config, setConfig] = useState<ChurchConfig>(() => {
    const saved = localStorage.getItem('eclesia_config');
    const parsed = saved ? JSON.parse(saved) : initialConfig;
    if (parsed && parsed.customSections) {
      const { cleaned } = sanitizeCustomSectionsNoDemoRaffles(parsed.customSections);
      parsed.customSections = cleaned;
    }
    return parsed;
  });

  // Versículo bíblico activo: se inicializa de forma aleatoria al cargar / ingresar al sistema
  const [activeVerse, setActiveVerse] = useState<string>(() => {
    return getRandomBibleVerse();
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem('eclesia_members');
    return saved ? JSON.parse(saved) : initialMembers;
  });

  const [families, setFamilies] = useState<Family[]>(() => {
    const saved = localStorage.getItem('eclesia_families');
    return saved ? JSON.parse(saved) : initialFamilies;
  });

  const [events, setEvents] = useState<ChurchEvent[]>(() => {
    const saved = localStorage.getItem('eclesia_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    const saved = localStorage.getItem('eclesia_transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [coopAccounts, setCoopAccounts] = useState<CoopAccount[]>(() => {
    const saved = localStorage.getItem('eclesia_coopAccounts');
    return saved ? JSON.parse(saved) : initialCoopAccounts;
  });

  const [coopTransactions, setCoopTransactions] = useState<CoopTransaction[]>(() => {
    const saved = localStorage.getItem('eclesia_coopTransactions');
    return saved ? JSON.parse(saved) : initialCoopTransactions;
  });

  const [microLoans, setMicroLoans] = useState<MicroLoan[]>(() => {
    const saved = localStorage.getItem('eclesia_microLoans');
    return saved ? JSON.parse(saved) : initialMicroLoans;
  });

  const [specialEvents, setSpecialEvents] = useState<SpecialCoopEvent[]>(() => {
    const saved = localStorage.getItem('eclesia_specialEvents');
    return saved ? JSON.parse(saved) : initialSpecialEvents;
  });

  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>(() => {
    const saved = localStorage.getItem('eclesia_eventRegistrations');
    return saved ? JSON.parse(saved) : initialEventRegistrations;
  });

  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>(() => {
    const saved = localStorage.getItem('eclesia_deletedItems');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => sanitizeDeletedItem(item)).filter((x): x is DeletedItem => x !== null);
      }
    } catch {
      return [];
    }
    return [];
  });

  // Ministry States
  const [worshipSongs, setWorshipSongs] = useState<WorshipSong[]>(() => {
    const saved = localStorage.getItem('eclesia_worshipSongs');
    return saved ? JSON.parse(saved) : initialWorshipSongs;
  });
  const [worshipMusicians, setWorshipMusicians] = useState<WorshipMusician[]>(() => {
    const saved = localStorage.getItem('eclesia_worshipMusicians');
    return saved ? JSON.parse(saved) : initialWorshipMusicians;
  });
  const [worshipRehearsals, setWorshipRehearsals] = useState<WorshipRehearsal[]>(() => {
    const saved = localStorage.getItem('eclesia_worshipRehearsals');
    return saved ? JSON.parse(saved) : initialWorshipRehearsals;
  });
  const [worshipSchedules, setWorshipSchedules] = useState<WorshipServiceSchedule[]>(() => {
    const saved = localStorage.getItem('eclesia_worshipSchedules');
    return saved ? JSON.parse(saved) : initialWorshipSchedules;
  });
  const [worshipCastings, setWorshipCastings] = useState<MinistryCastingCall[]>(() => {
    const saved = localStorage.getItem('eclesia_worshipCastings');
    return saved ? JSON.parse(saved) : initialWorshipCastings;
  });

  const [danceChoreographies, setDanceChoreographies] = useState<DanceChoreography[]>(() => {
    const saved = localStorage.getItem('eclesia_danceChoreos');
    return saved ? JSON.parse(saved) : initialDanceChoreographies;
  });
  const [danceDancers, setDanceDancers] = useState<DanceDancer[]>(() => {
    const saved = localStorage.getItem('eclesia_danceDancers');
    return saved ? JSON.parse(saved) : initialDanceDancers;
  });
  const [danceRehearsals, setDanceRehearsals] = useState<DanceRehearsal[]>(() => {
    const saved = localStorage.getItem('eclesia_danceRehearsals');
    return saved ? JSON.parse(saved) : initialDanceRehearsals;
  });
  const [danceWardrobe, setDanceWardrobe] = useState<DanceWardrobeItem[]>(() => {
    const saved = localStorage.getItem('eclesia_danceWardrobe');
    return saved ? JSON.parse(saved) : initialDanceWardrobe;
  });
  const [danceCastings, setDanceCastings] = useState<MinistryCastingCall[]>(() => {
    const saved = localStorage.getItem('eclesia_danceCastings');
    return saved ? JSON.parse(saved) : initialDanceCastings;
  });

  const [womenActivities, setWomenActivities] = useState<WomenActivity[]>(() => {
    const saved = localStorage.getItem('eclesia_womenActivities');
    return saved ? JSON.parse(saved) : initialWomenActivities;
  });
  const [womenLeaders, setWomenLeaders] = useState<WomenLeader[]>(() => {
    const saved = localStorage.getItem('eclesia_womenLeaders');
    return saved ? JSON.parse(saved) : initialWomenLeaders;
  });
  const [womenCellGroups, setWomenCellGroups] = useState<WomenCellGroup[]>(() => {
    const saved = localStorage.getItem('eclesia_womenCells');
    return saved ? JSON.parse(saved) : initialWomenCellGroups;
  });
  const [womenPrayerRequests, setWomenPrayerRequests] = useState<WomenPrayerRequest[]>(() => {
    const saved = localStorage.getItem('eclesia_womenPrayers');
    return saved ? JSON.parse(saved) : initialWomenPrayerRequests;
  });

  const [usherServers, setUsherServers] = useState<UsherServer[]>(() => {
    const saved = localStorage.getItem('eclesia_usherServers');
    return saved ? JSON.parse(saved) : initialUsherServers;
  });
  const [usherRosters, setUsherRosters] = useState<UsherRoster[]>(() => {
    const saved = localStorage.getItem('eclesia_usherRosters');
    return saved ? JSON.parse(saved) : [];
  });

  const [theaterPlays, setTheaterPlays] = useState<TheaterPlay[]>(() => {
    const saved = localStorage.getItem('eclesia_theaterPlays');
    return saved ? JSON.parse(saved) : initialTheaterPlays;
  });
  const [theaterActors, setTheaterActors] = useState<TheaterActor[]>(() => {
    const saved = localStorage.getItem('eclesia_theaterActors');
    return saved ? JSON.parse(saved) : [];
  });
  const [theaterRehearsals, setTheaterRehearsals] = useState<TheaterRehearsal[]>(() => {
    const saved = localStorage.getItem('eclesia_theaterRehearsals');
    return saved ? JSON.parse(saved) : initialTheaterRehearsals;
  });
  const [theaterCastings, setTheaterCastings] = useState<TheaterCastingCall[]>(() => {
    const saved = localStorage.getItem('eclesia_theaterCastings');
    return saved ? JSON.parse(saved) : initialTheaterCastings;
  });

  const [ministryWorkPlans, setMinistryWorkPlans] = useState<MinistryWorkPlan[]>(() => {
    const saved = localStorage.getItem('eclesia_ministryWorkPlans');
    return saved ? JSON.parse(saved) : initialMinistryWorkPlans;
  });

  const [systemUsers, setSystemUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('eclesia_systemUsers');
    let users: UserProfile[] = saved ? JSON.parse(saved) : initialSystemUsers;
    
    // Normalize users so that their allowedTabs are strictly aligned with their role / configuration
    users = users.map((u) => {
      return {
        ...u,
        allowedTabs: getEffectiveAllowedTabs(u),
      };
    });

    // Guarantee Xavi developer profile is present and correctly configured with pass 3755
    const devIndex = users.findIndex(
      (u) =>
        (u.name || '').toLowerCase() === 'xavi' ||
        u.role === 'Desarrollador' ||
        u.id === 'u-dev-xavi' ||
        u.id === 'u-dev'
    );
    const xaviProfile: UserProfile = {
      id: 'u-dev-xavi',
      name: 'Xavi',
      email: 'xavi@montesinai.org',
      password: '3755',
      role: 'Desarrollador',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      allowedTabs: ['dashboard', 'directory', 'events', 'finances', 'coop', 'worship', 'dance', 'women', 'ushers', 'theater', 'chat', 'settings', 'developer'],
      status: 'approved',
    };
    if (devIndex >= 0) {
      users[devIndex] = { ...users[devIndex], ...xaviProfile };
    } else {
      users.unshift(xaviProfile);
    }
    return users;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const activeUserId = localStorage.getItem('eclesia_activeUserId');
    if (activeUserId) {
      const savedUsers = localStorage.getItem('eclesia_systemUsers');
      const users: UserProfile[] = savedUsers ? JSON.parse(savedUsers) : initialSystemUsers;
      const found = users.find((u) => u.id === activeUserId || (activeUserId === 'u-dev-xavi' && u.role === 'Desarrollador'));
      if (found && found.status !== 'pending' && found.status !== 'rejected') {
        return {
          ...found,
          allowedTabs: getEffectiveAllowedTabs(found),
        };
      }
    }
    return null; // Force showing Login screen on launch if no active approved session
  });

  const [customRoles, setCustomRoles] = useState<CustomRole[]>(() => {
    const saved = localStorage.getItem('eclesia_customRoles');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('eclesia_customRoles', JSON.stringify(customRoles));
    } catch (e) {
      console.error('Error saving customRoles to localStorage:', e);
    }
  }, [customRoles]);

  const [devSubTab, setDevSubTab] = useState<'modules' | 'trash' | 'users' | 'system_roles' | 'ministries' | 'custom_sections' | 'home_customizer' | 'maintenance' | 'system' | 'database' | 'lock_screen' | 'ecclesiastical_roles' | 'app_updates'>('modules');
  const [devAutoOpenCreator, setDevAutoOpenCreator] = useState<number>(0);

  useEffect(() => {
    localStorage.setItem('eclesia_systemUsers', JSON.stringify(systemUsers));
  }, [systemUsers]);

  // Dynamic Config updater with automatic Firestore & LocalStorage persistence
  const handleUpdateConfig = (newConfigOrFn: ChurchConfig | ((prev: ChurchConfig) => ChurchConfig)) => {
    setConfig((prev) => {
      const updated = typeof newConfigOrFn === 'function' ? newConfigOrFn(prev) : newConfigOrFn;
      try {
        localStorage.setItem('eclesia_config', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving config to localStorage:', e);
      }
      if (updated.verseMode === 'fixed' && updated.verse) {
        setActiveVerse(updated.verse);
      }
      // Save debounced to Firestore safely outside the state reducer
      setTimeout(() => {
        saveFirestoreDoc('system', 'config', updated, { debounceMs: 300 });
      }, 0);
      return updated;
    });
  };

  // =========================================================================
  // 100% ACTIVE LIGHT / DARK / SYSTEM MODE LOGIC
  // =========================================================================
  const isDarkMode = useMemo(() => {
    if (config.themeMode === 'dark') return true;
    if (config.themeMode === 'light') return false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  }, [config.themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    const nextMode = isDarkMode ? 'light' : 'dark';
    handleUpdateConfig((prev) => ({ ...prev, themeMode: nextMode }));
  };

  // =========================================================================
  // GUÍA RÁPIDA / TUTORIAL STARTUP CONTROLLER
  // =========================================================================
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState(false);

  useEffect(() => {
    if (config.showQuickGuideOnStartup) {
      const timer = setTimeout(() => {
        setIsQuickGuideOpen(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [config.showQuickGuideOnStartup]);

  const handleToggleQuickGuideStartup = (enabled: boolean) => {
    handleUpdateConfig((prev) => ({ ...prev, showQuickGuideOnStartup: enabled }));
  };

  // =========================================================================
  // REAL-TIME MULTI-DEVICE FIRESTORE SYNCHRONIZATION
  // Sincronización bidireccional en tiempo real para todos los dispositivos
  // =========================================================================
  useEffect(() => {
    // Purge any existing demo raffles from local and remote custom sections
    if (config.customSections) {
      const { cleaned, removedRaffleIds } = sanitizeCustomSectionsNoDemoRaffles(config.customSections);
      if (removedRaffleIds.length > 0) {
        handleUpdateConfig((prev) => ({ ...prev, customSections: cleaned }));
        removedRaffleIds.forEach((rid) => {
          deleteFirestoreDoc('raffles', rid).catch(() => {});
        });
      }
    }

    // Initial bootstrap seeds for remote database (safely executed once)
    seedCollectionIfEmpty('system', [{ id: 'config', ...config }]);
    if (systemUsers.length > 0) {
      seedCollectionIfEmpty('systemUsers', systemUsers);
    }
    if (initialChurchNotifications.length > 0) {
      seedCollectionIfEmpty('notifications', initialChurchNotifications);
    }

    const unsubConfig = syncFirestoreDoc<ChurchConfig>('system', 'config', (remoteConfig) => {
      if (remoteConfig) {
        let safeConfig = { ...remoteConfig };
        if (safeConfig.customSections) {
          const { cleaned, removedRaffleIds } = sanitizeCustomSectionsNoDemoRaffles(safeConfig.customSections);
          safeConfig.customSections = cleaned;
          if (removedRaffleIds.length > 0) {
            saveFirestoreDoc('system', 'config', safeConfig).catch(() => {});
            removedRaffleIds.forEach((rid) => {
              deleteFirestoreDoc('raffles', rid).catch(() => {});
            });
          }
        }
        setConfig((prev) => ({ ...prev, ...safeConfig }));
      }
    });

    const unsubUsers = syncFirestoreCollection<UserProfile>('systemUsers', (items) => {
      if (items && items.length > 0) {
        const normalized = items.map((u) => ({
          ...u,
          allowedTabs: getEffectiveAllowedTabs(u),
        }));

        // Guarantee Xavi developer profile is present and correctly configured with pass 3755
        const devIndex = normalized.findIndex(
          (u) =>
            (u.name || '').toLowerCase() === 'xavi' ||
            u.role === 'Desarrollador' ||
            u.id === 'u-dev-xavi' ||
            u.id === 'u-dev'
        );
        const xaviProfile: UserProfile = {
          id: 'u-dev-xavi',
          name: 'Xavi',
          email: 'xavi@montesinai.org',
          password: '3755',
          role: 'Desarrollador',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          allowedTabs: ['dashboard', 'directory', 'events', 'finances', 'coop', 'worship', 'dance', 'women', 'ushers', 'theater', 'chat', 'settings', 'developer'],
          status: 'approved',
        };
        if (devIndex >= 0) {
          normalized[devIndex] = { ...normalized[devIndex], ...xaviProfile };
        } else {
          normalized.unshift(xaviProfile);
        }

        setSystemUsers(normalized);
        try {
          localStorage.setItem('eclesia_systemUsers', JSON.stringify(normalized));
        } catch (e) {}

        setCurrentUser((prevUser) => {
          if (!prevUser) return null;
          const liveUser = normalized.find((u) => u.id === prevUser.id);
          if (liveUser) {
            return {
              ...liveUser,
              allowedTabs: getEffectiveAllowedTabs(liveUser),
            };
          }
          return prevUser;
        });
      }
    });

    const unsubMembers = syncFirestoreCollection<Member>('members', (items) => {
      if (items) setMembers(items);
    });

    const unsubFamilies = syncFirestoreCollection<Family>('families', (items) => {
      if (items) setFamilies(items);
    });

    const unsubEvents = syncFirestoreCollection<ChurchEvent>('events', (items) => {
      if (items) setEvents(items);
    });

    const unsubTransactions = syncFirestoreCollection<FinancialTransaction>('transactions', (items) => {
      if (items) setTransactions(items);
    });

    const unsubCoopAccounts = syncFirestoreCollection<CoopAccount>('coopAccounts', (items) => {
      if (items) setCoopAccounts(items);
    });

    const unsubCoopTx = syncFirestoreCollection<CoopTransaction>('coopTransactions', (items) => {
      if (items) setCoopTransactions(items);
    });

    const unsubLoans = syncFirestoreCollection<MicroLoan>('microLoans', (items) => {
      if (items) setMicroLoans(items);
    });

    const unsubSpecial = syncFirestoreCollection<SpecialCoopEvent>('specialEvents', (items) => {
      if (items) setSpecialEvents(items);
    });

    const unsubRegistrations = syncFirestoreCollection<EventRegistration>('eventRegistrations', (items) => {
      if (items) setEventRegistrations(items);
    });

    const unsubTrash = syncFirestoreCollection<DeletedItem>('deletedItems', (items) => {
      if (items && Array.isArray(items)) {
        const sanitized = items.map((item) => sanitizeDeletedItem(item)).filter((x): x is DeletedItem => x !== null);
        setDeletedItems(sanitized);
      }
    });

    // Ministries
    const unsubSongs = syncFirestoreCollection<WorshipSong>('worshipSongs', (items) => items && setWorshipSongs(items));
    const unsubMusicians = syncFirestoreCollection<WorshipMusician>('worshipMusicians', (items) => items && setWorshipMusicians(items));
    const unsubRehearsals = syncFirestoreCollection<WorshipRehearsal>('worshipRehearsals', (items) => items && setWorshipRehearsals(items));
    const unsubSchedules = syncFirestoreCollection<WorshipServiceSchedule>('worshipSchedules', (items) => items && setWorshipSchedules(items));
    const unsubWorshipCastings = syncFirestoreCollection<MinistryCastingCall>('worshipCastings', (items) => items && setWorshipCastings(items));

    const unsubDanceChoreos = syncFirestoreCollection<DanceChoreography>('danceChoreos', (items) => items && setDanceChoreographies(items));
    const unsubDanceDancers = syncFirestoreCollection<DanceDancer>('danceDancers', (items) => items && setDanceDancers(items));
    const unsubDanceRehearsals = syncFirestoreCollection<DanceRehearsal>('danceRehearsals', (items) => items && setDanceRehearsals(items));
    const unsubDanceWardrobe = syncFirestoreCollection<DanceWardrobeItem>('danceWardrobe', (items) => items && setDanceWardrobe(items));
    const unsubDanceCastings = syncFirestoreCollection<MinistryCastingCall>('danceCastings', (items) => items && setDanceCastings(items));

    const unsubWomenActivities = syncFirestoreCollection<WomenActivity>('womenActivities', (items) => items && setWomenActivities(items));
    const unsubWomenLeaders = syncFirestoreCollection<WomenLeader>('womenLeaders', (items) => items && setWomenLeaders(items));
    const unsubWomenCells = syncFirestoreCollection<WomenCellGroup>('womenCells', (items) => items && setWomenCellGroups(items));
    const unsubWomenPrayers = syncFirestoreCollection<WomenPrayerRequest>('womenPrayers', (items) => items && setWomenPrayerRequests(items));

    const unsubUsherServers = syncFirestoreCollection<UsherServer>('usherServers', (items) => items && setUsherServers(items));
    const unsubUsherRosters = syncFirestoreCollection<UsherRoster>('usherRosters', (items) => items && setUsherRosters(items));

    const unsubTheaterPlays = syncFirestoreCollection<TheaterPlay>('theaterPlays', (items) => items && setTheaterPlays(items));
    const unsubTheaterActors = syncFirestoreCollection<TheaterActor>('theaterActors', (items) => items && setTheaterActors(items));
    const unsubTheaterRehearsals = syncFirestoreCollection<TheaterRehearsal>('theaterRehearsals', (items) => items && setTheaterRehearsals(items));
    const unsubTheaterCastings = syncFirestoreCollection<MinistryCastingCall>('theaterCastings', (items) => items && setTheaterCastings(items));

    const unsubWorkPlans = syncFirestoreCollection<MinistryWorkPlan>('ministryWorkPlans', (items) => items && setMinistryWorkPlans(items));

    const unsubCustomRoles = syncFirestoreCollection<CustomRole>('customRoles', (items) => {
      if (items && Array.isArray(items)) {
        setCustomRoles(items);
      }
    });

    const unsubNotifications = syncFirestoreCollection<AppNotification>(
      'notifications',
      (items) => {
        if (items && Array.isArray(items) && items.length > 0) {
          const sorted = [...items].sort((a, b) => {
            const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.date || 0).getTime();
            const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.date || 0).getTime();
            return timeB - timeA;
          });
          setNotifications(sorted);
        }
      }
    );

    const unsubLockScreen = syncFirestoreDoc<LockScreenConfig>('system', 'lockScreenConfig', (remoteLock) => {
      if (remoteLock) {
        setLockScreenConfig((prev) => sanitizeLockScreenConfig({ ...prev, ...remoteLock }));
      }
    });

    return () => {
      unsubConfig();
      unsubUsers();
      unsubMembers();
      unsubFamilies();
      unsubEvents();
      unsubTransactions();
      unsubCoopAccounts();
      unsubCoopTx();
      unsubLoans();
      unsubSpecial();
      unsubRegistrations();
      unsubTrash();
      unsubSongs();
      unsubMusicians();
      unsubRehearsals();
      unsubSchedules();
      unsubWorshipCastings();
      unsubDanceChoreos();
      unsubDanceDancers();
      unsubDanceRehearsals();
      unsubDanceWardrobe();
      unsubDanceCastings();
      unsubWomenActivities();
      unsubWomenLeaders();
      unsubWomenCells();
      unsubWomenPrayers();
      unsubUsherServers();
      unsubUsherRosters();
      unsubTheaterPlays();
      unsubTheaterActors();
      unsubTheaterRehearsals();
      unsubTheaterCastings();
      unsubWorkPlans();
      unsubCustomRoles();
      unsubNotifications();
      unsubLockScreen();
    };
  }, []);

  const handleUpdateSystemUsers = (newUsers: UserProfile[]) => {
    const normalized = newUsers.map((u) => ({
      ...u,
      allowedTabs: getEffectiveAllowedTabs(u),
    }));

    // Detect removed users and delete from Firestore
    const newIds = new Set(normalized.map((u) => u.id));
    systemUsers.forEach((prevU) => {
      if (!newIds.has(prevU.id)) {
        deleteFirestoreDoc('systemUsers', prevU.id);
      }
    });

    setSystemUsers(normalized);
    try {
      localStorage.setItem('eclesia_systemUsers', JSON.stringify(normalized));
    } catch (e) {}

    normalized.forEach((u) => {
      saveFirestoreDoc('systemUsers', u.id, u);
    });

    if (currentUser) {
      const updatedCurrent = normalized.find((u) => u.id === currentUser.id);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
      }
    }
  };

  const handleLoginSuccess = (user: UserProfile) => {
    const effectiveTabs = getEffectiveAllowedTabs(user);
    const normalizedUser = {
      ...user,
      allowedTabs: effectiveTabs,
    };
    setCurrentUser(normalizedUser);
    localStorage.setItem('eclesia_activeUserId', normalizedUser.id);
    // Cambiar versículo bíblico aleatorio cada vez que se ingresa al sistema
    setActiveVerse((prev) => getRandomBibleVerseExcluding(prev));
    if (effectiveTabs.length > 0 && !effectiveTabs.includes(activeTab)) {
      setActiveTab(effectiveTabs[0] as TabType);
    }
  };

  useEffect(() => {
    if (currentUser) {
      const allowed = getEffectiveAllowedTabs(currentUser);
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0] as TabType);
      }
    }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('eclesia_activeUserId');
  };

  const handleRegisterUser = (newUser: UserProfile) => {
    const normalized = {
      ...newUser,
      allowedTabs: getEffectiveAllowedTabs(newUser),
    };

    setSystemUsers((prev) => {
      const filtered = prev.filter(
        (u) => u.id !== normalized.id && u.email.toLowerCase() !== normalized.email.toLowerCase()
      );
      const nextUsers = [...filtered, normalized];
      try {
        localStorage.setItem('eclesia_systemUsers', JSON.stringify(nextUsers));
      } catch (e) {}
      return nextUsers;
    });

    // Directly persist registered user to Firestore database
    saveFirestoreDoc('systemUsers', normalized.id, normalized);
  };

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Push Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('eclesia_notifications');
    return saved ? JSON.parse(saved) : initialChurchNotifications;
  });
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // Lock Screen & Screensaver State (configurable from Developer tab & stored in Firestore)
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);
  const [lockScreenConfig, setLockScreenConfig] = useState<LockScreenConfig>(() => {
    try {
      const saved = localStorage.getItem('eclesia_lock_screen_config');
      return saved ? sanitizeLockScreenConfig(JSON.parse(saved)) : defaultLockScreenConfig;
    } catch {
      return defaultLockScreenConfig;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('eclesia_lock_screen_config', safeStringifyLockScreenConfig(lockScreenConfig));
    } catch (e) {
      console.warn('Could not save lock screen config to localStorage:', e);
    }
  }, [lockScreenConfig]);

  // Inactivity detection: triggers lock screen after configured timeout
  useInactivityTimer({
    timeoutMinutes:
      typeof lockScreenConfig.timeoutMinutes === 'number' && lockScreenConfig.timeoutMinutes > 0
        ? lockScreenConfig.timeoutMinutes
        : 5,
    enabled: (lockScreenConfig.enabled ?? true) && !isScreenLocked && !!currentUser,
    onIdle: () => {
      setIsScreenLocked(true);
    },
  });

  useEffect(() => {
    localStorage.setItem('eclesia_notifications', JSON.stringify(notifications));
    const unread = notifications.filter((n) => !n.read).length;
    updateAppBadge(unread);
  }, [notifications]);

  // Tab badges for visual indicators like Android One UI
  const tabBadges: Record<string, number> = useMemo(() => {
    const badges: Record<string, number> = {};
    notifications.forEach((n) => {
      if (!n.read && n.targetTab) {
        badges[n.targetTab] = (badges[n.targetTab] || 0) + 1;
      }
    });
    const pendingUsers = systemUsers.filter((u) => u.status === 'pending').length;
    if (pendingUsers > 0) {
      badges['developer'] = (badges['developer'] || 0) + pendingUsers;
    }
    return badges;
  }, [notifications, systemUsers]);

  const customMinistry = useMemo(() => {
    const builtInIds = [
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
      'ministries',
    ];
    if (builtInIds.includes(activeTab)) return null;
    return (config.ministries || DEFAULT_MINISTRIES).find((m) => m.id === activeTab) || null;
  }, [activeTab, config.ministries]);

  // Automatically adjust activeTab if currentUser doesn't have access to the current one
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === 'Desarrollador') return;
    const allowed = getEffectiveAllowedTabs(currentUser);
    if (allowed.length > 0 && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0] as TabType);
    }
  }, [currentUser, activeTab]);

  const [isAIPastoralModalOpen, setIsAIPastoralModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // App Update Modal & Cloud Broadcast State
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [remoteUpdateRelease, setRemoteUpdateRelease] = useState<AppUpdateRelease | null>(() => DEFAULT_INITIAL_RELEASE);
  const [installedVersion, setInstalledVersion] = useState<string>(() => {
    return localStorage.getItem('eclesia_installed_version') || CURRENT_APP_VERSION;
  });

  // Real-time listener for remote App Updates broadcast from Firestore
  useEffect(() => {
    const unsubUpdate = syncFirestoreDoc<AppUpdateRelease>('system', 'activeAppUpdate', (release) => {
      if (release && release.isActive && release.version) {
        setRemoteUpdateRelease(release);
        const localVer = localStorage.getItem('eclesia_installed_version') || CURRENT_APP_VERSION;
        const dismissedVer = localStorage.getItem('eclesia_dismissed_update_version');

        // Check if there's a newer version or mismatch
        const isNewer = isNewerVersion(release.version, localVer) || release.version !== localVer;

        if (isNewer) {
          // If mandatory or not yet dismissed on this device
          if (release.isMandatory || dismissedVer !== release.version) {
            setIsUpdateModalOpen(true);
          }
        }
      }
    });

    return () => {
      if (typeof unsubUpdate === 'function') unsubUpdate();
    };
  }, []);

  // Handle URL action parameters (e.g. ?action=update or ?v=2.5.1 or ?updated=true)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const action = urlParams.get('action');
      const v = urlParams.get('v');
      const wasUpdated = urlParams.get('updated');

      if (action === 'update' || v) {
        setIsUpdateModalOpen(true);
      }

      if (wasUpdated === 'true') {
        const newV = v || CURRENT_APP_VERSION;
        localStorage.setItem('eclesia_installed_version', newV);
        setInstalledVersion(newV);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstallModalOpen(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error prompting install:', err);
      }
    }
  };

  // Quick Action Modal Flags
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('eclesia_worshipSongs', JSON.stringify(worshipSongs));
  }, [worshipSongs]);
  useEffect(() => {
    localStorage.setItem('eclesia_worshipMusicians', JSON.stringify(worshipMusicians));
  }, [worshipMusicians]);
  useEffect(() => {
    localStorage.setItem('eclesia_worshipRehearsals', JSON.stringify(worshipRehearsals));
  }, [worshipRehearsals]);
  useEffect(() => {
    localStorage.setItem('eclesia_worshipSchedules', JSON.stringify(worshipSchedules));
  }, [worshipSchedules]);
  useEffect(() => {
    localStorage.setItem('eclesia_worshipCastings', JSON.stringify(worshipCastings));
  }, [worshipCastings]);

  useEffect(() => {
    localStorage.setItem('eclesia_danceChoreos', JSON.stringify(danceChoreographies));
  }, [danceChoreographies]);
  useEffect(() => {
    localStorage.setItem('eclesia_danceDancers', JSON.stringify(danceDancers));
  }, [danceDancers]);
  useEffect(() => {
    localStorage.setItem('eclesia_danceRehearsals', JSON.stringify(danceRehearsals));
  }, [danceRehearsals]);
  useEffect(() => {
    localStorage.setItem('eclesia_danceWardrobe', JSON.stringify(danceWardrobe));
  }, [danceWardrobe]);
  useEffect(() => {
    localStorage.setItem('eclesia_danceCastings', JSON.stringify(danceCastings));
  }, [danceCastings]);

  useEffect(() => {
    localStorage.setItem('eclesia_womenActivities', JSON.stringify(womenActivities));
  }, [womenActivities]);
  useEffect(() => {
    localStorage.setItem('eclesia_womenLeaders', JSON.stringify(womenLeaders));
  }, [womenLeaders]);
  useEffect(() => {
    localStorage.setItem('eclesia_womenCells', JSON.stringify(womenCellGroups));
  }, [womenCellGroups]);
  useEffect(() => {
    localStorage.setItem('eclesia_womenPrayers', JSON.stringify(womenPrayerRequests));
  }, [womenPrayerRequests]);

  useEffect(() => {
    localStorage.setItem('eclesia_usherServers', JSON.stringify(usherServers));
  }, [usherServers]);
  useEffect(() => {
    localStorage.setItem('eclesia_usherRosters', JSON.stringify(usherRosters));
  }, [usherRosters]);

  useEffect(() => {
    localStorage.setItem('eclesia_theaterPlays', JSON.stringify(theaterPlays));
  }, [theaterPlays]);
  useEffect(() => {
    localStorage.setItem('eclesia_theaterActors', JSON.stringify(theaterActors));
  }, [theaterActors]);
  useEffect(() => {
    localStorage.setItem('eclesia_theaterRehearsals', JSON.stringify(theaterRehearsals));
  }, [theaterRehearsals]);
  useEffect(() => {
    localStorage.setItem('eclesia_theaterCastings', JSON.stringify(theaterCastings));
  }, [theaterCastings]);
  useEffect(() => {
    localStorage.setItem('eclesia_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('eclesia_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('eclesia_families', JSON.stringify(families));
  }, [families]);

  useEffect(() => {
    localStorage.setItem('eclesia_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('eclesia_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('eclesia_coopAccounts', JSON.stringify(coopAccounts));
  }, [coopAccounts]);

  useEffect(() => {
    localStorage.setItem('eclesia_coopTransactions', JSON.stringify(coopTransactions));
  }, [coopTransactions]);

  useEffect(() => {
    localStorage.setItem('eclesia_microLoans', JSON.stringify(microLoans));
  }, [microLoans]);

  useEffect(() => {
    localStorage.setItem('eclesia_specialEvents', JSON.stringify(specialEvents));
  }, [specialEvents]);

  useEffect(() => {
    localStorage.setItem('eclesia_eventRegistrations', JSON.stringify(eventRegistrations));
  }, [eventRegistrations]);

  useEffect(() => {
    localStorage.setItem('eclesia_deletedItems', JSON.stringify(deletedItems));
  }, [deletedItems]);

  useEffect(() => {
    localStorage.setItem('eclesia_ministryWorkPlans', JSON.stringify(ministryWorkPlans));
  }, [ministryWorkPlans]);

  // Centralized System Notification Dispatcher
  // Any data change, registration, or movement in the system generates a push notification and writes to Firestore
  const createSystemNotification = useCallback(
    (params: {
      title: string;
      body: string;
      category?: NotificationCategory;
      targetTab?: string;
      priority?: 'normal' | 'high' | 'urgent';
      sender?: string;
    }) => {
      const notif: AppNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: params.title,
        body: params.body,
        message: params.body,
        category: params.category || 'general',
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        read: false,
        sender: params.sender || currentUser?.name || 'Sistema Central',
        authorName: params.sender || currentUser?.name || 'Sistema Central',
        targetTab: params.targetTab,
        priority: params.priority || 'normal',
      };

      setNotifications((prev) => [notif, ...prev]);
      saveFirestoreDoc('notifications', notif.id, notif);

      if (config.pushNotificationsEnabled ?? true) {
        triggerNativePush(notif.title, notif.body || notif.message || '');
      }
    },
    [config.pushNotificationsEnabled, currentUser?.name]
  );

  // Helper to send deleted items to Recycle Bin (supports both (item) and (itemType, originalId, title, subtitle, payload))
  const sendToTrash = (
    itemOrType: DeletedItem['itemType'] | DeletedItem | any,
    originalId?: string,
    title?: string,
    subtitle?: string,
    payload?: any
  ) => {
    let newItem: DeletedItem | null = null;
    if (itemOrType && typeof itemOrType === 'object') {
      newItem = sanitizeDeletedItem(itemOrType, currentUser?.name);
    } else {
      newItem = sanitizeDeletedItem({
        id: `del_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        originalId: originalId || String(Date.now()),
        itemType: itemOrType,
        title: title || 'Elemento',
        subtitle,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.name || 'Usuario',
        payload,
      }, currentUser?.name);
    }

    if (newItem) {
      setDeletedItems((prev) => [newItem!, ...prev.filter((d) => d.id !== newItem!.id)]);
      saveFirestoreDoc('deletedItems', newItem.id, newItem);
      createSystemNotification({
        title: `🗑️ Elemento Enviado a Papelera`,
        body: `${newItem.title} fue movido a la papelera por ${newItem.deletedBy}.`,
        category: 'admin',
        targetTab: 'developer',
      });
    }
  };

  // Handlers for Directory with robust Family synchronization
  const handleAddMember = (newMember: Omit<Member, 'id'>) => {
    const id = `m_${Date.now()}`;
    const memberWithId: Member = { ...newMember, id };
    
    // Auto-resolve familyId if only familyName was given
    if (!memberWithId.familyId && memberWithId.familyName) {
      const matchedFam = families.find(
        (f) => (f.familyName || '').trim().toLowerCase() === (memberWithId.familyName || '').trim().toLowerCase()
      );
      if (matchedFam) {
        memberWithId.familyId = matchedFam.id;
      }
    }

    setMembers((prev) => [...prev, memberWithId]);
    saveFirestoreDoc('members', memberWithId.id, memberWithId);

    // Ensure family contains this memberId
    if (memberWithId.familyId) {
      setFamilies((prevFamilies) =>
        prevFamilies.map((f) => {
          if (f.id === memberWithId.familyId) {
            const currentIds = f.memberIds || [];
            const updatedFam = currentIds.includes(id) ? f : { ...f, memberIds: [...currentIds, id] };
            saveFirestoreDoc('families', updatedFam.id, updatedFam);
            return updatedFam;
          }
          return f;
        })
      );
    }

    createSystemNotification({
      title: `👤 Nuevo Miembro Registrado`,
      body: `${memberWithId.fullName} (${memberWithId.status || 'Miembro Activo'}) ha sido registrado(a) en el Directorio congregacional.`,
      category: 'general',
      targetTab: 'directory',
    });
  };

  const handleUpdateMember = (updated: Member) => {
    let finalUpdated = { ...updated };
    
    // Auto-resolve familyId if only familyName was given
    if (!finalUpdated.familyId && finalUpdated.familyName) {
      const matchedFam = families.find(
        (f) => (f.familyName || '').trim().toLowerCase() === (finalUpdated.familyName || '').trim().toLowerCase()
      );
      if (matchedFam) {
        finalUpdated.familyId = matchedFam.id;
      }
    }

    setMembers((prev) => prev.map((m) => (m.id === finalUpdated.id ? finalUpdated : m)));
    saveFirestoreDoc('members', finalUpdated.id, finalUpdated);

    createSystemNotification({
      title: `📝 Ficha de Miembro Actualizada`,
      body: `Se actualizaron los datos y expediente de ${finalUpdated.fullName}.`,
      category: 'general',
      targetTab: 'directory',
    });

    // Synchronize memberIds across all families
    setFamilies((prevFamilies) =>
      prevFamilies.map((f) => {
        const currentIds = f.memberIds || [];
        if (finalUpdated.familyId && f.id === finalUpdated.familyId) {
          const updatedFam = currentIds.includes(finalUpdated.id)
            ? f
            : { ...f, memberIds: [...currentIds, finalUpdated.id] };
          saveFirestoreDoc('families', updatedFam.id, updatedFam);
          return updatedFam;
        } else {
          // If member is no longer in this family, remove them
          if (currentIds.includes(finalUpdated.id)) {
            const updatedFam = { ...f, memberIds: currentIds.filter((mid) => mid !== finalUpdated.id) };
            saveFirestoreDoc('families', updatedFam.id, updatedFam);
            return updatedFam;
          }
          return f;
        }
      })
    );
  };

  const handleDeleteMember = (id: string) => {
    const memberToDelete = members.find((m) => m.id === id);
    if (memberToDelete) {
      sendToTrash('member', memberToDelete.id, memberToDelete.fullName, memberToDelete.role, memberToDelete);
    }
    setMembers((prev) => prev.filter((m) => m.id !== id));
    deleteFirestoreDoc('members', id);

    // Remove from families
    setFamilies((prevFamilies) =>
      prevFamilies.map((f) => {
        const updatedFam = {
          ...f,
          memberIds: (f.memberIds || []).filter((mid) => mid !== id),
        };
        saveFirestoreDoc('families', updatedFam.id, updatedFam);
        return updatedFam;
      })
    );
  };

  const handleAddFamily = (newFamily: Omit<Family, 'id'>) => {
    const id = `f_${Date.now()}`;
    const createdFamily: Family = { ...newFamily, id, memberIds: newFamily.memberIds || [] };
    setFamilies((prev) => [...prev, createdFamily]);
    saveFirestoreDoc('families', createdFamily.id, createdFamily);

    createSystemNotification({
      title: `🏡 Nueva Familia Registrada`,
      body: `Familia ${createdFamily.familyName} agregada al directorio congregacional.`,
      category: 'general',
      targetTab: 'directory',
    });
  };

  const handleUpdateFamily = (updated: Family) => {
    setFamilies((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    saveFirestoreDoc('families', updated.id, updated);

    createSystemNotification({
      title: `🏡 Datos Familiares Actualizados`,
      body: `Se actualizaron los datos de la Familia ${updated.familyName}.`,
      category: 'general',
      targetTab: 'directory',
    });

    // If family name was updated, synchronize familyName on all associated members
    setMembers((prevMembers) =>
      prevMembers.map((m) => {
        if (m.familyId === updated.id || (updated.memberIds && updated.memberIds.includes(m.id))) {
          const updatedMember = {
            ...m,
            familyId: updated.id,
            familyName: updated.familyName,
          };
          saveFirestoreDoc('members', updatedMember.id, updatedMember);
          return updatedMember;
        }
        return m;
      })
    );
  };

  const handleDeleteFamily = (id: string) => {
    const famToDelete = families.find((f) => f.id === id);
    if (famToDelete) {
      sendToTrash('family', famToDelete.id, famToDelete.familyName, famToDelete.address, famToDelete);
    }
    setFamilies((prev) => prev.filter((f) => f.id !== id));
    deleteFirestoreDoc('families', id);

    // Desvincular automáticamente los miembros que pertenecían a esta familia
    setMembers((prevMembers) =>
      prevMembers.map((m) => {
        if (m.familyId === id) {
          const updatedM = { ...m, familyId: undefined, familyName: undefined };
          saveFirestoreDoc('members', updatedM.id, updatedM);
          return updatedM;
        }
        return m;
      })
    );
  };

  // Handlers for Events
  const handleAddEvent = (newEvent: Omit<ChurchEvent, 'id'>) => {
    const id = `e_${Date.now()}`;
    const eventWithId: ChurchEvent = { ...newEvent, id };
    setEvents([...events, eventWithId]);
    saveFirestoreDoc('events', eventWithId.id, eventWithId);

    createSystemNotification({
      title: `📅 Nuevo Evento: ${newEvent.title}`,
      body: `${newEvent.date} a las ${newEvent.time || '19:00'} en ${newEvent.location}. ¡Te esperamos!`,
      category: 'events',
      targetTab: 'events',
    });
  };

  const handleUpdateEvent = (updated: ChurchEvent) => {
    setEvents(events.map((e) => (e.id === updated.id ? updated : e)));
    saveFirestoreDoc('events', updated.id, updated);

    createSystemNotification({
      title: `📅 Evento Actualizado: ${updated.title}`,
      body: `Modificación en agenda para el ${updated.date} (${updated.location}).`,
      category: 'events',
      targetTab: 'events',
    });
  };

  const handleDeleteEvent = (id: string) => {
    const evToDelete = events.find((e) => e.id === id);
    if (evToDelete) {
      sendToTrash('event', evToDelete.id, evToDelete.title, `${evToDelete.date} • ${evToDelete.type}`, evToDelete);
    }
    setEvents(events.filter((e) => e.id !== id));
    deleteFirestoreDoc('events', id);
  };

  // Handlers for Finances
  const handleAddTransaction = (newTx: Omit<FinancialTransaction, 'id'>) => {
    const id = `t_${Date.now()}`;
    const txWithId: FinancialTransaction = { ...newTx, id };
    setTransactions([txWithId, ...transactions]);
    saveFirestoreDoc('transactions', txWithId.id, txWithId);

    const isIncome = newTx.type !== 'Egreso/Gasto';
    createSystemNotification({
      title: isIncome ? `📥 Nuevo Ingreso (${newTx.type})` : `📤 Nuevo Egreso / Salida Registrada`,
      body: `${config.currencySymbol}${newTx.amount.toLocaleString()} - ${newTx.category}${newTx.memberName ? ` (${newTx.memberName})` : ''}: ${newTx.description}`,
      category: 'finances',
      targetTab: 'finances',
      priority: isIncome ? 'normal' : 'high',
    });
  };

  const handleDeleteTransaction = (id: string) => {
    const txToDelete = transactions.find((t) => t.id === id);
    if (txToDelete) {
      sendToTrash(
        'financialTransaction',
        txToDelete.id,
        `${txToDelete.type}: ${txToDelete.category}`,
        `$${txToDelete.amount.toLocaleString()} • ${txToDelete.date}`,
        txToDelete
      );
    }
    setTransactions(transactions.filter((t) => t.id !== id));
    deleteFirestoreDoc('transactions', id);
  };

  // Handlers for Minicooperative
  const handleAddCoopAccount = (acc: Omit<CoopAccount, 'id'>) => {
    const id = `ca_${Date.now()}`;
    const newAcc: CoopAccount = { ...acc, id };
    setCoopAccounts([...coopAccounts, newAcc]);
    saveFirestoreDoc('coopAccounts', newAcc.id, newAcc);

    createSystemNotification({
      title: `🏦 Nueva Cuenta de Ahorro Minicooperativa`,
      body: `Apertura de cuenta #${newAcc.accountNumber} para ${newAcc.memberName} con saldo inicial ${config.currencySymbol}${newAcc.currentBalance.toLocaleString()}.`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleDeleteCoopAccount = (accountId: string) => {
    const accToDelete = coopAccounts.find((a) => a.id === accountId);
    if (accToDelete) {
      sendToTrash(
        'coopAccount',
        accToDelete.id,
        `Cuenta ${accToDelete.accountNumber}`,
        `${accToDelete.memberName} • Saldo: $${accToDelete.currentBalance.toLocaleString()}`,
        accToDelete
      );
    }
    setCoopAccounts(coopAccounts.filter((a) => a.id !== accountId));
    deleteFirestoreDoc('coopAccounts', accountId);
  };

  const handleAddCoopTransaction = (tx: Omit<CoopTransaction, 'id'>) => {
    const id = `ct_${Date.now()}`;
    const newTx: CoopTransaction = { ...tx, id };
    setCoopTransactions([newTx, ...coopTransactions]);
    saveFirestoreDoc('coopTransactions', newTx.id, newTx);

    // Update account balance
    setCoopAccounts(
      coopAccounts.map((a) => {
        if (a.id === tx.accountId) {
          const isDeposit = tx.type === 'Depósito' || tx.type === 'Abono Crédito';
          const newBalance = isDeposit ? a.currentBalance + tx.amount : a.currentBalance - tx.amount;
          const updatedAcc = {
            ...a,
            currentBalance: newBalance,
            totalDeposited: isDeposit ? a.totalDeposited + tx.amount : a.totalDeposited,
            totalWithdrawn: !isDeposit ? a.totalWithdrawn + tx.amount : a.totalWithdrawn,
          };
          saveFirestoreDoc('coopAccounts', updatedAcc.id, updatedAcc);
          return updatedAcc;
        }
        return a;
      })
    );

    createSystemNotification({
      title: `💰 Transacción Minicooperativa`,
      body: `${tx.type} de ${config.currencySymbol}${tx.amount.toFixed(2)} registrado para ${tx.memberName}.`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleDeleteCoopTransaction = (txId: string) => {
    const txToDelete = coopTransactions.find((t) => t.id === txId);
    if (txToDelete) {
      sendToTrash(
        'coopTransaction' as any,
        txToDelete.id,
        `Movimiento: ${txToDelete.type}`,
        `${txToDelete.memberName} • ${config.currencySymbol}${txToDelete.amount.toFixed(2)}`,
        txToDelete
      );
    }
    setCoopTransactions(coopTransactions.filter((t) => t.id !== txId));
    deleteFirestoreDoc('coopTransactions', txId);
  };

  const handleRequestLoan = (loan: Omit<MicroLoan, 'id'>) => {
    const id = `ml_${Date.now()}`;
    const newLoan: MicroLoan = { ...loan, id };
    setMicroLoans([...microLoans, newLoan]);
    saveFirestoreDoc('microLoans', newLoan.id, newLoan);

    createSystemNotification({
      title: `📑 Solicitud de Microcrédito`,
      body: `${newLoan.memberName} solicitó crédito por ${config.currencySymbol}${newLoan.amount.toLocaleString()} (${newLoan.purpose}).`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleDeleteLoan = (loanId: string) => {
    const loanToDelete = microLoans.find((l) => l.id === loanId);
    if (loanToDelete) {
      sendToTrash(
        'microLoan',
        loanToDelete.id,
        `Préstamo: ${loanToDelete.memberName}`,
        `$${loanToDelete.amount.toLocaleString()} • ${loanToDelete.purpose}`,
        loanToDelete
      );
    }
    setMicroLoans(microLoans.filter((l) => l.id !== loanId));
    deleteFirestoreDoc('microLoans', loanId);
  };

  const handleUpdateLoanStatus = (loanId: string, status: MicroLoan['status']) => {
    setMicroLoans(
      microLoans.map((l) => {
        if (l.id === loanId) {
          const updated = { ...l, status, approvedDate: new Date().toISOString().split('T')[0] };
          saveFirestoreDoc('microLoans', updated.id, updated);
          createSystemNotification({
            title: `⚖️ Estado de Crédito Actualizado`,
            body: `Préstamo de ${l.memberName} marcado como "${status}".`,
            category: 'coop',
            targetTab: 'coop',
          });
          return updated;
        }
        return l;
      })
    );
  };

  const handleMakeLoanPayment = (loanId: string, amount: number) => {
    setMicroLoans(
      microLoans.map((l) => {
        if (l.id === loanId) {
          const newRemaining = Math.max(0, l.remainingAmount - amount);
          const newPayments = [
            ...l.payments,
            {
              id: `p_${Date.now()}`,
              date: new Date().toISOString().split('T')[0],
              amount,
              receiptNumber: `REC-LOAN-${Math.floor(100 + Math.random() * 900)}`,
            },
          ];
          const updatedLoan = {
            ...l,
            remainingAmount: newRemaining,
            status: newRemaining === 0 ? ('Pagado' as const) : l.status,
            payments: newPayments,
          };
          saveFirestoreDoc('microLoans', updatedLoan.id, updatedLoan);
          createSystemNotification({
            title: `💵 Abono a Préstamo Registrado`,
            body: `Se recibió abono de ${config.currencySymbol}${amount.toLocaleString()} de ${l.memberName}. Saldo rest: ${config.currencySymbol}${newRemaining.toLocaleString()}.`,
            category: 'coop',
            targetTab: 'coop',
          });
          return updatedLoan;
        }
        return l;
      })
    );
  };

  const handleAddSpecialEvent = (newEvent: Omit<SpecialCoopEvent, 'id'>) => {
    const id = `se_${Date.now()}`;
    const newSe: SpecialCoopEvent = { ...newEvent, id };
    setSpecialEvents([...specialEvents, newSe]);
    saveFirestoreDoc('specialEvents', newSe.id, newSe);

    createSystemNotification({
      title: `⛺ Nuevo Evento Especial / Campamento`,
      body: `${newSe.title} programado para el ${newSe.date} en ${newSe.location}.`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleUpdateSpecialEvent = (updatedEvent: SpecialCoopEvent) => {
    setSpecialEvents((prev) =>
      prev.map((ev) => (ev.id === updatedEvent.id ? updatedEvent : ev))
    );
    saveFirestoreDoc('specialEvents', updatedEvent.id, updatedEvent);

    createSystemNotification({
      title: `⛺ Evento Especial Actualizado`,
      body: `Cambios guardados para "${updatedEvent.title}".`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleDeleteSpecialEvent = (eventId: string) => {
    const seToDelete = specialEvents.find((e) => e.id === eventId);
    if (seToDelete) {
      sendToTrash(
        'specialCoopEvent',
        seToDelete.id,
        seToDelete.title,
        `${seToDelete.date} • ${seToDelete.location}`,
        seToDelete
      );
    }
    setSpecialEvents(specialEvents.filter((e) => e.id !== eventId));
    deleteFirestoreDoc('specialEvents', eventId);
  };

  const handleRegisterForEvent = (newReg: Omit<EventRegistration, 'id'>) => {
    const id = `reg_${Date.now()}`;
    const item: EventRegistration = { ...newReg, id };
    setEventRegistrations([item, ...eventRegistrations]);
    saveFirestoreDoc('eventRegistrations', item.id, item);

    createSystemNotification({
      title: `⛺ Inscripción Confirmada: ${newReg.memberName}`,
      body: `Inscripción para evento con ${newReg.adultsCount} adultos y ${newReg.childrenCount} niños. Total: ${config.currencySymbol}${newReg.totalAmount.toFixed(2)}.`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleUpdateEventRegistration = (updatedReg: EventRegistration) => {
    setEventRegistrations((prev) =>
      prev.map((r) => (r.id === updatedReg.id ? updatedReg : r))
    );
    saveFirestoreDoc('eventRegistrations', updatedReg.id, updatedReg);

    createSystemNotification({
      title: `⛺ Inscripción Actualizada`,
      body: `Estado modificado a "${updatedReg.status}" para ${updatedReg.memberName}.`,
      category: 'coop',
      targetTab: 'coop',
    });
  };

  const handleDeleteEventRegistration = (regId: string) => {
    const regToDelete = eventRegistrations.find((r) => r.id === regId);
    if (regToDelete) {
      sendToTrash(
        'eventRegistration',
        regToDelete.id,
        `Inscripción: ${regToDelete.memberName}`,
        `Total: ${config.currencySymbol}${regToDelete.totalAmount} • ${regToDelete.status}`,
        regToDelete
      );
    }
    setEventRegistrations(eventRegistrations.filter((r) => r.id !== regId));
    deleteFirestoreDoc('eventRegistrations', regId);
  };

  // Notification management handlers with Firebase Firestore synchronization
  const handleMarkNotifAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id) {
          const updated = { ...n, read: true };
          saveFirestoreDoc('notifications', id, updated);
          return updated;
        }
        return n;
      })
    );
  };

  const handleMarkAllNotifsAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        const updated = { ...n, read: true };
        saveFirestoreDoc('notifications', n.id, updated);
        return updated;
      })
    );
  };

  const handleDeleteNotif = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    deleteFirestoreDoc('notifications', id);
  };

  const handleClearAllNotifs = () => {
    notifications.forEach((n) => {
      deleteFirestoreDoc('notifications', n.id);
    });
    setNotifications([]);
  };

  const handleSendCustomPush = (newNotif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const notif: AppNotification = {
      ...newNotif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      date: newNotif.date || new Date().toISOString().split('T')[0],
      read: false,
    };
    setNotifications((prev) => [notif, ...prev]);
    saveFirestoreDoc('notifications', notif.id, notif);

    if (config.pushNotificationsEnabled ?? true) {
      triggerNativePush(notif.title, notif.body || notif.message || '');
    }
  };

  // ----------------------------------------------------
  // Ministry Handlers
  // ----------------------------------------------------
  // 1. Alabanza
  const handleAddWorshipSong = (song: Omit<WorshipSong, 'id'>) => {
    const id = `ws_${Date.now()}`;
    const newSong: WorshipSong = { ...song, id };
    setWorshipSongs((prev) => [{ ...song, id }, ...prev]);
    saveFirestoreDoc('worshipSongs', newSong.id, newSong);
  };
  const handleUpdateWorshipSong = (song: WorshipSong) => {
    setWorshipSongs((prev) => prev.map((s) => (s.id === song.id ? song : s)));
    saveFirestoreDoc('worshipSongs', song.id, song);
  };
  const handleDeleteWorshipSong = (id: string) => {
    const item = worshipSongs.find((s) => s.id === id);
    if (item) {
      sendToTrash('worshipSong', item.id, item.title, `${item.artist} • Tono: ${item.tone}`, item);
    }
    setWorshipSongs((prev) => prev.filter((s) => s.id !== id));
    deleteFirestoreDoc('worshipSongs', id);
  };
  const handleAddWorshipMusician = (musician: Omit<WorshipMusician, 'id'>) => {
    const id = `wm_${Date.now()}`;
    const newMusician: WorshipMusician = { ...musician, id };
    setWorshipMusicians((prev) => [...prev, newMusician]);
    saveFirestoreDoc('worshipMusicians', newMusician.id, newMusician);
  };
  const handleUpdateWorshipMusician = (musician: WorshipMusician) => {
    setWorshipMusicians((prev) => prev.map((m) => (m.id === musician.id ? musician : m)));
    saveFirestoreDoc('worshipMusicians', musician.id, musician);
  };
  const handleDeleteWorshipMusician = (id: string) => {
    const item = worshipMusicians.find((m) => m.id === id);
    if (item) {
      sendToTrash('worshipMusician', item.id, item.name, `Instrumento: ${item.instrument || 'Voz'} • ${item.status}`, item);
    }
    setWorshipMusicians((prev) => prev.filter((m) => m.id !== id));
    deleteFirestoreDoc('worshipMusicians', id);
  };
  const handleAddWorshipRehearsal = (rehearsal: Omit<WorshipRehearsal, 'id'>) => {
    const id = `wr_${Date.now()}`;
    const newReh: WorshipRehearsal = { ...rehearsal, id };
    setWorshipRehearsals((prev) => [newReh, ...prev]);
    saveFirestoreDoc('worshipRehearsals', newReh.id, newReh);
  };
  const handleUpdateWorshipRehearsal = (rehearsal: WorshipRehearsal) => {
    setWorshipRehearsals((prev) => prev.map((r) => (r.id === rehearsal.id ? rehearsal : r)));
    saveFirestoreDoc('worshipRehearsals', rehearsal.id, rehearsal);
  };
  const handleDeleteWorshipRehearsal = (id: string) => {
    const item = worshipRehearsals.find((r) => r.id === id);
    if (item) {
      sendToTrash('worshipRehearsal', item.id, `Ensayo: ${item.service}`, `${item.date} • ${item.time}`, item);
    }
    setWorshipRehearsals((prev) => prev.filter((r) => r.id !== id));
    deleteFirestoreDoc('worshipRehearsals', id);
  };
  const handleAddWorshipSchedule = (schedule: Omit<WorshipServiceSchedule, 'id'>) => {
    const id = `wss_${Date.now()}`;
    const newSch: WorshipServiceSchedule = { ...schedule, id };
    setWorshipSchedules((prev) => [newSch, ...prev]);
    saveFirestoreDoc('worshipSchedules', newSch.id, newSch);
  };
  const handleUpdateWorshipSchedule = (schedule: WorshipServiceSchedule) => {
    setWorshipSchedules((prev) => prev.map((s) => (s.id === schedule.id ? schedule : s)));
    saveFirestoreDoc('worshipSchedules', schedule.id, schedule);
  };
  const handleDeleteWorshipSchedule = (id: string) => {
    const item = worshipSchedules.find((s) => s.id === id);
    if (item) {
      sendToTrash('worshipSchedule', item.id, `Culto: ${item.serviceName}`, `${item.date} • Director: ${item.worshipLeader}`, item);
    }
    setWorshipSchedules((prev) => prev.filter((s) => s.id !== id));
    deleteFirestoreDoc('worshipSchedules', id);
  };
  const handleAddWorshipCasting = (casting: Omit<MinistryCastingCall, 'id'>) => {
    const id = `wc_${Date.now()}`;
    const newCasting: MinistryCastingCall = { ...casting, id, ministry: 'worship' };
    setWorshipCastings((prev) => [newCasting, ...prev]);
    saveFirestoreDoc('worshipCastings', newCasting.id, newCasting);
  };
  const handleUpdateWorshipCasting = (casting: MinistryCastingCall) => {
    setWorshipCastings((prev) => prev.map((c) => (c.id === casting.id ? casting : c)));
    saveFirestoreDoc('worshipCastings', casting.id, casting);
  };
  const handleDeleteWorshipCasting = (id: string) => {
    const item = worshipCastings.find((c) => c.id === id);
    if (item) {
      sendToTrash('worshipCasting', item.id, item.title, `${item.playTitle || 'Audición de Alabanza'} • ${item.status}`, item);
    }
    setWorshipCastings((prev) => prev.filter((c) => c.id !== id));
    deleteFirestoreDoc('worshipCastings', id);
  };

  // 2. Danza
  const handleAddDanceChoreography = (choreo: Omit<DanceChoreography, 'id'>) => {
    const id = `dc_${Date.now()}`;
    const newChoreo: DanceChoreography = { ...choreo, id };
    setDanceChoreographies((prev) => [newChoreo, ...prev]);
    saveFirestoreDoc('danceChoreos', newChoreo.id, newChoreo);
  };
  const handleUpdateDanceChoreography = (choreo: DanceChoreography) => {
    setDanceChoreographies((prev) => prev.map((c) => (c.id === choreo.id ? choreo : c)));
    saveFirestoreDoc('danceChoreos', choreo.id, choreo);
  };
  const handleDeleteDanceChoreography = (id: string) => {
    const item = danceChoreographies.find((c) => c.id === id);
    if (item) {
      sendToTrash('danceChoreography', item.id, item.title, `Canción: ${item.songTitle} • ${item.difficulty}`, item);
    }
    setDanceChoreographies((prev) => prev.filter((c) => c.id !== id));
    deleteFirestoreDoc('danceChoreos', id);
  };
  const handleAddDanceDancer = (dancer: Omit<DanceDancer, 'id'>) => {
    const id = `dd_${Date.now()}`;
    const newDancer: DanceDancer = { ...dancer, id };
    setDanceDancers((prev) => [...prev, newDancer]);
    saveFirestoreDoc('danceDancers', newDancer.id, newDancer);
  };
  const handleUpdateDanceDancer = (dancer: DanceDancer) => {
    setDanceDancers((prev) => prev.map((d) => (d.id === dancer.id ? dancer : d)));
    saveFirestoreDoc('danceDancers', dancer.id, dancer);
  };
  const handleDeleteDanceDancer = (id: string) => {
    const item = danceDancers.find((d) => d.id === id);
    if (item) {
      sendToTrash('danceDancer', item.id, item.name, `Rol: ${item.level || 'Danzora'} • ${item.status}`, item);
    }
    setDanceDancers((prev) => prev.filter((d) => d.id !== id));
    deleteFirestoreDoc('danceDancers', id);
  };
  const handleAddDanceRehearsal = (rehearsal: Omit<DanceRehearsal, 'id'>) => {
    const id = `dr_${Date.now()}`;
    const newReh: DanceRehearsal = { ...rehearsal, id };
    setDanceRehearsals((prev) => [newReh, ...prev]);
    saveFirestoreDoc('danceRehearsals', newReh.id, newReh);
  };
  const handleUpdateDanceRehearsal = (rehearsal: DanceRehearsal) => {
    setDanceRehearsals((prev) => prev.map((r) => (r.id === rehearsal.id ? rehearsal : r)));
    saveFirestoreDoc('danceRehearsals', rehearsal.id, rehearsal);
  };
  const handleDeleteDanceRehearsal = (id: string) => {
    const item = danceRehearsals.find((r) => r.id === id);
    if (item) {
      sendToTrash('danceRehearsal', item.id, `Ensayo: ${item.location}`, `${item.date} • ${item.time}`, item);
    }
    setDanceRehearsals((prev) => prev.filter((r) => r.id !== id));
    deleteFirestoreDoc('danceRehearsals', id);
  };
  const handleAddDanceWardrobe = (item: Omit<DanceWardrobeItem, 'id'>) => {
    const id = `dw_${Date.now()}`;
    const newWard: DanceWardrobeItem = { ...item, id };
    setDanceWardrobe((prev) => [...prev, newWard]);
    saveFirestoreDoc('danceWardrobe', newWard.id, newWard);
  };
  const handleUpdateDanceWardrobe = (item: DanceWardrobeItem) => {
    setDanceWardrobe((prev) => prev.map((w) => (w.id === item.id ? item : w)));
    saveFirestoreDoc('danceWardrobe', item.id, item);
  };
  const handleDeleteDanceWardrobe = (id: string) => {
    const item = danceWardrobe.find((w) => w.id === id);
    if (item) {
      sendToTrash('danceWardrobe', item.id, `Vestuario: ${item.name}`, `Color: ${item.color} • ${item.quantity} unidades`, item);
    }
    setDanceWardrobe((prev) => prev.filter((w) => w.id !== id));
    deleteFirestoreDoc('danceWardrobe', id);
  };
  const handleAddDanceCasting = (casting: Omit<MinistryCastingCall, 'id'>) => {
    const id = `dc_cast_${Date.now()}`;
    const newCasting: MinistryCastingCall = { ...casting, id, ministry: 'dance' };
    setDanceCastings((prev) => [newCasting, ...prev]);
    saveFirestoreDoc('danceCastings', newCasting.id, newCasting);
  };
  const handleUpdateDanceCasting = (casting: MinistryCastingCall) => {
    setDanceCastings((prev) => prev.map((c) => (c.id === casting.id ? casting : c)));
    saveFirestoreDoc('danceCastings', casting.id, casting);
  };
  const handleDeleteDanceCasting = (id: string) => {
    const item = danceCastings.find((c) => c.id === id);
    if (item) {
      sendToTrash('danceCasting', item.id, item.title, `${item.playTitle || 'Audición de Danza'} • ${item.status}`, item);
    }
    setDanceCastings((prev) => prev.filter((c) => c.id !== id));
    deleteFirestoreDoc('danceCastings', id);
  };

  // 3. Damas
  const handleAddWomenActivity = (act: Omit<WomenActivity, 'id'>) => {
    const id = `wa_${Date.now()}`;
    const newAct: WomenActivity = { ...act, id };
    setWomenActivities((prev) => [newAct, ...prev]);
    saveFirestoreDoc('womenActivities', newAct.id, newAct);
  };
  const handleUpdateWomenActivity = (act: WomenActivity) => {
    setWomenActivities((prev) => prev.map((a) => (a.id === act.id ? act : a)));
    saveFirestoreDoc('womenActivities', act.id, act);
  };
  const handleDeleteWomenActivity = (id: string) => {
    const item = womenActivities.find((a) => a.id === id);
    if (item) {
      sendToTrash('womenActivity', item.id, item.title, `${item.date} • ${item.type}`, item);
    }
    setWomenActivities((prev) => prev.filter((a) => a.id !== id));
    deleteFirestoreDoc('womenActivities', id);
  };
  const handleAddWomenLeader = (leader: Omit<WomenLeader, 'id'>) => {
    const id = `wl_${Date.now()}`;
    const newLeader: WomenLeader = { ...leader, id };
    setWomenLeaders((prev) => [...prev, newLeader]);
    saveFirestoreDoc('womenLeaders', newLeader.id, newLeader);
  };
  const handleUpdateWomenLeader = (leader: WomenLeader) => {
    setWomenLeaders((prev) => prev.map((l) => (l.id === leader.id ? leader : l)));
    saveFirestoreDoc('womenLeaders', leader.id, leader);
  };
  const handleDeleteWomenLeader = (id: string) => {
    const item = womenLeaders.find((l) => l.id === id);
    if (item) {
      sendToTrash('womenLeader', item.id, item.name, `Cargo: ${item.role} • ${item.phone}`, item);
    }
    setWomenLeaders((prev) => prev.filter((l) => l.id !== id));
    deleteFirestoreDoc('womenLeaders', id);
  };
  const handleAddWomenCell = (cell: Omit<WomenCellGroup, 'id'>) => {
    const id = `wc_${Date.now()}`;
    const newCell: WomenCellGroup = { ...cell, id };
    setWomenCellGroups((prev) => [...prev, newCell]);
    saveFirestoreDoc('womenCells', newCell.id, newCell);
  };
  const handleUpdateWomenCell = (cell: WomenCellGroup) => {
    setWomenCellGroups((prev) => prev.map((c) => (c.id === cell.id ? cell : c)));
    saveFirestoreDoc('womenCells', cell.id, cell);
  };
  const handleDeleteWomenCell = (id: string) => {
    const item = womenCellGroups.find((c) => c.id === id);
    if (item) {
      sendToTrash('womenCellGroup', item.id, `Célula: ${item.name}`, `Líder: ${item.leader} • ${item.meetingDay}`, item);
    }
    setWomenCellGroups((prev) => prev.filter((c) => c.id !== id));
    deleteFirestoreDoc('womenCells', id);
  };
  const handleAddWomenPrayer = (req: Omit<WomenPrayerRequest, 'id'>) => {
    const id = `wpr_${Date.now()}`;
    const newReq: WomenPrayerRequest = { ...req, id };
    setWomenPrayerRequests((prev) => [newReq, ...prev]);
    saveFirestoreDoc('womenPrayers', newReq.id, newReq);
  };
  const handleUpdateWomenPrayer = (req: WomenPrayerRequest) => {
    setWomenPrayerRequests((prev) => prev.map((r) => (r.id === req.id ? req : r)));
    saveFirestoreDoc('womenPrayers', req.id, req);
  };
  const handleToggleWomenPrayerAnswered = (id: string) => {
    setWomenPrayerRequests((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, answered: !r.answered };
          saveFirestoreDoc('womenPrayers', updated.id, updated);
          return updated;
        }
        return r;
      })
    );
  };
  const handleDeleteWomenPrayer = (id: string) => {
    const item = womenPrayerRequests.find((r) => r.id === id);
    if (item) {
      sendToTrash('womenPrayerRequest', item.id, `Petición: ${item.requesterName}`, `${item.category} • ${item.request}`, item);
    }
    setWomenPrayerRequests((prev) => prev.filter((r) => r.id !== id));
    deleteFirestoreDoc('womenPrayers', id);
  };

  // 4. Servidores
  const handleAddUsherServer = (srv: Omit<UsherServer, 'id'>) => {
    const id = `us_${Date.now()}`;
    const newSrv: UsherServer = { ...srv, id };
    setUsherServers((prev) => [...prev, newSrv]);
    saveFirestoreDoc('usherServers', newSrv.id, newSrv);
  };
  const handleUpdateUsherServer = (srv: UsherServer) => {
    setUsherServers((prev) => prev.map((s) => (s.id === srv.id ? srv : s)));
    saveFirestoreDoc('usherServers', srv.id, srv);
  };
  const handleDeleteUsherServer = (id: string) => {
    const item = usherServers.find((s) => s.id === id);
    if (item) {
      sendToTrash('usherServer', item.id, item.name, `Rol: ${item.role} • ${item.phone}`, item);
    }
    setUsherServers((prev) => prev.filter((s) => s.id !== id));
    deleteFirestoreDoc('usherServers', id);
  };
  const handleAddUsherRoster = (roster: Omit<UsherRoster, 'id'>) => {
    const id = `ur_${Date.now()}`;
    const newRoster: UsherRoster = { ...roster, id };
    setUsherRosters((prev) => [newRoster, ...prev]);
    saveFirestoreDoc('usherRosters', newRoster.id, newRoster);
  };
  const handleUpdateUsherRoster = (roster: UsherRoster) => {
    setUsherRosters((prev) => prev.map((r) => (r.id === roster.id ? roster : r)));
    saveFirestoreDoc('usherRosters', roster.id, roster);
  };
  const handleDeleteUsherRoster = (id: string) => {
    const item = usherRosters.find((r) => r.id === id);
    if (item) {
      sendToTrash('usherDuty', item.id, `Turno: ${item.serviceType}`, `${item.serviceDate} • ${item.leaderInCharge}`, item);
    }
    setUsherRosters((prev) => prev.filter((r) => r.id !== id));
    deleteFirestoreDoc('usherRosters', id);
  };

  // 5. Teatro
  const handleAddTheaterPlay = (play: Omit<TheaterPlay, 'id'>) => {
    const id = `tp_${Date.now()}`;
    const newPlay: TheaterPlay = { ...play, id };
    setTheaterPlays((prev) => [newPlay, ...prev]);
    saveFirestoreDoc('theaterPlays', newPlay.id, newPlay);
  };
  const handleUpdateTheaterPlay = (play: TheaterPlay) => {
    setTheaterPlays((prev) => prev.map((p) => (p.id === play.id ? play : p)));
    saveFirestoreDoc('theaterPlays', play.id, play);
  };
  const handleDeleteTheaterPlay = (id: string) => {
    const item = theaterPlays.find((p) => p.id === id);
    if (item) {
      sendToTrash('theaterPlay', item.id, item.title, `${item.genre || item.theme} • ${item.status}`, item);
    }
    setTheaterPlays((prev) => prev.filter((p) => p.id !== id));
    deleteFirestoreDoc('theaterPlays', id);
  };
  const handleAddTheaterActor = (actor: Omit<TheaterActor, 'id'>) => {
    const id = `ta_${Date.now()}`;
    const newActor: TheaterActor = { ...actor, id };
    setTheaterActors((prev) => [...prev, newActor]);
    saveFirestoreDoc('theaterActors', newActor.id, newActor);
  };
  const handleUpdateTheaterActor = (actor: TheaterActor) => {
    setTheaterActors((prev) => prev.map((a) => (a.id === actor.id ? actor : a)));
    saveFirestoreDoc('theaterActors', actor.id, actor);
  };
  const handleDeleteTheaterActor = (id: string) => {
    const item = theaterActors.find((a) => a.id === id);
    if (item) {
      sendToTrash('theaterActor', item.id, item.name, `Personaje / Rol: ${item.characterName || 'Elenco'} • ${item.status}`, item);
    }
    setTheaterActors((prev) => prev.filter((a) => a.id !== id));
    deleteFirestoreDoc('theaterActors', id);
  };
  const handleAddTheaterRehearsal = (reh: Omit<TheaterRehearsal, 'id'>) => {
    const id = `tr_${Date.now()}`;
    const newReh: TheaterRehearsal = { ...reh, id };
    setTheaterRehearsals((prev) => [newReh, ...prev]);
    saveFirestoreDoc('theaterRehearsals', newReh.id, newReh);
  };
  const handleUpdateTheaterRehearsal = (reh: TheaterRehearsal) => {
    setTheaterRehearsals((prev) => prev.map((r) => (r.id === reh.id ? reh : r)));
    saveFirestoreDoc('theaterRehearsals', reh.id, reh);
  };
  const handleDeleteTheaterRehearsal = (id: string) => {
    const item = theaterRehearsals.find((r) => r.id === id);
    if (item) {
      sendToTrash('theaterRehearsal', item.id, `Ensayo: ${item.playTitle}`, `${item.date} • ${item.time}`, item);
    }
    setTheaterRehearsals((prev) => prev.filter((r) => r.id !== id));
    deleteFirestoreDoc('theaterRehearsals', id);
  };
  const handleAddTheaterCasting = (casting: Omit<TheaterCastingCall, 'id'>) => {
    const id = `tc_${Date.now()}`;
    const newCasting: TheaterCastingCall = { ...casting, id };
    setTheaterCastings((prev) => [newCasting, ...prev]);
    saveFirestoreDoc('theaterCastings', newCasting.id, newCasting);
  };
  const handleUpdateTheaterCasting = (casting: TheaterCastingCall) => {
    setTheaterCastings((prev) => prev.map((c) => (c.id === casting.id ? casting : c)));
    saveFirestoreDoc('theaterCastings', casting.id, casting);
  };
  const handleDeleteTheaterCasting = (id: string) => {
    const item = theaterCastings.find((c) => c.id === id);
    if (item) {
      sendToTrash('theaterCasting', item.id, item.title, `${item.playTitle || 'Casting'} • ${item.status}`, item);
    }
    setTheaterCastings((prev) => prev.filter((c) => c.id !== id));
    deleteFirestoreDoc('theaterCastings', id);
  };

  // 6. Planificación de Trabajo Ministerial
  const handleAddMinistryWorkPlan = (plan: Omit<MinistryWorkPlan, 'id'>) => {
    const id = `plan_${Date.now()}`;
    const newPlan: MinistryWorkPlan = {
      ...plan,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMinistryWorkPlans((prev) => [newPlan, ...prev]);
    saveFirestoreDoc('ministryWorkPlans', newPlan.id, newPlan);
  };

  const handleUpdateMinistryWorkPlan = (plan: MinistryWorkPlan) => {
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    setMinistryWorkPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? updated : p))
    );
    saveFirestoreDoc('ministryWorkPlans', updated.id, updated);
  };

  const handleDeleteMinistryWorkPlan = (id: string) => {
    const item = ministryWorkPlans.find((p) => p.id === id);
    if (item) {
      sendToTrash('ministryWorkPlan', item.id, item.title, `${item.period} • Estado: ${item.status}`, item);
    }
    setMinistryWorkPlans((prev) => prev.filter((p) => p.id !== id));
    deleteFirestoreDoc('ministryWorkPlans', id);
  };

  // Recycle Bin Restore & Empty Handlers
  const handleRestoreDeletedItem = (item: DeletedItem) => {
    setDeletedItems((prev) => prev.filter((d) => d.id !== item.id));
    deleteFirestoreDoc('deletedItems', item.id);
    const p = item.payload;
    if (!p) return;

    switch (item.itemType) {
      case 'member':
        setMembers((prev) => [...prev.filter((m) => m.id !== p.id), p]);
        saveFirestoreDoc('members', p.id, p);
        break;
      case 'family':
        setFamilies((prev) => [...prev.filter((f) => f.id !== p.id), p]);
        saveFirestoreDoc('families', p.id, p);
        break;
      case 'event':
        setEvents((prev) => [...prev.filter((e) => e.id !== p.id), p]);
        saveFirestoreDoc('events', p.id, p);
        break;
      case 'specialCoopEvent':
        setSpecialEvents((prev) => [...prev.filter((e) => e.id !== p.id), p]);
        saveFirestoreDoc('specialEvents', p.id, p);
        break;
      case 'financialTransaction':
        setTransactions((prev) => [p, ...prev.filter((t) => t.id !== p.id)]);
        saveFirestoreDoc('transactions', p.id, p);
        break;
      case 'coopAccount':
        setCoopAccounts((prev) => [...prev.filter((a) => a.id !== p.id), p]);
        saveFirestoreDoc('coopAccounts', p.id, p);
        break;
      case 'coopTransaction':
        setCoopTransactions((prev) => [p, ...prev.filter((t) => t.id !== p.id)]);
        saveFirestoreDoc('coopTransactions', p.id, p);
        break;
      case 'eventRegistration':
        setEventRegistrations((prev) => [p, ...prev.filter((r) => r.id !== p.id)]);
        saveFirestoreDoc('eventRegistrations', p.id, p);
        break;
      case 'microLoan':
        setMicroLoans((prev) => [...prev.filter((l) => l.id !== p.id), p]);
        saveFirestoreDoc('microLoans', p.id, p);
        break;
      case 'systemUser':
        setSystemUsers((prev) => [...prev.filter((u) => u.id !== p.id), p]);
        saveFirestoreDoc('systemUsers', p.id, p);
        break;
      case 'worshipSong':
        setWorshipSongs((prev) => [...prev.filter((s) => s.id !== p.id), p]);
        saveFirestoreDoc('worshipSongs', p.id, p);
        break;
      case 'worshipMusician':
        setWorshipMusicians((prev) => [...prev.filter((m) => m.id !== p.id), p]);
        saveFirestoreDoc('worshipMusicians', p.id, p);
        break;
      case 'worshipRehearsal':
        setWorshipRehearsals((prev) => [p, ...prev.filter((r) => r.id !== p.id)]);
        saveFirestoreDoc('worshipRehearsals', p.id, p);
        break;
      case 'worshipSchedule':
        setWorshipSchedules((prev) => [p, ...prev.filter((s) => s.id !== p.id)]);
        saveFirestoreDoc('worshipSchedules', p.id, p);
        break;
      case 'danceChoreography':
        setDanceChoreographies((prev) => [...prev.filter((c) => c.id !== p.id), p]);
        saveFirestoreDoc('danceChoreos', p.id, p);
        break;
      case 'danceDancer':
        setDanceDancers((prev) => [...prev.filter((d) => d.id !== p.id), p]);
        saveFirestoreDoc('danceDancers', p.id, p);
        break;
      case 'danceRehearsal':
        setDanceRehearsals((prev) => [p, ...prev.filter((r) => r.id !== p.id)]);
        saveFirestoreDoc('danceRehearsals', p.id, p);
        break;
      case 'danceWardrobe':
        setDanceWardrobe((prev) => [...prev.filter((w) => w.id !== p.id), p]);
        saveFirestoreDoc('danceWardrobe', p.id, p);
        break;
      case 'womenActivity':
        setWomenActivities((prev) => [...prev.filter((w) => w.id !== p.id), p]);
        saveFirestoreDoc('womenActivities', p.id, p);
        break;
      case 'womenLeader':
        setWomenLeaders((prev) => [...prev.filter((l) => l.id !== p.id), p]);
        saveFirestoreDoc('womenLeaders', p.id, p);
        break;
      case 'womenCellGroup':
        setWomenCellGroups((prev) => [...prev.filter((c) => c.id !== p.id), p]);
        saveFirestoreDoc('womenCells', p.id, p);
        break;
      case 'womenPrayerRequest':
        setWomenPrayerRequests((prev) => [p, ...prev.filter((r) => r.id !== p.id)]);
        saveFirestoreDoc('womenPrayers', p.id, p);
        break;
      case 'usherServer':
        setUsherServers((prev) => [...prev.filter((s) => s.id !== p.id), p]);
        saveFirestoreDoc('usherServers', p.id, p);
        break;
      case 'usherDuty':
        setUsherRosters((prev) => [...prev.filter((u) => u.id !== p.id), p]);
        saveFirestoreDoc('usherRosters', p.id, p);
        break;
      case 'theaterActor':
        setTheaterActors((prev) => [...prev.filter((a) => a.id !== p.id), p]);
        saveFirestoreDoc('theaterActors', p.id, p);
        break;
      case 'theaterRehearsal':
        setTheaterRehearsals((prev) => [p, ...prev.filter((r) => r.id !== p.id)]);
        saveFirestoreDoc('theaterRehearsals', p.id, p);
        break;
      case 'worshipCasting':
        setWorshipCastings((prev) => [...prev.filter((c) => c.id !== p.id), p]);
        saveFirestoreDoc('worshipCastings', p.id, p);
        break;
      case 'danceCasting':
        setDanceCastings((prev) => [...prev.filter((c) => c.id !== p.id), p]);
        saveFirestoreDoc('danceCastings', p.id, p);
        break;
      case 'theaterPlay':
        setTheaterPlays((prev) => [...prev.filter((t) => t.id !== p.id), p]);
        saveFirestoreDoc('theaterPlays', p.id, p);
        break;
      case 'theaterCasting':
        setTheaterCastings((prev) => [...prev.filter((c) => c.id !== p.id), p]);
        saveFirestoreDoc('theaterCastings', p.id, p);
        break;
      case 'ministryWorkPlan':
        setMinistryWorkPlans((prev) => [...prev.filter((w) => w.id !== p.id), p]);
        saveFirestoreDoc('ministryWorkPlans', p.id, p);
        break;
      case 'customSection': {
        handleUpdateConfig((prev) => {
          const list = Array.isArray(prev.customSections) ? prev.customSections : DEFAULT_CUSTOM_SECTIONS;
          return {
            ...prev,
            customSections: [...list.filter((s) => s.id !== p.id), p],
          };
        });
        break;
      }
      case 'ministry': {
        handleUpdateConfig((prev) => {
          const list = Array.isArray(prev.ministries) ? prev.ministries : DEFAULT_MINISTRIES;
          return {
            ...prev,
            ministries: [...list.filter((m) => m.id !== p.id), p],
          };
        });
        break;
      }
      case 'ecclesiasticalRole': {
        handleUpdateConfig((prev) => {
          const list = getEffectiveEcclesiasticalRoles(prev);
          return {
            ...prev,
            ecclesiasticalRoles: [...list.filter((r) => r.id !== p.id), p],
          };
        });
        break;
      }
      case 'customRole': {
        setCustomRoles((prev) => [...prev.filter((r) => r.id !== p.id), p]);
        saveFirestoreDoc('customRoles', p.id, p);
        break;
      }
      case 'chatGroup': {
        const savedGroups = localStorage.getItem('eclesia_chatGroups');
        let currentGrpList: any[] = [];
        try {
          currentGrpList = savedGroups ? JSON.parse(savedGroups) : [];
        } catch (e) {}
        const updatedGrpList = [...currentGrpList.filter((g) => g.id !== p.id), p];
        localStorage.setItem('eclesia_chatGroups', JSON.stringify(updatedGrpList));
        window.dispatchEvent(new Event('storage'));
        break;
      }
    }
  };

  const handlePermanentDeleteItem = (itemId: string) => {
    setDeletedItems((prev) => prev.filter((d) => d.id !== itemId));
    deleteFirestoreDoc('deletedItems', itemId);
  };

  const handleEmptyTrash = () => {
    deletedItems.forEach((d) => {
      deleteFirestoreDoc('deletedItems', d.id);
    });
    setDeletedItems([]);
  };

  // Export & Reset Handlers
  const handleExportData = () => {
    const backupData = {
      config,
      members,
      families,
      events,
      transactions,
      coopAccounts,
      coopTransactions,
      microLoans,
      specialEvents,
      eventRegistrations,
      worshipSongs,
      worshipMusicians,
      worshipRehearsals,
      worshipSchedules,
      worshipCastings,
      danceChoreographies,
      danceDancers,
      danceRehearsals,
      danceWardrobe,
      danceCastings,
      womenActivities,
      womenLeaders,
      womenCellGroups,
      womenPrayerRequests,
      usherServers,
      usherRosters,
      theaterPlays,
      theaterActors,
      theaterRehearsals,
      theaterCastings,
      ministryWorkPlans,
      systemUsers,
      deletedItems,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eclesia_respaldo_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.config) setConfig(data.config);
        if (data.members) setMembers(data.members);
        if (data.families) setFamilies(data.families);
        if (data.events) setEvents(data.events);
        if (data.transactions) setTransactions(data.transactions);
        if (data.coopAccounts) setCoopAccounts(data.coopAccounts);
        if (data.coopTransactions) setCoopTransactions(data.coopTransactions);
        if (data.microLoans) setMicroLoans(data.microLoans);
        if (data.specialEvents) setSpecialEvents(data.specialEvents);
        if (data.eventRegistrations) setEventRegistrations(data.eventRegistrations);
        if (data.worshipSongs) setWorshipSongs(data.worshipSongs);
        if (data.worshipMusicians) setWorshipMusicians(data.worshipMusicians);
        if (data.worshipRehearsals) setWorshipRehearsals(data.worshipRehearsals);
        if (data.worshipSchedules) setWorshipSchedules(data.worshipSchedules);
        if (data.worshipCastings) setWorshipCastings(data.worshipCastings);
        if (data.danceChoreographies) setDanceChoreographies(data.danceChoreographies);
        if (data.danceDancers) setDanceDancers(data.danceDancers);
        if (data.danceRehearsals) setDanceRehearsals(data.danceRehearsals);
        if (data.danceWardrobe) setDanceWardrobe(data.danceWardrobe);
        if (data.danceCastings) setDanceCastings(data.danceCastings);
        if (data.womenActivities) setWomenActivities(data.womenActivities);
        if (data.womenLeaders) setWomenLeaders(data.womenLeaders);
        if (data.womenCellGroups) setWomenCellGroups(data.womenCellGroups);
        if (data.womenPrayerRequests) setWomenPrayerRequests(data.womenPrayerRequests);
        if (data.usherServers) setUsherServers(data.usherServers);
        if (data.usherRosters) setUsherRosters(data.usherRosters);
        if (data.theaterPlays) setTheaterPlays(data.theaterPlays);
        if (data.theaterActors) setTheaterActors(data.theaterActors);
        if (data.theaterRehearsals) setTheaterRehearsals(data.theaterRehearsals);
        if (data.theaterCastings) setTheaterCastings(data.theaterCastings);
        if (data.ministryWorkPlans) setMinistryWorkPlans(data.ministryWorkPlans);
        if (data.systemUsers) setSystemUsers(data.systemUsers);
        if (data.deletedItems && Array.isArray(data.deletedItems)) {
          const sanitized = data.deletedItems.map((item: any) => sanitizeDeletedItem(item)).filter((x: any): x is DeletedItem => x !== null);
          setDeletedItems(sanitized);
        }
        alert('¡Respaldo importado correctamente!');
      } catch (err) {
        alert('Error al leer el archivo de respaldo JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('¿Estás seguro de restablecer y vaciar la base de datos dejando el sistema limpio para el Desarrollador?')) {
      setConfig(initialConfig);
      setMembers([]);
      setFamilies([]);
      setEvents([]);
      setTransactions([]);
      setCoopAccounts([]);
      setCoopTransactions([]);
      setMicroLoans([]);
      setSpecialEvents([]);
      setEventRegistrations([]);
      setSystemUsers(initialSystemUsers);
      setWorshipSongs([]);
      setWorshipMusicians([]);
      setWorshipRehearsals([]);
      setWorshipSchedules([]);
      setWorshipCastings([]);
      setDanceChoreographies([]);
      setDanceDancers([]);
      setDanceRehearsals([]);
      setDanceWardrobe([]);
      setDanceCastings([]);
      setWomenActivities([]);
      setWomenLeaders([]);
      setWomenCellGroups([]);
      setWomenPrayerRequests([]);
      setUsherServers([]);
      setUsherRosters([]);
      setTheaterPlays([]);
      setTheaterActors([]);
      setTheaterRehearsals([]);
      setTheaterCastings([]);
      setMinistryWorkPlans([]);
      setNotifications([]);
      setDeletedItems([]);
      localStorage.clear();
      localStorage.setItem('eclesia_systemUsers', JSON.stringify(initialSystemUsers));
      localStorage.setItem('eclesia_demos_purged_v4', 'true');
    }
  };

  if (!currentUser) {
    return (
      <AuthView
        config={config}
        systemUsers={systemUsers}
        onLoginSuccess={handleLoginSuccess}
        onRegisterUser={handleRegisterUser}
        activeVerse={activeVerse}
      />
    );
  }

  const currentTheme = churchThemes.find((t) => t.id === config.activeThemeId) || churchThemes[0];
  const activePageColor = getActivePageThemeColor(activeTab, config);

  const handleUpdateSinglePageColor = (tab: TabType, colorHex: string) => {
    handleUpdateConfig((prev) => ({
      ...prev,
      customTabColors: {
        ...(prev.customTabColors || {}),
        [tab]: colorHex,
      },
    }));
  };

  const handleResetSinglePageColor = (tab: TabType) => {
    const defaultColor =
      currentTheme.tabColors[tab] || currentTheme.primaryColor || '#4f46e5';
    handleUpdateSinglePageColor(tab, defaultColor);
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50/50 to-purple-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 text-slate-900 dark:text-slate-100 font-sans transition-colors selection:bg-indigo-500 selection:text-white relative overflow-x-hidden"
      style={{
        '--page-primary': activePageColor,
        '--page-glow': `${activePageColor}33`,
      } as React.CSSProperties}
    >
      {/* Decorative ambient glass glowing background circles with dynamic page theme color */}
      <div
        className="fixed top-12 left-10 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-700"
        style={{ backgroundColor: `${activePageColor}25` }}
      />
      <div
        className="fixed top-1/3 right-10 w-96 h-96 rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-700"
        style={{ backgroundColor: `${currentTheme.accentColor}20` }}
      />
      <div
        className="fixed bottom-10 left-1/3 w-80 h-80 rounded-full blur-3xl pointer-events-none -z-10 transition-colors duration-700"
        style={{ backgroundColor: `${activePageColor}1a` }}
      />

      {/* Header */}
      <Header
        config={config}
        currentUser={currentUser}
        systemUsers={systemUsers}
        onSwitchUser={handleLoginSuccess}
        onLogout={handleLogout}
        onNavigateToSettings={() => setActiveTab('settings')}
        onOpenAIAssistant={() => setIsAIPastoralModalOpen(true)}
        unreadNotificationCount={notifications.filter((n) => !n.read).length}
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onOpenQuickGuide={() => setIsQuickGuideOpen(true)}
        onToggleTheme={handleToggleTheme}
        isDarkMode={isDarkMode}
        activeTab={activeTab}
        activeVerse={activeVerse}
        onNextRandomVerse={() => setActiveVerse((prev) => getRandomBibleVerseExcluding(prev))}
      />

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        enableCoopModule={config.enableCoopModule}
        allowedTabs={currentUser?.allowedTabs}
        userRoleName={currentUser?.role}
        customTabColors={config.customTabColors}
        tabBadges={tabBadges}
        config={config}
      />

      {/* Main View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Interactive Active Page Theme Header */}
        {isTabAllowedForUser(activeTab, currentUser) && (
          <PageThemeHeader
            activeTab={activeTab}
            config={config}
            onUpdatePageColor={handleUpdateSinglePageColor}
            onResetPageColor={handleResetSinglePageColor}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenModuleEditor={() => {
              setDevSubTab('modules');
              setActiveTab('developer');
            }}
            isDevUser={currentUser?.role === 'Administrador' || currentUser?.role === 'Desarrollador'}
          />
        )}

        {!isTabAllowedForUser(activeTab, currentUser) ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 text-center border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg mx-auto my-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Acceso Bloqueado / Restringido</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              Tu rol actual (<strong className="text-indigo-600 dark:text-indigo-400">{currentUser?.role}</strong>) no tiene autorización para ingresar a esta sección.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  const allowed = getEffectiveAllowedTabs(currentUser);
                  if (allowed.length > 0) setActiveTab(allowed[0] as TabType);
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Ir a mi módulo asignado
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                members={members}
                events={events}
                transactions={transactions}
                coopAccounts={coopAccounts}
                microLoans={microLoans}
                config={config}
                currentUser={currentUser}
                systemUsers={systemUsers}
                onUpdateSystemUsers={handleUpdateSystemUsers}
                setActiveTab={setActiveTab}
                onOpenAIAssistant={() => setIsAIPastoralModalOpen(true)}
                onOpenAddMember={() => {
                  setActiveTab('directory');
                  setIsAddMemberModalOpen(true);
                }}
                onOpenAddEvent={() => {
                  setActiveTab('events');
                  setIsAddEventModalOpen(true);
                }}
                onOpenAddTransaction={() => {
                  setActiveTab('finances');
                  setIsAddTransactionModalOpen(true);
                }}
                onTriggerLockNow={() => setIsScreenLocked(true)}
              />
            )}

        {activeTab === 'directory' && (
          <DirectoryView
            config={config}
            members={members}
            families={families}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onAddFamily={handleAddFamily}
            onUpdateFamily={handleUpdateFamily}
            onDeleteFamily={handleDeleteFamily}
            isAddModalOpen={isAddMemberModalOpen}
            setIsAddModalOpen={setIsAddMemberModalOpen}
            onUpdateConfig={handleUpdateConfig}
            onOpenDeveloperTab={(subTab) => {
              if (subTab) setDevSubTab(subTab as any);
              setActiveTab('developer');
            }}
          />
        )}

        {activeTab === 'events' && (
          <EventsView
            config={config}
            events={events}
            members={members}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onOpenAIAssistant={() => setIsAIPastoralModalOpen(true)}
            isAddModalOpen={isAddEventModalOpen}
            setIsAddModalOpen={setIsAddEventModalOpen}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'finances' && (
          <FinancesView
            transactions={transactions}
            members={members}
            config={config}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onOpenAIAssistant={() => setIsAIPastoralModalOpen(true)}
            isAddModalOpen={isAddTransactionModalOpen}
            setIsAddModalOpen={setIsAddTransactionModalOpen}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'coop' && config.enableCoopModule && (
          <CoopView
            coopAccounts={coopAccounts}
            coopTransactions={coopTransactions}
            microLoans={microLoans}
            members={members}
            families={families}
            config={config}
            specialEvents={specialEvents}
            eventRegistrations={eventRegistrations}
            onAddAccount={handleAddCoopAccount}
            onDeleteAccount={handleDeleteCoopAccount}
            onAddCoopTransaction={handleAddCoopTransaction}
            onDeleteCoopTransaction={handleDeleteCoopTransaction}
            onRequestLoan={handleRequestLoan}
            onUpdateLoanStatus={handleUpdateLoanStatus}
            onMakeLoanPayment={handleMakeLoanPayment}
            onDeleteLoan={handleDeleteLoan}
            onAddSpecialEvent={handleAddSpecialEvent}
            onUpdateSpecialEvent={handleUpdateSpecialEvent}
            onDeleteSpecialEvent={handleDeleteSpecialEvent}
            onRegisterForEvent={handleRegisterForEvent}
            onUpdateEventRegistration={handleUpdateEventRegistration}
            onDeleteEventRegistration={handleDeleteEventRegistration}
            onUpdateConfig={setConfig}
          />
        )}

        {/* Individual Ministry Access Guard */}
        {(() => {
          const isIndividualMinistry = ['worship', 'dance', 'women', 'ushers', 'theater'].includes(activeTab) || Boolean(customMinistry);
          if (!isIndividualMinistry) return null;
          const targetMinistryId = customMinistry ? customMinistry.id : activeTab;
          const isAccessible = isMinistryAccessibleForUser(targetMinistryId, currentUser, members);
          if (!isAccessible) {
            return (
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-white/60 dark:border-slate-800/60 shadow-lg text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Acceso Restringido al Ministerio
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Tu usuario ({currentUser?.name || 'Usuario'} • Rol: {currentUser?.role || 'Miembro'}) no tiene asignado este ministerio. Solo los integrantes autorizados o la administración pueden acceder a sus datos.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ministries')}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    ← Volver al Centro de Ministerios
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {activeTab === 'worship' && isMinistryAccessibleForUser('worship', currentUser, members) && (
          <WorshipView
            config={config}
            songs={worshipSongs}
            musicians={worshipMusicians}
            rehearsals={worshipRehearsals}
            schedules={worshipSchedules}
            castings={worshipCastings}
            plans={ministryWorkPlans}
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddSong={handleAddWorshipSong}
            onUpdateSong={handleUpdateWorshipSong}
            onDeleteSong={handleDeleteWorshipSong}
            onAddMusician={handleAddWorshipMusician}
            onUpdateMusician={handleUpdateWorshipMusician}
            onDeleteMusician={handleDeleteWorshipMusician}
            onAddRehearsal={handleAddWorshipRehearsal}
            onUpdateRehearsal={handleUpdateWorshipRehearsal}
            onDeleteRehearsal={handleDeleteWorshipRehearsal}
            onAddSchedule={handleAddWorshipSchedule}
            onUpdateSchedule={handleUpdateWorshipSchedule}
            onDeleteSchedule={handleDeleteWorshipSchedule}
            onAddCasting={handleAddWorshipCasting}
            onUpdateCasting={handleUpdateWorshipCasting}
            onDeleteCasting={handleDeleteWorshipCasting}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'dance' && isMinistryAccessibleForUser('dance', currentUser, members) && (
          <DanceView
            config={config}
            choreographies={danceChoreographies}
            dancers={danceDancers}
            rehearsals={danceRehearsals}
            wardrobe={danceWardrobe}
            castings={danceCastings}
            plans={ministryWorkPlans}
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddChoreography={handleAddDanceChoreography}
            onUpdateChoreography={handleUpdateDanceChoreography}
            onDeleteChoreography={handleDeleteDanceChoreography}
            onAddDancer={handleAddDanceDancer}
            onUpdateDancer={handleUpdateDanceDancer}
            onDeleteDancer={handleDeleteDanceDancer}
            onAddRehearsal={handleAddDanceRehearsal}
            onUpdateRehearsal={handleUpdateDanceRehearsal}
            onDeleteRehearsal={handleDeleteDanceRehearsal}
            onAddWardrobeItem={handleAddDanceWardrobe}
            onUpdateWardrobeItem={handleUpdateDanceWardrobe}
            onDeleteWardrobeItem={handleDeleteDanceWardrobe}
            onAddCasting={handleAddDanceCasting}
            onUpdateCasting={handleUpdateDanceCasting}
            onDeleteCasting={handleDeleteDanceCasting}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'women' && isMinistryAccessibleForUser('women', currentUser, members) && (
          <WomenView
            config={config}
            activities={womenActivities}
            leaders={womenLeaders}
            cellGroups={womenCellGroups}
            prayerRequests={womenPrayerRequests}
            plans={ministryWorkPlans}
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddActivity={handleAddWomenActivity}
            onUpdateActivity={handleUpdateWomenActivity}
            onDeleteActivity={handleDeleteWomenActivity}
            onAddLeader={handleAddWomenLeader}
            onUpdateLeader={handleUpdateWomenLeader}
            onDeleteLeader={handleDeleteWomenLeader}
            onAddCellGroup={handleAddWomenCell}
            onUpdateCellGroup={handleUpdateWomenCell}
            onDeleteCellGroup={handleDeleteWomenCell}
            onAddPrayerRequest={handleAddWomenPrayer}
            onUpdatePrayerRequest={handleUpdateWomenPrayer}
            onTogglePrayerAnswered={handleToggleWomenPrayerAnswered}
            onDeletePrayerRequest={handleDeleteWomenPrayer}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'ushers' && isMinistryAccessibleForUser('ushers', currentUser, members) && (
          <UshersView
            config={config}
            servers={usherServers}
            rosters={usherRosters}
            plans={ministryWorkPlans}
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddServer={handleAddUsherServer}
            onUpdateServer={handleUpdateUsherServer}
            onDeleteServer={handleDeleteUsherServer}
            onAddRoster={handleAddUsherRoster}
            onUpdateRoster={handleUpdateUsherRoster}
            onDeleteRoster={handleDeleteUsherRoster}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'theater' && isMinistryAccessibleForUser('theater', currentUser, members) && (
          <TheaterView
            config={config}
            plays={theaterPlays}
            actors={theaterActors}
            rehearsals={theaterRehearsals}
            castings={theaterCastings}
            plans={ministryWorkPlans}
            members={members}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddPlay={handleAddTheaterPlay}
            onUpdatePlay={handleUpdateTheaterPlay}
            onDeletePlay={handleDeleteTheaterPlay}
            onAddActor={handleAddTheaterActor}
            onUpdateActor={handleUpdateTheaterActor}
            onDeleteActor={handleDeleteTheaterActor}
            onAddRehearsal={handleAddTheaterRehearsal}
            onUpdateRehearsal={handleUpdateTheaterRehearsal}
            onDeleteRehearsal={handleDeleteTheaterRehearsal}
            onAddCasting={handleAddTheaterCasting}
            onUpdateCasting={handleUpdateTheaterCasting}
            onDeleteCasting={handleDeleteTheaterCasting}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onUpdateConfig={setConfig}
          />
        )}

        {activeTab === 'ministries' && (
          <MinistryHubView
            config={config}
            members={members}
            workPlans={ministryWorkPlans}
            currentUser={currentUser}
            onSelectMinistryView={(ministryId) => setActiveTab(ministryId as TabType)}
            onOpenDeveloperMinistries={() => {
              setDevSubTab('ministries');
              setDevAutoOpenCreator(Date.now());
              setActiveTab('developer');
            }}
          />
        )}

        {customMinistry && isMinistryAccessibleForUser(customMinistry.id, currentUser, members) && (
          <GenericMinistryView
            ministry={customMinistry}
            config={config}
            members={members}
            workPlans={ministryWorkPlans}
            castingCalls={worshipCastings}
            onAddPlan={handleAddMinistryWorkPlan}
            onUpdatePlan={handleUpdateMinistryWorkPlan}
            onDeletePlan={handleDeleteMinistryWorkPlan}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onAddCasting={handleAddWorshipCasting}
            onUpdateCasting={handleUpdateWorshipCasting}
            onDeleteCasting={handleDeleteWorshipCasting}
            onBackToHub={() => setActiveTab('ministries')}
            onUpdateConfig={setConfig}
          />
        )}

        {/* Dynamic Custom Sections (e.g. Donaciones, Transmisiones, Recursos, etc.) */}
        {(() => {
          const customSectionsList =
            Array.isArray(config.customSections)
              ? config.customSections
              : DEFAULT_CUSTOM_SECTIONS;
          const currentCustomSection = customSectionsList.find(
            (s) => (s.slug || s.id) === activeTab || s.id === activeTab
          );

          if (!currentCustomSection) return null;

          const isAccessible = isCustomSectionAccessibleForUser(currentCustomSection, currentUser);
          if (!isAccessible) {
            return (
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-white/60 dark:border-slate-800/60 shadow-lg text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Acceso Restringido a esta Sección
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Esta sección ({currentCustomSection.name}) requiere permisos específicos. Tu rol actual ({currentUser?.role || 'Miembro'}) no está autorizado para acceder a este módulo.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                  >
                    ← Volver al Inicio
                  </button>
                </div>
              </div>
            );
          }

          // Comprobar vigencia y vencimiento temporal de la sección
          const isAdminOrDev =
            currentUser?.role === 'Desarrollador' || currentUser?.role === 'Administrador';

          if (!isAdminOrDev && currentCustomSection.expiration?.enabled) {
            const expInfo = getSectionExpirationInfo(currentCustomSection);

            // 1. Sección programada en el futuro (aún no ha iniciado)
            if (expInfo.isScheduled && currentCustomSection.expiration.startsAt) {
              return (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-blue-200 dark:border-blue-900/60 shadow-lg text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner">
                    <Clock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Sección Programada
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Esta sección ({currentCustomSection.name}) aún no ha comenzado. Estará disponible para toda la congregación a partir del{' '}
                    <strong>{formatExpirationDate(currentCustomSection.expiration.startsAt)}</strong>.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      ← Volver al Inicio
                    </button>
                  </div>
                </div>
              );
            }

            // 2. Sección vencida y con acción 'hide' o 'lock'
            if (expInfo.isExpired && (expInfo.action === 'lock' || expInfo.action === 'hide')) {
              return (
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl p-8 border border-rose-200 dark:border-rose-900/60 shadow-lg text-center max-w-lg mx-auto my-12 space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Sección Finalizada
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentCustomSection.expiration.expiredMessage ||
                      `El periodo de vigencia activa de esta sección (${currentCustomSection.name}) finalizó el ${formatExpirationDate(
                        currentCustomSection.expiration.expiresAt!
                      )}. Gracias por su participación.`}
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('dashboard')}
                      className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      ← Volver al Inicio
                    </button>
                  </div>
                </div>
              );
            }
          }

          return (
            <CustomSectionRenderer
              section={currentCustomSection}
              config={config}
              currentUser={currentUser}
              onUpdateSectionData={(updatedSec) => {
                handleUpdateConfig((prev) => {
                  const list =
                    Array.isArray(prev.customSections)
                      ? prev.customSections
                      : DEFAULT_CUSTOM_SECTIONS;
                  const idx = list.findIndex((s) => s.id === updatedSec.id);
                  const newList =
                    idx >= 0 ? list.map((s, i) => (i === idx ? updatedSec : s)) : [...list, updatedSec];
                  return { ...prev, customSections: newList };
                });
              }}
              onUpdateConfig={handleUpdateConfig}
              onSendToTrash={sendToTrash}
              onDeleteSection={(secId) => {
                handleUpdateConfig((prev) => ({
                  ...prev,
                  customSections: (Array.isArray(prev.customSections) ? prev.customSections : DEFAULT_CUSTOM_SECTIONS).filter((s) => s.id !== secId),
                }));
                setActiveTab('dashboard');
              }}
              onNavigateToTab={(t) => setActiveTab(t as any)}
              onShowToast={(msg) => {
                triggerNativePush(currentCustomSection.name, msg);
              }}
            />
          );
        })()}

        {activeTab === 'chat' && (
          <ChatView
            currentUser={currentUser}
            config={config}
            onSendToTrash={sendToTrash}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            systemUsers={systemUsers}
            currentUser={currentUser}
            onUpdateConfig={handleUpdateConfig}
            onUpdateSystemUsers={handleUpdateSystemUsers}
            onSendToTrash={sendToTrash}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onOpenQuickGuide={() => setIsQuickGuideOpen(true)}
            onOpenSectionsCreator={() => {
              setDevSubTab('custom_sections');
              setDevAutoOpenCreator(Date.now());
              setActiveTab('developer');
            }}
          />
        )}

        {activeTab === 'developer' && (
          <DeveloperView
            config={config}
            members={members}
            systemUsers={systemUsers}
            currentUser={currentUser}
            deletedItems={deletedItems}
            initialSubTab={devSubTab}
            autoOpenCreatorTrigger={devAutoOpenCreator}
            customRoles={customRoles}
            onUpdateCustomRoles={(updated) => {
              setCustomRoles(updated);
            }}
            lockScreenConfig={lockScreenConfig}
            onUpdateLockScreenConfig={(updated) => {
              const safeUpdated = sanitizeLockScreenConfig(updated);
              setLockScreenConfig(safeUpdated);
              saveFirestoreDoc('system', 'lockScreenConfig', safeUpdated);
              createSystemNotification({
                title: `🔒 Bloqueo de Pantalla Configurado`,
                body: `Se actualizó el tiempo de inactividad a ${safeUpdated.timeoutMinutes} min y salvapantallas con guardado en Firebase.`,
                category: 'security',
                targetTab: 'developer',
              });
            }}
            onTriggerLockNow={() => setIsScreenLocked(true)}
            onRestoreDeletedItem={handleRestoreDeletedItem}
            onPermanentDeleteItem={handlePermanentDeleteItem}
            onEmptyTrash={handleEmptyTrash}
            onSendToTrash={sendToTrash}
            onUpdateSystemUsers={handleUpdateSystemUsers}
            onUpdateConfig={handleUpdateConfig}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetData={handleResetData}
            onTriggerTestUpdateModal={(previewRelease) => {
              setRemoteUpdateRelease(previewRelease);
              setIsUpdateModalOpen(true);
            }}
            stats={{
              membersCount: members.length,
              familiesCount: families.length,
              eventsCount: events.length,
              specialEventsCount: specialEvents.length,
              transactionsCount: transactions.length,
              coopAccountsCount: coopAccounts.length,
            }}
          />
        )}
          </>
        )}
      </main>

      {/* Dynamic Screen Lock / Screensaver Overlay with custom uploaded video/animation and colors */}
      {isScreenLocked && (
        <LockScreenOverlay
          config={lockScreenConfig}
          churchConfig={config}
          currentUser={currentUser}
          onUnlock={() => setIsScreenLocked(false)}
          onSwitchUser={() => {
            setIsScreenLocked(false);
            handleLogout();
          }}
        />
      )}

      {/* AI Pastoral Assistant Modal */}
      <AIPastoralAssistantModal
        isOpen={isAIPastoralModalOpen}
        onClose={() => setIsAIPastoralModalOpen(false)}
        config={config}
        events={events}
      />

      {/* Push Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifAsRead}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onDeleteNotification={handleDeleteNotif}
        onClearAll={handleClearAllNotifs}
        onSendCustomPush={handleSendCustomPush}
        config={config}
      />

      {/* Remote App Update Notification & Direct Installer Modal */}
      <AppUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={remoteUpdateRelease}
        installedVersion={installedVersion}
        onInstalledSuccess={() => {
          if (remoteUpdateRelease) {
            setInstalledVersion(remoteUpdateRelease.version);
          }
        }}
        deferredPrompt={deferredPrompt}
        onNativeInstall={handleNativeInstall}
      />

      {/* PWA Install Guide & Native Prompt Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onNativeInstall={handleNativeInstall}
      />

      {/* Quick Guide / Tutorial Modal */}
      <QuickGuideModal
        isOpen={isQuickGuideOpen}
        onClose={() => setIsQuickGuideOpen(false)}
        showOnStartup={config.showQuickGuideOnStartup ?? false}
        onToggleShowOnStartup={handleToggleQuickGuideStartup}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsQuickGuideOpen(false);
        }}
      />
    </div>
  );
}
