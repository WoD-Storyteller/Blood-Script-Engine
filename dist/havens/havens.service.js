"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HavensService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let HavensService = class HavensService {
    async listHavens(client, engineId) {
        const res = await client.query(`
      SELECT haven_id, name, description, security_rating, created_at
      FROM havens
      WHERE engine_id = $1
      ORDER BY created_at ASC
      `, [engineId]);
        return res.rows;
    }
    async createHaven(client, engineId, name, description, securityRating = 1) {
        const havenId = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO havens
        (haven_id, engine_id, name, description, security_rating)
      VALUES ($1,$2,$3,$4,$5)
      `, [havenId, engineId, name, description ?? null, securityRating]);
        return { havenId };
    }
    async assignToCharacter(client, engineId, havenId, characterId) {
        await client.query(`
      UPDATE characters
      SET haven_id = $3
      WHERE engine_id = $1 AND character_id = $2
      `, [engineId, characterId, havenId]);
        return { ok: true };
    }
};
exports.HavensService = HavensService;
exports.HavensService = HavensService = __decorate([
    (0, common_1.Injectable)()
], HavensService);
//# sourceMappingURL=havens.service.js.map