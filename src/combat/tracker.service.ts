import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name);

  async ensureTracker(client: any, engineId: string, characterId: string) {
    try {
      await client.query(
        `
        INSERT INTO character_trackers (engine_id, character_id)
        VALUES ($1, $2)
        ON CONFLICT (engine_id, character_id) DO NOTHING
        `,
        [engineId, characterId],
      );
    } catch (e: any) {
      // Migration not applied yet or table missing
      this.logger.debug(`ensureTracker fallback: ${e.message}`);
    }
  }

  async applyHealthDamage(client: any, input: {
    engineId: string;
    characterId: string;
    superficial?: number;
    aggravated?: number;
  }) {
    try {
      await this.ensureTracker(client, input.engineId, input.characterId);

      await client.query(
        `
        UPDATE character_trackers
        SET
          health_superficial = GREATEST(0, health_superficial + $3),
          health_aggravated = GREATEST(0, health_aggravated + $4),
          last_updated = now()
        WHERE engine_id = $1 AND character_id = $2
        `,
        [
          input.engineId,
          input.characterId,
          input.superficial ?? 0,
          input.aggravated ?? 0,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`applyHealthDamage fallback: ${e.message}`);
    }
  }

  async addCondition(client: any, input: {
    engineId: string;
    characterId: string;
    name: string;
    severity?: string;
    source?: string;
    sceneId?: string;
  }) {
    try {
      await client.query(
        `
        INSERT INTO character_conditions
          (condition_id, engine_id, character_id, name, severity, source, scene_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          uuid(),
          input.engineId,
          input.characterId,
          input.name,
          input.severity ?? 'minor',
          input.source ?? null,
          input.sceneId ?? null,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`addCondition fallback: ${e.message}`);
    }
  }

  async logCombat(client: any, input: {
    engineId: string;
    sceneId: string;
    attackerCharacterId?: string;
    defenderCharacterId?: string;
    damage: number;
    damageType?: 'superficial' | 'aggravated';
    summary: string;
  }) {
    try {
      await client.query(
        `
        INSERT INTO combat_log
          (log_id, engine_id, scene_id, attacker_character_id, defender_character_id, damage, damage_type, summary)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `,
        [
          uuid(),
          input.engineId,
          input.sceneId,
          input.attackerCharacterId ?? null,
          input.defenderCharacterId ?? null,
          input.damage,
          input.damageType ?? 'superficial',
          input.summary,
        ],
      );
    } catch (e: any) {
      this.logger.debug(`logCombat fallback: ${e.message}`);
    }
  }
}
