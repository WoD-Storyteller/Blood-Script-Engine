import { Injectable, Logger } from '@nestjs/common';
import { Client, Events } from 'discord.js';
import { createDiscordClient } from './client';

import { handleGuildJoin } from './handlers/guild-join.handler';
import { handleMessage } from './handlers/message.handler';
import { handleDM } from './handlers/dm.handler';
import { ScenesService } from '../scenes/scenes.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);
  private client: Client;

  constructor(
    private readonly scenes: ScenesService,
    private readonly db: DatabaseService,
  ) {}

  async start() {
    if (!process.env.DISCORD_BOT_TOKEN) {
      throw new Error('DISCORD_BOT_TOKEN not set');
    }

    this.client = createDiscordClient();

    this.client.once(Events.ClientReady, () => {
      this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
    });

    this.client.on(Events.GuildCreate, (guild) =>
      handleGuildJoin(guild, this.db),
    );

    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author.bot) return;

      if (message.guild) {
        await handleMessage(message, this.scenes, this.db);
      } else {
        await handleDM(message, this.db);
      }
    });

    await this.client.login(process.env.DISCORD_BOT_TOKEN);
  }
}
