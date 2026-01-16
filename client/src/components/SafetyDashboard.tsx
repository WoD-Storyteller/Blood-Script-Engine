import { useEffect, useState } from 'react';

async function fetchSafetyStats() {
  const res = await fetch('/api/companion/safety/stats', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch safety stats');
  return res.json();
}

async function fetchSafetyPending() {
  const res = await fetch('/api/companion/safety/pending', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch pending events');
  return res.json();
}

async function respondToSafety(eventId: string, message: string) {
  const res = await fetch('/api/companion/safety/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ eventId, message }),
  });
  if (!res.ok) throw new Error('Failed to respond');
  return res.json();
}

export default function SafetyDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  const refresh = async () => {
    try {
      const [statsData, pendingData] = await Promise.all([
        fetchSafetyStats(),
        fetchSafetyPending(),
      ]);
      setStats(statsData.stats);
      setPending(pendingData.events || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRespond = async (eventId: string) => {
    const message = responseText[eventId];
    if (!message) return;
    await respondToSafety(eventId, message);
    setResponseText((prev) => ({ ...prev, [eventId]: '' }));
    refresh();
  };

  return (
    <div style={{ marginTop: 16, padding: 16, background: '#1a1a2e', borderRadius: 8 }}>
      <h3 style={{ margin: 0, marginBottom: 12, color: '#fff' }}>Safety Oversight</h3>
      <button onClick={refresh} style={{ marginBottom: 12 }}>Refresh</button>
      
      {error && <div style={{ color: '#f44', marginBottom: 8 }}>Error: {error}</div>}

      {stats && (
        <div style={{ marginBottom: 16, padding: 12, background: '#252545', borderRadius: 6 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div><span style={{ color: '#f44' }}>Red:</span> {stats.red || 0}</div>
            <div><span style={{ color: '#fc0' }}>Yellow:</span> {stats.yellow || 0}</div>
            <div><span style={{ color: '#4f4' }}>Green:</span> {stats.green || 0}</div>
            <div><span style={{ color: '#888' }}>Total:</span> {stats.total || 0}</div>
          </div>
        </div>
      )}

      <h4 style={{ marginBottom: 8, color: '#ccc' }}>Pending Events</h4>
      {pending.length === 0 ? (
        <p style={{ color: '#888' }}>No pending safety events.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {pending.map((e) => (
            <li key={e.event_id} style={{ marginBottom: 12, padding: 12, background: '#252545', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{
                  color: e.level === 'red' ? '#f44' : e.level === 'yellow' ? '#fc0' : '#4f4'
                }}>
                  {String(e.level).toUpperCase()}
                </strong>
                <span style={{ fontSize: 12, color: '#888' }}>
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <div style={{ marginTop: 8 }}>
                <input
                  type="text"
                  placeholder="Response message..."
                  value={responseText[e.event_id] || ''}
                  onChange={(ev) => setResponseText((prev) => ({ ...prev, [e.event_id]: ev.target.value }))}
                  style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: 'none' }}
                />
                <button onClick={() => handleRespond(e.event_id)}>
                  Respond & Resolve
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
