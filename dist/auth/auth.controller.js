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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const express_1 = require("express");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    redirectToDiscord(res) {
        return res.redirect(this.authService.getDiscordAuthUrl());
    }
    async discordCallback(req, res) {
        const session = await this.authService.handleDiscordCallback(req.query);
        return res.json(session);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('discord'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_a = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _a : Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "redirectToDiscord", null);
__decorate([
    (0, common_1.Get)('discord/callback'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [typeof (_b = typeof express_1.Request !== "undefined" && express_1.Request) === "function" ? _b : Object, typeof (_c = typeof express_1.Response !== "undefined" && express_1.Response) === "function" ? _c : Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "discordCallback", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map