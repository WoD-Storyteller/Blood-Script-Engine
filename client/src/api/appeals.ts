const API_BASE = 'http://localhost:3000';

export async function submitAppeal(message: string) {
  const res = await fetch(`${API_BASE}/companion/engine/appeals`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
