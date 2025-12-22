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
exports.ResolutionPipeline = void 0;
const common_1 = require("@nestjs/common");
const safety_service_1 = require("../safety/safety.service");
const dice_service_1 = require("../rules/dice.service");
const hunger_service_1 = require("../rules/hunger.service");
const combat_service_1 = require("../combat/combat.service");
const discipline_service_1 = require("../rules/discipline.service");
const rouse_service_1 = require("../rules/rouse.service");
const character_context_service_1 = require("./character-context.service");
const uuid_1 = require("../common/utils/uuid");
let ResolutionPipeline = class ResolutionPipeline {
    constructor(safety, dice, hunger, combat, disciplines, rouse, charCtx) {
        this.safety = safety;
        this.dice = dice;
        this.hunger = hunger;
        this.combat = combat;
        this.disciplines = disciplines;
        this.rouse = rouse;
        this.charCtx = charCtx;
    }
    async run(client, input) {
        if (input.mentionedDiscordUserIds.length > 0) {
            const offline = await this.findOfflineTargets(client, input.engineId, input.mentionedDiscordUserIds);
            if (offline.length > 0) {
                return {
                    ok: false,
                    sceneId: input.sceneId,
                    publicMessage: 'That cannot resolve right now — one or more involved players are not present.',
                };
            }
        }
        const tenetCheck = await this.safety.checkTenets(client, {
            engineId: input.engineId,
            content: input.content,
        });
        if (tenetCheck.allowed === false) {
            await client.query(`
        INSERT INTO tenet_violation_attempts
          (attempt_id, engine_id, user_id, scene_id, tenet_id, category)
        VALUES ($1,$2,$3,$4,$5,$6)
        `, [
                (0, uuid_1.uuid)(),
                input.engineId,
                input.userId,
                input.sceneId,
                tenetCheck.tenetId,
                tenetCheck.category,
            ]);
            const warning = await this.safety.issueOrEscalateWarning(client, {
                engineId: input.engineId,
                userId: input.userId,
                category: tenetCheck.category,
                tenetTitle: tenetCheck.tenetTitle,
            });
            return {
                ok: false,
                sceneId: input.sceneId,
                dmWarning: warning.dmText,
                publicMessage: 'That direction is outside this chronicle’s boundaries. The night moves elsewhere.',
            };
        }
        const character = await this.charCtx.getActiveCharacter(client, input.engineId, input.channelId, input.userId);
        let hunger = character?.hunger ?? 0;
        let basePool = 6;
        let disciplineNote = null;
        const detected = this.disciplines.detect(input.content);
        if (detected && character) {
            const dots = await this.charCtx.getDisciplineDots(client, character.character_id, detected);
            const profile = this.disciplines.buildProfile(detected, dots);
            disciplineNote = `${profile.name}: ${profile.notes}`;
            for (let i = 0; i < profile.rouseCost; i++) {
                const ok = this.rouse.rouse();
                if (!ok)
                    hunger = Math.min(5, hunger + 1);
            }
            if (hunger !== character.hunger) {
                await this.charCtx.setHunger(client, character.character_id, hunger);
            }
            basePool += profile.diceBonus;
        }
        const isCombat = /attack|strike|shoot|stab|fight|hit|slash|bite/i.test(input.content);
        if (isCombat && input.mentionedDiscordUserIds.length > 0) {
            const defender = await this.charCtx.getActiveCharacterByDiscordUser(client, input.engineId, input.channelId, input.mentionedDiscordUserIds[0]);
            const result = await this.combat.resolveExchange(client, {
                engineId: input.engineId,
                sceneId: input.sceneId,
                attackerPool: basePool,
                defenderPool: 5,
                hunger,
                attackerCharacterId: character?.character_id,
                defenderCharacterId: defender?.character_id,
                action: {
                    actorUserId: input.discordUserId,
                    actorCharacterId: character?.character_id ?? 'unknown',
                    type: 'attack',
                    description: input.content,
                    targetCharacterId: defender?.character_id,
                },
            });
            await client.query(`UPDATE scenes SET updated_at = now() WHERE scene_id = $1`, [input.sceneId]);
            return {
                ok: true,
                sceneId: input.sceneId,
                narration: disciplineNote
                    ? `${disciplineNote} ${result.narration}`
                    : result.narration,
            };
        }
        const { roll, outcome } = this.dice.roll({
            total: basePool,
            hunger: Math.min(5, Math.max(0, hunger)),
        });
        let narration = `The action resolves with ${roll.successes} successes.`;
        const hungerEffect = this.hunger.getConsequence(outcome);
        if (hungerEffect)
            narration += ` ${hungerEffect}`;
        if (disciplineNote)
            narration = `${disciplineNote} ${narration}`;
        await client.query(`UPDATE scenes SET updated_at = now() WHERE scene_id = $1`, [input.sceneId]);
        return { ok: true, sceneId: input.sceneId, narration };
    }
    async findOfflineTargets(client, engineId, discordUserIds) {
        const users = await client.query(`SELECT user_id FROM users WHERE discord_user_id = ANY($1)`, [discordUserIds]);
        if (!users.rowCount)
            return [];
        const userIds = users.rows.map((r) => r.user_id);
        const chars = await client.query(`
      SELECT character_id
      FROM characters
      WHERE engine_id = $1 AND user_id = ANY($2)
      `, [engineId, userIds]);
        if (!chars.rowCount)
            return [];
        const charIds = chars.rows.map((r) => r.character_id);
        const presence = await client.query(`
      SELECT character_id, status
      FROM presence
      WHERE engine_id = $1 AND character_id = ANY($2)
      `, [engineId, charIds]);
        const status = new Map(presence.rows.map((r) => [r.character_id, r.status]));
        return charIds.filter((id) => !status.has(id) || status.get(id) === 'offline');
    }
};
exports.ResolutionPipeline = ResolutionPipeline;
exports.ResolutionPipeline = ResolutionPipeline = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [safety_service_1.SafetyService,
        dice_service_1.DiceService,
        hunger_service_1.HungerService,
        combat_service_1.CombatService,
        discipline_service_1.DisciplineService,
        rouse_service_1.RouseService,
        character_context_service_1.CharacterContextService])
], ResolutionPipeline);
//# sourceMappingURL=resolution.pipeline.js.map