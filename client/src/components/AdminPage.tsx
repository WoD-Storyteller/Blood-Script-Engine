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
    <div className="mt-3 space-y-6">
      <h2 className="text-xl font-bold text-blood-crimson">Admin / Storyteller</h2>
      {error && <div className="mb-3 text-red-400">Error: {error}</div>}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card">
          <h3 className="card-header">Map</h3>
          <input
            value={mapUrl}
            onChange={(e) => setMapUrl(e.target.value)}
            placeholder="Google My Maps embed URL"
            className="w-full"
          />
          <button
            className="btn-primary mt-3"
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

        <section className="card">
          <h3 className="card-header">Create Clock</h3>
          <input
            value={clockTitle}
            onChange={(e) => setClockTitle(e.target.value)}
            placeholder="Title"
            className="w-full mb-2"
          />
          <input
            type="number"
            value={clockSegments}
            onChange={(e) => setClockSegments(Number(e.target.value))}
            className="w-full mb-2"
          />
          <label className="flex items-center gap-2 text-blood-bone">
            <input
              type="checkbox"
              checked={clockNightly}
              onChange={(e) => setClockNightly(e.target.checked)}
              className="w-4 h-4"
            />
            Nightly
          </label>
          <input
            value={clockDesc}
            onChange={(e) => setClockDesc(e.target.value)}
            placeholder="Description"
            className="w-full mt-2"
          />
          <button
            className="btn-primary mt-3"
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

        <section className="card">
          <h3 className="card-header">Tick Clock</h3>
          <input
            value={tickIdPrefix}
            onChange={(e) => setTickIdPrefix(e.target.value)}
            placeholder="Clock ID prefix"
            className="w-full mb-2"
          />
          <input
            type="number"
            value={tickAmount}
            onChange={(e) => setTickAmount(Number(e.target.value))}
            className="w-full mb-2"
          />
          <input
            value={tickReason}
            onChange={(e) => setTickReason(e.target.value)}
            placeholder="Reason"
            className="w-full"
          />
          <button
            className="btn-primary mt-3"
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

        <section className="card">
          <h3 className="card-header">Create Arc</h3>
          <input
            value={arcTitle}
            onChange={(e) => setArcTitle(e.target.value)}
            placeholder="Arc title"
            className="w-full mb-2"
          />
          <input
            value={arcSynopsis}
            onChange={(e) => setArcSynopsis(e.target.value)}
            placeholder="Synopsis"
            className="w-full"
          />
          <button
            className="btn-primary mt-3"
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

      <section className="card">
        <h3 className="card-header">Update Arc Status</h3>
        <input
          value={arcIdPrefix}
          onChange={(e) => setArcIdPrefix(e.target.value)}
          placeholder="Arc ID prefix"
          className="w-full mb-2"
        />
        <select 
          value={arcStatus} 
          onChange={(e) => setArcStatus(e.target.value as any)}
          className="w-full mb-2"
        >
          <option value="planned">planned</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <input
          value={arcOutcome}
          onChange={(e) => setArcOutcome(e.target.value)}
          placeholder="Outcome"
          className="w-full"
        />
        <button
          className="btn-primary mt-3"
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

      <section className="card">
        <h3 className="card-header">AI Intents</h3>
        <button className="btn-secondary mb-4" onClick={refreshIntents}>Refresh</button>

        {intents.length === 0 ? (
          <p className="text-blood-muted">No intents.</p>
        ) : (
          <ul className="space-y-3">
            {intents.map((i) => (
              <li key={i.intent_id} className="bg-blood-dark p-3 rounded-lg border border-blood-crimson/20">
                <strong className="text-blood-crimson">{i.intent_type}</strong> 
                <span className="text-blood-muted ml-2">— {i.status}</span>
                <pre className="mt-2 whitespace-pre-wrap bg-blood-night text-blood-bone p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(i.payload, null, 2)}
                </pre>
                <div className="flex gap-2 mt-2">
                  <button
                    className="btn-primary text-sm"
                    disabled={i.status !== 'proposed'}
                    onClick={async () => {
                      await stApproveIntent(i.intent_id);
                      refreshIntents();
                    }}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-secondary text-sm"
                    disabled={i.status !== 'proposed'}
                    onClick={async () => {
                      await stRejectIntent(i.intent_id);
                      refreshIntents();
                    }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SafetyDashboard />
      </section>
    </div>
  );
}