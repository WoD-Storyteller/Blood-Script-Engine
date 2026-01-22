import {
  SessionInfo,
  CharacterSummary,
  CharacterSheet,
  RulesState,
  WorldState,
  CoterieDetail,
  CoterieSummary,
  AiIntent,
} from './types';
import { loadToken } from './auth';

/**
 * IMPORTANT:
 * - Frontend MUST talk to NGINX, not the Engine directly
 * - NGINX proxies /api → Engine
 * - This avoids CORS entirely (same-origin)
 */
const API_BASE = '/api';

let csrfToken: string | null = null;

async function ensureSession(): Promise<SessionInfo> {
  const headers: Record<string, string> = {};
  const token = loadToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/companion/me`, {
    credentials: 'include',
    headers,
  });

  if (!res.ok) throw new Error('Not authenticated');

  const data = await res.json();
  csrfToken = data.csrfToken ?? null;
  return data;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? 'GET';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = loadToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  if (method !== 'GET') {
    if (!csrfToken) await ensureSession();
    if (csrfToken) headers['x-csrf-token'] = csrfToken;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Request failed ${res.status}: ${text}`);
  }

  return res.json();
}

/* ======================
   Session + World
   ====================== */

export const fetchMe = () => call<SessionInfo>('/companion/me');

