"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanionModule = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const dashboard_service_1 = require("./dashboard.service");
const companion_controller_1 = require("./companion.controller");
const characters_service_1 = require("./characters.service");
const coteries_service_1 = require("./coteries.service");
const st_admin_service_1 = require("./st-admin.service");
const safety_events_service_1 = require("../safety/safety-events.service");
const world_module_1 = require("../world/world.module");
const chronicle_module_1 = require("../chronicle/chronicle.module");
let CompanionModule = class CompanionModule {
};
exports.CompanionModule = CompanionModule;
exports.CompanionModule = CompanionModule = __decorate([
    (0, common_1.Module)({
        imports: [world_module_1.WorldModule, chronicle_module_1.ChronicleModule],
        providers: [
            auth_service_1.CompanionAuthService,
            dashboard_service_1.DashboardService,
            characters_service_1.CharactersService,
            coteries_service_1.CoteriesService,
            st_admin_service_1.StAdminService,
            safety_events_service_1.SafetyEventsService,
        ],
        controllers: [companion_controller_1.CompanionController],
    })
], CompanionModule);
//# sourceMappingURL=companion.module.js.map