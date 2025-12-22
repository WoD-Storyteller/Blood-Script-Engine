"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoteriesService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let CoteriesService = class CoteriesService {
    async listCoteries(client, engineId) {
        const res = await client.query(`
      SELECT coterie_id, name, description, created_at
      FROM coteries
      WHERE engine_id = $1
      ORDER BY created_at ASC
      `, [engineId]);
        return res.rows;
    }
    async createCoterie(client, engineId, name, description) {
        const coterieId = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO coteries
        (coterie_id, engine_id, name, description)
      VALUES ($1,$2,$3,$4)
      `, [coterieId, engineId, name, description ?? null]);
        return { coterieId };
    }
    async addMember(client, engineId, coterieId, userId) {
        await client.query(`
      INSERT INTO coterie_members
        (engine_id, coterie_id, user_id)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      `, [engineId, coterieId, userId]);
        return { ok: true };
    }
    async removeMember(client, engineId, coterieId, userId) {
        await client.query(`
      DELETE FROM coterie_members
      WHERE engine_id=$1 AND coterie_id=$2 AND user_id=$3
      `, [engineId, coterieId, userId]);
        return { ok: true };
    }
    async listMembers(client, engineId, coterieId) {
        const res = await client.query(`
      SELECT u.user_id, u.display_name
      FROM coterie_members m
      JOIN users u ON u.user_id = m.user_id
      WHERE m.engine_id=$1 AND m.coterie_id=$2
      `, [engineId, coterieId]);
        return res.rows;
    }
};
exports.CoteriesService = CoteriesService;
exports.CoteriesService = CoteriesService = __decorate([
    (0, common_1.Injectable)()
], CoteriesService);
//# sourceMappingURL=coteries.service.js.map