
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { CompanionModule } from '../companion/companion.module';
import { CharactersModule } from '../characters/characters.module';
import { CompulsionsModule } from '../hunger/compulsions.module';
import { ResonanceModule } from '../resonance/resonance.module';
import { DiceService } from './dice.service';
import { DiceController } from './dice.controller';

@Module({
  imports: [
    DatabaseModule,
    CompanionModule,
    CharactersModule,
    CompulsionsModule,
    ResonanceModule,
  ],
  providers: [DiceService],
  controllers: [DiceController],
  exports: [DiceService],
})
export class DiceModule {}