type Props = {
  current: number;
  superficial: number;
  aggravated: number;
};

export default function WillpowerTracker({
  current,
  superficial,
  aggravated,
}: Props) {
  const max = current + superficial + aggravated;

  return (
    <div>
      <div className="text-sm uppercase tracking-wide text-blood-crimson mb-1">
        Willpower
      </div>

      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => {
          let color = 'bg-blood-dark';

          if (i < aggravated) color = 'bg-black';
          else if (i < aggravated + superficial) color = 'bg-blood-red';

          return (
            <div
              key={i}
              className={`w-4 h-4 border border-blood-red/40 rounded ${color}`}
            />
          );
        })}
      </div>
    </div>
  );
}