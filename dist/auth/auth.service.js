"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const querystring_1 = require("querystring");
const node_fetch_1 = require("node-fetch");
let AuthService = class AuthService {
    getDiscordAuthUrl() {
        const clientId = process.env.DISCORD_CLIENT_ID;
        const redirectUri = `${process.env.APP_BASE_URL}/auth/discord/callback`;
        const params = querystring_1.default.stringify({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            scope: 'identify',
        });
        return `https://discord.com/oauth2/authorize?${params}`;
    }
    async handleDiscordCallback(client, code) {
        const tokenRes = await (0, node_fetch_1.default)('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: querystring_1.default.stringify({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code,
                redirect_uri: `${process.env.APP_BASE_URL}/auth/discord/callback`,
            }),
        });
        const tokenJson = await tokenRes.json();
        const userRes = await (0, node_fetch_1.default)('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenJson.access_token}` },
        });
        const discordUser = await userRes.json();
        const user = await client.query(`
      INSERT INTO users (user_id, discord_user_id, display_name)
      VALUES ($1,$2,$3)
      ON CONFLICT (discord_user_id)
      DO UPDATE SET display_name=EXCLUDED.display_name
      RETURNING user_id
      `, [(0, uuid_1.v4)(), discordUser.id, discordUser.username]);
        const sessionToken = (0, uuid_1.v4)();
        await client.query(`
      INSERT INTO sessions (session_id, token, user_id, expires_at)
      VALUES ($1,$2,$3, now() + interval '24 hours')
      `, [(0, uuid_1.v4)(), sessionToken, user.rows[0].user_id]);
        return { token: sessionToken };
    }
    async validateToken(client, token) {
        const res = await client.query(`SELECT * FROM sessions WHERE token=$1 AND expires_at > now()`, [token]);
        return res.rowCount ? res.rows[0] : null;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)()
], AuthService);
//# sourceMappingURL=auth.service.js.map