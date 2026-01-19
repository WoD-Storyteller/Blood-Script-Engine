import { Controller, Get, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { v4 as uuid } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { isBotOwner } from './owner.guard';
import { BloodPotencyService } from '../blood-potency/blood-potency.service';
import { NarrativeService } from '../narrative/narrative.service';

@Controller('companion/owner')
export class OwnerController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly bloodPotency: BloodPotencyService,
    private readonly narrative: NarrativeService,
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

  @Post('blood-potency/override')
  async overrideBloodPotency(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { characterId: string; value: number; reason: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    const reason = body.reason?.trim();
    if (!reason) return { error: 'ReasonRequired' };

    const nextValue = Number(body.value);
    if (!Number.isFinite(nextValue)) return { error: 'InvalidValue' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      const characterRes = await client.query(
        `SELECT engine_id, sheet FROM characters WHERE character_id = $1`,
        [body.characterId],
      );
      if (!characterRes.rowCount) return { error: 'CharacterNotFound' };

      const { engine_id: engineId, sheet: storedSheet } = characterRes.rows[0];
      const baseSheet = storedSheet && typeof storedSheet === 'object' ? storedSheet : {};
      const updated = this.bloodPotency.applyBloodPotencyChange(baseSheet, {
        nextValue,
        reason: `owner_override: ${reason}`,
      });
      const mergedSheet = {
        ...baseSheet,
        bloodPotency: updated.bloodPotency,
        blood_potency: updated.blood_potency,
        bloodPotencyLog: updated.bloodPotencyLog,
      };

      await client.query(
        `UPDATE characters SET sheet = $2, updated_at = now() WHERE character_id = $1`,
        [body.characterId, JSON.stringify(mergedSheet)],
      );

      await client.query(
        `INSERT INTO owner_audit_log (audit_id, engine_id, action_type, reason)
         VALUES ($1, $2, $3, $4)`,
        [
          uuid(),
          engineId,
          'blood_potency_override',
          `${reason} (character ${body.characterId})`,
        ],
      );

      return { ok: true, bloodPotency: updated.bloodPotency };
    });
  }

  @Get('narrative/settings')
  async getNarrativeSettings(
    @Req() req: Request,
    @Headers('authorization') auth: string,
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      const enabled = await this.narrative.getGlobalToggle(client);

      return { enabled };
    });
  }

  @Post('narrative/settings')
  async updateNarrativeSettings(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { enabled?: boolean },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    if (body.enabled === undefined) return { error: 'MissingEnabled' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session || !isBotOwner(session)) return { error: 'Forbidden' };

      await this.narrative.setGlobalToggle(client, body.enabled);

      return { ok: true, enabled: body.enabled };
    });
  }
}
