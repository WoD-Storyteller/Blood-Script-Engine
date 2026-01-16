import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { EngineRole } from '../common/enums/engine-role.enum';

@Controller('companion/chronicle')
export class ChronicleUploadController {
  constructor(private readonly db: DatabaseService) {}

  @Get('export')
  async exportChronicle(@Req() req: any) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    return this.db.withClient(async (client) => {
      const engineId = session.engine_id;

      const [characters, coteries, clocks, arcs, npcs] = await Promise.all([
        client.query(`SELECT * FROM characters WHERE engine_id = $1`, [engineId]),
        client.query(`SELECT * FROM coteries WHERE engine_id = $1`, [engineId]),
        client.query(`SELECT * FROM clocks WHERE engine_id = $1`, [engineId]),
        client.query(`SELECT * FROM arcs WHERE engine_id = $1`, [engineId]),
        client.query(`SELECT * FROM npcs WHERE engine_id = $1`, [engineId]),
      ]);

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        engineId,
        data: {
          characters: characters.rows,
          coteries: coteries.rows,
          clocks: clocks.rows,
          arcs: arcs.rows,
          npcs: npcs.rows,
        },
      };
    });
  }

  @Post('import')
  async importChronicle(
    @Req() req: any,
    @Body() body: { data: any; destructive?: boolean },
  ) {
    const session = req.session;
    if (!session) return { error: 'Unauthorized' };

    if (session.role !== EngineRole.ST && session.role !== EngineRole.OWNER) {
      return { error: 'Forbidden - ST or Owner only' };
    }

    if (!body.data || typeof body.data !== 'object') {
      return { error: 'Invalid JSON data' };
    }

    const { data, destructive } = body;

    if (!data.version) {
      return { error: 'Missing version field in chronicle data' };
    }

    const validTables = ['characters', 'coteries', 'clocks', 'arcs', 'npcs'];
    const tablesToImport = Object.keys(data.data || {}).filter(k => validTables.includes(k));

    if (tablesToImport.length === 0) {
      return { error: 'No valid data tables found in import' };
    }

    return this.db.withClient(async (client) => {
      const engineId = session.engine_id;
      let imported = 0;

      if (destructive) {
        for (const table of tablesToImport) {
          await client.query(`DELETE FROM ${table} WHERE engine_id = $1`, [engineId]);
        }
      }

      for (const table of tablesToImport) {
        const rows = data.data[table];
        if (!Array.isArray(rows)) continue;

        for (const row of rows) {
          row.engine_id = engineId;

          const keys = Object.keys(row).filter(k => k !== 'created_at' && k !== 'updated_at');
          const values = keys.map(k => row[k]);
          const placeholders = keys.map((_, i) => `$${i + 1}`);

          try {
            await client.query(
              `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders.join(', ')})
               ON CONFLICT DO NOTHING`,
              values,
            );
            imported++;
          } catch (e) {
            console.warn(`Failed to import row to ${table}:`, e);
          }
        }
      }

      return { ok: true, imported };
    });
  }

  @Post('validate')
  async validateChronicle(@Body() body: { data: any }) {
    if (!body.data || typeof body.data !== 'object') {
      return { valid: false, error: 'Invalid JSON structure' };
    }

    if (!body.data.version) {
      return { valid: false, error: 'Missing version field' };
    }

    if (!body.data.data || typeof body.data.data !== 'object') {
      return { valid: false, error: 'Missing data field' };
    }

    const validTables = ['characters', 'coteries', 'clocks', 'arcs', 'npcs'];
    const foundTables = Object.keys(body.data.data).filter(k => validTables.includes(k));

    return {
      valid: true,
      tables: foundTables,
      rowCounts: foundTables.reduce((acc, t) => {
        acc[t] = Array.isArray(body.data.data[t]) ? body.data.data[t].length : 0;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
