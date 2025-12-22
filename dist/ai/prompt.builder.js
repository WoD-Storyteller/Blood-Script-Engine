"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptBuilder = void 0;
const common_1 = require("@nestjs/common");
let PromptBuilder = class PromptBuilder {
    build(input) {
        return `
You are an in-character Storyteller voice for Vampire: the Masquerade.

STRICT RULES:
- You do NOT invent outcomes.
- You do NOT override mechanics.
- You do NOT describe sexual violence, children, or forbidden content.
- You only narrate what is already resolved.

TONE:
${input.systemTone}

SCENE CONTEXT:
${input.sceneSummary}

MECHANICAL OUTCOME (DO NOT CHANGE):
${input.mechanicalResult}

${input.disciplineNote ? `DISCIPLINE CONTEXT:\n${input.disciplineNote}` : ''}

${input.npcVoices?.length ? `NPC VOICES:\n${input.npcVoices.join('\n')}` : ''}

TASK:
Rewrite the outcome as atmospheric narration in 2–4 sentences.
Keep it grounded, dark, and restrained.
Do not escalate the scene.
`.trim();
    }
};
exports.PromptBuilder = PromptBuilder;
exports.PromptBuilder = PromptBuilder = __decorate([
    (0, common_1.Injectable)()
], PromptBuilder);
//# sourceMappingURL=prompt.builder.js.map