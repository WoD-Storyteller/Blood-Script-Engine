"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WillpowerService = void 0;
const common_1 = require("@nestjs/common");
let WillpowerService = class WillpowerService {
    canReroll(current) {
        return current > 0;
    }
    applyRerollPenalty(current) {
        if (current <= 0)
            return current;
        return current - 1;
    }
    applyDamage(current, amount) {
        return Math.max(0, current - amount);
    }
    recover(current, max, amount) {
        return Math.min(max, current + amount);
    }
};
exports.WillpowerService = WillpowerService;
exports.WillpowerService = WillpowerService = __decorate([
    (0, common_1.Injectable)()
], WillpowerService);
//# sourceMappingURL=willpower.service.js.map