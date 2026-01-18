export type FeedingSource = 'animal' | 'bagged' | 'human';

export type BloodPotencyFeedingRules = {
  animalBaggedSlakeMultiplier: number;
  humanSlakePenalty: number;
  minHungerAfterHumanFeedingWithoutKill?: number;
};

export type BloodPotencyRule = {
  level: number;
  bloodSurgeDice: number;
  mendingSuperficialPerRouse: number;
  disciplineBonusDice: number;
  disciplineRouseMaxLevel: number;
  feeding: BloodPotencyFeedingRules;
};

export const MAX_BLOOD_POTENCY = 10;

export const BLOOD_POTENCY_RULES: Record<number, BloodPotencyRule> = {
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 0 row).
  0: {
    level: 0,
    bloodSurgeDice: 1,
    mendingSuperficialPerRouse: 1,
    disciplineBonusDice: 0,
    disciplineRouseMaxLevel: 0,
    feeding: {
      animalBaggedSlakeMultiplier: 1,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 1 row).
  1: {
    level: 1,
    bloodSurgeDice: 2,
    mendingSuperficialPerRouse: 1,
    disciplineBonusDice: 0,
    disciplineRouseMaxLevel: 1,
    feeding: {
      animalBaggedSlakeMultiplier: 1,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 2 row).
  2: {
    level: 2,
    bloodSurgeDice: 2,
    mendingSuperficialPerRouse: 2,
    disciplineBonusDice: 1,
    disciplineRouseMaxLevel: 1,
    feeding: {
      animalBaggedSlakeMultiplier: 0.5,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 3 row).
  3: {
    level: 3,
    bloodSurgeDice: 3,
    mendingSuperficialPerRouse: 2,
    disciplineBonusDice: 1,
    disciplineRouseMaxLevel: 2,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 4 row).
  4: {
    level: 4,
    bloodSurgeDice: 3,
    mendingSuperficialPerRouse: 3,
    disciplineBonusDice: 2,
    disciplineRouseMaxLevel: 2,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 1,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 5 row).
  5: {
    level: 5,
    bloodSurgeDice: 4,
    mendingSuperficialPerRouse: 3,
    disciplineBonusDice: 2,
    disciplineRouseMaxLevel: 3,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 1,
      minHungerAfterHumanFeedingWithoutKill: 2,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 6 row).
  6: {
    level: 6,
    bloodSurgeDice: 4,
    mendingSuperficialPerRouse: 3,
    disciplineBonusDice: 3,
    disciplineRouseMaxLevel: 3,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 7 row).
  7: {
    level: 7,
    bloodSurgeDice: 5,
    mendingSuperficialPerRouse: 3,
    disciplineBonusDice: 3,
    disciplineRouseMaxLevel: 4,
    feeding: {
      animalBaggedSlakeMultiplier: 1,
      humanSlakePenalty: 2,
      minHungerAfterHumanFeedingWithoutKill: 2,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 8 row).
  8: {
    level: 8,
    bloodSurgeDice: 5,
    mendingSuperficialPerRouse: 4,
    disciplineBonusDice: 4,
    disciplineRouseMaxLevel: 4,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 0,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 9 row).
  9: {
    level: 9,
    bloodSurgeDice: 6,
    mendingSuperficialPerRouse: 4,
    disciplineBonusDice: 4,
    disciplineRouseMaxLevel: 5,
    feeding: {
      animalBaggedSlakeMultiplier: 1,
      humanSlakePenalty: 2,
      minHungerAfterHumanFeedingWithoutKill: 3,
    },
  },
  // Source: rules-source/v5_core_clean.txt p.216 Blood Potency table (Blood Potency 10 row).
  10: {
    level: 10,
    bloodSurgeDice: 6,
    mendingSuperficialPerRouse: 5,
    disciplineBonusDice: 5,
    disciplineRouseMaxLevel: 5,
    feeding: {
      animalBaggedSlakeMultiplier: 0,
      humanSlakePenalty: 3,
      minHungerAfterHumanFeedingWithoutKill: 3,
    },
  },
};
