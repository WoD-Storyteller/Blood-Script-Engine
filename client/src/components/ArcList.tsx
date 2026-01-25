import { Arc } from '../types';

export default function ArcList({ arcs }: { arcs: Arc[] }) {
  return (
    <div className="card">
      <h2 className="card-header">Chronicle Arcs</h2>
      {arcs.length === 0 ? (
        <p className="text-blood-muted">No arcs yet.</p>
      ) : (
        <ul className="space-y-2">
          {arcs.map((a) => (
            <li key={a.arc_id} className="flex justify-between items-center p-2 bg-blood-dark rounded">
              <span className="text-blood-bone">{a.title}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                a.status === 'active' ? 'bg-blood-crimson/20 text-blood-crimson' :
                a.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                'bg-blood-ash text-blood-muted'
              }`}>
                {a.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}