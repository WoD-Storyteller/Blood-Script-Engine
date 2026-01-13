import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class ResonanceSTService {
  /**
   * Returns all characters with active Dyscrasia
   * for Storyteller oversight.
   */
  async listDyscrasia(client: PoolClient, engineId: string) {
    const result = await client.query(
      `
      SELECT
        character_id,
        sheet->'dyscrasia' AS dyscrasia,
        sheet->'resonance' AS resonance
      FROM characters
      WHERE engine_id = $1
        AND sheet ? 'dyscrasia'
      `,
      [engineId],
    );

    return result.rows;
  }

  /**
   * Returns resonance state for a single character.
   */
  async getCharacterBloodState(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    const result = await client.query(
      `
      SELECT
        sheet->'resonance' AS resonance,
        sheet->'dyscrasia' AS dyscrasia
      FROM characters
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );

    return result.rows[0] ?? null;
  }

  /**
   * High-level overview for ST dashboards.
   */
  async bloodStateSummary(client: PoolClient, engineId: string) {
    const result = await client.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE sheet ? 'dyscrasia') AS dyscrasia_count,
        COUNT(*) FILTER (
          WHERE (sheet->'resonance'->>'intensity')::int > 0
        ) AS resonance_active_count
      FROM characters
      WHERE engine_id = $1
      `,
      [engineId],
    );

    return result.rows[0];
  }
}
