import { Injectable, Logger } from '@nestjs/common';
import type { Server } from 'socket.io';
import { DatabaseService } from '../database/database.service';
import { DashboardService } from '../companion/dashboard.service';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private io: Server | null = null;

  constructor(
    private readonly db: DatabaseService,
    private readonly dashboard: DashboardService,
  ) {}

  setServer(io: Server) {
    this.io = io;
    this.logger.log('RealtimeService attached.');
  }

  engineRoom(engineId: string) {
    return `engine:${engineId}`;
  }

  async publishWorld(engineId: string) {
    if (!this.io) return;

    const world = await this.db.withClient((client) =>
      this.dashboard.getWorldState(client, engineId),
    );

    this.io.to(this.engineRoom(engineId)).emit('world', {
      engineId,
      world,
      at: new Date().toISOString(),
    });
  }
}