export const consumeLinkToken = async (token: string) => {
  const res = await fetch(`${API_BASE}/internal/companion/consume-link-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Link token exchange failed');
  }

  return res.json() as Promise<{ token: string; session: SessionInfo }>;
};

export const fetchWorld = async () => {
  const data = await call<{ world?: WorldState }>('/companion/world');
  return data.world ?? data;
};

/* ======================
   Characters
   ====================== */

export const fetchCharacters = async () =>
  (await call<{ characters: CharacterSummary[] }>('/companion/characters'))
    .characters;

export const fetchCharacter = async (id: string) =>
  (await call<{ character: CharacterSheet }>(
    `/companion/characters/${id}`,
  )).character;

export const fetchCharacterRulesState = async (id: string) =>
  (await call<{ rulesState: RulesState }>(
    `/companion/characters/${id}/rules-state`,
  )).rulesState;

export const setActiveCharacter = (characterId: string) =>
  call('/companion/characters/active', {
    method: 'POST',
    body: JSON.stringify({ characterId }),
  });

export const updateCharacterSheet = (
  characterId: string,
  sheet: CharacterSheet,
) =>
  call(`/companion/characters/${characterId}`, {
    method: 'POST',
    body: JSON.stringify({ sheet }),
  });

export const overrideBloodPotency = (
  characterId: string,
  value: number,
  reason: string,
) =>
  call('/companion/owner/blood-potency/override', {
    method: 'POST',
    body: JSON.stringify({ characterId, value, reason }),
  });

export const saveCharacterPortrait = (characterId: string, objectPath: string) =>
  call<{ success: boolean; portraitUrl: string }>('/companion/portrait/save', {
    method: 'POST',
    body: JSON.stringify({ characterId, objectPath }),
  });

/* ======================
   Coteries
   ====================== */

export const fetchCoteries = async () => {
  const data = await call<{ coteries?: CoterieSummary[] }>(
    '/companion/coteries',
  );
  return data.coteries ?? data;
};

export const fetchCoterie = async (id: string) => {
  const data = await call<{ coterie?: CoterieDetail }>(
    `/companion/coteries/${id}`,
  );
  return data.coterie ?? data;
};

/* ======================
   Safety
   ====================== */

export const submitSafety = (level: 'red' | 'yellow' | 'green') =>
  call('/companion/safety', {
    method: 'POST',
    body: JSON.stringify({ level }),
  });

export const fetchActiveSafety = async () => {
  const data = await call<{ events?: any[] }>(
    '/companion/safety/active',
  );
  return data.events ?? data;
};

export const resolveSafety = (eventId: string) =>
  call('/companion/safety/resolve', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });

/* ======================
   XP
   ====================== */

export const requestXpSpend = (input: {
  characterId: string;
  kind: 'skill' | 'attribute' | 'discipline' | 'blood_potency';
  key: string;
  current: number;
  reason: string;
}) =>
  call('/companion/xp/spend', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const fetchPendingXp = async () =>
  (await call<{ pending: any[] }>('/companion/xp/pending'))
    .pending;

export const approveXp = (xpId: string) =>
  call('/companion/xp/approve', {
    method: 'POST',
    body: JSON.stringify({ xpId }),
  });

/* ======================
   Storyteller / Admin
   ====================== */

export const stSetMap = (mapUrl: string) =>
  call('/companion/st/map', {
    method: 'POST',
    body: JSON.stringify({ mapUrl }),
  });

export const stCreateClock = (input: {
  title: string;
  segments: number;
  nightly: boolean;
  description?: string;
}) =>
  call('/companion/st/clocks', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const stTickClock = (input: {
  clockIdPrefix: string;
  amount: number;
  reason: string;
}) =>
  call('/companion/st/clocks/tick', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const stCreateArc = (input: {
  title: string;
  synopsis?: string;
}) =>
  call('/companion/st/arcs', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const stSetArcStatus = (input: {
  arcIdPrefix: string;
  status: string;
  outcome?: string;
}) =>
  call('/companion/st/arcs/status', {
    method: 'POST',
    body: JSON.stringify(input),
  });

export const stListIntents = async () => {
  const data = await call<{ intents?: AiIntent[] }>(
    '/companion/st/intents',
  );
  return data.intents ?? data;
};

export const stApproveIntent = (intentId: string) =>
  call('/companion/st/intents/approve', {
    method: 'POST',
    body: JSON.stringify({ intentId }),
  });

export const stRejectIntent = (intentId: string) =>
  call('/companion/st/intents/reject', {
    method: 'POST',
    body: JSON.stringify({ intentId }),
  });

/* ======================
   AI Settings
   ====================== */

export interface AiSettings {
  ai_enabled: boolean;
  ai_narration: boolean;
  ai_npc_voicing: boolean;
  ai_tone: string;
}

export const fetchAiSettings = () =>
  call<AiSettings>('/companion/ai/settings');

export const updateAiSettings = (settings: Partial<AiSettings>) =>
  call<{ success: boolean; config: AiSettings }>('/companion/ai/settings', {
    method: 'POST',
    body: JSON.stringify(settings),
  });

/* ======================
   NPC Management
   ====================== */

export interface NpcData {
  npc_id: string;
  name: string;
  role?: string;
  personality?: {
    traits?: string[];
    mannerisms?: string[];
    voice?: string;
    goals?: string[];
  };
  ambition?: string;
  status?: number;
  alive?: boolean;
  portrait_url?: string;
  webhook_url?: string;
  created_at?: string;
}

export const fetchNpcs = async () =>
  (await call<{ npcs: NpcData[] }>('/companion/npcs')).npcs;

export const fetchNpc = async (id: string) =>
  (await call<{ npc: NpcData }>(`/companion/npcs/${id}`)).npc;

export const batchImportNpcs = (npcs: Partial<NpcData>[]) =>
  call<{ success: boolean; imported: number; errors: number; details: any }>('/companion/npcs/batch-import', {
    method: 'POST',
    body: JSON.stringify({ npcs }),
  });

export const updateNpc = (npcId: string, data: Partial<NpcData>) =>
  call<{ success: boolean }>(`/companion/npcs/${npcId}/update`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const requestNpcPortraitUrl = (npcId: string, file: { name: string; size: number; contentType: string }) =>
  call<{ uploadURL: string; objectPath: string }>(`/companion/npcs/${npcId}/portrait/request-url`, {
    method: 'POST',
    body: JSON.stringify(file),
  });

export const saveNpcPortrait = (npcId: string, objectPath: string) =>
  call<{ success: boolean; portraitUrl: string }>(`/companion/npcs/${npcId}/portrait/save`, {
    method: 'POST',
    body: JSON.stringify({ objectPath }),
  });

export const getNpcTemplate = () =>
  call<{ template: any; schema: any }>('/companion/npcs/template', { method: 'POST' });

export const getChronicleTemplate = () =>
  call<{ template: any; schema: any }>('/companion/chronicle/template');
