import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

const RESONANCE_TYPES = ['choleric', 'sanguine', 'melancholic', 'phlegmatic'];

@Injectable()
export class ResonanceService {
  async applyMessyCritical(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    /**
     * Messy Critical:
     * - Intensify Resonance
     * - Auto-create Dyscrasia at max intensity
     */
    await client.query(
      `
      UPDATE characters
      SET sheet = (
        WITH current AS (
          SELECT sheet
          FROM characters
          WHERE engine_id = $1 AND character_id = $2
        ),
        updated AS (
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
            WHEN (updated.sheet->'resonance'->>'intensity')::int >= 3
            THEN
              jsonb_set(
                updated.sheet,
                '{dyscrasia}',
                jsonb_build_object(
                  'type',
                  updated.sheet->'resonance'->>'type'
                ),
                true
              )
            ELSE updated.sheet
          END
        FROM updated
      )
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
  }

  async applyBestialFailure(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    /**
     * Bestial Failure:
     * - Mutates Resonance type unpredictably
     * - Does NOT increase intensity
     */
    const newType =
      RESONANCE_TYPES[Math.floor(Math.random() * RESONANCE_TYPES.length)];

    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{resonance}',
        jsonb_build_object(
          'type