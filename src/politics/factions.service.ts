import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class FactionsService {
  async listFactions(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM factions
      WHERE engine_id = $1
      ORDER BY name
      `,
      [engineId],
    );
    return res.rows;
  }

  async createFaction(
    client: any,
    engineId: string,
    name: string,
    description?: string,
  ) {
    const factionId = uuid();
    await client.query(
      `
      INSERT INTO factions
        (faction_id, engine_id, name, description)
      VALUES ($1,$2,$3,$4)
      `,
      [factionId, engineId, name, description ?? null],
    );

    return { factionId };
  }
}