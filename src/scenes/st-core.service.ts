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
      name: input.name,
      segments: input.segments,
      notes: input.notes,
      createdByUserId: input.createdByUserId,
    });
  }

  tickClock(
    client: any,
    engineId: string,
    clockIdPrefix: string,
    delta = 1,
  ) {
    return this.clocks.tickClock(client, {
      engineId,
      clockIdPrefix,
      amount: delta,
    });
  }

  createArc(client: any, engineId: string, input: any) {
    return this.arcs.createArc(client, {
      engineId,
      title: input.title,
      synopsis: input.synopsis,
      createdByUserId: input.createdByUserId,
    });
  }
}