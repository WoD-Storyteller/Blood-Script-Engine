import { Injectable } from '@nestjs/common';
import { RollOutcome } from './dice.types';

@Injectable()
export class HungerService {
  getConsequence(outcome: RollOutcome): string | null {
    switch (outcome) {
      case 'messy_critical':
        return 'Your Beast surges forward, twisting your success into something feral.';
      case 'bestial_failure':
        return 'Your Beast takes control, driving you toward a destructive impulse.';
      default:
        return null;
    }
  }
}
