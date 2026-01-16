const API_BASE = 'http://localhost:3000';

export async function fetchIsModerator(engineId: string, userId: string) {
  const res = await fetch(`${API_BASE}/companion/moderators/check`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engineId, userId }),
  });

  if (!res.ok) throw new Error('Request failed');
  const data = await res.json();
  return data.isModerator ?? data;
}
