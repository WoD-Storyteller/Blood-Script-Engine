import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordDmService } from './discord.dm.service';
import { ConfigModule } from '@nestjs/config';
import { Client, GatewayIntentBits } from 'discord.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: Client,
      useFactory: () => {
        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.DirectMessages,
          ],
        });
        client.login(process.env.DISCORD_BOT_TOKEN);
        return client;
      },
    },
    DiscordService,
    DiscordDmService,
  ],
  exports: [DiscordService, DiscordDmService, Client],
})
export class DiscordModule {}