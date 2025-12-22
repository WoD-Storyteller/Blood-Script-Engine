"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyEventsService = void 0;
const common_1 = require("@nestjs/common");
let SafetyEventsService = class SafetyEventsService {
    async listSafetyEvents(client, engineId) {
        const res = await client.query(`
      SELECT
        event_id,
        type,
        category,
        resolved,
        created_at
      FROM safety_events
      WHERE engine_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `, [engineId]);
        return res.rows;
    }
    async resolveEvent(client, engineId, eventId, resolvedByUserId, notes) {
        await client.query(`
      UPDATE safety_events
      SET resolved = true,
          resolved_by_user_id = $4,
          resolution_notes = $5,
          resolved_at = now()
      WHERE engine_id = $1 AND event_id = $2
      `, [engineId, eventId, resolvedByUserId, notes ?? null]);
        return { ok: true };
    }
};
exports.SafetyEventsService = SafetyEventsService;
exports.SafetyEventsService = SafetyEventsService = __decorate([
    (0, common_1.Injectable)()
], SafetyEventsService);
//# sourceMappingURL=safety-events.service.js.map