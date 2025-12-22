"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XpModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const companion_module_1 = require("../companion/companion.module");
const characters_module_1 = require("../characters/characters.module");
const xp_service_1 = require("./xp.service");
const xp_controller_1 = require("./xp.controller");
let XpModule = class XpModule {
};
exports.XpModule = XpModule;
exports.XpModule = XpModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, companion_module_1.CompanionModule, characters_module_1.CharactersModule],
        providers: [xp_service_1.XpService],
        controllers: [xp_controller_1.XpController],
        exports: [xp_service_1.XpService],
    })
], XpModule);
//# sourceMappingURL=xp.module.js.map