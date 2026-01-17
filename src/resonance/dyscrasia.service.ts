import { Injectable, Logger } from '@nestjs/common';
import { PoolClient } from 'pg';
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
  ): Promise<{ eligible: boolean; applied: boolean }> {
    const resonanceState = await client.query(
      `
      SELECT
        sheet->'resonance'->>'type' AS resonance_type,
        COALESCE((sheet->'resonance'->>'intensity')::int, 0) AS resonance_intensity,
        sheet ? 'dyscrasia' AS has_dyscrasia
      FROM characters
      WHERE engine_id = $1 AND character_id = $2
      `,
      [engineId, characterId],
    );

    const resonanceRow = resonanceState.rows[0];
    if (!resonanceRow) {
      return { eligible: false, applied: false };
    }

    const eligible =
      resonanceRow.resonance_type &&
      resonanceRow.resonance_intensity >= DYSCRASIA_RULES.intensityThreshold;

    if (!eligible || resonanceRow.has_dyscrasia) {
      return { eligible, applied: false };
    }

    const reasonSuffix = context?.source
      ? ` for character ${characterId} (source: ${context.source})`
      : ` for character ${characterId}`;

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
        gen_random_uuid(),
        $1,
        $3,
        $4 || resonance_type || $5,
        now()
      FROM updated
      `,
      [
        engineId,
        characterId,
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

    return { eligible, applied: result.rowCount > 0 };
  }

  async cleanseDyscrasia(
    client: PoolClient,
    engineId: string,
    characterId: string,
    context?: {
      source?: string;
    },
  ) {
    const reason = context?.source
      ? `Dyscrasia cleansed for character ${characterId} (source: ${context.source})`
      : `Dyscrasia cleansed for character ${characterId}`;

    const result = await client.query(
      `
      WITH current AS (
        SELECT
          sheet ? 'dyscrasia' AS had_dyscrasia
        FROM characters
        WHERE engine_id = $1 AND character_id = $2
      ),
      updated AS (
        UPDATE characters
        SET sheet = sheet
          - 'dyscrasia'
          || jsonb_build_object('resonance', '{}'::jsonb)
        WHERE engine_id = $1 AND character_id = $2
        RETURNING character_id,
          (SELECT had_dyscrasia FROM current) AS had_dyscrasia
      )
      INSERT INTO owner_audit_log (
        audit_id,
        engine_id,
        action_type,
        reason,
        created_at
      )
      SELECT
        gen_random_uuid(),
        $1,
        $3,
        $4,
        now()
      FROM updated
      WHERE updated.had_dyscrasia = true
      `,
      [
        engineId,
        characterId,
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
