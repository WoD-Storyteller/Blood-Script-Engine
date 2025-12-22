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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscordOauthController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const auth_service_1 = require("../companion/auth.service");
const uuid_1 = require("../common/utils/uuid");
let DiscordOauthController = class DiscordOauthController {
    constructor(db, companionAuth) {
        this.db = db;
        this.companionAuth = companionAuth;
    }
    async login(res, engineId) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
        const appUrl = process.env.COMPANION_APP_URL;
        if (!clientId || !redirectUri || !appUrl) {
            return res.status(500).send('Missing OAuth env config.');
        }
        if (!engineId)
            return res.status(400).send('Missing engineId.');
        const state = (0, uuid_1.uuid)();
        await this.db.withClient(async (client) => {
            await client.query(`
        INSERT INTO oauth_states (state_id, state, engine_id, created_at)
        VALUES ($1, $2, $3, now())
        `, [(0, uuid_1.uuid)(), state, engineId]);
        });
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'identify',
            state,
            prompt: 'consent',
        });
        return res.redirect(`https://discord.com/api/oauth2/authorize?${params.toString()}`);
    }
    async callback(res, code, state) {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI;
        const appUrl = process.env.COMPANION_APP_URL;
        if (!clientId || !clientSecret || !redirectUri || !appUrl) {
            return res.status(500).send('Missing OAuth env config.');
        }
        if (!code || !state)
            return res.status(400).send('Missing code/state.');
        const engineId = await this.consumeOauthState(state);
        if (!engineId)
            return res.status(400).send('Invalid/expired OAuth state.');
        const token = await this.exchangeCodeForToken({ code, clientId, clientSecret, redirectUri });
        const discordUser = await this.fetchDiscordUser(token.access_token);
        const { companionToken, role } = await this.db.withClient(async (client) => {
            const userId = await this.upsertUserByDiscordId(client, discordUser);
            const resolvedRole = await this.resolveRole(client, engineId, discordUser.id);
            const session = await this.companionAuth.createSession(client, {
                userId,
                engineId,
                role: resolvedRole,
            });
            return { companionToken: session.token, role: resolvedRole };
        });
        const isProd = (process.env.NODE_ENV || '').toLowerCase() === 'production';
        res.cookie('bse_token', companionToken, {
            httpOnly: true,
            secure: isProd,
            sameSite: 'lax',
            path: '/',
            maxAge: 1000 * 60 * 60 * 12,
        });
        const redirect = new URL(appUrl);
        redirect.searchParams.set('engineId', engineId);
        redirect.searchParams.set('role', role);
        return res.redirect(redirect.toString());
    }
    async logout(req, res) {
        const token = req.cookies?.bse_token;
        if (token) {
            await this.db.withClient((client) => this.companionAuth.revokeSession(client, token));
        }
        res.clearCookie('bse_token', {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });
        return res.redirect(process.env.COMPANION_APP_URL || '/');
    }
    async exchangeCodeForToken(input) {
        const body = new URLSearchParams({
            client_id: input.clientId,
            client_secret: input.clientSecret,
            grant_type: 'authorization_code',
            code: input.code,
            redirect_uri: input.redirectUri,
        });
        const r = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => '');
            throw new Error(`Discord token exchange failed: ${r.status} ${txt}`);
        }
        return (await r.json());
    }
    async fetchDiscordUser(accessToken) {
        const r = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!r.ok) {
            const txt = await r.text().catch(() => '');
            throw new Error(`Discord user fetch failed: ${r.status} ${txt}`);
        }
        return (await r.json());
    }
    async upsertUserByDiscordId(client, discordUser) {
        const existing = await client.query(`SELECT user_id FROM users WHERE discord_user_id = $1 LIMIT 1`, [discordUser.id]);
        if (existing.rowCount)
            return existing.rows[0].user_id;
        const newId = (0, uuid_1.uuid)();
        await client.query(`INSERT INTO users (user_id, discord_user_id, username) VALUES ($1,$2,$3)`, [newId, discordUser.id, discordUser.global_name ?? discordUser.username]);
        return newId;
    }
    async resolveRole(client, engineId, discordUserId) {
        try {
            const r = await client.query(`SELECT discord_owner_id FROM engines WHERE engine_id = $1 LIMIT 1`, [engineId]);
            const owner = r.rowCount ? r.rows[0].discord_owner_id : null;
            if (owner && String(owner) === String(discordUserId))
                return 'st';
        }
        catch {
        }
        return 'player';
    }
    async consumeOauthState(state) {
        return this.db.withClient(async (client) => {
            const r = await client.query(`
        SELECT engine_id
        FROM oauth_states
        WHERE state = $1
        ORDER BY created_at DESC
        LIMIT 1
        `, [state]);
            if (!r.rowCount)
                return null;
            await client.query(`DELETE FROM oauth_states WHERE state = $1`, [state]);
            return r.rows[0].engine_id;
        });
    }
};
exports.DiscordOauthController = DiscordOauthController;
__decorate([
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('engineId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DiscordOauthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('callback'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('code')),
    __param(2, (0, common_1.Query)('state')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], DiscordOauthController.prototype, "callback", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, Req()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DiscordOauthController.prototype, "logout", null);
exports.DiscordOauthController = DiscordOauthController = __decorate([
    (0, common_1.Controller)('auth/discord'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        auth_service_1.CompanionAuthService])
], DiscordOauthController);
//# sourceMappingURL=discord-oauth.controller.js.map