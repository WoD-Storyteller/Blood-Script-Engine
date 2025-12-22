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
exports.DiscordDmService = void 0;
const common_1 = require("@nestjs/common");
const discord_js_1 = require("discord.js");
let DiscordDmService = class DiscordDmService {
    constructor(client) {
        this.client = client;
    }
    async sendXpAppliedDm(input) {
        try {
            const user = await this.client.users.fetch(input.discordUserId);
            if (!user)
                return;
            const lines = [
                `🩸 **XP Applied**`,
                ``,
                `**Character:** ${input.characterName}`,
                `**Upgrade:** ${input.upgrade}`,
                `**XP Cost:** ${input.cost}`,
            ];
            if (input.engineName) {
                lines.push(`**Chronicle:** ${input.engineName}`);
            }
            lines.push('', '_This was approved by the Storyteller._');
            await user.send(lines.join('\n'));
        }
        catch {
        }
    }
};
exports.DiscordDmService = DiscordDmService;
exports.DiscordDmService = DiscordDmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [discord_js_1.Client])
], DiscordDmService);
//# sourceMappingURL=discord.dm.service.js.map