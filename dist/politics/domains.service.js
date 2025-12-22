"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let DomainsService = class DomainsService {
    async claimDomain(client, input) {
        await client.query(`
      INSERT INTO domains
        (domain_id, engine_id, name, claimed_by_user_id, notes)
      VALUES ($1,$2,$3,$4,$5)
      `, [
            (0, uuid_1.uuid)(),
            input.engineId,
            input.name,
            input.claimedByUserId,
            input.notes ?? null,
        ]);
        return { message: `🏙️ Domain claimed: **${input.name}**` };
    }
    async listDomains(client, input) {
        const res = await client.query(`
      SELECT name, notes
      FROM domains
      WHERE engine_id = $1
      ORDER BY created_at DESC
      `, [input.engineId]);
        if (!res.rowCount)
            return { message: 'No domains claimed.' };
        return {
            message: res.rows
                .map((d) => `• **${d.name}**${d.notes ? ` — ${d.notes}` : ''}`)
                .join('\n'),
        };
    }
};
exports.DomainsService = DomainsService;
exports.DomainsService = DomainsService = __decorate([
    (0, common_1.Injectable)()
], DomainsService);
//# sourceMappingURL=domains.service.js.map