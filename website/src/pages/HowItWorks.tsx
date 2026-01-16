import { Link } from 'react-router-dom';
import './HowItWorks.css';

export default function HowItWorks() {
  return (
    <div className="how-it-works">
      <section className="page-header">
        <div className="container">
          <h1>How It Works</h1>
          <p className="page-subtitle">
            From Discord server to active chronicle in five clear steps.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container flow-content">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h2>Set Up Your Discord Server</h2>
              <p>
                Create a Discord server for your chronicle (or use an existing one).
                Organize channels however you prefer—the bot adapts to your structure.
              </p>
              <div className="step-tip">
                <strong>Tip:</strong> Consider separate channels for in-character roleplay,
                out-of-character chat, and dice rolls.
              </div>
            </div>
          </div>

          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h2>Invite Blood Script Bot</h2>
              <p>
                Add the Blood Script bot to your server using our invite link. The bot
                requests only the permissions it needs to function—slash commands and
                basic message access.
              </p>
              <a
                href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
                className="btn btn-primary"
                target="_blank"
                rel="noopener noreferrer"
              >
                Add Bot to Discord
              </a>
            </div>
          </div>

          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h2>Initialize Your Engine</h2>
              <p>
                Run <code>/engine setup</code> to create your chronicle. This registers
                your server, makes you the Owner, and enables all game features.
              </p>
              <div className="command-example">
                <code>/engine setup</code>
                <span className="command-desc">Initialize Blood Script in this server</span>
              </div>
            </div>
          </div>

          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h2>Create Characters & Start Play</h2>
              <p>
                Players create characters with <code>/character create</code>. Storytellers
                can assign roles, set up scenes, and begin the chronicle. All gameplay
                happens through Discord slash commands.
              </p>
              <div className="command-example">
                <code>/character create</code>
                <span className="command-desc">Create a new vampire character</span>
              </div>
              <div className="command-example">
                <code>/roll pool:6 hunger:2</code>
                <span className="command-desc">Roll dice with hunger</span>
              </div>
            </div>
          </div>

          <div className="flow-step">
            <div className="step-number">5</div>
            <div className="step-content">
              <h2>Manage with Companion Dashboard</h2>
              <p>
                Storytellers and Owners can access the web-based Companion dashboard
                for oversight tasks—reviewing safety events, managing XP approvals,
                exporting chronicle data, and more.
              </p>
              <p className="step-note">
                The Companion is for management only. All actual gameplay stays in Discord.
              </p>
              <Link to="/docs" className="btn btn-secondary">
                Learn More in Docs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="roles-section section">
        <div className="container">
          <h2 className="section-title">Understanding Roles</h2>
          <p className="section-subtitle">
            Blood Script uses three permission levels to manage your chronicle.
          </p>

          <div className="roles-grid">
            <div className="role-card">
              <h3>👤 Player</h3>
              <p>
                The default role. Players can create characters, roll dice, participate
                in scenes, and submit safety feedback. They see their own character data.
              </p>
            </div>

            <div className="role-card">
              <h3>📖 Storyteller</h3>
              <p>
                Storytellers manage the chronicle. They can create NPCs, start scenes,
                award XP, respond to safety events, and access the Companion dashboard.
              </p>
            </div>

            <div className="role-card">
              <h3>👑 Owner</h3>
              <p>
                The person who ran <code>/engine setup</code>. Has full control including
                assigning Storytellers, server configuration, and data management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
