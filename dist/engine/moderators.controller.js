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
exports.ModeratorsController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const moderators_service_1 = require("./moderators.service");
const engine_guard_1 = require("./engine.guard");
let ModeratorsController = class ModeratorsController {
    constructor(db, auth, mods) {
        this.db = db;
        this.auth = auth;
        this.mods = mods;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async list(req, auth) {
        const token = this.token(req, auth);
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
            if (session.role !== 'st')
                return { error: 'Forbidden' };
            const moderators = await this.mods.list(client, session.engine_id);
            return { moderators };
        });
    }
    async add(req, auth, body) {
        const token = this.token(req, auth);
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
            if (session.role !== 'st')
                return { error: 'Forbidden' };
            await this.mods.add(client, {
                engineId: session.engine_id,
                userId: body.userId,
            });
            return { ok: true };
        });
    }
    async remove(req, auth, body) {
        const token = this.token(req, auth);
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
            if (session.role !== 'st')
                return { error: 'Forbidden' };
            await this.mods.remove(client, {
                engineId: session.engine_id,
                userId: body.userId,
            });
            return { ok: true };
        });
    }
};
exports.ModeratorsController = ModeratorsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ModeratorsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModeratorsController.prototype, "add", null);
__decorate([
    (0, common_1.Delete)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], ModeratorsController.prototype, "remove", null);
exports.ModeratorsController = ModeratorsController = __decorate([
    (0, common_1.Controller)('engine/moderators'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        moderators_service_1.ModeratorsService])
], ModeratorsController);
//# sourceMappingURL=moderators.controller.js.map