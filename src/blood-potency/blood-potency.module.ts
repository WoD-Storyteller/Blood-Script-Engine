import { Module } from '@nestjs/common';
import { BloodPotencyService } from './blood-potency.service';

@Module({
  providers: [BloodPotencyService],
  exports: [BloodPotencyService],
})
export class BloodPotencyModule {}
