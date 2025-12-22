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
    roll(pool) {
        const normalDice = pool.total - pool.hunger;
        const hungerDice = pool.hunger;
        const raw = this.rollDice(normalDice);
        const rawHunger = this.rollDice(hungerDice);
        const roll = {
            raw,
            rawHunger,
            successes: 0,
            tens: 0,
            ones: 0,
            hungerTens: 0,
            hungerOnes: 0,
        };
        for (const d of raw) {
            if (d >= 6)
                roll.successes++;
            if (d === 10)
                roll.tens++;
            if (d === 1)
                roll.ones++;
        }
        for (const d of rawHunger) {
            if (d >= 6)
                roll.successes++;
            if (d === 10)
                roll.hungerTens++;
            if (d === 1)
                roll.hungerOnes++;
        }
        const totalTens = roll.tens + roll.hungerTens;
        const hasCritical = Math.floor(totalTens / 2) > 0;
        if (hasCritical) {
            roll.successes += 2 * Math.floor(totalTens / 2);
        }
        if (roll.successes === 0) {
            if (roll.hungerOnes > 0)
                return { roll, outcome: 'bestial_failure' };
            return { roll, outcome: 'failure' };
        }
        if (hasCritical) {
            if (roll.hungerTens > 0)
                return { roll, outcome: 'messy_critical' };
            return { roll, outcome: 'critical' };
        }
        return { roll, outcome: 'success' };
    }
    rollDice(count) {
        return Array.from({ length: count }, () => Math.floor(Math.random() * 10) + 1);
    }
};
exports.DiceService = DiceService;
exports.DiceService = DiceService = __decorate([
    (0, common_1.Injectable)()
], DiceService);
//# sourceMappingURL=dice.service.js.map