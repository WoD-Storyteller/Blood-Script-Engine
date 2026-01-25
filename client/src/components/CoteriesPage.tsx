import { useEffect, useState } from 'react';
import { fetchCoterie, fetchCoteries } from '../api';
import type { CoterieSummary, CoterieDetail } from '../types';

export default function CoteriesPage() {
  const [list, setList] = useState<CoterieSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CoterieDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCoteries()
      .then(setList)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    fetchCoterie(selectedId)
      .then(setDetail)
      .catch((e) => setError(e.message));
  }, [selectedId]);

  return (
    <div className="mt-3">
      <h2 className="text-xl font-bold text-blood-crimson mb-4">Coteries</h2>
      {error && <div className="mb-3 text-red-400">Error: {error}</div>}

      <div className="flex gap-4">
        <div className="w-2/5">
          <div className="card">
            {list.length === 0 ? (
              <p className="text-blood-muted">No coteries yet.</p>
            ) : (
              <ul className="space-y-2">
                {list.map((c) => (
                  <li key={c.coterie_id}>
                    <button 
                      onClick={() => setSelectedId(c.coterie_id)}
                      className={`w-full text-left p-2 rounded transition ${
                        selectedId === c.coterie_id 
                          ? 'bg-blood-dark border border-blood-crimson text-blood-crimson' 
                          : 'hover:bg-blood-dark/60 text-blood-bone'
                      }`}
                    >
                      {c.name}
                    </button>
                    <div className="text-xs text-blood-muted ml-2 mt-1">
                      {c.type ? c.type : 'Unknown type'}
                      {c.domain ? ` — ${c.domain}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="w-3/5">
          <div className="card">
            <h3 className="card-header">Details</h3>
            {!selectedId && <p className="text-blood-muted">Select a coterie to view details.</p>}
            {selectedId && !detail && <p className="text-blood-muted">Loading...</p>}

            {detail && (
              <>
                <pre className="whitespace-pre-wrap bg-blood-night text-blood-bone p-3 rounded text-sm overflow-x-auto mb-4">
                  {JSON.stringify({ ...detail, members: undefined }, null, 2)}
                </pre>

                <h4 className="text-blood-bone font-medium mb-2">Members</h4>
                {Array.isArray(detail.members) && detail.members.length > 0 ? (
                  <ul className="space-y-1">
                    {detail.members.map((m) => (
                      <li key={m.character_id} className="text-blood-bone text-sm">
                        {m.name ?? m.character_id}
                        <span className="text-blood-muted">
                          {m.clan ? ` — ${m.clan}` : ''}
                          {m.concept ? ` — ${m.concept}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-blood-muted">No member data available yet.</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}