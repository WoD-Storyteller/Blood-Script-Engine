/**
 * Second Inquisition escalation thresholds.
 * No side effects. Pure configuration.
 */

export const SI_EVENT_THRESHOLDS = [
  {
    heat: 3,
    event: 'si_surveillance',
    description: 'Suspicious activity detected. Assets monitored.',
  },
  {
    heat: 6,
    event: 'si_probe',
    description: 'Covert investigation and informant pressure.',
  },
  {
    heat: 9,
    event: 'si_raid',
    description: 'Armed raid on suspected vampire haven.',
  },
  {
    heat: 12,
    event: 'si_purge',
    description: 'Full-scale purge operation authorized.',
  },
];
