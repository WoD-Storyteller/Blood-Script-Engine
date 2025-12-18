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
import { PrestigeService } from '../politics/prestige.service';

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
    private readonly prestige: PrestigeService,
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

      // Authority checks
      const isST = await this.isStoryteller(client, dto.engineId, userId);
      const isHarpy = await this.isHarpy(client, dto.engineId, userId);

      // ─────────────────────────────────────────────
      // H3: STATUS / PRESTIGE COMMANDS
      // ─────────────────────────────────────────────

      // !status board
      if (/^!status\s+board$/i.test(dto.content.trim())) {
        const result = await this.prestige.leaderboard(client, dto.engineId);
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !status me
      if (/^!status\s+me$/i.test(dto.content.trim())) {
        const score = await this.prestige.getScore(client, dto.engineId, userId);
        if (score === null) return { ok: true, sceneId, publicMessage: `Status ledger unavailable right now.` };
        return { ok: true, sceneId, publicMessage: `Your Status is **${score}**.` };
      }

      // !status @user
      const statusUser = dto.content.match(/^!status\s+<@!?(\d+)>$/i);
      if (statusUser) {
        const targetUserId = await this.upsertUserByDiscordId(client, statusUser[1]);
        const score = await this.prestige.getScore(client, dto.engineId, targetUserId);
        if (score === null) return { ok: true, sceneId, publicMessage: `Status ledger unavailable right now.` };
        return { ok: true, sceneId, publicMessage: `Status for <@${statusUser[1]}> is **${score}**.` };
      }

      // !status history @user
      const statusHistory = dto.content.match(/^!status\s+history\s+<@!?(\d+)>$/i);
      if (statusHistory) {
        const targetUserId = await this.upsertUserByDiscordId(client, statusHistory[1]);
        const result = await this.prestige.recentEvents(client, {
          engineId: dto.engineId,
          targetUserId,
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // Harpy/ST: award
      const statusAward = dto.content.match(/^!status\s+award\s+<@!?(\d+)>\s+(\d+)\s+"([^"]+)"$/i);
      if (statusAward) {
        if (!(isST || isHarpy)) {
          return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may adjust Status.' };
        }
        const targetDiscordId = statusAward[1];
        const amount = Number(statusAward[2]);
        const reason = statusAward[3];

        const targetUserId = await this.upsertUserByDiscordId(client, targetDiscordId);

        const result = await this.prestige.adjustScore(client, {
          engineId: dto.engineId,
          targetUserId,
          changedByUserId: userId,
          delta: amount,
          reason,
          authority: isST ? 'st' : 'harpy',
          harpyLimitPerAction: 2, // v1: Harpy can move status by max 2 each command
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // Harpy/ST: penalize
      const statusPen = dto.content.match(/^!status\s+penalize\s+<@!?(\d+)>\s+(\d+)\s+"([^"]+)"$/i);
      if (statusPen) {
        if (!(isST || isHarpy)) {
          return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may adjust Status.' };
        }
        const targetDiscordId = statusPen[1];
        const amount = Number(statusPen[2]);
        const reason = statusPen[3];

        const targetUserId = await this.upsertUserByDiscordId(client, targetDiscordId);

        const result = await this.prestige.adjustScore(client, {
          engineId: dto.engineId,
          targetUserId,
          changedByUserId: userId,
          delta: -Math.abs(amount),
          reason,
          authority: isST ? 'st' : 'harpy',
          harpyLimitPerAction: 2,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ST-only: set absolute
      const statusSet = dto.content.match(/^!status\s+set\s+<@!?(\d+)>\s+(-?\d+)\s+"([^"]+)"$/i);
      if (statusSet) {
        if (!isST) {
          return { ok: false, sceneId, publicMessage: 'Only Storytellers may set Status directly.' };
        }
        const targetDiscordId = statusSet[1];
        const newScore = Number(statusSet[2]);
        const reason = statusSet[3];

        const targetUserId = await this.upsertUserByDiscordId(client, targetDiscordId);

        const result = await this.prestige.setScore(client, {
          engineId: dto.engineId,
          targetUserId,
          changedByUserId: userId,
          newScore,
          reason,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // COURT / OFFICES (H1)
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
        const result = await this.offices.vacateOffice(client, { engineId: dto.engineId, office: officeVac[1].trim() });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // MOTIONS (H2)
      // ─────────────────────────────────────────────

      if (/^!motion\s+list$/i.test(dto.content.trim())) {
        const result = await this.motions.list(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const motionTimed = dto.content.match(/^!motion\s+propose\s+"([^"]+)"\s+in\s+(\d+)(?:\s+(.+))?$/i);
      if (motionTimed) {
        const result = await this.motions.propose(client, {
          engineId: dto.engineId,
          createdByUserId: userId,
          title: motionTimed[1].trim(),
          closesInMinutes: Number(motionTimed[2]),
          details: motionTimed[3]?.trim(),
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const motionPropose = dto.content.match(/^!motion\s+propose\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (motionPropose) {
        const result = await this.motions.propose(client, {
          engineId: dto.engineId,
          createdByUserId: userId,
          title: motionPropose[1].trim(),
          details: motionPropose[2]?.trim(),
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

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

      const motionClose = dto.content.match(/^!motion\s+close\s+([a-f0-9\-]{4,})$/i);
      if (motionClose) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can close motions.' };
        const result = await this.motions.close(client, { engineId: dto.engineId, motionIdPrefix: motionClose[1] });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // EXISTING: !as, !rest, !heal, !status/!sheet, boons/influence/domains
      // ─────────────────────────────────────────────

      const asMatch = dto.content.match(/^!as\s+(.+)$/i);
      if (asMatch) {
        const result = await this.charCtx.setActiveCharacter(client, dto.engineId, dto.channelId, userId, asMatch[1].trim());
        return { ok: result.ok, sceneId, publicMessage: result.message };
      }

      const character = await this.charCtx.getActiveCharacter(client, dto.engineId, dto.channelId, userId);

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

      if (/^!(status|sheet)$/i.test(dto.content.trim())) {
        if (!character) return { ok: false, sceneId, publicMessage: 'You have no active character in this scene.' };

        const s = await this.status.getStatus(client, { engineId: dto.engineId, characterId: character.character_id });
        const lines = [`**Hunger:** ${s.hunger}/5`, `**Health:** ${s.health}`, `**Willpower:** ${s.willpower}`];
        if (s.conditions.length) lines.push(`**Conditions:** ${s.conditions.join(', ')}`);
        return { ok: true, sceneId, publicMessage: lines.join('\n') };
      }

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

  private async isHarpy(client: any, engineId: string, userId: string): Promise<boolean> {
    try {
      const res = await client.query(
        `
        SELECT holder_user_id
        FROM court_offices
        WHERE engine_id = $1 AND office = 'Harpy' AND status = 'active'
        LIMIT 1
        `,
        [engineId],
      );
      return res.rowCount && res.rows[0].holder_user_id === userId;
    } catch {
      // If court table not migrated, Harpy power is unavailable (safe default)
      return false;
    }
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