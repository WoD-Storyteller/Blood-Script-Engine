import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  engineRoom(engineId: string) {
    return `engine:${engineId}`;
  }

  emitToEngine(engineId: string, event: string, payload: any) {
    if (!this.server) return;
    this.server.to(this.engineRoom(engineId)).emit(event, payload);
  }
}