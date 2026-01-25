import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { AccountAuthService } from './account-auth.service';
import { LinkTokenService } from './link-token.service';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('auth')
export class AccountAuthController {
  constructor(
    private readonly db: DatabaseService,
    private readonly companionAuth: CompanionAuthService,
    private readonly accountAuth: AccountAuthService,
    private readonly linkTokens: LinkTokenService,
  ) {}

  @Post('register')
  async register(@Body() body: { email?: string; password?: string }) {
    if (!body.email || !body.password) {
      return { ok: false, error: 'MissingCredentials' } as const;
    }

    try {
      const result = await this.accountAuth.register({
        email: body.email,
        password: body.password,
      });

      if (result.ok === false) {
        return { ok: false, error: result.error } as const;
      }

      return { ok: true } as const;
    } catch (error) {
      console.error('Failed to register account', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('login')
  async login(
    @Body()
    body: {
      email?: string;
      password?: string;
      twoFactorCode?: string;
      recoveryCode?: string;
      engineId?: string;
    },
    @Req() req: Request,
  ) {
    if (!body.email || !body.password) {
      return { ok: false, error: 'MissingCredentials' } as const;
    }

    try {
      const result = await this.accountAuth.login({
        email: body.email,
        password: body.password,
        twoFactorCode: body.twoFactorCode,
        recoveryCode: body.recoveryCode,
        engineId: body.engineId,
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      });

      if (result.ok === false) {
        return { ok: false, error: result.error } as const;
      }

      const roles: EngineRole[] = [result.role];
      if (result.role === EngineRole.ST || result.role === EngineRole.ADMIN) {
        roles.push(EngineRole.STORYTELLER);
      }
      if (result.role === EngineRole.OWNER) {
        roles.push(EngineRole.OWNER);
      }

      return {
        ok: true,
        token: result.token,
        user: {
          authenticated: true,
          userId: result.userId,
          email: result.email,
          engineId: result.engineId,
          role: result.role,
          roles,
          linkedDiscordUserId: result.linkedDiscordUserId,
          twoFactorEnabled: result.twoFactorEnabled,
        },
      } as const;
    } catch (error) {
      console.error('Failed to login', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('password/check')
  async checkPasswordReset(@Body() body: { email?: string }) {
    if (!body.email) {
      return { ok: false, error: 'MissingEmail' } as const;
    }

    try {
      const result = await this.accountAuth.checkPasswordResetEligibility({
        email: body.email,
      });

      if (result.ok === false) {
        return { ok: false, error: result.error } as const;
      }

      if (result.twoFactorEnabled) {
        return { 
          ok: true, 
          twoFactorEnabled: true,
          email: result.email,
        } as const;
      }

      return { 
        ok: true, 
        twoFactorEnabled: false,
        message: 'Contact an administrator to reset your password. You must enable 2FA to use self-service password reset.',
      } as const;
    } catch (error) {
      console.error('Failed to check password reset eligibility', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('password/reset')
  async resetPassword(
    @Body() body: { 
      email?: string;
      twoFactorCode?: string;
      recoveryCode?: string;
      newPassword?: string;
    },
  ) {
    if (!body.email || !body.newPassword) {
      return { ok: false, error: 'MissingCredentials' } as const;
    }

    if (!body.twoFactorCode && !body.recoveryCode) {
      return { ok: false, error: 'TwoFactorRequired' } as const;
    }

    try {
      const result = await this.accountAuth.resetPasswordWith2FA({
        email: body.email,
        twoFactorCode: body.twoFactorCode,
        recoveryCode: body.recoveryCode,
        newPassword: body.newPassword,
      });

      if (result.ok === false) {
        return { ok: false, error: result.error } as const;
      }

      return { ok: true } as const;
    } catch (error) {
      console.error('Failed to reset password', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { ok: false, error: 'Unauthorized' } as const;

    try {
      return await this.db.withClient(async (client: any) => {
        await this.accountAuth.revokeSession(client, token);
        return { ok: true } as const;
      });
    } catch (error) {
      console.error('Failed to logout', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('2fa/setup')
  async setupTwoFactor(
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { ok: false, error: 'Unauthorized' } as const;

    try {
      return await this.db.withClient(async (client: any) => {
        const session = await this.companionAuth.validateToken(client, token);
        if (!session) return { ok: false, error: 'Unauthorized' } as const;

        const result = await this.accountAuth.createTwoFactorSetup({
          userId: session.user_id,
          email: session.email,
        });

        if (result.ok === false) {
          return { ok: false, error: result.error } as const;
        }

        return {
          ok: true,
          manualEntryKey: result.secret,
          otpauthUrl: result.otpauthUrl,
        } as const;
      });
    } catch (error) {
      console.error('Failed to setup two-factor', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('2fa/confirm')
  async confirmTwoFactor(
    @Headers('authorization') authHeader: string,
    @Body() body: { code?: string },
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { ok: false, error: 'Unauthorized' } as const;
    if (!body.code) return { ok: false, error: 'MissingCode' } as const;

    try {
      return await this.db.withClient(async (client: any) => {
        const session = await this.companionAuth.validateToken(client, token);
        if (!session) return { ok: false, error: 'Unauthorized' } as const;

        const result = await this.accountAuth.confirmTwoFactorSetup({
          userId: session.user_id,
          code: body.code,
        });

        if (result.ok === false) {
          return { ok: false, error: result.error } as const;
        }

        return { ok: true, recoveryCodes: result.recoveryCodes } as const;
      });
    } catch (error) {
      console.error('Failed to confirm two-factor', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }

  @Post('link-discord')
  async linkDiscord(
    @Headers('authorization') authHeader: string,
    @Body() body: { token?: string },
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { ok: false, error: 'Unauthorized' } as const;
    if (!body.token) return { ok: false, error: 'MissingToken' } as const;

    try {
      return await this.db.withClient(async (client: any) => {
        const session = await this.companionAuth.validateToken(client, token);
        if (!session) return { ok: false, error: 'Unauthorized' } as const;

        const result = await this.linkTokens.consumeToken({
          token: body.token,
          userId: session.user_id,
        });

        if (result.ok === false) {
          return { ok: false, error: result.error } as const;
        }

        return {
          ok: true,
          linked: true,
          discordUserId: result.discordUserId,
        } as const;
      });
    } catch (error) {
      console.error('Failed to link discord', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }
}
