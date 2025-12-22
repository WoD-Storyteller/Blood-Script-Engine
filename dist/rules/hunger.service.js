"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HungerService = void 0;
const common_1 = require("@nestjs/common");
let HungerService = class HungerService {
    getConsequence(outcome) {
        switch (outcome) {
            case 'messy_critical':
                return 'Your Beast surges forward, twisting your success into something feral.';
            case 'bestial_failure':
                return 'Your Beast takes control, driving you toward a destructive impulse.';
            default:
                return null;
        }
    }
};
exports.HungerService = HungerService;
exports.HungerService = HungerService = __decorate([
    (0, common_1.Injectable)()
], HungerService);
//# sourceMappingURL=hunger.service.js.map