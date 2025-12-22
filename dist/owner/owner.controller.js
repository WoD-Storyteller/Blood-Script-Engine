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
exports.OwnerController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const owner_guard_1 = require("./owner.guard");
let OwnerController = class OwnerController {
    constructor(db, auth) {
        this.db = db;
        this.auth = auth;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async listEngines(req, auth) {
        const token = this.token(req, auth);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session || !(0, owner_guard_1.isBotOwner)(session))
                return { error: 'Forbidden' };
            const r = await client.query(`
        SELECT
          e.engine_id,
          e.name,
          e.banned,
          e.banned_reason,

          -- Safety
          COUNT(se.event_id) FILTER (WHERE se.type='red') AS red_total,
          COUNT(se.event_id) FILTER (WHERE se.type='red' AND se.resolved=true) AS red_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type='red' AND se.resolved=false) AS red_unresolved,

          COUNT(se.event_id) FILTER (WHERE se.type='yellow') AS yellow_total,
          COUNT(se.event_id) FILTER (WHERE se.type='yellow' AND se.resolved=true) AS yellow_resolved,
          COUNT(se.event_id) FILTER (WHERE se.type='yellow' AND se.resolved=false) AS yellow_unresolved,

          COUNT(se.event_id) FILTER (WHERE se.type='green') AS green_total,

          -- Strikes
          COUNT(es.strike_id) AS strike_count,

          -- Auto highlight flags
          BOOL_OR(se.type='red' AND se.resolved=false) AS has_unresolved_red,
          BOOL_OR(se.type='yellow' AND se.resolved=false) AS has_unresolved_yellow

        FROM engines e
        LEFT JOIN safety_events se ON se.engine_id = e.engine_id
        LEFT JOIN engine_strikes es ON es.engine_id = e.engine_id
        GROUP BY e.engine_id
        ORDER BY e.created_at DESC
        `);
            return { engines: r.rows };
        });
    }
    async issueStrike(req, auth, body) {
        const token = this.token(req, auth);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session || !(0, owner_guard_1.isBotOwner)(session))
                return { error: 'Forbidden' };
            await client.query(`
        INSERT INTO engine_strikes (engine_id, issued_by, reason)
        VALUES ($1,$2,$3)
        `, [body.engineId, session.user_id, body.reason ?? 'Safety violation']);
            const countRes = await client.query(`SELECT COUNT(*)::int AS c FROM engine_strikes WHERE engine_id=$1`, [body.engineId]);
            const strikeCount = countRes.rows[0].c;
            if (strikeCount >= 3) {
                await client.query(`
          UPDATE engines
          SET banned=true,
              banned_reason='Automatically banned after 3 strikes',
              banned_at=now(),
              banned_by=$2
          WHERE engine_id=$1
            AND banned=false
          `, [body.engineId, session.user_id]);
            }
            return {
                ok: true,
                strikes: strikeCount,
                autoBanned: strikeCount >= 3,
            };
        });
    }
    async unbanEngine(req, auth, body) {
        const token = this.token(req, auth);
        if (!token)
            return { error: 'Unauthorized' };
        return this.db.withClient(async (client) => {
            const session = await this.auth.validateToken(client, token);
            if (!session || !(0, owner_guard_1.isBotOwner)(session))
                return { error: 'Forbidden' };
            await client.query(`
        UPDATE engines
        SET banned=false,
            banned_reason=NULL,
            banned_at=NULL,
            banned_by=NULL
        WHERE engine_id=$1
        `, [body.engineId]);
            return { ok: true };
        });
    }
};
exports.OwnerController = OwnerController;
__decorate([
    (0, common_1.Get)('engines'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "listEngines", null);
__decorate([
    (0, common_1.Post)('issue-strike'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "issueStrike", null);
__decorate([
    (0, common_1.Post)('unban-engine'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "unbanEngine", null);
exports.OwnerController = OwnerController = __decorate([
    (0, common_1.Controller)('owner'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService])
], OwnerController);
//# sourceMappingURL=owner.controller.js.map