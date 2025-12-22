"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SafetyEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyEventsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let SafetyEventsService = SafetyEventsService_1 = class SafetyEventsService {
    constructor() {
        this.logger = new common_1.Logger(SafetyEventsService_1.name);
    }
    async submit(client, input) {
        await client.query(`
      INSERT INTO safety_events
        (event_id, engine_id, user_id, level, source, resolved)
      VALUES ($1,$2,$3,$4,$5,false)
      `, [(0, uuid_1.uuid)(), input.engineId, input.userId, input.level, input.source]);
        this.logger.warn(`SAFETY ${input.level.toUpperCase()} — engine=${input.engineId} user=${input.userId}`);
    }
    async listActive(client, engineId) {
        const res = await client.query(`
      SELECT event_id, user_id, level, source, created_at
      FROM safety_events
      WHERE engine_id = $1 AND resolved = false
      ORDER BY created_at ASC
      `, [engineId]);
        return res.rows;
    }
    async resolve(client, input) {
        await client.query(`
      UPDATE safety_events
      SET resolved = true,
          resolved_at = now(),
          resolved_by = $3
      WHERE engine_id = $1 AND event_id = $2
      `, [input.engineId, input.eventId, input.resolvedBy]);
    }
    async escalationCheck(client, engineId) {
        const res = await client.query(`
      SELECT level, count(*)::int AS count
      FROM safety_events
      WHERE engine_id = $1 AND resolved = false
      GROUP BY level
      `, [engineId]);
        const counts = Object.fromEntries(res.rows.map((r) => [r.level, r.count]));
        if ((counts.red ?? 0) >= 1) {
            this.logger.error(`OWNER ALERT: RED safety card active for engine ${engineId}`);
        }
        if ((counts.yellow ?? 0) >= 3) {
            this.logger.warn(`OWNER ALERT: multiple YELLOW cards for engine ${engineId}`);
        }
    }
};
exports.SafetyEventsService = SafetyEventsService;
exports.SafetyEventsService = SafetyEventsService = SafetyEventsService_1 = __decorate([
    (0, common_1.Injectable)()
], SafetyEventsService);
//# sourceMappingURL=safety-events.service.js.map