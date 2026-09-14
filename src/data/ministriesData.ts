import {
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
  UsherDutySchedule,
  UsherProtocolGuide,
  TheaterPlay,
  TheaterRehearsal,
  TheaterPropItem,
  TheaterCastingCall,
  MinistryCastingCall,
  MinistryWorkPlan,
} from '../types';

// ========================================================
// 0. PLANIFICACIÓN DE TRABAJO MINISTERIAL (LIMPIO)
// ========================================================
export const initialMinistryWorkPlans: MinistryWorkPlan[] = [];

// ========================================================
// 1. ALABANZA INITIAL DATA (LIMPIO / SIN DEMOS)
// ========================================================
export const initialWorshipSongs: WorshipSong[] = [];
export const initialWorshipMusicians: WorshipMusician[] = [];
export const initialWorshipRehearsals: WorshipRehearsal[] = [];
export const initialWorshipSchedules: WorshipServiceSchedule[] = [];
export const initialWorshipCastings: MinistryCastingCall[] = [];

// ========================================================
// 2. DANZA INITIAL DATA (LIMPIO / SIN DEMOS)
// ========================================================
export const initialDanceChoreographies: DanceChoreography[] = [];
export const initialDanceDancers: DanceDancer[] = [];
export const initialDanceRehearsals: DanceRehearsal[] = [];
export const initialDanceWardrobe: DanceWardrobeItem[] = [];
export const initialDanceCastings: MinistryCastingCall[] = [];

// ========================================================
// 3. DAMAS INITIAL DATA (LIMPIO / SIN DEMOS)
// ========================================================
export const initialWomenActivities: WomenActivity[] = [];
export const initialWomenLeaders: WomenLeader[] = [];
export const initialWomenCellGroups: WomenCellGroup[] = [];
export const initialWomenPrayerRequests: WomenPrayerRequest[] = [];

// ========================================================
// 4. SERVIDORES / UJIERES INITIAL DATA (LIMPIO / SIN DEMOS)
// ========================================================
export const initialUsherServers: UsherServer[] = [];
export const initialUsherSchedules: UsherDutySchedule[] = [];
export const initialUsherProtocolGuides: UsherProtocolGuide[] = [];

// ========================================================
// 5. TEATRO & ARTES DRAMÁTICAS INITIAL DATA (LIMPIO / SIN DEMOS)
// ========================================================
export const initialTheaterPlays: TheaterPlay[] = [];
export const initialTheaterRehearsals: TheaterRehearsal[] = [];
export const initialTheaterProps: TheaterPropItem[] = [];
export const initialTheaterCastings: TheaterCastingCall[] = [];
