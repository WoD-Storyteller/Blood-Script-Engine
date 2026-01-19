import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { DiscordModule } from '../discord/discord.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NarrativeService } from './narrative.service';

@Module({
  imports: [DatabaseModule, DiscordModule, RealtimeModule],
  providers: [NarrativeService],
  exports: [NarrativeService],
})
export class NarrativeModule {}
