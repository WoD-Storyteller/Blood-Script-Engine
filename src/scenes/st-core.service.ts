import { Injectable } from '@nestjs/common';
import { ClocksService } from '../chronicle/clocks.service';
import { ArcsService } from '../chronicle/arcs.service';

@Injectable()
export class StCoreService {
  constructor(
    private readonly clocks: ClocksService,
    private readonly arcs: ArcsService,
  ) {}

  createClock(client: any, engineId: string, input: any) {
    return this.clocks.create(client, {
      engineId,
      clockIdPrefix: input.clockIdPrefix,
      amount: input.amount,
      reason: input.reason,
    });
  }

  tickClock(
    client: any,
    engineId: string,
    clockId: string,
    delta = 1,
  ) {
    return this.clocks.tick(client, {
      engineId,
      clockIdPrefix: clockId,
      amount: delta,
    });
  }

  createArc(client: any, engineId: string, input: any) {
    return this.arcs.create(client, {
      engineId,
      ...input,
    });
  }

  setArcStatus(
    client: any,
    engineId: string,
    arcId: string,
    status: any,
    outcome?: string,
  ) {
    return this.arcs.setStatus(client, {
      engineId,
      arcIdPrefix: arcId,
      status,
      outcome,
    });
  }
}