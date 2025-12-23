import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { DiceService } from './dice.service';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/dice')
export class DiceController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dice: DiceService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('roll')
  async roll(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      label?: string;
      pool: number;
      hunger?: number;
      useActiveCharacterHunger?: boolean;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      let hunger = body.hunger ?? 0;

      if (body.useActiveCharacterHunger) {
        const r = await client.query(
          `
          SELECT c.sheet->>'hunger' AS hunger
          FROM characters c
          WHERE c.engine_id=$1 AND c.owner_user_id=$2 AND c.is_active=true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );

        hunger = r.rowCount ? Number(r.rows[0].hunger ?? 0) : 0;
      }

      const result = this.dice.rollV5(
        Math.max(0, body.pool),
        Math.max(0, hunger),
      );

      return {
        label: body.label ?? 'Roll',
        result,
      };
    });
  }
}
