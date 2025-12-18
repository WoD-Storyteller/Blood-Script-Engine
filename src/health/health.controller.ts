import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller()
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Liveness: app is running (no dependencies checked)
   */
  @Get('live')
  live() {
    return {
      status: 'ok',
      service: 'blood-script-engine',
      time: new Date().toISOString(),
    };
  }

  /**
   * Basic health: app is running, minimal info
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'blood-script-engine',
      time: new Date().toISOString(),
    };
  }

  /**
   * Readiness: verifies DB connectivity.
   * Use this for load balancers / orchestration readiness probes.
   */
  @Get('ready')
  async ready() {
    try {
      const ok = await this.db.withClient(async (client: any) => {
        const res = await client.query('SELECT 1 AS ok');
        return res?.rows?.[0]?.ok === 1;
      });

      if (!ok) {
        return {
          status: 'error',
          ready: false,
          reason: 'DB query failed',
          time: new Date().toISOString(),
        };
      }

      return {
        status: 'ok',
        ready: true,
        db: 'ok',
        time: new Date().toISOString(),
      };
    } catch (e: any) {
      return {
        status: 'error',
        ready: false,
        db: 'error',
        reason: e?.message ?? 'Unknown error',
        time: new Date().toISOString(),
      };
    }
  }
}