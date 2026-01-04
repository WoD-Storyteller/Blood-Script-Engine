import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { CompanionAuthService } from '../companion/auth.service';
import { DatabaseService } from '../database/database.service';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit(server: Server) {
    this.realtime.setServer(server);
  }

  async handleConnection(socket: Socket) {
    const token =
      socket.handshake.auth?.token ??
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      socket.disconnect();
      return;
    }

    await this.db.withClient(async (client) => {
      const session = await this.auth.validateToken(client, token);
      if (!session) {
        socket.disconnect();
        return;
      }

      socket.join(`engine:${session.engine_id}`);
      socket.data.session = session;
    });
  }

  handleDisconnect(_socket: Socket) {}
}