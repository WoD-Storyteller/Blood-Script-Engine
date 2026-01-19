import {
  Controller,
  Post,
  Get,
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
import { NarrativeService } from '../narrative/narrative.service';

@Controller('companion/st')
export class StController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly st: StService,
    private readonly narrative: NarrativeService,
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

    const session = await this.db.withClient((client) =>
      this.auth.validateToken(client, token),
    );
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

  @Get('narrative/settings')
  async getNarrativeSettings(
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
        EngineRole.STORYTELLER,
      );

      const config = await this.narrative.getEngineConfig(
        client,
        session.engine_id,
      );
      const networks = await this.narrative.listNetworksForEngine(
        client,
        session.engine_id,
      );

      return {
        enabled: config.narrative_enabled ?? false,
        networks,
      };
    });
  }

  @Post('narrative/settings')
  async updateNarrativeSettings(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { enabled?: boolean },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    if (body.enabled === undefined) {
      return { error: 'MissingEnabled' };
    }

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      const config = await this.narrative.setEngineNarrativeEnabled(
        client,
        session.engine_id,
        body.enabled,
      );

      return { ok: true, config };
    });
  }

  @Post('narrative/network')
  async createNarrativeNetwork(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { name: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    const name = body.name?.trim();
    if (!name) return { error: 'MissingName' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      const network = await this.narrative.createNetwork(
        client,
        session.engine_id,
        name,
      );

      return { ok: true, network };
    });
  }

  @Post('narrative/network/join')
  async joinNarrativeNetwork(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { networkId: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    if (!body.networkId) return { error: 'MissingNetworkId' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      try {
        const network = await this.narrative.joinNetwork(
          client,
          session.engine_id,
          body.networkId,
        );
        return { ok: true, network };
      } catch (error) {
        if ((error as Error).message === 'NetworkNotFound') {
          return { error: 'NetworkNotFound' };
        }
        throw error;
      }
    });
  }

  @Post('narrative/network/leave')
  async leaveNarrativeNetwork(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { networkId: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    if (!body.networkId) return { error: 'MissingNetworkId' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      try {
        await this.narrative.leaveNetwork(
          client,
          session.engine_id,
          body.networkId,
        );
        return { ok: true };
      } catch (error) {
        if ((error as Error).message === 'NotMember') {
          return { error: 'NotMember' };
        }
        throw error;
      }
    });
  }

  @Post('narrative/broadcast')
  async broadcastNarrative(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      networkId: string;
      rumor: string;
      title?: string;
      tags?: string[];
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    const rumor = body.rumor?.trim();
    if (!body.networkId || !rumor) {
      return { error: 'MissingFields' };
    }

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineRole.STORYTELLER,
      );

      try {
        const result = await this.narrative.broadcastShadowEvent(
          client,
          session.engine_id,
          {
            networkId: body.networkId,
            rumor,
            title: body.title,
            tags: body.tags,
          },
        );
        return { ok: true, ...result };
      } catch (error) {
        const message = (error as Error).message;
        if (message === 'NarrativeDisabled') {
          return { error: 'NarrativeDisabled' };
        }
        if (message === 'NotMember') {
          return { error: 'NotMember' };
        }
        if (message === 'NetworkNotFound') {
          return { error: 'NetworkNotFound' };
        }
        throw error;
      }
    });
  }
}
