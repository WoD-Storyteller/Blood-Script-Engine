export default function ConvictionsPanel({
  convictions,
  touchstones,
}: {
  convictions: string[];
  touchstones: string[];
}) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm uppercase text-blood-crimson mb-2">
          Convictions
        </h3>
        <ul className="text-sm space-y-1">
          {convictions.map((c, i) => (
            <li key={i}>• {c}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-sm uppercase text-blood-crimson mb-2">
          Touchstones
        </h3>
        <ul className="text-sm space-y-1">
          {touchstones.map((t, i) => (
            <li key={i}>• {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}