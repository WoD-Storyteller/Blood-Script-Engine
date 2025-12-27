import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { DiceService } from '../rules/dice.service';
import { HungerService } from '../rules/hunger.service';
import { CombatService } from '../combat/combat.service';
import { CombatActionType } from '../combat/combat.types';
import { TenetsService } from '../safety/tenets.service';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly dice: DiceService,
    private readonly hunger: HungerService,
    private readonly combat: CombatService,
    private readonly tenets: TenetsService,
  ) {}

  async run(
    client: any,
    input: {
      engineId: string;
      sceneId: string;
      userId: string;
      content: string;
    },
  ) {
    const tenetCheck = await this.tenets.checkTenets(client, {
      engineId: input.engineId,
      content: input.content,
    });

    if (!tenetCheck.allowed) {
      await client.query(
        `
        INSERT INTO tenet_violation_attempts
          (attempt_id, engine_id, user_id, scene_id, tenet_id, category)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          uuid(),
          input.engineId,
          input.userId,
          input.sceneId,
          tenetCheck.tenetId,
          tenetCheck.category,
        ],
      );

      return {
        ok: false,
        publicMessage: 'That action violates a chronicle tenet.',
      };
    }

    const { roll, outcome } = this.dice.roll({ total: 6, hunger: 1 });
    const hungerEffect = this.hunger.getConsequence(outcome);

    return {
      ok: true,
      narration: `Resolved with ${roll.successes} successes.${hungerEffect ? ' ' + hungerEffect : ''}`,
    };
  }
}