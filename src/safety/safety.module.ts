import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { TenetsService } from './tenets.service';

@Module({
  providers: [SafetyService, TenetsService],
  exports: [SafetyService],
})
export class SafetyModule {}
