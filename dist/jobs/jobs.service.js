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
var JobsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobsService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const night_cycle_service_1 = require("../politics/night-cycle.service");
const engine_bootstrap_service_1 = require("./engine-bootstrap.service");
let JobsService = JobsService_1 = class JobsService {
    constructor(db, nightCycle, bootstrap) {
        this.db = db;
        this.nightCycle = nightCycle;
        this.bootstrap = bootstrap;
        this.logger = new common_1.Logger(JobsService_1.name);
        this.intervalMs = 5 * 60 * 1000;
    }
    onModuleInit() {
        this.logger.log('JobsService started. Engine bootstrap + nightly loop active.');
        setInterval(() => this.tick(), this.intervalMs);
    }
    async tick() {
        try {
            await this.db.withClient(async (client) => {
                const engines = await client.query(`
          SELECT engine_id
          FROM engines
          `);
                for (const row of engines.rows) {
                    const engineId = row.engine_id;
                    try {
                        await this.bootstrap.bootstrapEngine(client, engineId);
                        const result = await this.nightCycle.maybeRunNightly(client, engineId);
                        if (result.ran) {
                            this.logger.log(`Night cycle executed for engine ${engineId}`);
                        }
                    }
                    catch (engineErr) {
                        this.logger.error(`Engine loop failed for ${engineId}: ${engineErr.message}`);
                    }
                }
            });
        }
        catch (e) {
            this.logger.error(`JobsService tick failed: ${e.message}`);
        }
    }
};
exports.JobsService = JobsService;
exports.JobsService = JobsService = JobsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        night_cycle_service_1.NightCycleService,
        engine_bootstrap_service_1.EngineBootstrapService])
], JobsService);
//# sourceMappingURL=jobs.service.js.map