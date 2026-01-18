import { Injectable } from '@nestjs/common';

@Injectable()
export class FactionsService {
  // Rule source: rules-source/politics_homebrew.md (homebrew faction influence).
  async setInfluence(
    client: any,
    input: {
      engineId: string;
      faction: string;
      score: number;
    },
  ) {
    await client.query(
      `
      INSERT INTO faction_influence (engine_id, faction, score)
      VALUES ($1,$2,$3)
      ON CONFLICT (engine_id, faction)
      DO UPDATE SET score = EXCLUDED.score
      `,
      [input.engineId, input.faction, input.score],
    );

    return { message: `Influence for **${input.faction}** set to ${input.score}.` };
  }

  async getInfluence(
    client: any,
    input: {
      engineId: string;
    },
  ) {
    const res = await client.query(
      `
      SELECT faction, score
      FROM faction_influence
      WHERE engine_id = $1
      ORDER BY score DESC
      `,
      [input.engineId],
    );

    if (!res.rowCount) return { message: 'No faction influence recorded.' };

    return {
      message: res.rows
        .map((f: any) => `• **${f.faction}**: ${f.score}`)
        .join('\n'),
    };
  }
}
