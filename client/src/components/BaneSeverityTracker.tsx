type Props = {
  baneSeverity: number;
  description: string;
};

export default function BaneSeverityTracker({
  severity,
  description,
}: {
  severity: number;
  description: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Bane Severity
      </h3>

      <div className="flex gap-2 mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full border ${
              i < severity
                ? 'bg-blood-crimson border-blood-red shadow-[0_0_8px_rgba(180,0,0,0.6)]'
                : 'bg-blood-dark border-blood-red/40'
            }`}
          />
        ))}
      </div>

      <div className="text-sm text-blood-bone bg-blood-dark p-3 rounded border border-blood-red/40">
        {description}
      </div>
    </div>
  );
}
          return (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border transition-all ${
                active
                  ? 'bg-blood-crimson border-blood-red shadow-[0_0_8px_rgba(180,0,0,0.6)]'
                  : 'bg-blood-dark border-blood-red/40'
              }`}
            />
          );
        })}
      </div>

      <div className="p-3 bg-blood-dark rounded border border-blood-red/40 text-sm text-blood-bone">
        {description}
      </div>
    </div>
  );
}