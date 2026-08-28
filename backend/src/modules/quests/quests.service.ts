import { QuestsRepository } from "./quests.repository";
import { EconomyService } from "../economy/economy.service";
import { AchievementsService } from "../achievements/achievements.service";
import { LevelsService } from "../levels/levels.service";
import {
  GameEvent,
} from "../events/events.types";

export class QuestsService {
  constructor(
    private readonly questsRepository =
      new QuestsRepository(),

    private readonly economyService =
      new EconomyService(),

    private readonly achievementsService =
      new AchievementsService(),

    private readonly levelsService =
      new LevelsService()
  ) {}

  // =========================================================
  // QUÊTES
  // =========================================================

  async getQuests() {
    return this.questsRepository.findAll();
  }

  async getQuest(
    questId: string
  ) {
    const quest =
      await this.questsRepository.findByQuestId(
        questId
      );

    if (!quest) {
      throw new Error(
        "Quête introuvable."
      );
    }

    return quest;
  }

  // =========================================================
  // QUÊTES UTILISATEUR
  // =========================================================

  async getUserQuests(
    userId: string
  ) {
    return this.questsRepository.findUserQuests(
      userId
    );
  }

  // =========================================================
  // CRÉATION
  // =========================================================

  async createQuest(data: {
    questId: string;
    name: string;
    description?: string;
    imageUrl?: string;
    difficulty?: number;

    prerequisites?: string[];

    steps?: {
      stepId: string;
      name: string;
      description?: string;
      imageUrl?: string;
      difficulty: number;
      objectives: {
        objectiveId: string;
        name: string;
        description?: string;
        target: number;
        eventType?: string;
        eventTargetId?: string;
        requiresProof?: boolean;
      }[];
    }[];

    objectives: {
      objectiveId: string;
      name: string;
      description?: string;
      target: number;
      eventType?: string;
      eventTargetId?: string;
      requiresProof?: boolean;
    }[];

    rewardXp: number;
    rewardCurrencyId?: string;
    rewardAmount: number;
    rewardAchievementId?: string;

    enabled?: boolean;
  }) {
    const existing =
      await this.questsRepository.findByQuestId(
        data.questId
      );

    if (existing) {
      throw new Error(
        "Cette quête existe déjà."
      );
    }

    if (
      !data.questId ||
      !data.questId.trim()
    ) {
      throw new Error(
        "L'identifiant de la quête est obligatoire."
      );
    }

    if (
      !data.name ||
      !data.name.trim()
    ) {
      throw new Error(
        "Le nom de la quête est obligatoire."
      );
    }

    if (
      !Array.isArray(data.objectives) ||
      data.objectives.length === 0
    ) {
      throw new Error(
        "Une quête doit posséder au moins un objectif."
      );
    }

    for (const objective of data.objectives) {
      if (
        !objective.objectiveId ||
        !objective.objectiveId.trim()
      ) {
        throw new Error(
          "Chaque objectif doit posséder un identifiant."
        );
      }

      if (
        !objective.name ||
        !objective.name.trim()
      ) {
        throw new Error(
          "Chaque objectif doit posséder un nom."
        );
      }

      if (
        typeof objective.target !== "number" ||
        objective.target <= 0
      ) {
        throw new Error(
          "La cible d'un objectif doit être supérieure à zéro."
        );
      }
    }

    if (
      data.difficulty !== undefined &&
      (!Number.isInteger(data.difficulty) ||
        data.difficulty < 1 ||
        data.difficulty > 5)
    ) {
      throw new Error(
        "La difficulté de la quête doit être comprise entre 1 et 5."
      );
    }

    if (data.steps !== undefined) {
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error("Une quête doit posséder au moins une étape.");
      }

      const stepIds = new Set<string>();
      const objectiveIds = new Set<string>();

      for (const step of data.steps) {
        if (!step.stepId?.trim() || !step.name?.trim()) {
          throw new Error("Chaque étape doit posséder un identifiant et un nom.");
        }

        if (stepIds.has(step.stepId)) {
          throw new Error(`L'identifiant d'étape "${step.stepId}" est dupliqué.`);
        }
        stepIds.add(step.stepId);

        if (
          !Number.isInteger(step.difficulty) ||
          step.difficulty < 1 ||
          step.difficulty > 5
        ) {
          throw new Error(
            `La difficulté de l'étape "${step.name}" doit être comprise entre 1 et 5.`
          );
        }

        if (!Array.isArray(step.objectives) || step.objectives.length === 0) {
          throw new Error(`L'étape "${step.name}" doit posséder au moins un objectif.`);
        }

        for (const objective of step.objectives) {
          if (objectiveIds.has(objective.objectiveId)) {
            throw new Error(
              `L'identifiant d'objectif "${objective.objectiveId}" est dupliqué.`
            );
          }
          objectiveIds.add(objective.objectiveId);
        }
      }
    }

