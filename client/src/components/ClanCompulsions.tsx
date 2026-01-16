type ClanCompulsion = {
  clan: string;
  name: string;
  trigger: string;
  effect: string;
};

export default function ClanCompulsionPanel({
  compulsion,
  active,
}: {
  compulsion: ClanCompulsion;
  active: boolean;
}) {
  return (
    <div className="mt-6">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Clan Compulsion
      </h3>

      <div
        className={`p-4 rounded border ${
          active
            ? 'bg-blood-dark border-blood-crimson shadow-[0_0_12px_rgba(180,0,0,0.4)]'
            : 'bg-blood-ash border-blood-red/40'
        }`}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-lg">
            {compulsion.name}
          </span>

          <span
            className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${
              active
                ? 'bg-blood-crimson text-blood-bone'
                : 'bg-blood-dark text-blood-bone'
            }`}
          >
            {compulsion.clan}
          </span>
        </div>

        <div className="text-sm text-blood-bone mb-2">
          <span className="font-semibold text-blood-crimson">
            Trigger:
          </span>{' '}
          {compulsion.trigger}
        </div>

        <div className="text-sm text-blood-bone">
          <span className="font-semibold text-blood-crimson">
            Effect:
          </span>{' '}
          {compulsion.effect}
        </div>

        {active && (
          <div className="mt-3 text-xs text-blood-red uppercase tracking-wide">
            Compulsion Active
          </div>
        )}
      </div>
    </div>
  );
}