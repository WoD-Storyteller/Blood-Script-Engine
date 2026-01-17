import { Module, Logger } from '@nestjs/common';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

import { OwnerDmService } from './owner-dm.service';
import { DiscordDmService } from './discord.dm.service';
import { DiscordWebhookService } from './discord-webhook.service';

const logger = new Logger('DiscordModule');

@Module({
  providers: [
    {
      provide: Client,
      useFactory: async () => {
        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
          ],
          partials: [Partials.Channel],
        });

        if (process.env.DISCORD_BOT_TOKEN) {
          try {
            await client.login(process.env.DISCORD_BOT_TOKEN);
            logger.log('Discord client connected');
          } catch (err) {
            logger.warn('Discord login failed, running without Discord integration');
          }
        } else {
          logger.warn('DISCORD_BOT_TOKEN not set, Discord features disabled');
        }
        return client;
      },
    },
    OwnerDmService,
    DiscordDmService,
    DiscordWebhookService,
  ],
  exports: [Client, OwnerDmService, DiscordDmService, DiscordWebhookService],
})
export class DiscordModule {}