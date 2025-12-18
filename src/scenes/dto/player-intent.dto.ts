export interface PlayerIntentDto {
  engineId: string;
  channelId: string;
  discordUserId: string;
  content: string;

  /**
   * Presence-gating uses this.
   * Populated from Discord mentions (Message.mentions.users).
   */
  mentionedDiscordUserIds?: string[];
}
