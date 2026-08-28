import { AchievementsRepository } from "./achievements.repository";
import { EconomyService } from "../economy/economy.service";
import { Quest } from "../quests/quests.model";
import type {
  AchievementLevel,
  AchievementWithQuestLink,
  FeaturedUserAchievement,
} from "./achievements.types";

export type AchievementUnlockSource = "manual" | "quest";

export class AchievementsService {
  constructor(
    private readonly achievementsRepository = new AchievementsRepository(),
    private readonly economyService = new EconomyService()
  ) {}

  private async getQuestLink(achievementId: string) {
    const quest = await Quest.findOne({
      rewardAchievementId: achievementId,
    }).select("questId name");

    if (!quest) {
      return null;
    }

    return {
      questId: quest.questId,
      questName: quest.name,
    };
  }

  private async withQuestLink(achievement: any): Promise<AchievementWithQuestLink> {
    const plain = typeof achievement?.toObject === "function"
      ? achievement.toObject()
      : achievement;

    const link = await this.getQuestLink(plain.achievementId);

    return {
      ...plain,
      linkedQuestId: link?.questId,
      linkedQuestName: link?.questName,
    };
  }

  async getAchievements(): Promise<AchievementWithQuestLink[]> {
    const achievements = await this.achievementsRepository.findAll();
    return Promise.all(achievements.map((achievement) => this.withQuestLink(achievement)));
  }

  async getAchievement(achievementId: string): Promise<AchievementWithQuestLink> {
    const achievement = await this.achievementsRepository.findByAchievementId(achievementId);

    if (!achievement) {
      throw new Error("Exploit introuvable.");
    }

    return this.withQuestLink(achievement);
  }

  async createAchievement(data: {
    achievementId: string;
    name: string;
    description?: string;
    level: AchievementLevel;
    rewardCurrencyId?: string;
    rewardAmount: number;
    enabled?: boolean;
  }) {
    const existing = await this.achievementsRepository.findByAchievementId(
      data.achievementId
    );

    if (existing) {
      throw new Error("Cet exploit existe déjà.");
    }

    if (!Number.isInteger(data.level) || ![1, 2, 3].includes(data.level)) {
      throw new Error("Le niveau de l'exploit doit être 1, 2 ou 3.");
    }

    if (data.rewardAmount < 0) {
      throw new Error("La récompense ne peut pas être négative.");
    }

    return this.achievementsRepository.create(data);
  }

  async updateAchievement(
    achievementId: string,
    data: {
      name?: string;
      description?: string;
      level?: AchievementLevel;
      rewardCurrencyId?: string;
      rewardAmount?: number;
      enabled?: boolean;
    }
  ) {
    const existing = await this.achievementsRepository.findByAchievementId(achievementId);

    if (!existing) {
      throw new Error("Exploit introuvable.");
    }

    if (data.name !== undefined && !data.name.trim()) {
      throw new Error("Le titre de l'exploit ne peut pas être vide.");
    }

    if (
      data.level !== undefined &&
      (!Number.isInteger(data.level) || ![1, 2, 3].includes(data.level))
    ) {
      throw new Error("Le niveau de l'exploit doit être 1, 2 ou 3.");
    }

    if (
      data.rewardAmount !== undefined &&
      (typeof data.rewardAmount !== "number" || data.rewardAmount < 0)
    ) {
      throw new Error("La récompense ne peut pas être négative.");
    }

    const updated = await this.achievementsRepository.update(achievementId, data);

    if (!updated) {
      throw new Error("Impossible de modifier l'exploit.");
    }

    return this.withQuestLink(updated);
  }

  async getUserAchievements(userId: string) {
    return this.achievementsRepository.findUserAchievements(userId);
  }

  async getFeaturedUserAchievements(userId: string): Promise<FeaturedUserAchievement[]> {
    return this.achievementsRepository.findFeaturedUserAchievements(userId);
  }

  async setFeaturedAchievements(userId: string, achievementIds: unknown) {
    if (!Array.isArray(achievementIds)) {
      throw new Error("La liste des exploits mis en avant est obligatoire.");
    }

    const normalizedIds = achievementIds
      .map((value) => String(value).trim())
      .filter(Boolean);

    const uniqueIds = [...new Set(normalizedIds)];

    if (uniqueIds.length > 3) {
      throw new Error("Vous ne pouvez mettre en avant que 3 exploits maximum.");
    }

    if (uniqueIds.length !== normalizedIds.length) {
      throw new Error("Un exploit ne peut apparaître qu'une seule fois.");
    }

    if (uniqueIds.length > 0) {
      const unlocked = await Promise.all(
        uniqueIds.map((achievementId) =>
          this.achievementsRepository.findUserAchievement(userId, achievementId)
        )
      );

      if (unlocked.some((item) => !item)) {
        throw new Error("Vous ne pouvez mettre en avant que des exploits que vous avez obtenus.");
      }
    }

    return this.achievementsRepository.setFeaturedAchievements(userId, uniqueIds);
  }

