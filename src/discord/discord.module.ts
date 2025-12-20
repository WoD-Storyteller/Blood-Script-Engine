import { Module } from '@nestjs/common';
import { Client, GatewayIntentBits, Partials } from 'discord.js';

import { OwnerDmService } from './owner-dm.service';
import { DiscordDmService } from './discord.dm.service';

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

        await client.login(process.env.DISCORD_BOT_TOKEN);
        return client;
      },
    },
    OwnerDmService,
    DiscordDmService,
  ],
  exports: [Client, OwnerDmService, DiscordDmService],
})
export class DiscordModule {}