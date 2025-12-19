import { REST, Routes, SlashCommandBuilder } from 'discord.js';

export async function registerDiscordCommands() {
  const token = process.env.DISCORD_BOT_TOKEN!;
  const clientId = process.env.DISCORD_CLIENT_ID!;

  const commands = [
    new SlashCommandBuilder()
      .setName('roll')
      .setDescription('Roll VTM V5 dice using your active character')
      .addIntegerOption((o) =>
        o
          .setName('pool')
          .setDescription('Manual dice pool (attributes + skills)')
          .setRequired(false),
      )
      .addStringOption((o) =>
        o
          .setName('attribute')
          .setDescription('Attribute name (e.g. Strength)')
          .setRequired(false),
      )
      .addStringOption((o) =>
        o
          .setName('skill')
          .setDescription('Skill name (e.g. Athletics)')
          .setRequired(false),
      )
      .addBooleanOption((o) =>
        o
          .setName('willpower')
          .setDescription('Spend Willpower to reroll up to 3 non-success dice')
          .setRequired(false),
      )
      .addStringOption((o) =>
        o
          .setName('label')
          .setDescription('Optional label (e.g. Attack, Persuasion)')
          .setRequired(false),
      ),
  ].map((c) => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(token);

  await rest.put(Routes.applicationCommands(clientId), {
    body: commands,
  });

  // eslint-disable-next-line no-console
  console.log('Discord slash commands registered');
}