import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { DiceService } from './dice.service';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';
import { RealtimeService } from '../realtime/realtime.service';

@Controller('companion/dice')
export class DiceController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dice: DiceService,
    private readonly realtime: RealtimeService,
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
      let characterId: string | null = null;

      if (body.useActiveCharacterHunger) {
        const r = await client.query(
          `
          SELECT character_id, (sheet->>'hunger')::int AS hunger
          FROM characters
          WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );

        if (r.rowCount) {
          hunger = Number(r.rows[0].hunger ?? 0);
          characterId = r.rows[0].character_id;
        }
      }

      const result = this.dice.rollV5(
        Math.max(0, body.pool),
        Math.max(0, hunger),
      );

      this.realtime.emitDiceResult(session.engine_id, {
        label: body.label ?? 'Roll',
        result,
        characterId,
        userId: session.user_id,
      });

      if (result.messyCritical || result.bestialFailure) {
        this.realtime.emitHungerEvent(session.engine_id, {
          characterId,
          type: result.messyCritical
            ? 'MESSY_CRITICAL'
            : 'BESTIAL_FAILURE',
          hunger,
        });
      }

      return {
        label: body.label ?? 'Roll',
        result,
      };
    });
  }
}