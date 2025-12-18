import { Message } from 'discord.js';
import { DatabaseService } from '../../database/database.service';

const SAFETY_EMOJIS = ['🔴', '🟡', '🟢'];

export async function handleDM(
  message: Message,
  db: DatabaseService,
) {
  const emoji = message.content.trim();
  if (!SAFETY_EMOJIS.includes(emoji)) return;

  // Identify most recent active scene for this user
  const res = await db.query(
    `
    SELECT sp.scene_id, sp.engine_id
    FROM scene_participants sp
    JOIN users u ON u.user_id = sp.participant_id
    WHERE u.discord_user_id = $1
    ORDER BY sp.joined_at DESC
    LIMIT 1
    `,
    [message.author.id],
  );

  if (!res.rowCount) return;

  const { scene_id, engine_id } = res.rows[0];

  await db.query(
    `
    INSERT INTO safety_signals (signal_id, engine_id, scene_id, signal_type)
    VALUES (gen_random_uuid(), $1, $2, $3)
    `,
    [
      engine_id,
      scene_id,
      emoji === '🔴'
        ? 'red'
        : emoji === '🟡'
        ? 'yellow'
        : 'green',
    ],
  );
}
