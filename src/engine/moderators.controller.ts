import { Controller, Post, Body, Req } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { withTransaction } from '../database/transactions';
import { ModeratorsService } from './moderators.service';

@Controller('engine/moderators')
export class ModeratorsController {
  constructor(
    private readonly db: DatabaseService,
    private readonly mods: ModeratorsService,
  ) {}

  @Post('add')
  async add(@Req() req: any, @Body() body: { userId: string }) {
    const session = req.session;

    return withTransaction(this.db, async (client) => {
      await this.mods.add(client, {
        engineId: session.engine_id,
        userId: body.userId,
        addedBy: session.user_id,
      });

      return { ok: true };
    });
  }
}