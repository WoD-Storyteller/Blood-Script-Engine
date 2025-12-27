import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

export type SafetyLevel = 'green' | 'yellow' | 'red';

@Injectable()
export class SafetyEventsService {
  async submit(
    client: any,
    engineId: string,
    userId: string,
    body: {
      type: SafetyLevel;
      sceneId?: string;
      context?: any;
    },
  ) {
    const id = uuid();

    await client.query(
      `
      INSERT INTO safety_signals
        (signal_id, engine_id, scene_id, signal_type)
      VALUES ($1,$2,$3,$4)
      `,
      [id, engineId, body.sceneId ?? null, body.type],
    );

    await client.query(
      `
      INSERT INTO scene_safety_state
        (engine_id, scene_id, status, last_signal_at, unresolved_since)
      VALUES ($1,$2,$3,now(),now())
      ON CONFLICT (scene_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        last_signal_at = now(),
        unresolved_since = COALESCE(scene_safety_state.unresolved_since, now())
      `,
      [engineId, body.sceneId ?? id, body.type],
    );

    return { id, level: body.type };
  }

  async active(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT scene_id, status, unresolved_since
      FROM scene_safety_state
      WHERE engine_id = $1 AND status != 'green'
      ORDER BY unresolved_since ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async resolve(client: any, engineId: string, sceneId: string) {
    await client.query(
      `
      UPDATE scene_safety_state
      SET status = 'green',
          unresolved_since = NULL
      WHERE engine_id = $1 AND scene_id = $2
      `,
      [engineId, sceneId],
    );
    return { sceneId, resolved: true };
  }
}