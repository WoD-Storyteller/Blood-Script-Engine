import { Injectable } from '@nestjs/common';
import { TenetsService } from '../safety/tenets.service';
import { CombatActionType } from '../combat/combat.types';
import { ResonanceService } from '../blood/resonance.service';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly tenets: TenetsService,
    private readonly resonance: ResonanceService,
  ) {}

  async resolve(client: any, engineId: string, input: any) {
    const tenetCheck = await this.tenets.evaluateTenets(client, {
      engineId,
      content: input.content,
      actorId: input.actorId,
      sceneId: input.sceneId,
    });

    if (!tenetCheck.allowed) {
      return {
        blocked: true,
        reason: tenetCheck.reason,
      };
    }

    /**
     * 🔌 AUTOMATIC DYSCRASIA WIRING
     *
     * If the action input includes a V5 roll result
     * and it is a messy critical, we escalate resonance.
     *
     * This keeps DiceService pure and makes the
     * pipeline the sole side-effect boundary.
     */
    if (input.rollResult?.messyCritical === true) {
      await this.resonance.applyMessyCritical(
        client,
        engineId,
        input.actorId,
      );
    }

    if (input.type === CombatActionType.ATTACK) {
      return {
        resolved: true,
        outcome: 'attack_resolved',
      };
    }

    return { resolved: true };
  }
}