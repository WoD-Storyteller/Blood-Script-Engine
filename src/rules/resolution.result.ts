import { RollOutcome } from './dice.types';

export interface ResolutionResult {
  successes: number;
  outcome: RollOutcome;
  hungerConsequence?: string;
  narrationHint: string;
}
