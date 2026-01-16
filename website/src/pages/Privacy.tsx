import './Legal.css';

export default function Privacy() {
  return (
    <div className="legal-page">
      <section className="page-header">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p className="page-subtitle">
            How we handle your data. Last updated: January 2026.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container legal-content">
          <div className="legal-section">
            <h2>What Data We Collect</h2>
            <p>
              Blood Script Engine collects only the data necessary to provide
              game functionality. Here's exactly what we store:
            </p>

            <h3>Data We Store</h3>
            <ul>
              <li>
                <strong>Discord User IDs</strong> — Used to identify you across
                sessions and link you to your characters.
              </li>
              <li>
                <strong>Discord Server IDs</strong> — Used to identify which
                chronicle you're participating in.
              </li>
              <li>
                <strong>Character Data</strong> — Names, stats, and game-related
                information you create for your characters.
              </li>
              <li>
                <strong>Chronicle Data</strong> — NPCs, scenes, coteries, and
                other story elements created by Storytellers.
              </li>
              <li>
                <strong>Dice Roll History</strong> — Records of rolls for game
                reference and audit purposes.
              </li>
              <li>
                <strong>Safety Events</strong> — Safety card submissions and
                Storyteller responses (with anonymity options).
              </li>
            </ul>

            <h3>Data We Do NOT Store</h3>
            <ul className="not-stored">
              <li>Discord messages or chat logs</li>
              <li>Voice or video content</li>
              <li>Private messages (except safety card DMs to the bot)</li>
              <li>Personal information beyond Discord IDs</li>
              <li>Payment or financial information</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Who Can See Your Data</h2>

            <h3>Your Character Data</h3>
            <ul>
              <li>You can always see your own character data.</li>
              <li>Storytellers and Owners can see all character data in their chronicle.</li>
              <li>Other players may see limited public information (name, clan) during play.</li>
            </ul>

            <h3>Safety Event Data</h3>
            <ul>
              <li>Safety events are visible only to Storytellers and Owners.</li>
              <li>Anonymous submissions do not reveal your identity to anyone.</li>
              <li>Safety data is never shared outside your chronicle's leadership.</li>
            </ul>

            <h3>System Administrators</h3>
            <ul>
              <li>We may access data for technical support or bug fixes.</li>
              <li>We do not read your chronicles for entertainment or other purposes.</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Data Retention</h2>
            <p>
              Chronicle data is retained as long as the chronicle exists. If a
              server removes the bot or an Owner requests deletion, we will
              delete all associated data within 30 days.
            </p>
            <p>
              You may request deletion of your personal data (user ID and
              associated characters) by contacting us. This may affect your
              ability to use the service.
            </p>
          </div>

          <div className="legal-section">
            <h2>Data Security</h2>
            <p>
              We use industry-standard security practices to protect your data:
            </p>
            <ul>
              <li>Encrypted database connections (SSL/TLS)</li>
              <li>Secure authentication via Discord OAuth</li>
              <li>Regular security updates and monitoring</li>
              <li>Access controls limiting who can view data</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Third Parties</h2>
            <p>
              We do not sell, trade, or share your data with third parties for
              marketing purposes. We may use third-party services for:
            </p>
            <ul>
              <li>Database hosting (Supabase)</li>
              <li>Error monitoring and analytics (anonymized)</li>
            </ul>
          </div>

          <div className="legal-section">
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your data (export chronicle feature)</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to certain data processing</li>
            </ul>
            <p>
              To exercise these rights, contact your chronicle Owner or reach
              out through our official support channels.
            </p>
          </div>

          <div className="legal-section">
            <h2>Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. Significant
              changes will be announced through our official channels. Continued
              use of the service after changes constitutes acceptance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
