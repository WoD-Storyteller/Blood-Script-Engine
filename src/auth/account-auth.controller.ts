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
      return { error: 'MissingCredentials' };
    }

    return this.accountAuth.register({
      email: body.email,
      password: body.password,
    });
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

    if (!result.ok) {
      return { error: result.error };
    }

    const roles = [result.role];
    if (result.role === EngineRole.ST || result.role === EngineRole.ADMIN) {
      roles.push('storyteller');
    }
    if (result.role === EngineRole.OWNER) {
      roles.push('owner');
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

      if (!result.ok) {
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

      if (!result.ok) {
        return { error: result.reason };
      }

      return {
        linked: true,
        discordUserId: result.discordUserId,
      };
    });
  }
}
