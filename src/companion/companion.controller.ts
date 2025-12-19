import { Controller, Get, Post, Headers, Body, Param } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';
import { CharactersService } from './characters.service';
import { CoteriesService } from './coteries.service';

@Controller('companion')
export class CompanionController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
    private readonly characters: CharactersService,
    private readonly coteries: CoteriesService,
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
    const token = authHeader?.replace('Bearer ', '');
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
    const token = authHeader?.replace('Bearer ', '');
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
    const token = authHeader?.replace('Bearer ', '');
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
    const token = authHeader?.replace('Bearer ', '');
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
    const token = authHeader?.replace('Bearer ', '');
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
    const token = authHeader?.replace('Bearer ', '');
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
}