import { REST, Routes, SlashCommandBuilder } from 'discord.js';

export async function registerDiscordCommands() {
  const token = process.env.DISCORD_BOT_TOKEN!;
  const clientId = process.env.DISCORD_CLIENT_ID!;

  const commands = [
    new SlashCommandBuilder()
      .setName('roll')
      .setDescription('VTM V5 rolls using your active character')
      .addIntegerOption((o) =>
        o.setName('pool').setDescription('Manual dice pool').setRequired(false),
      )
      .addStringOption((o) =>
        o.setName('attribute').setDescription('Attribute').setRequired(false),
      )
      .addStringOption((o) =>
        o.setName('skill').setDescription('Skill').setRequired(false),
      )
      .addStringOption((o) =>
        o.setName('discipline').setDescription('Discipline').setRequired(false),
      )
      .addBooleanOption((o) =>
        o.setName('willpower').setDescription('Willpower reroll').setRequired(false),
      )
      .addBooleanOption((o) =>
        o.setName('rouse').setDescription('Make a rouse check').setRequired(false),
      )
      .addBooleanOption((o) =>
        o.setName('feed').setDescription('Make a feeding check').setRequired(false),
      )
      .addStringOption((o) =>
        o.setName('label').setDescription('Optional label').setRequired(false),
      ),
  ].map((c) => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });

  console.log('Discord slash commands registered');
}