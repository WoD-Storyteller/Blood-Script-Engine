import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class OccultService {
  async listRituals(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT ritual_id, name, level, discipline, description
      FROM occult_rituals
      WHERE engine_id = $1
      ORDER BY level ASC, name ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async createRitual(
    client: any,
    engineId: string,
    name: string,
    discipline: 'blood_sorcery' | 'oblivion',
    level: number,
    description?: string,
  ) {
    const ritualId = uuid();
    await client.query(
      `
      INSERT INTO occult_rituals
        (ritual_id, engine_id, name, discipline, level, description)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [ritualId, engineId, name, discipline, level, description ?? null],
    );

    return { ritualId };
  }

  async listAlchemy(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT formula_id, name, level, ingredients, effect
      FROM occult_alchemy
      WHERE engine_id = $1
      ORDER BY level ASC, name ASC
      `,
      [engineId],
    );
    return res.rows;
  }

  async createAlchemyFormula(
    client: any,
    engineId: string,
    name: string,
    level: number,
    ingredients: string,
    effect: string,
  ) {
    const formulaId = uuid();
    await client.query(
      `
      INSERT INTO occult_alchemy
        (formula_id, engine_id, name, level, ingredients, effect)
      VALUES ($1,$2,$3,$4,$5,$6)
      `,
      [formulaId, engineId, name, level, ingredients, effect],
    );

    return { formulaId };
  }

  async listLore(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT lore_id, title, category, content
      FROM occult_lore
      WHERE engine_id = $1
      ORDER BY category, title
      `,
      [engineId],
    );
    return res.rows;
  }

  async createLoreEntry(
    client: any,
    engineId: string,
    title: string,
    category: string,
    content: string,
  ) {
    const loreId = uuid();
    await client.query(
      `
      INSERT INTO occult_lore
        (lore_id, engine_id, title, category, content)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [loreId, engineId, title, category, content],
    );

    return { loreId };
  }
}