import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';
import { BoonType } from './politics.types';

@Injectable()
export class PoliticsService {
  private readonly logger = new Logger(PoliticsService.name);

  async grantBoon(client: any, input: {
    engineId: string;
    creditorCharacterId: string;
    debtorCharacterId: string;
    type: BoonType;
    reason: string;
  }) {
    try {
      await client.query(
        `
        INSERT INTO boons
          (boon_id, engine_id, creditor_character_id, debtor_character_id, boon_type, reason)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [
          uuid(),
          input.engineId,
          input.creditorCharacterId,
          input.debtorCharacterId,
          input.type,
          input.reason,
        ],
      );
      return { message: 'The debt is acknowledged and recorded.' };
    } catch (e: any) {
      this.logger.debug(`grantBoon fallback: ${e.message}`);
      return { message: 'A favor is understood, even if not formally recorded.' };
    }
  }

  async listBoons(client: any, input: {
    engineId: string;
    characterId: string;
  }): Promise<string[]> {
    try {
      const res = await client.query(
        `
        SELECT boon_id, boon_type, reason, called_in
        FROM boons
        WHERE engine_id = $1
          AND (creditor_character_id = $2 OR debtor_character_id = $2)
        ORDER BY created_at ASC
        `,
        [input.engineId, input.characterId],
      );

      return res.rows.map(
        (r: any) =>
          `${r.boon_id.slice(0, 6)} — ${r.boon_type.toUpperCase()} — ${r.reason}${
            r.called_in ? ' (called in)' : ''
          }`,
      );
    } catch (e: any) {
      this.logger.debug(`listBoons fallback: ${e.message}`);
      return ['Political debts are spoken of in whispers, not ledgers.'];
    }
  }

  async callInBoon(client: any, input: {
    engineId: string;
    boonId: string;
  }) {
    try {
      await client.query(
        `
        UPDATE boons
        SET called_in = true, resolved_at = now()
        WHERE engine_id = $1 AND boon_id = $2
        `,
        [input.engineId, input.boonId],
      );
      return { message: 'The boon is called in. The debt comes due.' };
    } catch (e: any) {
      this.logger.debug(`callInBoon fallback: ${e.message}`);
      return { message: 'The debt is invoked, even if the night resists records.' };
    }
  }

  async getPoliticalStatus(client: any, input: {
    engineId: string;
    characterId: string;
  }): Promise<string | null> {
    try {
      const res = await client.query(
        `
        SELECT title, faction, authority_level
        FROM political_status
        WHERE engine_id = $1 AND character_id = $2
        `,
        [input.engineId, input.characterId],
      );

      if (!res.rowCount) return null;

      const p = res.rows[0];
      return `${p.title} (${p.faction ?? 'Unaffiliated'}, Authority ${p.authority_level})`;
    } catch (e: any) {
      this.logger.debug(`politicalStatus fallback: ${e.message}`);
      return null;
    }
  }
}
