"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapsService = void 0;
const common_1 = require("@nestjs/common");
let MapsService = class MapsService {
    async setMapUrl(client, input) {
        await client.query(`
      UPDATE engines
      SET google_my_maps_url = $2
      WHERE engine_id = $1
      `, [input.engineId, input.url]);
    }
    async getMapUrl(client, engineId) {
        const res = await client.query(`
      SELECT google_my_maps_url
      FROM engines
      WHERE engine_id = $1
      `, [engineId]);
        return res.rowCount ? res.rows[0].google_my_maps_url : null;
    }
};
exports.MapsService = MapsService;
exports.MapsService = MapsService = __decorate([
    (0, common_1.Injectable)()
], MapsService);
//# sourceMappingURL=maps.service.js.map