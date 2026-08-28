import type { UserRole } from "../../common/constants/roles";
import { MemberRepository } from "./members.repository";
import type { MemberResponse } from "./members.types";

const memberRepository = new MemberRepository();

function toMemberResponse(user: any): MemberResponse {
  return {
    profile: {
      id: user._id.toString(),
      email: user.email,
      username: user.profile.username,
      displayName: user.profile.displayName,
      avatar: user.profile.avatar,
      role: user.role,
      status: user.status,
    },

    discord: {
      linked: user.discord?.linked ?? false,
      discordId: user.discord?.discordId,
      username: user.discord?.username,
      lastSyncAt: user.discord?.lastSyncAt,
    },

    paxDei: {
      characterName: user.paxDei?.characterName,
      level: user.paxDei?.level,
      lastSyncAt: user.paxDei?.lastSyncAt,
    },

    economy: {
      balance: user.economy?.balance ?? 0,
    },
  };
}

export async function getMembers(): Promise<MemberResponse[]> {
  const users = await memberRepository.findAll();

  return users.map(toMemberResponse);
}

export async function getMemberById(
  id: string
): Promise<MemberResponse | null> {
  const user = await memberRepository.findById(id);

  if (!user) {
    return null;
  }

  return toMemberResponse(user);
}

export async function getMembersByRole(
  role: UserRole
): Promise<MemberResponse[]> {
  const users = await memberRepository.findByRole(role);

  return users.map(toMemberResponse);
}

export async function getCurrentMember(
  userId: string
): Promise<MemberResponse | null> {
  const user = await memberRepository.findById(userId);

  if (!user) {
    return null;
  }

  return toMemberResponse(user);
}