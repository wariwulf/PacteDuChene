import { apiFetch } from "../lib/api/client";

export interface MemberProfile {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  role: string;
  status: string;
}

export interface MemberDiscord {
  discordId?: string;
  username?: string;
  linked: boolean;
  lastSyncAt?: string;
}

export interface MemberPaxDei {
  characterName?: string;
  level?: number;
  lastSyncAt?: string;
}

export interface MemberEconomy {
  balance: number;
}

export interface Member {
  profile: MemberProfile;
  discord: MemberDiscord;
  paxDei: MemberPaxDei;
  economy: MemberEconomy;
}

interface MemberResponse {
  success: boolean;
  data: {
    member: Member;
  };
}

interface MembersResponse {
  success: boolean;
  data: {
    members: Member[];
  };
}

/**
 * Récupère le membre actuellement connecté.
 */
export async function getCurrentMember(): Promise<Member> {
  const response = await apiFetch<MemberResponse>(
    "/members/me"
  );

  return response.data.member;
}

/**
 * Récupère l'ensemble des membres.
 *
 * Utilisé notamment par l'administration
 * pour gérer le niveau des membres.
 */
export async function getMembers(): Promise<Member[]> {
  const response = await apiFetch<MembersResponse>(
    "/members"
  );

  return response.data.members;
}