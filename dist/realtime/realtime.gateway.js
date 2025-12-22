"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const dashboard_service_1 = require("../companion/dashboard.service");
const realtime_service_1 = require("./realtime.service");
function parseCookie(header) {
    const out = {};
    if (!header)
        return out;
    const parts = header.split(';');
    for (const p of parts) {
        const i = p.indexOf('=');
        if (i === -1)
            continue;
        const k = p.slice(0, i).trim();
        const v = p.slice(i + 1).trim();
        if (k)
            out[k] = decodeURIComponent(v);
    }
    return out;
}
let RealtimeGateway = class RealtimeGateway {
    constructor(db, auth, dashboard, realtime) {
        this.db = db;
        this.auth = auth;
        this.dashboard = dashboard;
        this.realtime = realtime;
    }
    afterInit() {
        this.realtime.setServer(this.server);
    }
    async handleConnection(socket) {
        const cookieHeader = socket.handshake.headers?.cookie;
        const cookies = parseCookie(cookieHeader);
        const token = cookies['bse_token'];
        if (!token) {
            socket.emit('error', { error: 'Unauthorized' });
            socket.disconnect(true);
            return;
        }
        const session = await this.db.withClient(async (client) => {
            return this.auth.validateToken(client, token);
        });
        if (!session) {
            socket.emit('error', { error: 'Unauthorized' });
            socket.disconnect(true);
            return;
        }
        const engineId = session.engine_id;
        socket.join(this.realtime.engineRoom(engineId));
        const world = await this.db.withClient(async (client) => {
            return this.dashboard.getWorldState(client, engineId);
        });
        socket.emit('world', {
            engineId,
            world,
            at: new Date().toISOString(),
            initial: true,
        });
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", Function)
], RealtimeGateway.prototype, "server", void 0);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: '/realtime',
        cors: {
            origin: process.env.COMPANION_APP_URL || 'http://localhost:5173',
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService,
        dashboard_service_1.DashboardService,
        realtime_service_1.RealtimeService])
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map