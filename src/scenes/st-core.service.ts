import { Injectable } from '@nestjs/common';
import { ClocksService } from '../chronicle/clocks.service';
import { ArcsService } from '../chronicle/arcs.service';
import { IntentsService } from '../scenes/intents.service';

@Injectable()
export class StAdminService {
  constructor(
    private readonly clocks: ClocksService,
    private readonly arcs: ArcsService,
    private readonly intents: IntentsService,
  ) {}

  async createClock(client: any, engineId: string, input: any) {
    return this.clocks.create(client, engineId, input);
  }

  async tickClock(
    client: any,
    engineId: string,
    clockId: string,
    delta: number,
  ) {
    return this.clocks.tick(client, engineId, clockId, delta);
  }

  async createArc(client: any, engineId: string, input: any) {
    return this.arcs.create(client, engineId, input);
  }

  async setArcStatus(
    client: any,
    engineId: string,
    arcId: string,
    status: string,
  ) {
    return this.arcs.setStatus(client, engineId, arcId, status);
  }

  async listIntents(client: any, engineId: string) {
    return this.intents.list(client, engineId);
  }
}