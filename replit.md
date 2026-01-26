# Blood Script Engine

An autonomous storyteller system for World of Darkness (VTM v5) built with NestJS.

## Overview

Blood Script Engine is a Discord-first game engine for Vampire: The Masquerade 5th Edition. It consists of three parts:
1. **Discord Bot** - Primary gameplay interface (dice rolls, character management, scenes)
2. **Companion Dashboard** - Web-based oversight for Storytellers (client/ folder)
3. **Public Website** - Documentation and onboarding site (website/ folder)

## Tech Stack

- **Runtime**: Node.js 20
- **Backend**: NestJS
- **Database**: PostgreSQL (Replit built-in)
- **Website**: React + Vite
- **Companion**: React + Vite
- **Language**: TypeScript

## Project Structure

```
website/             - PUBLIC WEBSITE (docs, onboarding, no login)
├── src/
│   ├── pages/       - Home, About, HowItWorks, GetStarted, HelpSafety, Docs, Status, Privacy, Terms
│   └── components/  - Nav, Footer, Layout

client/              - COMPANION DASHBOARD (requires email/password login)
├── src/
│   ├── components/  - Dashboard UI components
│   └── api.ts       - API client

src/
├── ai/              - AI/autonomy services
├── auth/            - Authentication module
├── characters/      - Character management
├── chronicle/       - Chronicle/campaign management
├── combat/          - Combat mechanics
├── companion/       - Companion app services
├── coteries/        - Coterie (vampire group) management
├── database/        - Database module
├── dice/            - Dice rolling mechanics
├── discord/         - Discord bot integration
├── engine/          - Core game engine
├── havens/          - Haven management
├── humanity/        - Humanity tracking
├── hunger/          - Hunger mechanics
├── jobs/            - Background jobs
├── occult/          - Occult/ritual systems
├── owner/           - Bot owner admin tools
├── politics/        - Political systems (Prestation, Boons)
├── realtime/        - WebSocket/realtime features
├── resonance/       - Blood resonance mechanics
├── safety/          - Safety tools (X-Card system)
├── scenes/          - Scene management
├── st/              - Storyteller tools
├── threats/         - Threat/NPC systems
├── world/           - World/location management
└── xp/              - Experience points system
```

## Running the Application

The application runs on port 5000 with the command:
```bash
npm run start
```

For development:
```bash
npm run start:dev
```

## Database Migrations

```bash
npm run db:migrate     # Run migrations
npm run db:rollback    # Rollback last migration
npm run db:status      # Check migration status
```

## Environment Variables

