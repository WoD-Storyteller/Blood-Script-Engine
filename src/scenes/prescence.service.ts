import { Injectable } from '@nestjs/common';

@Injectable()
export class PresenceService {
  async markPresent(
    client: any,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      INSERT INTO presence (engine_id, character_id, status)
      VALUES ($1,$2,'online')
      ON CONFLICT (engine_id, character_id)
      DO UPDATE SET status='online', updated_at=now()
      `,
      [engineId, characterId],
    );
  }

  async markOffline(
    client: any,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE presence
      SET status='offline', updated_at=now()
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
  }

  async listPresent(client: any, engineId: string, sceneId: string) {
    const res = await client.query(
      `
      SELECT p.character_id, p.status
      FROM presence p
      JOIN scenes s ON s.scene_id=$2
      WHERE p.engine_id=$1
      `,
      [engineId, sceneId],
    );
    return res.rows;
  }
}