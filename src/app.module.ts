import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { EngineModule } from './engine/engine.module';
import { SafetyModule } from './safety/safety.module';
import { ScenesModule } from './scenes/scenes.module';
import { CharactersModule } from './characters/characters.module';
import { CoteriesModule } from './coteries/coteries.module';
import { HavensModule } from './havens/havens.module';
import { PoliticsModule } from './politics/politics.module';
import { OccultModule } from './occult/occult.module';
import { WorldModule } from './world/world.module';
import { DiscordModule } from './discord/discord.module';
import { AiModule } from './ai/ai.module';
import { OwnerModule } from './owner/owner.module';
import { JobsModule } from './jobs/jobs.module';
import { SessionMiddleware } from './common/middleware/session.middleware';
import { DiceModule } from './dice/dice.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    EngineModule,
    SafetyModule,
    ScenesModule,
    CharactersModule,
    CoteriesModule,
    HavensModule,
    PoliticsModule,
    OccultModule,
    WorldModule,
    DiscordModule,
    AiModule,
    OwnerModule,
    JobsModule,
    DiceModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes('*');
  }
}