Database (Supabase):
- `DB_HOST` - Supabase PostgreSQL host
- `DB_PORT` - Database port (default: 5432)
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_SSL` - Enable SSL (set to 'true' for Supabase)

Fallback (if DB_HOST not set):
- `DATABASE_URL` - Full PostgreSQL connection string

Optional (for full functionality):
- `DISCORD_BOT_TOKEN` - Discord bot token for Discord integration
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `BOT_OWNER_DISCORD_ID` - Discord ID of the bot owner
- `SESSION_SECRET` - Session encryption secret

## API Routes

All routes are prefixed with `/api`:

- `/api/auth/discord/*` - Discord OAuth
- `/api/companion/characters` - Character endpoints
- `/api/companion/dice` - Dice rolling
- `/api/companion/havens` - Haven management
- `/api/companion/xp` - XP management
- `/api/companion/humanity` - Humanity tracking
- `/api/companion/occult` - Occult/ritual endpoints
- `/api/owner/*` - Admin endpoints

## Recent Changes

### January 2026
- **Email/Password Authentication**: Replaced Discord OAuth with email/password registration and login
  - Password requirements: 12+ characters, uppercase, lowercase, number, symbol
  - Account lockout after 5 failed attempts (15-minute lockout)
  - Optional 2FA via TOTP authenticator app
  - Password reset requires 2FA (no email-based reset)
  - Users without engine membership can log in (defaults to PLAYER role)
- **AI Settings**: Added per-chronicle AI toggles (ai_enabled, ai_narration, ai_npc_voicing, ai_tone) stored in engine config
- **NPC Management**: Batch JSON import (up to 100 NPCs), portrait upload, webhook configuration for AI voicing
- **NPC AI Voicing**: Tupperbox-style webhooks allow NPCs to speak as themselves in Discord via Gemini AI
- **Chronicle Templates**: JSON templates for storylines, quests with objectives/rewards, NPCs, clocks, factions, locations
- **ST Override Panel**: Now includes AI Settings tab with toggles for AI features and tone selector
- **Public Website**: Added public-facing website (website/ folder) with documentation, onboarding, safety info
  - Home, About, How It Works, Get Started, Help & Safety, Documentation, Status, Privacy, Terms
  - Mobile-first design, no login required
  - Runs on port 5000 as the primary public interface
- **Supabase Database**: Switched from Replit PostgreSQL to Supabase with individual DB_* environment variables
- **Demo Mode**: Added dashboard preview without authentication via "Preview Demo" button
- **Removed Safety Ticket Button**: Safety cards now handled via Discord DM only, dashboard for ST/Owner oversight
- **Discord Linking**: Users can link their Discord account after login via bot command (!linkaccount)
- **Mobile-First Dashboard**: Updated NavTabs to use bottom navigation for mobile devices
- **Role-Based Access**: Dashboard tabs show based on user role (Player/Storyteller/Owner)
- **Safety System Oversight**: Added ST/Owner dashboard with `/stats`, `/pending`, `/respond` endpoints
- **Map Upload**: Added map upload controller for Google Maps URLs and KML files
- **Chronicle Import/Export**: Added JSON export/import with validation for characters, coteries, clocks, arcs, NPCs
- **Removed Dice Rolling UI**: All dice rolls now handled via Discord bot only
- **DiscordDmService**: Added sendDM method for safety response notifications

### Initial Setup
- Adapted for Replit environment
- Modified secrets loading to use environment variables
- Updated CORS to allow all origins for Replit proxy
- Fixed Discord module to gracefully handle missing tokens
- Fixed various module dependency injection issues

## API Routes (Updated)

All routes are prefixed with `/api`:

### Authentication
- `GET /api/auth/discord/login` - Initiate Discord OAuth
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/discord/me` - Get current user
- `GET /api/auth/discord/logout` - Logout

### Companion App
- `GET /api/companion/me` - Session info
- `GET /api/companion/characters` - List characters
- `GET /api/companion/characters/:id` - Get character
- `POST /api/companion/characters/:id/active` - Set active character
- `POST /api/companion/characters/:id/update` - Update character

### Safety System (ST/Owner only)
- `GET /api/companion/safety/stats` - Safety event statistics
- `GET /api/companion/safety/pending` - Pending events needing response
- `POST /api/companion/safety/respond` - Respond to safety event (sends Discord DM)

### Map Upload (ST/Owner only)
- `GET /api/companion/maps` - Get current map
- `POST /api/companion/maps` - Upload map (Google Maps URL or KML)
- `DELETE /api/companion/maps` - Remove map

### Chronicle (ST/Owner only)
- `GET /api/companion/chronicle/export` - Export chronicle JSON
- `POST /api/companion/chronicle/import` - Import chronicle JSON
- `POST /api/companion/chronicle/validate` - Validate chronicle JSON structure

### XP Management
- `GET /api/companion/xp/available` - Available XP
- `POST /api/companion/xp/spend-request` - Request XP spend
- `POST /api/companion/xp/earn` - Earn XP
- `POST /api/companion/xp/approve` - Approve XP request (ST/Owner)

### Admin
- `GET /api/owner/engines` - List engines (Owner only)
- `POST /api/owner/issue-strike` - Issue strike (Owner only)
- `POST /api/owner/unban-engine` - Unban engine (Owner only)

### Portrait Upload
- `POST /api/companion/portrait/request-url` - Get presigned upload URL
- `POST /api/companion/portrait/save` - Save portrait to character
- `GET /api/companion/portrait/:objectPath` - Serve portrait image

## Production Deployment (GCP)

### Domain Structure
```
api.bloodscriptengine.co.uk     → NestJS API (Compute Engine)
app.bloodscriptengine.co.uk     → Companion Dashboard (Cloud Storage)
www.bloodscriptengine.co.uk     → Public Website (Cloud Storage)
```

### GCP Deployment Files
```
deploy/gcp/
├── Dockerfile                  - Container build (optional)
├── README.md                   - Full deployment guide
├── .env.production.example     - Environment template
├── nginx/
│   └── api.bloodscriptengine.co.uk.conf
├── systemd/
│   └── bloodscript-api.service
└── scripts/
    ├── setup-vm.sh             - Create Compute Engine VM
    ├── setup-buckets.sh        - Create Cloud Storage buckets
    ├── build-api.sh            - Build API locally
    ├── build-static-sites.sh   - Build website + dashboard
    ├── deploy-api.sh           - Deploy API to VM
    └── deploy-static.sh        - Deploy static sites to buckets
```

### Required Environment Variables (Production)
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<supabase connection string>
DISCORD_CLIENT_ID=1438563946432036904
DISCORD_CLIENT_SECRET=<secret>
DISCORD_BOT_TOKEN=<token>
JWT_SECRET=<32+ char secret>
GEMINI_API_KEY=<gemini api key>
API_URL=https://api.bloodscriptengine.co.uk
COMPANION_APP_URL=https://app.bloodscriptengine.co.uk
```
