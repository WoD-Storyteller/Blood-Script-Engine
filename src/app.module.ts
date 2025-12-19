import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

import { AuthModule } from './auth/auth.module';
import { EngineModule } from './engine/engine.module';
import { SafetyModule } from './safety/safety.module';
import { ScenesModule } from './scenes/scenes.module';
import { PoliticsModule } from './politics/politics.module';
import { ChronicleModule } from './chronicle/chronicle.module';
import { DiscordModule } from './discord/discord.module';
import { AiModule } from './ai/ai.module';
import { CompanionModule } from './companion/companion.module';
import { ThreatsModule } from './threats/threats.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RealtimeModule,
    AuthModule,
    EngineModule,
    SafetyModule,
    ScenesModule,
    PoliticsModule,
    ChronicleModule,
    ThreatsModule,
    AiModule,
    DiscordModule,

    CompanionModule,
    JobsModule,

    // Probes
    HealthModule,
  ],
})
export class AppModule {}