import { Injectable } from '@nestjs/common';
import { TenetsService } from '../safety/tenets.service';
import { CombatActionType } from '../combat/combat.types';

@Injectable()
export class ResolutionPipeline {
  constructor(private readonly tenets: TenetsService) {}

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

    if (input.type === CombatActionType.ATTACK) {
      return {
        resolved: true,
        outcome: 'attack_resolved',
      };
    }

    return { resolved: true };
  }
}