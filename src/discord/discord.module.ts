import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Client, GatewayIntentBits } from 'discord.js';

import { DatabaseModule } from '../database/database.module';
import { DiceModule } from '../dice/dice.module';

import { DiscordService } from './discord.service';
import { DiscordDmService } from './discord.dm.service';
import { DiscordInteractions } from './discord.interactions';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    DiceModule,
  ],
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
    DiscordInteractions,
  ],
  exports: [Client],
})
export class DiscordModule {}