import type { UserRole } from "../../common/constants/roles";

export interface MemberProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED" | "DELETED";
}

export interface MemberDiscord {
  linked: boolean;
  discordId?: string;
  username?: string;
  lastSyncAt?: Date;
}

export interface MemberPaxDei {
  characterName?: string;
  level?: number;
  lastSyncAt?: Date;
}

export interface MemberEconomy {
  balance: number;
}

export interface MemberResponse {
  profile: MemberProfile;
  discord: MemberDiscord;
  paxDei: MemberPaxDei;
  economy: MemberEconomy;
}