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
exports.DiceController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const dice_service_1 = require("./dice.service");
const engine_guard_1 = require("../engine/engine.guard");
let DiceController = class DiceController {
    constructor(db, auth, dice) {
        this.db = db;
        this.auth = auth;
        this.dice = dice;
    }
    token(req, auth) {
        return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
    }
    async roll(req, authHeader, body) {
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
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            let hunger = body.hunger ?? 0;
            if (body.useActiveCharacterHunger) {
                const r = await client.query(`
          SELECT c.sheet->>'hunger' AS hunger
          FROM characters c
          WHERE c.engine_id=$1 AND c.owner_user_id=$2 AND c.is_active=true
          LIMIT 1
          `, [session.engine_id, session.user_id]);
                hunger = r.rowCount ? Number(r.rows[0].hunger ?? 0) : 0;
            }
            const result = this.dice.rollV5(Math.max(0, body.pool), Math.max(0, hunger));
            return {
                label: body.label ?? 'Roll',
                result,
            };
        });
    }
};
exports.DiceController = DiceController;
__decorate([
    (0, common_1.Post)('roll'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DiceController.prototype, "roll", null);
exports.DiceController = DiceController = __decorate([
    (0, common_1.Controller)('companion/dice'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        dice_service_1.DiceService])
], DiceController);
//# sourceMappingURL=dice.controller.js.map