"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisciplineService = void 0;
const common_1 = require("@nestjs/common");
const DISCIPLINE_ALIASES = {
    animalism: 'Animalism',
    auspex: 'Auspex',
    'blood sorcery': 'Blood Sorcery',
    bloodsorcery: 'Blood Sorcery',
    celerity: 'Celerity',
    dominate: 'Dominate',
    fortitude: 'Fortitude',
    oblivion: 'Oblivion',
    obfuscate: 'Obfuscate',
    potence: 'Potence',
    presence: 'Presence',
    protean: 'Protean',
    'thin-blood alchemy': 'Thin-Blood Alchemy',
    thinbloodalchemy: 'Thin-Blood Alchemy',
    alchemy: 'Thin-Blood Alchemy',
};
let DisciplineService = class DisciplineService {
    detect(content) {
        const lower = content.toLowerCase().trim();
        const explicit = this.parseExplicitUse(lower);
        if (explicit)
            return explicit;
        if (/\bdominate\b/.test(lower))
            return 'Dominate';
        if (/\bcelerity\b/.test(lower))
            return 'Celerity';
        if (/\bpresence\b/.test(lower))
            return 'Presence';
        if (/\bobfuscate\b/.test(lower))
            return 'Obfuscate';
        if (/\bauspex\b/.test(lower))
            return 'Auspex';
        if (/\banimalism\b/.test(lower))
            return 'Animalism';
        if (/\bprotean\b/.test(lower))
            return 'Protean';
        if (/\bpotence\b/.test(lower))
            return 'Potence';
        if (/\bfortitude\b/.test(lower))
            return 'Fortitude';
        if (/\boblivion\b/.test(lower))
            return 'Oblivion';
        if (/\bblood sorcery\b|\bbloodsorcery\b/.test(lower))
            return 'Blood Sorcery';
        if (/\bthin-blood alchemy\b|\balchemy\b/.test(lower))
            return 'Thin-Blood Alchemy';
        return null;
    }
    buildProfile(name, dots) {
        const diceBonus = Math.min(2, Math.max(0, Math.floor(dots / 2)));
        const rouseCost = name === 'Blood Sorcery' || name === 'Oblivion' || name === 'Thin-Blood Alchemy'
            ? 1
            : 0;
        const notes = name === 'Dominate'
            ? 'Mind-and-command influence.'
            : name === 'Celerity'
                ? 'Supernatural speed and precision.'
                : name === 'Presence'
                    ? 'Awe, dread, and social gravity.'
                    : name === 'Obfuscate'
                        ? 'Concealment and misdirection.'
                        : name === 'Auspex'
                            ? 'Heightened perception and insight.'
                            : name === 'Animalism'
                                ? 'Predatory resonance and beasts.'
                                : name === 'Protean'
                                    ? 'Shape and predatory adaptation.'
                                    : name === 'Potence'
                                        ? 'Brute force beyond mortal limits.'
                                        : name === 'Fortitude'
                                            ? 'Endurance against harm.'
                                            : name === 'Oblivion'
                                                ? 'Shadowed forces and hungry voids.'
                                                : name === 'Blood Sorcery'
                                                    ? 'Ritualized blood-working.'
                                                    : 'Unstable alchemical improvisation.';
        return { name, dots, rouseCost, diceBonus, notes };
    }
    parseExplicitUse(lower) {
        const m = lower.match(/^(?:!use|\/use)\s+(.+)$/);
        if (!m)
            return null;
        const key = m[1].trim();
        if (!key)
            return null;
        const direct = DISCIPLINE_ALIASES[key];
        if (direct)
            return direct;
        const normalized = key.replace(/\s+/g, ' ').trim();
        return DISCIPLINE_ALIASES[normalized] ?? null;
    }
};
exports.DisciplineService = DisciplineService;
exports.DisciplineService = DisciplineService = __decorate([
    (0, common_1.Injectable)()
], DisciplineService);
//# sourceMappingURL=discipline.service.js.map