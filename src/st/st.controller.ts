import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';

import { EngineRole } from '../common/enums/engine-role.enum';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { enforceEngineAccess } from '../engine/engine.guard';
import { StService } from './st.service';

@Controller('companion/st')
export class StController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly st: StService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('force-compulsion')
  async forceCompulsion(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      characterId: string;
      compulsion: string;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engineRes = await client.query(
        `SELECT banned FROM engines WHERE engine_id=$1`,
        [session.engine_id],
      );
      if (!engineRes.rowCount) return { error: 'EngineNotFound' };

      enforceEngineAccess(
        engineRes.rows[0],
        session,
        EngineRole.STORYTELLER,
      );

      await this.st.forceCompulsion(
        session.engine_id,
        body.characterId,
        body.compulsion,
      );

      return { ok: true };
    });
  }

  @Post('set-hunger')
  async setHunger(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      characterId: string;
      hunger: number;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      await this.st.adjustHunger(
        session.engine_id,
        body.characterId,
        body.hunger,
      );

      return { ok: true };
    });
  }

  @Post('set-humanity')
  async setHumanity(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      characterId: string;
      humanity: number;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      await this.st.adjustHumanity(
        session.engine_id,
        body.characterId,
        body.humanity,
      );

      return { ok: true };
    });
  }

  @Post('emit-test')
  async emitTest(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      event: string;
      payload?: any;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    const session = await this.auth.validateTokenRaw(token);
    if (!session) return { error: 'Unauthorized' };

    enforceEngineAccess(
      { banned: false },
      session,
      EngineRole.STORYTELLER,
    );

    await this.st.emitTestEvent(
      session.engine_id,
      body.event,
      body.payload ?? {},
    );

    return { ok: true };
  }
}
