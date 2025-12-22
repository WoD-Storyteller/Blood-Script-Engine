"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyService = void 0;
const common_1 = require("@nestjs/common");
let SafetyService = class SafetyService {
    async checkTenets(client, input) {
        const tenets = await client.query(`
      SELECT tenet_id, title, category, pattern
      FROM tenets
      WHERE engine_id = $1
      `, [input.engineId]);
        for (const t of tenets.rows) {
            const regex = new RegExp(t.pattern, 'i');
            if (regex.test(input.content)) {
                return {
                    allowed: false,
                    tenetId: t.tenet_id,
                    tenetTitle: t.title,
                    category: t.category,
                };
            }
        }
        return { allowed: true };
    }
    async issueOrEscalateWarning(client, input) {
        await client.query(`
      INSERT INTO safety_warnings
        (engine_id, user_id, category, tenet_title)
      VALUES ($1,$2,$3,$4)
      `, [input.engineId, input.userId, input.category, input.tenetTitle]);
        return {
            dmText: `⚠️ **Content Warning Issued**\nTenet violated: **${input.tenetTitle}**`,
        };
    }
};
exports.SafetyService = SafetyService;
exports.SafetyService = SafetyService = __decorate([
    (0, common_1.Injectable)()
], SafetyService);
//# sourceMappingURL=safety.service.js.map