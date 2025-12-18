import { Controller, Get, Post, Headers, Body } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';

@Controller('companion')
export class CompanionController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
  ) {}

  /**
   * Exchange a Discord-authenticated context for a companion session.
   * This assumes Discord auth has already validated the user and engine.
   */
  @Post('login')
  async login(
    @Body()
    body: {
      userId: string;
      engineId: string;
      role: 'player' | 'st' | 'admin';
    },
  ) {
    return this.db.withClient(async (client) => {
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

  /**
   * Validate token + return basic identity info
   */
  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      return {
        userId: session.user_id,
        engineId: session.engine_id,
        role: session.role,
      };
    });
  }

  /**
   * Read-only world dashboard
   */
  @Get('world')
  async world(@Headers('authorization') authHeader?: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }
}