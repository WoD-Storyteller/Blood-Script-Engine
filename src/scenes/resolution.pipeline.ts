import { Injectable } from '@nestjs/common';
import { CombatActionType } from '../combat/combat.types';
import { TenetsService } from '../safety/tenets.service';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly tenets: TenetsService,
  ) {}

  async run(client: any, input: {
    engineId: string;
    sceneId: string;
    channelId: string;
    userId: string;
    discordUserId: string;
    content: string;
    mentionedDiscordUserIds: string[];
  }) {
    // Tenet check
    const result = await this.tenets.checkContent(
      client,
      input.engineId,
      input.content,
      input.userId,
      input.sceneId,
    );

    if (!result.allowed) {
      return {
        ok: false,
        sceneId: input.sceneId,
        publicMessage: `⚠️ **Tenet violation**: ${result.tenetTitle}`,
      };
    }

    // Placeholder combat action example
    if (/^!attack\b/i.test(input.content)) {
      return {
        ok: true,
        sceneId: input.sceneId,
        combatAction: {
          type: CombatActionType.Attack,
          actorUserId: input.userId,
        },
      };
    }

    // Default passthrough
    return {
      ok: true,
      sceneId: input.sceneId,
    };
  }
}