import { useEffect, useState } from 'react';
import { fetchActiveSafety, resolveSafety } from '../api';

export default function SafetyDashboard() {
  const [events, setEvents] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const rows = await fetchActiveSafety();
      setEvents(rows);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Safety Events</h3>
      <button onClick={refresh}>Refresh</button>
      {error && <div style={{ marginTop: 8 }}>Error: {error}</div>}

      {events.length === 0 ? (
        <p>No active safety events.</p>
      ) : (
        <ul style={{ marginTop: 8 }}>
          {events.map((e) => (
            <li key={e.event_id} style={{ marginBottom: 8 }}>
              <strong>{String(e.level).toUpperCase()}</strong> — user {String(e.user_id).slice(0, 8)}
              <div style={{ fontSize: 12, opacity: 0.7 }}>
                {new Date(e.created_at).toLocaleString()}
              </div>
              <button
                onClick={async () => {
                  await resolveSafety(e.event_id);
                  refresh();
                }}
              >
                Resolve
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
