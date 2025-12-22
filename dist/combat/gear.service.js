"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GearService = void 0;
const common_1 = require("@nestjs/common");
let GearService = class GearService {
    getWeaponFromText(text) {
        const t = text.toLowerCase();
        if (/firearm|gun|pistol|rifle|shotgun/i.test(t)) {
            return { name: 'Firearm', bonusDamage: 2, damageType: 'superficial' };
        }
        if (/knife|blade|dagger|stab/i.test(t)) {
            return { name: 'Blade', bonusDamage: 1, damageType: 'superficial' };
        }
        if (/claws?|fangs?|bite/i.test(t)) {
            return { name: 'Feral attack', bonusDamage: 1, damageType: 'aggravated' };
        }
        if (/fire|flames?|burn/i.test(t)) {
            return { name: 'Fire', bonusDamage: 2, damageType: 'aggravated' };
        }
        return { name: 'Unarmed', bonusDamage: 0, damageType: 'superficial' };
    }
    getArmorForCharacter(_characterId) {
        return null;
    }
};
exports.GearService = GearService;
exports.GearService = GearService = __decorate([
    (0, common_1.Injectable)()
], GearService);
//# sourceMappingURL=gear.service.js.map