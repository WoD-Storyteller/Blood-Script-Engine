import { Injectable } from '@nestjs/common';
import { TenetsService } from '../safety/tenets.service';
import { CombatActionType } from '../combat/combat.types';
import { ResonanceService } from '../resonance/resonance.service';
import { DyscrasiaEffects } from '../resonance/dyscrasia.effects';
import { ResonanceEffects } from '../resonance/resonance.effects';
import { DiceService } from '../dice/dice.service';
import { ChroniclePressureService } from '../chronicle/chronicle-pressure.service';
import { BLOOD_TO_PRESSURE } from '../chronicle/chronicle-pressure.map';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly tenets: TenetsService,
    private readonly resonance: ResonanceService,
    private readonly dyscrasia: DyscrasiaEffects,
    private readonly resonanceEffects: ResonanceEffects,
    private readonly dice: DiceService,
    private readonly pressure: ChroniclePressureService,
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

    const rollResult = this.dice.rollV5(
      pool,
      input.hunger ?? 0,
    );

    const { dyscrasiaApplied } = await this.resonance.handleRollOutcome(
      client,
      engineId,
      input.actorId,
      rollResult,
    );

    if (rollResult.messyCritical === true) {
      await this.pressure.escalateSIHeat(
        client,
        engineId,
        BLOOD_TO_PRESSURE.messyCritical.si,
      );

      await this.pressure.escalateMasquerade(
        client,
        engineId,
        BLOOD_TO_PRESSURE.messyCritical.masquerade,
      );
    }

    if (rollResult.bestialFailure === true) {
      await this.pressure.escalateMasquerade(
        client,
        engineId,
        BLOOD_TO_PRESSURE.bestialFailure.masquerade,
      );
    }

    if (input.type === CombatActionType.ATTACK) {
      return {
        resolved: true,
        outcome: 'attack_resolved',
        rollResult,
        dyscrasiaEligible: dyscrasiaApplied,
      };
    }

    return {
      resolved: true,
      rollResult,
      dyscrasiaEligible: dyscrasiaApplied,
    };
  }
}