  async unlockAchievement(
    userId: string,
    achievementId: string,
    source: AchievementUnlockSource = "manual"
  ) {
    const achievement = await this.achievementsRepository.findByAchievementId(
      achievementId
    );

    if (!achievement) {
      throw new Error("Exploit introuvable.");
    }

    if (!achievement.enabled) {
      throw new Error("Cet exploit est actuellement désactivé.");
    }

    const questLink = await this.getQuestLink(achievementId);

    if (source === "manual" && questLink) {
      throw new Error(
        `L'exploit « ${achievement.name} » est attribué automatiquement à la fin de la quête « ${questLink.questName} ».`
      );
    }

    const alreadyUnlocked = await this.achievementsRepository.findUserAchievement(
      userId,
      achievementId
    );

    if (alreadyUnlocked) {
      throw new Error("Cet exploit a déjà été débloqué par ce membre.");
    }

    const unlocked = await this.achievementsRepository.unlock(userId, achievementId);

    let balances = null;

    if (achievement.rewardCurrencyId && achievement.rewardAmount > 0) {
      balances = await this.economyService.addBalance(
        userId,
        achievement.rewardCurrencyId,
        achievement.rewardAmount
      );
    }

    return {
      achievement: unlocked,
      reward: {
        currencyId: achievement.rewardCurrencyId ?? null,
        amount: achievement.rewardAmount,
      },
      balances,
    };
  }

  async submitAchievement(
    userId: string,
    achievementId: string,
    message: string,
    attachments: {
      type: "image" | "video" | "audio";
      url: string;
      originalName: string;
      mimeType: string;
      size: number;
    }[]
  ) {
    if (!message?.trim()) {
      throw new Error("Une explication est obligatoire.");
    }

    if (!attachments.length) {
      throw new Error("Au moins une pièce justificative est obligatoire.");
    }

    const achievement = await this.achievementsRepository.findByAchievementId(
      achievementId
    );

    if (!achievement) {
      throw new Error("Exploit introuvable.");
    }

    if (!achievement.enabled) {
      throw new Error("Cet exploit est actuellement désactivé.");
    }

    const questLink = await this.getQuestLink(achievementId);

    if (questLink) {
      throw new Error(
        `Cet exploit est lié à la quête « ${questLink.questName} » et sera attribué automatiquement à sa finalisation.`
      );
    }

    const alreadyUnlocked = await this.achievementsRepository.findUserAchievement(
      userId,
      achievementId
    );

    if (alreadyUnlocked) {
      throw new Error("Vous avez déjà obtenu cet exploit.");
    }

    const pending = await this.achievementsRepository.findPendingSubmission(
      userId,
      achievementId
    );

    if (pending) {
      throw new Error("Une demande de validation est déjà en attente.");
    }

    const submission = await this.achievementsRepository.createSubmission({
      userId,
      achievementId,
      message: message.trim(),
      attachments,
      status: "pending",
    });

    const { notificationsService } = await import(
      "../notifications/notifications.service"
    );

    await notificationsService.createForRoles(["ADMIN", "OWNER"], {
      type: "ACHIEVEMENT_SUBMISSION_CREATED",
      title: "Nouvelle demande de validation d'exploit",
      message: `Une preuve a été soumise pour l'exploit « ${achievement.name} » (${this.getLevelLabel(achievement.level)}).`,
      data: {
        submissionId: String(submission._id),
        userId,
        achievementId,
      },
    });

    return submission;
  }

  async getPendingSubmissions() {
    return this.achievementsRepository.findPendingSubmissions();
  }

  async getUserSubmissions(userId: string, achievementId?: string) {
    return this.achievementsRepository.findUserSubmissions(userId, achievementId);
  }

  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    status: "approved" | "rejected",
    response?: string
  ) {
    if (status === "rejected" && !response?.trim()) {
      throw new Error("Un motif est obligatoire pour refuser un exploit.");
    }

    const submission = await this.achievementsRepository.findSubmission(submissionId);

    if (!submission) {
      throw new Error("Demande de validation introuvable.");
    }

    if (submission.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée.");
    }

    const achievement = await this.achievementsRepository.findByAchievementId(
      submission.achievementId
    );

    if (!achievement) {
      throw new Error("Exploit introuvable.");
    }

    if (status === "approved") {
      await this.unlockAchievement(
        submission.userId,
        submission.achievementId,
        "manual"
      );
    }

    const reviewed = await this.achievementsRepository.reviewSubmission(
      submissionId,
      {
        status,
        adminResponse: response?.trim(),
        reviewedBy: reviewerId,
      }
    );

    if (!reviewed) {
      throw new Error("Cette demande a déjà été traitée.");
    }

    const { notificationsService } = await import(
      "../notifications/notifications.service"
    );

    await notificationsService.create({
      recipientId: submission.userId,
      type:
        status === "approved"
          ? "ACHIEVEMENT_SUBMISSION_APPROVED"
          : "ACHIEVEMENT_SUBMISSION_REJECTED",
      title:
        status === "approved"
          ? "Exploit validé"
          : "Exploit refusé",
      message:
        status === "approved"
          ? `Votre preuve pour l'exploit « ${achievement.name} » a été validée.`
          : `Votre preuve pour l'exploit « ${achievement.name} » a été refusée.`,
      data: {
        submissionId,
        achievementId: submission.achievementId,
        adminResponse: response?.trim(),
      },
    });

    return reviewed;
  }

  getLevelLabel(level: AchievementLevel) {
    switch (level) {
      case 1:
        return "Bronze";
      case 2:
        return "Argent";
      case 3:
        return "Or";
    }
  }
}
