import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { DiceController } from './dice.controller';
import { DiceService } from './dice.service';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    RealtimeModule,
  ],
  controllers: [DiceController],
  providers: [DiceService],
  exports: [DiceService],
})
export class DiceModule {}