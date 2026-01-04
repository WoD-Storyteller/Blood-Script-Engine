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
import { ResonanceService } from '../resonance/resonance.service';
import { CompulsionsService } from '../hunger/compulsions.service';
import { HumanityService } from '../humanity/humanity.service';
import { FrenzyService } from '../hunger/frenzy.service';

@Controller('companion/dice')
export class DiceController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dice: DiceService,
    private readonly realtime: RealtimeService,
    private readonly resonance: ResonanceService,
    private readonly compulsions: CompulsionsService,
    private readonly humanity: HumanityService,
    private readonly frenzy: FrenzyService,
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
          SELECT
            character_id,
            (sheet->>'hunger')::int AS hunger
          FROM characters
          WHERE engine_id=$1
            AND owner_user_id=$2
            AND is_active=true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );

        if (r.rowCount) {
          hunger = r.rows[0].hunger ?? 0;
          characterId = r.rows[0].character_id;
        }
      }

      const result = this.dice.rollV5(
        Math.max(0, body.pool),
        Math.max(0, hunger),
      );

      // -----------------------------
      // BESTIAL FAILURE
      // -----------------------------
      if (result.bestialFailure && characterId) {
        const compulsion =
          await this.compulsions.triggerFromFailure(
            client,
            session.engine_id,
            characterId,
          );

        await this.humanity.recordStain(
          client,
          session.engine_id,
          characterId,
          'Bestial Failure',
        );

        await this.realtime.emitToEngine(
          session.engine_id,
          'bestial_failure',
          { characterId, compulsion },
        );
      }

      // -----------------------------
      // MESSY CRITICAL
      // -----------------------------
      if (result.messyCritical && characterId) {
        await this.resonance.applyMessyCritical(
          client,
          session.engine_id,
          characterId,
        );

        await this.realtime.emitToEngine(
          session.engine_id,
          'messy_critical',
          { characterId },
        );
      }

      // -----------------------------
      // HUNGER FRENZY THRESHOLD
      // -----------------------------
      if (hunger >= 5 && characterId) {
        await this.frenzy.triggerFrenzy(
          client,
          session.engine_id,
          characterId,
          'hunger',
        );

        await this.realtime.emitToEngine(
          session.engine_id,
          'frenzy',
          { characterId, type: 'hunger' },
        );
      }

      return {
        label: body.label ?? 'Roll',
        result,
      };
    });
  }
}