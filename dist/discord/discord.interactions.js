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
var DiscordInteractions_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordInteractions = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const rolls_handler_1 = require("./rolls.handler");
const engine_guard_1 = require("../engine/engine.guard");
let DiscordInteractions = DiscordInteractions_1 = class DiscordInteractions {
    constructor(db, rolls) {
        this.db = db;
        this.rolls = rolls;
        this.logger = new common_1.Logger(DiscordInteractions_1.name);
    }
    async handle(interaction) {
        if (!interaction.isChatInputCommand())
            return;
        await this.db.withClient(async (client) => {
            const s = await client.query(`
        SELECT *
        FROM sessions
        WHERE discord_user_id=$1
        ORDER BY created_at DESC
        LIMIT 1
        `, [interaction.user.id]);
            if (!s.rowCount) {
                try {
                    await interaction.reply({
                        content: 'You are not logged in. Please sign in via the companion app.',
                        ephemeral: true,
                    });
                }
                catch { }
                return;
            }
            const session = s.rows[0];
            const engineRes = await client.query(`
        SELECT engine_id, banned
        FROM engines
        WHERE engine_id=$1
        `, [session.engine_id]);
            if (!engineRes.rowCount) {
                try {
                    await interaction.reply({
                        content: 'Engine not found for your session.',
                        ephemeral: true,
                    });
                }
                catch { }
                return;
            }
            const engine = engineRes.rows[0];
            try {
                (0, engine_guard_1.enforceEngineAccess)(engine, session, 'normal');
            }
            catch {
                try {
                    await interaction.reply({
                        content: 'This server has been banned. Only the appeal form is available.',
                        ephemeral: true,
                    });
                }
                catch { }
                return;
            }
            try {
                switch (interaction.commandName) {
                    case 'roll':
                        await this.rolls.handle(interaction);
                        return;
                    default:
                        await interaction.reply({
                            content: 'Unknown command.',
                            ephemeral: true,
                        });
                        return;
                }
            }
            catch (err) {
                this.logger.error(`Error handling interaction ${interaction.commandName}`, err);
                try {
                    if (!interaction.replied) {
                        await interaction.reply({
                            content: 'An error occurred while processing the command.',
                            ephemeral: true,
                        });
                    }
                }
                catch { }
            }
        });
    }
};
exports.DiscordInteractions = DiscordInteractions;
exports.DiscordInteractions = DiscordInteractions = DiscordInteractions_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        rolls_handler_1.RollsHandler])
], DiscordInteractions);
//# sourceMappingURL=discord.interactions.js.map