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
exports.CombatService = void 0;
const common_1 = require("@nestjs/common");
const dice_service_1 = require("../rules/dice.service");
const hunger_service_1 = require("../rules/hunger.service");
const tracker_service_1 = require("./tracker.service");
const gear_service_1 = require("./gear.service");
let CombatService = class CombatService {
    constructor(dice, hunger, tracker, gear) {
        this.dice = dice;
        this.hunger = hunger;
        this.tracker = tracker;
        this.gear = gear;
    }
    async resolveExchange(client, input) {
        const weapon = this.gear.getWeaponFromText(input.action.description);
        const armor = input.defenderCharacterId
            ? this.gear.getArmorForCharacter(input.defenderCharacterId)
            : null;
        const attackerRoll = this.dice.roll({
            total: input.attackerPool,
            hunger: input.hunger,
        });
        const defenderRoll = this.dice.roll({
            total: input.defenderPool,
            hunger: 0,
        });
        let margin = attackerRoll.roll.successes - defenderRoll.roll.successes;
        if (margin <= 0) {
            const narration = 'The attack fails to find its mark.';
            await this.tracker.logCombat(client, {
                engineId: input.engineId,
                sceneId: input.sceneId,
                attackerCharacterId: input.attackerCharacterId,
                defenderCharacterId: input.defenderCharacterId,
                damage: 0,
                summary: narration,
            });
            return { narration, damage: 0 };
        }
        margin += weapon.bonusDamage;
        if (weapon.damageType === 'superficial' && armor) {
            margin = Math.max(0, margin - armor.soak);
        }
        let narration = `${weapon.name} strikes home for ${margin} damage.`;
        const hungerEffect = this.hunger.getConsequence(attackerRoll.outcome);
        if (hungerEffect)
            narration += ` ${hungerEffect}`;
        if (input.defenderCharacterId && margin > 0) {
            await this.tracker.applyHealthDamage(client, {
                engineId: input.engineId,
                characterId: input.defenderCharacterId,
                superficial: weapon.damageType === 'superficial' ? margin : 0,
                aggravated: weapon.damageType === 'aggravated' ? margin : 0,
            });
            if (weapon.damageType === 'aggravated') {
                await this.tracker.addCondition(client, {
                    engineId: input.engineId,
                    characterId: input.defenderCharacterId,
                    name: 'Severely Injured',
                    severity: 'critical',
                    source: weapon.name,
                    sceneId: input.sceneId,
                });
            }
        }
        await this.tracker.logCombat(client, {
            engineId: input.engineId,
            sceneId: input.sceneId,
            attackerCharacterId: input.attackerCharacterId,
            defenderCharacterId: input.defenderCharacterId,
            damage: margin,
            damageType: weapon.damageType,
            summary: narration,
        });
        return { narration, damage: margin };
    }
};
exports.CombatService = CombatService;
exports.CombatService = CombatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dice_service_1.DiceService,
        hunger_service_1.HungerService,
        tracker_service_1.TrackerService,
        gear_service_1.GearService])
], CombatService);
//# sourceMappingURL=combat.service.js.map