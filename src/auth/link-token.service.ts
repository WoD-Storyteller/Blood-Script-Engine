import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { uuid } from '../common/utils/uuid';
import { EngineRole } from '../common/enums/engine-role.enum';
import { isBotOwner } from '../owner/owner.guard';

const TOKEN_TTL_MINUTES = 10;
const TOKEN_COOLDOWN_SECONDS = 60;

export type LinkTokenIssueResult =
  | {
      ok: true;
      token: string;
      expiresAt: string;
      engineId?: string | null;
    }
  | {
      ok: false;
      reason: 'rate_limited';
      retryAfterSeconds: number;
    };

export type LinkTokenConsumeResult =
  | {
      ok: true;
      discordUserId: string;
      userId: string;
      engineId?: string | null;
      role: EngineRole;
    }
  | {
      ok: false;
      reason: 'invalid' | 'no_engine';
    };

@Injectable()
export class LinkTokenService {
  constructor(private readonly db: DatabaseService) {}

  async issueToken(input: {
    discordUserId: string;
    discordUsername: string;
    issuingCommand: string;
    guildId?: string | null;
    engineId?: string | null;
  }): Promise<LinkTokenIssueResult> {
    const rawToken = this.generateToken();
    const tokenHash = this.hashToken(rawToken);

    return this.db.withClient(async (client: any) => {
      const recent = await client.query(
        `
        SELECT issued_at
        FROM link_tokens
        WHERE discord_user_id = $1
        ORDER BY issued_at DESC
        LIMIT 1
        `,
        [input.discordUserId],
      );

      if (recent.rowCount) {
        const issuedAt = new Date(recent.rows[0].issued_at);
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - issuedAt.getTime()) / 1000);
        if (elapsedSeconds < TOKEN_COOLDOWN_SECONDS) {
          return {
            ok: false,
            reason: 'rate_limited',
            retryAfterSeconds: TOKEN_COOLDOWN_SECONDS - elapsedSeconds,
          } as const;
        }
      }

      const userId = await this.ensureUserRecord(client, {
        discordUserId: input.discordUserId,
        discordUsername: input.discordUsername,
      });

      const resolvedEngineId =
        input.engineId ??
        (await this.lookupMostRecentEngineId(client, userId));

      await client.query(
        `
        UPDATE link_tokens
        SET redeemed_at = now()
        WHERE discord_user_id = $1
          AND redeemed_at IS NULL
        `,
        [input.discordUserId],
      );

      const insert = await client.query(
        `
        INSERT INTO link_tokens (
          token_hash,
          discord_user_id,
          guild_id,
          engine_id,
          issued_at,
          expires_at,
          issuing_command
        )
        VALUES ($1, $2, $3, $4, now(), now() + interval '${TOKEN_TTL_MINUTES} minutes', $5)
        RETURNING expires_at
        `,
        [
          tokenHash,
          input.discordUserId,
          input.guildId ?? null,
          resolvedEngineId ?? null,
          input.issuingCommand,
        ],
      );

      return {
        ok: true,
        token: rawToken,
        expiresAt: insert.rows[0].expires_at,
        engineId: resolvedEngineId,
      } as const;
    });
  }

  async consumeToken(rawToken: string): Promise<LinkTokenConsumeResult> {
    const tokenHash = this.hashToken(rawToken);

    return this.db.withClient(async (client: any) => {
      const consumed = await client.query(
        `
        UPDATE link_tokens
        SET redeemed_at = now()
        WHERE token_hash = $1
          AND redeemed_at IS NULL
          AND expires_at > now()
        RETURNING discord_user_id, engine_id
        `,
        [tokenHash],
      );

      if (!consumed.rowCount) {
        return { ok: false, reason: 'invalid' } as const;
      }

      const discordUserId = consumed.rows[0].discord_user_id as string;
      const engineId = consumed.rows[0].engine_id as string | null;

      const userId = await this.ensureUserRecord(client, {
        discordUserId,
        discordUsername: 'Unknown',
      });

      const resolvedEngineId =
        engineId ?? (await this.lookupMostRecentEngineId(client, userId));

      if (!resolvedEngineId) {
        return { ok: false, reason: 'no_engine' } as const;
      }

      let role = await this.lookupEngineRole(client, {
        engineId: resolvedEngineId,
        userId,
      });

      if (isBotOwner({ discord_user_id: discordUserId })) {
        role = EngineRole.OWNER;
      }

      return {
        ok: true,
        discordUserId,
        userId,
        engineId: resolvedEngineId,
        role,
      } as const;
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async ensureUserRecord(
    client: any,
    input: { discordUserId: string; discordUsername: string },
  ): Promise<string> {
    const existing = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`,
      [input.discordUserId],
    );

    if (existing.rowCount) return existing.rows[0].user_id as string;

    const newId = uuid();
    await client.query(
      `INSERT INTO users (user_id, discord_user_id, username) VALUES ($1, $2, $3)`,
      [newId, input.discordUserId, input.discordUsername],
    );

    return newId;
  }

  private async lookupMostRecentEngineId(
    client: any,
    userId: string,
  ): Promise<string | null> {
    const result = await client.query(
      `
      SELECT engine_id
      FROM engine_memberships
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [userId],
    );

    return result.rowCount ? (result.rows[0].engine_id as string) : null;
  }

  private async lookupEngineRole(
    client: any,
    input: { engineId: string; userId: string },
  ): Promise<EngineRole> {
    const result = await client.query(
      `
      SELECT role
      FROM engine_memberships
      WHERE engine_id = $1 AND user_id = $2
      LIMIT 1
      `,
      [input.engineId, input.userId],
    );

    if (!result.rowCount) return EngineRole.PLAYER;

    return result.rows[0].role as EngineRole;
  }
}
