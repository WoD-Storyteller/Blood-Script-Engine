import { Module } from '@nestjs/common';
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { OwnerDmService } from './owner-dm.service';

@Module({
  providers: [
    {
      provide: Client,
      useFactory: async () => {
        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages,
          ],
          partials: [Partials.Channel],
        });

        await client.login(process.env.DISCORD_BOT_TOKEN);
        return client;
      },
    },
    OwnerDmService,
  ],
  exports: [OwnerDmService],
})
export class DiscordModule {}