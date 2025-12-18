export interface DicePool {
  total: number;        // total dice rolled
  hunger: number;       // hunger dice (0–5)
}

export interface DiceRoll {
  successes: number;
  tens: number;
  ones: number;
  hungerTens: number;
  hungerOnes: number;
  raw: number[];
  rawHunger: number[];
}

export type RollOutcome =
  | 'success'
  | 'failure'
  | 'critical'
  | 'messy_critical'
  | 'bestial_failure';
