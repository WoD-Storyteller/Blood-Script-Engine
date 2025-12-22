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
var DiscordService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordService = void 0;
const common_1 = require("@nestjs/common");
const discord_js_1 = require("discord.js");
const client_1 = require("./client");
const guild_join_handler_1 = require("./handlers/guild-join.handler");
const message_handler_1 = require("./handlers/message.handler");
const dm_handler_1 = require("./handlers/dm.handler");
const scenes_service_1 = require("../scenes/scenes.service");
const database_service_1 = require("../database/database.service");
let DiscordService = DiscordService_1 = class DiscordService {
    constructor(scenes, db) {
        this.scenes = scenes;
        this.db = db;
        this.logger = new common_1.Logger(DiscordService_1.name);
    }
    async start() {
        if (!process.env.DISCORD_BOT_TOKEN) {
            throw new Error('DISCORD_BOT_TOKEN not set');
        }
        this.client = (0, client_1.createDiscordClient)();
        this.client.once(discord_js_1.Events.ClientReady, () => {
            this.logger.log(`Discord bot logged in as ${this.client.user?.tag}`);
        });
        this.client.on(discord_js_1.Events.GuildCreate, (guild) => (0, guild_join_handler_1.handleGuildJoin)(guild, this.db));
        this.client.on(discord_js_1.Events.MessageCreate, async (message) => {
            if (message.author.bot)
                return;
            if (message.guild) {
                await (0, message_handler_1.handleMessage)(message, this.scenes, this.db);
            }
            else {
                await (0, dm_handler_1.handleDM)(message, this.db);
            }
        });
        await this.client.login(process.env.DISCORD_BOT_TOKEN);
    }
};
exports.DiscordService = DiscordService;
exports.DiscordService = DiscordService = DiscordService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [scenes_service_1.ScenesService,
        database_service_1.DatabaseService])
], DiscordService);
//# sourceMappingURL=discord.service.js.map