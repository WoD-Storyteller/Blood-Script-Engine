
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { CharactersModule } from '../characters/characters.module';

import { DiceService } from './dice.service';
import { DiceController } from './dice.controller';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    CharactersModule,
  ],
  providers: [DiceService],
  controllers: [DiceController],
  exports: [DiceService],
})
export class DiceModule {}