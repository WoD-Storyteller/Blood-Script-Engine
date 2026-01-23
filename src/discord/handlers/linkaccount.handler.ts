import { Message } from 'discord.js';
import { LinkTokenService } from '../../auth/link-token.service';

const COMMAND = '!linkaccount';
const TOKEN_TTL_MINUTES = 10;

export async function handleLinkAccountCommand(
  message: Message,
  linkTokens: LinkTokenService,
): Promise<boolean> {
  const content = message.content.trim().toLowerCase();
  if (content !== COMMAND) return false;

  if (message.guild) {
    await message.reply('Please DM me `!linkaccount` for a secure login link.');
    return true;
  }

  const result = await linkTokens.issueToken({
    discordUserId: message.author.id,
    discordUsername: message.author.username,
    issuingCommand: COMMAND,
  });

  if (result.ok === false) {
    const wait = result.retryAfterSeconds ?? 30;
    await message.reply(
      `You're doing that too quickly. Please wait ${wait}s and try again.`,
    );
    return true;
  }

  const appUrl =
    process.env.COMPANION_APP_URL ??
    process.env.APP_URL ??
    'https://app.bloodscriptengine.co.uk';

  const link = `${appUrl.replace(/\/$/, '')}/link-discord?token=${result.token}`;

  await message.reply(
    [
      '🩸 **Blood Script Link**',
      '',
      'Open this link to link your Discord account:',
      link,
      '',
      `This link expires in ${TOKEN_TTL_MINUTES} minutes and can only be used once.`,
    ].join('\n'),
  );

  return true;
}
