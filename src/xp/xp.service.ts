import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class XpService {
  // V5 core XP costs (simplified but correct)
  cost(input: { type: string; current: number }): number {
    switch (input.type) {
      case 'attribute':
        return (input.current + 1) * 5;
      case 'skill':
        return (input.current + 1) * 3;
      case 'discipline':
        return (input.current + 1) * 5;
      case 'blood_potency':
        return (input.current + 1) * 10;
      default:
        throw new Error('Unknown XP type');
    }
  }

  async availableXp(client: any, engineId: string, characterId: string) {
    const res = await client.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type='earn' THEN amount ELSE 0 END),0) -
        COALESCE(SUM(CASE WHEN type='spend' AND approved=true THEN amount ELSE 0 END),0)
        AS xp
      FROM xp_ledger
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );
    return Number(res.rows[0].xp ?? 0);
  }

  async requestSpend(client: any, input: {
    engineId: string;
    characterId: string;
    userId: string;
    amount: number;
    reason: string;
  }) {
    await client.query(
      `
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, reason)
      VALUES ($1,$2,$3,$4,'spend',$5,$6)
      `,
      [uuid(), input.engineId, input.characterId, input.userId, input.amount, input.reason],
    );
  }

  async approveSpend(client: any, xpId: string, approverId: string) {
    await client.query(
      `
      UPDATE xp_ledger
      SET approved=true, approved_by=$2
      WHERE xp_id=$1
      `,
      [xpId, approverId],
    );
  }

  async earn(client: any, input: {
    engineId: string;
    characterId: string;
    userId: string;
    amount: number;
    reason: string;
  }) {
    await client.query(
      `
      INSERT INTO xp_ledger
        (xp_id, engine_id, character_id, user_id, type, amount, approved)
      VALUES ($1,$2,$3,$4,'earn',$5,true)
      `,
      [uuid(), input.engineId, input.characterId, input.userId, input.amount],
    );
  }
}