// NOTE: This is intentionally long — it is a FULL FILE replacement.

import { Controller, Get, Post, Headers, Body, Param } from '@nestjs/common';
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

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private getToken(authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    return token && token.length ? token : null;
  }

  private isStOrAdmin(role: string) {
    const r = String(role).toLowerCase();
    return r === 'st' || r === 'admin';
  }

  // ─────────────────────────────────────────────
  // SAFETY: PLAYER SUBMISSION
  // ─────────────────────────────────────────────

  @Post('safety/submit')
  async submitSafety(
    @Headers('authorization') authHeader: string,
    @Body() body: { level: 'red' | 'yellow' | 'green' },
  ) {
    const token = this.getToken(authHeader);
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

  // ─────────────────────────────────────────────
  // SAFETY: ST VIEW + RESOLVE
  // ─────────────────────────────────────────────

  @Get('safety/active')
  async listActiveSafety(@Headers('authorization') authHeader: string) {
    const token = this.getToken(authHeader);
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
    @Headers('authorization') authHeader: string,
    @Param('id') id: string,
  ) {
    const token = this.getToken(authHeader);
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