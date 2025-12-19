import { Controller, Get, Post, Body, Param, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { CharactersService } from './characters.service';

@Controller('companion/characters')
export class CharactersController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly characters: CharactersService,
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

      const characters = await this.characters.listCharacters(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
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

      const character = await this.characters.getCharacter(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
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

      await this.characters.setActiveCharacter(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        characterId: id,
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

      await this.characters.updateCharacterSheet(client, {
        engineId: session.engine_id,
        userId: session.user_id,
        role: session.role,
        characterId: id,
        sheet: body,
      });

      return { ok: true };
    });
  }
}