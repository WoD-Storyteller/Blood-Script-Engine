import { Injectable, Logger } from '@nestjs/common';
import { GeminiClient } from './gemini.client';
import { PromptBuilder } from './prompt.builder';
import { TenetFilter } from './tenet.filter';
import { OutputValidator } from './output.validator';

@Injectable()
export class NarrationService {
  private readonly logger = new Logger(NarrationService.name);

  constructor(
    private readonly gemini: GeminiClient,
    private readonly prompts: PromptBuilder,
    private readonly tenets: TenetFilter,
    private readonly validator: OutputValidator,
  ) {}

  async narrate(input: {
    systemTone: string;
    sceneSummary: string;
    mechanicalResult: string;
    disciplineNote?: string;
    npcVoices?: string[];
  }): Promise<string> {
    try {
      const prompt = this.prompts.build(input);
      const raw = await this.gemini.generate(prompt);
      const validated = this.validator.validate(raw);
      return this.tenets.enforce(validated);
    } catch (err: any) {
      this.logger.warn(
        `Narration fallback used: ${err.message}`,
      );
      return input.mechanicalResult;
    }
  }
}
