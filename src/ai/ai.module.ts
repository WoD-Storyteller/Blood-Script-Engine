import { Module } from '@nestjs/common';
import { AiBrainService } from './ai-brain.service';
import { IntentExecutorService } from './intent-executor.service';
import { AutonomyService } from './autonomy.service';
import { ChronicleModule } from '../chronicle/chronicle.module';

@Module({
  imports: [ChronicleModule],
  providers: [AiBrainService, IntentExecutorService, AutonomyService],
  exports: [AutonomyService],
})
export class AiModule {}