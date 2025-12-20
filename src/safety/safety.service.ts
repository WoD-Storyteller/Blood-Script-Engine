import { Injectable } from '@nestjs/common';
import { TenetCheckResult } from './tenets.types';

@Injectable()
export class SafetyService {
  async checkTenets(
    client: any,
    input: {
      engineId: string;
      content: string;
    },
  ): Promise<TenetCheckResult> {
    // Example: fetch tenets for engine
    const tenets = await client.query(
      `
      SELECT tenet_id, title, category, pattern
      FROM tenets
      WHERE engine_id = $1
      `,
      [input.engineId],
    );

    for (const t of tenets.rows) {
      const regex = new RegExp(t.pattern, 'i');
      if (regex.test(input.content)) {
        return {
          allowed: false,
          tenetId: t.tenet_id,
          tenetTitle: t.title,
          category: t.category,
        };
      }
    }

    return { allowed: true };
  }

  async issueOrEscalateWarning(
    client: any,
    input: {
      engineId: string;
      userId: string;
      category: string;
      tenetTitle: string;
    },
  ): Promise<{ dmText: string }> {
    await client.query(
      `
      INSERT INTO safety_warnings
        (engine_id, user_id, category, tenet_title)
      VALUES ($1,$2,$3,$4)
      `,
      [input.engineId, input.userId, input.category, input.tenetTitle],
    );

    return {
      dmText: `⚠️ **Content Warning Issued**\nTenet violated: **${input.tenetTitle}**`,
    };
  }
}
