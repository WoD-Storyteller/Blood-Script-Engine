"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OccultService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let OccultService = class OccultService {
    async listRituals(client, engineId) {
        const res = await client.query(`
      SELECT ritual_id, name, level, discipline, description
      FROM occult_rituals
      WHERE engine_id = $1
      ORDER BY level ASC, name ASC
      `, [engineId]);
        return res.rows;
    }
    async createRitual(client, engineId, name, discipline, level, description) {
        const ritualId = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO occult_rituals
        (ritual_id, engine_id, name, discipline, level, description)
      VALUES ($1,$2,$3,$4,$5,$6)
      `, [ritualId, engineId, name, discipline, level, description ?? null]);
        return { ritualId };
    }
    async listAlchemy(client, engineId) {
        const res = await client.query(`
      SELECT formula_id, name, level, ingredients, effect
      FROM occult_alchemy
      WHERE engine_id = $1
      ORDER BY level ASC, name ASC
      `, [engineId]);
        return res.rows;
    }
    async createAlchemyFormula(client, engineId, name, level, ingredients, effect) {
        const formulaId = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO occult_alchemy
        (formula_id, engine_id, name, level, ingredients, effect)
      VALUES ($1,$2,$3,$4,$5,$6)
      `, [formulaId, engineId, name, level, ingredients, effect]);
        return { formulaId };
    }
    async listLore(client, engineId) {
        const res = await client.query(`
      SELECT lore_id, title, category, content
      FROM occult_lore
      WHERE engine_id = $1
      ORDER BY category, title
      `, [engineId]);
        return res.rows;
    }
    async createLoreEntry(client, engineId, title, category, content) {
        const loreId = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO occult_lore
        (lore_id, engine_id, title, category, content)
      VALUES ($1,$2,$3,$4,$5)
      `, [loreId, engineId, title, category, content]);
        return { loreId };
    }
};
exports.OccultService = OccultService;
exports.OccultService = OccultService = __decorate([
    (0, common_1.Injectable)()
], OccultService);
//# sourceMappingURL=occult.service.js.map