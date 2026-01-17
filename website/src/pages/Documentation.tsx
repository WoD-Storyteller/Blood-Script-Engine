import { useState } from 'react';
import './Documentation.css';

type DocSection = 'commands' | 'concepts' | 'mechanics' | 'safety' | 'imports' | 'faq';

export default function Documentation() {
  const [activeSection, setActiveSection] = useState<DocSection>('commands');

  return (
    <div className="documentation">
      <section className="page-header">
        <div className="container">
          <h1>Documentation</h1>
          <p className="page-subtitle">
            Everything you need to know about running Blood Script Engine.
          </p>
        </div>
      </section>

      <section className="docs-section section">
        <div className="container docs-layout">
          <nav className="docs-nav">
            <button
              className={activeSection === 'commands' ? 'active' : ''}
              onClick={() => setActiveSection('commands')}
            >
              Discord Commands
            </button>
            <button
              className={activeSection === 'concepts' ? 'active' : ''}
              onClick={() => setActiveSection('concepts')}
            >
              Chronicle Concepts
            </button>
            <button
              className={activeSection === 'mechanics' ? 'active' : ''}
              onClick={() => setActiveSection('mechanics')}
            >
              Dice & Hunger
            </button>
            <button
              className={activeSection === 'safety' ? 'active' : ''}
              onClick={() => setActiveSection('safety')}
            >
              Safety System
            </button>
            <button
              className={activeSection === 'imports' ? 'active' : ''}
              onClick={() => setActiveSection('imports')}
            >
              Data Import
            </button>
            <button
              className={activeSection === 'faq' ? 'active' : ''}
              onClick={() => setActiveSection('faq')}
            >
              FAQ
            </button>
          </nav>

          <div className="docs-content">
            {activeSection === 'commands' && <CommandsDoc />}
            {activeSection === 'concepts' && <ConceptsDoc />}
            {activeSection === 'mechanics' && <MechanicsDoc />}
            {activeSection === 'safety' && <SafetyDoc />}
            {activeSection === 'imports' && <ImportsDoc />}
            {activeSection === 'faq' && <FAQDoc />}
          </div>
        </div>
      </section>
    </div>
  );
}

