import { Controller, Post, Get, Body, Req, Res, Param, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ObjectStorageService } from '../storage/objectStorage';
import { DatabaseService } from '../database/database.service';
import { uuid } from '../common/utils/uuid';

interface NpcImportData {
  name: string;
  faction_id?: string;
  role?: string;
  personality?: {
    traits?: string[];
    mannerisms?: string[];
    voice?: string;
    goals?: string[];
  };
  ambition?: string;
  status?: number;
  alive?: boolean;
  portrait_url?: string;
  webhook_url?: string;
}

@Controller('companion/npcs')
export class NpcController {
  private objectStorage: ObjectStorageService;

  constructor(private readonly db: DatabaseService) {
    this.objectStorage = new ObjectStorageService();
  }

  @Get()
  async listNpcs(@Req() req: Request) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.db.query(
      `SELECT npc_id, name, role, personality, ambition, status, alive, portrait_url, webhook_url, created_at
       FROM npcs WHERE engine_id = $1 ORDER BY name`,
      [session.engineId],
    );

    return { npcs: result.rows };
  }

  @Get(':id')
  async getNpc(@Req() req: Request, @Param('id') npcId: string) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.db.query(
      `SELECT * FROM npcs WHERE npc_id = $1 AND engine_id = $2`,
      [npcId, session.engineId],
    );

    if (result.rows.length === 0) {
      throw new HttpException('NPC not found', HttpStatus.NOT_FOUND);
    }

    return { npc: result.rows[0] };
  }

  @Post('batch-import')
  async batchImport(
    @Req() req: Request,
    @Body() body: { npcs: NpcImportData[] },
  ) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (session.role !== 'st' && session.role !== 'owner') {
      throw new HttpException('Only Storytellers can import NPCs', HttpStatus.FORBIDDEN);
    }

    if (!body.npcs || !Array.isArray(body.npcs)) {
      throw new HttpException('Missing npcs array', HttpStatus.BAD_REQUEST);
    }

    if (body.npcs.length > 100) {
      throw new HttpException('Maximum 100 NPCs per import', HttpStatus.BAD_REQUEST);
    }

    const imported: string[] = [];
    const errors: { index: number; name: string; error: string }[] = [];

    for (let i = 0; i < body.npcs.length; i++) {
      const npc = body.npcs[i];
      
      if (!npc.name || typeof npc.name !== 'string') {
        errors.push({ index: i, name: npc.name || 'unknown', error: 'Missing name' });
        continue;
      }

      try {
        const npcId = uuid();
        await this.db.query(
          `INSERT INTO npcs (npc_id, engine_id, name, faction_id, role, personality, ambition, status, alive, portrait_url, webhook_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [
            npcId,
            session.engineId,
            npc.name,
            npc.faction_id || null,
            npc.role || null,
            JSON.stringify(npc.personality || { traits: [], mannerisms: [], voice: '', goals: [] }),
            npc.ambition || null,
            npc.status ?? 0,
            npc.alive !== false,
            npc.portrait_url || null,
            npc.webhook_url || null,
          ],
        );
        imported.push(npc.name);
      } catch (error) {
        errors.push({ index: i, name: npc.name, error: (error as Error).message });
      }
    }

    return {
      success: true,
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors },
    };
  }

  @Post(':id/update')
  async updateNpc(
    @Req() req: Request,
    @Param('id') npcId: string,
    @Body() body: Partial<NpcImportData>,
  ) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (session.role !== 'st' && session.role !== 'owner') {
      throw new HttpException('Only Storytellers can update NPCs', HttpStatus.FORBIDDEN);
    }

    const existing = await this.db.query(
      `SELECT npc_id FROM npcs WHERE npc_id = $1 AND engine_id = $2`,
      [npcId, session.engineId],
    );

    if (existing.rows.length === 0) {
      throw new HttpException('NPC not found', HttpStatus.NOT_FOUND);
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIdx++}`);
      values.push(body.name);
    }
    if (body.role !== undefined) {
      updates.push(`role = $${paramIdx++}`);
      values.push(body.role);
    }
    if (body.personality !== undefined) {
      updates.push(`personality = $${paramIdx++}`);
      values.push(JSON.stringify(body.personality));
    }
    if (body.ambition !== undefined) {
      updates.push(`ambition = $${paramIdx++}`);
      values.push(body.ambition);
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIdx++}`);
      values.push(body.status);
    }
    if (body.alive !== undefined) {
      updates.push(`alive = $${paramIdx++}`);
      values.push(body.alive);
    }
    if (body.portrait_url !== undefined) {
      updates.push(`portrait_url = $${paramIdx++}`);
      values.push(body.portrait_url);
    }
    if (body.webhook_url !== undefined) {
      updates.push(`webhook_url = $${paramIdx++}`);
      values.push(body.webhook_url);
    }

    if (updates.length === 0) {
      throw new HttpException('No fields to update', HttpStatus.BAD_REQUEST);
    }

    values.push(npcId, session.engineId);
    await this.db.query(
      `UPDATE npcs SET ${updates.join(', ')} WHERE npc_id = $${paramIdx++} AND engine_id = $${paramIdx}`,
      values,
    );

    return { success: true };
  }

  @Post(':id/portrait/request-url')
  async requestPortraitUrl(
    @Req() req: Request,
    @Param('id') npcId: string,
    @Body() body: { name: string; size: number; contentType: string },
  ) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (session.role !== 'st' && session.role !== 'owner') {
      throw new HttpException('Only Storytellers can upload NPC portraits', HttpStatus.FORBIDDEN);
    }

    const existing = await this.db.query(
      `SELECT npc_id FROM npcs WHERE npc_id = $1 AND engine_id = $2`,
      [npcId, session.engineId],
    );

    if (existing.rows.length === 0) {
      throw new HttpException('NPC not found', HttpStatus.NOT_FOUND);
    }

    if (!body.contentType?.startsWith('image/')) {
      throw new HttpException('Only image files are allowed', HttpStatus.BAD_REQUEST);
    }

    const maxSize = 5 * 1024 * 1024;
    if (body.size > maxSize) {
      throw new HttpException('File too large. Maximum 5MB allowed.', HttpStatus.BAD_REQUEST);
    }

    try {
      const uploadURL = await this.objectStorage.getObjectEntityUploadURL();
      const objectPath = this.objectStorage.normalizeObjectEntityPath(uploadURL);

      return { uploadURL, objectPath };
    } catch (error) {
      throw new HttpException('Failed to generate upload URL', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/portrait/save')
  async savePortrait(
    @Req() req: Request,
    @Param('id') npcId: string,
    @Body() body: { objectPath: string },
  ) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (session.role !== 'st' && session.role !== 'owner') {
      throw new HttpException('Only Storytellers can update NPC portraits', HttpStatus.FORBIDDEN);
    }

    const existing = await this.db.query(
      `SELECT npc_id FROM npcs WHERE npc_id = $1 AND engine_id = $2`,
      [npcId, session.engineId],
    );

    if (existing.rows.length === 0) {
      throw new HttpException('NPC not found', HttpStatus.NOT_FOUND);
    }

    const normalizedPath = this.objectStorage.normalizeObjectEntityPath(body.objectPath);

    await this.objectStorage.trySetObjectEntityAclPolicy(normalizedPath, {
      owner: session.discordId,
      visibility: 'public',
    });

    await this.db.query(
      `UPDATE npcs SET portrait_url = $1 WHERE npc_id = $2`,
      [normalizedPath, npcId],
    );

    return { success: true, portraitUrl: normalizedPath };
  }

  @Post('template')
  getTemplate() {
    return {
      template: {
        npcs: [
          {
            name: 'Marcus Vane',
            role: 'Primogen',
            faction_id: null,
            personality: {
              traits: ['cunning', 'patient', 'manipulative'],
              mannerisms: ['speaks in riddles', 'never makes direct eye contact'],
              voice: 'Deep, measured tone with a slight Eastern European accent',
              goals: ['Expand influence in the financial district', 'Undermine the Sheriff'],
            },
            ambition: 'Become Prince of the city',
            status: 4,
            alive: true,
            webhook_url: 'https://discord.com/api/webhooks/...',
          },
          {
            name: 'Elena Blackwood',
            role: 'Harpy',
            personality: {
              traits: ['witty', 'observant', 'vindictive'],
              mannerisms: ['always carries a small notebook', 'dramatic pauses'],
              voice: 'Crisp British accent, sardonic undertones',
              goals: ['Collect secrets on every Kindred', 'Host the grandest Elysium'],
            },
            ambition: 'Be the most feared social arbiter in the domain',
            status: 3,
            alive: true,
          },
        ],
      },
      schema: {
        name: 'string (required)',
        role: 'string (optional) - e.g., Primogen, Sheriff, Harpy, Scourge',
        faction_id: 'uuid (optional) - ID of faction if exists',
        personality: {
          traits: 'string[] - personality traits',
          mannerisms: 'string[] - distinctive behaviors',
          voice: 'string - how they speak for AI voicing',
          goals: 'string[] - current objectives',
        },
        ambition: 'string (optional) - long-term goal',
        status: 'number 0-5 (optional) - social status level',
        alive: 'boolean (optional, default true)',
        webhook_url: 'string (optional) - Discord webhook for AI voicing',
      },
    };
  }
}
