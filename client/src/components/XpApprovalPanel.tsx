import { useEffect, useState } from 'react';
import { approveXp, fetchPendingXp } from '../api';

function metaLine(meta: any) {
  if (!meta) return '—';
  const kind = meta.kind ?? '?';
  const key = meta.key ?? '?';
  const from = meta.from ?? '?';
  const to = meta.to ?? '?';
  return `${kind}: ${key} (${from} → ${to})`;
}

export default function XpApprovalPanel() {
  const [pending, setPending] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const rows = await fetchPendingXp();
      setPending(rows);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ marginTop: 16, border: '1px solid #ddd', padding: 12, borderRadius: 8 }}>
      <h3>Pending XP Approvals (ST)</h3>

      <button onClick={refresh}>Refresh</button>
      {error && <div style={{ marginTop: 8 }}>Error: {error}</div>}

      {pending.length === 0 ? (
        <p>No pending XP.</p>
      ) : (
        <div style={{ marginTop: 10 }}>
          {pending.map((p) => (
            <div key={p.xp_id} style={{ border: '1px solid #eee', padding: 10, borderRadius: 8, marginBottom: 10 }}>
              <div><strong>Request</strong>: {metaLine(p.meta)}</div>
              <div><strong>Amount</strong>: {p.amount}</div>
              <div><strong>Reason</strong>: {p.reason || '—'}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Character: {String(p.character_id).slice(0, 8)} • User: {String(p.user_id).slice(0, 8)}
              </div>

              <button
                style={{ marginTop: 8 }}
                onClick={async () => {
                  try {
                    const res: any = await approveXp(p.xp_id);
                    if (res?.ok) {
                      alert(res.alreadyApplied ? 'Already applied (idempotent).' : 'Approved + applied to sheet.');
                      setPending((x) => x.filter((y) => y.xp_id !== p.xp_id));
                    } else {
                      alert('Approval failed.');
                    }
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
              >
                Approve & Apply
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}