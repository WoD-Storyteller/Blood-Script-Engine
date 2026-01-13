import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

const RESONANCE_TYPES = [
  'choleric',
  'sanguine',
  'melancholic',
  'phlegmatic',
];

@Injectable()
export class ResonanceService {
  async applyMessyCritical(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = (
        WITH current AS (
          SELECT sheet
          FROM characters
          WHERE engine_id = $1 AND character_id = $2
        ),
        intensified AS (
          SELECT
            jsonb_set(
              sheet,
              '{resonance}',
              jsonb_set(
                COALESCE(sheet->'resonance', '{}'::jsonb),
                '{intensity}',
                to_jsonb(
                  LEAST(
                    3,
                    COALESCE((sheet->'resonance'->>'intensity')::int, 0) + 1
                  )
                ),
                true
              ),
              true
            ) AS sheet
          FROM current
        )
        SELECT
          CASE
            WHEN (intensified.sheet->'resonance'->>'intensity')::int >= 3
            THEN jsonb_set(
              intensified.sheet,
              '{dyscrasia}',
              jsonb_build_object(
                'type',
                intensified.sheet->'resonance'->>'type'
              ),
              true
            )
            ELSE intensified.sheet
          END
        FROM intensified
      )
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );
  }

  async applyBestialFailure(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    const newType =
      RESONANCE_TYPES[Math.floor(Math.random() * RESONANCE_TYPES.length)];

    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{resonance}',
        jsonb_build_object(
          'type', $3,
          'intensity', COALESCE((sheet->'resonance'->>'intensity')::int, 0)
        ),
        true
      )
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId, newType],
    );
  }

  async decayResonance(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{resonance}',
        CASE
          WHEN COALESCE((sheet->'resonance'->>'intensity')::int, 0) <= 1
          THEN '{}'::jsonb
          ELSE jsonb_set(
            sheet->'resonance',
            '{intensity}',
            to_jsonb(
              COALESCE((sheet->'resonance'->>'intensity')::int, 0) - 1
            ),
            true
          )
        END,
        true
      )
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );
  }

  /**
   * DY SCRASIA CLEANSING
   *
   * Story-triggered, explicit removal.
   * Clears Dyscrasia and resets Resonance.
   */
  async cleanseDyscrasia(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    await client.query(
      `
      UPDATE characters
      SET sheet = sheet
        - 'dyscrasia'
        || jsonb_build_object('resonance', '{}'::jsonb)
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );
  }
}
