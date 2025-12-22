"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const common_1 = require("@nestjs/common");
let StatusService = class StatusService {
    async getStatus(client, input) {
        const row = await client.query(`
      SELECT hunger, health, willpower, conditions
      FROM characters
      WHERE engine_id = $1 AND character_id = $2
      `, [input.engineId, input.characterId]);
        if (!row.rowCount) {
            return {
                hunger: 0,
                health: 0,
                willpower: 0,
                conditions: [],
            };
        }
        return {
            hunger: row.rows[0].hunger ?? 0,
            health: row.rows[0].health ?? 0,
            willpower: row.rows[0].willpower ?? 0,
            conditions: row.rows[0].conditions ?? [],
        };
    }
};
exports.StatusService = StatusService;
exports.StatusService = StatusService = __decorate([
    (0, common_1.Injectable)()
], StatusService);
//# sourceMappingURL=status.service.js.map