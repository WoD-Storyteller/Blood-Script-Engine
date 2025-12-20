import { Injectable } from '@nestjs/common';

@Injectable()
export class StatusService {
  async getStatus(
    client: any,
    input: {
      engineId: string;
      characterId: string;
    },
  ) {
    const row = await client.query(
      `
      SELECT hunger, health, willpower, conditions
      FROM characters
      WHERE engine_id = $1 AND character_id = $2
      `,
      [input.engineId, input.characterId],
    );

    if (!row.rowCount) {
      return {
        hunger: 0,
        health: 0,
        willpower: 0,
        conditions: [],
      };
    }

    return {
      hunger: row.rows[0].hunger ?? 0,
      health: row.rows[0].health ?? 0,
      willpower: row.rows[0].willpower ?? 0,
      conditions: row.rows[0].conditions ?? [],
    };
  }
}
