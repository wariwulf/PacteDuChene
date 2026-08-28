import {
  LevelDefinition,
  UserLevel,
} from "./levels.model";

import type {
  LevelDefinitionDocument,
  UserLevelDocument,
} from "./levels.model";

export class LevelsRepository {

  // ============================================================
  // NIVEAUX
  // ============================================================

  async findAllLevels(): Promise<
    LevelDefinitionDocument[]
  > {
    return LevelDefinition
      .find()
      .sort({ level: 1 });
  }

  async findAll(): Promise<
    LevelDefinitionDocument[]
  > {
    return this.findAllLevels();
  }

  async findLevel(
    level: number
  ): Promise<
    LevelDefinitionDocument | null
  > {
    return LevelDefinition.findOne({
      level,
    });
  }

  async findByLevel(
    level: number
  ): Promise<
    LevelDefinitionDocument | null
  > {
    return this.findLevel(level);
  }

  async createLevel(
    data: {
      level: number;
      name: string;
      description?: string;
      requiredXp: number;
      enabled: boolean;
    }
  ): Promise<LevelDefinitionDocument> {
    return LevelDefinition.create(data);
  }

  async updateLevel(
    level: number,
    data: {
      name?: string;
      description?: string;
      requiredXp?: number;
      enabled?: boolean;
    }
  ): Promise<
    LevelDefinitionDocument | null
  > {
    return LevelDefinition.findOneAndUpdate(
      { level },
      {
        $set: data,
      },
      {
        new: true,
        runValidators: true,
      }
    );
  }

  async deleteLevel(
    level: number
  ): Promise<
    LevelDefinitionDocument | null
  > {
    return LevelDefinition.findOneAndDelete({
      level,
    });
  }

  // ============================================================
  // NIVEAU UTILISATEUR
  // ============================================================

  async findUserLevel(
    userId: string
  ): Promise<
    UserLevelDocument | null
  > {
    return UserLevel.findOne({
      userId,
    });
  }

  async createUserLevel(
    data: Partial<UserLevelDocument>
  ): Promise<UserLevelDocument> {
    return UserLevel.create(data);
  }

  async saveUserLevel(
    userLevel: UserLevelDocument
  ): Promise<UserLevelDocument> {
    return userLevel.save();
  }

  async findAllUserLevels(): Promise<
    UserLevelDocument[]
  > {
    return UserLevel
      .find()
      .sort({
        level: -1,
        xp: -1,
      });
  }

  // ============================================================
  // PROTECTION DES RÉCOMPENSES XP
  // ============================================================

  async hasRewardHistory(
    userId: string,
    source: "QUEST" | "ACHIEVEMENT",
    sourceId: string
  ): Promise<boolean> {
    const userLevel =
      await UserLevel.findOne(
        {
          userId,
          history: {
            $elemMatch: {
              action: "XP_ADD",
              source,
              sourceId,
            },
          },
        },
        {
          _id: 1,
        }
      );

    return !!userLevel;
  }
}

export const levelsRepository =
  new LevelsRepository();