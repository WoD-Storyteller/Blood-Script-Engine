import { Injectable } from '@nestjs/common';

@Injectable()
export class CharacterContextService {
  async getActiveCharacter(
    client: any,
    engineId: string,
    channelId: string,
    userId: string,
  ) {
    const explicit = await client.query(
      `
      SELECT c.character_id, c.hunger, c.blood_potency
      FROM active_characters ac
      JOIN characters c ON c.character_id = ac.character_id
      WHERE ac.engine_id = $1 AND ac.channel_id = $2 AND ac.user_id = $3
      `,
      [engineId, channelId, userId],
    );

    if (explicit.rowCount) return explicit.rows[0];

    const fallback = await client.query(
      `
      SELECT character_id, hunger, blood_potency
      FROM characters
      WHERE engine_id = $1 AND user_id = $2 AND status != 'draft'
      ORDER BY created_at ASC
      LIMIT 1
      `,
      [engineId, userId],
    );

    if (!fallback.rowCount) return null;
    return fallback.rows[0];
  }

  async setActiveCharacter(
    client: any,
    engineId: string,
    channelId: string,
    userId: string,
    characterName: string,
  ): Promise<{ ok: boolean; message: string }> {
    const res = await client.query(
      `
      SELECT character_id
      FROM characters
      WHERE engine_id = $1 AND user_id = $2 AND LOWER(name) = LOWER($3)
      LIMIT 1
      `,
      [engineId, userId, characterName],
    );

    if (!res.rowCount) {
      return {
        ok: false,
        message: `No character named "${characterName}" found for you in this chronicle.`,
      };
    }

    await client.query(
      `
      INSERT INTO active_characters (engine_id, channel_id, user_id, character_id)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (engine_id, channel_id, user_id)
      DO UPDATE SET character_id = EXCLUDED.character_id, set_at = now()
      `,
      [engineId, channelId, userId, res.rows[0].character_id],
    );

    return {
      ok: true,
      message: `You are now acting as **${characterName}** in this scene.`,
    };
  }

  async getDisciplineDots(client: any, characterId: string, disciplineName: string) {
    const res = await client.query(
      `
      SELECT dots
      FROM character_disciplines
      WHERE character_id = $1 AND discipline = $2
      LIMIT 1
      `,
      [characterId, disciplineName],
    );

    return res.rowCount ? Number(res.rows[0].dots) : 0;
  }

  async setHunger(client: any, characterId: string, hunger: number) {
    await client.query(
      `UPDATE characters SET hunger = $2 WHERE character_id = $1`,
      [characterId, hunger],
    );
  }

  /**
   * Resolve a mentioned discord user to their active character in this channel.
   * Returns null if user/character not found (safe default).
   */
  async getActiveCharacterByDiscordUser(
    client: any,
    engineId: string,
    channelId: string,
    discordUserId: string,
  ) {
    const userRes = await client.query(
      `SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`,
      [discordUserId],
    );
    if (!userRes.rowCount) return null;

    return this.getActiveCharacter(client, engineId, channelId, userRes.rows[0].user_id);
  }
}
