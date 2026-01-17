import { Module, Logger, forwardRef } from '@nestjs/common';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

import { OwnerDmService } from './owner-dm.service';
import { DiscordDmService } from './discord.dm.service';
import { DiscordWebhookService } from './discord-webhook.service';
import { NpcVoiceService } from './npc-voice.service';
import { DatabaseModule } from '../database/database.module';
import { AiModule } from '../ai/ai.module';

const logger = new Logger('DiscordModule');

@Module({
  imports: [DatabaseModule, forwardRef(() => AiModule)],
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
    NpcVoiceService,
  ],
  exports: [Client, OwnerDmService, DiscordDmService, DiscordWebhookService, NpcVoiceService],
})
export class DiscordModule {}