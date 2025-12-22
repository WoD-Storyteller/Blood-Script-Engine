"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrestigeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrestigeService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let PrestigeService = PrestigeService_1 = class PrestigeService {
    constructor() {
        this.logger = new common_1.Logger(PrestigeService_1.name);
    }
    async ensureScoreRow(client, engineId, userId) {
        try {
            await client.query(`
        INSERT INTO status_scores (engine_id, user_id, score)
        VALUES ($1,$2,0)
        ON CONFLICT (engine_id, user_id) DO NOTHING
        `, [engineId, userId]);
        }
        catch (e) {
            this.logger.debug(`ensureScoreRow fallback: ${e.message}`);
        }
    }
    async getScore(client, engineId, userId) {
        try {
            await this.ensureScoreRow(client, engineId, userId);
            const res = await client.query(`SELECT score FROM status_scores WHERE engine_id = $1 AND user_id = $2`, [engineId, userId]);
            if (!res.rowCount)
                return 0;
            return Number(res.rows[0].score ?? 0);
        }
        catch (e) {
            this.logger.debug(`getScore fallback: ${e.message}`);
            return null;
        }
    }
    async setScore(client, input) {
        try {
            await this.ensureScoreRow(client, input.engineId, input.targetUserId);
            const current = await this.getScore(client, input.engineId, input.targetUserId);
            if (current === null)
                return { message: `Status ledger unavailable right now.` };
            const delta = input.newScore - current;
            await client.query(`
        UPDATE status_scores
        SET score = $3, last_updated = now()
        WHERE engine_id = $1 AND user_id = $2
        `, [input.engineId, input.targetUserId, input.newScore]);
            await this.logEvent(client, {
                engineId: input.engineId,
                targetUserId: input.targetUserId,
                changedByUserId: input.changedByUserId,
                delta,
                reason: input.reason,
                authority: 'st',
            });
            return { message: `Status set. New Status: **${input.newScore}** (${delta >= 0 ? '+' : ''}${delta}).` };
        }
        catch (e) {
            this.logger.debug(`setScore fallback: ${e.message}`);
            return { message: `I can’t set Status right now.` };
        }
    }
    async adjustScore(client, input) {
        try {
            await this.ensureScoreRow(client, input.engineId, input.targetUserId);
            let delta = Math.trunc(input.delta);
            if (input.authority === 'harpy') {
                const limit = Math.max(1, Math.min(3, input.harpyLimitPerAction ?? 2));
                if (delta > limit)
                    delta = limit;
                if (delta < -limit)
                    delta = -limit;
            }
            await client.query(`
        UPDATE status_scores
        SET score = score + $3,
            last_updated = now()
        WHERE engine_id = $1 AND user_id = $2
        `, [input.engineId, input.targetUserId, delta]);
            await this.logEvent(client, {
                engineId: input.engineId,
                targetUserId: input.targetUserId,
                changedByUserId: input.changedByUserId,
                delta,
                reason: input.reason,
                authority: input.authority,
            });
            const newScore = await this.getScore(client, input.engineId, input.targetUserId);
            if (newScore === null) {
                return { message: `Status updated (${delta >= 0 ? '+' : ''}${delta}).` };
            }
            return { message: `Status updated (${delta >= 0 ? '+' : ''}${delta}). New Status: **${newScore}**.` };
        }
        catch (e) {
            this.logger.debug(`adjustScore fallback: ${e.message}`);
            return { message: `I can’t update Status right now.` };
        }
    }
    async leaderboard(client, engineId) {
        try {
            const res = await client.query(`
        SELECT user_id, score
        FROM status_scores
        WHERE engine_id = $1
        ORDER BY score DESC
        LIMIT 10
        `, [engineId]);
            if (!res.rowCount)
                return { message: 'No Status records yet.' };
            const lines = [];
            for (const r of res.rows) {
                const discordId = await this.discordIdForUser(client, r.user_id);
                lines.push(`• <@${discordId}> — **${r.score}**`);
            }
            return { message: `**Status Board**\n${lines.join('\n')}` };
        }
        catch (e) {
            this.logger.debug(`leaderboard fallback: ${e.message}`);
            return { message: `I can’t access the Status board right now.` };
        }
    }
    async recentEvents(client, input) {
        try {
            const res = await client.query(`
        SELECT delta, reason, authority, created_at, changed_by_user_id
        FROM status_events
        WHERE engine_id = $1 AND target_user_id = $2
        ORDER BY created_at DESC
        LIMIT 5
        `, [input.engineId, input.targetUserId]);
            if (!res.rowCount)
                return { message: 'No recent Status events.' };
            const lines = [];
            for (const r of res.rows) {
                const by = await this.discordIdForUser(client, r.changed_by_user_id);
                const sign = r.delta >= 0 ? '+' : '';
                lines.push(`• ${sign}${r.delta} (${r.authority}) — ${r.reason} — <@${by}>`);
            }
            return { message: lines.join('\n') };
        }
        catch (e) {
            this.logger.debug(`recentEvents fallback: ${e.message}`);
            return { message: `I can’t access Status history right now.` };
        }
    }
    async logEvent(client, input) {
        try {
            await client.query(`
        INSERT INTO status_events
          (event_id, engine_id, target_user_id, changed_by_user_id, delta, reason, authority)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `, [(0, uuid_1.uuid)(), input.engineId, input.targetUserId, input.changedByUserId, input.delta, input.reason, input.authority]);
        }
        catch (e) {
            this.logger.debug(`logEvent fallback: ${e.message}`);
        }
    }
    async discordIdForUser(client, userId) {
        const res = await client.query(`SELECT discord_user_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
        return res.rowCount ? res.rows[0].discord_user_id : 'unknown';
    }
};
exports.PrestigeService = PrestigeService;
exports.PrestigeService = PrestigeService = PrestigeService_1 = __decorate([
    (0, common_1.Injectable)()
], PrestigeService);
//# sourceMappingURL=prestige.service.js.map