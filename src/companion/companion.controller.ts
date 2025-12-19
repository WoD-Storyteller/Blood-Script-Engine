import { Controller, Get, Post, Headers, Body, Param } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';
import { StAdminService } from './st-admin.service';

@Controller('companion')
export class CompanionController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
    private readonly characters: CharactersService,
    private readonly coteries: CoteriesService,
    private readonly st: StAdminService,
  ) {}

  @Post('login')
  async login(
    @Body()
    body: {
      userId: string;
      engineId: string;
      role: 'player' | 'st' | 'admin';
    },
  ) {
    return this.db.withClient(async (client: any) => {
      const session = await this.auth.createSession(client, {
        userId: body.userId,
        engineId: body.engineId,
        role: body.role,
      });

      return {
        token: session.token,
        expiresAt: session.expiresAt,
      };
    });
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    const token = this.getToken(authHeader);
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
  async world(@Headers('authorization') authHeader?: string) {
    const token = this.getToken(authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  // ─────────────────────────────────────────────
  // STEP 9: CHARACTERS (read-only)
  // ─────────────────────────────────────────────

  @Get('characters')
  async listCharacters(@Headers('authorization') authHeader?: string) {
    const token = this.getToken(authHeader);
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
  async getCharacter(@Headers('authorization') authHeader: string, @Param('id') id: string) {
    const token = this.getToken(authHeader);
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
  // STEP 9: COTERIES (read-only)
  // ─────────────────────────────────────────────

  @Get('coteries')
  async listCoteries(@Headers('authorization') authHeader?: string) {
    const token = this.getToken(authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const rows = await this.coteries.listCoteries(client, session.engine_id);
      return { coteries: rows };
    });
  }

  @Get('coteries/:id')
  async getCoterie(@Headers('authorization') authHeader: string, @Param('id') id: string) {
    const token = this.getToken(authHeader);
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
  // STEP 10: ST / ADMIN CONTROLS (write)
  // ─────────────────────────────────────────────

  @Post('st/map')
  async stSetMap(@Headers('authorization') authHeader: string, @Body() body: { url: string }) {
    const token = this.getToken(authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      await this.st.setMapUrl(client, { engineId: session.engine_id, url: body.url });

      // Return updated dashboard snapshot
      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }

  @Post('st/clock/create')
  async stCreateClock(
    @Headers('authorization') authHeader: string,
    @Body()
    body: { title: string; segments: number; nightly?: boolean; description?: string },
  ) {
    const token = this.getToken(authHeader);
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
    @Headers('authorization') authHeader: string,
    @Body() body: { clockIdPrefix: string; amount: number; reason: string },
  ) {
    const token = this.getToken(authHeader);
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
    @Headers('authorization') authHeader: string,
    @Body() body: { title: string; synopsis?: string },
  ) {
    const token = this.getToken(authHeader);
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
    @Headers('authorization') authHeader: string,
    @Body() body: { arcIdPrefix: string; status: 'planned' | 'active' | 'completed' | 'cancelled'; outcome?: string },
  ) {
    const token = this.getToken(authHeader);
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
  async stListIntents(@Headers('authorization') authHeader: string) {
    const token = this.getToken(authHeader);
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
  async stApproveIntent(@Headers('authorization') authHeader: string, @Param('id') id: string) {
    const token = this.getToken(authHeader);
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
  async stRejectIntent(@Headers('authorization') authHeader: string, @Param('id') id: string) {
    const token = this.getToken(authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      if (!this.isStOrAdmin(session.role)) return { error: 'Forbidden' };

      const ok = await this.st.setIntentStatus(client, { engineId: session.engine_id, intentId: id, status: 'rejected' });
      return { ok };
    });
  }

  private getToken(authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    return token && token.length ? token : null;
  }

  private isStOrAdmin(role: string) {
    const r = String(role).toLowerCase();
    return r === 'st' || r === 'admin';
  }
}