import { useEffect, useState } from 'react';
import type { AiIntent, WorldState } from '../types';
import {
  stSetMap,
  stCreateClock,
  stTickClock,
  stCreateArc,
  stSetArcStatus,
  stListIntents,
  stApproveIntent,
  stRejectIntent,
} from '../api';
import SafetyDashboard from './SafetyDashboard';

export default function AdminPage({
  onWorldUpdate,
}: {
  onWorldUpdate: (w: WorldState) => void;
}) {
  const [mapUrl, setMapUrl] = useState('');

  const [clockTitle, setClockTitle] = useState('');
  const [clockSegments, setClockSegments] = useState(6);
  const [clockNightly, setClockNightly] = useState(false);
  const [clockDesc, setClockDesc] = useState('');

  const [tickIdPrefix, setTickIdPrefix] = useState('');
  const [tickAmount, setTickAmount] = useState(1);
  const [tickReason, setTickReason] = useState('ST tick.');

  const [arcTitle, setArcTitle] = useState('');
  const [arcSynopsis, setArcSynopsis] = useState('');

  const [arcIdPrefix, setArcIdPrefix] = useState('');
  const [arcStatus, setArcStatus] =
    useState<'planned' | 'active' | 'completed' | 'cancelled'>('active');
  const [arcOutcome, setArcOutcome] = useState('');

  const [intents, setIntents] = useState<AiIntent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refreshIntents = async () => {
    try {
      const rows = await stListIntents();
      setIntents(rows);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refreshIntents();
  }, []);

  return (
    <div style={{ marginTop: 12 }}>
      <h2>Admin / Storyteller</h2>
      {error && <div style={{ marginBottom: 12 }}>Error: {error}</div>}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
        <section style={{ padding: 12, border: '1px solid #ddd' }}>
          <h3>Map</h3>
          <input
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="Google My Maps embed URL"
            style={{ width: '100%' }}
          />
          <button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                const w = await stSetMap(mapUrl);
                onWorldUpdate(w);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Save Map
          </button>
        </section>

        <section style={{ padding: 12, border: '1px solid #ddd' }}>
          <h3>Create Clock</h3>
          <input
            value={clockTitle}
            onChange={(e) => setClockTitle(e.target.value)}
            placeholder="Title"
            style={{ width: '100%', marginBottom: 6 }}
          />
          <input
            type="number"
            value={clockSegments}
            onChange={(e) => setClockSegments(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 6 }}
          />
          <label>
            <input
              type="checkbox"
              checked={clockNightly}
              onChange={(e) => setClockNightly(e.target.checked)}
            />{' '}
            Nightly
          </label>
          <input
            value={clockDesc}
            onChange={(e) => setClockDesc(e.target.value)}
            placeholder="Description"
            style={{ width: '100%', marginTop: 6 }}
          />
          <button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                const w = await stCreateClock({
                  title: clockTitle,
                  segments: clockSegments,
                  nightly: clockNightly,
                  description: clockDesc || undefined,
                });
                onWorldUpdate(w);
                setClockTitle('');
                setClockDesc('');
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Create Clock
          </button>
        </section>

        <section style={{ padding: 12, border: '1px solid #ddd' }}>
          <h3>Tick Clock</h3>
          <input
            value={tickIdPrefix}
            onChange={(e) => setTickIdPrefix(e.target.value)}
            placeholder="Clock ID prefix"
            style={{ width: '100%', marginBottom: 6 }}
          />
          <input
            type="number"
            value={tickAmount}
            onChange={(e) => setTickAmount(Number(e.target.value))}
            style={{ width: '100%', marginBottom: 6 }}
          />
          <input
            value={tickReason}
            onChange={(e) => setTickReason(e.target.value)}
            placeholder="Reason"
            style={{ width: '100%' }}
          />
          <button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                const w = await stTickClock({
                  clockIdPrefix: tickIdPrefix,
                  amount: tickAmount,
                  reason: tickReason,
                });
                onWorldUpdate(w);
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Tick Clock
          </button>
        </section>

        <section style={{ padding: 12, border: '1px solid #ddd' }}>
          <h3>Create Arc</h3>
          <input
            value={arcTitle}
            onChange={(e) => setArcTitle(e.target.value)}
            placeholder="Arc title"
            style={{ width: '100%', marginBottom: 6 }}
          />
          <input
            value={arcSynopsis}
            onChange={(e) => setArcSynopsis(e.target.value)}
            placeholder="Synopsis"
            style={{ width: '100%' }}
          />
          <button
            style={{ marginTop: 8 }}
            onClick={async () => {
              try {
                const w = await stCreateArc({ title: arcTitle, synopsis: arcSynopsis || undefined });
                onWorldUpdate(w);
                setArcTitle('');
                setArcSynopsis('');
              } catch (e: any) {
                setError(e.message);
              }
            }}
          >
            Create Arc
          </button>
        </section>
      </div>

      <section style={{ marginTop: 16, padding: 12, border: '1px solid #ddd' }}>
        <h3>Update Arc Status</h3>
        <input
          value={arcIdPrefix}
          onChange={(e) => setArcIdPrefix(e.target.value)}
          placeholder="Arc ID prefix"
          style={{ width: '100%', marginBottom: 6 }}
        />
        <select value={arcStatus} onChange={(e) => setArcStatus(e.target.value as any)}>
          <option value="planned">planned</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <input
          value={arcOutcome}
          onChange={(e) => setArcOutcome(e.target.value)}
          placeholder="Outcome"
          style={{ width: '100%', marginTop: 6 }}
        />
        <button
          style={{ marginTop: 8 }}
          onClick={async () => {
            try {
              const w = await stSetArcStatus({
                arcIdPrefix,
                status: arcStatus,
                outcome: arcOutcome || undefined,
              });
              onWorldUpdate(w);
            } catch (e: any) {
              setError(e.message);
            }
          }}
        >
          Apply
        </button>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>AI Intents</h3>
        <button onClick={refreshIntents}>Refresh</button>

        {intents.length === 0 ? (
          <p>No intents.</p>
        ) : (
          <ul>
            {intents.map((i) => (
              <li key={i.intent_id} style={{ marginBottom: 12 }}>
                <strong>{i.intent_type}</strong> — {i.status}
                <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#eee', padding: 8 }}>
                  {JSON.stringify(i.payload, null, 2)}
                </pre>
                <button
                  disabled={i.status !== 'proposed'}
                  onClick={async () => {
                    await stApproveIntent(i.intent_id);
                    refreshIntents();
                  }}
                >
                  Approve
                </button>{' '}
                <button
                  disabled={i.status !== 'proposed'}
                  onClick={async () => {
                    await stRejectIntent(i.intent_id);
                    refreshIntents();
                  }}
                >
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <SafetyDashboard />
      </section>
    </div>
  );
}