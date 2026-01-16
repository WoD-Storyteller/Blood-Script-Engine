import { Link } from 'react-router-dom';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title">
            <span className="hero-accent">Blood Script Engine</span>
            <br />
            Discord-First VTM V5 Storytelling
          </h1>
          <p className="hero-subtitle">
            A powerful, safety-first game engine for Vampire: The Masquerade 5th Edition.
            Run your chronicles entirely through Discord with intelligent automation,
            comprehensive safety tools, and seamless player experiences.
          </p>
          <div className="hero-actions">
            <a
              href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add Bot to Discord
            </a>
            <Link to="/get-started" className="btn btn-secondary">
              Storyteller Guide
            </Link>
          </div>
        </div>
      </section>

      <section className="features section">
        <div className="container">
          <h2 className="section-title">Why Blood Script?</h2>
          <p className="section-subtitle">
            Built by Storytellers, for Storytellers. Every feature designed with player safety in mind.
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Discord-First</h3>
              <p>
                All gameplay happens in Discord. Slash commands for everything—dice rolls,
                character sheets, scenes, and more. No browser tabs, no context switching.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🦇</div>
              <h3>VTM V5 Native</h3>
              <p>
                Built specifically for Vampire: The Masquerade 5th Edition. Hunger dice,
                compulsions, resonance tracking, and all the mechanics you need.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🛡️</div>
              <h3>Safety First</h3>
              <p>
                Integrated safety card system (Green/Yellow/Red). Anonymous player feedback,
                private DM support, and Storyteller oversight. Your table's safety matters.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Companion Dashboard</h3>
              <p>
                Web-based oversight for Storytellers. Manage characters, review safety events,
                track chronicles, and export your campaign data—all from one place.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Automated Mechanics</h3>
              <p>
                Let the engine handle dice pools, hunger tracking, humanity checks,
                and bookkeeping. Focus on the story, not the spreadsheet.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Privacy Focused</h3>
              <p>
                Minimal data collection. Your chronicles stay yours. Clear data policies
                and transparent handling of player information.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section section">
        <div className="container cta-content">
          <h2>Ready to Start Your Chronicle?</h2>
          <p>
            Set up Blood Script Engine in your Discord server in under 5 minutes.
          </p>
          <div className="cta-actions">
            <Link to="/get-started" className="btn btn-primary">
              Get Started
            </Link>
            <Link to="/docs" className="btn btn-secondary">
              View Documentation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
