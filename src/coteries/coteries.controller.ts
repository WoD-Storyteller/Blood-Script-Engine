import { Controller, Get, Post, Body, Param, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { CoteriesService } from './coteries.service';
import { EngineRole } from '../common/enums/engine-role.enum';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/coteries')
export class CoteriesController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly coteries: CoteriesService,
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

      const rows = await this.coteries.listCoteries(
        client,
        session.engine_id,
      );

      return { coteries: rows };
    });
  }

  @Post()
  async create(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { name: string; description?: string },
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

      if (session.role === EngineRole.PLAYER) return { error: 'Forbidden' };

      const out = await this.coteries.createCoterie(
        client,
        session.engine_id,
        body.name,
        body.description,
      );

      return out;
    });
  }

  @Post(':id/join')
  async join(
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

      await this.coteries.addMember(
        client,
        session.engine_id,
        id,
        session.user_id,
      );

      return { ok: true };
    });
  }

  @Post(':id/leave')
  async leave(
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

      await this.coteries.removeMember(
        client,
        session.engine_id,
        id,
        session.user_id,
      );

      return { ok: true };
    });
  }
}
