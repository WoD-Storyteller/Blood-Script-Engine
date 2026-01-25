import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { uuid } from '../common/utils/uuid';
import { CompanionAuthService } from '../companion/auth.service';
import { EngineRole } from '../common/enums/engine-role.enum';
import { encryptSecret, decryptSecret } from './crypto-utils';
import { hashPassword, verifyPassword } from './password-utils';
import { buildOtpAuthUrl, generateTotpSecret, verifyTotpCode } from './totp';

const SESSION_TTL_HOURS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_WINDOW_MINUTES = 15;
const LOCKOUT_MINUTES = 15;
const RECOVERY_CODE_COUNT = 8;
const PASSWORD_RESET_TTL_MINUTES = 30;

type RegisterResult = { ok: true } | { ok: false; error: string };

type PasswordResetRequestResult = { ok: true } | { ok: false; error: string };

type PasswordResetConfirmResult = { ok: true } | { ok: false; error: string };

type LoginResult =
  | {
      ok: true;
      token: string;
      sessionId: string;
      userId: string;
      email: string;
      role: EngineRole;
      engineId: string;
      linkedDiscordUserId?: string | null;
      twoFactorEnabled: boolean;
    }
  | { ok: false; error: string };

type TwoFactorSetupResult =
  | { ok: true; secret: string; otpauthUrl: string }
  | { ok: false; error: 'TwoFactorAlreadyEnabled' };

type TwoFactorConfirmResult =
  | { ok: true; recoveryCodes: string[] }
  | { ok: false; error: string };

