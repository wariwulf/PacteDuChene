import { User } from "../users/user.model";
import { UserLevel, LevelDefinition } from "../levels/levels.model";
import { clanRepository } from "./clan.repository";
import { ClanMemberInput, ClanTreeNode } from "./clan.types";

export const clanService = {
  async getTree(): Promise<ClanTreeNode[]> {
    const [entries, clanMemberIds, users, userLevels, levelDefinitions] =
      await Promise.all([
        clanRepository.findAll(),
        clanRepository.findAllMemberIds(),
        User.find({ status: "ACTIVE" })
          .select("_id role profile")
          .lean(),
        UserLevel.find()
          .select("userId xp")
          .lean(),
        LevelDefinition.find({ enabled: true })
          .select("level name requiredXp")
          .sort({ level: 1 })
          .lean(),
      ]);

    const usersById = new Map(
      users.map((user) => [String(user._id), user])
    );

    const levelsByUserId = new Map(
      userLevels.map((userLevel) => [
        String(userLevel.userId),
        userLevel,
      ])
    );

    function getLevelForUser(userId: string) {
      const userLevel = levelsByUserId.get(userId);
      const xp = Number(userLevel?.xp ?? 0);

      if (levelDefinitions.length === 0) {
        return {
          level: 1,
          levelName: "Niveau 1",
          xp,
        };
      }

      const current =
        [...levelDefinitions]
          .filter((definition) => Number(definition.requiredXp) <= xp)
          .sort((a, b) => Number(b.level) - Number(a.level))[0] ??
        levelDefinitions[0];

      return {
        level: Number(current.level),
        levelName: current.name,
        xp,
      };
    }

    const result: ClanTreeNode[] = [];

    for (const entry of entries) {
      const user = usersById.get(String(entry.memberId));
      if (!user) continue;

      // Le portrait du profil est prioritaire.
      // L'ancien portrait ClanMember reste un fallback de compatibilité
      // pour les membres dont le portrait Discord avait déjà été enregistré.
      result.push({
        id: String(entry._id),
        memberId: entry.memberId,
        role: entry.role,
        parentId: entry.parentId,
        portrait: user.profile?.avatar ?? entry.portrait ?? null,
        displayOrder: entry.displayOrder,
        active: entry.active,
        name:
          user.profile?.displayName ??
          user.profile?.username ??
          `Membre ${entry.memberId.slice(0, 8)}`,
        title: user.role,
        ...getLevelForUser(String(user._id)),
      });
    }

    const knownMemberIds = new Set(
      clanMemberIds.map((entry) => String(entry.memberId))
    );

    for (const user of users) {
      const memberId = String(user._id);
      if (knownMemberIds.has(memberId)) continue;

      result.push({
        id: memberId,
        memberId,
        role: "INITIE",
        parentId: null,
        portrait: user.profile?.avatar ?? null,
        displayOrder: 999999,
        active: true,
        name:
          user.profile?.displayName ??
          user.profile?.username ??
          `Membre ${memberId.slice(0, 8)}`,
        title: user.role,
        ...getLevelForUser(memberId),
      });
    }

    return result.sort((a, b) => a.displayOrder - b.displayOrder);
  },

  getMember(memberId: string) {
    return clanRepository.findByMemberId(memberId);
  },

  saveMember(data: ClanMemberInput) {
    return clanRepository.upsert(data.memberId, data);
  },

  setPortrait(memberId: string, portrait: string) {
    return clanRepository.updatePortrait(memberId, portrait);
  },
};
