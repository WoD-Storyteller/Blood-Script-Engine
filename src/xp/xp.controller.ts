import { Controller, Post, Body, Req, Headers, Get } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { XpService } from './xp.service';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('companion/xp')
export class XpController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly xp: XpService,
    private readonly realtime: RealtimeService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('spend')
  async spend(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: {
      characterId: string;
      kind: 'skill' | 'attribute' | 'discipline' | 'blood_potency';
      key: string;
      current: number;
      reason: string;
    },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const kind = body.kind;
      const current = Number(body.current ?? 0);
      const key = String(body.key ?? '').trim();

      if (!kind) return { error: 'Missing kind' };
      if (kind !== 'blood_potency' && !key) return { error: 'Missing key' };

      const cost = this.xp.cost({ kind, current });
      const available = await this.xp.availableXp(client, session.engine_id, body.characterId);

      if (available < cost) {
        return { error: 'Insufficient XP', cost, available };
      }

      await this.xp.requestSpend(client, {
        engineId: session.engine_id,
        characterId: body.characterId,
        userId: session.user_id,
        amount: cost,
        reason: body.reason ?? '',
        meta: {
          kind,
          key: key || 'Blood Potency',
          from: Math.max(0, current),
          to: Math.max(0, current) + 1,
        },
      });

      return { ok: true, cost };
    });
  }

  @Get('pending')
  async pending(@Req() req: Request, @Headers('authorization') auth: string) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || session.role === 'player') return { error: 'Forbidden' };

      const res = await client.query(
        `
        SELECT xp_id, character_id, user_id, amount, reason, created_at, meta
        FROM xp_ledger
        WHERE engine_id=$1 AND type='spend' AND approved=false
        ORDER BY created_at
        `,
        [session.engine_id],
      );

      return { pending: res.rows };
    });
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

      // Apply the upgrade (idempotent)
      const out = await this.xp.approveAndApply(client, {
        xpId: body.xpId,
        approverId: session.user_id,
        engineId: session.engine_id,
      });

      // Realtime notify engine
      if (out?.ok) {
        this.realtime.emitToEngine(session.engine_id, 'xp_applied', {
          xpId: body.xpId,
          appliedTo: out.appliedTo ?? null,
          alreadyApplied: !!out.alreadyApplied,
          at: new Date().toISOString(),
        });

        // Tell clients to refetch the relevant character sheet
        if (out.appliedTo) {
          const xpRow = await client.query(
            `SELECT character_id FROM xp_ledger WHERE xp_id=$1 LIMIT 1`,
            [body.xpId],
          );
          if (xpRow.rowCount) {
            this.realtime.emitToEngine(session.engine_id, 'character_updated', {
              characterId: xpRow.rows[0].character_id,
              reason: 'xp_applied',
              at: new Date().toISOString(),
            });
          }
        }
      }

      return out;
    });
  }
}