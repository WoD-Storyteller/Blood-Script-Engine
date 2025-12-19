import { Controller, Post, Body, Req, Headers, Get } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { XpService } from './xp.service';
import { RealtimeService } from '../realtime/realtime.service';
import { DiscordDmService } from '../discord/discord.dm.service';

@Controller('companion/xp')
export class XpController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly xp: XpService,
    private readonly realtime: RealtimeService,
    private readonly dm: DiscordDmService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('approve')
  async approve(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { xpId: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || session.role === 'player') return { error: 'Forbidden' };

      // Apply XP (idempotent)
      const out = await this.xp.approveAndApply(client, {
        xpId: body.xpId,
        approverId: session.user_id,
        engineId: session.engine_id,
      });

      if (!out?.ok) return out;

      // Fetch ledger + character info
      const r = await client.query(
        `
        SELECT
          x.amount,
          x.meta,
          x.discord_notified,
          c.name AS character_name,
          u.discord_user_id
        FROM xp_ledger x
        JOIN characters c ON c.character_id = x.character_id
        JOIN users u ON u.user_id = x.user_id
        WHERE x.xp_id=$1
        LIMIT 1
        `,
        [body.xpId],
      );

      if (r.rowCount) {
        const row = r.rows[0];

        // Realtime events
        this.realtime.emitToEngine(session.engine_id, 'xp_applied', {
          xpId: body.xpId,
          appliedTo: out.appliedTo ?? null,
          alreadyApplied: !!out.alreadyApplied,
          at: new Date().toISOString(),
        });

        this.realtime.emitToEngine(session.engine_id, 'character_updated', {
          characterId: out.appliedTo ? r.rows[0].character_id : null,
          reason: 'xp_applied',
          at: new Date().toISOString(),
        });

        // Discord DM (once)
        if (!row.discord_notified && row.discord_user_id) {
          const meta = row.meta || {};
          const upgrade =
            meta.kind === 'blood_potency'
              ? 'Blood Potency'
              : `${meta.kind}: ${meta.key} (${meta.from} → ${meta.to})`;

          await this.dm.sendXpAppliedDm({
            discordUserId: row.discord_user_id,
            characterName: row.character_name,
            upgrade,
            cost: row.amount,
          });

          await client.query(
            `
            UPDATE xp_ledger
            SET discord_notified=true, discord_notified_at=now()
            WHERE xp_id=$1
            `,
            [body.xpId],
          );
        }
      }

      return out;
    });
  }

  /* other endpoints unchanged (spend, pending) */
}