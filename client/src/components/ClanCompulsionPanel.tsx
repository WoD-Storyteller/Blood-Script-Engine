export type ClanCompulsion = {
  clan: string;
  name: string;
  trigger: string;
  effect: string;
  active: boolean;
};

export default function ClanCompulsionPanel({ compulsion }: { compulsion: ClanCompulsion }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm uppercase tracking-wide text-blood-crimson mb-2">
        Clan Compulsion
      </h3>

      <div
        className={`p-4 rounded border ${
          compulsion.active
            ? 'bg-blood-dark border-blood-crimson shadow-[0_0_12px_rgba(180,0,0,0.4)]'
            : 'bg-blood-ash border-blood-red/40'
        }`}
      >
        <div className="flex justify-between mb-1">
          <span className="font-semibold">{compulsion.name}</span>
          <span className="text-xs uppercase">{compulsion.clan}</span>
        </div>

        <div className="text-sm text-blood-bone mb-2">
          <strong>Trigger:</strong> {compulsion.trigger}
        </div>

        <div className="text-sm text-blood-bone">
          <strong>Effect:</strong> {compulsion.effect}
        </div>
      </div>
    </div>
  );
}