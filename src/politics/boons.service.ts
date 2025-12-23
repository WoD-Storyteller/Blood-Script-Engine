import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

enum BoonLedgerMode {
  OWED_TO_ME = 'owed_to_me',
  I_OWE = 'i_owe',
}

enum BoonStatus {
  ACTIVE = 'active',
  CALLED_IN = 'called_in',
  SETTLED = 'settled',
  VOID = 'void',
}

@Injectable()
export class BoonsService {
  async giveBoon(
    client: any,
    input: {
      engineId: string;
      fromUserId: string;
      toUserId: string;
      level: string;
      title: string;
      details?: string;
    },
  ) {
    await client.query(
      `
      INSERT INTO boons
        (boon_id, engine_id, from_user_id, to_user_id, level, title, details, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        uuid(),
        input.engineId,
        input.fromUserId,
        input.toUserId,
        input.level,
        input.title,
        input.details ?? null,
        BoonStatus.ACTIVE,
      ],
    );

    return { message: `🩸 Boon granted: **${input.title}** (${input.level})` };
  }

  async listBoons(
    client: any,
    input: {
      engineId: string;
      userId: string;
      mode: BoonLedgerMode;
    },
  ) {
    const where =
      input.mode === BoonLedgerMode.OWED_TO_ME
        ? 'to_user_id = $2'
        : 'from_user_id = $2';

    const res = await client.query(
      `
      SELECT boon_id, title, level, status
      FROM boons
      WHERE engine_id = $1 AND ${where}
      ORDER BY created_at DESC
      `,
      [input.engineId, input.userId],
    );

    if (!res.rowCount) return { message: 'No boons found.' };

    return {
      message: res.rows
        .map(
          (b: any) =>
            `• \`${String(b.boon_id).slice(0, 6)}\` **${b.title}** (${b.level}) — ${b.status}`,
        )
        .join('\n'),
    };
  }

  async setBoonStatus(
    client: any,
    input: {
      engineId: string;
      boonIdPrefix: string;
      status: BoonStatus;
    },
  ) {
    const res = await client.query(
      `
      UPDATE boons
      SET status = $3, updated_at = now()
      WHERE engine_id = $1 AND CAST(boon_id AS TEXT) LIKE $2
      RETURNING title
      `,
      [input.engineId, `${input.boonIdPrefix}%`, input.status],
    );

    if (!res.rowCount) {
      return { message: 'Boon not found.' };
    }

    return {
      message: `🩸 Boon **${res.rows[0].title}** marked as **${input.status}**`,
    };
  }
}