function CommandsDoc() {
  return (
    <div className="doc-page">
      <h2>Discord Commands</h2>

      <div className="command-category">
        <h3>Player Commands</h3>
        <p>Available to all players in the chronicle.</p>

        <div className="command-list">
          <div className="command">
            <code>/roll pool:&lt;number&gt; hunger:&lt;number&gt;</code>
            <p>Roll dice with hunger. Shows successes, criticals, and bestial failures.</p>
          </div>
          <div className="command">
            <code>/character create</code>
            <p>Start the character creation process.</p>
          </div>
          <div className="command">
            <code>/character sheet</code>
            <p>View your active character's sheet.</p>
          </div>
          <div className="command">
            <code>/character list</code>
            <p>See all your characters in this chronicle.</p>
          </div>
          <div className="command">
            <code>/hunger feed</code>
            <p>Attempt to feed and reduce hunger.</p>
          </div>
          <div className="command">
            <code>/whoami</code>
            <p>Check your role and active character.</p>
          </div>
        </div>
      </div>

      <div className="command-category">
        <h3>Storyteller Commands</h3>
        <p>Available to Storytellers and Owners.</p>

        <div className="command-list">
          <div className="command">
            <code>/scene start location:&lt;name&gt;</code>
            <p>Begin a new scene at the specified location.</p>
          </div>
          <div className="command">
            <code>/scene end</code>
            <p>End the current scene.</p>
          </div>
          <div className="command">
            <code>/npc create name:&lt;name&gt;</code>
            <p>Create a new NPC.</p>
          </div>
          <div className="command">
            <code>/xp award player:&lt;@user&gt; amount:&lt;number&gt;</code>
            <p>Award experience points to a player.</p>
          </div>
          <div className="command">
            <code>/st add @user</code>
            <p>Grant Storyteller permissions to a user.</p>
          </div>
        </div>
      </div>

      <div className="command-category">
        <h3>Owner Commands</h3>
        <p>Available only to the chronicle Owner.</p>

        <div className="command-list">
          <div className="command">
            <code>/engine setup</code>
            <p>Initialize Blood Script in this server.</p>
          </div>
          <div className="command">
            <code>/chronicle create name:&lt;name&gt;</code>
            <p>Create a new chronicle.</p>
          </div>
          <div className="command">
            <code>/chronicle export</code>
            <p>Export chronicle data as JSON.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConceptsDoc() {
  return (
    <div className="doc-page">
      <h2>Chronicle Concepts</h2>

      <div className="concept">
        <h3>What is a Chronicle?</h3>
        <p>
          A chronicle is a campaign—an ongoing story with connected characters,
          locations, and events. Each Discord server can have one active chronicle
          managed by Blood Script Engine.
        </p>
      </div>

      <div className="concept">
        <h3>Scenes</h3>
        <p>
          Scenes are moments of active roleplay. When a Storyteller starts a scene,
          it establishes where the action is happening. Characters can join scenes,
          and dice rolls are logged within the scene context.
        </p>
      </div>

      <div className="concept">
        <h3>Coteries</h3>
        <p>
          A coterie is a group of vampires who work together. Players can be organized
          into coteries for shared resources, havens, and story hooks.
        </p>
      </div>

      <div className="concept">
        <h3>Arcs & Clocks</h3>
        <p>
          Storytellers can create story arcs (long-term plot threads) and clocks
          (countdown timers for events). These help track narrative progress and
          create tension.
        </p>
      </div>

      <div className="concept">
        <h3>Havens</h3>
        <p>
          Vampires need safe places to sleep during the day. The engine tracks
          haven locations, security levels, and which characters reside there.
        </p>
      </div>
    </div>
  );
}

function MechanicsDoc() {
  return (
    <div className="doc-page">
      <h2>Dice & Hunger</h2>

      <div className="mechanic">
        <h3>Rolling Dice</h3>
        <p>
          VTM V5 uses d10 dice pools. Dice showing 6+ are successes. Pairs of 10s
          create criticals (worth 4 successes instead of 2).
        </p>
        <div className="example-box">
          <code>/roll pool:6 hunger:2</code>
          <p>
            Rolls 6 dice total—4 regular dice (white) and 2 hunger dice (red).
          </p>
        </div>
      </div>

      <div className="mechanic">
        <h3>Hunger Dice</h3>
        <p>
          Hunger dice replace regular dice based on your hunger level. They work
          the same as regular dice, but:
        </p>
        <ul>
          <li>
            <strong>1 on a hunger die + failure</strong> = Bestial Failure.
            The Beast takes over briefly.
          </li>
          <li>
            <strong>10 on a hunger die + critical</strong> = Messy Critical.
            You succeed, but the Beast adds complications.
          </li>
        </ul>
      </div>

      <div className="mechanic">
        <h3>Hunger Tracking</h3>
        <p>
          Hunger ranges from 0 (satiated) to 5 (starving). At hunger 5, you risk
          losing control entirely. The engine tracks hunger and prompts for
          feeding when appropriate.
        </p>
      </div>

      <div className="mechanic">
        <h3>Humanity</h3>
        <p>
          Your Humanity score measures how much of your human self remains.
          Violating your moral code may result in stains, which can lead to
          Humanity loss during remorse checks.
        </p>
      </div>
    </div>
  );
}

function SafetyDoc() {
  return (
    <div className="doc-page">
      <h2>Safety System</h2>

      <div className="safety-overview">
        <p>
          Blood Script Engine includes a built-in safety system inspired by
          tabletop safety tools like X-Card and Lines & Veils. It's designed
          to protect players while maintaining game flow.
        </p>
      </div>

      <div className="safety-tool">
        <h3>Safety Cards</h3>
        <p>Three levels of feedback, usable at any time:</p>
        <ul>
          <li><strong>🟢 Green:</strong> I'm comfortable, keep going.</li>
          <li><strong>🟡 Yellow:</strong> Slow down, approaching my limit.</li>
          <li><strong>🔴 Red:</strong> Stop immediately, this needs to end.</li>
        </ul>
      </div>

      <div className="safety-tool">
        <h3>How to Use</h3>
        <p>
          Send a DM to the Blood Script bot with your safety card. The system
          handles notification to the Storyteller based on the card type.
          You can choose to remain anonymous.
        </p>
      </div>

      <div className="safety-tool">
        <h3>Storyteller Response</h3>
        <p>
          Storytellers see pending safety events in the Companion dashboard.
          They can respond with acknowledgment and follow-up actions. Responses
          are sent privately to the submitting player (if not anonymous).
        </p>
      </div>

      <div className="safety-tool">
        <h3>Data Privacy</h3>
        <p>
          Safety event data is visible only to Storytellers and Owners of the
          chronicle. It is never shared externally. Anonymous submissions
          cannot be traced back to specific players.
        </p>
      </div>
    </div>
  );
}

function ImportsDoc() {
  const npcTemplate = `{
  "npcs": [
    {
      "name": "Prince Marcus Ashford",
      "clan": "Ventrue",
      "generation": 8,
      "role": "Prince of the City",
      "location": "Elysium",
      "description": "A calculating elder who has ruled for two centuries.",
      "notes": "Hostile to Anarchs. Ally of the Tremere Primogen.",
      "portraitUrl": null,
      "webhookUrl": null
    },
    {
      "name": "Rosa Chen",
      "clan": "Tremere",
      "generation": 9,
      "role": "Primogen",
      "location": "The Chantry",
      "description": "Keeper of occult secrets and blood sorcery.",
      "notes": "May provide ritual assistance for a price.",
      "portraitUrl": null,
      "webhookUrl": null
    }
  ]
}`;

  const chronicleTemplate = `{
  "chronicle": {
    "name": "Shadows of San Francisco",
    "setting": "Modern nights, 2024",
    "theme": "Political intrigue and survival"
  },
  "characters": [
    {
      "name": "Elena Voss",
      "clan": "Toreador",
      "generation": 11,
      "sire": "Marcus the Sculptor",
      "concept": "Art gallery curator embracing the night",
      "attributes": {
        "strength": 2, "dexterity": 3, "stamina": 2,
        "charisma": 4, "manipulation": 3, "composure": 2,
        "intelligence": 3, "wits": 2, "resolve": 2
      },
      "disciplines": {
        "auspex": 2,
        "presence": 3
      },
      "hunger": 2,
      "humanity": 7,
      "willpower": 4
    }
  ],
  "coteries": [
    {
      "name": "The Midnight Society",
      "territory": "Financial District",
      "members": ["Elena Voss", "Marcus Steel"],
      "haven": "Penthouse Suite, Raven Tower"
    }
  ],
  "npcs": [
    {
      "name": "Prince Marcus Ashford",
      "clan": "Ventrue",
      "role": "Prince of the City",
      "location": "Elysium",
      "description": "A calculating elder who has ruled for two centuries."
    }
  ],
  "clocks": [
    {
      "title": "SI Investigation",
      "segments": 6,
      "filled": 2,
      "description": "Second Inquisition agents closing in on the Domain"
    },
    {
      "title": "Blood Hunt Countdown",
      "segments": 4,
      "filled": 0,
      "description": "Time before the Prince calls a Blood Hunt"
    }
  ],
  "arcs": [
    {
      "title": "The Prince's Gambit",
      "status": "active",
      "description": "Political maneuvering at the highest levels of Kindred society"
    }
  ],
  "factions": [
    {
      "name": "Camarilla",
      "influence": "high",
      "leader": "Prince Marcus Ashford",
      "notes": "Controls the city officially"
    },
    {
      "name": "Anarchs",
      "influence": "medium",
      "leader": "Red",
      "notes": "Growing presence in the Tenderloin"
    }
  ],
  "locations": [
    {
      "name": "Elysium - The Grand Opera House",
      "type": "elysium",
      "description": "Neutral ground where Kindred politics unfold",
      "owner": "Prince Marcus Ashford"
    },
    {
      "name": "The Warrens",
      "type": "territory",
      "description": "Nosferatu tunnels beneath the city",
      "owner": "Clan Nosferatu"
    }
  ]
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="doc-page">
      <h2>Data Import</h2>

      <div className="import-section">
        <h3>NPC Batch Import</h3>
        <p>
          Storytellers can import multiple NPCs at once using a JSON file. This is useful
          for setting up a new chronicle or adding a group of related characters quickly.
          The Companion dashboard supports importing up to 100 NPCs per batch.
        </p>

        <h4>How to Import NPCs</h4>
        <ol className="steps-list">
          <li>Open the Companion dashboard and navigate to the Storyteller tab</li>
          <li>Click on "NPC Management"</li>
          <li>Select "Batch Import" and paste your JSON or upload a file</li>
          <li>Review the preview and confirm the import</li>
        </ol>

        <h4>NPC Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>NPC's name</td></tr>
            <tr><td>clan</td><td>No</td><td>Vampire clan (Ventrue, Toreador, etc.)</td></tr>
            <tr><td>generation</td><td>No</td><td>Vampire generation (1-16)</td></tr>
            <tr><td>role</td><td>No</td><td>Political or social role (Prince, Primogen, etc.)</td></tr>
            <tr><td>location</td><td>No</td><td>Where this NPC is typically found</td></tr>
            <tr><td>description</td><td>No</td><td>Brief character description</td></tr>
            <tr><td>notes</td><td>No</td><td>ST-only notes about the NPC</td></tr>
            <tr><td>portraitUrl</td><td>No</td><td>URL to NPC portrait image</td></tr>
            <tr><td>webhookUrl</td><td>No</td><td>Discord webhook for AI voicing</td></tr>
          </tbody>
        </table>

        <h4>JSON Template</h4>
        <div className="code-block">
          <button className="copy-btn" onClick={() => copyToClipboard(npcTemplate)}>
            Copy
          </button>
          <pre>{npcTemplate}</pre>
        </div>
      </div>

      <div className="import-section">
        <h3>Chronicle Import</h3>
        <p>
          Import a complete chronicle structure including characters, coteries, NPCs,
          story arcs, clocks, factions, and locations. This is perfect for migrating
          from another system or starting with a pre-built scenario.
        </p>

        <h4>How to Import a Chronicle</h4>
        <ol className="steps-list">
          <li>Open the Companion dashboard as an Owner or Storyteller</li>
          <li>Navigate to "Chronicle Settings" in the Storyteller tab</li>
          <li>Click "Import Chronicle" and paste your JSON or upload a file</li>
          <li>The system will validate the structure before importing</li>
          <li>Review the preview showing what will be created</li>
          <li>Confirm to import all data into your chronicle</li>
        </ol>

        <h4>Chronicle Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>Chronicle name</td></tr>
            <tr><td>setting</td><td>No</td><td>Time period and location</td></tr>
            <tr><td>theme</td><td>No</td><td>Core themes of the chronicle</td></tr>
          </tbody>
        </table>

        <h4>Character Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>Character name</td></tr>
            <tr><td>clan</td><td>Yes</td><td>Vampire clan</td></tr>
            <tr><td>generation</td><td>No</td><td>Vampire generation (1-16)</td></tr>
            <tr><td>sire</td><td>No</td><td>Name of the sire who embraced them</td></tr>
            <tr><td>concept</td><td>No</td><td>Character concept/background</td></tr>
            <tr><td>attributes</td><td>No</td><td>Object with physical/social/mental stats (1-5)</td></tr>
            <tr><td>disciplines</td><td>No</td><td>Object mapping discipline names to levels (1-5)</td></tr>
            <tr><td>hunger</td><td>No</td><td>Current hunger level (0-5)</td></tr>
            <tr><td>humanity</td><td>No</td><td>Humanity score (0-10)</td></tr>
            <tr><td>willpower</td><td>No</td><td>Willpower score (0-10)</td></tr>
          </tbody>
        </table>

        <h4>Coterie Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>Coterie name</td></tr>
            <tr><td>territory</td><td>No</td><td>Area the coterie controls</td></tr>
            <tr><td>members</td><td>No</td><td>Array of character names</td></tr>
            <tr><td>haven</td><td>No</td><td>Primary haven location</td></tr>
          </tbody>
        </table>

        <h4>Clock Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>title</td><td>Yes</td><td>Clock title</td></tr>
            <tr><td>segments</td><td>Yes</td><td>Total segments (4, 6, or 8)</td></tr>
            <tr><td>filled</td><td>No</td><td>Currently filled segments (default: 0)</td></tr>
            <tr><td>description</td><td>No</td><td>What happens when clock fills</td></tr>
          </tbody>
        </table>

        <h4>Arc Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>title</td><td>Yes</td><td>Story arc title</td></tr>
            <tr><td>status</td><td>No</td><td>"active", "completed", or "pending"</td></tr>
            <tr><td>description</td><td>No</td><td>Arc summary</td></tr>
          </tbody>
        </table>

        <h4>Faction Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>Faction name</td></tr>
            <tr><td>influence</td><td>No</td><td>"high", "medium", or "low"</td></tr>
            <tr><td>leader</td><td>No</td><td>Faction leader name</td></tr>
            <tr><td>notes</td><td>No</td><td>ST notes about the faction</td></tr>
          </tbody>
        </table>

        <h4>Location Fields</h4>
        <table className="fields-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>name</td><td>Yes</td><td>Location name</td></tr>
            <tr><td>type</td><td>No</td><td>"elysium", "haven", "territory", "landmark"</td></tr>
            <tr><td>description</td><td>No</td><td>Location description</td></tr>
            <tr><td>owner</td><td>No</td><td>Who controls this location</td></tr>
          </tbody>
        </table>

        <h4>JSON Template</h4>
        <div className="code-block">
          <button className="copy-btn" onClick={() => copyToClipboard(chronicleTemplate)}>
            Copy
          </button>
          <pre>{chronicleTemplate}</pre>
        </div>

        <div className="warning-box">
          <strong>Note:</strong> Importing a chronicle will add to your existing data,
          not replace it. Duplicate names may cause conflicts. Always export your
          current chronicle as a backup before importing new data.
        </div>
      </div>
    </div>
  );
}

function FAQDoc() {
  return (
    <div className="doc-page">
      <h2>Frequently Asked Questions</h2>

      <div className="faq">
        <h3>Is Blood Script free to use?</h3>
        <p>
          Yes. Blood Script Engine is free for personal use and running your
          own chronicles. There are no hidden fees for basic functionality.
        </p>
      </div>

      <div className="faq">
        <h3>Can I run multiple chronicles?</h3>
        <p>
          Currently, each Discord server supports one active chronicle. You can
          create multiple servers for multiple chronicles.
        </p>
      </div>

      <div className="faq">
        <h3>Does the bot store my messages?</h3>
        <p>
          No. The bot does not log or store Discord messages. It only stores
          game-related data: characters, rolls, scenes, and safety events.
        </p>
      </div>

      <div className="faq">
        <h3>Can I export my chronicle data?</h3>
        <p>
          Yes. Owners can export their chronicle as JSON, including characters,
          NPCs, coteries, and story elements. This data can be backed up or
          imported to a new chronicle.
        </p>
      </div>

      <div className="faq">
        <h3>What happens if the bot goes offline?</h3>
        <p>
          Your data is safely stored in our database. When the bot comes back
          online, everything resumes where it left off. Check the Status page
          for any ongoing issues.
        </p>
      </div>

      <div className="faq">
        <h3>Is this affiliated with Paradox Interactive?</h3>
        <p>
          No. Blood Script Engine is a fan-made tool. Vampire: The Masquerade
          is a trademark of Paradox Interactive AB. This project is not
          affiliated with or endorsed by Paradox Interactive.
        </p>
      </div>
    </div>
  );
}
