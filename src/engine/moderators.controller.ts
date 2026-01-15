import {
  Controller,
  Post,
  Delete,
  Get,
  Req,
  Headers,
  Body,
} from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { ModeratorsService } from './moderators.service';
import {
  EngineAccessRoute,
  enforceEngineAccess,
} from '../common/guards/engine.guard';

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
  async list(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineAccessRoute.MODERATION_ACTIONS,
      );

      return this.mods.list(client, session.engine_id);
    });
  }

  @Post()
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

      enforceEngineAccess(
        { banned: false },
        session,
        EngineAccessRoute.ENGINE_MANAGEMENT,
      );

      return this.mods.add(client, {
        engineId: session.engine_id,
        userId: body.userId,
        addedBy: session.user_id,
      });
    });
  }

  @Delete()
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

      enforceEngineAccess(
        { banned: false },
        session,
        EngineAccessRoute.ENGINE_MANAGEMENT,
      );

      return this.mods.remove(client, {
        engineId: session.engine_id,
        userId: body.userId,
      });
    });
  }
}
