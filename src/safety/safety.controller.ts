import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { SafetyThresholdService } from './safety-threshold.service';
import { enforceEngineAccess } from '../engine/engine.guard';

@Controller('safety')
export class SafetyController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly safetyThreshold: SafetyThresholdService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('card')
  async create(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { type: 'red' | 'yellow' | 'green' },
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

      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      await client.query(
        `
        INSERT INTO safety_events (engine_id, type, resolved)
        VALUES ($1,$2,false)
        `,
        [session.engine_id, body.type],
      );

      await this.safetyThreshold.check(session.engine_id);

      return { ok: true };
    });
  }

  @Post('resolve')
  async resolve(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { eventId: string },
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

      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      await client.query(
        `
        UPDATE safety_events
        SET resolved=true
        WHERE event_id=$1
        `,
        [body.eventId],
      );

      await this.safetyThreshold.check(session.engine_id);

      return { ok: true };
    });
  }
}