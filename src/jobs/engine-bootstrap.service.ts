import { Injectable, Logger } from '@nestjs/common';
import { uuid } from '../common/utils/uuid';

@Injectable()
export class EngineBootstrapService {
  private readonly logger = new Logger(EngineBootstrapService.name);

  async bootstrapEngine(client: any, engineId: string): Promise<void> {
    await this.ensureNightState(client, engineId);
    await this.ensureHeat(client, engineId);
    await this.ensureDefaultFactions(client, engineId);
    await this.ensureBaselineClocks(client, engineId);
  }

  private async ensureNightState(client: any, engineId: string) {
    await client.query(
      `
      INSERT INTO engine_night_state (engine_id, last_processed_date)
      VALUES ($1, NULL)
      ON CONFLICT (engine_id) DO NOTHING
      `,
      [engineId],
    );
  }

  private async ensureHeat(client: any, engineId: string) {
    await client.query(
      `
      INSERT INTO inquisition_heat (engine_id, heat)
      VALUES ($1, 0)
      ON CONFLICT (engine_id) DO NOTHING
      `,
      [engineId],
    );
  }

  private async ensureDefaultFactions(client: any, engineId: string) {
    const defaults = [
      { name: 'Camarilla', aggression: 2, secrecy: 4, resources: 4 },
      { name: 'Anarchs', aggression: 3, secrecy: 2, resources: 2 },
      { name: 'Sabbat', aggression: 5, secrecy: 1, resources: 3 },
      { name: 'Second Inquisition', aggression: 4, secrecy: 5, resources: 5 },
    ];

    for (const f of defaults) {
      await client.query(
        `
        INSERT INTO factions
          (faction_id, engine_id, name, aggression, secrecy, resources)
        SELECT $1,$2,$3,$4,$5,$6
        WHERE NOT EXISTS (
          SELECT 1 FROM factions
          WHERE engine_id = $2 AND lower(name) = lower($3)
        )
        `,
        [uuid(), engineId, f.name, f.aggression, f.secrecy, f.resources],
      );
    }
  }

  private async ensureBaselineClocks(client: any, engineId: string) {
    const clocks = [
      {
        title: 'Second Inquisition Net Tightens',
        segments: 6,
        nightly: true,
        description: 'Surveillance, informants, and investigations escalate.',
      },
      {
        title: 'Domain Stability',
        segments: 4,
        nightly: false,
        description: 'Political stability of the domain.',
      },
    ];

    for (const c of clocks) {
      await client.query(
        `
        INSERT INTO story_clocks
          (clock_id, engine_id, title, segments, nightly, description)
        SELECT $1,$2,$3,$4,$5,$6
        WHERE NOT EXISTS (
          SELECT 1 FROM story_clocks
          WHERE engine_id = $2 AND lower(title) = lower($3)
        )
        `,
        [uuid(), engineId, c.title, c.segments, c.nightly, c.description],
      );
    }
  }
}