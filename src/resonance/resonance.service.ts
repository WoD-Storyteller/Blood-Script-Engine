import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DyscrasiaService } from './dyscrasia.service';

const RESONANCE_TYPES = [
  'choleric',
  'sanguine',
  'melancholic',
  'phlegmatic',
];

@Injectable()
export class ResonanceService {
  constructor(private readonly dyscrasiaService: DyscrasiaService) {}

  async applyMessyCritical(
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
      )
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );

    return this.dyscrasiaService.applyFromResonance(
      client,
      engineId,
      characterId,
      {
        source: 'messy_critical',
      },
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
    await this.dyscrasiaService.cleanseDyscrasia(
      client,
      engineId,
      characterId,
      {
        source: 'manual_cleanse',
      },
    );
  }
}
