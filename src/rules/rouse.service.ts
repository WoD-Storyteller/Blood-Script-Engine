import { Injectable } from '@nestjs/common';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';

@Injectable()
export class RouseService {
  constructor(
    private readonly bloodPotency: BloodPotencyService,
  ) {}

  /**
   * V5 rouse check: roll 1d10, success on 6+.
   * Return true if success (no hunger increase), false if fail (hunger +1).
   */
  rouse(bloodPotency = 0, disciplineLevel?: number): boolean {
    return this.rollRouseCheck({ bloodPotency, disciplineLevel }).success;
  }

  rollRouseCheck(input?: { bloodPotency?: number; disciplineLevel?: number }) {
    const dicePool = this.bloodPotency.getRouseDicePool(
      input?.bloodPotency ?? 0,
      input?.disciplineLevel,
    );

    const rolls = Array.from({ length: dicePool }, () => this.rollDie());
    const kept = Math.max(...rolls);

    return {
      success: kept >= 6,
      rolls,
      kept,
    };
  }

  private rollDie() {
    return Math.floor(Math.random() * 10) + 1;
  }
}
