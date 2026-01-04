import { Injectable } from '@nestjs/common';
import { CompulsionsService } from '../hunger/compulsions.service';
import { ResonanceService } from '../resonance/resonance.service';

export type V5RollResult = {
  pool: number;
  hunger: number;
  rolls: number[];
  hungerRolls: number[];
  successes: number;
  critical: boolean;
  messyCritical: boolean;
  bestialFailure: boolean;
  resonance: {
    resonance: string;
    dyscrasia: boolean;
  };
};

@Injectable()
export class DiceService {
  constructor(
    private readonly compulsions: CompulsionsService,
    private readonly resonance: ResonanceService,
  ) {}

  rollV5(
    pool: number,
    hunger: number,
    engineId?: string,
    characterId?: string,
  ): V5RollResult {
    const normalDice = Math.max(0, pool - hunger);
    const hungerDice = Math.max(0, hunger);

    const rolls = this.roll(normalDice);
    const hungerRolls = this.roll(hungerDice);

    const successes =
      this.countSuccesses(rolls) +
      this.countSuccesses(hungerRolls);

    const tens =
      rolls.filter((r) => r === 10).length +
      hungerRolls.filter((r) => r === 10).length;

    const hungerTens = hungerRolls.filter((r) => r === 10).length;
    const hungerOnes = hungerRolls.filter((r) => r === 1).length;

    const critical = tens >= 2;
    const messyCritical = critical && hungerTens > 0;
    const bestialFailure = successes === 0 && hungerOnes > 0;

    if (engineId && characterId) {
      if (messyCritical) {
        this.compulsions.triggerMessyCritical(engineId, characterId);
      }

      if (bestialFailure) {
        this.compulsions.triggerBestialFailure(engineId, characterId);
      }
    }

    return {
      pool,
      hunger,
      rolls,
      hungerRolls,
      successes,
      critical,
      messyCritical,
      bestialFailure,
      resonance: this.resonance.roll(hunger),
    };
  }

  private roll(n: number): number[] {
    return Array.from({ length: n }, () =>
      Math.floor(Math.random() * 10) + 1,
    );
  }

  private countSuccesses(rolls: number[]): number {
    return rolls.reduce((sum, r) => {
      if (r === 10) return sum + 2;
      if (r >= 6) return sum + 1;
      return sum;
    }, 0);
  }
}