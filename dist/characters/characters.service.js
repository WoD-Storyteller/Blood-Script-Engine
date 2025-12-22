"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharactersService = void 0;
const common_1 = require("@nestjs/common");
let CharactersService = class CharactersService {
    async updateSheet(client, characterId, patch) {
        await client.query(`
      UPDATE characters
      SET sheet = sheet || $2::jsonb,
          updated_at = now()
      WHERE character_id = $1
      `, [characterId, JSON.stringify(patch)]);
        return { ok: true };
    }
};
exports.CharactersService = CharactersService;
exports.CharactersService = CharactersService = __decorate([
    (0, common_1.Injectable)()
], CharactersService);
//# sourceMappingURL=characters.service.js.map