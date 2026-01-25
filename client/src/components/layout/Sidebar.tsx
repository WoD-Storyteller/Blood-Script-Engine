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
    <aside className="w-64 bg-blood-dark border-r border-blood-crimson/30 flex flex-col">
      <div className="px-6 py-5 border-b border-blood-crimson/30">
        <h1 className="text-lg tracking-wide font-semibold text-blood-crimson">
          Blood Script
        </h1>
        <p className="text-xs text-blood-muted mt-1">
          Chronicle Control
        </p>
      </div>

      <div className="px-6 py-4 border-b border-blood-crimson/30 text-sm">
        <div className="flex justify-between">
          <span className="text-blood-muted">Night</span>
          <span className="text-blood-bone">14</span>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-blood-muted">Masquerade</span>
          <span className="text-amber-400">Stable</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 text-sm">
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md transition
              ${
                isActive
                  ? 'bg-blood-ash text-blood-crimson border-l-2 border-blood-crimson'
                  : 'text-blood-bone hover:bg-blood-ash/50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-blood-crimson/30 text-sm">
        <p className="text-blood-muted text-xs mb-1">Active Character</p>
        <p className="font-medium text-blood-bone">Elena Voss</p>
        <p className="text-xs text-blood-muted">Toreador</p>

        <div className="mt-2 text-xs text-blood-bone">
          Hunger ••<br />
          Willpower ••
        </div>
      </div>
    </aside>
  );
}