@Injectable()
export class AccountAuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly companionAuth: CompanionAuthService,
  ) {}

  async register(input: {
    email: string;
    password: string;
  }): Promise<RegisterResult> {
    const email = input.email.trim().toLowerCase();
    const passwordError = this.validatePassword(input.password);
    if (!this.isValidEmail(email)) {
      return { ok: false, error: 'InvalidEmail' };
    }
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    const passwordHash = await hashPassword(input.password);

    return this.db.withClient(async (client: any) => {
      const existing = await client.query(
        `SELECT user_id FROM users WHERE email = $1 LIMIT 1`,
        [email],
      );
      if (existing.rowCount) {
        return { ok: false, error: 'EmailInUse' } as const;
      }

      const userId = uuid();
      try {
        await client.query(
          `
          INSERT INTO users (user_id, email, password_hash, created_at, updated_at)
          VALUES ($1, $2, $3, now(), now())
          `,
          [userId, email, passwordHash],
        );
      } catch (error: any) {
        if (error?.code === '23505') {
          return { ok: false, error: 'EmailInUse' } as const;
        }
        throw error;
      }

      return { ok: true } as const;
    });
  }

  async requestPasswordReset(input: {
    email: string;
  }): Promise<PasswordResetRequestResult> {
    const email = input.email.trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      return { ok: false, error: 'InvalidEmail' };
    }

    return this.db.withClient(async (client: any) => {
      const userRes = await client.query(
        `
        SELECT user_id
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
        [email],
      );

      if (!userRes.rowCount) {
        return { ok: true } as const;
      }

      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      await client.query(
        `
        DELETE FROM password_reset_tokens
        WHERE user_id = $1 AND redeemed_at IS NULL
        `,
        [userRes.rows[0].user_id],
      );

      await client.query(
        `
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, now() + ($3 * interval '1 minute'))
        `,
        [userRes.rows[0].user_id, tokenHash, PASSWORD_RESET_TTL_MINUTES],
      );

      return { ok: true } as const;
    });
  }

  async resetPassword(input: {
    token: string;
    password: string;
  }): Promise<PasswordResetConfirmResult> {
    const passwordError = this.validatePassword(input.password);
    if (passwordError) {
      return { ok: false, error: passwordError };
    }

    const tokenHash = createHash('sha256').update(input.token).digest('hex');

    return this.db.withClient(async (client: any) => {
      const tokenRes = await client.query(
        `
        SELECT id, user_id, expires_at, redeemed_at
        FROM password_reset_tokens
        WHERE token_hash = $1
        LIMIT 1
        `,
        [tokenHash],
      );

      if (!tokenRes.rowCount) {
        return { ok: false, error: 'InvalidToken' } as const;
      }

      const record = tokenRes.rows[0];
      if (record.redeemed_at) {
        return { ok: false, error: 'TokenUsed' } as const;
      }

      if (new Date(record.expires_at) <= new Date()) {
        return { ok: false, error: 'TokenExpired' } as const;
      }

      const passwordHash = await hashPassword(input.password);

      await client.query(
        `
        UPDATE users
        SET password_hash = $2,
            failed_login_attempts = 0,
            last_failed_login_at = NULL,
            locked_until = NULL,
            updated_at = now()
        WHERE user_id = $1
        `,
        [record.user_id, passwordHash],
      );

      await client.query(
        `
        UPDATE password_reset_tokens
        SET redeemed_at = now()
        WHERE id = $1
        `,
        [record.id],
      );

      await client.query(
        `
        UPDATE user_sessions
        SET revoked_at = now()
        WHERE user_id = $1 AND revoked_at IS NULL
        `,
        [record.user_id],
      );

      await client.query(
        `
        UPDATE companion_sessions
        SET revoked = true, revoked_at = now()
        WHERE user_id = $1 AND revoked = false
        `,
        [record.user_id],
      );

      return { ok: true } as const;
    });
  }

  async login(input: {
    email: string;
    password: string;
    twoFactorCode?: string;
    recoveryCode?: string;
    ip?: string | null;
    userAgent?: string | null;
    engineId?: string | null;
  }): Promise<LoginResult> {
    const email = input.email.trim().toLowerCase();

    return this.db.withClient(async (client: any) => {
      const userRes = await client.query(
        `
        SELECT user_id, email, password_hash, two_factor_enabled, two_factor_secret,
               discord_user_id, locked_until, failed_login_attempts, last_failed_login_at
        FROM users
        WHERE email = $1
        LIMIT 1
        `,
        [email],
      );

      if (!userRes.rowCount) {
        return { ok: false, error: 'InvalidCredentials' } as const;
      }

      const user = userRes.rows[0];
      if (!user.password_hash) {
        return { ok: false, error: 'InvalidCredentials' } as const;
      }
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { ok: false, error: 'AccountLocked' } as const;
      }

      const passwordValid = await verifyPassword(
        user.password_hash as string,
        input.password,
      );

      if (!passwordValid) {
        await this.recordFailedAttempt(client, user);
        return { ok: false, error: 'InvalidCredentials' } as const;
      }

      if (user.two_factor_enabled) {
        if (!input.twoFactorCode && !input.recoveryCode) {
          return { ok: false, error: 'TwoFactorRequired' } as const;
        }
        const twoFactorOk = await this.verifyTwoFactor(client, {
          userId: user.user_id,
          secretEncrypted: user.two_factor_secret,
          code: input.twoFactorCode,
          recoveryCode: input.recoveryCode,
        });

        if (!twoFactorOk) {
          await this.recordFailedAttempt(client, user);
          return { ok: false, error: 'InvalidTwoFactorCode' } as const;
        }
      }

      await client.query(
        `
        UPDATE users
        SET failed_login_attempts = 0,
            last_failed_login_at = NULL,
            locked_until = NULL,
            updated_at = now()
        WHERE user_id = $1
        `,
        [user.user_id],
      );

      const engineContext = await this.resolveEngineContext(client, {
        userId: user.user_id,
        engineId: input.engineId ?? null,
      });

      if (!engineContext) {
        return { ok: false, error: 'NoEngine' } as const;
      }

      const session = await this.companionAuth.createSession(client, {
        userId: user.user_id,
        engineId: engineContext.engineId,
        role: engineContext.role,
        expiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      });

      return {
        ok: true,
        token: session.token,
        sessionId: session.sessionId,
        userId: user.user_id,
        email: user.email,
        role: engineContext.role,
        engineId: engineContext.engineId,
        linkedDiscordUserId: user.discord_user_id,
        twoFactorEnabled: user.two_factor_enabled,
      } as const;
    });
  }

  async createTwoFactorSetup(input: {
    userId: string;
    email: string;
  }): Promise<TwoFactorSetupResult> {
    return this.db.withClient(async (client: any) => {
      const existing = await client.query(
        `SELECT two_factor_enabled FROM users WHERE user_id = $1`,
        [input.userId],
      );
      if (existing.rowCount && existing.rows[0].two_factor_enabled) {
        return { ok: false, error: 'TwoFactorAlreadyEnabled' } as const;
      }

      const secret = generateTotpSecret();
      const otpauthUrl = buildOtpAuthUrl({
        issuer: 'Blood Script Engine',
        account: input.email,
        secret,
      });

      const encrypted = encryptSecret(secret);

      await client.query(
        `
        INSERT INTO two_factor_pending (user_id, secret_encrypted, issued_at, expires_at)
        VALUES ($1, $2, now(), now() + interval '15 minutes')
        ON CONFLICT (user_id)
        DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted,
                      issued_at = EXCLUDED.issued_at,
                      expires_at = EXCLUDED.expires_at
        `,
        [input.userId, encrypted],
      );

      return {
        ok: true,
        secret,
        otpauthUrl,
      } as const;
    });
  }

  async confirmTwoFactorSetup(input: {
    userId: string;
    code: string;
  }): Promise<TwoFactorConfirmResult> {
    return this.db.withClient(async (client: any) => {
      const pending = await client.query(
        `
        SELECT secret_encrypted, expires_at
        FROM two_factor_pending
        WHERE user_id = $1
        `,
        [input.userId],
      );

      if (!pending.rowCount) {
        return { ok: false, error: 'NoPendingSetup' } as const;
      }

      const expiresAt = pending.rows[0].expires_at as string;
      if (new Date(expiresAt) <= new Date()) {
        await client.query(
          `DELETE FROM two_factor_pending WHERE user_id = $1`,
          [input.userId],
        );
        return { ok: false, error: 'SetupExpired' } as const;
      }

      const secret = decryptSecret(pending.rows[0].secret_encrypted as string);
      const isValid = verifyTotpCode(secret, input.code);
      if (!isValid) {
        return { ok: false, error: 'InvalidTwoFactorCode' } as const;
      }

      const encrypted = encryptSecret(secret);
      await client.query(
        `
        UPDATE users
        SET two_factor_enabled = true,
            two_factor_secret = $2,
            updated_at = now()
        WHERE user_id = $1
        `,
        [input.userId, encrypted],
      );

      await client.query(`DELETE FROM two_factor_pending WHERE user_id = $1`, [
        input.userId,
      ]);

      await client.query(
        `DELETE FROM user_recovery_codes WHERE user_id = $1`,
        [input.userId],
      );

      const recoveryCodes = this.generateRecoveryCodes();
      for (const code of recoveryCodes) {
        const hash = this.hashRecoveryCode(code);
        await client.query(
          `
          INSERT INTO user_recovery_codes (user_id, code_hash)
          VALUES ($1, $2)
          `,
          [input.userId, hash],
        );
      }

      return { ok: true, recoveryCodes } as const;
    });
  }

  async revokeSession(client: any, token: string) {
    return this.companionAuth.revokeSession(client, token);
  }

  private async recordFailedAttempt(client: any, user: any) {
    const lastFailed = user.last_failed_login_at
      ? new Date(user.last_failed_login_at)
      : null;
    const now = new Date();
    const withinWindow =
      lastFailed &&
      now.getTime() - lastFailed.getTime() < FAILED_WINDOW_MINUTES * 60 * 1000;
    const attempts = withinWindow ? user.failed_login_attempts + 1 : 1;
    const lockedUntil =
      attempts >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000)
        : null;

    await client.query(
      `
      UPDATE users
      SET failed_login_attempts = $2,
          last_failed_login_at = now(),
          locked_until = $3,
          updated_at = now()
      WHERE user_id = $1
      `,
      [user.user_id, attempts, lockedUntil],
    );
  }

  private async resolveEngineContext(
    client: any,
    input: { userId: string; engineId: string | null },
  ): Promise<{ engineId: string; role: EngineRole } | null> {
    if (input.engineId) {
      const roleRes = await client.query(
        `
        SELECT role
        FROM engine_memberships
        WHERE engine_id = $1 AND user_id = $2
        LIMIT 1
        `,
        [input.engineId, input.userId],
      );
      if (!roleRes.rowCount) return null;
      return {
        engineId: input.engineId,
        role: roleRes.rows[0].role as EngineRole,
      };
    }

    const result = await client.query(
      `
      SELECT engine_id, role
      FROM engine_memberships
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [input.userId],
    );

    if (!result.rowCount) return null;

    return {
      engineId: result.rows[0].engine_id as string,
      role: result.rows[0].role as EngineRole,
    };
  }

  private async verifyTwoFactor(
    client: any,
    input: {
      userId: string;
      secretEncrypted?: string | null;
      code?: string;
      recoveryCode?: string;
    },
  ): Promise<boolean> {
    if (input.recoveryCode) {
      const hash = this.hashRecoveryCode(input.recoveryCode);
      const recoveryRes = await client.query(
        `
        SELECT id
        FROM user_recovery_codes
        WHERE user_id = $1 AND code_hash = $2 AND redeemed_at IS NULL
        LIMIT 1
        `,
        [input.userId, hash],
      );

      if (recoveryRes.rowCount) {
        await client.query(
          `
          UPDATE user_recovery_codes
          SET redeemed_at = now()
          WHERE id = $1
          `,
          [recoveryRes.rows[0].id],
        );
        return true;
      }
    }

    if (!input.code || !input.secretEncrypted) {
      return false;
    }

    const secret = decryptSecret(input.secretEncrypted);
    return verifyTotpCode(secret, input.code);
  }

  private generateRecoveryCodes(): string[] {
    return Array.from({ length: RECOVERY_CODE_COUNT }).map(() =>
      randomBytes(5).toString('hex'),
    );
  }

  private hashRecoveryCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private validatePassword(password: string): string | null {
    if (password.length < 12) {
      return 'PasswordTooShort';
    }
    if (!/[A-Z]/.test(password)) {
      return 'PasswordNeedsUppercase';
    }
    if (!/[a-z]/.test(password)) {
      return 'PasswordNeedsLowercase';
    }
    if (!/[0-9]/.test(password)) {
      return 'PasswordNeedsNumber';
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'PasswordNeedsSymbol';
    }
    return null;
  }
}
