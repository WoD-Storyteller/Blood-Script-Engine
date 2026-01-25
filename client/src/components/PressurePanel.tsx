import { Pressure } from '../types';

export default function PressurePanel({ pressure }: { pressure: Pressure[] }) {
  return (
    <div className="card">
      <h2 className="card-header">Political Pressure</h2>
      {pressure.length === 0 ? (
        <p className="text-blood-muted">No active pressure.</p>
      ) : (
        <ul className="space-y-2">
          {pressure.map((p, i) => (
            <li key={i} className="p-3 bg-blood-dark rounded-lg flex items-start gap-3">
              <span className={`text-xs px-2 py-1 rounded font-bold ${
                p.severity >= 4 ? 'bg-red-900/30 text-red-400' :
                p.severity >= 2 ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-blood-ash text-blood-muted'
              }`}>
                {p.severity}
              </span>
              <div>
                <div className="text-blood-crimson font-medium text-sm">{p.source}</div>
                <div className="text-blood-bone text-sm mt-1">{p.description}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
