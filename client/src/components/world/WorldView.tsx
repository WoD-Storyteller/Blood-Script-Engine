export default function WorldView() {
  return (
    <div className="p-8 space-y-10">
      {/* Header */}
      <header>
        <h2 className="text-2xl font-semibold tracking-wide">
          World State
        </h2>
        <p className="text-neutral-400 text-sm mt-1">
          Current night overview
        </p>
      </header>

      {/* Map */}
      <section>
        <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-3">
          Map
        </h3>
        <div className="h-64 bg-neutral-800 border border-neutral-700 rounded-lg flex items-center justify-center text-neutral-500">
          Map Placeholder
        </div>
      </section>

      {/* Clocks */}
      <section>
        <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-3">
          Active Clocks
        </h3>
        <div className="space-y-2">
          <Clock title="Investigation" current={4} max={6} />
          <Clock title="Masquerade Pressure" current={2} max={5} />
        </div>
      </section>

      {/* Events */}
      <section>
        <h3 className="text-sm uppercase tracking-wider text-neutral-400 mb-3">
          Recent Events
        </h3>
        <ul className="space-y-2 text-sm">
          <li>• Feeding incident reported</li>
          <li>• XP request submitted</li>
          <li>• Safety flag raised</li>
        </ul>
      </section>
    </div>
  );
}

function Clock({
  title,
  current,
  max,
}: {
  title: string;
  current: number;
  max: number;
}) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-md p-4">
      <div className="flex justify-between text-sm mb-2">
        <span>{title}</span>
        <span>
          {current} / {max}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded ${
              i < current ? 'bg-red-600' : 'bg-neutral-700'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
