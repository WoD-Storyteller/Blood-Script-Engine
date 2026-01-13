/**
 * Masquerade escalation thresholds.
 * Pure configuration, no side effects.
 */

export const MASQUERADE_EVENT_THRESHOLDS = [
  {
    pressure: 3,
    event: 'masquerade_warning',
    description: 'Rumors spread, authorities notice unusual behavior.',
  },
  {
    pressure: 6,
    event: 'masquerade_breach',
    description: 'Confirmed breach. Evidence circulates.',
  },
  {
    pressure: 9,
    event: 'city_lockdown',
    description: 'Law enforcement lockdown and curfews imposed.',
  },
  {
    pressure: 12,
    event: 'open_hunt',
    description: 'Open season declared. Masquerade failure imminent.',
  },
];
