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
exports.CharactersController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const characters_service_1 = require("./characters.service");
const realtime_service_1 = require("../realtime/realtime.service");
const engine_guard_1 = require("../engine/engine.guard");
let CharactersController = class CharactersController {
    constructor(db, auth, characters, realtime) {
        this.db = db;
        this.auth = auth;
        this.characters = characters;
        this.realtime = realtime;
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
            const characters = await this.characters.listCharacters(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
            });
            return { characters };
        });
    }
    async get(req, auth, id) {
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
            const character = await this.characters.getCharacter(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
                characterId: id,
            });
            return { character };
        });
    }
    async setActive(req, auth, id) {
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
            await this.characters.setActiveCharacter(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
                characterId: id,
            });
            this.realtime.emitToEngine(session.engine_id, 'active_character_changed', {
                userId: session.user_id,
                characterId: id,
                at: new Date().toISOString(),
            });
            return { ok: true };
        });
    }
    async update(req, auth, id, body) {
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
            await this.characters.updateSheet(client, {
                engineId: session.engine_id,
                userId: session.user_id,
                role: session.role,
                characterId: id,
                sheet: body,
            });
            this.realtime.emitToEngine(session.engine_id, 'character_updated', {
                characterId: id,
                reason: 'sheet_updated',
                at: new Date().toISOString(),
            });
            return { ok: true };
        });
    }
};
exports.CharactersController = CharactersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CharactersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CharactersController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(':id/active'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CharactersController.prototype, "setActive", null);
__decorate([
    (0, common_1.Post)(':id/update'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Param)('id')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], CharactersController.prototype, "update", null);
exports.CharactersController = CharactersController = __decorate([
    (0, common_1.Controller)('companion/characters'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        characters_service_1.CharactersService,
        realtime_service_1.RealtimeService])
], CharactersController);
//# sourceMappingURL=characters.controller.js.map