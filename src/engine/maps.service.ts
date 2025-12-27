import { Injectable } from '@nestjs/common';

@Injectable()
export class MapsService {
  async setMap(
    client: any,
    input: {
      engineId: string;
      url: string;
      setByUserId?: string;
    },
  ) {
    await client.query(
      `
      UPDATE engines
      SET map_url=$2, updated_at=now()
      WHERE engine_id=$1
      `,
      [input.engineId, input.url],
    );

    return { ok: true };
  }
}