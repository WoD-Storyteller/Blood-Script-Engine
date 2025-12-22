"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("./database/database.module");
const auth_module_1 = require("./auth/auth.module");
const engine_module_1 = require("./engine/engine.module");
const safety_module_1 = require("./safety/safety.module");
const scenes_module_1 = require("./scenes/scenes.module");
const characters_module_1 = require("./characters/characters.module");
const coteries_module_1 = require("./coteries/coteries.module");
const havens_module_1 = require("./havens/havens.module");
const politics_module_1 = require("./politics/politics.module");
const occult_module_1 = require("./occult/occult.module");
const world_module_1 = require("./world/world.module");
const discord_module_1 = require("./discord/discord.module");
const ai_module_1 = require("./ai/ai.module");
const owner_module_1 = require("./owner/owner.module");
const jobs_module_1 = require("./jobs/jobs.module");
const session_middleware_1 = require("./common/middleware/session.middleware");
const dice_module_1 = require("./dice/dice.module");
const xp_module_1 = require("./xp/xp.module");
const realtime_module_1 = require("./realtime/realtime.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(session_middleware_1.SessionMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            database_module_1.DatabaseModule,
            realtime_module_1.RealtimeModule,
            auth_module_1.AuthModule,
            engine_module_1.EngineModule,
            safety_module_1.SafetyModule,
            scenes_module_1.ScenesModule,
            characters_module_1.CharactersModule,
            coteries_module_1.CoteriesModule,
            havens_module_1.HavensModule,
            politics_module_1.PoliticsModule,
            occult_module_1.OccultModule,
            world_module_1.WorldModule,
            discord_module_1.DiscordModule,
            ai_module_1.AiModule,
            owner_module_1.OwnerModule,
            jobs_module_1.JobsModule,
            dice_module_1.DiceModule,
            xp_module_1.XpModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map