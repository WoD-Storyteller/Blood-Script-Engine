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
  rouse(
    bloodPotency = 0,
    disciplineLevel?: number,
    currentHunger?: number,
  ): boolean {
    return this.rollRouseCheck({
      bloodPotency,
      disciplineLevel,
      currentHunger,
    }).success;
  }

  rollRouseCheck(input?: {
    bloodPotency?: number;
    disciplineLevel?: number;
    currentHunger?: number;
    forced?: boolean;
  }) {
    const hunger = Math.max(0, Math.trunc(input?.currentHunger ?? 0));
    const forced = Boolean(input?.forced);

    // Source: rules-source/v5_core_clean.txt p.211 (Rouse Checks are a single die, success on 6+; failure adds 1 Hunger).
    // Source: rules-source/v5_core_clean.txt p.211 (Hunger gain is applied after the effect resolves).
    // Source: rules-source/v5_core_clean.txt p.211, p.216 (Blood Potency can allow a second die; keep the highest).
    // Source: rules-source/v5_core_clean.txt p.211 (cannot intentionally Rouse at Hunger 5; forced checks prompt a hunger frenzy test).
    if (hunger >= 5 && !forced) {
      return {
        blocked: true,
        success: false,
        rolls: [],
        kept: null,
        hungerGain: 0,
        requiresHungerFrenzyTest: false,
      };
    }

    const dicePool = this.bloodPotency.getRouseDicePool(
      input?.bloodPotency ?? 0,
      input?.disciplineLevel,
    );

    const rolls = Array.from({ length: dicePool }, () => this.rollDie());
    const kept = Math.max(...rolls);
    const success = kept >= 6;
    const hungerGain = success ? 0 : 1;

    return {
      blocked: false,
      success,
      rolls,
      kept,
      hungerGain,
      requiresHungerFrenzyTest: hunger >= 5 && forced,
    };
  }

  private rollDie() {
    return Math.floor(Math.random() * 10) + 1;
  }
}
