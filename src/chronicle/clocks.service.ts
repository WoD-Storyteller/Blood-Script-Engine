import { Injectable } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class ClocksService {
  // --------------------------------------------------
  // CREATE
  // --------------------------------------------------
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
    const clockId = uuid();

    await client.query(
      `
      INSERT INTO clocks
        (clock_id, engine_id, name, segments, progress, notes, created_by_user_id)
      VALUES ($1,$2,$3,$4,0,$5,$6)
      `,
      [
        clockId,
        input.engineId,
        input.name,
        input.segments,
        input.notes ?? null,
        input.createdByUserId ?? null,
      ],
    );

    return { clockId };
  }

  // --------------------------------------------------
  // LEGACY: tickClock (USED BY AI + ADMIN)
  // --------------------------------------------------
  async tickClock(
    client: any,
    input: {
      engineId: string;
      clockIdPrefix: string;
      amount: number;
      reason?: string;
      tickedByUserId?: string;
    },
  ) {
    return this.tick(client, input);
  }

  // --------------------------------------------------
  // CORE TICK
  // --------------------------------------------------
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
    const r = await client.query(
      `
      SELECT clock_id, progress, segments
      FROM clocks
      WHERE engine_id=$1
        AND CAST(clock_id AS TEXT) LIKE $2
      LIMIT 1
      `,
      [input.engineId, `${input.clockIdPrefix}%`],
    );

    if (!r.rowCount) return { error: 'ClockNotFound' };

    const c = r.rows[0];
    const next = Math.min(c.segments, c.progress + Math.max(1, input.amount));

    await client.query(
      `
      UPDATE clocks
      SET progress=$3, updated_at=now()
      WHERE engine_id=$1 AND clock_id=$2
      `,
      [input.engineId, c.clock_id, next],
    );

    return {
      clockId: c.clock_id,
      progress: next,
      completed: next >= c.segments,
    };
  }

  // --------------------------------------------------
  // NIGHTLY TICK (Chronicle)
  // --------------------------------------------------
  async tickNightlyClocks(client: any, input: { engineId: string }) {
    const clocks = await client.query(
      `
      SELECT clock_id
      FROM clocks
      WHERE engine_id=$1 AND progress < segments
      `,
      [input.engineId],
    );

    for (const c of clocks.rows) {
      await this.tick(client, {
        engineId: input.engineId,
        clockIdPrefix: c.clock_id,
        amount: 1,
      });
    }

    return { ticked: clocks.rowCount };
  }

  // --------------------------------------------------
  // LINKS FOR COMPLETED CLOCKS
  // --------------------------------------------------
  async listClockLinksForCompleted(
    client: any,
    input: { engineId: string; clockId: string },
  ) {
    const res = await client.query(
      `
      SELECT *
      FROM clock_links
      WHERE engine_id=$1 AND source_clock_id=$2
      `,
      [input.engineId, input.clockId],
    );

    return res.rows;
  }
}