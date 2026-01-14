/**
 * Masquerade decay and cover-up configuration.
 * Pure data, no side effects.
 */

export const MASQUERADE_DECAY = {
  passiveDecay: 1, // amount reduced during decay tick
};

export const MASQUERADE_COVERUPS = {
  minor: {
    reduction: 2,
    description: 'Local cleanup, bribery, intimidation.',
  },
  major: {
    reduction: 4,
    description: 'Media suppression, memory alteration, disappearances.',
  },
  extreme: {
    reduction: 6,
    description: 'Citywide blackout, mass cover-up, long-term consequences.',
  },
};