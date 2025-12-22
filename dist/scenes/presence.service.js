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
    async markUserOnline(client, engineId, userId) {
        await client.query(`
      INSERT INTO user_presence (engine_id, user_id, status)
      VALUES ($1,$2,'online')
      ON CONFLICT (engine_id, user_id)
      DO UPDATE SET status='online', updated_at=now()
      `, [engineId, userId]);
    }
    async markUserOffline(client, engineId, userId) {
        await client.query(`
      UPDATE user_presence
      SET status='offline', updated_at=now()
      WHERE engine_id=$1 AND user_id=$2
      `, [engineId, userId]);
    }
};
exports.PresenceService = PresenceService;
exports.PresenceService = PresenceService = __decorate([
    (0, common_1.Injectable)()
], PresenceService);
//# sourceMappingURL=presence.service.js.map