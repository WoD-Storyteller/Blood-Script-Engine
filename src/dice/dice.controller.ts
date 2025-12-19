import { Controller, Post, Body, Req, Headers } from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { DiceService } from './dice.service';

@Controller('companion/dice')
export class DiceController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dice: DiceService,
  ) {}

  private token(req: Request, auth?: string) {
    return req.cookies?.bse_token ?? auth?.replace('Bearer ', '');
  }

  @Post('roll')
  async roll(
    @Req() req: Request,
    @Headers('authorization') auth: string,
    @Body() body: {
      pool: number;
      hunger?: number;
      label?: string;
    },
  ) {
    const token = this.token(req, auth);
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      // Fetch active character hunger if not provided
      let hunger = body.hunger ?? 0;

      if (body.hunger == null) {
        const r = await client.query(
          `
          SELECT sheet->>'hunger' AS hunger
          FROM characters
          WHERE engine_id = $1
            AND owner_user_id = $2
            AND is_active = true
          LIMIT 1
          `,
          [session.engine_id, session.user_id],
        );

        hunger = r.rowCount ? Number(r.rows[0].hunger ?? 0) : 0;
      }

      const result = this.dice.rollV5(
        Math.max(0, body.pool),
        Math.max(0, hunger),
      );

      return {
        label: body.label ?? 'Roll',
        result,
      };
    });
  }
}