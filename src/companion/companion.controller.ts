import { Controller, Get, Post, Headers, Body, Param, Req } from '@nestjs/common';
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
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';
import { SafetyLevel } from '../safety/safety.enums';
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
      const engine = engineRes.rows[0];

      return {
        engine,
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
        // Appeal-only mode: return minimal state so the app can route to the appeal form.
        return { engine };
      }

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  // ─────────────────────────────────────────────
  // Step 9: Characters (read-only)
  // ─────────────────────────────────────────────

  @Get('characters')
  async listCharacters(@Req() req: Request, @Headers('authorization') authHeader?: string) {
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
  // Step 10: Coteries (read-only)
  // ─────────────────────────────────────────────

  @Get('coteries')
  async listCoteries(@Req() req: Request, @Headers('authorization') authHeader?: string) {
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

      const rows = await this.coteries.listCoteries(client, session.engine_id);

      return { coteries: rows };
    });
  }

  @Get('coteries/:id')
  async getCoterie(
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

      const coterie = await this.coteries.getCoterie(client, {
        engineId: session.engine_id,
        coterieId: id,
      });

      return { coterie };
    });
  }

  // ─────────────────────────────────────────────
  // Step 11: ST/Admin tools
  // ─────────────────────────────────────────────

  @Post('st/map')
  async setMap(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { myMapsUrl: string },
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
      await this.st.setMap(client, session.engine_id, body.myMapsUrl);
      return { ok: true };
    });
  }

  @Post('st/clock/create')
  async createClock(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: any,
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

      const clock = await this.st.createClock(client, session.engine_id, body);
      this.realtime.emitToEngine(session.engine_id, 'clock_created', { clock });
      return { clock };
    });
  }

  @Post('st/clock/tick')
  async tickClock(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { clockId: string; delta?: number },
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

      const out = await this.st.tickClock(client, session.engine_id, body.clockId, body.delta ?? 1);
      this.realtime.emitToEngine(session.engine_id, 'clock_ticked', out);
      return out;
    });
  }

  @Post('st/arc/create')
  async createArc(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: any,
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

      const arc = await this.st.createArc(client, session.engine_id, body);
      this.realtime.emitToEngine(session.engine_id, 'arc_created', { arc });
      return { arc };
    });
  }

  @Post('st/arc/status')
  async setArcStatus(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { arcId: string; status: string },
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

      const arc = await this.st.setArcStatus(client, session.engine_id, body.arcId, body.status);
      this.realtime.emitToEngine(session.engine_id, 'arc_updated', { arc });
      return { arc };
    });
  }

  @Get('st/intents')
  async listIntents(@Req() req: Request, @Headers('authorization') authHeader?: string) {
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

      const intents = await this.st.listIntents(client, session.engine_id);
      return { intents };
    });
  }

  @Post('st/intents/:id/approve')
  async approveIntent(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: any,
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

      const out = await this.st.approveIntent(client, session.engine_id, id);
      this.realtime.emitToEngine(session.engine_id, 'intent_updated', out);
      return out;
    });
  }

  @Post('st/intents/:id/reject')
  async rejectIntent(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
    @Body() body: any,
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

      const out = await this.st.rejectIntent(client, session.engine_id, id, body?.reason);
      this.realtime.emitToEngine(session.engine_id, 'intent_updated', out);
      return out;
    });
  }

  // ─────────────────────────────────────────────
  // Safety (companion endpoints)
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

      const out = await this.safety.submit(client, session.engine_id, session.user_id, body);
      this.realtime.emitToEngine(session.engine_id, 'safety_event', out);
      return out;
    });
  }

  @Get('safety/active')
  async activeSafety(@Req() req: Request, @Headers('authorization') authHeader?: string) {
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
