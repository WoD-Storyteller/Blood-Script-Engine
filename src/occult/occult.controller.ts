import { Controller, Get, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { OccultService } from './occult.service';
import { OccultDiscipline } from './occult.enums';
import { EngineRole } from '../common/enums/engine-role.enum';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/occult')
export class OccultController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly occult: OccultService,
  ) {}

  private token(req: Request, auth?: string) {
    return auth?.replace('Bearer ', '');
  }

  @Get('rituals')
  async rituals(@Req() req: Request, @Headers('authorization') auth?: string) {
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

      const rows = await this.occult.listRituals(client, session.engine_id);
      return { rituals: rows };
    });
  }

  @Post('rituals')
  async createRitual(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body()
    body: {
      name: string;
      discipline: OccultDiscipline;
      level: number;
      description?: string;
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
      enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);

      if (session.role === EngineRole.PLAYER) return { error: 'Forbidden' };

      const out = await this.occult.createRitual(
        client,
        session.engine_id,
        body.name,
        body.discipline,
        body.level,
        body.description,
      );

      return out;
    });
  }

  @Get('alchemy')
  async alchemy(@Req() req: Request, @Headers('authorization') auth?: string) {
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

      const rows = await this.occult.listAlchemy(client, session.engine_id);
      return { alchemy: rows };
    });
  }

  @Get('lore')
  async lore(@Req() req: Request, @Headers('authorization') auth?: string) {
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

      const rows = await this.occult.listLore(client, session.engine_id);
      return { lore: rows };
    });
  }
}
