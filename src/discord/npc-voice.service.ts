import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GeminiClient } from '../ai/gemini.client';

interface NpcVoiceInput {
  npcId: string;
  context: string;
  targetChannelId?: string;
}

interface NpcData {
  npc_id: string;
  name: string;
  personality: {
    traits?: string[];
    mannerisms?: string[];
    voice?: string;
    goals?: string[];
  };
  portrait_url?: string;
  webhook_url?: string;
}

@Injectable()
export class NpcVoiceService {
  private readonly logger = new Logger(NpcVoiceService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly gemini: GeminiClient,
  ) {}

  async speakAsNpc(engineId: string, input: NpcVoiceInput): Promise<{ success: boolean; message?: string }> {
    const engineResult = await this.db.query(
      `SELECT config FROM engines WHERE engine_id = $1`,
      [engineId],
    );

    if (engineResult.rows.length === 0) {
      return { success: false, message: 'Engine not found' };
    }

    const config = engineResult.rows[0].config || {};
    if (!config.ai_enabled || !config.ai_npc_voicing) {
      return { success: false, message: 'AI NPC voicing is disabled for this chronicle' };
    }

    const npcResult = await this.db.query(
      `SELECT npc_id, name, personality, portrait_url, webhook_url 
       FROM npcs WHERE npc_id = $1 AND engine_id = $2`,
      [input.npcId, engineId],
    );

    if (npcResult.rows.length === 0) {
      return { success: false, message: 'NPC not found' };
    }

    const npc: NpcData = npcResult.rows[0];

    if (!npc.webhook_url) {
      return { success: false, message: 'NPC has no webhook configured' };
    }

    try {
      const dialogue = await this.generateNpcDialogue(npc, input.context, config.ai_tone);
      await this.sendViaWebhook(npc, dialogue);
      return { success: true, message: dialogue };
    } catch (error) {
      this.logger.error(`Failed to voice NPC ${npc.name}: ${error}`);
      return { success: false, message: (error as Error).message };
    }
  }

  private async generateNpcDialogue(npc: NpcData, context: string, tone: string): Promise<string> {
    const personality = npc.personality || {};
    const traits = personality.traits?.join(', ') || 'mysterious';
    const mannerisms = personality.mannerisms?.join('; ') || 'speaks carefully';
    const voice = personality.voice || 'measured and deliberate';
    const goals = personality.goals?.join('; ') || 'unknown agenda';

    const prompt = `You are ${npc.name}, a vampire NPC in a Vampire: The Masquerade game.

CHARACTER PROFILE:
- Name: ${npc.name}
- Personality traits: ${traits}
- Mannerisms: ${mannerisms}
- Voice/Speaking style: ${voice}
- Current goals: ${goals}

TONE: ${tone === 'gothic_horror' ? 'Gothic horror, atmospheric, hints of menace' : tone}

CONTEXT:
${context}

RULES:
- Stay completely in character
- Never break the fourth wall
- Never mention game mechanics
- Keep response to 1-3 sentences (in-character dialogue only)
- Use the character's voice and mannerisms
- Do not use asterisks or stage directions

Respond as ${npc.name} would speak:`;

    const response = await this.gemini.generate(prompt);
    return response.trim();
  }

  private async sendViaWebhook(npc: NpcData, content: string): Promise<void> {
    if (!npc.webhook_url) {
      throw new Error('No webhook URL configured');
    }

    const payload: any = {
      content,
      username: npc.name,
    };

    if (npc.portrait_url) {
      const domain = process.env.COMPANION_APP_URL || process.env.PUBLIC_WEBSITE_URL || '';
      if (npc.portrait_url.startsWith('/objects')) {
        payload.avatar_url = `${domain}${npc.portrait_url}`;
      } else if (npc.portrait_url.startsWith('http')) {
        payload.avatar_url = npc.portrait_url;
      }
    }

    const res = await fetch(npc.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Webhook failed: ${res.status} ${text}`);
    }
  }

  async listNpcsWithWebhooks(engineId: string): Promise<NpcData[]> {
    const result = await this.db.query(
      `SELECT npc_id, name, personality, portrait_url, webhook_url 
       FROM npcs WHERE engine_id = $1 AND webhook_url IS NOT NULL AND alive = true
       ORDER BY name`,
      [engineId],
    );
    return result.rows;
  }
}
