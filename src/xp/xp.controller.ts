import { Controller, Post, Body, Req, Headers, Get, Query } from '@nestjs/common';
import type { Request } from 'express';

import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { XpService } from './xp.service';
import { RealtimeService } from '../realtime/realtime.service';
import { DiscordDmService } from '../discord/discord.dm.service';
import { EngineAccessRoute, enforceEngineAccess } from '../engine/engine.guard';
import { EngineRole } from '../common/enums/engine-role.enum';
import { XpKind } from './xp.enums';

function asInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

@Controller('companion/xp')
export class XpController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly xp: XpService,
    private readonly realtime: RealtimeService,
    private readonly dm: DiscordDmService,
  ) {}

  private token(req: Request, auth?: string) {
    return auth?.replace('Bearer ', '');
  }

  private isStAdmin(session: any) {
    const r = String(session?.role ?? '').toLowerCase();
    return r === EngineRole.ST || r === EngineRole.ADMIN;
  }

  private async enforceNotBanned(client: any, session: any) {
    const engineRes = await client.query(
      `SELECT banned, name FROM engines WHERE engine_id=$1`,
      [session.engine_id],
    );
    if (!engineRes.rowCount) throw new Error('EngineNotFound');
    enforceEngineAccess(engineRes.rows[0], session, EngineAccessRoute.NORMAL);
    return engineRes.rows[0] as { banned: boolean; name?: string };
  }

  // --------------------------------------------------
  // GET /companion/xp/available?characterId=...
  // --------------------------------------------------
  @Get('available')
  async available(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Query('characterId') characterId?: string,
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      await this.enforceNotBanned(client, session);

      let cid = characterId;

      if (!cid) {
        const r = await client.query(
          `
          SELECT character_id
          FROM characters
          WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );
        if (!r.rowCount) return { error: 'NoActiveCharacter' };
        cid = r.rows[0].character_id;
      }

      const available = await this.xp.availableXp(
        client,
        session.engine_id,
        cid!,
      );

      return { characterId: cid, available };
    });
  }

  // --------------------------------------------------
  // POST /companion/xp/spend-request
  // --------------------------------------------------
  @Post('spend-request')
  async spendRequest(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      characterId?: string;
      amount: number;
      reason?: string;
      meta: {
        kind: XpKind;
        key: string;
        from: number;
        to: number;
      };
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      await this.enforceNotBanned(client, session);

      const amount = Math.max(0, asInt(body.amount, 0));
      if (!amount) return { error: 'InvalidAmount' };

      const meta = body.meta;
      if (!meta || !meta.kind || !meta.key) return { error: 'MissingMeta' };

      let characterId = body.characterId;
      if (!characterId) {
        const r = await client.query(
          `
          SELECT character_id
          FROM characters
          WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );
        if (!r.rowCount) return { error: 'NoActiveCharacter' };
        characterId = r.rows[0].character_id;
      }

      const owns = await client.query(
        `
        SELECT 1
        FROM characters
        WHERE engine_id=$1 AND character_id=$2 AND owner_user_id=$3
        LIMIT 1
        `,
        [session.engine_id, characterId, session.user_id],
      );
      if (!owns.rowCount) return { error: 'Forbidden' };

      await this.xp.requestSpend(client, {
        engineId: session.engine_id,
        characterId,
        userId: session.user_id,
        amount,
        reason: body.reason ?? 'XP spend request',
        meta,
      });

      this.realtime.emitToEngine(session.engine_id, 'xp_spend_requested', {
        characterId,
        userId: session.user_id,
        amount,
        reason: body.reason ?? 'XP spend request',
        meta,
        at: new Date().toISOString(),
      });

      return { ok: true };
    });
  }

  // --------------------------------------------------
  // POST /companion/xp/earn
  // --------------------------------------------------
  @Post('earn')
  async earn(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      characterId: string;
      amount: number;
      reason?: string;
    },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      await this.enforceNotBanned(client, session);

      if (!this.isStAdmin(session)) return { error: 'Forbidden' };

      const amount = Math.max(0, asInt(body.amount, 0));
      if (!amount) return { error: 'InvalidAmount' };
      if (!body.characterId) return { error: 'MissingCharacterId' };

      const c = await client.query(
        `
        SELECT owner_user_id
        FROM characters
        WHERE engine_id=$1 AND character_id=$2
        LIMIT 1
        `,
        [session.engine_id, body.characterId],
      );
      if (!c.rowCount) return { error: 'CharacterNotFound' };

      await this.xp.earn(client, {
        engineId: session.engine_id,
        characterId: body.characterId,
        userId: c.rows[0].owner_user_id,
        amount,
        reason: body.reason ?? 'XP Earned',
      });

      this.realtime.emitToEngine(session.engine_id, 'xp_earned', {
        characterId: body.characterId,
        amount,
        reason: body.reason ?? 'XP Earned',
        at: new Date().toISOString(),
      });

      return { ok: true };
    });
  }

  // --------------------------------------------------
  // POST /companion/xp/approve
  // --------------------------------------------------
  @Post('approve')
  async approve(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { xpId: string },
  ) {
    const token = this.token(req, authHeader);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const engine = await this.enforceNotBanned(client, session);

      if (!this.isStAdmin(session)) return { error: 'Forbidden' };
      if (!body?.xpId) return { error: 'MissingXpId' };

      const out = await this.xp.approveAndApply(client, {
        xpId: body.xpId,
        approverId: session.user_id,
        engineId: session.engine_id,
      });

      this.realtime.emitToEngine(session.engine_id, 'xp_spend_approved', {
        xpId: body.xpId,
        out,
        at: new Date().toISOString(),
      });

      if (out?.ok && out?.alreadyApplied === false) {
        const info = await client.query(
          `
          SELECT
            xl.xp_id,
            xl.amount,
            xl.meta,
            u.discord_user_id,
            c.name AS character_name
          FROM xp_ledger xl
          JOIN users u ON u.user_id = xl.user_id
          JOIN characters c ON c.character_id = xl.character_id AND c.engine_id = xl.engine_id
          WHERE xl.xp_id=$1 AND xl.engine_id=$2
          LIMIT 1
          `,
          [body.xpId, session.engine_id],
        );

        if (info.rowCount) {
          const row = info.rows[0];
          const meta = row.meta ?? out?.appliedTo ?? null;

const upgrade =
            meta && meta.kind && meta.key
              ? `${String(meta.kind).toUpperCase()}: ${String(meta.key)} (${meta.from}→${meta.to})`
              : 'Upgrade applied';

          if (row.discord_user_id) {
            await this.dm.sendXpAppliedDm({
              discordUserId: row.discord_user_id,
              characterName: row.character_name ?? 'Your character',
              upgrade,
              cost: Number(row.amount ?? 0),
              engineName: engine?.name,
            });

            // Best-effort notification mark
            try {
              await client.query(
                `
                UPDATE xp_ledger
                SET discord_notified=true,
                    discord_notified_at=now()
                WHERE xp_id=$1
                `,
                [body.xpId],
              );
            } catch {
              // columns may not exist yet — ignore
            }
          }
        }
      }

      return out;
    });
  }
}
          
