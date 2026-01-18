import { Injectable } from '@nestjs/common';
import { DicePool, DiceRoll, RollOutcome } from './dice.types';

@Injectable()
export class DiceService {
  roll(pool: DicePool): { roll: DiceRoll; outcome: RollOutcome } {
    const totalDice = Math.max(0, Math.trunc(pool.total));
    const hungerDice = Math.max(0, Math.min(Math.trunc(pool.hunger), totalDice));
    // Source: rules-source/v5_core_clean.txt p.205 (replace normal dice with Hunger dice; if Hunger exceeds pool, roll Hunger dice equal to the pool).
    const normalDice = Math.max(0, totalDice - hungerDice);

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

    // Source: rules-source/v5_core_clean.txt p.205 (6+ counts as a success).
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
      // Source: rules-source/v5_core_clean.txt p.205-206 (each pair of 10s adds +2 successes beyond the two successes).
      roll.successes += 2 * Math.floor(totalTens / 2);
    }

    // Outcome determination
    if (roll.successes === 0) {
      // Source: rules-source/v5_core_clean.txt p.207 (failed roll with a 1 on any Hunger die is a bestial failure).
      if (roll.hungerOnes > 0) return { roll, outcome: 'bestial_failure' };
      return { roll, outcome: 'failure' };
    }

    if (hasCritical) {
      // Source: rules-source/v5_core_clean.txt p.207 (critical with a 10 on a Hunger die is a messy critical).
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
