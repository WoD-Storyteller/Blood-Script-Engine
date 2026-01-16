import { Controller, Post, Get, Delete, Body, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('companion/maps')
export class MapUploadController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async getMap(@Req() req: any) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const res = await client.query(
        `SELECT map_url, map_type FROM engine_maps WHERE engine_id = $1`,
        [session.engine_id],
      );
      return { map: res.rows[0] || null };
    });
  }

  @Post()
  async uploadMap(
    @Req() req: any,
    @Body() body: { url: string; type: 'google_maps' | 'kml' },
  ) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    if (!body.url || !body.type) {
      return { error: 'URL and type required' };
    }

    if (body.type === 'google_maps') {
      if (!body.url.includes('google.com/maps') && !body.url.includes('goo.gl')) {
        return { error: 'Invalid Google Maps URL' };
      }
    }

    return this.db.withClient(async (client) => {
      await client.query(
        `
        INSERT INTO engine_maps (engine_id, map_url, map_type, updated_at)
        VALUES ($1, $2, $3, now())
        ON CONFLICT (engine_id)
        DO UPDATE SET map_url = $2, map_type = $3, updated_at = now()
        `,
        [session.engine_id, body.url, body.type],
      );
      return { ok: true };
    });
  }

  @Delete()
  async deleteMap(@Req() req: any) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    return this.db.withClient(async (client) => {
      await client.query(
        `DELETE FROM engine_maps WHERE engine_id = $1`,
        [session.engine_id],
      );
      return { ok: true };
    });
  }
}
