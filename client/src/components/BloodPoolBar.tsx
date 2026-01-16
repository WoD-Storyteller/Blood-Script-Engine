export default function BloodPoolBar({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const percent = Math.max(0, Math.min(100, (current / max) * 100));

  return (
    <div>
      <div className="flex justify-between text-xs uppercase text-blood-bone mb-1">
        <span>Blood</span>
        <span>
          {current} / {max}
        </span>
      </div>

      <div className="h-2 rounded bg-blood-dark overflow-hidden border border-blood-red/40">
        <div
          className="h-full bg-gradient-to-r from-blood-red to-blood-crimson transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}