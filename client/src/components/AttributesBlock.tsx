import AttributeDots from './AttributeDots';

export default function AttributesBlock({ sheet }: { sheet: any }) {
  const attrs = sheet.attributes ?? {};

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* PHYSICAL */}
      <div>
        <h4 className="text-sm font-semibold text-blood-crimson mb-3 uppercase">
          Physical
        </h4>

        <div className="space-y-2">
          <AttributeDots label="Strength" value={attrs.strength ?? 1} />
          <AttributeDots label="Dexterity" value={attrs.dexterity ?? 1} />
          <AttributeDots label="Stamina" value={attrs.stamina ?? 1} />
        </div>
      </div>

      {/* SOCIAL */}
      <div>
        <h4 className="text-sm font-semibold text-blood-crimson mb-3 uppercase">
          Social
        </h4>

        <div className="space-y-2">
          <AttributeDots label="Charisma" value={attrs.charisma ?? 1} />
          <AttributeDots label="Manipulation" value={attrs.manipulation ?? 1} />
          <AttributeDots label="Composure" value={attrs.composure ?? 1} />
        </div>
      </div>

      {/* MENTAL */}
      <div>
        <h4 className="text-sm font-semibold text-blood-crimson mb-3 uppercase">
          Mental
        </h4>

        <div className="space-y-2">
          <AttributeDots label="Intelligence" value={attrs.intelligence ?? 1} />
          <AttributeDots label="Wits" value={attrs.wits ?? 1} />
          <AttributeDots label="Resolve" value={attrs.resolve ?? 1} />
        </div>
      </div>
    </div>
  );
}