import './About.css';

export default function About() {
  return (
    <div className="about">
      <section className="page-header">
        <div className="container">
          <h1>About Blood Script Engine</h1>
          <p className="page-subtitle">
            Understanding what we are, what we're not, and why we built this.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container about-content">
          <div className="about-section">
            <h2>What is Blood Script Engine?</h2>
            <p>
              Blood Script Engine is a <strong>Discord-based game engine</strong> designed
              specifically for running Vampire: The Masquerade 5th Edition tabletop
              roleplaying games. It automates mechanical aspects of the game—dice rolling,
              character tracking, hunger mechanics—so Storytellers can focus on narrative.
            </p>
            <p>
              The engine runs entirely within Discord. Players interact through slash commands,
              and Storytellers manage their chronicles through both Discord and a companion
              web dashboard for oversight and administration.
            </p>
          </div>

          <div className="about-section">
            <h2>What Blood Script Engine is NOT</h2>
            <ul className="not-list">
              <li>
                <strong>Not a replacement for a Storyteller</strong> — The engine handles
                mechanics, but creative direction, narrative decisions, and table management
                remain human responsibilities.
              </li>
              <li>
                <strong>Not an AI dungeon master</strong> — While we may integrate AI tools
                for suggestions, the Storyteller always has final authority over the story.
              </li>
              <li>
                <strong>Not a video game</strong> — This is a tool for tabletop roleplaying,
                not an automated game experience.
              </li>
              <li>
                <strong>Not a data harvesting platform</strong> — We collect only what's
                necessary to run your games, and we're transparent about it.
              </li>
            </ul>
          </div>

          <div className="about-section">
            <h2>Our Philosophy</h2>

            <div className="philosophy-grid">
              <div className="philosophy-card">
                <h3>🛡️ Player Safety First</h3>
                <p>
                  Vampire: The Masquerade explores dark themes. We believe powerful
                  safety tools aren't optional—they're essential. Our integrated safety
                  card system, anonymous feedback channels, and Storyteller oversight
                  features ensure every player can engage comfortably.
                </p>
              </div>

              <div className="philosophy-card">
                <h3>👑 Storyteller Authority</h3>
                <p>
                  The engine serves the Storyteller, not the other way around. Storytellers
                  can override any mechanical decision, customize rules, and maintain full
                  control over their chronicle. The engine suggests; humans decide.
                </p>
              </div>

              <div className="philosophy-card">
                <h3>⚖️ Engine-Enforced Rules</h3>
                <p>
                  Consistent rule application builds trust. The engine handles dice math,
                  hunger tracking, and mechanical consequences impartially, freeing
                  Storytellers from accusations of favoritism and reducing cognitive load.
                </p>
              </div>

              <div className="philosophy-card">
                <h3>🔓 Transparency</h3>
                <p>
                  Players deserve to know how their data is used. Our privacy policy is
                  written in plain language, and we're committed to clear communication
                  about features, limitations, and roadmap.
                </p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2>Community & Development</h2>
            <p>
              Blood Script Engine is built by tabletop enthusiasts who run their own
              chronicles. We understand the unique challenges of online TTRPG play and
              build features based on real table experiences.
            </p>
            <p>
              We welcome feedback, feature suggestions, and bug reports. The roadmap
              is shaped by community needs, and we're committed to transparent development.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
