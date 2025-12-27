import { Injectable } from '@nestjs/common';

import { ClocksService } from '../chronicle/clocks.service';
import { MapsService } from '../engine/maps.service';
import { ArcsService } from '../chronicle/arcs.service';
import { ArcStatus } from '../chronicle/arcs.enums';
import { IntentsService } from '../scenes/intents.service';

@Injectable()
export class StAdminService {
  constructor(
    private readonly clocks: ClocksService,
    private readonly maps: MapsService,
    private readonly arcs: ArcsService,
    private readonly intents: IntentsService,
  ) {}

  setMap(client: any, engineId: string, url: string) {
    return this.maps.setMap(client, { engineId, url });
  }

  createClock(client: any, engineId: string, body: any) {
    return this.clocks.create(client, {
      engineId,
      name: body.name,
      segments: body.segments,
      notes: body.notes,
      createdByUserId: body.createdByUserId,
    });
  }

  tickClock(client: any, engineId: string, clockIdPrefix: string, delta = 1) {
    return this.clocks.tickClock(client, {
      engineId,
      clockIdPrefix,
      amount: delta,
    });
  }

  createArc(client: any, engineId: string, body: any) {
    return this.arcs.createArc(client, {
      engineId,
      title: body.title,
      synopsis: body.synopsis,
      createdByUserId: body.createdByUserId,
    });
  }

  setArcStatus(
    client: any,
    engineId: string,
    arcIdPrefix: string,
    status: ArcStatus,
    outcome?: string,
  ) {
    return this.arcs.setStatus(client, {
      engineId,
      arcIdPrefix,
      status,
      outcome,
    });
  }

  listIntents(client: any, engineId: string) {
    return this.intents.list(client, engineId);
  }

  approveIntent(client: any, engineId: string, intentId: string) {
    return this.intents.approve(client, engineId, intentId);
  }

  rejectIntent(client: any, engineId: string, intentId: string, reason?: string) {
    return this.intents.reject(client, engineId, intentId, reason);
  }
}