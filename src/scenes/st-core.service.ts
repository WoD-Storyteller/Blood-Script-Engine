import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { withTransaction } from '../database/transactions';
import { uuid } from '../common/utils/uuid';
import { PlayerIntentDto } from './dto/player-intent.dto';
import { ResolutionPipeline } from './resolution.pipeline';
import { PresenceService } from './presence.service';
import { CharacterContextService } from './character-context.service';
import { StatusService } from './status.service';
import { RecoveryService } from './recovery.service';

import { BoonsService } from '../politics/boons.service';
import { FactionsService } from '../politics/factions.service';
import { DomainsService } from '../politics/domains.service';

@Injectable()
export class StCoreService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pipeline: ResolutionPipeline,
    private readonly presence: PresenceService,
    private readonly charCtx: CharacterContextService,
    private readonly status: StatusService,
    private readonly recovery: RecoveryService,
    private readonly boons: BoonsService,
    private readonly factions: FactionsService,
    private readonly domains: DomainsService,
  ) {}

  async handlePlayerIntent(dto: PlayerIntentDto) {
    return withTransaction(this.db, async (client) => {
      // ENGINE
      const engine = await client.query(
        `SELECT engine_id FROM engines WHERE engine_id = $1`,
        [dto.engineId],
      );
      if (!engine.rowCount) return { ok: false };

      // USER
      const userRow = await client.query(
        `SELECT user_id FROM users WHERE discord_user_id = $1`,
        [dto.discordUserId],
      );

      let userId: string;
      if (!userRow.rowCount) {
        userId = uuid();
        await client.query(
          `INSERT INTO users (user_id, discord_user_id, username) VALUES ($1,$2,$3)`,
          [userId, dto.discordUserId, dto.discordUserId],
        );
      } else {
        userId = userRow.rows[0].user_id;
      }

      // MEMBERSHIP
      await client.query(
        `
        INSERT INTO engine_memberships (engine_id, user_id, role, role_source)
        VALUES ($1,$2,'player','assigned')
        ON CONFLICT (engine_id, user_id) DO NOTHING
        `,
        [dto.engineId, userId],
      );

      // SCENE
      const sceneRes = await client.query(
        `
        SELECT scene_id
        FROM scenes
        WHERE engine_id = $1 AND channel_id = $2 AND state != 'archived'
        LIMIT 1
        `,
        [dto.engineId, dto.channelId],
      );

      let sceneId: string;
      if (!sceneRes.rowCount) {
        sceneId = uuid();
        await client.query(
          `
          INSERT INTO scenes (scene_id, engine_id, channel_id, state, tone_tags)
          VALUES ($1,$2,$3,'active','{}'::jsonb)
          `,
          [sceneId, dto.engineId, dto.channelId],
        );
      } else {
        sceneId = sceneRes.rows[0].scene_id;
      }

      // PARTICIPANT
      await client.query(
        `
        INSERT INTO scene_participants (engine_id, scene_id, participant_type, participant_id)
        VALUES ($1,$2,'user',$3)
        ON CONFLICT (scene_id, participant_id) DO NOTHING
        `,
        [dto.engineId, sceneId, userId],
      );

      // PRESENCE
      await this.presence.markUserOnline(client, dto.engineId, userId);

      // ACTIVE CHARACTER COMMAND
      const asMatch = dto.content.match(/^!as\s+(.+)$/i);
      if (asMatch) {
        const result = await this.charCtx.setActiveCharacter(
          client,
          dto.engineId,
          dto.channelId,
          userId,
          asMatch[1].trim(),
        );
        return { ok: result.ok, sceneId, publicMessage: result.message };
      }

      // Resolve active character (for status/heal/rest commands)
      const character = await this.charCtx.getActiveCharacter(
        client,
        dto.engineId,
        dto.channelId,
        userId,
      );

      // REST / HEAL
      if (/^!rest$/i.test(dto.content.trim())) {
        if (!character) return { ok: false, sceneId, publicMessage: 'You have no active character in this scene.' };
        const result = await this.recovery.rest(client, { engineId: dto.engineId, characterId: character.character_id });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!heal$/i.test(dto.content.trim())) {
        if (!character) return { ok: false, sceneId, publicMessage: 'You have no active character in this scene.' };
        const result = await this.recovery.heal(client, { engineId: dto.engineId, characterId: character.character_id });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // STATUS / SHEET
      if (/^!(status|sheet)$/i.test(dto.content.trim())) {
        if (!character) return { ok: false, sceneId, publicMessage: 'You have no active character in this scene.' };

        const s = await this.status.getStatus(client, {
          engineId: dto.engineId,
          characterId: character.character_id,
        });

        const lines = [
          `**Hunger:** ${s.hunger}/5`,
          `**Health:** ${s.health}`,
          `**Willpower:** ${s.willpower}`,
        ];
        if (s.conditions.length) lines.push(`**Conditions:** ${s.conditions.join(', ')}`);

        return { ok: true, sceneId, publicMessage: lines.join('\n') };
      }

      // ─────────────────────────────────────────────
      // BOONS COMMANDS
      // ─────────────────────────────────────────────

      // !boon give @user <level> "title" [details...]
      const boonGive = dto.content.match(/^!boon\s+give\s+<@!?(\d+)>\s+(trivial|minor|major|blood|life)\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (boonGive) {
        const targetDiscordId = boonGive[1];
        const level = boonGive[2].toLowerCase() as any;
        const title = boonGive[3];
        const details = boonGive[4];

        // upsert target user
        const targetUserRow = await client.query(
          `SELECT user_id FROM users WHERE discord_user_id = $1`,
          [targetDiscordId],
        );
        let targetUserId: string;
        if (!targetUserRow.rowCount) {
          targetUserId = uuid();
          await client.query(
            `INSERT INTO users (user_id, discord_user_id, username) VALUES ($1,$2,$3)`,
            [targetUserId, targetDiscordId, targetDiscordId],
          );
        } else {
          targetUserId = targetUserRow.rows[0].user_id;
        }

        // In this ledger model: FROM (debtor) -> TO (creditor)
        const result = await this.boons.giveBoon(client, {
          engineId: dto.engineId,
          fromUserId: userId,
          toUserId: targetUserId,
          level,
          title,
          details,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!boon\s+owed$/i.test(dto.content.trim())) {
        const result = await this.boons.listBoons(client, {
          engineId: dto.engineId,
          userId,
          mode: 'owed_to_me',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!boon\s+iowe$/i.test(dto.content.trim())) {
        const result = await this.boons.listBoons(client, {
          engineId: dto.engineId,
          userId,
          mode: 'i_owe',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonCall = dto.content.match(/^!boon\s+callin\s+([a-f0-9\-]{4,})$/i);
      if (boonCall) {
        const result = await this.boons.setBoonStatus(client, {
          engineId: dto.engineId,
          boonIdPrefix: boonCall[1],
          status: 'called_in',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonSettle = dto.content.match(/^!boon\s+settle\s+([a-f0-9\-]{4,})$/i);
      if (boonSettle) {
        const result = await this.boons.setBoonStatus(client, {
          engineId: dto.engineId,
          boonIdPrefix: boonSettle[1],
          status: 'settled',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonVoid = dto.content.match(/^!boon\s+void\s+([a-f0-9\-]{4,})$/i);
      if (boonVoid) {
        const result = await this.boons.setBoonStatus(client, {
          engineId: dto.engineId,
          boonIdPrefix: boonVoid[1],
          status: 'void',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // FACTIONS / INFLUENCE COMMANDS
      // ─────────────────────────────────────────────

      // !influence set "Faction Name" 12
      const inflSet = dto.content.match(/^!influence\s+set\s+"([^"]+)"\s+(-?\d+)$/i);
      if (inflSet) {
        const faction = inflSet[1].trim();
        const score = Number(inflSet[2]);
        const result = await this.factions.setInfluence(client, { engineId: dto.engineId, faction, score });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!influence\s+list$/i.test(dto.content.trim())) {
        const result = await this.factions.getInfluence(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // DOMAINS COMMANDS
      // ─────────────────────────────────────────────

      // !domain claim "Downtown" optional notes...
      const domClaim = dto.content.match(/^!domain\s+claim\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (domClaim) {
        const name = domClaim[1].trim();
        const notes = domClaim[2]?.trim();
        const result = await this.domains.claimDomain(client, {
          engineId: dto.engineId,
          name,
          claimedByUserId: userId,
          notes,
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!domain\s+list$/i.test(dto.content.trim())) {
        const result = await this.domains.listDomains(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // FALLBACK: normal ST core resolution
      return this.pipeline.run(client, {
        engineId: dto.engineId,
        sceneId,
        channelId: dto.channelId,
        userId,
        discordUserId: dto.discordUserId,
        content: dto.content,
        mentionedDiscordUserIds: dto.mentionedDiscordUserIds ?? [],
      });
    });
  }
}
