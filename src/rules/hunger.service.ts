import { Injectable } from '@nestjs/common';
import { RollOutcome } from './dice.types';

@Injectable()
export class HungerService {
  getConsequence(outcome: RollOutcome): string | null {
    switch (outcome) {
      case 'messy_critical':
        // Source: rules-source/v5_core_clean.txt p.207 (messy criticals twist success into bestial outcomes).
        return 'Your Beast surges forward, twisting your success into something feral.';
      case 'bestial_failure':
        // Source: rules-source/v5_core_clean.txt p.207 (bestial failures manifest the Beast’s destructive impulse).
        return 'Your Beast takes control, driving you toward a destructive impulse.';
      default:
        return null;
    }
  }
}
