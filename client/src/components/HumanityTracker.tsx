type Props = {
  humanity: number;
  stains: number;
};

export default function HumanityTracker({ humanity, stains }: Props) {
  const max = 10;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm uppercase tracking-wide text-blood-crimson">
          Humanity
        </h3>
        <span className="text-xs text-blood-bone">
          {humanity} / {max}
        </span>
      </div>

      <div className="flex gap-1 mb-2">
        {Array.from({ length: max }).map((_, i) => {
          const active = i < humanity;
          return (
            <div
              key={i}
              className={`w-4 h-4 rounded border ${
                active
                  ? 'bg-blood-bone border-blood-bone'
                  : 'bg-blood-dark border-blood-red/40'
              }`}
            />
          );
        })}
      </div>

      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => {
          const stained = i < stains;
          return (
            <div
              key={i}
              className={`w-4 h-1 rounded ${
                stained ? 'bg-blood-red' : 'bg-blood-dark'
              }`}
            />
          );
        })}
      </div>

      <div className="mt-1 text-xs text-blood-bone">
        Stains
      </div>
    </div>
  );
}