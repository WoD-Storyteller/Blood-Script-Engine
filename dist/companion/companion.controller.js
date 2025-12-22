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
exports.CompanionController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("./auth.service");
const dashboard_service_1 = require("./dashboard.service");
const characters_service_1 = require("./characters.service");
const coteries_service_1 = require("./coteries.service");
const st_admin_service_1 = require("./st-admin.service");
const safety_events_service_1 = require("./safety-events.service");
const realtime_service_1 = require("../realtime/realtime.service");
const engine_guard_1 = require("../engine/engine.guard");
const owner_guard_1 = require("../owner/owner.guard");
let CompanionController = class CompanionController {
    constructor(db, auth, dashboard, characters, coteries, st, safety, realtime) {
        this.db = db;
        this.auth = auth;
        this.dashboard = dashboard;
        this.characters = characters;
        this.coteries = coteries;
        this.st = st;
        this.safety = safety;
        this.realtime = realtime;
    }
    getToken(req, authHeader) {
        return req.cookies?.bse_token ?? authHeader?.replace('Bearer ', '');
    }
    isStOrAdmin(role) {
        const r = String(role).toLowerCase();
        return r === 'st' || r === 'admin';
    }
    async me(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT engine_id, banned, banned_reason FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            const engine = engineRes.rows[0];
            return {
                engine,
                userId: session.user_id,
                engineId: session.engine_id,
                role: session.role,
                discordUserId: session.discord_user_id,
                displayName: session.display_name,
            };
        });
    }
    async world(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT engine_id, name, banned, banned_reason, banned_at FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            const engine = engineRes.rows[0];
            if (engine.banned && !(0, owner_guard_1.isBotOwner)(session)) {
                return { engine };
            }
            return this.dashboard.getWorldState(client, session.engine_id);
        });
    }
    async listCharacters(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const rows = await this.characters.listCharacters(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
            });
            return { characters: rows };
        });
    }
    async getCharacter(req, authHeader, id) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const character = await this.characters.getCharacter(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
                characterId: id,
            });
            return { character };
        });
    }
    async listCoteries(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const rows = await this.coteries.listCoteries(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
            });
            return { coteries: rows };
        });
    }
    async getCoterie(req, authHeader, id) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const coterie = await this.coteries.getCoterie(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
                coterieId: id,
            });
            return { coterie };
        });
    }
    async setMap(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            await this.st.setMap(client, session.engine_id, body.myMapsUrl);
            return { ok: true };
        });
    }
    async createClock(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const clock = await this.st.createClock(client, session.engine_id, body);
            this.realtime.emitToEngine(session.engine_id, 'clock_created', { clock });
            return { clock };
        });
    }
    async tickClock(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const out = await this.st.tickClock(client, session.engine_id, body.clockId, body.delta ?? 1);
            this.realtime.emitToEngine(session.engine_id, 'clock_ticked', out);
            return out;
        });
    }
    async createArc(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const arc = await this.st.createArc(client, session.engine_id, body);
            this.realtime.emitToEngine(session.engine_id, 'arc_created', { arc });
            return { arc };
        });
    }
    async setArcStatus(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const arc = await this.st.setArcStatus(client, session.engine_id, body.arcId, body.status);
            this.realtime.emitToEngine(session.engine_id, 'arc_updated', { arc });
            return { arc };
        });
    }
    async listIntents(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const intents = await this.st.listIntents(client, session.engine_id);
            return { intents };
        });
    }
    async approveIntent(req, authHeader, id, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const out = await this.st.approveIntent(client, session.engine_id, id, body);
            this.realtime.emitToEngine(session.engine_id, 'intent_updated', out);
            return out;
        });
    }
    async rejectIntent(req, authHeader, id, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const out = await this.st.rejectIntent(client, session.engine_id, id, body);
            this.realtime.emitToEngine(session.engine_id, 'intent_updated', out);
            return out;
        });
    }
    async submitSafety(req, authHeader, body) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const out = await this.safety.submit(client, session.engine_id, session.user_id, body);
            this.realtime.emitToEngine(session.engine_id, 'safety_event', out);
            return out;
        });
    }
    async activeSafety(req, authHeader) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const active = await this.safety.active(client, session.engine_id);
            return { active };
        });
    }
    async resolveSafety(req, authHeader, id) {
        const token = this.getToken(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            if (!this.isStOrAdmin(session.role))
                return { error: 'Forbidden' };
            const out = await this.safety.resolve(client, session.engine_id, id);
            this.realtime.emitToEngine(session.engine_id, 'safety_event_resolved', out);
            return out;
        });
    }
};
exports.CompanionController = CompanionController;
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('world'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "world", null);
__decorate([
    (0, common_1.Get)('characters'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "listCharacters", null);
__decorate([
    (0, common_1.Get)('characters/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "getCharacter", null);
__decorate([
    (0, common_1.Get)('coteries'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "listCoteries", null);
__decorate([
    (0, common_1.Get)('coteries/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "getCoterie", null);
__decorate([
    (0, common_1.Post)('st/map'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "setMap", null);
__decorate([
    (0, common_1.Post)('st/clock/create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "createClock", null);
__decorate([
    (0, common_1.Post)('st/clock/tick'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "tickClock", null);
__decorate([
    (0, common_1.Post)('st/arc/create'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "createArc", null);
__decorate([
    (0, common_1.Post)('st/arc/status'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "setArcStatus", null);
__decorate([
    (0, common_1.Get)('st/intents'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "listIntents", null);
__decorate([
    (0, common_1.Post)('st/intents/:id/approve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "approveIntent", null);
__decorate([
    (0, common_1.Post)('st/intents/:id/reject'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "rejectIntent", null);
__decorate([
    (0, common_1.Post)('safety/submit'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "submitSafety", null);
__decorate([
    (0, common_1.Get)('safety/active'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "activeSafety", null);
__decorate([
    (0, common_1.Post)('safety/resolve/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CompanionController.prototype, "resolveSafety", null);
exports.CompanionController = CompanionController = __decorate([
    (0, common_1.Controller)('companion'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        dashboard_service_1.DashboardService,
        characters_service_1.CharactersService,
        coteries_service_1.CoteriesService,
        st_admin_service_1.StAdminService,
        safety_events_service_1.SafetyEventsService,
        realtime_service_1.RealtimeService])
], CompanionController);
//# sourceMappingURL=companion.controller.js.map