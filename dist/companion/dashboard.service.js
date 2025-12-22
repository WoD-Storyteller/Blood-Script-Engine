"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const maps_service_1 = require("../world/maps.service");
let DashboardService = class DashboardService {
    constructor(maps) {
        this.maps = maps;
    }
    async getWorldState(client, engineId) {
        const arcs = await client.query(`SELECT arc_id, title, status FROM chronicle_arcs WHERE engine_id = $1`, [engineId]);
        const clocks = await client.query(`
      SELECT clock_id, title, progress, segments, status, nightly
      FROM story_clocks
      WHERE engine_id = $1
      `, [engineId]);
        const pressure = await client.query(`
      SELECT source, severity, description, created_at
      FROM political_pressure
      WHERE engine_id = $1 AND resolved = false
      ORDER BY created_at DESC
      LIMIT 10
      `, [engineId]);
        const heat = await client.query(`SELECT heat FROM inquisition_heat WHERE engine_id = $1`, [engineId]);
        const mapUrl = await this.maps.getMapUrl(client, engineId);
        return {
            arcs: arcs.rows,
            clocks: clocks.rows,
            pressure: pressure.rows,
            heat: heat.rows[0]?.heat ?? 0,
            mapUrl,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [maps_service_1.MapsService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map