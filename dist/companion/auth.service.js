"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanionAuthService = void 0;
const common_1 = require("@nestjs/common");
let CompanionAuthService = class CompanionAuthService {
    async validateToken(client, token) {
        const res = await client.query(`SELECT * FROM sessions WHERE token=$1 AND expires_at > now()`, [token]);
        return res.rowCount ? res.rows[0] : null;
    }
    async revokeSession(client, token) {
        await client.query(`DELETE FROM sessions WHERE token=$1`, [token]);
        return { ok: true };
    }
};
exports.CompanionAuthService = CompanionAuthService;
exports.CompanionAuthService = CompanionAuthService = __decorate([
    (0, common_1.Injectable)()
], CompanionAuthService);
//# sourceMappingURL=auth.service.js.map