import { Injectable } from '@nestjs/common';
import { SafetyService } from '../safety/safety.service';
import { DiceService } from '../rules/dice.service';
import { HungerService } from '../rules/hunger.service';
import { uuid } from '../common/utils/uuid';
import { CombatService } from '../combat/combat.service';
import { DisciplineService } from '../rules/discipline.service';
import { RouseService } from '../rules/rouse.service';
import { CharacterContextService } from './character-context.service';

@Injectable()
export class ResolutionPipeline {
  constructor(
    private readonly safety: SafetyService,
    private readonly dice: DiceService,
    private readonly hunger: HungerService,
    private readonly combat: CombatService,
    private readonly disciplines: DisciplineService,
    private readonly rouse: RouseService,
    private readonly charCtx: CharacterContextService,
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
    // 0) Presence-gating (direct targeting via mentions)
    if (input.mentionedDiscordUserIds.length > 0) {
      const offline = await this.findOfflineTargets(client, input.engineId, input.mentionedDiscordUserIds);
      if (offline.length > 0) {
        return {
          ok: false,
          sceneId: input.sceneId,
          publicMessage: "That can’t resolve right now — one or more involved players aren’t present.",
        };
      }
    }

    // 1) Tenets
    const tenetCheck = await this.safety.checkTenets(client, {
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
        [uuid(), input.engineId, input.userId, input.sceneId, tenetCheck.tenetId, tenetCheck.category],
      );

      const warning = await this.safety.issueOrEscalateWarning(client, {
        engineId: input.engineId,
        userId: input.userId,
        category: tenetCheck.category,
        tenetTitle: tenetCheck.tenetTitle,
      });

      return {
        ok: false,
        sceneId: input.sceneId,
        dmWarning: warning.dmText,
        publicMessage: "That direction is outside this chronicle’s boundaries. The night moves elsewhere.",
      };
    }

    // 2) Active character
    const character = await this.charCtx.getActiveCharacter(
      client,
      input.engineId,
      input.channelId,
      input.userId,
    );

    let hunger = character?.hunger ?? 0;
    let basePool = 6;
    let disciplineNote: string | null = null;

    // 3) Discipline (bonus + rouse + hunger persistence)
    const detected = this.disciplines.detect(input.content);
    if (detected && character) {
      const dots = await this.charCtx.getDisciplineDots(client, character.character_id, detected);
      const profile = this.disciplines.buildProfile(detected as any, dots);
      disciplineNote = `${profile.name}: ${profile.notes}`;

      for (let i = 0; i < profile.rouseCost; i++) {
        const ok = this.rouse.rouse();
        if (!ok) hunger = Math.min(5, hunger + 1);
      }

      if (hunger !== character.hunger) {
        await this.charCtx.setHunger(client, character.character_id, hunger);
      }

      basePool += profile.diceBonus;
    }

    // 4) Combat detection
    const isCombat = /attack|strike|shoot|stab|fight|hit|slash|bite/i.test(input.content);

    if (isCombat && input.mentionedDiscordUserIds.length > 0) {
      // v1 target: first mentioned user
      const defender = await this.charCtx.getActiveCharacterByDiscordUser(
        client,
        input.engineId,
        input.channelId,
        input.mentionedDiscordUserIds[0],
      );

      const result = await this.combat.resolveExchange(client, {
        engineId: input.engineId,
        sceneId: input.sceneId,
        attackerPool: basePool,
        defenderPool: 5,
        hunger,
        attackerCharacterId: character?.character_id,
        defenderCharacterId: defender?.character_id,
        action: {
          actorUserId: input.discordUserId,
          actorCharacterId: character?.character_id ?? 'unknown',
          type: 'attack',
          description: input.content,
          targetCharacterId: defender?.character_id,
        },
      });

      await client.query(`UPDATE scenes SET updated_at = now() WHERE scene_id = $1`, [input.sceneId]);

      return {
        ok: true,
        sceneId: input.sceneId,
        narration: disciplineNote ? `${disciplineNote} ${result.narration}` : result.narration,
      };
    }

    // 5) Non-combat roll
    const { roll, outcome } = this.dice.roll({
      total: basePool,
      hunger: Math.min(5, Math.max(0, hunger)),
    });

    let narration = `The action resolves with ${roll.successes} successes.`;
    const hungerEffect = this.hunger.getConsequence(outcome);
    if (hungerEffect) narration += ` ${hungerEffect}`;
    if (disciplineNote) narration = `${disciplineNote} ${narration}`;

    await client.query(`UPDATE scenes SET updated_at = now() WHERE scene_id = $1`, [input.sceneId]);

    return { ok: true, sceneId: input.sceneId, narration };
  }

  private async findOfflineTargets(client: any, engineId: string, discordUserIds: string[]) {
    const users = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = ANY($1)`,
      [discordUserIds],
    );
    if (!users.rowCount) return [];

    const userIds = users.rows.map((r: any) => r.user_id);

    const chars = await client.query(
      `SELECT character_id FROM characters WHERE engine_id = $1 AND user_id = ANY($2)`,
      [engineId, userIds],
    );
    if (!chars.rowCount) return [];

    const charIds = chars.rows.map((r: any) => r.character_id);

    const presence = await client.query(
      `SELECT character_id, status FROM presence WHERE engine_id = $1 AND character_id = ANY($2)`,
      [engineId, charIds],
    );

    const status = new Map(presence.rows.map((r: any) => [r.character_id, r.status]));
    return charIds.filter((id) => !status.has(id) || status.get(id) === 'offline');
  }
}
