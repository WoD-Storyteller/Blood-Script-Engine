import { Controller, Get, Post, Headers, Body, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';
import { StAdminService } from './st-admin.service';
import { SafetyEventsService } from '../safety/safety-events.service';

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
  ) {}

  private getToken(req: Request, authHeader?: string) {
    const bearer = authHeader?.replace('Bearer ', '').trim();
    if (bearer) return bearer;
    const cookieToken = (req as any)?.cookies?.bse_token;
    return cookieToken && String(cookieToken).length ? String(cookieToken) : null;
  }

  private isStOrAdmin(role: string) {
    const r = String(role).toLowerCase();
    return r === 'st' || r === 'admin';
  }

  @Get('me')
  async me(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      return {
        userId: session.user_id,
        engineId: session.engine_id,
        role: session.role,
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

      const character = await this.characters.getCharacter(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
        characterId: id,
      });

      if (!character) return { error: 'Not found' };
      return { character };
    });
  }

  // ─────────────────────────────────────────────
  // Step 9: Coteries (read-only)
  // ─────────────────────────────────────────────

  @Get('coteries')
  async listCoteries(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

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

      const coterie = await this.coteries.getCoterie(client, {
        engineId: session.engine_id,
        coterieId: id,
      });

      if (!coterie) return { error: 'Not found' };
      return { coterie };
    });
  }

  // ─────────────────────────────────────────────
  // Step 10: ST/Admin controls (write)
  // ─────────────────────────────────────────────

  @Post('st/map')
  async stSetMap(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { url: string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.setMapUrl(client, { engineId: session.engine_id, url: body.url });
      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Post('st/clock/create')
  async stCreateClock(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { title: string; segments: number; nightly?: boolean; description?: string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.createClock(client, {
        engineId: session.engine_id,
        title: body.title,
        segments: body.segments,
        nightly: !!body.nightly,
        description: body.description,
        createdByUserId: session.user_id,
      });

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Post('st/clock/tick')
  async stTickClock(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { clockIdPrefix: string; amount: number; reason: string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.tickClock(client, {
        engineId: session.engine_id,
        clockIdPrefix: body.clockIdPrefix,
        amount: body.amount,
        reason: body.reason,
        tickedByUserId: session.user_id,
      });

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Post('st/arc/create')
  async stCreateArc(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { title: string; synopsis?: string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.createArc(client, {
        engineId: session.engine_id,
        title: body.title,
        synopsis: body.synopsis,
        createdByUserId: session.user_id,
      });

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Post('st/arc/status')
  async stSetArcStatus(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { arcIdPrefix: string; status: 'planned' | 'active' | 'completed' | 'cancelled'; outcome?: string },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.setArcStatus(client, {
        engineId: session.engine_id,
        arcIdPrefix: body.arcIdPrefix,
        status: body.status,
        outcome: body.outcome,
      });

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Get('st/intents')
  async stListIntents(@Req() req: Request, @Headers('authorization') authHeader: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const intents = await this.st.listIntents(client, session.engine_id);
      return { intents };
    });
  }

  @Post('st/intents/:id/approve')
  async stApproveIntent(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const ok = await this.st.setIntentStatus(client, { engineId: session.engine_id, intentId: id, status: 'approved' });
      return { ok };
    });
  }

  @Post('st/intents/:id/reject')
  async stRejectIntent(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const ok = await this.st.setIntentStatus(client, { engineId: session.engine_id, intentId: id, status: 'rejected' });
      return { ok };
    });
  }

  // ─────────────────────────────────────────────
  // Step 11: Safety (Stoplight)
  // ─────────────────────────────────────────────

  @Post('safety/submit')
  async submitSafety(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { level: 'red' | 'yellow' | 'green' },
  ) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      await this.safety.submit(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        level: body.level,
        source: 'companion',
      });

      await this.safety.escalationCheck(client, session.engine_id);
      return { ok: true };
    });
  }

  @Get('safety/active')
  async listActiveSafety(@Req() req: Request, @Headers('authorization') authHeader: string) {
    const token = this.getToken(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const events = await this.safety.listActive(client, session.engine_id);
      return { events };
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
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.safety.resolve(client, {
        engineId: session.engine_id,
        eventId: id,
        resolvedBy: session.user_id,
      });

      return { ok: true };
    });
  }
}