"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenetsService = void 0;
const common_1 = require("@nestjs/common");
let TenetsService = class TenetsService {
    async getActiveTenets(client, engineId) {
        const res = await client.query(`
      SELECT tenet_id, title, type
      FROM server_tenets
      WHERE engine_id = $1 AND enabled = true
      ORDER BY created_at ASC
      `, [engineId]);
        return res.rows;
    }
};
exports.TenetsService = TenetsService;
exports.TenetsService = TenetsService = __decorate([
    (0, common_1.Injectable)()
], TenetsService);
//# sourceMappingURL=tenets.service.js.map