import { Module } from '@nestjs/common';
import { ResonanceService } from './resonance.service';

@Module({
  providers: [ResonanceService],
  exports: [ResonanceService],
})
export class ResonanceModule {}