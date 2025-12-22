"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDiscordClient = createDiscordClient;
const discord_js_1 = require("discord.js");
function createDiscordClient() {
    return new discord_js_1.Client({
        intents: [
            discord_js_1.GatewayIntentBits.Guilds,
            discord_js_1.GatewayIntentBits.GuildMessages,
            discord_js_1.GatewayIntentBits.DirectMessages,
            discord_js_1.GatewayIntentBits.MessageContent,
        ],
        partials: [discord_js_1.Partials.Channel],
    });
}
//# sourceMappingURL=client.js.map