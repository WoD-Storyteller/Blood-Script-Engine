import { Injectable } from '@nestjs/common';

export type V5RollResult = {
  pool: number;
  hunger: number;
  rolls: number[];
  hungerRolls: number[];
  successes: number;
  critical: boolean;
  messyCritical: boolean;
  bestialFailure: boolean;
};

@Injectable()
export class DiceService {
  rollV5(pool: number, hunger: number): V5RollResult {
    const normalDice = Math.max(0, pool - hunger);
    const hungerDice = Math.max(0, hunger);

    const rolls = this.roll(normalDice);
    const hungerRolls = this.roll(hungerDice);

    const tens =
      rolls.filter((r) => r === 10).length +
      hungerRolls.filter((r) => r === 10).length;

    const hungerTens = hungerRolls.filter((r) => r === 10).length;
    const hungerOnes = hungerRolls.filter((r) => r === 1).length;

    const baseSuccesses =
      this.countSuccesses(rolls) +
      this.countSuccesses(hungerRolls);
    const criticalPairs = Math.floor(tens / 2);
    // rules-source/v5_core_clean.txt "Dice Pool Results" and "USING THE VAMPIRE DICE: REGULAR DICE":
    // each pair of 10s adds +2 successes beyond the two 10s (4 total for the pair).
    const successes = baseSuccesses + criticalPairs * 2;

    const critical = criticalPairs > 0;
    const messyCritical = critical && hungerTens > 0;
    const bestialFailure = successes === 0 && hungerOnes > 0;

    return {
      pool,
      hunger,
      rolls,
      hungerRolls,
      successes,
      critical,
      messyCritical,
      bestialFailure,
    };
  }

  private roll(n: number): number[] {
    return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
  }

  private countSuccesses(rolls: number[]): number {
    return rolls.reduce((sum, r) => {
      // rules-source/v5_core_clean.txt "Dice Pool Results": 10s are successes;
      // critical bonus is applied separately for each pair of 10s.
      if (r === 10) return sum + 1;
      if (r >= 6) return sum + 1;
      return sum;
    }, 0);
  }
}
