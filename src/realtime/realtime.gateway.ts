import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { DatabaseService } from '../database/database.service';
import { CompanionAuthService } from '../companion/auth.service';
import { DashboardService } from '../companion/dashboard.service';
import { RealtimeService } from './realtime.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly db: DatabaseService,
    private readonly auth: CompanionAuthService,
    private readonly dashboard: DashboardService,
    private readonly realtime: RealtimeService,
  ) {}

  afterInit() {
    this.realtime.setServer(this.server);
  }

  async handleConnection(socket: Socket) {
    const token =
      (socket.handshake.auth as any)?.token ??
      socket.handshake.query?.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    const session = await this.db.withClient((client) =>
      this.auth.validateToken(client, token),
    );

    if (!session) {
      socket.disconnect();
      return;
    }

    socket.join(this.realtime.engineRoom(session.engine_id));

    const world = await this.db.withClient((client) =>
      this.dashboard.getWorldState(client, session.engine_id),
    );

    socket.emit('world', {
      engineId: session.engine_id,
      world,
      initial: true,
      at: new Date().toISOString(),
    });
  }
}