import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class DomainsService {
  async claimDomain(
    client: any,
    input: {
      engineId: string;
      name: string;
      claimedByUserId: string;
      notes?: string;
    },
  ) {
    await client.query(
      `
      INSERT INTO domains
        (domain_id, engine_id, name, claimed_by_user_id, notes)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        uuid(),
        input.engineId,
        input.name,
        input.claimedByUserId,
        input.notes ?? null,
      ],
    );

    return { message: `🏙️ Domain claimed: **${input.name}**` };
  }

  async listDomains(
    client: any,
    input: {
      engineId: string;
    },
  ) {
    const res = await client.query(
      `
      SELECT name, notes
      FROM domains
      WHERE engine_id = $1
      ORDER BY created_at DESC
      `,
      [input.engineId],
    );

    if (!res.rowCount) return { message: 'No domains claimed.' };

    return {
      message: res.rows
        .map((d: any) => `• **${d.name}**${d.notes ? ` — ${d.notes}` : ''}`)
        .join('\n'),
    };
  }
}
