"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModeratorsService = void 0;
const common_1 = require("@nestjs/common");
let ModeratorsService = class ModeratorsService {
    async isModerator(client, engineId, userId) {
        const r = await client.query(`SELECT 1 FROM engine_moderators WHERE engine_id=$1 AND user_id=$2 LIMIT 1`, [engineId, userId]);
        return r.rowCount > 0;
    }
    async list(client, engineId) {
        const r = await client.query(`
      SELECT u.user_id, u.display_name, u.discord_user_id, em.created_at
      FROM engine_moderators em
      JOIN users u ON u.user_id = em.user_id
      WHERE em.engine_id=$1
      ORDER BY u.display_name
      `, [engineId]);
        return r.rows;
    }
    async add(client, input) {
        await client.query(`
      INSERT INTO engine_moderators (engine_id, user_id, added_by)
      VALUES ($1,$2,$3)
      ON CONFLICT DO NOTHING
      `, [input.engineId, input.userId, input.addedBy]);
    }
    async remove(client, input) {
        await client.query(`
      DELETE FROM engine_moderators
      WHERE engine_id=$1 AND user_id=$2
      `, [input.engineId, input.userId]);
    }
};
exports.ModeratorsService = ModeratorsService;
exports.ModeratorsService = ModeratorsService = __decorate([
    (0, common_1.Injectable)()
], ModeratorsService);
//# sourceMappingURL=moderators.service.js.map