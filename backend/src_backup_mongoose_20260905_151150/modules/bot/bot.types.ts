import type { UserRole } from "../../common/constants/roles";
import type { ClanRole } from "../clan/clan.types";

export interface BotMemberDto {
  memberId: string;
  displayName: string;
  username: string;
  role: UserRole;
  status: "ACTIVE" | "SUSPENDED";
  discordId: string;
}

export interface BotMemberSyncInput {
  discordId: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  clanRole: ClanRole | null;
}

export type BotMemberSyncAction =
  | "created"
  | "updated"
  | "deactivated"
  | "ignored"
  | "no_link";

export interface BotMemberSyncResult {
  action: BotMemberSyncAction;
  memberId?: string;
  roleChanged: boolean;
}

export interface BotFullSyncResult {
  deactivated: number;
}
