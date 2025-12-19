import { Injectable } from '@nestjs/common';

@Injectable()
export class MapsService {
  async setMapUrl(
    client: any,
    input: {
      engineId: string;
      url: string;
    },
  ) {
    await client.query(
      `
      UPDATE engines
      SET google_my_maps_url = $2
      WHERE engine_id = $1
      `,
      [input.engineId, input.url],
    );
  }

  async getMapUrl(client: any, engineId: string): Promise<string | null> {
    const res = await client.query(
      `
      SELECT google_my_maps_url
      FROM engines
      WHERE engine_id = $1
      `,
      [engineId],
    );

    return res.rowCount ? res.rows[0].google_my_maps_url : null;
  }
}