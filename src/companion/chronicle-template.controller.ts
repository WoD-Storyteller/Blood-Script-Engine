import { Controller, Get } from '@nestjs/common';

@Controller('companion/chronicle')
export class ChronicleTemplateController {
  @Get('template')
  getTemplate() {
    return {
      template: {
        chronicle: {
          name: 'Shadows of Chicago',
          setting: 'Chicago by Night',
          era: 'Modern Nights (2020s)',
          tone: 'gothic_horror',
        },
        storylines: [
          {
            title: 'The Prince\'s Gambit',
            synopsis: 'Political intrigue threatens to tear the domain apart as the Prince faces challenges from within.',
            status: 'active',
            acts: [
              {
                title: 'Act I: Whispers in Elysium',
                description: 'Rumors spread of dissent among the Primogen',
                complete: true,
              },
              {
                title: 'Act II: The Gathering Storm',
                description: 'Alliances form and break as factions choose sides',
                complete: false,
              },
              {
                title: 'Act III: Blood and Ash',
                description: 'The conflict comes to a head',
                complete: false,
              },
            ],
          },
        ],
        quests: [
          {
            title: 'Find the Missing Neonate',
            description: 'A newly embraced Kindred has vanished from their sire\'s haven',
            difficulty: 'moderate',
            status: 'available',
            objectives: [
              { text: 'Investigate the haven for clues', complete: false },
              { text: 'Question the sire about enemies', complete: false },
              { text: 'Track the neonate\'s last known movements', complete: false },
            ],
            rewards: {
              xp: 3,
              status_gain: 1,
              items: ['Haven key', 'Sire\'s gratitude (Minor Boon)'],
              narrative: 'The Primogen takes notice of your competence',
            },
          },
          {
            title: 'Silence the Witness',
            description: 'A mortal journalist has photos that threaten the Masquerade',
            difficulty: 'hard',
            status: 'available',
            objectives: [
              { text: 'Locate the journalist', complete: false },
              { text: 'Retrieve or destroy the evidence', complete: false },
              { text: 'Ensure no copies exist', complete: false },
              { text: 'Deal with the journalist (player\'s choice how)', complete: false },
            ],
            rewards: {
              xp: 5,
              status_gain: 2,
              items: [],
              narrative: 'The Sheriff acknowledges your service to the Masquerade',
            },
          },
        ],
        npcs: [
          {
            name: 'Prince Helena Marchetti',
            role: 'Prince',
            personality: {
              traits: ['calculating', 'elegant', 'ruthless'],
              mannerisms: ['never raises her voice', 'always wears white'],
              voice: 'Soft Italian accent, deliberate pauses',
              goals: ['Maintain absolute control', 'Discover who plots against her'],
            },
            ambition: 'Eternal dominion over Chicago',
            status: 5,
          },
        ],
        clocks: [
          {
            title: 'Second Inquisition Investigation',
            segments: 8,
            filled: 2,
            description: 'Federal agents are closing in on Kindred activity',
            triggers: {
              half: 'SI establishes local cell',
              full: 'Major raid on known Kindred locations',
            },
          },
          {
            title: 'Masquerade Stability',
            segments: 6,
            filled: 1,
            description: 'The veil between Kindred and Kine society',
            triggers: {
              half: 'Increased mortal suspicion, harder hunting',
              full: 'City-wide Masquerade breach, Prince intervention',
            },
          },
        ],
        factions: [
          {
            name: 'The Ivory Tower',
            type: 'Camarilla',
            description: 'The established power structure led by the Prince',
            attitude: 'neutral',
          },
          {
            name: 'The Anarchs of the South Side',
            type: 'Anarch',
            description: 'A loose confederation challenging Camarilla control',
            attitude: 'hostile',
          },
        ],
        locations: [
          {
            name: 'The Succubus Club',
            type: 'Elysium',
            description: 'The city\'s primary Elysium, neutral ground for all Kindred',
            controller: 'Prince Helena',
          },
          {
            name: 'The Rack - Gold Coast',
            type: 'Hunting Ground',
            description: 'Prime feeding territory, wealthy vessels',
            controller: 'Primogen Council',
          },
        ],
      },
      schema: {
        chronicle: {
          name: 'string - Chronicle name',
          setting: 'string - City/setting name',
          era: 'string - Time period',
          tone: 'string - gothic_horror | noir | action | political',
        },
        storylines: {
          title: 'string',
          synopsis: 'string',
          status: 'active | paused | completed',
          acts: [
            {
              title: 'string',
              description: 'string',
              complete: 'boolean',
            },
          ],
        },
        quests: {
          title: 'string',
          description: 'string',
          difficulty: 'easy | moderate | hard | deadly',
          status: 'available | in_progress | completed | failed',
          objectives: [{ text: 'string', complete: 'boolean' }],
          rewards: {
            xp: 'number',
            status_gain: 'number (0-3)',
            items: 'string[]',
            narrative: 'string - flavor text for completion',
          },
        },
        npcs: 'See /api/companion/npcs/template for NPC schema',
        clocks: {
          title: 'string',
          segments: 'number (4-12)',
          filled: 'number',
          description: 'string',
          triggers: {
            half: 'string - what happens at 50%',
            full: 'string - what happens when complete',
          },
        },
        factions: {
          name: 'string',
          type: 'Camarilla | Anarch | Sabbat | Independent | Mortal',
          description: 'string',
          attitude: 'friendly | neutral | hostile',
        },
        locations: {
          name: 'string',
          type: 'Elysium | Haven | Hunting Ground | Domain | Mortal',
          description: 'string',
          controller: 'string - who controls this location',
        },
      },
    };
  }
}
