import { Injectable } from '@nestjs/common';

@Injectable()
export class OutputValidator {
  validate(text: string): string {
    if (!text || text.length < 10) {
      throw new Error('Narration too short or empty');
    }

    // Prevent dice hallucinations
    if (/\b(successes?|dice|rolled)\b/i.test(text)) {
      throw new Error('Narration leaked mechanics');
    }

    return text.trim();
  }
}
