import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  /**
   * Mark all characters owned by this user as online
   * in this engine.
   */
  async markUserOnline(
    client: any,
    engineId: string,
    userId: string,
  ) {
    // Find characters owned by this user in this engine
    const chars = await client.query(
      `
      SELECT character_id
      FROM characters
      WHERE engine_id = $1 AND user_id = $2
      `,
      [engineId, userId],
    );

    for (const row of chars.rows) {
      await client.query(
        `
        INSERT INTO presence (engine_id, character_id, status, last_seen_at)
        VALUES ($1, $2, 'online', now())
        ON CONFLICT (engine_id, character_id)
        DO UPDATE SET
          status = 'online',
          last_seen_at = now()
        `,
        [engineId, row.character_id],
      );
    }
  }
}
