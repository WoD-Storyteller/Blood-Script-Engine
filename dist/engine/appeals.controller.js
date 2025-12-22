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
exports.AppealsController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const engine_guard_1 = require("./engine.guard");
const owner_guard_1 = require("../owner/owner.guard");
const owner_dm_service_1 = require("../discord/owner-dm.service");
let AppealsController = class AppealsController {
    constructor(db, auth, ownerDm) {
        this.db = db;
        this.auth = auth;
        this.ownerDm = ownerDm;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async submit(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session)
                return { error: 'Unauthorized' };
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount)
                return { error: 'EngineNotFound' };
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'appeal');
            await client.query(`
        INSERT INTO engine_appeals (engine_id, submitted_by, message)
        VALUES ($1,$2,$3)
        `, [session.engine_id, session.user_id, body.message]);
            await this.ownerDm.send(`📨 NEW ENGINE APPEAL\n\n` +
                `Engine: ${session.engine_id}\n` +
                `Submitted by: ${session.display_name}\n\n` +
                body.message);
            return { ok: true };
        });
    }
    async list(req, authHeader) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session || !(0, owner_guard_1.isBotOwner)(session))
                return { error: 'Forbidden' };
            const r = await client.query(`
        SELECT
          ea.appeal_id,
          ea.engine_id,
          ea.message,
          ea.created_at,
          ea.resolved,
          ea.resolution_reason,
          ea.owner_notes,
          u.display_name
        FROM engine_appeals ea
        JOIN users u ON u.user_id = ea.submitted_by
        ORDER BY ea.created_at DESC
        `);
            return { appeals: r.rows };
        });
    }
    async resolve(req, authHeader, body) {
        const token = this.token(req, authHeader);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session || !(0, owner_guard_1.isBotOwner)(session))
                return { error: 'Forbidden' };
            await client.query(`
        UPDATE engine_appeals
        SET resolved=true,
            resolved_at=now(),
            resolved_by=$2,
            resolution_reason=$3,
            owner_notes=$4
        WHERE appeal_id=$1
        `, [
                body.appealId,
                session.user_id,
                body.resolutionReason ?? 'Resolved by owner',
                body.ownerNotes ?? null,
            ]);
            if (body.unban) {
                await client.query(`
          UPDATE engines
          SET banned=false,
              banned_reason=NULL,
              banned_at=NULL,
              banned_by=NULL
          WHERE engine_id=(
            SELECT engine_id FROM engine_appeals WHERE appeal_id=$1
          )
          `, [body.appealId]);
            }
            return { ok: true };
        });
    }
};
exports.AppealsController = AppealsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppealsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AppealsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('resolve'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AppealsController.prototype, "resolve", null);
exports.AppealsController = AppealsController = __decorate([
    (0, common_1.Controller)('engine/appeals'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        owner_dm_service_1.OwnerDmService])
], AppealsController);
//# sourceMappingURL=appeals.controller.js.map