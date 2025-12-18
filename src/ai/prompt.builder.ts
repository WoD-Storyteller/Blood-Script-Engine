import { Injectable } from '@nestjs/common';

interface NarrationInput {
  systemTone: string;
  sceneSummary: string;
  mechanicalResult: string;
  disciplineNote?: string;
  npcVoices?: string[];
}

@Injectable()
export class PromptBuilder {
  build(input: NarrationInput): string {
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
}
