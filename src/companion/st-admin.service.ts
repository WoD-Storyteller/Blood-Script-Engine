import { Injectable } from '@nestjs/common';
import { ArcsService } from '../chronicle/arcs.service';
import { ArcStatus } from '../chronicle/arcs.types';

@Injectable()
export class StAdminService {
  constructor(private readonly arcs: ArcsService) {}

  async setArcStatus(
    client: any,
    engineId: string,
    arcId: string,
    status: ArcStatus,
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