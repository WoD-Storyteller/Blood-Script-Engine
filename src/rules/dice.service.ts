import { Injectable } from '@nestjs/common';
import { DicePool, DiceRoll, RollOutcome } from './dice.types';

@Injectable()
export class DiceService {
  roll(pool: DicePool): { roll: DiceRoll; outcome: RollOutcome } {
    const normalDice = pool.total - pool.hunger;
    const hungerDice = pool.hunger;

    const raw = this.rollDice(normalDice);
    const rawHunger = this.rollDice(hungerDice);

    const roll: DiceRoll = {
      raw,
      rawHunger,
      successes: 0,
      tens: 0,
      ones: 0,
      hungerTens: 0,
      hungerOnes: 0,
    };

    for (const d of raw) {
      if (d >= 6) roll.successes++;
      if (d === 10) roll.tens++;
      if (d === 1) roll.ones++;
    }

    for (const d of rawHunger) {
      if (d >= 6) roll.successes++;
      if (d === 10) roll.hungerTens++;
      if (d === 1) roll.hungerOnes++;
    }

    // Criticals (pairs of 10s)
    const totalTens = roll.tens + roll.hungerTens;
    const hasCritical = Math.floor(totalTens / 2) > 0;

    if (hasCritical) {
      roll.successes += 2 * Math.floor(totalTens / 2);
    }

    // Outcome determination
    if (roll.successes === 0) {
      if (roll.hungerOnes > 0) return { roll, outcome: 'bestial_failure' };
      return { roll, outcome: 'failure' };
    }

    if (hasCritical) {
      if (roll.hungerTens > 0) return { roll, outcome: 'messy_critical' };
      return { roll, outcome: 'critical' };
    }

    return { roll, outcome: 'success' };
  }

  private rollDice(count: number): number[] {
    return Array.from({ length: count }, () =>
      Math.floor(Math.random() * 10) + 1,
    );
  }
}
