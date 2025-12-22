"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoliticsModule = void 0;
const common_1 = require("@nestjs/common");
const boons_service_1 = require("./boons.service");
const factions_service_1 = require("./factions.service");
const domains_service_1 = require("./domains.service");
const offices_service_1 = require("./offices.service");
const motions_service_1 = require("./motions.service");
const prestige_service_1 = require("./prestige.service");
const night_cycle_service_1 = require("./night-cycle.service");
const chronicle_module_1 = require("../chronicle/chronicle.module");
const threats_module_1 = require("../threats/threats.module");
const ai_module_1 = require("../ai/ai.module");
let PoliticsModule = class PoliticsModule {
};
exports.PoliticsModule = PoliticsModule;
exports.PoliticsModule = PoliticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            chronicle_module_1.ChronicleModule,
            threats_module_1.ThreatsModule,
            ai_module_1.AiModule,
        ],
        providers: [
            boons_service_1.BoonsService,
            factions_service_1.FactionsService,
            domains_service_1.DomainsService,
            offices_service_1.OfficesService,
            motions_service_1.MotionsService,
            prestige_service_1.PrestigeService,
            night_cycle_service_1.NightCycleService,
        ],
        exports: [
            boons_service_1.BoonsService,
            factions_service_1.FactionsService,
            domains_service_1.DomainsService,
            offices_service_1.OfficesService,
            motions_service_1.MotionsService,
            prestige_service_1.PrestigeService,
            night_cycle_service_1.NightCycleService,
        ],
    })
], PoliticsModule);
//# sourceMappingURL=politics.module.js.map