import { Controller, Post, Body, Req, Headers, Get } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { XpService } from './xp.service';

@Controller('companion/xp')
export class XpController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly xp: XpService,
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
      type: string;
      current: number;
      reason: string;
    },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const cost = this.xp.cost({ type: body.type, current: body.current });
      const available = await this.xp.availableXp(client, session.engine_id, body.characterId);

      if (available < cost) {
        return { error: 'Insufficient XP', cost, available };
      }

      await this.xp.requestSpend(client, {
        engineId: session.engine_id,
        characterId: body.characterId,
        userId: session.user_id,
        amount: cost,
        reason: body.reason,
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
        SELECT * FROM xp_ledger
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

      await this.xp.approveSpend(client, body.xpId, session.user_id);
      return { ok: true };
    });
  }
}