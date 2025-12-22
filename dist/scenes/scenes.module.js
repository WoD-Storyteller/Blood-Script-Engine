"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenesModule = void 0;
const common_1 = require("@nestjs/common");
const scenes_service_1 = require("./scenes.service");
const st_core_service_1 = require("./st-core.service");
const resolution_pipeline_1 = require("./resolution.pipeline");
const safety_module_1 = require("../safety/safety.module");
const politics_module_1 = require("../politics/politics.module");
const chronicle_module_1 = require("../chronicle/chronicle.module");
const threats_module_1 = require("../threats/threats.module");
const presence_service_1 = require("./presence.service");
const character_context_service_1 = require("./character-context.service");
const status_service_1 = require("./status.service");
const recovery_service_1 = require("./recovery.service");
let ScenesModule = class ScenesModule {
};
exports.ScenesModule = ScenesModule;
exports.ScenesModule = ScenesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            safety_module_1.SafetyModule,
            politics_module_1.PoliticsModule,
            chronicle_module_1.ChronicleModule,
            threats_module_1.ThreatsModule,
        ],
        providers: [
            scenes_service_1.ScenesService,
            st_core_service_1.StCoreService,
            resolution_pipeline_1.ResolutionPipeline,
            presence_service_1.PresenceService,
            character_context_service_1.CharacterContextService,
            status_service_1.StatusService,
            recovery_service_1.RecoveryService,
        ],
        exports: [scenes_service_1.ScenesService],
    })
], ScenesModule);
//# sourceMappingURL=scenes.module.js.map