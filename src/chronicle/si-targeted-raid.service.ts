import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class SITargetedRaidService {
  /**
   * Target a specific character.
   */
  async raidCharacter(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{si_targeted}',
        'true'::jsonb,
        true
      )
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );
  }

  /**
   * Target a specific haven.
   */
  async raidHaven(
    client: PoolClient,
    engineId: string,
    havenId: string,
  ) {
    await client.query(
      `
      UPDATE havens
      SET state = jsonb_set(
        COALESCE(state, '{}'::jsonb),
        '{si_compromised}',
        'true'::jsonb,
        true
      )
      WHERE engine_id = $1 AND haven_id = $2
      `,
      [engineId, havenId],
    );
  }
}