import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { MASQUERADE_COVERUPS } from './masquerade-decay.map';

@Injectable()
export class MasqueradeCoverupService {
  /**
   * Explicit masquerade cover-up action.
   * Story-triggered, not automatic.
   */
  async applyCoverup(
    client: PoolClient,
    engineId: string,
    level: 'minor' | 'major' | 'extreme',
  ) {
    const config = MASQUERADE_COVERUPS[level];

    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        state,
        '{masquerade_pressure}',
        to_jsonb(
          GREATEST(
            0,
            COALESCE((state->>'masquerade_pressure')::int, 0) - $2
          )
        ),
        true
      )
      WHERE engine_id = $1
      `,
      [engineId, config.reduction],
    );
  }
}