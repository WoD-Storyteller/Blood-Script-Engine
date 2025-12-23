import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

enum VoteChoice {
  YES = 'yes',
  NO = 'no',
  ABSTAIN = 'abstain',
}

enum MotionStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  VOID = 'void',
}

enum MotionOutcome {
  PASSED = 'passed',
  FAILED = 'failed',
  TIED = 'tied',
  NO_QUORUM = 'no_quorum',
  UNKNOWN = 'unknown',
}

@Injectable()
export class MotionsService {
  private readonly logger = new Logger(MotionsService.name);

  async propose(client: any, input: {
    engineId: string;
    createdByUserId: string;
    title: string;
    details?: string;
    closesInMinutes?: number; // optional
  }): Promise<{ message: string }> {
    try {
      const closesAt =
        input.closesInMinutes && input.closesInMinutes > 0
          ? new Date(Date.now() + input.closesInMinutes * 60_000).toISOString()
          : null;

      const id = uuid();

      await client.query(
        `
        INSERT INTO motions
          (motion_id, engine_id, created_by_user_id, title, details, status, closes_at, outcome)
        VALUES
          ($1,$2,$3,$4,$5,'${MotionStatus.OPEN}',$6,'${MotionOutcome.UNKNOWN}')
        `,
        [id, input.engineId, input.createdByUserId, input.title, input.details ?? null, closesAt],
      );

      const short = String(id).slice(0, 8);
      return {
        message:
          closesAt
            ? `Motion opened \`${short}\`: **${input.title}** (closes automatically)`
            : `Motion opened \`${short}\`: **${input.title}**`,
      };
    } catch (e: any) {
      this.logger.debug(`propose fallback: ${e.message}`);
      return { message: `I can’t open motions right now.` };
    }
  }

  async vote(client: any, input: {
    engineId: string;
    motionIdPrefix: string;
    userId: string;
    vote: VoteChoice;
  }): Promise<{ message: string }> {
    try {
      const motion = await this.findMotion(client, input.engineId, input.motionIdPrefix);
      if (!motion) return { message: `No motion found matching \`${input.motionIdPrefix}\`.` };

      await this.autoCloseIfExpired(client, input.engineId, motion.motion_id);

      const fresh = await client.query(
        `SELECT status FROM motions WHERE engine_id = $1 AND motion_id = $2`,
        [input.engineId, motion.motion_id],
      );

      if (!fresh.rowCount || fresh.rows[0].status !== MotionStatus.OPEN) {
        const tally = await this.tally(client, input.engineId, motion.motion_id);
        return { message: `That motion is closed. Tally: ${this.formatTally(tally)}.` };
      }

      await client.query(
        `
        INSERT INTO motion_votes (vote_id, engine_id, motion_id, user_id, vote)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (engine_id, motion_id, user_id)
        DO UPDATE SET vote = EXCLUDED.vote, cast_at = now()
        `,
        [uuid(), input.engineId, motion.motion_id, input.userId, input.vote],
      );

      const tally = await this.tally(client, input.engineId, motion.motion_id);
      return { message: `Vote recorded (**${input.vote}**). Tally: ${this.formatTally(tally)}.` };
    } catch (e: any) {
      this.logger.debug(`vote fallback: ${e.message}`);
      return { message: `I can’t record votes right now.` };
    }
  }

  async list(client: any, input: { engineId: string }): Promise<{ message: string }> {
    try {
      // Auto-close any expired open motions during list (no scheduler needed)
      await this.autoCloseExpiredBatch(client, input.engineId);

      const res = await client.query(
        `
        SELECT motion_id, title, status, closes_at, created_at
        FROM motions
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 10
        `,
        [input.engineId],
      );

      if (!res.rowCount) return { message: 'No motions recorded.' };

      const lines: string[] = [];
      for (const m of res.rows) {
        const short = String(m.motion_id).slice(0, 8);
        const when = m.closes_at ? `closes at ${new Date(m.closes_at).toLocaleString()}` : 'no auto-close';
        lines.push(`• \`${short}\` **${m.title}** — ${m.status} (${when})`);
      }

      return { message: lines.join('\n') };
    } catch (e: any) {
      this.logger.debug(`list fallback: ${e.message}`);
      return { message: `I can’t list motions right now.` };
    }
  }

