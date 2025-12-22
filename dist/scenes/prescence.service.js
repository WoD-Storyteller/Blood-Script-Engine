"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceService = void 0;
const common_1 = require("@nestjs/common");
let PresenceService = class PresenceService {
    async markPresent(client, engineId, characterId) {
        await client.query(`
      INSERT INTO presence (engine_id, character_id, status)
      VALUES ($1,$2,'online')
      ON CONFLICT (engine_id, character_id)
      DO UPDATE SET status='online', updated_at=now()
      `, [engineId, characterId]);
    }
    async markOffline(client, engineId, characterId) {
        await client.query(`
      UPDATE presence
      SET status='offline', updated_at=now()
      WHERE engine_id=$1 AND character_id=$2
      `, [engineId, characterId]);
    }
    async listPresent(client, engineId, sceneId) {
        const res = await client.query(`
      SELECT p.character_id, p.status
      FROM presence p
      JOIN scenes s ON s.scene_id=$2
      WHERE p.engine_id=$1
      `, [engineId, sceneId]);
        return res.rows;
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)()
], PresenceService);
//# sourceMappingURL=prescence.service.js.map