import { Controller, Get, Post, Body, Param, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { HavensService } from './havens.service';
import { enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/havens')
export class HavensController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly havens: HavensService,
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
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      const rows = await this.havens.listHavens(client, session.engine_id);
      return { havens: rows };
    });
  }

  @Post()
  async create(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body()
    body: {
      name: string;
      description?: string;
      securityRating?: number;
    },
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
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      if (session.role === 'player') return { error: 'Forbidden' };

      const out = await this.havens.createHaven(
        client,
        session.engine_id,
        body.name,
        body.description,
        body.securityRating ?? 1,
      );

      return out;
    });
  }

  @Post(':id/assign/:characterId')
  async assign(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Param('id') havenId: string,
    @Param('characterId') characterId: string,
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
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      if (session.role === 'player') return { error: 'Forbidden' };

      await this.havens.assignToCharacter(
        client,
        session.engine_id,
        havenId,
        characterId,
      );

      return { ok: true };
    });
  }
}