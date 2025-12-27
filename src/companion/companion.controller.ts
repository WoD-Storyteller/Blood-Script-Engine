import {
  Controller,
  Get,
  Post,
  Headers,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';
import { StAdminService } from './st-admin.service';
import { SafetyEventsService } from './safety-events.service';
import { RealtimeService } from '../realtime/realtime.service';

import { EngineRole } from '../common/enums/engine-role.enum';
import {
  EngineAccessRoute,
  enforceEngineAccess,
} from '../engine/engine.guard';
import { SafetyLevel } from '../safety/safety.enums';
import { ArcStatus } from '../chronicle/arcs.enums';
import { isBotOwner } from '../owner/owner.guard';

@Controller('companion')
export class CompanionController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
    private readonly characters: CharactersService,
    private readonly coteries: CoteriesService,
    private readonly st: StAdminService,
    private readonly safety: SafetyEventsService,
    private readonly realtime: RealtimeService,
  ) {}

  private getToken(req: Request, authHeader?: string) {
    return req.cookies?.bse_token ?? authHeader?.replace('Bearer ', '');
  }

  private isStOrAdmin(role: any) {
    const r = String(role).toLowerCase();
    return r === EngineRole.ST || r === EngineRole.ADMIN;
  }

  // ─────────────────────────────────────────────
  // Identity / World
  // ─────────────────────────────────────────────

  @Get('me')
  async me(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT engine_id, banned, banned_reason FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      return {
        engine: engineRes.rows[0],
        userId: session.user_id,
        engineId: session.engine_id,
        role: session.role,
        discordUserId: session.discord_user_id,
        displayName: session.display_name,
      };
    });
  }

  @Get('world')
  async world(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT engine_id, name, banned, banned_reason, banned_at FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      const engine = engineRes.rows[0];

      if (engine.banned && !isBotOwner(session)) {
        return { engine };
      }

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  // ─────────────────────────────────────────────
  // Characters (read-only)
  // ─────────────────────────────────────────────

  @Get('characters')
  async listCharacters(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const rows = await this.characters.listCharacters(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
      });

      return { characters: rows };
    });
  }

  @Get('characters/:id')
  async getCharacter(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const character = await this.characters.getCharacter(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
        characterId: id,
      });

      return { character };
    });
  }

  // ─────────────────────────────────────────────
  // ST / Admin tools
  // ─────────────────────────────────────────────

  @Post('st/arc/status')
  async setArcStatus(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { arcId: string; status: ArcStatus | string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const status = body.status as ArcStatus;

      const arc = await this.st.setArcStatus(
        client,
        session.engine_id,
        body.arcId,
        status,
      );

      this.realtime.emitToEngine(session.engine_id, 'arc_updated', { arc });
      return { arc };
    });
  }

  // ─────────────────────────────────────────────
  // Safety
  // ─────────────────────────────────────────────

  @Post('safety/submit')
  async submitSafety(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { type: SafetyLevel; context?: any },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const out = await this.safety.submit(
        client,
        session.engine_id,
        session.user_id,
        body,
      );

      this.realtime.emitToEngine(session.engine_id, 'safety_event', out);
      return out;
    });
  }

  @Get('safety/active')
  async activeSafety(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const active = await this.safety.active(client, session.engine_id);
      return { active };
    });
  }

  @Post('safety/resolve/:id')
  async resolveSafety(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const out = await this.safety.resolve(client, session.engine_id, id);
      this.realtime.emitToEngine(session.engine_id, 'safety_event_resolved', out);
      return out;
    });
  }
}