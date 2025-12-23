import { Injectable, Logger } from '@nestjs/common';
import { EngineRole } from '../common/enums/engine-role.enum';

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  /**
   * Best-effort schema assumptions:
   * - characters(engine_id, character_id, user_id, name, clan, concept, sire, status, created_at, updated_at)
   * If your schema differs, adjust these SELECTs later.
   */
  async listCharacters(client: any, input: { engineId: string; userId: string; role: string }) {
    try {
      if (input.role === EngineRole.ST || input.role === EngineRole.ADMIN) {
        const res = await client.query(
          `
          SELECT character_id, name, clan, concept, status, user_id
          FROM characters
          WHERE engine_id = $1
          ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
          LIMIT 200
          `,
          [input.engineId],
        );
        return res.rows;
      }

      const res = await client.query(
        `
        SELECT character_id, name, clan, concept, status
        FROM characters
        WHERE engine_id = $1 AND user_id = $2
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 200
        `,
        [input.engineId, input.userId],
      );
      return res.rows;
    } catch (e: any) {
      // If table doesn't exist yet, return empty and do not crash app.
      this.logger.debug(`listCharacters fallback: ${e?.message ?? 'unknown error'}`);
      return [];
    }
  }

  async getCharacter(client: any, input: { engineId: string; userId: string; role: string; characterId: string }) {
    try {
      if (input.role === EngineRole.ST || input.role === EngineRole.ADMIN) {
        const res = await client.query(
          `
          SELECT *
          FROM characters
          WHERE engine_id = $1 AND character_id = $2
          LIMIT 1
          `,
          [input.engineId, input.characterId],
        );
        return res.rowCount ? res.rows[0] : null;
      }

      const res = await client.query(
        `
        SELECT *
        FROM characters
        WHERE engine_id = $1 AND character_id = $2 AND user_id = $3
        LIMIT 1
        `,
        [input.engineId, input.characterId, input.userId],
      );
      return res.rowCount ? res.rows[0] : null;
    } catch (e: any) {
      this.logger.debug(`getCharacter fallback: ${e?.message ?? 'unknown error'}`);
      return null;
    }
  }
}