    if (
      typeof data.rewardXp !== "number" ||
      data.rewardXp < 0
    ) {
      throw new Error(
        "La récompense XP ne peut pas être négative."
      );
    }

    if (
      typeof data.rewardAmount !== "number" ||
      data.rewardAmount < 0
    ) {
      throw new Error(
        "La récompense monétaire ne peut pas être négative."
      );
    }

    // =======================================================
    // VALIDATION DES RÉCOMPENSES
    // =======================================================

    if (
      data.rewardAchievementId
    ) {
      const achievement =
        await this.achievementsService.getAchievement(
          data.rewardAchievementId
        );

      if (!achievement) {
        throw new Error(
          `Le succès "${data.rewardAchievementId}" est introuvable.`
        );
      }
    }

    const prerequisites = data.prerequisites ?? [];

    if (prerequisites.includes(data.questId)) {
      throw new Error(
        "Une quête ne peut pas avoir elle-même comme prérequis."
      );
    }

    const uniquePrerequisites = new Set(prerequisites);

    if (uniquePrerequisites.size !== prerequisites.length) {
      throw new Error(
        "Les prérequis d'une quête doivent être uniques."
      );
    }

    for (const prerequisiteId of prerequisites) {
      const prerequisite =
        await this.questsRepository.findByQuestId(
          prerequisiteId
        );

      if (!prerequisite) {
        throw new Error(
          `La quête prérequise "${prerequisiteId}" est introuvable.`
        );
      }
    }

