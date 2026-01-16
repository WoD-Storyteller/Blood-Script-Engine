type Ritual = {
  name: string;
  level: number;
  effect: string;
};

export default function RitualsPanel({ rituals }: { rituals: Ritual[] }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Rituals
      </h3>

      <div className="space-y-2">
        {rituals.map((r, i) => (
          <div
            key={i}
            className="p-3 bg-blood-ash rounded border border-blood-red/40"
          >
            <div className="flex justify-between mb-1">
              <span className="font-medium">{r.name}</span>
              <span className="text-xs">Level {r.level}</span>
            </div>
            <div className="text-sm text-blood-bone">{r.effect}</div>
          </div>
        ))}
      </div>
    </div>
  );
}