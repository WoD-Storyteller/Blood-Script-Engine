"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FactionsService = void 0;
const common_1 = require("@nestjs/common");
let FactionsService = class FactionsService {
    async setInfluence(client, input) {
        await client.query(`
      INSERT INTO faction_influence (engine_id, faction, score)
      VALUES ($1,$2,$3)
      ON CONFLICT (engine_id, faction)
      DO UPDATE SET score = EXCLUDED.score
      `, [input.engineId, input.faction, input.score]);
        return { message: `Influence for **${input.faction}** set to ${input.score}.` };
    }
    async getInfluence(client, input) {
        const res = await client.query(`
      SELECT faction, score
      FROM faction_influence
      WHERE engine_id = $1
      ORDER BY score DESC
      `, [input.engineId]);
        if (!res.rowCount)
            return { message: 'No faction influence recorded.' };
        return {
            message: res.rows
                .map((f) => `• **${f.faction}**: ${f.score}`)
                .join('\n'),
        };
    }
};
exports.FactionsService = FactionsService;
exports.FactionsService = FactionsService = __decorate([
    (0, common_1.Injectable)()
], FactionsService);
//# sourceMappingURL=factions.service.js.map