  async close(client: any, input: {
    engineId: string;
    motionIdPrefix: string;
  }): Promise<{ message: string }> {
    try {
      const motion = await this.findMotion(client, input.engineId, input.motionIdPrefix);
      if (!motion) return { message: `No motion found matching \`${input.motionIdPrefix}\`.` };

      const tally = await this.tally(client, input.engineId, motion.motion_id);
      const outcome = this.computeOutcome(tally);

      await client.query(
        `
        UPDATE motions
        SET status = '${MotionStatus.CLOSED}',
            closed_at = now(),
            outcome = $3
        WHERE engine_id = $1 AND motion_id = $2
        `,
        [input.engineId, motion.motion_id, outcome],
      );

      return { message: `Motion closed. Outcome: **${outcome}**. Tally: ${this.formatTally(tally)}.` };
    } catch (e: any) {
      this.logger.debug(`close fallback: ${e.message}`);
      return { message: `I can’t close motions right now.` };
    }
  }

  // ───────── helpers ─────────

  private async findMotion(client: any, engineId: string, prefix: string) {
    const res = await client.query(
      `
      SELECT motion_id, title, status, closes_at
      FROM motions
      WHERE engine_id = $1 AND CAST(motion_id AS TEXT) LIKE $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [engineId, `${prefix}%`],
    );
    return res.rowCount ? res.rows[0] : null;
  }

  private async tally(client: any, engineId: string, motionId: string) {
    const res = await client.query(
      `
      SELECT vote, COUNT(*)::int AS c
      FROM motion_votes
      WHERE engine_id = $1 AND motion_id = $2
      GROUP BY vote
      `,
      [engineId, motionId],
    );

    const t = { yes: 0, no: 0, abstain: 0 };
    for (const r of res.rows) {
      t[r.vote as VoteChoice] = Number(r.c);
    }
    return t;
  }

  private formatTally(t: { yes: number; no: number; abstain: number }) {
    return `yes ${t.yes}, no ${t.no}, abstain ${t.abstain}`;
  }

  private computeOutcome(t: { yes: number; no: number; abstain: number }) {
    const quorum = t.yes + t.no + t.abstain;
    if (quorum === 0) return MotionOutcome.NO_QUORUM;
    if (t.yes > t.no) return MotionOutcome.PASSED;
    if (t.no > t.yes) return MotionOutcome.FAILED;
    return MotionOutcome.TIED;
  }

  private async autoCloseIfExpired(client: any, engineId: string, motionId: string) {
    const res = await client.query(
      `SELECT status, closes_at FROM motions WHERE engine_id = $1 AND motion_id = $2`,
      [engineId, motionId],
    );
    if (!res.rowCount) return;
    const m = res.rows[0];
    if (m.status !== 'open' || !m.closes_at) return;

    const closesAt = new Date(m.closes_at).getTime();
    if (Date.now() < closesAt) return;

    const tally = await this.tally(client, engineId, motionId);
    const outcome = this.computeOutcome(tally);

    await client.query(
      `
      UPDATE motions
      SET status = 'closed',
          closed_at = now(),
          outcome = $3
      WHERE engine_id = $1 AND motion_id = $2 AND status = 'open'
      `,
      [engineId, motionId, outcome],
    );
  }

  private async autoCloseExpiredBatch(client: any, engineId: string) {
    // Close any open motions whose closes_at is in the past.
    // We’ll do this by selecting candidates, then closing each with outcome.
    const res = await client.query(
      `
      SELECT motion_id
      FROM motions
      WHERE engine_id = $1
        AND status = 'open'
        AND closes_at IS NOT NULL
        AND closes_at <= now()
      LIMIT 25
      `,
      [engineId],
    );

    for (const r of res.rows) {
      await this.autoCloseIfExpired(client, engineId, r.motion_id);
    }
  }
}
