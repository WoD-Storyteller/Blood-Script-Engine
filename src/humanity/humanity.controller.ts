import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { HumanityService } from './humanity.service';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';

@Controller('companion/humanity')
export class HumanityController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly humanity: HumanityService,
  ) {}

  private token(req: Request) {
    return req.cookies?.bse_token ?? null;
  }

  @Post('stain')
  async addStain(
    @Req() req: Request,
    @Body() body: { reason: string; stains: number },
  ) {
    const token = this.token(req);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      enforceEngineAccess(
        { banned: false },
        session,
        EngineAccessRoute.STORYTELLER,
      );

      const r = await client.query(
        `
        SELECT character_id, sheet
        FROM characters
        WHERE engine_id=$1 AND is_active=true
        LIMIT 1
        `,
        [session.engine_id],
      );

      if (!r.rowCount) return { error: 'NoActiveCharacter' };

      let sheet = r.rows[0].sheet;
      sheet = this.humanity.applyStains(
        sheet,
        session.engine_id,
        body.reason,
        body.stains,
      );

      await client.query(
        `UPDATE characters SET sheet=$1 WHERE character_id=$2`,
        [sheet, r.rows[0].character_id],
      );

      return { ok: true, sheet };
    });
  }

  @Post('remorse')
  async resolveRemorse(@Req() req: Request) {
    const token = this.token(req);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const r = await client.query(
        `
        SELECT character_id, sheet
        FROM characters
        WHERE engine_id=$1 AND is_active=true
        LIMIT 1
        `,
        [session.engine_id],
      );

      if (!r.rowCount) return { error: 'NoActiveCharacter' };

      let sheet = r.rows[0].sheet;
      sheet = this.humanity.resolveRemorse(sheet, session.engine_id);

      await client.query(
        `UPDATE characters SET sheet=$1 WHERE character_id=$2`,
        [sheet, r.rows[0].character_id],
      );

      return { ok: true, sheet };
    });
  }
}
