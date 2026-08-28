import { LevelsRepository } from "./levels.repository";

import type {
  LevelSource,
  LevelResponse,
  UserLevelResponse,
} from "./levels.types";

import type {
  LevelDefinitionDocument,
  UserLevelDocument,
} from "./levels.model";

export class LevelsService {
  constructor(
    private readonly levelsRepository = new LevelsRepository()
  ) {}

  // =========================================================
  // OUTILS INTERNES
  // =========================================================

  private async getLevels(): Promise<LevelDefinitionDocument[]> {
    return this.levelsRepository.findAllLevels();
  }

  private async getLevelDefinition(
    level: number
  ): Promise<LevelDefinitionDocument> {
    const levelDefinition =
      await this.levelsRepository.findLevel(level);

    if (!levelDefinition) {
      throw new Error(
        `Le niveau ${level} n'existe pas.`
      );
    }

    return levelDefinition;
  }

  /**
   * Retourne le niveau correspondant à une XP totale.
   *
   * Le niveau le plus élevé dont requiredXp <= xp
   * est sélectionné.
   */
  private calculateLevel(
    xp: number,
    levels: LevelDefinitionDocument[]
  ): LevelDefinitionDocument {
    const enabledLevels = levels
      .filter(
        (level) =>
          level.enabled &&
          level.requiredXp <= xp
      )
      .sort(
        (a, b) =>
          b.level - a.level
      );

    if (enabledLevels.length > 0) {
      return enabledLevels[0];
    }

    const firstLevel = levels
      .filter((level) => level.enabled)
      .sort(
        (a, b) =>
          a.level - b.level
      )[0];

    if (!firstLevel) {
      throw new Error(
        "Aucun niveau actif n'est configuré."
      );
    }

    return firstLevel;
  }

  private async buildUserLevelResponse(
    userLevel: UserLevelDocument
  ): Promise<UserLevelResponse> {
    const levels = await this.getLevels();

    if (levels.length === 0) {
      throw new Error(
        "Aucun niveau n'est configuré."
      );
    }

    const currentLevel = this.calculateLevel(
      userLevel.xp,
      levels
    );

    const sortedLevels = levels
      .filter(
        (level) => level.enabled
      )
      .sort(
        (a, b) =>
          a.level - b.level
      );

    const nextLevel = sortedLevels.find(
      (level) =>
        level.level >
        currentLevel.level
    );

    const currentLevelXp =
      currentLevel.requiredXp;

    const nextLevelXp =
      nextLevel?.requiredXp ??
      currentLevelXp;

    const progressXp = Math.max(
      0,
      userLevel.xp -
        currentLevelXp
    );

    const requiredProgress = Math.max(
      1,
      nextLevelXp -
        currentLevelXp
    );

    const progressPercent = nextLevel
      ? Math.min(
          100,
          Math.round(
            (progressXp /
              requiredProgress) *
              100
          )
        )
      : 100;

    return {
      userId:
        userLevel.userId.toString(),

      xp: userLevel.xp,

      level:
        currentLevel.level,

      levelName:
        currentLevel.name,

      currentLevelXp,

      nextLevelXp,

      progressXp,

      progressPercent,

      history:
        userLevel.history ?? [],
    };
  }

  // =========================================================
  // NIVEAUX
  // =========================================================

  async getAllLevels() {
    return this.levelsRepository.findAllLevels();
  }

  async getLevel(level: number) {
    return this.getLevelDefinition(level);
  }

  // =========================================================
  // NIVEAU UTILISATEUR
  // =========================================================

  async getUserLevel(
    userId: string
  ): Promise<UserLevelResponse> {
    let userLevel =
      await this.levelsRepository.findUserLevel(
        userId
      );

    if (!userLevel) {
      userLevel =
        await this.levelsRepository.createUserLevel({
          userId,
          xp: 0,
          history: [],
        });
    }

    return this.buildUserLevelResponse(
      userLevel
    );
  }

  private async getOrCreateUserLevel(
    userId: string
  ): Promise<UserLevelDocument> {
    const existing =
      await this.levelsRepository.findUserLevel(
        userId
      );

    if (existing) {
      return existing;
    }

    return this.levelsRepository.createUserLevel({
      userId,
      xp: 0,
      history: [],
    });
  }

  // =========================================================
  // APPLICATION XP
  // =========================================================

