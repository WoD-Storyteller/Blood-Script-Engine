# Blood Script Engine

An autonomous storyteller system for World of Darkness (VTM v5) built with NestJS.

## Overview

Blood Script Engine is a backend API service that provides game management functionality for Vampire: The Masquerade 5th Edition tabletop roleplaying. It includes Discord integration, character management, scene handling, and various game mechanics.

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: NestJS
- **Database**: PostgreSQL (Replit-managed)
- **Language**: TypeScript

## Project Structure

```
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

Required:
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)

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
- **Discord OAuth Only**: Removed Engine UUID authentication - Discord is now the only login method
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
