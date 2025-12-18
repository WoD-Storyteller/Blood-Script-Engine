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
import { HoldingsService } from '../politics/holdings.service';
import { TaxService } from '../politics/tax.service';
import { BoonEnforcementService } from '../politics/boon-enforcement.service';
import { NightCycleService } from '../politics/night-cycle.service';
import { MasqueradeService } from '../threats/masquerade.service';

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
    private readonly holdings: HoldingsService,
    private readonly taxes: TaxService,
    private readonly enforcement: BoonEnforcementService,
    private readonly nightCycle: NightCycleService,
    private readonly masquerade: MasqueradeService,
  ) {}

  async handlePlayerIntent(dto: PlayerIntentDto) {
    return withTransaction(this.db, async (client) => {
      // ─────────────────────────────────────────────
      // ENGINE CHECK
      // ─────────────────────────────────────────────
      const engineRes = await client.query(
        `SELECT engine_id FROM engines WHERE engine_id = $1`,
        [dto.engineId],
      );
      if (!engineRes.rowCount) return { ok: false };

      // ─────────────────────────────────────────────
      // NIGHTLY UPKEEP (H5)
      // ─────────────────────────────────────────────
      const night = await this.nightCycle.maybeRunNightly(client, dto.engineId);
      if (night.ran && night.message) {
        return { ok: true, sceneId: null, publicMessage: night.message };
      }

      // ─────────────────────────────────────────────
      // USER UPSERT
      // ─────────────────────────────────────────────
      const userRow = await client.query(
        `SELECT user_id FROM users WHERE discord_user_id = $1`,
        [dto.discordUserId],
      );

      let userId: string;
      if (!userRow.rowCount) {
        userId = uuid();
        await client.query(
          `INSERT INTO users (user_id, discord_user_id, username)
           VALUES ($1,$2,$3)`,
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

      // ─────────────────────────────────────────────
      // SCENE RESOLUTION
      // ─────────────────────────────────────────────
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
        INSERT INTO scene_participants
          (engine_id, scene_id, participant_type, participant_id)
        VALUES ($1,$2,'user',$3)
        ON CONFLICT (scene_id, participant_id) DO NOTHING
        `,
        [dto.engineId, sceneId, userId],
      );

      await this.presence.markUserOnline(client, dto.engineId, userId);

      // ─────────────────────────────────────────────
      // MASQUERADE PASSIVE CHECK (H6)
      // ─────────────────────────────────────────────
      await this.masquerade.passiveScan(client, {
        engineId: dto.engineId,
        channelId: dto.channelId,
        content: dto.content,
        userId,
      });

      // ─────────────────────────────────────────────
      // COMMAND PIPELINE
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
}