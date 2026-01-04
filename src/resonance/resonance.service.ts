import { Injectable } from '@nestjs/common';
import { DiceService } from '../dice/dice.service';

export type ResonanceResult = {
  type: 'none' | 'fleeting' | 'intense';
  dyscrasia: boolean;
};

@Injectable()
export class ResonanceService {
  constructor(private readonly dice: DiceService) {}

  rollResonance(hunger: number): ResonanceResult {
    const roll = this.dice.rollV5(1, hunger);

    if (roll.bestialFailure) {
      return { type: 'none', dyscrasia: false };
    }

    if (roll.messyCritical) {
      return { type: 'intense', dyscrasia: true };
    }

    if (roll.successes > 0) {
      return { type: 'fleeting', dyscrasia: false };
    }

    return { type: 'none', dyscrasia: false };
  }
}
