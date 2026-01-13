import { Injectable } from '@nestjs/common';
import { TenetsService } from '../safety/tenets.service';
import { CombatActionType } from '../combat/combat.types';
import { ResonanceService } from '../resonance/resonance.service';
import { DyscrasiaEffects } from '../resonance/dyscrasia.effects';
import { ResonanceEffects } from '../resonance/resonance.effects';
import { DiceService } from '../dice/dice.service';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly tenets: TenetsService,
    private readonly resonance: ResonanceService,
    private readonly dyscrasia: DyscrasiaEffects,
    private readonly resonanceEffects: ResonanceEffects,
    private readonly dice: DiceService,
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
     * DY SCRASIA CLEANSING ACTION
     */
    if (input.type === 'CLEANSE_DYSCRASIA') {
      await this.resonance.cleanseDyscrasia(
        client,
        engineId,
        input.actorId,
      );

      return {
        resolved: true,
        outcome: 'dyscrasia_cleansed',
      };
    }

    /**
     * BUILD DISCIPLINE POOL
     */
    let pool = input.pool ?? 0;

    if (input.discipline && input.characterSheet) {
      pool += this.dyscrasia.getModifier({
        dyscrasiaType: input.characterSheet?.dyscrasia?.type ?? null,
        discipline: input.discipline,
      });

      pool += this.resonanceEffects.getModifier({
        resonanceType: input.characterSheet?.resonance?.type ?? null,
        resonanceIntensity:
          input.characterSheet?.resonance?.intensity ?? null,
        discipline: input.discipline,
      });
    }

    /**
     * ROLL (PURE)
     */
    const rollResult = this.dice.rollV5(
      pool,
      input.hunger ?? 0,
    );

    /**
     * BLOOD STATE ESCALATION
     */
    if (rollResult.messyCritical === true) {
      await this.resonance.applyMessyCritical(
        client,
        engineId,
        input.actorId,
      );
    }

    if (rollResult.bestialFailure === true) {
      await this.resonance.applyBestialFailure(
        client,
        engineId,
        input.actorId,
      );
    }

    /**
     * RESONANCE DECAY
     */
    if (
      rollResult.messyCritical !== true &&
      rollResult.bestialFailure !== true
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
        rollResult,
      };
    }

    return {
      resolved: true,
      rollResult,
    };
  }
}
