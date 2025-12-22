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
exports.OccultController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const occult_service_1 = require("./occult.service");
const engine_guard_1 = require("../engine/engine.guard");
let OccultController = class OccultController {
    constructor(db, auth, occult) {
        this.db = db;
        this.auth = auth;
        this.occult = occult;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async rituals(req, auth) {
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
            const rows = await this.occult.listRituals(client, session.engine_id);
            return { rituals: rows };
        });
    }
    async createRitual(req, auth, body) {
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
            if (session.role === 'player')
                return { error: 'Forbidden' };
            const out = await this.occult.createRitual(client, session.engine_id, body.name, body.discipline, body.level, body.description);
            return out;
        });
    }
    async alchemy(req, auth) {
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
            const rows = await this.occult.listAlchemy(client, session.engine_id);
            return { alchemy: rows };
        });
    }
    async lore(req, auth) {
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
            const rows = await this.occult.listLore(client, session.engine_id);
            return { lore: rows };
        });
    }
};
exports.OccultController = OccultController;
__decorate([
    (0, common_1.Get)('rituals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OccultController.prototype, "rituals", null);
__decorate([
    (0, common_1.Post)('rituals'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OccultController.prototype, "createRitual", null);
__decorate([
    (0, common_1.Get)('alchemy'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OccultController.prototype, "alchemy", null);
__decorate([
    (0, common_1.Get)('lore'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OccultController.prototype, "lore", null);
exports.OccultController = OccultController = __decorate([
    (0, common_1.Controller)('companion/occult'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        occult_service_1.OccultService])
], OccultController);
//# sourceMappingURL=occult.controller.js.map