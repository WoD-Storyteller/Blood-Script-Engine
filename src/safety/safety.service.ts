import { Injectable } from '@nestjs/common';
import { TenetsService } from './tenets.service';

type TenetCheckResult =
  | { allowed: true }
  | {
      allowed: false;
      tenetId: string | null;
      tenetTitle: string;
      category: string;
    };

@Injectable()
export class SafetyService {
  constructor(private readonly tenets: TenetsService) {}

  /**
   * Hard tenet check.
   * This is intentionally conservative in v1.
   */
  async checkTenets(
    client: any,
    input: { engineId: string; content: string },
  ): Promise<TenetCheckResult> {
    const active = await this.tenets.getActiveTenets(client, input.engineId);
    const text = input.content.toLowerCase();

    for (const t of active) {
      // Example hard tenet: "No children"
      if (t.title.toLowerCase().includes('no children')) {
        const hits = ['child', 'kid', 'minor', 'underage', 'school', 'teen'].some(
          (k) => text.includes(k),
        );
        if (hits) {
          return {
            allowed: false,
            tenetId: t.tenet_id,
            tenetTitle: t.title,
            category: 'minors',
          };
        }
      }
    }

    return { allowed: true };
  }

  /**
   * Issues/escalates formal warnings (engine-scoped).
   * Returns DM text for the Discord layer to send privately.
   */
  async issueOrEscalateWarning(
    client: any,
    input: { engineId: string; userId: string; category: string; tenetTitle: string },
  ): Promise<{ level: number; dmText: string }> {
    // count existing warning levels
    const existing = await client.query(
      `
      SELECT MAX(level) as level
      FROM player_tenet_warnings
      WHERE engine_id = $1 AND user_id = $2
      `,
      [input.engineId, input.userId],
    );

    const currentLevel = Number(existing.rows?.[0]?.level ?? 0);
    const nextLevel = Math.min(currentLevel + 1, 3);

    await client.query(
      `
      INSERT INTO player_tenet_warnings (engine_id, user_id, level, reason)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (engine_id, user_id, level) DO NOTHING
      `,
      [
        input.engineId,
        input.userId,
        nextLevel,
        `Tenet boundary pushed: ${input.category}`,
      ],
    );

    const dmText =
      nextLevel === 1
        ? `Formal warning: This chronicle has an active boundary (“${input.tenetTitle}”) that prevents that direction. Please don’t push scenes toward it again. If you’re unsure about boundaries, ask an ST privately.`
        : nextLevel === 2
        ? `Second warning: You are continuing to push content that violates an active chronicle boundary (“${input.tenetTitle}”). Further attempts may result in participation restrictions or ST review.`
        : `Final warning: Further attempts to push content violating (“${input.tenetTitle}”) will trigger safety escalation and may restrict participation pending ST review.`;

    return { level: nextLevel, dmText };
  }
}
