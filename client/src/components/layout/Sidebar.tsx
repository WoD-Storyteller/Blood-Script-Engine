import { NavLink } from 'react-router-dom';

const nav = [
  { label: 'World', to: '/' },
  { label: 'Characters', to: '/characters' },
  { label: 'Coteries', to: '/coteries' },
  { label: 'Scenes', to: '/scenes' },
  { label: 'Dice', to: '/dice' },
  { label: 'XP', to: '/xp' },
  { label: 'Safety', to: '/safety' },
  { label: 'Occult', to: '/occult' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-neutral-800">
        <h1 className="text-lg tracking-wide font-semibold text-red-600">
          Blood Script
        </h1>
        <p className="text-xs text-neutral-400 mt-1">
          Chronicle Control
        </p>
      </div>

      {/* Chronicle status */}
      <div className="px-6 py-4 border-b border-neutral-800 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-400">Night</span>
          <span>🌑 14</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-neutral-400">Masquerade</span>
          <span className="text-amber-400">Stable</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md transition
              ${
                isActive
                  ? 'bg-neutral-800 text-red-500'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Active character */}
      <div className="px-6 py-4 border-t border-neutral-800 text-sm">
        <p className="text-neutral-400 text-xs mb-1">Active Character</p>
        <p className="font-medium">Elena Voss</p>
        <p className="text-xs text-neutral-400">Toreador</p>

        <div className="mt-2 text-xs">
          Hunger •• <br />
          Willpower ••
        </div>
      </div>
    </aside>
  );
}
