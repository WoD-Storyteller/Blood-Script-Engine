import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { CoteriesAdapter } from '../coteries/coteries.adapter';

enum ConflictActionKind {
  ATTACK = 'attack',
  DEFEND = 'defend',
  SABOTAGE = 'sabotage',
  WITHDRAW = 'withdraw',
}

enum ConflictStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  RESOLVED = 'resolved',
}

@Injectable()
export class ConflictService {
  private readonly logger = new Logger(ConflictService.name);

  constructor(private readonly coteries: CoteriesAdapter) {}

  async declareConflict(client: any, input: {
    engineId: string;
    attacker: string;
    defender: string;
    territory: string;
  }): Promise<{ message: string }> {
    try {
      const atk = await this.coteries.findByName(client, input.engineId, input.attacker);
      const def = await this.coteries.findByName(client, input.engineId, input.defender);

      if (!atk || !def) {
        return { message: 'One or both coteries could not be found.' };
      }

      await client.query(
        `
        INSERT INTO coterie_conflicts
          (conflict_id, engine_id, attacker_coterie_id, defender_coterie_id, territory)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [uuid(), input.engineId, atk.coterie_id, def.coterie_id, input.territory],
      );

      return {
        message: `⚔️ **Conflict declared**: ${atk.name} vs ${def.name} over **${input.territory}**.`,
      };
    } catch (e: any) {
      this.logger.debug(`declareConflict fallback: ${e.message}`);
      return { message: `I can’t declare conflicts right now.` };
    }
  }

  async act(client: any, input: {
    conflictIdPrefix: string;
    engineId: string;
    coterieName: string;
    kind: ConflictActionKind;
    description: string;
  }): Promise<{ message: string }> {
    try {
      const conflict = await client.query(
        `
        SELECT conflict_id
        FROM coterie_conflicts
        WHERE engine_id = $1 AND CAST(conflict_id AS TEXT) LIKE $2
          AND status = '${ConflictStatus.ACTIVE}'
        LIMIT 1
        `,
        [input.engineId, `${input.conflictIdPrefix}%`],
      );

      if (!conflict.rowCount) {
        return { message: 'No active conflict found.' };
      }

      const cot = await this.coteries.findByName(client, input.engineId, input.coterieName);
      if (!cot) return { message: 'Coterie not found.' };

      await client.query(
        `
        INSERT INTO conflict_actions
          (action_id, conflict_id, coterie_id, kind, description)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [uuid(), conflict.rows[0].conflict_id, cot.coterie_id, input.kind, input.description],
      );

      return { message: `Action recorded: **${input.kind}** — ${input.description}` };
    } catch (e: any) {
      this.logger.debug(`act fallback: ${e.message}`);
      return { message: `I can’t record conflict actions right now.` };
    }
  }

  async listConflicts(client: any, engineId: string): Promise<{ message: string }> {
    try {
      const res = await client.query(
        `
        SELECT conflict_id, territory, intensity, status
        FROM coterie_conflicts
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [engineId],
      );

      if (!res.rowCount) return { message: 'No active conflicts.' };

      const lines = res.rows.map(
        (r: any) =>
          `• \`${String(r.conflict_id).slice(0, 8)}\` **${r.territory}** — intensity ${r.intensity} (${r.status})`,
      );

      return { message: `**Coterie Conflicts**\n${lines.join('\n')}` };
    } catch (e: any) {
      this.logger.debug(`listConflicts fallback: ${e.message}`);
      return { message: `I can’t list conflicts right now.` };
    }
  }
}
