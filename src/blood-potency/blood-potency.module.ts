import { Module } from '@nestjs/common';
import { BloodPotencyProgressionService } from './blood-potency.progression.service';
import { BloodPotencyService } from './blood-potency.service';

@Module({
  providers: [BloodPotencyService, BloodPotencyProgressionService],
  exports: [BloodPotencyService, BloodPotencyProgressionService],
})
export class BloodPotencyModule {}
