import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { MASQUERADE_DECAY } from './masquerade-decay.map';

@Injectable()
export class MasqueradeDecayService {
  /**
   * Passive masquerade pressure decay.
   * Intended to be called on scene end or night transition.
   */
  async decay(
    client: PoolClient,
    engineId: string,
  ) {
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
      [engineId, MASQUERADE_DECAY.passiveDecay],
    );
  }
}