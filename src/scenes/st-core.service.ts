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
import { OfficesService } from '../politics/offices.service';
import { MotionsService } from '../politics/motions.service';

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
    private readonly offices: OfficesService,
    private readonly motions: MotionsService,
  ) {}

  async handlePlayerIntent(dto: PlayerIntentDto) {
    return withTransaction(this.db, async (client) => {
      // ENGINE
      const engine = await client.query(
        `SELECT engine_id FROM engines WHERE engine_id = $1`,
        [dto.engineId],
      );
      if (!engine.rowCount) return { ok: false };

      // USER (upsert)
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

      // Helper: ST check
      const isST = await this.isStoryteller(client, dto.engineId, userId);

      // ─────────────────────────────────────────────
      // COURT / OFFICES
      // ─────────────────────────────────────────────

      if (/^!court\s+list$/i.test(dto.content.trim())) {
        const result = await this.offices.listCourt(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const officeSet = dto.content.match(/^!office\s+set\s+(.+?)\s+<@!?(\d+)>(?:\s+(.+))?$/i);
      if (officeSet) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can assign court offices.' };

        const office = officeSet[1].trim();
        const targetDiscordId = officeSet[2];
        const notes = officeSet[3]?.trim();
        const targetUserId = await this.upsertUserByDiscordId(client, targetDiscordId);

        const result = await this.offices.assignOffice(client, {
          engineId: dto.engineId,
          office,
          holderUserId: targetUserId,
          notes,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      const officeVac = dto.content.match(/^!office\s+vacate\s+(.+)$/i);
      if (officeVac) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can vacate court offices.' };

        const result = await this.offices.vacateOffice(client, {
          engineId: dto.engineId,
          office: officeVac[1].trim(),
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // ELYSIUM MOTIONS & VOTING
      // ─────────────────────────────────────────────

      // !motion list
      if (/^!motion\s+list$/i.test(dto.content.trim())) {
        const result = await this.motions.list(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !motion propose "Title" in 30 details...
      const motionTimed = dto.content.match(/^!motion\s+propose\s+"([^"]+)"\s+in\s+(\d+)(?:\s+(.+))?$/i);
      if (motionTimed) {
        const title = motionTimed[1].trim();
        const minutes = Number(motionTimed[2]);
        const details = motionTimed[3]?.trim();

        const result = await this.motions.propose(client, {
          engineId: dto.engineId,
          createdByUserId: userId,
          title,
          details,
          closesInMinutes: minutes,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !motion propose "Title" details...
      const motionPropose = dto.content.match(/^!motion\s+propose\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (motionPropose) {
        const title = motionPropose[1].trim();
        const details = motionPropose[2]?.trim();

        const result = await this.motions.propose(client, {
          engineId: dto.engineId,
          createdByUserId: userId,
          title,
          details,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !motion vote <id> yes|no|abstain
      const motionVote = dto.content.match(/^!motion\s+vote\s+([a-f0-9\-]{4,})\s+(yes|no|abstain)$/i);
      if (motionVote) {
        const result = await this.motions.vote(client, {
          engineId: dto.engineId,
          motionIdPrefix: motionVote[1],
          userId,
          vote: motionVote[2].toLowerCase() as any,
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !motion close <id> (ST only)
      const motionClose = dto.content.match(/^!motion\s+close\s+([a-f0-9\-]{4,})$/i);
      if (motionClose) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can close motions.' };

        const result = await this.motions.close(client, {
          engineId: dto.engineId,
          motionIdPrefix: motionClose[1],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // EXISTING COMMANDS (kept)
      // ─────────────────────────────────────────────

      // ACTIVE CHARACTER
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

        const s = await this.status.getStatus(client, { engineId: dto.engineId, characterId: character.character_id });
        const lines = [
          `**Hunger:** ${s.hunger}/5`,
          `**Health:** ${s.health}`,
          `**Willpower:** ${s.willpower}`,
        ];
        if (s.conditions.length) lines.push(`**Conditions:** ${s.conditions.join(', ')}`);
        return { ok: true, sceneId, publicMessage: lines.join('\n') };
      }

      // BOONS
      const boonGive = dto.content.match(
        /^!boon\s+give\s+<@!?(\d+)>\s+(trivial|minor|major|blood|life)\s+"([^"]+)"(?:\s+(.+))?$/i,
      );
      if (boonGive) {
        const targetUserId = await this.upsertUserByDiscordId(client, boonGive[1]);
        const result = await this.boons.giveBoon(client, {
          engineId: dto.engineId,
          fromUserId: userId,
          toUserId: targetUserId,
          level: boonGive[2].toLowerCase() as any,
          title: boonGive[3],
          details: boonGive[4],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!boon\s+owed$/i.test(dto.content.trim())) {
        const result = await this.boons.listBoons(client, { engineId: dto.engineId, userId, mode: 'owed_to_me' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!boon\s+iowe$/i.test(dto.content.trim())) {
        const result = await this.boons.listBoons(client, { engineId: dto.engineId, userId, mode: 'i_owe' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonCall = dto.content.match(/^!boon\s+callin\s+([a-f0-9\-]{4,})$/i);
      if (boonCall) {
        const result = await this.boons.setBoonStatus(client, { engineId: dto.engineId, boonIdPrefix: boonCall[1], status: 'called_in' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonSettle = dto.content.match(/^!boon\s+settle\s+([a-f0-9\-]{4,})$/i);
      if (boonSettle) {
        const result = await this.boons.setBoonStatus(client, { engineId: dto.engineId, boonIdPrefix: boonSettle[1], status: 'settled' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonVoid = dto.content.match(/^!boon\s+void\s+([a-f0-9\-]{4,})$/i);
      if (boonVoid) {
        const result = await this.boons.setBoonStatus(client, { engineId: dto.engineId, boonIdPrefix: boonVoid[1], status: 'void' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // INFLUENCE
      const inflSet = dto.content.match(/^!influence\s+set\s+"([^"]+)"\s+(-?\d+)$/i);
      if (inflSet) {
        const result = await this.factions.setInfluence(client, {
          engineId: dto.engineId,
          faction: inflSet[1].trim(),
          score: Number(inflSet[2]),
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!influence\s+list$/i.test(dto.content.trim())) {
        const result = await this.factions.getInfluence(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // DOMAINS
      const domClaim = dto.content.match(/^!domain\s+claim\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (domClaim) {
        const result = await this.domains.claimDomain(client, {
          engineId: dto.engineId,
          name: domClaim[1].trim(),
          claimedByUserId: userId,
          notes: domClaim[2]?.trim(),
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!domain\s+list$/i.test(dto.content.trim())) {
        const result = await this.domains.listDomains(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // FALLBACK: normal ST resolution
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

  private async isStoryteller(client: any, engineId: string, userId: string): Promise<boolean> {
    const res = await client.query(
      `SELECT role FROM engine_memberships WHERE engine_id = $1 AND user_id = $2 LIMIT 1`,
      [engineId, userId],
    );
    return res.rowCount && String(res.rows[0].role).toLowerCase() === 'st';
  }

  private async upsertUserByDiscordId(client: any, discordUserId: string): Promise<string> {
    const row = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = $1`,
      [discordUserId],
    );
    if (row.rowCount) return row.rows[0].user_id;

    const id = uuid();
    await client.query(
      `INSERT INTO users (user_id, discord_user_id, username) VALUES ($1,$2,$3)`,
      [id, discordUserId, discordUserId],
    );
    return id;
  }
}