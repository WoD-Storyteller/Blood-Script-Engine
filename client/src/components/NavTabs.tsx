export type TabKey = 'world' | 'characters' | 'coteries' | 'admin';

const tabIcons: Record<TabKey, string> = {
  world: '🌍',
  characters: '🧛',
  coteries: '👥',
  admin: '⚙️',
};

const tabLabels: Record<TabKey, string> = {
  world: 'World',
  characters: 'Characters',
  coteries: 'Coteries',
  admin: 'Storyteller',
};

export default function NavTabs({
  tab,
  onChange,
  showAdmin,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
  showAdmin: boolean;
}) {
  const tabs: TabKey[] = showAdmin
    ? ['world', 'characters', 'coteries', 'admin']
    : ['world', 'characters', 'coteries'];

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-around',
        background: '#1a1a2e',
        borderTop: '1px solid #333',
        padding: '8px 0',
        zIndex: 1000,
      }}
    >
      {tabs.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            padding: '8px 0',
            background: 'transparent',
            border: 'none',
            color: tab === key ? '#c41e3a' : '#888',
            cursor: 'pointer',
            transition: 'color 0.2s',
          }}
        >
          <span style={{ fontSize: 20 }}>{tabIcons[key]}</span>
          <span style={{ fontSize: 11, fontWeight: tab === key ? 600 : 400 }}>
            {tabLabels[key]}
          </span>
        </button>
      ))}
    </nav>
  );
}
