type Props = {
  label: string;
  value: number;
  max?: number;
};

export default function AttributeDots({
  label,
  value,
  max = 5,
}: Props) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm uppercase tracking-wide text-blood-bone">
        {label}
      </span>

      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < value;

          return (
            <div
              key={i}
              className={`
                w-3 h-3 rounded-full border
                ${
                  filled
                    ? 'bg-blood-crimson border-blood-red'
                    : 'bg-blood-dark border-blood-red/40'
                }
              `}
            />
          );
        })}
      </div>
    </div>
  );
}