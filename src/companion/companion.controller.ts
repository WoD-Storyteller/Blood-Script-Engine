import { Controller, Get, Headers } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from './auth.service';
import { DashboardService } from './dashboard.service';

@Controller('companion')
export class CompanionController {
  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
  ) {}

  @Get('world')
  async world(@Headers('authorization') authHeader: string) {
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return { error: 'Unauthorized' };

    return this.db.withClient(async (client: any) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) return { error: 'Unauthorized' };

      return this.dashboard.getWorldState(client, session.engine_id);
    });
  }
}