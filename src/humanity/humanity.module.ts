import { Module } from '@nestjs/common';
import { HumanityService } from './humanity.service';
import { HumanityController } from './humanity.controller';
import { DiceModule } from '../dice/dice.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';

@Module({
  imports: [
    DiceModule,
    RealtimeModule,
    DatabaseModule,
    CompanionModule,
  ],
  providers: [HumanityService],
  controllers: [HumanityController],
  exports: [HumanityService],
})
export class HumanityModule {}
