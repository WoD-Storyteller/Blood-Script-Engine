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
var ChronicleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChronicleService = void 0;
const common_1 = require("@nestjs/common");
const arcs_service_1 = require("./arcs.service");
const clocks_service_1 = require("./clocks.service");
let ChronicleService = ChronicleService_1 = class ChronicleService {
    constructor(arcs, clocks) {
        this.arcs = arcs;
        this.clocks = clocks;
        this.logger = new common_1.Logger(ChronicleService_1.name);
    }
    async nightly(client, engineId) {
        const completedClocks = [];
        const arcNotices = [];
        try {
            const ticked = await this.clocks.tickNightlyClocks(client, { engineId });
            for (const c of ticked.completed) {
                completedClocks.push(`${c.title} (${String(c.clockId).slice(0, 8)})`);
                const links = await this.clocks.listClockLinksForCompleted(client, { engineId, clockId: c.clockId });
                for (const l of links) {
                    arcNotices.push(`Clock completion affected arc **${l.arcTitle}** (onComplete: ${l.onComplete}).`);
                }
            }
        }
        catch (e) {
            this.logger.debug(`nightly fallback: ${e.message}`);
        }
        return { completedClocks, arcNotices };
    }
};
exports.ChronicleService = ChronicleService;
exports.ChronicleService = ChronicleService = ChronicleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [arcs_service_1.ArcsService,
        clocks_service_1.ClocksService])
], ChronicleService);
//# sourceMappingURL=chronicle.service.js.map