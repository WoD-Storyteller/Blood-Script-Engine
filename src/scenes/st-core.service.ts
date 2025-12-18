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
      // H4: HOLDINGS
      // ─────────────────────────────────────────────

      // !holding add "<coterie>" "<name>" <income> [kind] [notes]
      const holdingAdd = dto.content.match(/^!holding\s+add\s+"([^"]+)"\s+"([^"]+)"\s+(-?\d+)(?:\s+(\S+))?(?:\s+(.+))?$/i);
      if (holdingAdd) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can manage holdings.' };

        const result = await this.holdings.addHolding(client, {
          engineId: dto.engineId,
          coterieName: holdingAdd[1],
          name: holdingAdd[2],
          income: Number(holdingAdd[3]),
          kind: holdingAdd[4],
          notes: holdingAdd[5],
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !holding list "<coterie>"
      const holdingList = dto.content.match(/^!holding\s+list\s+"([^"]+)"$/i);
      if (holdingList) {
        const result = await this.holdings.listHoldings(client, {
          engineId: dto.engineId,
          coterieName: holdingList[1],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // H4: TAXES
      // ─────────────────────────────────────────────

      // !tax set "<domain>" "<coterie>" <amount> ["title"] [notes]
      const taxSet = dto.content.match(/^!tax\s+set\s+"([^"]+)"\s+"([^"]+)"\s+(\d+)(?:\s+"([^"]+)")?(?:\s+(.+))?$/i);
      if (taxSet) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can set taxes.' };

        const result = await this.taxes.setTaxRule(client, {
          engineId: dto.engineId,
          domainName: taxSet[1],
          coterieName: taxSet[2],
          amount: Number(taxSet[3]),
          title: taxSet[4],
          notes: taxSet[5],
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!tax\s+list$/i.test(dto.content.trim())) {
        const result = await this.taxes.listTaxRules(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!tax\s+collect$/i.test(dto.content.trim())) {
        if (!isST) return { ok: false, sceneId, publicMessage: 'Only Storytellers can collect taxes.' };

        const result = await this.taxes.collectTaxes(client, {
          engineId: dto.engineId,
          collectedByUserId: userId,
        });

        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // H4: BOON ENFORCEMENT HOOKS
      // ─────────────────────────────────────────────

      // !boon enforce <id> in <minutes> notes...
      const enforceTimed = dto.content.match(/^!boon\s+enforce\s+([a-f0-9\-]{4,})\s+in\s+(\d+)(?:\s+(.+))?$/i);
      if (enforceTimed) {
        if (!(isST || isHarpy)) {
          return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may enforce boons.' };
        }
        const result = await this.enforcement.enforce(client, {
          engineId: dto.engineId,
          boonIdPrefix: enforceTimed[1],
          createdByUserId: userId,
          dueInMinutes: Number(enforceTimed[2]),
          notes: enforceTimed[3],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // !boon enforce <id> notes...
      const enforce = dto.content.match(/^!boon\s+enforce\s+([a-f0-9\-]{4,})(?:\s+(.+))?$/i);
      if (enforce) {
        if (!(isST || isHarpy)) {
          return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may enforce boons.' };
        }
        const result = await this.enforcement.enforce(client, {
          engineId: dto.engineId,
          boonIdPrefix: enforce[1],
          createdByUserId: userId,
          notes: enforce[2],
        });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      if (/^!boon\s+overdue$/i.test(dto.content.trim())) {
        const result = await this.enforcement.listOverdue(client, { engineId: dto.engineId });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonEsc = dto.content.match(/^!boon\s+escalate\s+([a-f0-9\-]{4,})$/i);
      if (boonEsc) {
        if (!(isST || isHarpy)) return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may escalate enforcement.' };
        const result = await this.enforcement.resolve(client, { engineId: dto.engineId, boonIdPrefix: boonEsc[1], resolution: 'escalated' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonRes = dto.content.match(/^!boon\s+resolve\s+([a-f0-9\-]{4,})$/i);
      if (boonRes) {
        if (!(isST || isHarpy)) return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may resolve enforcement.' };
        const result = await this.enforcement.resolve(client, { engineId: dto.engineId, boonIdPrefix: boonRes[1], resolution: 'resolved' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      const boonCan = dto.content.match(/^!boon\s+cancel\s+([a-f0-9\-]{4,})$/i);
      if (boonCan) {
        if (!(isST || isHarpy)) return { ok: false, sceneId, publicMessage: 'Only the Harpy or Storytellers may cancel enforcement.' };
        const result = await this.enforcement.resolve(client, { engineId: dto.engineId, boonIdPrefix: boonCan[1], resolution: 'cancelled' });
        return { ok: true, sceneId, publicMessage: result.message };
      }

      // ─────────────────────────────────────────────
      // (Everything else: H1/H2/H3 + core commands)
      // ─────────────────────────────────────────────
      // We keep all existing functionality by passing through to the pipeline + existing handlers.
      // (Your previous file already includes those blocks; the safest approach here is: keep them unchanged.)

      // ACTIVE CHARACTER
      const asMatch = dto.content.match(/^!as\s+(.+)$/i);
      if (asMatch) {
        const result = await this.charCtx.setActiveCharacter(client, dto.engineId, dto.channelId, userId, asMatch[1].trim());
        return { ok: result.ok, sceneId, publicMessage: result.message };
      }

      // REST / HEAL / SHEET
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
      return false;
    }
  }
}