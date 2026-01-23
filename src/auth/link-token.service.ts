import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';

const TOKEN_TTL_MINUTES = 10;
const TOKEN_COOLDOWN_SECONDS = 60;

export type LinkTokenIssueResult =
  | {
      ok: true;
      token: string;
      expiresAt: string;
    }
  | {
      ok: false;
      error: string;
      retryAfterSeconds?: number;
    };

export type LinkTokenConsumeResult =
  | {
      ok: true;
      discordUserId: string;
    }
  | {
      ok: false;
      error:
        | 'invalid'
        | 'discord_already_linked'
        | 'user_already_linked';
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
        FROM discord_link_tokens
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
            error: 'rate_limited',
            retryAfterSeconds: TOKEN_COOLDOWN_SECONDS - elapsedSeconds,
          } as const;
        }
      }

      await client.query(
        `
        UPDATE discord_link_tokens
        SET redeemed_at = now()
        WHERE discord_user_id = $1
          AND redeemed_at IS NULL
        `,
        [input.discordUserId],
      );

      const insert = await client.query(
        `
        INSERT INTO discord_link_tokens (
          token_hash,
          discord_user_id,
          issued_at,
          expires_at
        )
        VALUES ($1, $2, now(), now() + interval '${TOKEN_TTL_MINUTES} minutes')
        RETURNING expires_at
        `,
        [tokenHash, input.discordUserId],
      );

      return {
        ok: true,
        token: rawToken,
        expiresAt: insert.rows[0].expires_at,
      } as const;
    });
  }

  async consumeToken(input: {
    token: string;
    userId: string;
  }): Promise<LinkTokenConsumeResult> {
    const tokenHash = this.hashToken(input.token);

    return this.db.withClient(async (client: any) => {
      await client.query('BEGIN');

      try {
        const consumed = await client.query(
          `
          UPDATE discord_link_tokens
          SET redeemed_at = now()
          WHERE token_hash = $1
            AND redeemed_at IS NULL
            AND expires_at > now()
          RETURNING discord_user_id
          `,
          [tokenHash],
        );

        if (!consumed.rowCount) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'invalid' } as const;
        }

        const discordUserId = consumed.rows[0].discord_user_id as string;

        const linked = await client.query(
          `SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`,
          [discordUserId],
        );

        if (linked.rowCount) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'discord_already_linked' } as const;
        }

        const update = await client.query(
          `
          UPDATE users
          SET discord_user_id = $1,
              updated_at = now()
          WHERE user_id = $2
            AND discord_user_id IS NULL
          RETURNING user_id
          `,
          [discordUserId, input.userId],
        );

        if (!update.rowCount) {
          await client.query('ROLLBACK');
          return { ok: false, error: 'user_already_linked' } as const;
        }

        await client.query('COMMIT');

        return { ok: true, discordUserId } as const;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

}
