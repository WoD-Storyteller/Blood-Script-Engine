import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { ChronicleClocksService } from './chronicle-clocks.service';

@Injectable()
export class ChronicleClockHooksService {
  constructor(
    private readonly clocks: ChronicleClocksService,
  ) {}

  /**
   * SI heat advances purge clock.
   */
  async onSIHeat(
    client: PoolClient,
    engineId: string,
    amount: number,
  ) {
    if (amount > 0) {
      await this.clocks.advance(
        client,
        engineId,
        'si_purge',
        amount >= 2 ? 2 : 1,
      );
    }
  }

  /**
   * Masquerade pressure advances collapse clock.
   */
  async onMasquerade(
    client: PoolClient,
    engineId: string,
    amount: number,
  ) {
    if (amount > 0) {
      await this.clocks.advance(
        client,
        engineId,
        'masquerade_collapse',
        amount >= 2 ? 2 : 1,
      );
    }
  }
}