    return this.questsRepository.create({
      ...data,
      prerequisites,
    });
  }
  
  async handleGameEvent(event: GameEvent) {
    const userQuests =
      await this.getUserQuests(event.userId);

    for (const userQuest of userQuests) {
      if (userQuest.status !== "active") {
        continue;
      }

      const quest = await this.getQuest(
        userQuest.questId
      );

      if (!quest) {
        continue;
      }

      for (const objective of quest.objectives) {
        if (
          objective.eventType !== event.type
        ) {
          continue;
        }

        if (
          objective.eventTargetId &&
          objective.eventTargetId !== event.targetId
        ) {
          continue;
        }

        const amount = event.quantity ?? 1;

        // Un objectif nécessitant une preuve ne peut pas être
        // validé par un événement automatique (bot / activité de jeu).
        // Le membre doit fournir une preuve et un ADMIN/OWNER doit
        // la valider manuellement.
        if (objective.requiresProof === true) {
          continue;
        }

        await this.updateProgress(
          event.userId,
          quest.questId,
          objective.objectiveId,
          amount
        );
      }
    }
  }


  // =========================================================
  // MODIFICATION
  // =========================================================

  async updateQuest(
    questId: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      difficulty?: number;
      prerequisites?: string[];

      steps?: {
        stepId: string;
        name: string;
        description?: string;
        imageUrl?: string;
        difficulty: number;
        objectives: {
          objectiveId: string;
          name: string;
          description?: string;
          target: number;
          eventType?: string;
          eventTargetId?: string;
        requiresProof?: boolean;
        }[];
      }[];

      objectives?: {
        objectiveId: string;
        name: string;
        description?: string;
        target: number;
        eventType?: string;
        eventTargetId?: string;
        requiresProof?: boolean;
      }[];

      rewardXp?: number;
      rewardCurrencyId?: string;
      rewardAmount?: number;
      rewardAchievementId?: string;

      enabled?: boolean;
    }
  ) {
    const existing =
      await this.questsRepository.findByQuestId(
        questId
      );

    if (!existing) {
      throw new Error(
        "Quête introuvable."
      );
    }

    if (
      data.name !== undefined &&
      !data.name.trim()
    ) {
      throw new Error(
        "Le nom de la quête ne peut pas être vide."
      );
    }

    if (
      data.objectives !== undefined
    ) {
      if (
        !Array.isArray(data.objectives) ||
        data.objectives.length === 0
      ) {
        throw new Error(
          "Une quête doit posséder au moins un objectif."
        );
      }

      for (const objective of data.objectives) {
        if (
          !objective.objectiveId ||
          !objective.objectiveId.trim()
        ) {
          throw new Error(
            "Chaque objectif doit posséder un identifiant."
          );
        }

        if (
          !objective.name ||
          !objective.name.trim()
        ) {
          throw new Error(
            "Chaque objectif doit posséder un nom."
          );
        }

        if (
          typeof objective.target !== "number" ||
          objective.target <= 0
        ) {
          throw new Error(
            "La cible d'un objectif doit être supérieure à zéro."
          );
        }
      }
    }

    if (
      data.rewardXp !== undefined &&
      (
        typeof data.rewardXp !== "number" ||
        data.rewardXp < 0
      )
    ) {
      throw new Error(
        "La récompense XP ne peut pas être négative."
      );
    }

    if (
      data.rewardAmount !== undefined &&
      (
        typeof data.rewardAmount !== "number" ||
        data.rewardAmount < 0
      )
    ) {
      throw new Error(
        "La récompense monétaire ne peut pas être négative."
      );
    }

    if (
      data.difficulty !== undefined &&
      (!Number.isInteger(data.difficulty) ||
        data.difficulty < 1 ||
        data.difficulty > 5)
    ) {
      throw new Error(
        "La difficulté de la quête doit être comprise entre 1 et 5."
      );
    }

    if (data.steps !== undefined) {
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        throw new Error("Une quête doit posséder au moins une étape.");
      }

      const stepIds = new Set<string>();
      const objectiveIds = new Set<string>();

      for (const step of data.steps) {
        if (!step.stepId?.trim() || !step.name?.trim()) {
          throw new Error("Chaque étape doit posséder un identifiant et un nom.");
        }

        if (stepIds.has(step.stepId)) {
          throw new Error(`L'identifiant d'étape "${step.stepId}" est dupliqué.`);
        }
        stepIds.add(step.stepId);

        if (
          !Number.isInteger(step.difficulty) ||
          step.difficulty < 1 ||
          step.difficulty > 5
        ) {
          throw new Error(
            `La difficulté de l'étape "${step.name}" doit être comprise entre 1 et 5.`
          );
        }

        if (!Array.isArray(step.objectives) || step.objectives.length === 0) {
          throw new Error(`L'étape "${step.name}" doit posséder au moins un objectif.`);
        }

        for (const objective of step.objectives) {
          if (objectiveIds.has(objective.objectiveId)) {
            throw new Error(
              `L'identifiant d'objectif "${objective.objectiveId}" est dupliqué.`
            );
          }
          objectiveIds.add(objective.objectiveId);
        }
      }
    }

    // Valeurs finales après modification
    const finalCurrencyId =
      data.rewardCurrencyId !== undefined
        ? data.rewardCurrencyId
        : existing.rewardCurrencyId;

    const finalRewardAmount =
      data.rewardAmount !== undefined
        ? data.rewardAmount
        : existing.rewardAmount;

    const finalAchievementId =
      data.rewardAchievementId !== undefined
        ? data.rewardAchievementId
        : existing.rewardAchievementId;

    // =======================================================
    // VALIDATION SUCCÈS
    // =======================================================

    if (finalAchievementId) {
      const achievement =
        await this.achievementsService.getAchievement(
          finalAchievementId
        );

      if (!achievement) {
        throw new Error(
          `Le succès "${finalAchievementId}" est introuvable.`
        );
      }
    }

    if (data.prerequisites !== undefined) {
      const prerequisites = data.prerequisites;

      if (prerequisites.includes(questId)) {
        throw new Error(
          "Une quête ne peut pas avoir elle-même comme prérequis."
        );
      }

      const uniquePrerequisites = new Set(prerequisites);

      if (uniquePrerequisites.size !== prerequisites.length) {
        throw new Error(
          "Les prérequis d'une quête doivent être uniques."
        );
      }

      for (const prerequisiteId of prerequisites) {
        const prerequisite =
          await this.questsRepository.findByQuestId(
            prerequisiteId
          );

        if (!prerequisite) {
          throw new Error(
            `La quête prérequise "${prerequisiteId}" est introuvable.`
          );
        }
      }
    }

    const quest =
      await this.questsRepository.update(
        questId,
        data
      );

    if (!quest) {
      throw new Error(
        "Impossible de modifier la quête."
      );
    }

    return quest;
  }

  async adminValidateObjective(
    _userId: string,
    _questId: string,
    _objectiveId: string
  ) {
    throw new Error(
      "La validation d'un objectif nécessitant une preuve doit être effectuée depuis une soumission de preuve."
    );
  }

  async adminCompleteQuest(
    userId: string,
    questId: string
  ) {
    const quest = await this.getQuest(questId);

    if (!quest) {
      throw new Error("Quête introuvable.");
    }

    for (const objective of quest.objectives) {
      await this.updateProgress(
        userId,
        questId,
        objective.objectiveId,
        objective.target
      );
    }

    return this.completeQuest(
      userId,
      questId
    );
  }

  // =========================================================
  // SUPPRESSION
  // =========================================================

  async deleteQuest(
    questId: string
  ) {
    const existing =
      await this.questsRepository.findByQuestId(
        questId
      );

    if (!existing) {
      throw new Error(
        "Quête introuvable."
      );
    }

    const hasUserQuests =
      await this.questsRepository.hasUserQuests(
        questId
      );

    if (hasUserQuests) {
      throw new Error(
        "Cette quête ne peut pas être supprimée car elle possède déjà un historique de membres. Désactivez-la à la place."
      );
    }

    const deleted =
      await this.questsRepository.delete(
        questId
      );

    if (!deleted) {
      throw new Error(
        "Impossible de supprimer la quête."
      );
    }

    return deleted;
  }

  // =========================================================
  // QUÊTES UTILISATEUR
  // =========================================================

  async startQuest(
    userId: string,
    questId: string
  ) {
    const quest =
      await this.questsRepository.findByQuestId(
        questId
      );

    if (!quest) {
      throw new Error(
        "Quête introuvable."
      );
    }

    if (!quest.enabled) {
      throw new Error(
        "Cette quête est actuellement désactivée."
      );
    }

    const existing =
      await this.questsRepository.findUserQuest(
        userId,
        questId
      );

    if (existing) {
      throw new Error(
        "Cette quête a déjà été commencée par ce membre."
      );
    }

    // =========================================================
    // VÉRIFICATION DES PRÉREQUIS
    // =========================================================

    const prerequisites =
      quest.prerequisites ?? [];

    if (prerequisites.length > 0) {
      const userQuests =
        await this.questsRepository.findUserQuests(
          userId
        );

      const completedQuestIds =
        new Set(
          userQuests
            .filter(
              (userQuest) =>
                userQuest.status ===
                "completed"
            )
            .map(
              (userQuest) =>
                userQuest.questId
            )
        );

      const missingPrerequisites =
        prerequisites.filter(
          (prerequisiteId) =>
            !completedQuestIds.has(
              prerequisiteId
            )
        );

      if (
        missingPrerequisites.length > 0
      ) {
        throw new Error(
          `Cette quête nécessite d'abord de terminer : ${missingPrerequisites.join(", ")}.`
        );
      }
    }

    // =========================================================
    // INITIALISATION DES OBJECTIFS
    // =========================================================

    const objectives =
      quest.objectives.map(
        (objective) => ({
          objectiveId: objective.objectiveId,
          current: 0,
          validationStatus: (
            objective.requiresProof
              ? "not_submitted"
              : "not_required"
          ) as "not_required" | "not_submitted",
        })
      );

    return this.questsRepository.startQuest(
      userId,
      questId,
      objectives
    );
  }

  // =========================================================
  // PROGRESSION
  // =========================================================

  async updateProgress(
    userId: string,
    questId: string,
    objectiveId: string,
    amount: number
  ) {
    if (
      typeof amount !== "number" ||
      amount <= 0
    ) {
      throw new Error(
        "La progression doit être supérieure à zéro."
      );
    }

    const quest =
      await this.questsRepository.findByQuestId(
        questId
      );

    if (!quest) {
      throw new Error(
        "Quête introuvable."
      );
    }

    const userQuest =
      await this.questsRepository.findUserQuest(
        userId,
        questId
      );

    if (!userQuest) {
      throw new Error(
        "Cette quête n'a pas encore été commencée."
      );
    }

    if (
      userQuest.status ===
      "completed"
    ) {
      throw new Error(
        "Cette quête est déjà terminée."
      );
    }

    const objective =
      quest.objectives.find(
        (item) =>
          item.objectiveId ===
          objectiveId
      );

    if (!objective) {
      throw new Error(
        "Objectif introuvable."
      );
    }

    const userObjective =
      userQuest.objectives.find(
        (item) =>
          item.objectiveId ===
          objectiveId
      );

    if (!userObjective) {
      throw new Error(
        "Progression de l'objectif introuvable."
      );
    }

    // Les objectifs nécessitant une preuve ne sont jamais incrémentés
    // automatiquement. Leur progression reste à 0 jusqu'à la validation
    // manuelle d'une preuve par un ADMIN/OWNER.
    if (objective.requiresProof === true) {
      if (!userObjective.validationStatus) {
        userObjective.validationStatus = "not_submitted";
        await userQuest.save();
      }

      return userQuest;
    }

    userObjective.current = Math.min(
      userObjective.current + amount,
      objective.target
    );
    userObjective.validationStatus = "not_required";

    await userQuest.save();

    return userQuest;
  }

  // =========================================================
  // TERMINER UNE QUÊTE
  // =========================================================


  // =========================================================
  // TERMINER UNE QUÊTE
  // =========================================================

  async completeQuest(
    userId: string,
    questId: string
  ) {
    const quest = await this.questsRepository.findByQuestId(questId);

    if (!quest) {
      throw new Error("Quête introuvable.");
    }

    const userQuest = await this.questsRepository.findUserQuest(
      userId,
      questId
    );

    if (!userQuest) {
      throw new Error("Cette quête n'a pas été commencée.");
    }

    if (userQuest.status === "completed") {
      throw new Error("Cette quête est déjà terminée.");
    }

    // Tous les objectifs doivent avoir atteint leur cible.
    // Seuls les objectifs nécessitant une preuve doivent être approuvés.
    for (const objective of quest.objectives) {
      const progress = userQuest.objectives.find(
        (item) => item.objectiveId === objective.objectiveId
      );

      if (!progress || progress.current < objective.target) {
        throw new Error(
          `L'objectif "${objective.name}" n'est pas terminé.`
        );
      }

      if (
        objective.requiresProof === true &&
        progress.validationStatus !== "approved"
      ) {
        throw new Error(
          `L'objectif "${objective.name}" doit être validé par un administrateur.`
        );
      }
    }

    // Verrou atomique pour empêcher une double attribution des récompenses.
    const locked = await this.questsRepository.lockQuestCompletion(
      userId,
      questId
    );

    if (!locked) {
      throw new Error(
        "La validation de cette quête est déjà en cours."
      );
    }

    try {
      let level = null;

      if (quest.rewardXp > 0) {
        level = await this.levelsService.addXp(
          userId,
          quest.rewardXp,
          "QUEST",
          `Récompense de la quête : ${quest.name}`,
          questId
        );
      }

      let balances = null;

      if (
        quest.rewardCurrencyId &&
        quest.rewardAmount > 0
      ) {
        balances = await this.economyService.addReward(
          userId,
          quest.rewardCurrencyId,
          quest.rewardAmount,
          "quest_reward",
          "quest",
          questId,
          `Récompense de la quête : ${quest.name}`
        );
      }

      let achievement = null;

      if (quest.rewardAchievementId) {
        achievement = await this.achievementsService.unlockAchievement(
          userId,
          quest.rewardAchievementId,
          "quest"
        );
      }

      const completed = await this.questsRepository.completeQuest(
        userId,
        questId
      );

      if (!completed) {
        throw new Error("Impossible de finaliser la quête.");
      }

      const { notificationsService } = await import(
        "../notifications/notifications.service"
      );

      await notificationsService.create({
        recipientId: userId,
        type: "QUEST_COMPLETED",
        title: "Quête terminée",
        message: `La quête « ${quest.name} » est terminée. Vos récompenses ont été attribuées.`,
        data: {
          questId,
          rewardXp: quest.rewardXp,
          rewardCurrencyId: quest.rewardCurrencyId ?? null,
          rewardAmount: quest.rewardAmount,
          rewardAchievementId: quest.rewardAchievementId ?? null,
        },
      });

      return {
        questId,
        status: "completed",
        completedAt: completed.completedAt,
        reward: {
          xp: quest.rewardXp,
          currencyId: quest.rewardCurrencyId ?? null,
          amount: quest.rewardAmount,
        },
        level,
        balances,
        achievement,
      };
    } catch (error) {
      await this.questsRepository.unlockQuestCompletion(
        userId,
        questId
      );

      throw error;
    }
  }

  // =========================================================
  // SOUMISSION DE PREUVE
  // =========================================================

  async submitObjective(
    userId: string,
    questId: string,
    objectiveId: string,
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

    const quest = await this.getQuest(questId);

    const objective = quest.objectives.find(
      (item) => item.objectiveId === objectiveId
    );

    if (!objective) {
      throw new Error("Objectif introuvable.");
    }

    // Une validation manuelle peut être demandée pour tout objectif d'une
    // quête active. requiresProof reste utile pour empêcher la progression
    // automatique et pour le contrôle de finalisation, mais ne conditionne
    // plus l'affichage ou l'envoi d'une preuve.

    const userQuest = await this.questsRepository.findUserQuest(
      userId,
      questId
    );

    if (!userQuest || userQuest.status !== "active") {
      throw new Error("Cette quête n'est pas active.");
    }

    const userObjective = userQuest.objectives.find(
      (item) => item.objectiveId === objectiveId
    );

    if (!userObjective) {
      throw new Error(
        "Progression de l'objectif introuvable."
      );
    }

    // Une preuve est précisément utilisée lorsque le système ne peut pas
    // constater automatiquement que l'objectif a été réalisé. Il est donc
    // normal que current soit encore à 0 au moment de la demande.
    if (userObjective.validationStatus === "pending") {
      throw new Error(
        "Une demande de validation est déjà en attente."
      );
    }

    if (userObjective.validationStatus === "approved") {
      throw new Error(
        "Cet objectif est déjà validé."
      );
    }

    const submission = await this.questsRepository.createSubmission({
      userId,
      questId,
      objectiveId,
      message: message.trim(),
      attachments,
      status: "pending",
    });

    await this.questsRepository.updateObjectiveValidation(
      userId,
      questId,
      objectiveId,
      {
        validationStatus: "pending",
        lastSubmissionId: String(submission._id),
        validationMessage: undefined,
        validatedAt: undefined,
      }
    );

    const { notificationsService } = await import(
      "../notifications/notifications.service"
    );

    await notificationsService.createForRoles(
      ["ADMIN", "OWNER"],
      {
        type: "QUEST_SUBMISSION_CREATED",
        title: "Nouvelle preuve de quête",
        message: `Une nouvelle preuve a été soumise pour « ${objective.name} ».`,
        data: {
          submissionId: String(submission._id),
          userId,
          questId,
          objectiveId,
        },
      }
    );

    return submission;
  }

  async getPendingSubmissions() {
    return this.questsRepository.findPendingSubmissions();
  }

  async getUserSubmissions(
    userId: string,
    questId?: string
  ) {
    return this.questsRepository.findUserSubmissions(
      userId,
      questId
    );
  }

  // =========================================================
  // VALIDATION ADMINISTRATIVE
  // =========================================================

  async reviewSubmission(
    submissionId: string,
    reviewerId: string,
    status: "approved" | "rejected",
    response?: string
  ) {
    const trimmedResponse = response?.trim();

    if (
      status === "rejected" &&
      !trimmedResponse
    ) {
      throw new Error(
        "Un motif est obligatoire pour refuser une preuve."
      );
    }

    const submission =
      await this.questsRepository.findSubmission(
        submissionId
      );

    if (!submission) {
      throw new Error(
        "Demande de validation introuvable."
      );
    }

    if (submission.status !== "pending") {
      throw new Error(
        "Cette demande a déjà été traitée."
      );
    }

    const reviewed =
      await this.questsRepository.reviewSubmission(
        submissionId,
        {
          status,
          adminResponse: trimmedResponse,
          reviewedBy: reviewerId,
        }
      );

    if (!reviewed) {
      throw new Error(
        "Cette demande a déjà été traitée."
      );
    }

    await this.questsRepository.updateObjectiveValidation(
      submission.userId,
      submission.questId,
      submission.objectiveId,
      {
        validationStatus: status,
        lastSubmissionId: submissionId,
        validationMessage: trimmedResponse,
        validatedAt: new Date(),
      }
    );

    // La validation administrative transforme la preuve en progression.
    // Tant que la preuve n'est pas approuvée, l'objectif reste à 0/x.
    if (status === "approved") {
      const approvedQuest = await this.questsRepository.findUserQuest(
        submission.userId,
        submission.questId
      );

      if (!approvedQuest) {
        throw new Error(
          "La quête du membre est introuvable après validation de la preuve."
        );
      }

      const approvedObjective = approvedQuest.objectives.find(
        (item) => item.objectiveId === submission.objectiveId
      );

      const questForTarget = await this.getQuest(submission.questId);
      const objectiveForTarget = questForTarget.objectives.find(
        (item) => item.objectiveId === submission.objectiveId
      );

      if (!approvedObjective || !objectiveForTarget) {
        throw new Error(
          "Objectif introuvable après validation de la preuve."
        );
      }

      approvedObjective.current = objectiveForTarget.target;
      await approvedQuest.save();
    }

    const quest =
      await this.getQuest(submission.questId);

    const objective =
      quest.objectives.find(
        (item) =>
          item.objectiveId ===
          submission.objectiveId
      );

    const { notificationsService } =
      await import(
        "../notifications/notifications.service"
      );

    await notificationsService.create({
      recipientId: submission.userId,
      type:
        status === "approved"
          ? "QUEST_SUBMISSION_APPROVED"
          : "QUEST_SUBMISSION_REJECTED",
      title:
        status === "approved"
          ? "Objectif validé"
          : "Preuve refusée",
      message:
        status === "approved"
          ? `Votre preuve pour « ${
              objective?.name ??
              submission.objectiveId
            } » a été validée.`
          : `Votre preuve pour « ${
              objective?.name ??
              submission.objectiveId
            } » a été refusée.${
              trimmedResponse
                ? ` Motif : ${trimmedResponse}`
                : ""
            }`,
      data: {
        submissionId,
        questId: submission.questId,
        objectiveId: submission.objectiveId,
        adminResponse: trimmedResponse,
      },
    });

    return reviewed;
  }
}
