import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { ModeratorsService } from './moderators.service';
import {
  EngineAccessRoute,
  enforceEngineAccess,
} from './engine.guard';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('companion/engine/moderators')
export class ModeratorsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly mods: ModeratorsService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  private isOwnerOrAdmin(session: any) {
    const r = String(session?.role ?? '').toLowerCase();
    return r === EngineRole.OWNER || r === EngineRole.ADMIN;
  }

  private async enforceEngine(client: any, session: any) {
    const engineRes = await client.query(
      `SELECT engine_id FROM engines WHERE engine_id=$1`,
      [session.engine_id],
    );
    if (!engineRes.rowCount) throw new Error('EngineNotFound');
    enforceEngineAccess(
      engineRes.rows[0],
      session,
      EngineAccessRoute.ADMIN,
    );
  }

  @Get()
  async list(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      await this.enforceEngine(client, session);
      return this.mods.list(client, { engineId: session.engine_id });
    });
  }

  @Post('add')
  async add(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { userId: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      await this.enforceEngine(client, session);

      if (!this.isOwnerOrAdmin(session)) return { error: 'Forbidden' };

      await this.mods.add(client, {
        engineId: session.engine_id,
        userId: body.userId,
        addedBy: session.user_id,
      });

      return { ok: true };
    });
  }

  @Delete('remove')
  async remove(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { userId: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };
      await this.enforceEngine(client, session);

      if (!this.isOwnerOrAdmin(session)) return { error: 'Forbidden' };

      await this.mods.remove(client, {
        engineId: session.engine_id,
        userId: body.userId,
        removedBy: session.user_id,
      });

      return { ok: true };
    });
  }
}