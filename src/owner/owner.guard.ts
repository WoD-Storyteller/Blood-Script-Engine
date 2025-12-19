export function isBotOwner(session: { discord_user_id?: string }) {
  return (
    !!process.env.BOT_OWNER_DISCORD_ID &&
    session.discord_user_id === process.env.BOT_OWNER_DISCORD_ID
  );
}