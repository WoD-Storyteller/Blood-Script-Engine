"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiceService = void 0;
const common_1 = require("@nestjs/common");
let DiceService = class DiceService {
    rollV5(pool, hunger) {
        const normalDice = Math.max(0, pool - hunger);
        const hungerDice = Math.max(0, hunger);
        const rolls = this.roll(normalDice);
        const hungerRolls = this.roll(hungerDice);
        const successes = this.countSuccesses(rolls) +
            this.countSuccesses(hungerRolls);
        const tens = rolls.filter((r) => r === 10).length +
            hungerRolls.filter((r) => r === 10).length;
        const hungerTens = hungerRolls.filter((r) => r === 10).length;
        const hungerOnes = hungerRolls.filter((r) => r === 1).length;
        const critical = tens >= 2;
        const messyCritical = critical && hungerTens > 0;
        const bestialFailure = successes === 0 && hungerOnes > 0;
        return {
            pool,
            hunger,
            rolls,
            hungerRolls,
            successes,
            critical,
            messyCritical,
            bestialFailure,
        };
    }
    roll(n) {
        return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 10));
    }
    countSuccesses(rolls) {
        return rolls.reduce((sum, r) => {
            if (r === 10)
                return sum + 2;
            if (r >= 6)
                return sum + 1;
            return sum;
        }, 0);
    }
};
exports.DiceService = DiceService;
exports.DiceService = DiceService = __decorate([
    (0, common_1.Injectable)()
], DiceService);
//# sourceMappingURL=dice.service.js.map