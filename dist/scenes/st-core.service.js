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
exports.StCoreService = void 0;
const common_1 = require("@nestjs/common");
const safety_service_1 = require("../safety/safety.service");
let StCoreService = class StCoreService {
    constructor(safety) {
        this.safety = safety;
    }
    async validateSceneInput(client, engineId, content) {
        return this.safety.checkTenets(client, {
            engineId,
            content,
        });
    }
};
exports.StCoreService = StCoreService;
exports.StCoreService = StCoreService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [safety_service_1.SafetyService])
], StCoreService);
//# sourceMappingURL=st-core.service.js.map