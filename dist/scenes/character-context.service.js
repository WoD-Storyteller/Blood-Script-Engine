"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterContextService = void 0;
const common_1 = require("@nestjs/common");
let CharacterContextService = class CharacterContextService {
    async getActiveCharacter(client, engineId, channelId, userId) {
        const explicit = await client.query(`
      SELECT c.character_id, c.hunger, c.blood_potency
      FROM active_characters ac
      JOIN characters c ON c.character_id = ac.character_id
      WHERE ac.engine_id = $1 AND ac.channel_id = $2 AND ac.user_id = $3
      `, [engineId, channelId, userId]);
        if (explicit.rowCount)
            return explicit.rows[0];
        const fallback = await client.query(`
      SELECT character_id, hunger, blood_potency
      FROM characters
      WHERE engine_id = $1 AND user_id = $2 AND status != 'draft'
      ORDER BY created_at ASC
      LIMIT 1
      `, [engineId, userId]);
        if (!fallback.rowCount)
            return null;
        return fallback.rows[0];
    }
    async setActiveCharacter(client, engineId, channelId, userId, characterName) {
        const res = await client.query(`
      SELECT character_id
      FROM characters
      WHERE engine_id = $1 AND user_id = $2 AND LOWER(name) = LOWER($3)
      LIMIT 1
      `, [engineId, userId, characterName]);
        if (!res.rowCount) {
            return {
                ok: false,
                message: `No character named "${characterName}" found for you in this chronicle.`,
            };
        }
        await client.query(`
      INSERT INTO active_characters (engine_id, channel_id, user_id, character_id)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (engine_id, channel_id, user_id)
      DO UPDATE SET character_id = EXCLUDED.character_id, set_at = now()
      `, [engineId, channelId, userId, res.rows[0].character_id]);
        return {
            ok: true,
            message: `You are now acting as **${characterName}** in this scene.`,
        };
    }
    async getDisciplineDots(client, characterId, disciplineName) {
        const res = await client.query(`
      SELECT dots
      FROM character_disciplines
      WHERE character_id = $1 AND discipline = $2
      LIMIT 1
      `, [characterId, disciplineName]);
        return res.rowCount ? Number(res.rows[0].dots) : 0;
    }
    async setHunger(client, characterId, hunger) {
        await client.query(`UPDATE characters SET hunger = $2 WHERE character_id = $1`, [characterId, hunger]);
    }
    async getActiveCharacterByDiscordUser(client, engineId, channelId, discordUserId) {
        const userRes = await client.query(`SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`, [discordUserId]);
        if (!userRes.rowCount)
            return null;
        return this.getActiveCharacter(client, engineId, channelId, userRes.rows[0].user_id);
    }
};
exports.CharacterContextService = CharacterContextService;
exports.CharacterContextService = CharacterContextService = __decorate([
    (0, common_1.Injectable)()
], CharacterContextService);
//# sourceMappingURL=character-context.service.js.map