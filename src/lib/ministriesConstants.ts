export interface MinistryMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  tabKey?: string;
  description: string;
}

export const CHURCH_AVAILABLE_MINISTRIES: MinistryMeta[] = [
  {
    id: 'worship',
    name: 'Alabanza & Música',
    shortName: 'Alabanza',
    color: '#7c3aed',
    tabKey: 'worship',
    description: 'Músicos, directores corales, vocalistas y bandas litúrgicas',
  },
  {
    id: 'dance',
    name: 'Danza & Artes Escénicas',
    shortName: 'Danza',
    color: '#db2777',
    tabKey: 'dance',
    description: 'Danzarinas, coreografías, banderas, pandero y expresión corporal',
  },
  {
    id: 'women',
    name: 'Ministerio Femenil / Damas',
    shortName: 'Damas',
    color: '#e11d48',
    tabKey: 'women',
    description: 'Sociedad de mujeres, células femeniles y actividades de edificación',
  },
  {
    id: 'ushers',
    name: 'Ujieres & Servidores',
    shortName: 'Ujieres',
    color: '#0284c7',
    tabKey: 'ushers',
    description: 'Protocolo, recepción, orden del santuario y colecta',
  },
  {
    id: 'theater',
    name: 'Teatro & Artes Dramáticas',
    shortName: 'Teatro',
    color: '#9333ea',
    tabKey: 'theater',
    description: 'Actores, dramaturgos, directores de escena y obras teatrales',
  },
  {
    id: 'kids',
    name: 'Semillero Infantil / Niños',
    shortName: 'Niños',
    color: '#f59e0b',
    description: 'Maestros de escuela bíblica infantil, parvulitos y cuna',
  },
  {
    id: 'youth',
    name: 'Ministerio de Jóvenes',
    shortName: 'Jóvenes',
    color: '#3b82f6',
    description: 'Liderazgo juvenil, campamentos, discipulado y dinámicas',
  },
  {
    id: 'media',
    name: 'Multimedia, Audio & Video',
    shortName: 'Multimedia',
    color: '#06b6d4',
    description: 'Cabina de sonido, proyección, cámaras, streaming y redes',
  },
  {
    id: 'evangelism',
    name: 'Evangelismo & Misiones',
    shortName: 'Evangelismo',
    color: '#10b981',
    description: 'Brigadas de impacto comunitario, visitas a hospitales y misiones',
  },
  {
    id: 'intercession',
    name: 'Oración & Intercesión',
    shortName: 'Intercesión',
    color: '#8b5cf6',
    description: 'Vigilias, cadenas de oración y apoyo espiritual a congregantes',
  },
];
