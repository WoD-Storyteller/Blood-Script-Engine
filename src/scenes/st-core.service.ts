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
    return this.clocks.createClock(client, {
      engineId,
      ...input,
    });
  }

  tickClock(client: any, engineId: string, clockId: string, delta = 1) {
    return this.clocks.tickClock(client, {
      engineId,
      clockId,
      delta,
    });
  }

  createArc(client: any, engineId: string, input: any) {
    return this.arcs.createArc(client, {
      engineId,
      ...input,
    });
  }

  setArcStatus(client: any, engineId: string, arcIdPrefix: string, status: any) {
    return this.arcs.setStatus(client, {
      engineId,
      arcIdPrefix,
      status,
    });
  }
}