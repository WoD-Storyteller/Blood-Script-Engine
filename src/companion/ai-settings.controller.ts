import { Controller, Post, Get, Body, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../database/database.service';

@Controller('companion/ai')
export class AiSettingsController {
  constructor(private readonly db: DatabaseService) {}

  @Get('settings')
  async getSettings(@Req() req: Request) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const result = await this.db.query(
      `SELECT config FROM engines WHERE engine_id = $1`,
      [session.engineId],
    );

    if (result.rows.length === 0) {
      throw new HttpException('Engine not found', HttpStatus.NOT_FOUND);
    }

    const config = result.rows[0].config || {};

    return {
      ai_enabled: config.ai_enabled ?? false,
      ai_narration: config.ai_narration ?? false,
      ai_npc_voicing: config.ai_npc_voicing ?? false,
      ai_tone: config.ai_tone ?? 'gothic_horror',
    };
  }

  @Post('settings')
  async updateSettings(
    @Req() req: Request,
    @Body() body: {
      ai_enabled?: boolean;
      ai_narration?: boolean;
      ai_npc_voicing?: boolean;
      ai_tone?: string;
    },
  ) {
    const session = (req as any).session;
    if (!session?.engineId) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    if (session.role !== 'st' && session.role !== 'owner') {
      throw new HttpException('Only Storytellers can update AI settings', HttpStatus.FORBIDDEN);
    }

    const current = await this.db.query(
      `SELECT config FROM engines WHERE engine_id = $1`,
      [session.engineId],
    );

    if (current.rows.length === 0) {
      throw new HttpException('Engine not found', HttpStatus.NOT_FOUND);
    }

    const config = current.rows[0].config || {};

    if (body.ai_enabled !== undefined) config.ai_enabled = body.ai_enabled;
    if (body.ai_narration !== undefined) config.ai_narration = body.ai_narration;
    if (body.ai_npc_voicing !== undefined) config.ai_npc_voicing = body.ai_npc_voicing;
    if (body.ai_tone !== undefined) config.ai_tone = body.ai_tone;

    await this.db.query(
      `UPDATE engines SET config = $1 WHERE engine_id = $2`,
      [JSON.stringify(config), session.engineId],
    );

    return { success: true, config };
  }
}
