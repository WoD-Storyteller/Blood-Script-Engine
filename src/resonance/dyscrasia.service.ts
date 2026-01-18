import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
import { uuid } from '../common/utils/uuid';
import { DYSCRASIA_RULES } from './dyscrasia.rules';

@Injectable()
export class DyscrasiaService {
  private readonly logger = new Logger(DyscrasiaService.name);

  async applyFromResonance(
    client: PoolClient,
    engineId: string,
    characterId: string,
    context?: {
      source?: string;
    },
  ) {
    const source = context?.source ?? 'unspecified';
    const reasonSuffix = ` for character ${characterId} (source: ${source})`;

    // V5 Core: acute Resonance incorporates a Dyscrasia. We only apply when
    // resonance intensity reaches the acute threshold and a Resonance type exists.
    // rules-source/v5_core_clean.txt
    const result = await client.query(
      `
      WITH updated AS (
        UPDATE characters
        SET sheet = jsonb_set(
          sheet,
          '{dyscrasia}',
          jsonb_build_object('type', sheet->'resonance'->>'type'),
          true
        )
        WHERE engine_id = $1
          AND character_id = $2
          AND (sheet->'resonance'->>'type') IS NOT NULL
          AND COALESCE((sheet->'resonance'->>'intensity')::int, 0) >= $3
          AND NOT (sheet ? 'dyscrasia')
        RETURNING sheet->'resonance'->>'type' AS resonance_type
      )
      INSERT INTO owner_audit_log (
        audit_id,
        engine_id,
        action_type,
        reason,
        created_at
      )
      SELECT
        $4,
        $1,
        $5,
        $6 || resonance_type || $7,
        now()
      FROM updated
      `,
      [
        engineId,
        characterId,
        DYSCRASIA_RULES.acuteIntensity,
        uuid(),
        DYSCRASIA_RULES.auditActions.apply,
        'Dyscrasia applied (',
        `)${reasonSuffix}`,
      ],
    );

    if (result.rowCount > 0) {
      this.logger.log(
        `Dyscrasia applied for character ${characterId} in engine ${engineId}.`,
      );
    }

    return result.rowCount > 0;
  }

  async cleanseDyscrasia(
    client: PoolClient,
    engineId: string,
    characterId: string,
    context?: {
      source?: string;
    },
  ) {
    const source = context?.source ?? 'unspecified';
    const reason = `Dyscrasia cleansed for character ${characterId} (source: ${source})`;

    const result = await client.query(
      `
      WITH updated AS (
        UPDATE characters
        SET sheet = sheet
          - 'dyscrasia'
          || jsonb_build_object('resonance', '{}'::jsonb)
        WHERE engine_id = $1 AND character_id = $2
          AND sheet ? 'dyscrasia'
        RETURNING character_id
      )
      INSERT INTO owner_audit_log (
        audit_id,
        engine_id,
        action_type,
        reason,
        created_at
      )
      SELECT
        $3,
        $1,
        $4,
        $5,
        now()
      FROM updated
      `,
      [
        engineId,
        characterId,
        uuid(),
        DYSCRASIA_RULES.auditActions.cleanse,
        reason,
      ],
    );

    if (result.rowCount > 0) {
      this.logger.log(
        `Dyscrasia cleansed for character ${characterId} in engine ${engineId}.`,
      );
    }

    return result.rowCount > 0;
  }
}
