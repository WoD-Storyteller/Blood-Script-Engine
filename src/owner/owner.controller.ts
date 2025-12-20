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
  // List engines + safety + strikes
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

          -- Safety
          COUNT(se.event_id) FILTER (WHERE se.type='red') AS red_total,
          COUNT(se.event_id) FILTER (WHERE se.type='red' AND se.resolved=true) AS red_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type='red' AND se.resolved=false) AS red_unresolved,

          COUNT(se.event_id) FILTER (WHERE se.type='yellow') AS yellow_total,
          COUNT(se.event_id) FILTER (WHERE se.type='yellow' AND se.resolved=true) AS yellow_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type='yellow' AND se.resolved=false) AS yellow_unresolved,

          COUNT(se.event_id) FILTER (WHERE se.type='green') AS green_total,

          -- Strikes
          COUNT(es.strike_id) AS strike_count,

          -- Auto highlight flags
          BOOL_OR(se.type='red' AND se.resolved=false) AS has_unresolved_red,
          BOOL_OR(se.type='yellow' AND se.resolved=false) AS has_unresolved_yellow

        FROM engines e
        LEFT JOIN safety_events se ON se.engine_id = e.engine_id
        LEFT JOIN engine_strikes es ON es.engine_id = e.engine_id
        GROUP BY e.engine_id
        ORDER BY e.created_at DESC
        `,
      );

      return { engines: r.rows };
    });
  }

  // =========================
  // Issue strike (AUTO BAN AT 3)
  // =========================
  @Post('issue-strike')
  async issueStrike(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { engineId: string; reason?: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      // Insert strike
      await client.query(
        `
        INSERT INTO engine_strikes (engine_id, issued_by, reason)
        VALUES ($1,$2,$3)
        `,
        [body.engineId, session.user_id, body.reason ?? 'Safety violation'],
      );

      // Count strikes
      const countRes = await client.query(
        `SELECT COUNT(*)::int AS c FROM engine_strikes WHERE engine_id=$1`,
        [body.engineId],
      );

      const strikeCount = countRes.rows[0].c;

      // Auto-ban at 3 strikes
      if (strikeCount >= 3) {
        await client.query(
          `
          UPDATE engines
          SET banned=true,
              banned_reason='Automatically banned after 3 strikes',
              banned_at=now(),
              banned_by=$2
          WHERE engine_id=$1
            AND banned=false
          `,
          [body.engineId, session.user_id],
        );
      }

      return {
        ok: true,
        strikes: strikeCount,
        autoBanned: strikeCount >= 3,
      };
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