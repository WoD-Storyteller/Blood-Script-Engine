/**
 * Centralized mapping rules.
 * This file contains NO side effects.
 */

export const BLOOD_TO_PRESSURE = {
  messyCritical: {
    si: 1,
    masquerade: 1,
  },
  bestialFailure: {
    si: 0,
    masquerade: 2,
  },
  dyscrasiaFormed: {
    si: 2,
    masquerade: 1,
  },
};

/**
 * Blood Potency warning thresholds for indirect pressure signals.
 * Source: rules-source/blood_potency.json (feeding penalties).
 * Source: rules-source/v5_core_clean.txt p.148 (higher Blood Potency means more powerful blood).
 * Source: rules-source/v5_core_clean.txt p.364 (SI attention escalates when the Masquerade slips).
 */
export type BloodPotencyPressureWarning = {
  minBloodPotency: number;
  key: string;
  risks: {
    masquerade?: string;
    siAttention?: string;
  };
};

export const BLOOD_POTENCY_PRESSURE_WARNINGS: BloodPotencyPressureWarning[] = [
  {
    minBloodPotency: 3,
    key: 'bagged_blood_useless',
    risks: {
      masquerade:
        'Bagged blood is useless at this potency; feeding from live vessels increases exposure.',
    },
  },
  {
    minBloodPotency: 4,
    key: 'human_only',
    risks: {
      masquerade:
        'Must feed from humans; repeated predation heightens Masquerade risk.',
    },
  },
  {
    minBloodPotency: 5,
    key: 'supernatural_only',
    risks: {
      masquerade:
        'Must feed from supernatural beings; scarce prey concentrates attention on feeding sites.',
      siAttention:
        'Powerful blood draws notice if the Masquerade slips, inviting Second Inquisition scrutiny.',
    },
  },
];
