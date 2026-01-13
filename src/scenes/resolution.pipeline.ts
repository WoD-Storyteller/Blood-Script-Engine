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
     * BLOOD STATE ESCALATION
     */
    if (input.rollResult?.messyCritical === true) {
      await this.resonance.applyMessyCritical(
        client,
        engineId,
        input.actorId,
      );
    }

    if (input.rollResult?.bestialFailure === true) {
      await this.resonance.applyBestialFailure(
        client,
        engineId,
        input.actorId,
      );
    }

    /**
     * RESONANCE DECAY
     *
     * If no blood-triggering outcome occurred,
     * resonance decays naturally at the end of
     * a resolved action.
     *
     * This models scene flow without requiring
     * explicit scene-end hooks.
     */
    if (
      input.rollResult &&
      input.rollResult.messyCritical !== true &&
      input.rollResult.bestialFailure !== true
    ) {
      await this.resonance.decayResonance(
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