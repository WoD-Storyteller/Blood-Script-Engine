import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

@Injectable()
export class ResonanceService {
  async applyMessyCritical(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    /**
     * V5 Rule:
     * Messy Critical can intensify Resonance
     * or create Dyscrasia at ST discretion.
     *
     * Engine-side we:
     * - Increment resonance_intensity
     * - Flag dyscrasia_candidate
     */

    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{resonance}',
        COALESCE(sheet->'resonance', '{}'::jsonb) ||
        jsonb_build_object(
          'intensity',
          LEAST(3, COALESCE((sheet->'resonance'->>'intensity')::int, 0) + 1),
          'dyscrasia_candidate', true
        )
      )
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
  }
}