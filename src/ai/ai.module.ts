import { Module } from '@nestjs/common';
import { AiBrainService } from './ai-brain.service';
import { IntentExecutorService } from './intent-executor.service';
import { AutonomyService } from './autonomy.service';
import { GeminiClient } from './gemini.client';
import { ChronicleModule } from '../chronicle/chronicle.module';

@Module({
  imports: [ChronicleModule],
  providers: [AiBrainService, IntentExecutorService, AutonomyService, GeminiClient],
  exports: [AutonomyService, GeminiClient],
})
export class AiModule {}