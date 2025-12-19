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

function parseCookie(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  const parts = header.split(';');
  for (const p of parts) {
    const i = p.indexOf('=');
    if (i === -1) continue;
    const k = p.slice(0, i).trim();
    const v = p.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: process.env.COMPANION_APP_URL || 'http://localhost:5173',
    credentials: true,
  },
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
    const cookieHeader = socket.handshake.headers?.cookie as string | undefined;
    const cookies = parseCookie(cookieHeader);
    const token = cookies['bse_token'];

    if (!token) {
      socket.emit('error', { error: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }

    const session = await this.db.withClient(async (client: any) => {
      return this.auth.validateToken(client, token);
    });

    if (!session) {
      socket.emit('error', { error: 'Unauthorized' });
      socket.disconnect(true);
      return;
    }

    const engineId = session.engine_id as string;
    socket.join(this.realtime.engineRoom(engineId));

    // Send initial world state for convenience
    const world = await this.db.withClient(async (client: any) => {
      return this.dashboard.getWorldState(client, engineId);
    });

    socket.emit('world', {
      engineId,
      world,
      at: new Date().toISOString(),
      initial: true,
    });
  }
}