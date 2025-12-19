import { Controller, Get, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { isBotOwner } from './owner.guard';

@Controller('owner')
export class OwnerController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  // =========================
  // List engines + safety stats
  // =========================
  @Get('engines')
  async listEngines(@Req() req: Request, @Headers('authorization') auth: string) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      const r = await client.query(
        `
        SELECT
          e.engine_id,
          e.name,
          e.banned,
          e.banned_reason,
          e.banned_at,

          -- RED
          COUNT(se.event_id) FILTER (WHERE se.type = 'red') AS red_total,
          COUNT(se.event_id) FILTER (WHERE se.type = 'red' AND se.resolved = true) AS red_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type = 'red' AND se.resolved = false) AS red_unresolved,

          -- YELLOW
          COUNT(se.event_id) FILTER (WHERE se.type = 'yellow') AS yellow_total,
          COUNT(se.event_id) FILTER (WHERE se.type = 'yellow' AND se.resolved = true) AS yellow_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type = 'yellow' AND se.resolved = false) AS yellow_unresolved,

          -- GREEN
          COUNT(se.event_id) FILTER (WHERE se.type = 'green') AS green_total

        FROM engines e
        LEFT JOIN safety_events se ON se.engine_id = e.engine_id
        GROUP BY e.engine_id
        ORDER BY e.created_at DESC
        `,
      );

      return { engines: r.rows };
    });
  }

  // =========================
  // Inspect single engine
  // =========================
  @Post('engine')
  async getEngine(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { engineId: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      const r = await client.query(
        `
        SELECT
          e.*,
          COUNT(c.character_id) AS character_count
        FROM engines e
        LEFT JOIN characters c ON c.engine_id = e.engine_id
        WHERE e.engine_id=$1
        GROUP BY e.engine_id
        `,
        [body.engineId],
      );

      if (!r.rowCount) return { error: 'NotFound' };
      return { engine: r.rows[0] };
    });
  }

  // =========================
  // Ban engine
  // =========================
  @Post('ban-engine')
  async banEngine(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { engineId: string; reason?: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      await client.query(
        `
        UPDATE engines
        SET banned=true,
            banned_reason=$2,
            banned_at=now(),
            banned_by=$3
        WHERE engine_id=$1
        `,
        [body.engineId, body.reason ?? 'Policy violation', session.user_id],
      );

      return { ok: true };
    });
  }

  // =========================
  // Unban engine
  // =========================
  @Post('unban-engine')
  async unbanEngine(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { engineId: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      await client.query(
        `
        UPDATE engines
        SET banned=false,
            banned_reason=NULL,
            banned_at=NULL,
            banned_by=NULL
        WHERE engine_id=$1
        `,
        [body.engineId],
      );

      return { ok: true };
    });
  }
}