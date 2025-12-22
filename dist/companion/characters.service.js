"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CharactersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharactersService = void 0;
const common_1 = require("@nestjs/common");
let CharactersService = CharactersService_1 = class CharactersService {
    constructor() {
        this.logger = new common_1.Logger(CharactersService_1.name);
    }
    async listCharacters(client, input) {
        try {
            if (input.role === 'st' || input.role === 'admin') {
                const res = await client.query(`
          SELECT character_id, name, clan, concept, status, user_id
          FROM characters
          WHERE engine_id = $1
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
          LIMIT 200
          `, [input.engineId]);
                return res.rows;
            }
            const res = await client.query(`
        SELECT character_id, name, clan, concept, status
        FROM characters
        WHERE engine_id = $1 AND user_id = $2
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 200
        `, [input.engineId, input.userId]);
            return res.rows;
        }
        catch (e) {
            this.logger.debug(`listCharacters fallback: ${e?.message ?? 'unknown error'}`);
            return [];
        }
    }
    async getCharacter(client, input) {
        try {
            if (input.role === 'st' || input.role === 'admin') {
                const res = await client.query(`
          SELECT *
          FROM characters
          WHERE engine_id = $1 AND character_id = $2
          LIMIT 1
          `, [input.engineId, input.characterId]);
                return res.rowCount ? res.rows[0] : null;
            }
            const res = await client.query(`
        SELECT *
        FROM characters
        WHERE engine_id = $1 AND character_id = $2 AND user_id = $3
        LIMIT 1
        `, [input.engineId, input.characterId, input.userId]);
            return res.rowCount ? res.rows[0] : null;
        }
        catch (e) {
            this.logger.debug(`getCharacter fallback: ${e?.message ?? 'unknown error'}`);
            return null;
        }
    }
};
exports.CharactersService = CharactersService;
exports.CharactersService = CharactersService = CharactersService_1 = __decorate([
    (0, common_1.Injectable)()
], CharactersService);
//# sourceMappingURL=characters.service.js.map