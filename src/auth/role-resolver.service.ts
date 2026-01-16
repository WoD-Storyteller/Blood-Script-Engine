import { Injectable } from '@nestjs/common';
import { EngineRole } from '../common/enums/engine-role.enum';

type DiscordGuild = {
  id: string;
  name: string;
  owner: boolean;
  permissions: string;
};

@Injectable()
export class RoleResolverService {
  resolveRole(input: {
    discordUserId: string;
    guilds: DiscordGuild[];
    engineGuildId?: string | null;
    stRoleIds?: string[];
  }): EngineRole {
    const ownerDiscordId = process.env.DISCORD_OWNER_ID;

    if (ownerDiscordId && input.discordUserId === ownerDiscordId) {
      return EngineRole.OWNER;
    }

    return EngineRole.PLAYER;
  }
}
