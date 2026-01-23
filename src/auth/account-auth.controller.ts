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
      return { ok: false, error: 'MissingCredentials' };
    }

    const result = await this.accountAuth.register({
      email: body.email,
      password: body.password,
    });

    if (result.ok === false) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
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
      return { error: 'MissingCredentials' };
    }

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
      return { error: result.error };
    }

    const roles: EngineRole[] = [result.role];
    if (result.role === EngineRole.ST || result.role === EngineRole.ADMIN) {
      roles.push(EngineRole.STORYTELLER);
    }
    if (result.role === EngineRole.OWNER) {
      roles.push(EngineRole.OWNER);
    }

    return {
      token: result.token,
      session: {
        authenticated: true,
        userId: result.userId,
        email: result.email,
        engineId: result.engineId,
        role: result.role,
        roles,
        linkedDiscordUserId: result.linkedDiscordUserId,
        twoFactorEnabled: result.twoFactorEnabled,
      },
    };
  }

  @Post('password/forgot')
  async forgotPassword(@Body() body: { email?: string }) {
    if (!body.email) {
      return { ok: false, error: 'MissingEmail' };
    }

    const result = await this.accountAuth.requestPasswordReset({
      email: body.email,
    });

    if (result.ok === false) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  }

  @Post('password/reset')
  async resetPassword(
    @Body() body: { token?: string; password?: string },
  ) {
    if (!body.token || !body.password) {
      return { ok: false, error: 'MissingCredentials' };
    }

    const result = await this.accountAuth.resetPassword({
      token: body.token,
      password: body.password,
    });

    if (result.ok === false) {
      return { ok: false, error: result.error };
    }

    return { ok: true };
  }

  @Post('logout')
  async logout(
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      await this.accountAuth.revokeSession(client, token);
      return { ok: true };
    });
  }

  @Post('2fa/setup')
  async setupTwoFactor(
    @Headers('authorization') authHeader?: string,
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.companionAuth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const result = await this.accountAuth.createTwoFactorSetup({
        userId: session.user_id,
        email: session.email,
      });

      if (result.alreadyEnabled) {
        return { error: 'TwoFactorAlreadyEnabled' };
      }

      return {
        manualEntryKey: result.secret,
        otpauthUrl: result.otpauthUrl,
      };
    });
  }

  @Post('2fa/confirm')
  async confirmTwoFactor(
    @Headers('authorization') authHeader: string,
    @Body() body: { code?: string },
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };
    if (!body.code) return { error: 'MissingCode' };

    return this.db.withClient(async (client: any) => {
      const session = await this.companionAuth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const result = await this.accountAuth.confirmTwoFactorSetup({
        userId: session.user_id,
        code: body.code,
      });

      if (result.ok === false) {
        return { error: result.error };
      }

      return { recoveryCodes: result.recoveryCodes };
    });
  }

  @Post('link-discord')
  async linkDiscord(
    @Headers('authorization') authHeader: string,
    @Body() body: { token?: string },
  ) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };
    if (!body.token) return { error: 'MissingToken' };

    return this.db.withClient(async (client: any) => {
      const session = await this.companionAuth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const result = await this.linkTokens.consumeToken({
        token: body.token,
        userId: session.user_id,
      });

      if (result.ok === false) {
        return { error: result.error };
      }

      return {
        linked: true,
        discordUserId: result.discordUserId,
      };
    });
  }
}
