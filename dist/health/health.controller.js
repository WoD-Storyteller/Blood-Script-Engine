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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let HealthController = class HealthController {
    constructor(db) {
        this.db = db;
    }
    live() {
        return {
            status: 'ok',
            service: 'blood-script-engine',
            time: new Date().toISOString(),
        };
    }
    health() {
        return {
            status: 'ok',
            service: 'blood-script-engine',
            time: new Date().toISOString(),
        };
    }
    async ready() {
        try {
            const ok = await this.db.withClient(async (client) => {
                const res = await client.query('SELECT 1 AS ok');
                return res?.rows?.[0]?.ok === 1;
            });
            if (!ok) {
                return {
                    status: 'error',
                    ready: false,
                    reason: 'DB query failed',
                    time: new Date().toISOString(),
                };
            }
            return {
                status: 'ok',
                ready: true,
                db: 'ok',
                time: new Date().toISOString(),
            };
        }
        catch (e) {
            return {
                status: 'error',
                ready: false,
                db: 'error',
                reason: e?.message ?? 'Unknown error',
                time: new Date().toISOString(),
            };
        }
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('live'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "ready", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], HealthController);
//# sourceMappingURL=health.controller.js.map