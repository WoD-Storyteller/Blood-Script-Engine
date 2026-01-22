import { Body, Controller, Post } from '@nestjs/common';
import { LinkTokenService } from './link-token.service';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { CharactersService } from '../companion/characters.service';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('internal/companion')
export class LinkTokenController {
  constructor(
    private readonly linkTokens: LinkTokenService,
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly characters: CharactersService,
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

    const engineId = result.engineId;
    if (!engineId) {
      return { error: 'NoEngine' };
    }

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.createSession(client, {
        userId: result.userId,
        engineId,
        role: result.role,
      });

      const linkedCharacters = await this.characters.listLinkedCharacters(
        client,
        {
          engineId,
          userId: result.userId,
        },
      );

      const isStoryteller =
        result.role === EngineRole.ST ||
        result.role === EngineRole.ADMIN ||
        result.role === EngineRole.OWNER;

      return {
        token: session.token,
        session: {
          authenticated: true,
          userId: result.userId,
          discordUserId: result.discordUserId,
          role: result.role,
          engineId,
        },
        identity: {
          discordUserId: result.discordUserId,
          engineId,
          role: result.role,
          isStoryteller,
          isOwner: result.role === EngineRole.OWNER,
          linkedCharacters,
        },
      };
    });
  }
}
