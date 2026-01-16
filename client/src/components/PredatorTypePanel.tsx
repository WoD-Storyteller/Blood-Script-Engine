export default function PredatorTypePanel({
  predator,
}: {
  predator: string;
}) {
  if (!predator) return null;

  return (
    <div className="mb-6 p-3 bg-blood-dark rounded border border-blood-red/40">
      <div className="text-xs uppercase text-blood-crimson mb-1">
        Predator Type
      </div>
      <div className="text-sm font-medium">
        {predator}
      </div>
    </div>
  );
}