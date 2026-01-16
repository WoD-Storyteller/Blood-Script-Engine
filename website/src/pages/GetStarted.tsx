import './GetStarted.css';

export default function GetStarted() {
  return (
    <div className="get-started">
      <section className="page-header">
        <div className="container">
          <h1>Get Started</h1>
          <p className="page-subtitle">
            Step-by-step guide to setting up Blood Script Engine in your Discord server.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container guide-content">
          <div className="guide-step">
            <h2>Step 1: Invite the Bot</h2>
            <p>
              Click the button below to add Blood Script Engine to your Discord server.
              You'll need the "Manage Server" permission on the target server.
            </p>
            <a
              href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands"
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Add to Discord
            </a>
          </div>

          <div className="guide-step">
            <h2>Step 2: Run Engine Setup</h2>
            <p>
              In any channel where the bot can see messages, run the setup command.
              This initializes your chronicle and makes you the Owner.
            </p>
            <div className="command-box">
              <code>/engine setup</code>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText('/engine setup')}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="guide-step">
            <h2>Step 3: Start a Chronicle</h2>
            <p>
              Create your first chronicle. Give it a name that reflects your story.
            </p>
            <div className="command-box">
              <code>/chronicle create name:Chicago by Night</code>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText('/chronicle create name:Chicago by Night')}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="guide-step">
            <h2>Step 4: Invite Players</h2>
            <p>
              Share your Discord server invite with your players. When they join,
              they can create characters using:
            </p>
            <div className="command-box">
              <code>/character create</code>
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText('/character create')}
              >
                Copy
              </button>
            </div>
          </div>

          <div className="guide-step">
            <h2>Step 5: Begin Play</h2>
            <p>
              You're ready! Use slash commands to run scenes, roll dice, and manage
              your chronicle. Here are some essential commands:
            </p>

            <div className="commands-list">
              <div className="command-item">
                <code>/roll pool:5 hunger:2</code>
                <span>Roll dice with hunger</span>
              </div>
              <div className="command-item">
                <code>/scene start location:Elysium</code>
                <span>Start a scene</span>
              </div>
              <div className="command-item">
                <code>/character sheet</code>
                <span>View your character</span>
              </div>
              <div className="command-item">
                <code>/hunger feed</code>
                <span>Feed and reduce hunger</span>
              </div>
            </div>
          </div>

          <div className="guide-section">
            <h2>Who Does What?</h2>
            <div className="role-breakdown">
              <div className="role-block">
                <h3>Players</h3>
                <ul>
                  <li>Create and manage their characters</li>
                  <li>Roll dice for their actions</li>
                  <li>Participate in scenes</li>
                  <li>Submit safety cards when needed</li>
                </ul>
              </div>

              <div className="role-block">
                <h3>Storytellers</h3>
                <ul>
                  <li>Create and control NPCs</li>
                  <li>Start and end scenes</li>
                  <li>Award XP and approve purchases</li>
                  <li>Respond to safety events</li>
                  <li>Access the Companion dashboard</li>
                </ul>
              </div>

              <div className="role-block">
                <h3>Owners</h3>
                <ul>
                  <li>Everything Storytellers can do</li>
                  <li>Assign Storyteller roles</li>
                  <li>Configure server settings</li>
                  <li>Export/import chronicle data</li>
                  <li>Manage engine-level settings</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="guide-section troubleshooting">
            <h2>Troubleshooting</h2>

            <div className="faq-item">
              <h4>The bot doesn't respond to commands</h4>
              <p>
                Make sure the bot has permission to read messages and send messages
                in the channel. Check that you've run <code>/engine setup</code> first.
              </p>
            </div>

            <div className="faq-item">
              <h4>I can't see certain commands</h4>
              <p>
                Some commands are restricted by role. Players won't see Storyteller
                commands. Check your role assignment with <code>/whoami</code>.
              </p>
            </div>

            <div className="faq-item">
              <h4>How do I add a Storyteller?</h4>
              <p>
                As the Owner, use <code>/st add @username</code> to grant Storyteller
                permissions to another user.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
