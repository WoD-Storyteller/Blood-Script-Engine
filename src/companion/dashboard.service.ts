import { Injectable } from '@nestjs/common';
import { MapsService } from '../world/maps.service';

@Injectable()
export class DashboardService {
  constructor(private readonly maps: MapsService) {}

  async getWorldState(client: any, engineId: string) {
    const arcs = await client.query(
      `SELECT arc_id, title, status FROM chronicle_arcs WHERE engine_id = $1`,
      [engineId],
    );

    const clocks = await client.query(
      `
      SELECT clock_id, title, progress, segments, status, nightly
      FROM story_clocks
      WHERE engine_id = $1
      `,
      [engineId],
    );

    const pressure = await client.query(
      `
      SELECT source, severity, description, created_at
      FROM political_pressure
      WHERE engine_id = $1 AND resolved = false
      ORDER BY created_at DESC
      LIMIT 10
      `,
      [engineId],
    );

    const heat = await client.query(
      `SELECT heat FROM inquisition_heat WHERE engine_id = $1`,
      [engineId],
    );

    const mapUrl = await this.maps.getMapUrl(client, engineId);

    return {
      arcs: arcs.rows,
      clocks: clocks.rows,
      pressure: pressure.rows,
      heat: heat.rows[0]?.heat ?? 0,
      mapUrl,
    };
  }
}