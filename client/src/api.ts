import {
  SessionInfo,
  CharacterSummary,
  CharacterSheet,
  WorldState,
  CoterieDetail,
  CoterieSummary,
  AiIntent,
} from './types';

/**
 * IMPORTANT:
 * - Frontend MUST talk to NGINX, not the Engine directly
 * - NGINX proxies /api → Engine
 * - This avoids CORS entirely (same-origin)
 */
const API_BASE = '/api';

let csrfToken: string | null = null;

async function ensureSession(): Promise<SessionInfo> {
  const res = await fetch(`${API_BASE}/companion/me`, {
    credentials: 'include',
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