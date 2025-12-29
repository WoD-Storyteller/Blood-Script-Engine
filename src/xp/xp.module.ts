import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { CharactersModule } from '../characters/characters.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { XpService } from './xp.service';
import { XpController } from './xp.controller';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    CharactersModule,
    RealtimeModule,
  ],
  providers: [XpService],
  controllers: [XpController],
  exports: [XpService],
})
export class XpModule {}