  private async applyXp(
    userId: string,
    newXp: number,
    action:
      | "XP_ADD"
      | "XP_REMOVE"
      | "XP_SET",
    amount: number,
    source: LevelSource,
    reason: string,
    sourceId?: string
  ): Promise<UserLevelResponse> {
    if (newXp < 0) {
      throw new Error(
        "L'XP ne peut pas être négative."
      );
    }

    const userLevel =
      await this.getOrCreateUserLevel(
        userId
      );

    const previousXp =
      userLevel.xp;

    const levels =
      await this.getLevels();

    if (levels.length === 0) {
      throw new Error(
        "Aucun niveau n'est configuré."
      );
    }

    const previousLevel =
      this.calculateLevel(
        previousXp,
        levels
      );

    const newLevel =
      this.calculateLevel(
        newXp,
        levels
      );

    userLevel.xp = newXp;

    userLevel.history.push({
      action,
      amount,
      source,
      sourceId,
      reason,
      previousXp,
      newXp,
      previousLevel:
        previousLevel.level,
      newLevel:
        newLevel.level,
      createdAt:
        new Date(),
    });

    await this.levelsRepository.saveUserLevel(
      userLevel
    );

    return this.buildUserLevelResponse(
      userLevel
    );
  }

  // =========================================================
  // AJOUTER XP
  // =========================================================

