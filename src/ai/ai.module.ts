import { Module } from '@nestjs/common';
import { GeminiClient } from './gemini.client';
import { PromptBuilder } from './prompt.builder';
import { TenetFilter } from './tenet.filter';
import { OutputValidator } from './output.validator';
import { NarrationService } from './narration.service';

@Module({
  providers: [
    GeminiClient,
    PromptBuilder,
    TenetFilter,
    OutputValidator,
    NarrationService,
  ],
  exports: [NarrationService],
})
export class AiModule {}
