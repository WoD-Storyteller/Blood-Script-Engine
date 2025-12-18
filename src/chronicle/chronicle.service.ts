import { Injectable, Logger } from '@nestjs/common';
import { ArcsService } from './arcs.service';
import { ClocksService } from './clocks.service';

@Injectable()
export class ChronicleService {
  private readonly logger = new Logger(ChronicleService.name);

  constructor(
    private readonly arcs: ArcsService,
    private readonly clocks: ClocksService,
  ) {}

  /**
   * Runs during NightCycle (H5). This does not post messages; it only updates state.
   * You can optionally surface completions in Discord later (H9/H10 UI layer).
   */
  async nightly(client: any, engineId: string): Promise<{ completedClocks: string[]; arcNotices: string[] }> {
    const completedClocks: string[] = [];
    const arcNotices: string[] = [];

    try {
      const ticked = await this.clocks.tickNightlyClocks(client, { engineId });
      for (const c of ticked.completed) {
        completedClocks.push(`${c.title} (${String(c.clockId).slice(0, 8)})`);

        const links = await this.clocks.listClockLinksForCompleted(client, { engineId, clockId: c.clockId });
        for (const l of links) {
          arcNotices.push(`Clock completion affected arc **${l.arcTitle}** (onComplete: ${l.onComplete}).`);
        }
      }
    } catch (e: any) {
      this.logger.debug(`nightly fallback: ${e.message}`);
    }

    return { completedClocks, arcNotices };
  }
}