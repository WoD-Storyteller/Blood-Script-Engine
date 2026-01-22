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
    if (!body.token) return { error: 'MissingToken' };
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      const result = await this.linkTokens.consumeToken({
        token: body.token,
        userId: session.user_id,
      });

      if (!result.ok) {
        return { error: result.reason };
      }

      return { linked: true, discordUserId: result.discordUserId };
    });
  }
}
