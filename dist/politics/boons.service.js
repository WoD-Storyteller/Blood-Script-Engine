"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoonsService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("../common/utils/uuid");
let BoonsService = class BoonsService {
    async giveBoon(client, input) {
        await client.query(`
      INSERT INTO boons
        (boon_id, engine_id, from_user_id, to_user_id, level, title, details, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'active')
      `, [
            (0, uuid_1.uuid)(),
            input.engineId,
            input.fromUserId,
            input.toUserId,
            input.level,
            input.title,
            input.details ?? null,
        ]);
        return { message: `🩸 Boon granted: **${input.title}** (${input.level})` };
    }
    async listBoons(client, input) {
        const where = input.mode === 'owed_to_me'
            ? 'to_user_id = $2'
            : 'from_user_id = $2';
        const res = await client.query(`
      SELECT boon_id, title, level, status
      FROM boons
      WHERE engine_id = $1 AND ${where}
      ORDER BY created_at DESC
      `, [input.engineId, input.userId]);
        if (!res.rowCount)
            return { message: 'No boons found.' };
        return {
            message: res.rows
                .map((b) => `• \`${String(b.boon_id).slice(0, 6)}\` **${b.title}** (${b.level}) — ${b.status}`)
                .join('\n'),
        };
    }
    async setBoonStatus(client, input) {
        const res = await client.query(`
      UPDATE boons
      SET status = $3, updated_at = now()
      WHERE engine_id = $1 AND CAST(boon_id AS TEXT) LIKE $2
      RETURNING title
      `, [input.engineId, `${input.boonIdPrefix}%`, input.status]);
        if (!res.rowCount) {
            return { message: 'Boon not found.' };
        }
        return {
            message: `🩸 Boon **${res.rows[0].title}** marked as **${input.status}**`,
        };
    }
};
exports.BoonsService = BoonsService;
exports.BoonsService = BoonsService = __decorate([
    (0, common_1.Injectable)()
], BoonsService);
//# sourceMappingURL=boons.service.js.map