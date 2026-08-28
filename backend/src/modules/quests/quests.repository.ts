import {
  Quest,
  UserQuest,
} from "./quests.model";
import type {
  QuestObjective,
  QuestStep,
} from "./quests.types";

type QuestWriteData = {
  questId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  difficulty?: number;
  prerequisites?: string[];
  steps?: QuestStep[];
  objectives: QuestObjective[];
  rewardXp: number;
  rewardCurrencyId?: string;
  rewardAmount: number;
  rewardAchievementId?: string;
  enabled?: boolean;
};

type QuestUpdateData = Partial<Omit<QuestWriteData, "questId" | "objectives">> & {
  objectives?: QuestObjective[];
};

export class QuestsRepository {
  async findAll() {
    return Quest.find().sort({ name: 1 });
  }

  async findByQuestId(questId: string) {
    return Quest.findOne({ questId });
  }

  async create(data: QuestWriteData) {
    return Quest.create(data);
  }

  async update(
    questId: string,
    data: QuestUpdateData
  ) {
    return Quest.findOneAndUpdate(
      { questId },
      data,
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async delete(questId: string) {
    return Quest.findOneAndDelete({ questId });
  }

  async findUserQuest(
    userId: string,
    questId: string
  ) {
    return UserQuest.findOne({
      userId,
      questId,
    });
  }

  async arePrerequisitesCompleted(
    userId: string,
    prerequisites: string[]
  ) {
    if (prerequisites.length === 0) {
      return true;
    }

    const completedCount =
      await UserQuest.countDocuments({
        userId,
        questId: { $in: prerequisites },
        status: "completed",
      });

    return completedCount === prerequisites.length;
  }

  async lockQuestCompletion(
    userId: string,
    questId: string
  ) {
    return UserQuest.findOneAndUpdate(
      {
        userId,
        questId,
        status: "active",
        completionProcessing: false,
      },
      {
        $set: {
          completionProcessing: true,
        },
      },
      { new: true }
    );
  }

  async completeQuest(
    userId: string,
    questId: string
  ) {
    return UserQuest.findOneAndUpdate(
      {
        userId,
        questId,
        status: "active",
        completionProcessing: true,
      },
      {
        $set: {
          status: "completed",
          completedAt: new Date(),
          completionProcessing: false,
        },
      },
      { new: true }
    );
  }

  async unlockQuestCompletion(
    userId: string,
    questId: string
  ) {
    return UserQuest.findOneAndUpdate(
      {
        userId,
        questId,
        status: "active",
        completionProcessing: true,
      },
      {
        $set: {
          completionProcessing: false,
        },
      },
      { new: true }
    );
  }

  async findUserQuests(userId: string) {
    return UserQuest.find({ userId }).sort({
      startedAt: -1,
    });
  }

  async hasUserQuests(questId: string) {
    const count = await UserQuest.countDocuments({
      questId,
    });

    return count > 0;
  }

  async startQuest(
    userId: string,
    questId: string,
    objectives: {
      objectiveId: string;
      current: number;
      validationStatus:
        | "not_required"
        | "not_submitted";
    }[]
  ) {
    return UserQuest.create({
      userId,
      questId,
      objectives,
      status: "active",
      startedAt: new Date(),
      completionProcessing: false,
    });
  }

  async findSubmission(submissionId: string) {
    const { QuestSubmission } =
      await import("./quest-submission.model");

    return QuestSubmission.findById(submissionId);
  }

  async findPendingSubmissions() {
    const { QuestSubmission } =
      await import("./quest-submission.model");

    return QuestSubmission.find({
      status: "pending",
    }).sort({ createdAt: -1 });
  }

  async findUserSubmissions(
    userId: string,
    questId?: string
  ) {
    const { QuestSubmission } =
      await import("./quest-submission.model");

    return QuestSubmission.find({
      userId,
      ...(questId ? { questId } : {}),
    }).sort({ createdAt: -1 });
  }

  async createSubmission(
    data: Record<string, unknown>
  ) {
    const { QuestSubmission } =
      await import("./quest-submission.model");

    return QuestSubmission.create(data);
  }

  async reviewSubmission(
    submissionId: string,
    data: {
      status: "approved" | "rejected";
      adminResponse?: string;
      reviewedBy: string;
    }
  ) {
    const { QuestSubmission } =
      await import("./quest-submission.model");

    return QuestSubmission.findOneAndUpdate(
      {
        _id: submissionId,
        status: "pending",
      },
      {
        $set: {
          ...data,
          reviewedAt: new Date(),
        },
      },
      { new: true }
    );
  }

  async updateObjectiveValidation(
    userId: string,
    questId: string,
    objectiveId: string,
    data: {
      validationStatus:
        | "not_required"
        | "not_submitted"
        | "pending"
        | "approved"
        | "rejected";
      lastSubmissionId?: string;
      validationMessage?: string;
      validatedAt?: Date;
    }
  ) {
    const set: Record<string, unknown> = {
      "objectives.$.validationStatus":
        data.validationStatus,
    };

    if (
      data.lastSubmissionId !== undefined
    ) {
      set["objectives.$.lastSubmissionId"] =
        data.lastSubmissionId;
    }

    if (
      data.validationMessage !== undefined
    ) {
      set["objectives.$.validationMessage"] =
        data.validationMessage;
    } else if (
      data.validationStatus === "pending" ||
      data.validationStatus === "approved"
    ) {
      set["objectives.$.validationMessage"] =
        undefined;
    }

    if (data.validatedAt !== undefined) {
      set["objectives.$.validatedAt"] =
        data.validatedAt;
    } else if (
      data.validationStatus === "pending"
    ) {
      set["objectives.$.validatedAt"] =
        undefined;
    }

    return UserQuest.findOneAndUpdate(
      {
        userId,
        questId,
        status: "active",
        "objectives.objectiveId": objectiveId,
      },
      { $set: set },
      { new: true }
    );
  }
}

export const questsRepository =
  new QuestsRepository();
