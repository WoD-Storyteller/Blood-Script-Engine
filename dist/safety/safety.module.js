"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const discord_module_1 = require("../discord/discord.module");
const safety_threshold_service_1 = require("./safety-threshold.service");
let SafetyModule = class SafetyModule {
};
exports.SafetyModule = SafetyModule;
exports.SafetyModule = SafetyModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, discord_module_1.DiscordModule],
        providers: [safety_threshold_service_1.SafetyThresholdService],
        exports: [safety_threshold_service_1.SafetyThresholdService],
    })
], SafetyModule);
//# sourceMappingURL=safety.module.js.map