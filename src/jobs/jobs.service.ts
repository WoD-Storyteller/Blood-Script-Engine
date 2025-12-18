import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NightCycleService } from '../politics/night-cycle.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private readonly intervalMs = 5 * 60 * 1000; // every 5 minutes

  constructor(
    private readonly db: DatabaseService,
    private readonly nightCycle: NightCycleService,
  ) {}

  onModuleInit() {
    this.logger.log('JobsService started. Nightly engine loop active.');
    setInterval(() => this.tick(), this.intervalMs);
  }

  private async tick() {
    try {
      await this.db.withClient(async (client: any) => {
        const engines = await client.query(
          `
          SELECT engine_id
          FROM engines
          `,
        );

        for (const row of engines.rows) {
          try {
            const result = await this.nightCycle.maybeRunNightly(
              client,
              row.engine_id,
            );

            if (result.ran) {
              this.logger.log(
                `Night cycle executed for engine ${row.engine_id}`,
              );
            }
          } catch (engineErr: any) {
            this.logger.error(
              `Night cycle failed for engine ${row.engine_id}: ${engineErr.message}`,
            );
          }
        }
      });
    } catch (e: any) {
      this.logger.error(`JobsService tick failed: ${e.message}`);
    }
  }
}