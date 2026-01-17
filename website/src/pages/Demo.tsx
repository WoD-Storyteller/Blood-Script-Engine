import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/demo.css';

interface Clock {
  id: string;
  title: string;
  segments: number;
  filled: number;
}

interface Character {
  id: string;
  name: string;
  clan: string;
  hunger: number;
  willpower: number;
  health: number;
  humanity: number;
}

const DEMO_CHARACTER: Character = {
  id: '1',
  name: 'Elena Voss',
  clan: 'Toreador',
  hunger: 2,
  willpower: 4,
  health: 7,
  humanity: 7,
};

const DEMO_CLOCKS: Clock[] = [
  { id: '1', title: 'SI Investigation', segments: 6, filled: 2 },
  { id: '2', title: 'Blood Hunt Countdown', segments: 4, filled: 1 },
  { id: '3', title: 'Masquerade Breach', segments: 8, filled: 5 },
];

const DEMO_NPCS = [
  { id: '1', name: 'Prince Marcus', role: 'Ventrue Prince', location: 'Elysium' },
  { id: '2', name: 'Rosa Chen', role: 'Tremere Primogen', location: 'Chantry' },
  { id: '3', name: 'Viktor Petrov', role: 'Nosferatu Informant', location: 'Warrens' },
];

function ClockDisplay({ clock }: { clock: Clock }) {
  const segments = [];
  for (let i = 0; i < clock.segments; i++) {
    segments.push(
      <div
        key={i}
        className={`clock-segment ${i < clock.filled ? 'filled' : ''}`}
      />
    );
  }
  return (
    <div className="clock-card">
      <div className="clock-title">{clock.title}</div>
      <div className="clock-segments">{segments}</div>
      <div className="clock-label">{clock.filled}/{clock.segments}</div>
    </div>
  );
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const dots = [];
  for (let i = 0; i < max; i++) {
    dots.push(
      <span
        key={i}
        className={`stat-dot ${i < value ? 'filled' : ''}`}
        style={{ backgroundColor: i < value ? color : 'transparent' }}
      />
    );
  }
  return (
    <div className="stat-bar">
      <span className="stat-label">{label}</span>
      <div className="stat-dots">{dots}</div>
    </div>
  );
}

export default function Demo() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'world' | 'characters' | 'npcs' | 'storyteller'>('world');

  const exitDemo = () => {
    navigate('/');
  };

  return (
    <div className="demo-container">
      <div className="demo-banner">
        <span>Demo Mode - Preview with sample data</span>
        <button onClick={exitDemo} className="exit-demo-btn">
          Exit Demo
        </button>
      </div>

      <div className="demo-content">
        <header className="demo-header">
          <h1>Blood Script</h1>
          <p className="subtitle">Chronicle Control</p>
        </header>

        <section className="demo-section">
          <div className="chronicle-info">
            <span className="night-counter">Night 14</span>
            <span className="masquerade-status">Masquerade: Stable</span>
          </div>
        </section>

        {activeTab === 'world' && (
          <>
            <section className="demo-section">
              <h2>Active Character</h2>
              <div className="character-card">
                <div className="character-name">{DEMO_CHARACTER.name}</div>
                <div className="character-clan">{DEMO_CHARACTER.clan}</div>
                <StatBar label="Hunger" value={DEMO_CHARACTER.hunger} max={5} color="#c41e3a" />
                <StatBar label="Willpower" value={DEMO_CHARACTER.willpower} max={5} color="#4a90d9" />
                <StatBar label="Health" value={DEMO_CHARACTER.health} max={10} color="#2d5a27" />
                <StatBar label="Humanity" value={DEMO_CHARACTER.humanity} max={10} color="#d4af37" />
              </div>
            </section>

            <section className="demo-section">
              <h2>Active Clocks</h2>
              <div className="clocks-grid">
                {DEMO_CLOCKS.map(clock => (
                  <ClockDisplay key={clock.id} clock={clock} />
                ))}
              </div>
            </section>

            <section className="demo-section">
              <h2>World State</h2>
              <div className="world-info">
                <p>Current night overview and chronicle status would appear here with real data.</p>
              </div>
            </section>
          </>
        )}

        {activeTab === 'characters' && (
          <section className="demo-section">
            <h2>Characters</h2>
            <div className="character-list">
              <div className="character-card active">
                <div className="character-name">{DEMO_CHARACTER.name}</div>
                <div className="character-clan">{DEMO_CHARACTER.clan}</div>
                <StatBar label="Hunger" value={DEMO_CHARACTER.hunger} max={5} color="#c41e3a" />
              </div>
              <div className="character-card">
                <div className="character-name">Marcus Steel</div>
                <div className="character-clan">Brujah</div>
                <StatBar label="Hunger" value={3} max={5} color="#c41e3a" />
              </div>
              <div className="character-card">
                <div className="character-name">Sofia Night</div>
                <div className="character-clan">Malkavian</div>
                <StatBar label="Hunger" value={1} max={5} color="#c41e3a" />
              </div>
            </div>
          </section>
        )}

        {activeTab === 'npcs' && (
          <section className="demo-section">
            <h2>NPCs</h2>
            <div className="npc-list">
              {DEMO_NPCS.map(npc => (
                <div key={npc.id} className="npc-card">
                  <div className="npc-name">{npc.name}</div>
                  <div className="npc-role">{npc.role}</div>
                  <div className="npc-location">{npc.location}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'storyteller' && (
          <section className="demo-section">
            <h2>Storyteller Tools</h2>
            <div className="st-tools">
              <div className="st-tool-card">
                <h3>AI Settings</h3>
                <p>Configure AI narration, NPC voicing, and tone for your chronicle.</p>
              </div>
              <div className="st-tool-card">
                <h3>NPC Management</h3>
                <p>Batch import, portraits, and webhook configuration for AI voicing.</p>
              </div>
              <div className="st-tool-card">
                <h3>Chronicle Templates</h3>
                <p>Import storylines, quests, factions, and locations from JSON.</p>
              </div>
              <div className="st-tool-card">
                <h3>Safety Oversight</h3>
                <p>Monitor safety events and respond to player concerns.</p>
              </div>
            </div>
          </section>
        )}
      </div>

      <nav className="demo-nav">
        <button
          className={`nav-tab ${activeTab === 'world' ? 'active' : ''}`}
          onClick={() => setActiveTab('world')}
        >
          <span className="nav-icon">🌍</span>
          <span className="nav-label">World</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'characters' ? 'active' : ''}`}
          onClick={() => setActiveTab('characters')}
        >
          <span className="nav-icon">🧛</span>
          <span className="nav-label">Characters</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'npcs' ? 'active' : ''}`}
          onClick={() => setActiveTab('npcs')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">NPCs</span>
        </button>
        <button
          className={`nav-tab ${activeTab === 'storyteller' ? 'active' : ''}`}
          onClick={() => setActiveTab('storyteller')}
        >
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">Storyteller</span>
        </button>
      </nav>
    </div>
  );
}
