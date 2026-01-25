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
    <div className="card mt-4">
      <h3 className="card-header">Safety Oversight</h3>
      <button className="btn-secondary mb-4" onClick={refresh}>Refresh</button>
      
      {error && <div className="text-red-400 mb-2">Error: {error}</div>}

      {stats && (
        <div className="mb-4 p-3 bg-blood-dark rounded-lg">
          <div className="flex gap-6 flex-wrap text-sm">
            <div><span className="text-red-400">Red:</span> <span className="text-blood-bone">{stats.red || 0}</span></div>
            <div><span className="text-yellow-400">Yellow:</span> <span className="text-blood-bone">{stats.yellow || 0}</span></div>
            <div><span className="text-green-400">Green:</span> <span className="text-blood-bone">{stats.green || 0}</span></div>
            <div><span className="text-blood-muted">Total:</span> <span className="text-blood-bone">{stats.total || 0}</span></div>
          </div>
        </div>
      )}

      <h4 className="text-blood-bone mb-2 font-medium">Pending Events</h4>
      {pending.length === 0 ? (
        <p className="text-blood-muted">No pending safety events.</p>
      ) : (
        <ul className="space-y-3">
          {pending.map((e) => (
            <li key={e.event_id} className="bg-blood-dark p-3 rounded-lg border border-blood-crimson/20">
              <div className="flex justify-between items-center">
                <strong className={
                  e.level === 'red' ? 'text-red-400' : 
                  e.level === 'yellow' ? 'text-yellow-400' : 'text-green-400'
                }>
                  {String(e.level).toUpperCase()}
                </strong>
                <span className="text-xs text-blood-muted">
                  {new Date(e.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-3">
                <input
                  type="text"
                  placeholder="Response message..."
                  value={responseText[e.event_id] || ''}
                  onChange={(ev) => setResponseText((prev) => ({ ...prev, [e.event_id]: ev.target.value }))}
                  className="w-full mb-2"
                />
                <button className="btn-primary text-sm" onClick={() => handleRespond(e.event_id)}>
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
