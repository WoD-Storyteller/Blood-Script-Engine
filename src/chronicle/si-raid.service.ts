import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class SIRaidService {
  /**
   * Executes an SI raid event.
   * Marks characters and locations as compromised.
   */
  async executeRaid(
    client: PoolClient,
    engineId: string,
  ) {
    /**
     * Mark random havens as burned.
     * Engine does not decide narrative outcome.
     */
    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{haven_compromised}',
        'true'::jsonb,
        true
      )
      WHERE engine_id = $1
        AND sheet ? 'haven'
      `,
      [engineId],
    );
  }
}
