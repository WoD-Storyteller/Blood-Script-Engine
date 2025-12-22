"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MotionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let MotionsService = MotionsService_1 = class MotionsService {
    constructor() {
        this.logger = new common_1.Logger(MotionsService_1.name);
    }
    async propose(client, input) {
        try {
            const closesAt = input.closesInMinutes && input.closesInMinutes > 0
                ? new Date(Date.now() + input.closesInMinutes * 60_000).toISOString()
                : null;
            const id = (0, uuid_1.uuid)();
            await client.query(`
        INSERT INTO motions
          (motion_id, engine_id, created_by_user_id, title, details, status, closes_at, outcome)
        VALUES
          ($1,$2,$3,$4,$5,'open',$6,'unknown')
        `, [id, input.engineId, input.createdByUserId, input.title, input.details ?? null, closesAt]);
            const short = String(id).slice(0, 8);
            return {
                message: closesAt
                    ? `Motion opened \`${short}\`: **${input.title}** (closes automatically)`
                    : `Motion opened \`${short}\`: **${input.title}**`,
            };
        }
        catch (e) {
            this.logger.debug(`propose fallback: ${e.message}`);
            return { message: `I can’t open motions right now.` };
        }
    }
    async vote(client, input) {
        try {
            const motion = await this.findMotion(client, input.engineId, input.motionIdPrefix);
            if (!motion)
                return { message: `No motion found matching \`${input.motionIdPrefix}\`.` };
            await this.autoCloseIfExpired(client, input.engineId, motion.motion_id);
            const fresh = await client.query(`SELECT status FROM motions WHERE engine_id = $1 AND motion_id = $2`, [input.engineId, motion.motion_id]);
            if (!fresh.rowCount || fresh.rows[0].status !== 'open') {
                const tally = await this.tally(client, input.engineId, motion.motion_id);
                return { message: `That motion is closed. Tally: ${this.formatTally(tally)}.` };
            }
            await client.query(`
        INSERT INTO motion_votes (vote_id, engine_id, motion_id, user_id, vote)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (engine_id, motion_id, user_id)
        DO UPDATE SET vote = EXCLUDED.vote, cast_at = now()
        `, [(0, uuid_1.uuid)(), input.engineId, motion.motion_id, input.userId, input.vote]);
            const tally = await this.tally(client, input.engineId, motion.motion_id);
            return { message: `Vote recorded (**${input.vote}**). Tally: ${this.formatTally(tally)}.` };
        }
        catch (e) {
            this.logger.debug(`vote fallback: ${e.message}`);
            return { message: `I can’t record votes right now.` };
        }
    }
    async list(client, input) {
        try {
            await this.autoCloseExpiredBatch(client, input.engineId);
            const res = await client.query(`
        SELECT motion_id, title, status, closes_at, created_at
        FROM motions
        WHERE engine_id = $1
        ORDER BY created_at DESC
        LIMIT 10
        `, [input.engineId]);
            if (!res.rowCount)
                return { message: 'No motions recorded.' };
            const lines = [];
            for (const m of res.rows) {
                const short = String(m.motion_id).slice(0, 8);
                const when = m.closes_at ? `closes at ${new Date(m.closes_at).toLocaleString()}` : 'no auto-close';
                lines.push(`• \`${short}\` **${m.title}** — ${m.status} (${when})`);
            }
            return { message: lines.join('\n') };
        }
        catch (e) {
            this.logger.debug(`list fallback: ${e.message}`);
            return { message: `I can’t list motions right now.` };
        }
    }
    async close(client, input) {
        try {
            const motion = await this.findMotion(client, input.engineId, input.motionIdPrefix);
            if (!motion)
                return { message: `No motion found matching \`${input.motionIdPrefix}\`.` };
            const tally = await this.tally(client, input.engineId, motion.motion_id);
            const outcome = this.computeOutcome(tally);
            await client.query(`
        UPDATE motions
        SET status = 'closed',
            closed_at = now(),
            outcome = $3
        WHERE engine_id = $1 AND motion_id = $2
        `, [input.engineId, motion.motion_id, outcome]);
            return { message: `Motion closed. Outcome: **${outcome}**. Tally: ${this.formatTally(tally)}.` };
        }
        catch (e) {
            this.logger.debug(`close fallback: ${e.message}`);
            return { message: `I can’t close motions right now.` };
        }
    }
    async findMotion(client, engineId, prefix) {
        const res = await client.query(`
      SELECT motion_id, title, status, closes_at
      FROM motions
      WHERE engine_id = $1 AND CAST(motion_id AS TEXT) LIKE $2
      ORDER BY created_at DESC
      LIMIT 1
      `, [engineId, `${prefix}%`]);
        return res.rowCount ? res.rows[0] : null;
    }
    async tally(client, engineId, motionId) {
        const res = await client.query(`
      SELECT vote, COUNT(*)::int AS c
      FROM motion_votes
      WHERE engine_id = $1 AND motion_id = $2
      GROUP BY vote
      `, [engineId, motionId]);
        const t = { yes: 0, no: 0, abstain: 0 };
        for (const r of res.rows) {
            t[r.vote] = Number(r.c);
        }
        return t;
    }
    formatTally(t) {
        return `yes ${t.yes}, no ${t.no}, abstain ${t.abstain}`;
    }
    computeOutcome(t) {
        const quorum = t.yes + t.no + t.abstain;
        if (quorum === 0)
            return 'no_quorum';
        if (t.yes > t.no)
            return 'passed';
        if (t.no > t.yes)
            return 'failed';
        return 'tied';
    }
    async autoCloseIfExpired(client, engineId, motionId) {
        const res = await client.query(`SELECT status, closes_at FROM motions WHERE engine_id = $1 AND motion_id = $2`, [engineId, motionId]);
        if (!res.rowCount)
            return;
        const m = res.rows[0];
        if (m.status !== 'open' || !m.closes_at)
            return;
        const closesAt = new Date(m.closes_at).getTime();
        if (Date.now() < closesAt)
            return;
        const tally = await this.tally(client, engineId, motionId);
        const outcome = this.computeOutcome(tally);
        await client.query(`
      UPDATE motions
      SET status = 'closed',
          closed_at = now(),
          outcome = $3
      WHERE engine_id = $1 AND motion_id = $2 AND status = 'open'
      `, [engineId, motionId, outcome]);
    }
    async autoCloseExpiredBatch(client, engineId) {
        const res = await client.query(`
      SELECT motion_id
      FROM motions
      WHERE engine_id = $1
        AND status = 'open'
        AND closes_at IS NOT NULL
        AND closes_at <= now()
      LIMIT 25
      `, [engineId]);
        for (const r of res.rows) {
            await this.autoCloseIfExpired(client, engineId, r.motion_id);
        }
    }
};
exports.MotionsService = MotionsService;
exports.MotionsService = MotionsService = MotionsService_1 = __decorate([
    (0, common_1.Injectable)()
], MotionsService);
//# sourceMappingURL=motions.service.js.map