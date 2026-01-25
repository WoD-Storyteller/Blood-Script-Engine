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
    <div className="card mt-4">
      <h3 className="card-header">Pending XP Approvals (ST)</h3>

      <button className="btn-secondary mb-4" onClick={refresh}>Refresh</button>
      {error && <div className="text-red-400 mb-2">Error: {error}</div>}

      {pending.length === 0 ? (
        <p className="text-blood-muted">No pending XP.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <div key={p.xp_id} className="bg-blood-dark p-4 rounded-lg border border-blood-crimson/20">
              <div className="text-blood-bone"><strong className="text-blood-crimson">Request</strong>: {metaLine(p.meta)}</div>
              <div className="text-blood-bone"><strong className="text-blood-crimson">Amount</strong>: {p.amount}</div>
              <div className="text-blood-bone"><strong className="text-blood-crimson">Reason</strong>: {p.reason || '—'}</div>
              <div className="text-xs text-blood-muted mt-2">
                Character: {String(p.character_id).slice(0, 8)} • User: {String(p.user_id).slice(0, 8)}
              </div>

              <button
                className="btn-primary mt-3 text-sm"
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