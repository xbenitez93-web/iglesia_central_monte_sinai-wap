import { RaffleItem, CustomSectionItem } from '../types';

/**
 * Identifies if a raffle is a demo/seed raffle that should not be shown.
 */
export function isDemoRaffle(r: any): boolean {
  if (!r || typeof r !== 'object') return false;

  const title = String(r.title || '').trim().toLowerCase();
  const id = String(r.id || '').toLowerCase();

  if (id.includes('demo') || id === 'raffle_demo') return true;

  const demoPhrases = [
    'gran sorteo pro-construcción del templo',
    'gran sorteo pro-construcción del santuario',
    'rifa benéfica instrumentos de alabanza',
    'sorteo canasta familiar día de la madre & familia',
    'sorteo canasta familiar día de la madre',
    'sorteo gratuito de bienvenida para nuevos & jóvenes',
    'sorteo gratuito de bienvenida',
    'sorteo demo',
    'rifa demo',
    '[demo]',
  ];

  return demoPhrases.some((phrase) => title.includes(phrase));
}

/**
 * Cleans demo raffles from custom sections and their subtabs.
 */
export function sanitizeCustomSectionsNoDemoRaffles(sections: CustomSectionItem[]): {
  cleaned: CustomSectionItem[];
  removedRaffleIds: string[];
} {
  const removedRaffleIds: string[] = [];
  if (!Array.isArray(sections)) return { cleaned: [], removedRaffleIds: [] };

  const cleaned = sections.map((sec) => {
    let hasChanges = false;
    let newRaffles = sec.rafflesData?.raffles;

    if (newRaffles && Array.isArray(newRaffles)) {
      const filtered = newRaffles.filter((r) => {
        if (isDemoRaffle(r)) {
          if (r.id) removedRaffleIds.push(r.id);
          hasChanges = true;
          return false;
        }
        return true;
      });
      newRaffles = filtered;
    }

    let newSubTabs = sec.subTabs;
    if (newSubTabs && Array.isArray(newSubTabs)) {
      newSubTabs = newSubTabs.map((st) => {
        if (st.rafflesData?.raffles && Array.isArray(st.rafflesData.raffles)) {
          const filtered = st.rafflesData.raffles.filter((r) => {
            if (isDemoRaffle(r)) {
              if (r.id) removedRaffleIds.push(r.id);
              hasChanges = true;
              return false;
            }
            return true;
          });
          if (filtered.length !== st.rafflesData.raffles.length) {
            hasChanges = true;
            return {
              ...st,
              rafflesData: {
                ...st.rafflesData,
                raffles: filtered,
              },
            };
          }
        }
        return st;
      });
    }

    if (hasChanges) {
      return {
        ...sec,
        rafflesData: sec.rafflesData ? { ...sec.rafflesData, raffles: newRaffles || [] } : undefined,
        subTabs: newSubTabs,
      };
    }
    return sec;
  });

  return { cleaned, removedRaffleIds };
}
