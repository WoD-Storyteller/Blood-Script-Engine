import { Controller, Get, Post, Body, Param, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { CharactersService } from './characters.service';
import { RealtimeService } from '../realtime/realtime.service';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/characters')
export class CharactersController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly characters: CharactersService,
    private readonly realtime: RealtimeService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Get()
  async list(@Req() req: Request, @Headers('authorization') auth?: string) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const characters = await this.characters.listCharacters(client, {
        engineId: session.engine_id,
        userId: session.user_id,
      });

      return { characters };
    });
  }

  @Get(':id')
  async get(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      const character = await this.characters.getCharacter(client, {
        characterId: id,
      });

      return { character };
    });
  }

  @Post(':id/active')
  async setActive(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      await this.characters.setActiveCharacter(client, {
        engineId: session.engine_id,
        channelId: 'companion',
        userId: session.user_id,
        characterId: id,
      });

      this.realtime.emitToEngine(session.engine_id, 'active_character_changed', {
        userId: session.user_id,
        characterId: id,
        at: new Date().toISOString(),
      });

      return { ok: true };
    });
  }

  @Post(':id/update')
  async update(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      await this.characters.updateSheet(client, {
        characterId: id,
        sheet: body,
      });

      this.realtime.emitToEngine(session.engine_id, 'character_updated', {
        characterId: id,
        reason: 'sheet_updated',
        at: new Date().toISOString(),
      });

      return { ok: true };
    });
  }
}
