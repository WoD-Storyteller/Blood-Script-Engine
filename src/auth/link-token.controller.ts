import { Body, Controller, Post } from '@nestjs/common';
import { JwtService } from './jwt.service';
import { LinkTokenService } from './link-token.service';

@Controller('internal/companion')
export class LinkTokenController {
  constructor(
    private readonly linkTokens: LinkTokenService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('consume-link-token')
  async consumeLinkToken(@Body() body: { token?: string }) {
    if (!body.token) return { error: 'MissingToken' };

    const result = await this.linkTokens.consumeToken(body.token);

    if (!result.ok) {
      return {
        error: result.reason === 'no_engine' ? 'NoEngine' : 'InvalidToken',
      };
    }

    const jwtToken = this.jwtService.sign({
      sub: result.userId,
      discordUserId: result.discordUserId,
      engineRole: result.role,
      engineId: result.engineId ?? undefined,
    });

    return {
      token: jwtToken,
      session: {
        userId: result.userId,
        discordUserId: result.discordUserId,
        role: result.role,
        engineId: result.engineId,
      },
    };
  }
}
