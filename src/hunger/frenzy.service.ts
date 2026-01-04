import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class FrenzyService {
  async triggerFrenzy(
    client: PoolClient,
    engineId: string,
    characterId: string,
    type: 'hunger' | 'rage' | 'terror',
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{frenzy}',
        jsonb_build_object(
          'type', $3,
          'active', true
        )
      )
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId, type],
    );
  }

  async clearFrenzy(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = sheet - 'frenzy'
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
  }
}