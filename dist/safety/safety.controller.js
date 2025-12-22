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
exports.SafetyController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const safety_threshold_service_1 = require("./safety-threshold.service");
const engine_guard_1 = require("../engine/engine.guard");
let SafetyController = class SafetyController {
    constructor(db, auth, safetyThreshold) {
        this.db = db;
        this.auth = auth;
        this.safetyThreshold = safetyThreshold;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async create(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            await client.query(`
        INSERT INTO safety_events (engine_id, type, resolved)
        VALUES ($1,$2,false)
        `, [session.engine_id, body.type]);
            await this.safetyThreshold.check(session.engine_id);
            return { ok: true };
        });
    }
    async resolve(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            await client.query(`
        UPDATE safety_events
        SET resolved=true
        WHERE event_id=$1
        `, [body.eventId]);
            await this.safetyThreshold.check(session.engine_id);
            return { ok: true };
        });
    }
};
exports.SafetyController = SafetyController;
__decorate([
    (0, common_1.Post)('card'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('resolve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SafetyController.prototype, "resolve", null);
exports.SafetyController = SafetyController = __decorate([
    (0, common_1.Controller)('safety'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        safety_threshold_service_1.SafetyThresholdService])
], SafetyController);
//# sourceMappingURL=safety.controller.js.map