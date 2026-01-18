import { Injectable } from '@nestjs/common';

@Injectable()
export class WillpowerService {
  canReroll(current: number): boolean {
    return current > 0;
  }

  applyRerollPenalty(current: number): number {
    if (current <= 0) return current;
    return current - 1;
  }

  getMaxRerollDice(): number {
    // Source: rules-source/v5_core_clean.txt p.122 (spend 1 Willpower to re-roll up to three regular dice).
    return 3;
  }

  canRerollChecks(): boolean {
    // Source: rules-source/v5_core_clean.txt p.122 (characters may not re-roll checks with Willpower).
    return false;
  }

  rerollRegularDice(current: number, dice: number[], indices: number[]) {
    if (current <= 0 || indices.length === 0) {
      return { nextWillpower: current, dice, rerolled: [] as number[] };
    }

    const limited = indices.slice(0, this.getMaxRerollDice());
    const rerolled: number[] = [];
    const updated = [...dice];

    for (const index of limited) {
      if (index < 0 || index >= updated.length) continue;
      const next = this.rollDie();
      updated[index] = next;
      rerolled.push(next);
    }

    // Source: rules-source/v5_core_clean.txt p.122 (Willpower only re-rolls regular dice, not Hunger dice).
    return { nextWillpower: this.applyRerollPenalty(current), dice: updated, rerolled };
  }

  applyDamage(current: number, amount: number): number {
    return Math.max(0, current - amount);
  }

  recover(current: number, max: number, amount: number): number {
    return Math.min(max, current + amount);
  }

  private rollDie(): number {
    return Math.floor(Math.random() * 10) + 1;
  }
}
