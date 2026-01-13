import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class MasqueradeLockdownService {
  /**
   * Applies citywide lockdown effects.
   * Engine marks state; narrative handled by ST.
   */
  async applyLockdown(
    client: PoolClient,
    engineId: string,
  ) {
    await client.query(
      `
      UPDATE chronicles
      SET state = jsonb_set(
        COALESCE(state, '{}'::jsonb),
        '{city_lockdown}',
        'true'::jsonb,
        true
      )
      WHERE engine_id = $1
      `,
      [engineId],
    );
  }
}
