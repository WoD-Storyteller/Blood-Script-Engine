"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EngineBootstrapService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineBootstrapService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let EngineBootstrapService = EngineBootstrapService_1 = class EngineBootstrapService {
    constructor() {
        this.logger = new common_1.Logger(EngineBootstrapService_1.name);
    }
    async bootstrapEngine(client, engineId) {
        await this.ensureNightState(client, engineId);
        await this.ensureHeat(client, engineId);
        await this.ensureDefaultFactions(client, engineId);
        await this.ensureBaselineClocks(client, engineId);
    }
    async ensureNightState(client, engineId) {
        await client.query(`
      INSERT INTO engine_night_state (engine_id, last_processed_date)
      VALUES ($1, NULL)
      ON CONFLICT (engine_id) DO NOTHING
      `, [engineId]);
    }
    async ensureHeat(client, engineId) {
        await client.query(`
      INSERT INTO inquisition_heat (engine_id, heat)
      VALUES ($1, 0)
      ON CONFLICT (engine_id) DO NOTHING
      `, [engineId]);
    }
    async ensureDefaultFactions(client, engineId) {
        const defaults = [
            { name: 'Camarilla', aggression: 2, secrecy: 4, resources: 4 },
            { name: 'Anarchs', aggression: 3, secrecy: 2, resources: 2 },
            { name: 'Sabbat', aggression: 5, secrecy: 1, resources: 3 },
            { name: 'Second Inquisition', aggression: 4, secrecy: 5, resources: 5 },
        ];
        for (const f of defaults) {
            await client.query(`
        INSERT INTO factions
          (faction_id, engine_id, name, aggression, secrecy, resources)
        SELECT $1,$2,$3,$4,$5,$6
        WHERE NOT EXISTS (
          SELECT 1 FROM factions
          WHERE engine_id = $2 AND lower(name) = lower($3)
        )
        `, [(0, uuid_1.uuid)(), engineId, f.name, f.aggression, f.secrecy, f.resources]);
        }
    }
    async ensureBaselineClocks(client, engineId) {
        const clocks = [
            {
                title: 'Second Inquisition Net Tightens',
                segments: 6,
                nightly: true,
                description: 'Surveillance, informants, and investigations escalate.',
            },
            {
                title: 'Domain Stability',
                segments: 4,
                nightly: false,
                description: 'Political stability of the domain.',
            },
        ];
        for (const c of clocks) {
            await client.query(`
        INSERT INTO story_clocks
          (clock_id, engine_id, title, segments, nightly, description)
        SELECT $1,$2,$3,$4,$5,$6
        WHERE NOT EXISTS (
          SELECT 1 FROM story_clocks
          WHERE engine_id = $2 AND lower(title) = lower($3)
        )
        `, [(0, uuid_1.uuid)(), engineId, c.title, c.segments, c.nightly, c.description]);
        }
    }
};
exports.EngineBootstrapService = EngineBootstrapService;
exports.EngineBootstrapService = EngineBootstrapService = EngineBootstrapService_1 = __decorate([
    (0, common_1.Injectable)()
], EngineBootstrapService);
//# sourceMappingURL=engine-bootstrap.service.js.map