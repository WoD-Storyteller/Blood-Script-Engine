
import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class HumanityService {
  async recordStain(
    client: PoolClient,
    engineId: string,
    characterId: string,
    reason: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{stains}',
        to_jsonb(
          COALESCE((sheet->>'stains')::int, 0) + 1
        )
      )
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );

    await client.query(
      `
      INSERT INTO humanity_events
      (engine_id, character_id, reason)
      VALUES ($1, $2, $3)
      `,
      [engineId, characterId, reason],
    );
  }

  async resolveRemorse(
    client: PoolClient,
    engineId: string,
    characterId: string,
    successes: number,
  ) {
    const r = await client.query(
      `
      SELECT
        (sheet->>'stains')::int AS stains,
        (sheet->>'humanity')::int AS humanity
      FROM characters
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );

    if (!r.rowCount) return;

    const { stains, humanity } = r.rows[0];

    if (successes < stains) {
      await client.query(
        `
        UPDATE characters
        SET sheet = jsonb_set(
          sheet,
          '{humanity}',
          to_jsonb(GREATEST(0, $3 - 1))
        )
        WHERE engine_id=$1 AND character_id=$2
        `,
        [engineId, characterId, humanity],
      );
    }

    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(sheet, '{stains}', '0')
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
  }
}