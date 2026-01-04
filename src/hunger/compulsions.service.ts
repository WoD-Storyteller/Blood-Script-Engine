import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';

const CLAN_COMPULSIONS: Record<string, string[]> = {
  brujah: ['Rebellion', 'Wrath'],
  ventrue: ['Arrogance'],
  toreador: ['Aesthetic Fixation'],
  malkavian: ['Derangement'],
  nosferatu: ['Cryptophilia'],
  tremere: ['Perfectionism'],
  gangrel: ['Feral Impulses'],
  lasombra: ['Ruthlessness'],
};

@Injectable()
export class CompulsionsService {
  async triggerFromFailure(
    client: PoolClient,
    engineId: string,
    characterId: string,
  ) {
    const r = await client.query(
      `
      SELECT sheet->>'clan' AS clan
      FROM characters
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId],
    );

    const clan = (r.rows[0]?.clan || '').toLowerCase();
    const options = CLAN_COMPULSIONS[clan] ?? ['Hunger'];

    const compulsion =
      options[Math.floor(Math.random() * options.length)];

    await client.query(
      `
      UPDATE characters
      SET sheet = jsonb_set(
        sheet,
        '{active_compulsion}',
        to_jsonb($3::text)
      )
      WHERE engine_id=$1 AND character_id=$2
      `,
      [engineId, characterId, compulsion],
    );

    return compulsion;
  }
}