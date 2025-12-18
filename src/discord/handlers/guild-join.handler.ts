import { Guild } from 'discord.js';
import { DatabaseService } from '../../database/database.service';
import { bootstrapEngine } from '../provisioning/engine-bootstrap';

export async function handleGuildJoin(
  guild: Guild,
  db: DatabaseService,
) {
  await bootstrapEngine(guild, db);
}
