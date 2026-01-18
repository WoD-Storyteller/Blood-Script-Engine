import { Module } from '@nestjs/common';
import { BloodPotencyProgressionService } from './blood-potency.progression.service';
import { BloodPotencyService } from './blood-potency.service';
import { DiceModule } from '../dice/dice.module';

@Module({
  imports: [DiceModule],
  providers: [BloodPotencyService, BloodPotencyProgressionService],
  exports: [BloodPotencyService, BloodPotencyProgressionService],
})
export class BloodPotencyModule {}
