import { Injectable } from '@nestjs/common';

@Injectable()
export class TenetFilter {
  private forbiddenPatterns = [
    /\bchild\b/i,
    /\bminor\b/i,
    /\bunderrage\b/i,
    /\bsexual\b/i,
    /\brape\b/i,
  ];

  enforce(text: string): string {
    for (const pattern of this.forbiddenPatterns) {
      if (pattern.test(text)) {
        throw new Error('Generated text violates server tenets');
      }
    }
    return text;
  }
}
