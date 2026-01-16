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
    <div style={{ marginTop: 12 }}>
      <h2>Coteries</h2>
      {error && <div style={{ marginBottom: 12 }}>Error: {error}</div>}

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ width: '40%' }}>
          {list.length === 0 ? (
            <p>No coteries yet.</p>
          ) : (
            <ul>
              {list.map((c) => (
                <li key={c.coterie_id} style={{ marginBottom: 8 }}>
                  <button onClick={() => setSelectedId(c.coterie_id)}>{c.name}</button>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    {c.type ? c.type : 'Unknown type'}
                    {c.domain ? ` — ${c.domain}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ width: '60%' }}>
          <h3>Details</h3>
          {!selectedId && <p>Select a coterie to view details.</p>}
          {selectedId && !detail && <p>Loading…</p>}

          {detail && (
            <>
              <pre style={{ whiteSpace: 'pre-wrap', background: '#111', color: '#eee', padding: 12 }}>
                {JSON.stringify({ ...detail, members: undefined }, null, 2)}
              </pre>

              <h4>Members</h4>
              {Array.isArray(detail.members) && detail.members.length > 0 ? (
                <ul>
                  {detail.members.map((m) => (
                    <li key={m.character_id}>
                      {m.name ?? m.character_id}
                      {m.clan ? ` — ${m.clan}` : ''}
                      {m.concept ? ` — ${m.concept}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No member data available yet.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}