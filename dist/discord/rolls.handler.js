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
exports.RollsHandler = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const engine_guard_1 = require("../engine/engine.guard");
const dice_service_1 = require("../dice/dice.service");
function d10() {
    return 1 + Math.floor(Math.random() * 10);
}
let RollsHandler = class RollsHandler {
    constructor(db, dice) {
        this.db = db;
        this.dice = dice;
    }
    async handle(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        if (interaction.commandName !== 'roll')
            return;
        await this.db.withClient(async (client) => {
            const s = await client.query(`SELECT * FROM sessions WHERE discord_user_id=$1 ORDER BY created_at DESC LIMIT 1`, [interaction.user.id]);
            if (!s.rowCount) {
                await interaction.reply({ content: 'No session found. Please login via the companion app first.', ephemeral: true });
                return;
            }
            const session = s.rows[0];
            const engineRes = await client.query(`SELECT banned FROM engines WHERE engine_id=$1`, [session.engine_id]);
            if (!engineRes.rowCount) {
                await interaction.reply({ content: 'Engine not found for your session.', ephemeral: true });
                return;
            }
            (0, engine_guard_1.enforceEngineAccess)(engineRes.rows[0], session, 'normal');
            const poolOpt = interaction.options.getInteger('pool');
            const attribute = interaction.options.getString('attribute');
            const skill = interaction.options.getString('skill');
            const rouse = interaction.options.getBoolean('rouse') ?? false;
            const feed = interaction.options.getBoolean('feed') ?? false;
            const label = interaction.options.getString('label') ?? undefined;
            const c = await client.query(`
        SELECT character_id, name, sheet, COALESCE((sheet->>'hunger')::int, 0) AS hunger
        FROM characters
        WHERE engine_id=$1 AND owner_user_id=$2 AND is_active=true
        LIMIT 1
        `, [session.engine_id, session.user_id]);
            const charName = c.rowCount ? (c.rows[0].name ?? 'Your character') : 'Your character';
            const hunger = c.rowCount ? Number(c.rows[0].hunger ?? 0) : 0;
            if (rouse) {
                const roll = d10();
                const success = roll >= 6;
                const msg = `**Rouse Check** (${charName})\n` +
                    `Roll: **${roll}** → ${success ? '✅ Success (no hunger gain)' : '❌ Fail (hunger +1)'}`;
                await interaction.reply(msg);
                return;
            }
            if (feed) {
                const roll = d10();
                const success = roll >= 6;
                const msg = `**Feeding Check** (${charName})\n` +
                    `Roll: **${roll}** → ${success ? '✅ Success (feeding goes smoothly)' : '❌ Complication (messy feed / risk)'}`;
                await interaction.reply(msg);
                return;
            }
            const pool = poolOpt ??
                (attribute && skill ? 0 : 0);
            const result = this.dice.rollV5(Math.max(0, pool), Math.max(0, hunger));
            const lines = [];
            lines.push(`🎲 **${label ?? 'Roll'}** — ${charName}`);
            lines.push(`Pool: **${result.pool}**  Hunger: **${result.hunger}**`);
            lines.push(`Successes: **${result.successes}**`);
            if (result.critical)
                lines.push('🔥 **Critical!**');
            if (result.messyCritical)
                lines.push('🩸 **Messy Critical!**');
            if (result.bestialFailure)
                lines.push('👹 **Bestial Failure!**');
            await interaction.reply(lines.join('\n'));
        });
    }
};
exports.RollsHandler = RollsHandler;
exports.RollsHandler = RollsHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        dice_service_1.DiceService])
], RollsHandler);
//# sourceMappingURL=rolls.handler.js.map