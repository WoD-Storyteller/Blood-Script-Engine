import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class IntentsService {
  async create(client: any, input: {
    engineId: string;
    sceneId: string;
    userId: string;
    content: string;
  }) {
    const intentId = uuid();

    await client.query(
      `
      INSERT INTO player_intents
        (intent_id, engine_id, scene_id, user_id, content)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [intentId, input.engineId, input.sceneId, input.userId, input.content],
    );

    return { intentId };
  }

  async list(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT intent_id, scene_id, user_id, content, created_at
      FROM player_intents
      WHERE engine_id = $1
      ORDER BY created_at DESC
      LIMIT 50
      `,
      [engineId],
    );

    return res.rows;
  }
}