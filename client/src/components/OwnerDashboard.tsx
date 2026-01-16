import { useEffect, useState } from 'react';
import {
  listEngines,
  banEngine,
  unbanEngine,
  issueStrike,
  listAppeals,
  resolveAppeal,
} from '../api/owner';

export default function OwnerDashboard() {
  const [engines, setEngines] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<any[]>([]);

  const load = async () => {
    const e = await listEngines();
    const a = await listAppeals();
    setEngines(e.engines || []);
    setAppeals(a.appeals || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2>Owner Dashboard</h2>

      {/* APPEALS */}
      <h3>Appeals</h3>
      <table width="100%" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Engine</th>
            <th>Submitted By</th>
            <th>Message</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appeals.map((a) => (
            <tr key={a.appeal_id} style={{ borderTop: '1px solid #333' }}>
              <td>{a.engine_id}</td>
              <td>{a.display_name}</td>
              <td style={{ maxWidth: 400 }}>{a.message}</td>
              <td>{a.resolved ? 'Resolved' : 'Open'}</td>
              <td>
                {!a.resolved && (
                  <button
                    onClick={async () => {
                      const resolutionReason =
                        prompt('Resolution reason') || 'Appeal reviewed';
                      const ownerNotes =
                        prompt('Owner notes (private)') || '';
                      const unban = confirm(
                        'Unban engine as part of this resolution?',
                      );

                      await resolveAppeal(
                        a.appeal_id,
                        resolutionReason,
                        ownerNotes,
                        unban,
                      );
                      await load();
                    }}
                  >
                    Resolve
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}