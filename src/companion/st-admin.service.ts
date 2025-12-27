import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

import { ClocksService } from '../scenes/clocks.service';
import { ArcsService } from '../chronicle/arcs.service';
import { IntentsService } from '../scenes/intents.service';
import { MapsService } from '../engine/maps.service';

import { ArcStatus } from '../chronicle/arcs.enums';

@Injectable()
export class StAdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly clocks: ClocksService,
    private readonly arcs: ArcsService,
    private readonly intents: IntentsService,
    private readonly maps: MapsService,
  ) {}

  // ─────────────────────────────
  // MAPS
  // ─────────────────────────────
  async setMap(client: any, engineId: string, url: string) {
    return this.maps.setEngineMap(client, engineId, url);
  }

  // ─────────────────────────────
  // CLOCKS
  // ─────────────────────────────
  async createClock(client: any, engineId: string, input: any) {
    return this.clocks.create(client, engineId, input);
  }

  async tickClock(
    client: any,
    engineId: string,
    clockIdPrefix: string,
    delta = 1,
  ) {
    return this.clocks.tick(client, engineId, clockIdPrefix, delta);
  }

  // ─────────────────────────────
  // ARCS
  // ─────────────────────────────
  async createArc(client: any, engineId: string, input: any) {
    return this.arcs.create(client, engineId, input);
  }

  async setArcStatus(
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

  // ─────────────────────────────
  // INTENTS
  // ─────────────────────────────
  async listIntents(client: any, engineId: string) {
    return this.intents.list(client, engineId);
  }

  async approveIntent(client: any, engineId: string, intentId: string) {
    return this.intents.approve(client, engineId, intentId);
  }

  async rejectIntent(
    client: any,
    engineId: string,
    intentId: string,
    reason?: string,
  ) {
    return this.intents.reject(client, engineId, intentId, reason);
  }
}