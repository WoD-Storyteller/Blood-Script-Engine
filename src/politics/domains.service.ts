import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

@Injectable()
export class DomainsService {
  async listDomains(client: any, engineId: string) {
    const res = await client.query(
      `
      SELECT *
      FROM domains
      WHERE engine_id = $1
      ORDER BY name
      `,
      [engineId],
    );
    return res.rows;
  }

  async createDomain(
    client: any,
    engineId: string,
    name: string,
    region?: string,
  ) {
    const domainId = uuid();
    await client.query(
      `
      INSERT INTO domains
        (domain_id, engine_id, name, region)
      VALUES ($1,$2,$3,$4)
      `,
      [domainId, engineId, name, region ?? null],
    );

    return { domainId };
  }
}