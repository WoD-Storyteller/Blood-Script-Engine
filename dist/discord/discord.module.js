"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordModule = void 0;
const common_1 = require("@nestjs/common");
const discord_js_1 = require("discord.js");
const owner_dm_service_1 = require("./owner-dm.service");
const discord_dm_service_1 = require("./discord.dm.service");
let DiscordModule = class DiscordModule {
};
exports.DiscordModule = DiscordModule;
exports.DiscordModule = DiscordModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: discord_js_1.Client,
                useFactory: async () => {
                    const client = new discord_js_1.Client({
                        intents: [
                            discord_js_1.GatewayIntentBits.Guilds,
                            discord_js_1.GatewayIntentBits.GuildMessages,
                            discord_js_1.GatewayIntentBits.DirectMessages,
                            discord_js_1.GatewayIntentBits.MessageContent,
                        ],
                        partials: [discord_js_1.Partials.Channel],
                    });
                    await client.login(process.env.DISCORD_BOT_TOKEN);
                    return client;
                },
            },
            owner_dm_service_1.OwnerDmService,
            discord_dm_service_1.DiscordDmService,
        ],
        exports: [discord_js_1.Client, owner_dm_service_1.OwnerDmService, discord_dm_service_1.DiscordDmService],
    })
], DiscordModule);
//# sourceMappingURL=discord.module.js.map