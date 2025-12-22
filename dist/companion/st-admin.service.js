"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StAdminService = void 0;
const common_1 = require("@nestjs/common");
let StAdminService = class StAdminService {
    async setMap(client, engineId, mapUrl) {
        await client.query(`UPDATE engines SET map_url=$2 WHERE engine_id=$1`, [engineId, mapUrl]);
        return { ok: true };
    }
    async approveIntent(client, intentId) {
        await client.query(`UPDATE intents SET status='approved' WHERE intent_id=$1`, [intentId]);
        return { ok: true };
    }
    async rejectIntent(client, intentId, reason) {
        await client.query(`UPDATE intents SET status='rejected', reason=$2 WHERE intent_id=$1`, [intentId, reason ?? null]);
        return { ok: true };
    }
};
exports.StAdminService = StAdminService;
exports.StAdminService = StAdminService = __decorate([
    (0, common_1.Injectable)()
], StAdminService);
//# sourceMappingURL=st-admin.service.js.map