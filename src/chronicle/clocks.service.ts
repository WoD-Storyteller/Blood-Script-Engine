import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class ClocksService {
  async create(
    client: any,
    input: {
      engineId: string;
      name: string;
      segments: number;
      notes?: string;
      createdByUserId?: string;
    },
  ) {
    const id = uuid();

    await client.query(
      `
      INSERT INTO clocks
        (clock_id, engine_id, name, segments, progress, notes, created_by_user_id)
      VALUES ($1,$2,$3,$4,0,$5,$6)
      `,
      [
        id,
        input.engineId,
        input.name,
        input.segments,
        input.notes ?? null,
        input.createdByUserId ?? null,
      ],
    );

    return { clockId: id };
  }

  async tick(
    client: any,
    input: {
      engineId: string;
      clockIdPrefix: string;
      amount: number;
      reason?: string;
      tickedByUserId?: string;
    },
  ) {
    const clock = await client.query(
      `
      SELECT clock_id, progress, segments
      FROM clocks
      WHERE engine_id=$1 AND CAST(clock_id AS TEXT) LIKE $2
      LIMIT 1
      `,
      [input.engineId, `${input.clockIdPrefix}%`],
    );

    if (!clock.rowCount) {
      return { error: 'ClockNotFound' };
    }

    const c = clock.rows[0];
    const newProgress = Math.min(
      c.segments,
      c.progress + Math.max(1, input.amount),
    );

    await client.query(
      `
      UPDATE clocks
      SET progress=$3, updated_at=now()
      WHERE engine_id=$1 AND clock_id=$2
      `,
      [input.engineId, c.clock_id, newProgress],
    );

    return {
      clockId: c.clock_id,
      progress: newProgress,
      completed: newProgress >= c.segments,
    };
  }
}