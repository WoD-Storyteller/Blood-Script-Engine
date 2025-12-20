import { Controller, Post, Get, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { enforceEngineAccess } from './engine.guard';

@Controller('engine/appeals')
export class AppealsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  // =========================
  // Submit appeal (ALLOWED)
  // =========================
  @Post()
  async submit(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { message: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engine = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );

      enforceEngineAccess(engine.rows[0], session, 'appeal');

      await client.query(
        `
        INSERT INTO engine_appeals (engine_id, submitted_by, message)
        VALUES ($1,$2,$3)
        `,
        [session.engine_id, session.user_id, body.message],
      );

      return { ok: true };
    });
  }

  // =========================
  // Owner: list appeals
  // =========================
  @Get()
  async list(
    @Req() req: Request,
    @Headers('authorization') auth: string,
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      // Owner check happens at router level
      const r = await client.query(
        `
        SELECT
          ea.appeal_id,
          ea.message,
          ea.created_at,
          ea.resolved,
          u.display_name
        FROM engine_appeals ea
        JOIN users u ON u.user_id = ea.submitted_by
        ORDER BY ea.created_at DESC
        `,
      );

      return { appeals: r.rows };
    });
  }
}