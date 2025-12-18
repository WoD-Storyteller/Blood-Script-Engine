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

import { NightCycleService } from '../politics/night-cycle.service';
import { MasqueradeService } from '../threats/masquerade.service';

import { ArcsService } from '../chronicle/arcs.service';
import { ClocksService } from '../chronicle/clocks.service';

@Injectable()
export class StCoreService {
  constructor(
    private readonly db: DatabaseService,
    private readonly pipeline: ResolutionPipeline,
    private readonly presence: PresenceService,
    private readonly charCtx: CharacterContextService,
    private readonly status: StatusService,
    private readonly recovery: RecoveryService,
    private readonly nightCycle: NightCycleService,
    private readonly masquerade: MasqueradeService,
    private readonly arcs: ArcsService,
    private readonly clocks: ClocksService,
  ) {}

  async handlePlayerIntent(dto: PlayerIntentDto) {
    return withTransaction(this.db, async (client) => {
      // ENGINE CHECK
      const engineRes = await client.query(
        `SELECT engine_id FROM engines WHERE engine_id = $1`,
        [dto.engineId],
      );
      if (!engineRes.rowCount) return { ok: false };

      // NIGHTLY UPKEEP (H5/H6/H8)
      const night = await this.nightCycle.maybeRunNightly(client, dto.engineId);
      if (night.ran && night.message) {
        return { ok: true, sceneId: null, publicMessage: night.message };
      }

      // USER UPSERT
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

      // SCENE RESOLUTION
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

      await client.query(
        `
        INSERT INTO scene_participants (engine_id, scene_id, participant_type, participant_id)
        VALUES ($1,$2,'user',$3)
        ON CONFLICT (scene_id, participant_id) DO NOTHING
        `,
        [dto.engineId, sceneId, userId],
      );

      await this.presence.markUserOnline(client, dto.engineId, userId);

      // MASQUERADE PASSIVE SCAN (H6)
      await this.masquerade.passiveScan(client, {
        engineId: dto.engineId,
        channelId: dto.channelId,
        content: dto.content,
        userId,
      });

      // ST CHECK
      const isST = await this.isStoryteller(client, dto.engineId, userId);

      // ─────────────────────────────────────────────
      // H8: ARCS COMMANDS (ST ONLY)
      // ─────────────────────────────────────────────

      const arcCreate = dto.content.match(/^!arc\s+create\s+"([^"]+)"(?:\s+(.+))?$/i);
      if (arcCreate) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage arcs.' };
        const result = await this.arcs.createArc(client, {
          engineId: dto.engineId,
          title: arcCreate[1].trim(),
          synopsis: arcCreate[2]?.trim(),
          createdByUserId: userId,
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!arc\s+list$/i.test(dto.content.trim())) {
        const result = await this.arcs.listArcs(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const arcShow = dto.content.match(/^!arc\s+show\s+([a-f0-9\-]{4,})$/i);
      if (arcShow) {
        const result = await this.arcs.showArc(client, { engineId: dto.engineId, arcIdPrefix: arcShow[1] });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const arcStart = dto.content.match(/^!arc\s+start\s+([a-f0-9\-]{4,})$/i);
      if (arcStart) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage arcs.' };
        const result = await this.arcs.setStatus(client, { engineId: dto.engineId, arcIdPrefix: arcStart[1], status: 'active' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const arcComplete = dto.content.match(/^!arc\s+complete\s+([a-f0-9\-]{4,})\s+"([^"]+)"$/i);
      if (arcComplete) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage arcs.' };
        const result = await this.arcs.setStatus(client, {
          engineId: dto.engineId,
          arcIdPrefix: arcComplete[1],
          status: 'completed',
          outcome: arcComplete[2],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const arcCancel = dto.content.match(/^!arc\s+cancel\s+([a-f0-9\-]{4,})\s+"([^"]+)"$/i);
      if (arcCancel) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage arcs.' };
        const result = await this.arcs.setStatus(client, {
          engineId: dto.engineId,
          arcIdPrefix: arcCancel[1],
          status: 'cancelled',
          outcome: arcCancel[2],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // H8: CLOCKS COMMANDS (ST ONLY)
      // ─────────────────────────────────────────────

      // !clock create "Title" <segments> [nightly] [description...]
      const clockCreate = dto.content.match(/^!clock\s+create\s+"([^"]+)"\s+(\d+)(?:\s+(nightly))?(?:\s+(.+))?$/i);
      if (clockCreate) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage clocks.' };
        const result = await this.clocks.createClock(client, {
          engineId: dto.engineId,
          title: clockCreate[1].trim(),
          segments: Number(clockCreate[2]),
          nightly: !!clockCreate[3],
          description: clockCreate[4]?.trim(),
          createdByUserId: userId,
          scope: 'engine',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!clock\s+list$/i.test(dto.content.trim())) {
        const result = await this.clocks.listClocks(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const clockShow = dto.content.match(/^!clock\s+show\s+([a-f0-9\-]{4,})$/i);
      if (clockShow) {
        const result = await this.clocks.showClock(client, { engineId: dto.engineId, clockIdPrefix: clockShow[1] });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const clockTick = dto.content.match(/^!clock\s+tick\s+([a-f0-9\-]{4,})\s+(-?\d+)\s+"([^"]+)"$/i);
      if (clockTick) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can tick clocks.' };
        const result = await this.clocks.tickClock(client, {
          engineId: dto.engineId,
          clockIdPrefix: clockTick[1],
          amount: Number(clockTick[2]),
          reason: clockTick[3],
          tickedByUserId: userId,
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const clockNightly = dto.content.match(/^!clock\s+nightly\s+([a-f0-9\-]{4,})\s+(on|off)$/i);
      if (clockNightly) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage clocks.' };
        const result = await this.clocks.setNightly(client, {
          engineId: dto.engineId,
          clockIdPrefix: clockNightly[1],
          nightly: clockNightly[2].toLowerCase() === 'on',
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const clockLink = dto.content.match(
        /^!clock\s+link\s+([a-f0-9\-]{4,})\s+([a-f0-9\-]{4,})\s+"([^"]+)"(?:\s+(.+))?$/i,
      );
      if (clockLink) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can link clocks to arcs.' };
        const result = await this.clocks.linkClockToArc(client, {
          engineId: dto.engineId,
          clockIdPrefix: clockLink[1],
          arcIdPrefix: clockLink[2],
          onComplete: clockLink[3],
          notes: clockLink[4]?.trim(),
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // EXISTING CORE FLOW
      // ─────────────────────────────────────────────

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
}