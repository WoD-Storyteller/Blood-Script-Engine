import './HelpSafety.css';

export default function HelpSafety() {
  return (
    <div className="help-safety">
      <section className="page-header safety-header">
        <div className="container">
          <h1>Help & Safety</h1>
          <p className="page-subtitle">
            Your safety and wellbeing are our priority. Learn about our safety tools
            and find help when you need it.
          </p>
        </div>
      </section>

      <section className="safety-section section">
        <div className="container safety-content">
          <h2>Safety Card System</h2>
          <p className="intro-text">
            Vampire: The Masquerade explores mature themes. Our integrated safety card
            system gives every player a voice, even when speaking up feels difficult.
          </p>

          <div className="safety-cards">
            <div className="safety-card green">
              <div className="card-header">
                <span className="card-icon">🟢</span>
                <h3>Green Card</h3>
              </div>
              <p>
                <strong>"I'm comfortable. Keep going."</strong>
              </p>
              <p>
                Use when you're engaged and enjoying the scene. Helps Storytellers
                know they're on the right track.
              </p>
            </div>

            <div className="safety-card yellow">
              <div className="card-header">
                <span className="card-icon">🟡</span>
                <h3>Yellow Card</h3>
              </div>
              <p>
                <strong>"Slow down. Approaching my limit."</strong>
              </p>
              <p>
                Use when content is making you uncomfortable. The scene will adjust
                direction. No explanation required.
              </p>
            </div>

            <div className="safety-card red">
              <div className="card-header">
                <span className="card-icon">🔴</span>
                <h3>Red Card</h3>
              </div>
              <p>
                <strong>"Stop immediately. This content needs to end."</strong>
              </p>
              <p>
                Use when you've reached your limit. The scene stops. No questions asked.
                Your comfort is non-negotiable.
              </p>
            </div>
          </div>

          <div className="safety-info">
            <h3>How Safety Cards Work</h3>
            <ol>
              <li>
                <strong>Private Submission</strong> — Send a DM to the Blood Script bot
                with your safety card. Your submission is private by default.
              </li>
              <li>
                <strong>Immediate Action</strong> — Yellow and Red cards trigger
                automatic scene adjustments. Storytellers are notified appropriately.
              </li>
              <li>
                <strong>Anonymous Option</strong> — You can submit cards anonymously.
                Storytellers see that a card was played, but not by whom.
              </li>
              <li>
                <strong>Follow-Up Available</strong> — Storytellers can reach out
                privately if you've opted in. Otherwise, your privacy is protected.
              </li>
            </ol>
          </div>

          <div className="safety-promise">
            <h3>Our Promise</h3>
            <ul>
              <li>Safety cards are never questioned or challenged.</li>
              <li>You will never be pressured to explain your boundaries.</li>
              <li>Retaliation for using safety tools is grounds for removal.</li>
              <li>Your safety data is never shared outside your chronicle's Storytellers.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="help-section section">
        <div className="container">
          <h2 className="section-title">Common Issues</h2>
          <p className="section-subtitle">
            Quick solutions to frequently encountered problems.
          </p>

          <div className="help-grid">
            <div className="help-item">
              <h3>Bot Not Responding</h3>
              <ul>
                <li>Check that the bot is online (green dot in member list)</li>
                <li>Verify bot permissions in channel settings</li>
                <li>Try the command in a different channel</li>
                <li>Ensure you've run <code>/engine setup</code> first</li>
              </ul>
            </div>

            <div className="help-item">
              <h3>Can't Access Companion Dashboard</h3>
              <ul>
                <li>Make sure you're logging in with the correct Discord account</li>
                <li>Verify you have Storyteller or Owner role in the chronicle</li>
                <li>Try clearing your browser cache and cookies</li>
                <li>Check that cookies are enabled in your browser</li>
              </ul>
            </div>

            <div className="help-item">
              <h3>Commands Show "Permission Denied"</h3>
              <ul>
                <li>Some commands are restricted by role (Player/ST/Owner)</li>
                <li>Use <code>/whoami</code> to check your current role</li>
                <li>Ask the Owner to adjust your permissions if needed</li>
              </ul>
            </div>

            <div className="help-item">
              <h3>Character Not Showing Up</h3>
              <ul>
                <li>Ensure the character was created in this chronicle</li>
                <li>Check if the character is marked as active</li>
                <li>Try <code>/character list</code> to see all your characters</li>
              </ul>
            </div>

            <div className="help-item">
              <h3>Dice Rolls Look Wrong</h3>
              <ul>
                <li>Hunger dice are shown separately from regular dice</li>
                <li>Criticals require pairs of 10s (one must be non-hunger)</li>
                <li>Messy criticals occur when hunger dice contribute to the pair</li>
              </ul>
            </div>

            <div className="help-item">
              <h3>Need More Help?</h3>
              <ul>
                <li>Check the <a href="/docs">Documentation</a> for detailed guides</li>
                <li>Contact your chronicle's Storyteller or Owner</li>
                <li>Report bugs through the official support channels</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="support-section section">
        <div className="container support-content">
          <h2>Getting Support</h2>
          <p>
            If you're experiencing issues that aren't covered above, or if you need
            to report a serious concern:
          </p>
          <ul>
            <li>
              <strong>Chronicle Issues:</strong> Contact your Storyteller or Owner
              through Discord.
            </li>
            <li>
              <strong>Technical Problems:</strong> Check the Status page for known
              issues, then reach out through official channels.
            </li>
            <li>
              <strong>Safety Concerns:</strong> Use the safety card system for
              in-game issues. For serious concerns about another player's behavior,
              contact the Owner directly.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
