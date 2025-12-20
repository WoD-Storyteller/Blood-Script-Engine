import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  async markUserOnline(
    client: any,
    engineId: string,
    userId: string,
  ) {
    await client.query(
      `
      INSERT INTO user_presence (engine_id, user_id, status)
      VALUES ($1,$2,'online')
      ON CONFLICT (engine_id, user_id)
      DO UPDATE SET status='online', updated_at=now()
      `,
      [engineId, userId],
    );
  }

  async markUserOffline(
    client: any,
    engineId: string,
    userId: string,
  ) {
    await client.query(
      `
      UPDATE user_presence
      SET status='offline', updated_at=now()
      WHERE engine_id=$1 AND user_id=$2
      `,
      [engineId, userId],
    );
  }
}
