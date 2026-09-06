export interface DiscordLink {
  _id?: string;
  memberId: string;
  discordId: string;
  discordUsername?: string;
  linkedAt: Date | string;
  updatedAt?: Date | string;
}

export interface LinkDiscordInput {
  memberId: string;
  discordId: string;
  discordUsername?: string;
}

export interface DiscordRoleInfo {
  id: string;
  name: string;
  color?: number;
}

export interface DiscordProfile {
  linked: boolean;
  inGuild: boolean;
  discordId: string;
  username?: string;
  globalName?: string | null;
  displayName?: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  guildAvatarUrl?: string | null;
  joinedAt?: string | null;
  roles: DiscordRoleInfo[];
  link: DiscordLink | null;
}
