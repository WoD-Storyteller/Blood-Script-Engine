export type TorporDurationUnit = 'days' | 'weeks' | 'months' | 'years' | 'decades' | 'centuries';

export type TorporDurationRule = {
  humanity: number;
  amount: number;
  unit: TorporDurationUnit;
  years: number;
};

const DAYS_PER_YEAR = 365;
const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

// Source: rules-source/v5_core_clean.txt p.240 (Humanity table: torpor length).
export const TORPOR_DURATION_RULES: Record<number, TorporDurationRule> = {
  9: { humanity: 9, amount: 3, unit: 'days', years: 3 / DAYS_PER_YEAR },
  8: { humanity: 8, amount: 1, unit: 'weeks', years: 1 / WEEKS_PER_YEAR },
  7: { humanity: 7, amount: 2, unit: 'weeks', years: 2 / WEEKS_PER_YEAR },
  6: { humanity: 6, amount: 1, unit: 'months', years: 1 / MONTHS_PER_YEAR },
  5: { humanity: 5, amount: 1, unit: 'years', years: 1 },
  4: { humanity: 4, amount: 1, unit: 'decades', years: 10 },
  3: { humanity: 3, amount: 5, unit: 'decades', years: 50 },
  2: { humanity: 2, amount: 1, unit: 'centuries', years: 100 },
  1: { humanity: 1, amount: 5, unit: 'centuries', years: 500 },
};

// Source: rules-source/v5_core_clean.txt p.215 (Blood Potency increases every 100 years while active).
export const BLOOD_POTENCY_ASCENSION_YEARS = 100;

// Source: rules-source/v5_core_clean.txt p.215 (Torpor loses Blood Potency at one level per 50 years).
export const BLOOD_POTENCY_TORPOR_DEGENERATION_YEARS = 50;

export const BLOOD_POTENCY_CLOCKS = {
  ascension: {
    id: 'ascension',
    name: 'Ascension',
    segments: BLOOD_POTENCY_ASCENSION_YEARS,
    description: 'Active years toward a Blood Potency increase.',
  },
  degeneration: {
    id: 'degeneration',
    name: 'Degeneration',
    segments: BLOOD_POTENCY_TORPOR_DEGENERATION_YEARS,
    description: 'Torpor years toward a Blood Potency loss.',
  },
} as const;

// Source: rules-source/v5_core_clean.txt p.223 (torpor entry triggers).
export const TORPOR_ENTRY_TRIGGERS = ['hunger', 'aggravated_damage', 'voluntary'] as const;

// Source: rules-source/v5_core_clean.txt p.223 (torpor ends when duration expires or fed).
export const TORPOR_EXIT_TRIGGERS = ['duration_elapsed', 'fed_vitae', 'stake_removed', 'mended'] as const;

// Source: rules-source/v5_core_clean.txt p.215 (blood potency ascends with years active, intense experiences, potent blood).
export const BLOOD_POTENCY_ASCENSION_TRIGGERS = [
  'active_years',
  'intense_experience',
  'potent_blood_exposure',
] as const;

// Source: rules-source/v5_core_clean.txt p.215 (torpor degrades blood potency over time).
export const BLOOD_POTENCY_DEGENERATION_TRIGGERS = ['torpor_years'] as const;

// Source: rules-source/v5_core_clean.txt p.234-235 (Committing diablerie).
export const DIABLERIE_TRIGGERS = ['diablerie_completed'] as const;
