import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NightCycleService } from '../politics/night-cycle.service';
import { EngineBootstrapService } from './engine-bootstrap.service';

@Injectable()
export class JobsService implements OnModuleInit {
  private readonly logger = new Logger(JobsService.name);
  private readonly intervalMs = 5 * 60 * 1000;

  constructor(
    private readonly db: DatabaseService,
    private readonly nightCycle: NightCycleService,
    private readonly bootstrap: EngineBootstrapService,
  ) {}

  onModuleInit() {
    this.logger.log('JobsService started. Engine bootstrap + nightly loop active.');
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
          const engineId = row.engine_id;

          try {
            // 1️⃣ Ensure engine baseline exists
            await this.bootstrap.bootstrapEngine(client, engineId);

            // 2️⃣ Run nightly if needed
            const result = await this.nightCycle.maybeRunNightly(client, engineId);

            if (result.ran) {
              this.logger.log(`Night cycle executed for engine ${engineId}`);
            }
          } catch (engineErr: any) {
            this.logger.error(
              `Engine loop failed for ${engineId}: ${engineErr.message}`,
            );
          }
        }
      });
    } catch (e: any) {
      this.logger.error(`JobsService tick failed: ${e.message}`);
    }
  }
}