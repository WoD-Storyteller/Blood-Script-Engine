"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const xp_service_1 = require("./xp.service");
const realtime_service_1 = require("../realtime/realtime.service");
const discord_dm_service_1 = require("../discord/discord.dm.service");
const engine_guard_1 = require("../engine/engine.guard");
function asInt(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
let XpController = class XpController {
    constructor(db, auth, xp, realtime, dm) {
        this.db = db;
        this.auth = auth;
        this.xp = xp;
        this.realtime = realtime;
        this.dm = dm;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    isStAdmin(session) {
        const r = String(session?.role ?? '').toLowerCase();
        return r === 'st' || r === 'admin';
    }
    async enforceNotBanned(client, session) {
        const engineRes = await client.query(`SELECT banned, name FROM engines WHERE engine_id=$1`, [session.engine_id]);
        if (!engineRes.rowCount)
            throw new Error('EngineNotFound');
        (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
        return engineRes.rows[0];
    }
    async available(req, authHeader, characterId) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            await this.enforceNotBanned(client, session);
            let cid = characterId;
            if (!cid) {
                const r = await client.query(`
          SELECT character_id
          FROM characters
          WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
          LIMIT 1
          `, [session.engine_id, session.user_id]);
                if (!r.rowCount)
                    return { error: 'NoActiveCharacter' };
                cid = r.rows[0].character_id;
            }
            const available = await this.xp.availableXp(client, {
                engineId: session.engine_id,
                characterId: cid,
            });
            return { characterId: cid, available };
        });
    }
    async spendRequest(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            await this.enforceNotBanned(client, session);
            const amount = Math.max(0, asInt(body.amount, 0));
            if (!amount)
                return { error: 'InvalidAmount' };
            const meta = body.meta;
            if (!meta || !meta.kind || !meta.key)
                return { error: 'MissingMeta' };
            let characterId = body.characterId;
            if (!characterId) {
                const r = await client.query(`
          SELECT character_id
          FROM characters
          WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
          LIMIT 1
          `, [session.engine_id, session.user_id]);
                if (!r.rowCount)
                    return { error: 'NoActiveCharacter' };
                characterId = r.rows[0].character_id;
            }
            const owns = await client.query(`
        SELECT 1
        FROM characters
        WHERE engine_id=$1 AND character_id=$2 AND owner_user_id=$3
        LIMIT 1
        `, [session.engine_id, characterId, session.user_id]);
            if (!owns.rowCount)
                return { error: 'Forbidden' };
            await this.xp.requestSpend(client, {
                engineId: session.engine_id,
                characterId,
                userId: session.user_id,
                amount,
                reason: body.reason ?? 'XP spend request',
                meta,
            });
            this.realtime.emitToEngine(session.engine_id, 'xp_spend_requested', {
                characterId,
                userId: session.user_id,
                amount,
                reason: body.reason ?? 'XP spend request',
                meta,
                at: new Date().toISOString(),
            });
            return { ok: true };
        });
    }
    async earn(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            await this.enforceNotBanned(client, session);
            if (!this.isStAdmin(session))
                return { error: 'Forbidden' };
            const amount = Math.max(0, asInt(body.amount, 0));
            if (!amount)
                return { error: 'InvalidAmount' };
            if (!body.characterId)
                return { error: 'MissingCharacterId' };
            const c = await client.query(`
        SELECT owner_user_id
        FROM characters
        WHERE engine_id=$1 AND character_id=$2
        LIMIT 1
        `, [session.engine_id, body.characterId]);
            if (!c.rowCount)
                return { error: 'CharacterNotFound' };
            await this.xp.earn(client, {
                engineId: session.engine_id,
                characterId: body.characterId,
                userId: c.rows[0].owner_user_id,
                amount,
                reason: body.reason ?? 'XP Earned',
            });
            this.realtime.emitToEngine(session.engine_id, 'xp_earned', {
                characterId: body.characterId,
                amount,
                reason: body.reason ?? 'XP Earned',
                at: new Date().toISOString(),
            });
            return { ok: true };
        });
    }
    async approve(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engine = await this.enforceNotBanned(client, session);
            if (!this.isStAdmin(session))
                return { error: 'Forbidden' };
            if (!body?.xpId)
                return { error: 'MissingXpId' };
            const out = await this.xp.approveAndApply(client, {
                xpId: body.xpId,
                approverId: session.user_id,
                engineId: session.engine_id,
            });
            this.realtime.emitToEngine(session.engine_id, 'xp_spend_approved', {
                xpId: body.xpId,
                out,
                at: new Date().toISOString(),
            });
            if (out?.ok && out?.alreadyApplied === false) {
                const info = await client.query(`
          SELECT
            xl.xp_id,
            xl.amount,
            xl.meta,
            u.discord_user_id,
            c.name AS character_name
          FROM xp_ledger xl
          JOIN users u ON u.user_id = xl.user_id
          JOIN characters c ON c.character_id = xl.character_id AND c.engine_id = xl.engine_id
          WHERE xl.xp_id=$1 AND xl.engine_id=$2
          LIMIT 1
          `, [body.xpId, session.engine_id]);
                if (info.rowCount) {
                    const row = info.rows[0];
                    const meta = row.meta ?? out?.appliedTo ?? null;
                    const upgrade = meta && meta.kind && meta.key
                        ? `${String(meta.kind).toUpperCase()}: ${String(meta.key)} (${meta.from}→${meta.to})`
                        : 'Upgrade applied';
                    if (row.discord_user_id) {
                        await this.dm.sendXpAppliedDm({
                            discordUserId: row.discord_user_id,
                            characterName: row.character_name ?? 'Your character',
                            upgrade,
                            cost: Number(row.amount ?? 0),
                            engineName: engine?.name,
                        });
                        try {
                            await client.query(`
                UPDATE xp_ledger
                SET discord_notified=true, discord_notified_at=now()
                WHERE xp_id=$1
                `, [body.xpId]);
                        }
                        catch {
                        }
                    }
                }
            }
            return out;
        });
    }
};
exports.XpController = XpController;
__decorate([
    (0, common_1.Get)('available'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Query)('characterId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], XpController.prototype, "available", null);
__decorate([
    (0, common_1.Post)('spend-request'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], XpController.prototype, "spendRequest", null);
__decorate([
    (0, common_1.Post)('earn'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], XpController.prototype, "earn", null);
__decorate([
    (0, common_1.Post)('approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], XpController.prototype, "approve", null);
exports.XpController = XpController = __decorate([
    (0, common_1.Controller)('companion/xp'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        xp_service_1.XpService,
        realtime_service_1.RealtimeService,
        discord_dm_service_1.DiscordDmService])
], XpController);
//# sourceMappingURL=xp.controller.js.map