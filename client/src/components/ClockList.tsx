import { Clock } from '../types';

export default function ClockList({ clocks }: { clocks: Clock[] }) {
  return (
    <div className="card">
      <h2 className="card-header">Story Clocks</h2>
      {clocks.length === 0 ? (
        <p className="text-blood-muted">No clocks yet.</p>
      ) : (
        <ul className="space-y-3">
          {clocks.map((c) => (
            <li key={c.clock_id} className="p-3 bg-blood-dark rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-blood-bone font-medium">{c.title}</span>
                {c.nightly && <span className="text-xs text-blood-muted">(nightly)</span>}
              </div>
              <div className="flex gap-1">
                {Array.from({ length: c.segments }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-3 flex-1 rounded ${
                      i < c.progress ? 'bg-blood-crimson' : 'bg-blood-ash'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-blood-muted mt-1 text-right">
                {c.progress}/{c.segments}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}