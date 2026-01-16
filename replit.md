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

- Adapted for Replit environment
- Modified secrets loading to use environment variables
- Updated CORS to allow all origins for Replit proxy
- Fixed Discord module to gracefully handle missing tokens
- Fixed various module dependency injection issues
