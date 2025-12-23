import { Controller, Post, Get, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { EngineAccessRoute, enforceEngineAccess } from './engine.guard';
import { isBotOwner } from '../owner/owner.guard';
import { OwnerDmService } from '../discord/owner-dm.service';

@Controller('engine/appeals')
export class AppealsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly ownerDm: OwnerDmService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  // ==================================================
  // Submit appeal (engine, appeal-only access)
  // ==================================================
  @Post()
  async submit(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { message: string },
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

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.APPEAL);

      await client.query(
        `
        INSERT INTO engine_appeals (engine_id, submitted_by, message)
        VALUES ($1,$2,$3)
        `,
        [session.engine_id, session.user_id, body.message],
      );

      // Owner DM notification
      await this.ownerDm.send(
        `📨 NEW ENGINE APPEAL\n\n` +
          `Engine: ${session.engine_id}\n` +
          `Submitted by: ${session.display_name}\n\n` +
          body.message,
      );

      return { ok: true };
    });
  }

  // ==================================================
  // Owner: list all appeals
  // ==================================================
  @Get()
  async list(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      const r = await client.query(
        `
        SELECT
          ea.appeal_id,
          ea.engine_id,
          ea.message,
          ea.created_at,
          ea.resolved,
          ea.resolution_reason,
          ea.owner_notes,
          u.display_name
        FROM engine_appeals ea
        JOIN users u ON u.user_id = ea.submitted_by
        ORDER BY ea.created_at DESC
        `,
      );

      return { appeals: r.rows };
    });
  }

  // ==================================================
  // Owner: resolve appeal (+ optional unban)
  // ==================================================
  @Post('resolve')
  async resolve(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      appealId: string;
      resolutionReason?: string;
      ownerNotes?: string;
      unban?: boolean;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      await client.query(
        `
        UPDATE engine_appeals
        SET resolved=true,
            resolved_at=now(),
            resolved_by=$2,
            resolution_reason=$3,
            owner_notes=$4
        WHERE appeal_id=$1
        `,
        [
          body.appealId,
          session.user_id,
          body.resolutionReason ?? 'Resolved by owner',
          body.ownerNotes ?? null,
        ],
      );

      if (body.unban) {
        await client.query(
          `
          UPDATE engines
          SET banned=false,
              banned_reason=NULL,
              banned_at=NULL,
              banned_by=NULL
          WHERE engine_id=(
            SELECT engine_id FROM engine_appeals WHERE appeal_id=$1
          )
          `,
          [body.appealId],
        );
      }

      return { ok: true };
    });
  }
}
