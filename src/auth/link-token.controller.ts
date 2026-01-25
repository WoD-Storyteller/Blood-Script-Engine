import { Body, Controller, Headers, Post } from '@nestjs/common';
import { LinkTokenService } from './link-token.service';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';

@Controller('internal/companion')
export class LinkTokenController {
  constructor(
    private readonly linkTokens: LinkTokenService,
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
  ) {}

  @Post('consume-link-token')
  async consumeLinkToken(
    @Body() body: { token?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    if (!body.token) return { ok: false, error: 'MissingToken' } as const;
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { ok: false, error: 'Unauthorized' } as const;

    try {
      return await this.db.withClient(async (client: any) => {
        const session = await this.auth.validateToken(client, token);
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
      console.error('Failed to consume link token', error);
      return { ok: false, error: 'ServerError' } as const;
    }
  }
}
