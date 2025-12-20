import { Controller, Get, Post, Delete, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { ModeratorsService } from './moderators.service';
import { enforceEngineAccess } from './engine.guard';

@Controller('engine/moderators')
export class ModeratorsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly mods: ModeratorsService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Get()
  async list(@Req() req: Request, @Headers('authorization') auth?: string) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async client => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      if (session.role !== 'st') return { error: 'Forbidden' };

      const moderators = await this.mods.list(client, session.engine_id);
      return { moderators };
    });
  }

  @Post()
  async add(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { userId: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async client => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      if (session.role !== 'st') return { error: 'Forbidden' };

      await this.mods.add(client, {
        engineId: session.engine_id,
        userId: body.userId,
      });

      return { ok: true };
    });
  }

  @Delete()
  async remove(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: { userId: string },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async client => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };
      enforceEngineAccess(engineRes.rows[0], session, 'normal');

      if (session.role !== 'st') return { error: 'Forbidden' };

      await this.mods.remove(client, {
        engineId: session.engine_id,
        userId: body.userId,
      });

      return { ok: true };
    });
  }
}