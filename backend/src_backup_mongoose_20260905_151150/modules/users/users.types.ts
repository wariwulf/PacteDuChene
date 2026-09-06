import { UserRole } from "../../common/constants/roles";

export type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export interface UserProfile {
  username: string;
  displayName?: string;
  avatar?: string;
}

export interface UserDiscord {
  discordId?: string;
  username?: string;
  linked: boolean;
  lastSyncAt?: Date;
}

export interface UserPaxDei {
  characterName?: string;
  level?: number;
  lastSyncAt?: Date;
}

export interface UserEconomy {
  balances: Map<string, number>;
}

export interface UserDocument {
  email: string;
  passwordHash: string;
  mustChangePassword: boolean;
  role: UserRole;
  status: UserStatus;
  profile: UserProfile;
  discord: UserDiscord;
  paxDei: UserPaxDei;
  economy: UserEconomy;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMemberInput {
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role?: UserRole;
  temporaryPassword?: string;
  discordId?: string;
  discordUsername?: string;
}

export interface UpdateMemberInput {
  email?: string;
  username?: string;
  displayName?: string;
  avatar?: string;
  role?: UserRole;
  status?: UserStatus;
  discordId?: string;
  discordUsername?: string;
}

export interface AdminMemberResponse {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword: boolean;
  profile: UserProfile;
  discord: UserDiscord;
  createdAt: Date;
  updatedAt: Date;
}
