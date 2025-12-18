import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class RecoveryService {
  private readonly logger = new Logger(RecoveryService.name);

  /**
   * Attempt light rest-based recovery.
   * This is intentionally conservative.
   */
  async rest(client: any, input: {
    engineId: string;
    characterId: string;
  }): Promise<{ message: string }> {
    try {
      const tracker = await client.query(
        `
        SELECT
          health_superficial,
          willpower_superficial
        FROM character_trackers
        WHERE engine_id = $1 AND character_id = $2
        `,
        [input.engineId, input.characterId],
      );

      if (!tracker.rowCount) {
        return { message: 'You take time to rest, but nothing visibly changes.' };
      }

      const t = tracker.rows[0];

      const newHealth = Math.max(0, t.health_superficial - 1);
      const newWillpower = Math.max(0, t.willpower_superficial - 2);

      await client.query(
        `
        UPDATE character_trackers
        SET
          health_superficial = $3,
          willpower_superficial = $4,
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `,
        [input.engineId, input.characterId, newHealth, newWillpower],
      );

      return {
        message:
          'You take time to recover. Some of the strain fades, but deeper wounds remain.',
      };
    } catch (e: any) {
      this.logger.debug(`Rest fallback: ${e.message}`);
      return {
        message:
          'You take time to rest, but your condition is difficult to judge right now.',
      };
    }
  }

  /**
   * Active healing attempt (v1 abstraction).
   */
  async heal(client: any, input: {
    engineId: string;
    characterId: string;
  }): Promise<{ message: string }> {
    try {
      const tracker = await client.query(
        `
        SELECT health_superficial
        FROM character_trackers
        WHERE engine_id = $1 AND character_id = $2
        `,
        [input.engineId, input.characterId],
      );

      if (!tracker.rowCount || tracker.rows[0].health_superficial <= 0) {
        return {
          message: 'There is nothing left to mend right now.',
        };
      }

      const newHealth = Math.max(0, tracker.rows[0].health_superficial - 2);

      await client.query(
        `
        UPDATE character_trackers
        SET
          health_superficial = $3,
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `,
        [input.engineId, input.characterId, newHealth],
      );

      return {
        message:
          'The pain dulls as vitae knits damaged flesh back together.',
      };
    } catch (e: any) {
      this.logger.debug(`Heal fallback: ${e.message}`);
      return {
        message:
          'You focus on recovery, but the results are uncertain.',
      };
    }
  }
}
