import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { CHRONICLE_CLOCKS } from './chronicle-clocks.map';

@Injectable()
export class ChronicleClocksService {
  /**
   * Initialize all clocks if they do not exist.
   */
  async initialize(client: PoolClient, engineId: string) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        COALESCE(state, '{}'::jsonb),
        '{clocks}',
        COALESCE(state->'clocks', $2::jsonb),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, JSON.stringify(this.defaultClockState())],
    );
  }

  /**
   * Advance a chronicle clock by N segments.
   */
  async advance(
    client: PoolClient,
    engineId: string,
    clockId: string,
    amount = 1,
  ) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        state,
        ARRAY['clocks', $2, 'progress'],
        to_jsonb(
          LEAST(
            (state->'clocks'->$2->>'segments')::int,
            COALESCE((state->'clocks'->$2->>'progress')::int, 0) + $3
          )
        ),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, clockId, amount],
    );
  }

  /**
   * Read all chronicle clocks.
   */
  async getClocks(client: PoolClient, engineId: string) {
    const result = await client.query(
      `
      SELECT state->'clocks' AS clocks
      FROM chronicles
      WHERE engine_id = $1
      `,
      [engineId],
    );

    return result.rows[0]?.clocks ?? {};
  }

  private defaultClockState() {
    const clocks: Record<string, any> = {};

    for (const [id, config] of Object.entries(CHRONICLE_CLOCKS)) {
      clocks[id] = {
        segments: config.segments,
        progress: 0,
        description: config.description,
      };
    }

    return clocks;
  }
}