import { Message } from 'discord.js';
import { ScenesService } from '../../scenes/scenes.service';
import { DatabaseService } from '../../database/database.service';

export async function handleMessage(
  message: Message,
  scenes: ScenesService,
  db: DatabaseService,
) {
  const engineRes = await db.query(
    `SELECT engine_id FROM engines WHERE discord_guild_id = $1`,
    [message.guild!.id],
  );

  if (!engineRes.rowCount) return;

  const engineId = engineRes.rows[0].engine_id;

  const mentionedDiscordUserIds = message.mentions.users.map((u) => u.id);

  const result = await scenes.handlePlayerIntent({
    engineId,
    channelId: message.channel.id,
    discordUserId: message.author.id,
    content: message.content,
    mentionedDiscordUserIds,
  });

  if (result?.dmWarning) {
    try {
      await message.author.send(result.dmWarning);
    } catch {
      // DM blocked — ignore
    }
  }

  if (result?.publicMessage) {
    await message.channel.send(result.publicMessage);
  } else if (result?.narration) {
    await message.channel.send(result.narration);
  }
}