  async addXp(
    userId: string,
    amount: number,
    source: LevelSource,
    reason: string,
    sourceId?: string
  ) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "La quantité d'XP doit être supérieure à zéro."
      );
    }

    const userLevel =
      await this.getOrCreateUserLevel(
        userId
      );

    /*
     * Protection contre les doubles récompenses.
     *
     * Une quête ou un exploit ne doit pouvoir
     * donner ses XP qu'une seule fois.
     */
    if (
      sourceId &&
      (
        source === "QUEST" ||
        source === "ACHIEVEMENT"
      )
    ) {
      const alreadyRewarded =
        await this.levelsRepository.hasRewardHistory(
          userId,
          source,
          sourceId
        );

      if (alreadyRewarded) {
        return this.getUserLevel(
          userId
        );
      }
    }

    return this.applyXp(
      userId,
      userLevel.xp + amount,
      "XP_ADD",
      amount,
      source,
      reason,
      sourceId
    );
  }

  // =========================================================
  // RETIRER XP
  // =========================================================

  async removeXp(
    userId: string,
    amount: number,
    source: LevelSource,
    reason: string,
    sourceId?: string
  ) {
    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      throw new Error(
        "La quantité d'XP doit être supérieure à zéro."
      );
    }

    const userLevel =
      await this.getOrCreateUserLevel(
        userId
      );

    const newXp = Math.max(
      0,
      userLevel.xp - amount
    );

    return this.applyXp(
      userId,
      newXp,
      "XP_REMOVE",
      amount,
      source,
      reason,
      sourceId
    );
  }

  // =========================================================
  // DÉFINIR XP
  // =========================================================

  async setXp(
    userId: string,
    xp: number,
    source: LevelSource,
    reason: string,
    sourceId?: string
  ) {
    if (
      !Number.isFinite(xp) ||
      xp < 0
    ) {
      throw new Error(
        "L'XP doit être supérieure ou égale à zéro."
      );
    }

    const userLevel =
      await this.getOrCreateUserLevel(
        userId
      );

    return this.applyXp(
      userId,
      xp,
      "XP_SET",
      xp,
      source,
      reason,
      sourceId
    );
  }

  // =========================================================
  // DÉFINIR NIVEAU
  // =========================================================

  async setLevel(
    userId: string,
    level: number,
    source: LevelSource,
    reason: string
  ) {
    if (
      !Number.isInteger(level) ||
      level <= 0
    ) {
      throw new Error(
        "Le niveau doit être un entier positif."
      );
    }

    const targetLevel =
      await this.getLevelDefinition(
        level
      );

    const userLevel =
      await this.getOrCreateUserLevel(
        userId
      );

    const levels =
      await this.getLevels();

    const previousLevel =
      this.calculateLevel(
        userLevel.xp,
        levels
      );

    const previousXp =
      userLevel.xp;

    userLevel.xp =
      targetLevel.requiredXp;

    userLevel.history.push({
      action: "LEVEL_SET",
      amount:
        targetLevel.requiredXp -
        previousXp,
      source,
      reason,
      previousXp,
      newXp:
        userLevel.xp,
      previousLevel:
        previousLevel.level,
      newLevel:
        targetLevel.level,
      createdAt:
        new Date(),
    });

    await this.levelsRepository.saveUserLevel(
      userLevel
    );

    return this.buildUserLevelResponse(
      userLevel
    );
  }

  // =========================================================
  // ADMINISTRATION DES PALIERS
  // =========================================================

  async createLevel(data: {
    level: number;
    name: string;
    description?: string;
    requiredXp: number;
    enabled?: boolean;
  }) {
    if (
      !Number.isInteger(data.level) ||
      data.level <= 0
    ) {
      throw new Error(
        "Le niveau doit être un entier positif."
      );
    }

    if (
      !Number.isFinite(
        data.requiredXp
      ) ||
      data.requiredXp < 0
    ) {
      throw new Error(
        "L'XP requise doit être supérieure ou égale à zéro."
      );
    }

    if (!data.name?.trim()) {
      throw new Error(
        "Le nom du niveau est obligatoire."
      );
    }

    const existing =
      await this.levelsRepository.findLevel(
        data.level
      );

    if (existing) {
      throw new Error(
        "Ce niveau existe déjà."
      );
    }

    const levels =
      await this.getLevels();

    const previousLevel =
      levels
        .filter(
          (item) =>
            item.level <
            data.level
        )
        .sort(
          (a, b) =>
            b.level - a.level
        )[0];

    const nextLevel =
      levels
        .filter(
          (item) =>
            item.level >
            data.level
        )
        .sort(
          (a, b) =>
            a.level - b.level
        )[0];

    if (
      previousLevel &&
      data.requiredXp <=
        previousLevel.requiredXp
    ) {
      throw new Error(
        "L'XP requise doit être supérieure à celle du niveau précédent."
      );
    }

    if (
      nextLevel &&
      data.requiredXp >=
        nextLevel.requiredXp
    ) {
      throw new Error(
        "L'XP requise doit être inférieure à celle du niveau suivant."
      );
    }

    return this.levelsRepository.createLevel({
      level: data.level,
      name: data.name.trim(),
      description:
        data.description?.trim(),
      requiredXp:
        data.requiredXp,
      enabled:
        data.enabled ?? true,
    });
  }

  async updateLevel(
    level: number,
    data: {
      name?: string;
      description?: string;
      requiredXp?: number;
      enabled?: boolean;
    }
  ) {
    const existing =
      await this.levelsRepository.findLevel(
        level
      );

    if (!existing) {
      throw new Error(
        "Niveau introuvable."
      );
    }

    const newRequiredXp =
      data.requiredXp ??
      existing.requiredXp;

    if (
      !Number.isFinite(
        newRequiredXp
      ) ||
      newRequiredXp < 0
    ) {
      throw new Error(
        "L'XP requise ne peut pas être négative."
      );
    }

    const levels =
      await this.getLevels();

    const previousLevel =
      levels
        .filter(
          (item) =>
            item.level <
            level
        )
        .sort(
          (a, b) =>
            b.level - a.level
        )[0];

    const nextLevel =
      levels
        .filter(
          (item) =>
            item.level >
            level
        )
        .sort(
          (a, b) =>
            a.level - b.level
        )[0];

    if (
      previousLevel &&
      newRequiredXp <=
        previousLevel.requiredXp
    ) {
      throw new Error(
        "L'XP doit être supérieure au niveau précédent."
      );
    }

    if (
      nextLevel &&
      newRequiredXp >=
        nextLevel.requiredXp
    ) {
      throw new Error(
        "L'XP doit être inférieure au niveau suivant."
      );
    }

    return this.levelsRepository.updateLevel(
      level,
      {
        ...data,
        requiredXp:
          newRequiredXp,
      }
    );
  }

  async deleteLevel(
    level: number
  ) {
    const existing =
      await this.levelsRepository.findLevel(
        level
      );

    if (!existing) {
      throw new Error(
        "Niveau introuvable."
      );
    }

    const levels =
      await this.getLevels();

    if (levels.length <= 1) {
      throw new Error(
        "Impossible de supprimer le dernier niveau."
      );
    }

    const result =
      await this.levelsRepository.deleteLevel(
        level
      );

    if (!result) {
      throw new Error(
        "Impossible de supprimer le niveau."
      );
    }

    return result;
  }
}

export const levelsService =
  new LevelsService();