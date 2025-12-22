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
var OwnerDmService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnerDmService = void 0;
const common_1 = require("@nestjs/common");
const discord_js_1 = require("discord.js");
let OwnerDmService = OwnerDmService_1 = class OwnerDmService {
    constructor(discord) {
        this.discord = discord;
        this.logger = new common_1.Logger(OwnerDmService_1.name);
    }
    async getOwner() {
        const ownerId = process.env.BOT_OWNER_DISCORD_ID;
        if (!ownerId)
            return null;
        try {
            return await this.discord.users.fetch(ownerId);
        }
        catch (e) {
            this.logger.error('Failed to fetch owner user', e);
            return null;
        }
    }
    async send(message) {
        const owner = await this.getOwner();
        if (!owner)
            return;
        try {
            await owner.send(message);
        }
        catch (e) {
            this.logger.warn('Owner DM failed (DMs closed?)');
        }
    }
};
exports.OwnerDmService = OwnerDmService;
exports.OwnerDmService = OwnerDmService = OwnerDmService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [discord_js_1.Client])
], OwnerDmService);
//# sourceMappingURL=owner-dm.service.js.map