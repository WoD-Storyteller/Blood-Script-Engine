import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Client, Events } from 'discord.js';
import { DatabaseService } from '../database/database.service';
import { LinkTokenService } from '../auth/link-token.service';
import { handleDM } from './handlers/dm.handler';
import { handleLinkAccountCommand } from './handlers/linkaccount.handler';

@Injectable()
export class DiscordMessageListenerService implements OnModuleInit {
  private readonly logger = new Logger(DiscordMessageListenerService.name);

  constructor(
    private readonly client: Client,
    private readonly db: DatabaseService,
    private readonly linkTokens: LinkTokenService,
  ) {}

  onModuleInit() {
    this.client.on(Events.MessageCreate, async (message) => {
      if (message.author?.bot) return;

      try {
        const handled = await handleLinkAccountCommand(message, this.linkTokens);
        if (handled) return;

        if (!message.guild) {
          await handleDM(message, this.db);
        }
      } catch (error) {
        this.logger.warn(`Discord message handler failed: ${error}`);
      }
    });
  }
}
