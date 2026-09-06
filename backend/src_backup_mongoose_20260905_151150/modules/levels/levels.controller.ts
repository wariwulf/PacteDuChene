import type {
  Request,
  Response,
} from "express";

import {
  levelsService,
} from "./levels.service";

import type {
  LevelSource,
} from "./levels.types";

// =========================================================
// NIVEAUX
// =========================================================

export async function getLevels(
  _req: Request,
  res: Response
) {
  try {
    const levels =
      await levelsService.getAllLevels();

    return res.status(200).json({
      success: true,
      data: {
        levels,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les niveaux.",
    });
  }
}

export async function getLevel(
  req: Request,
  res: Response
) {
  try {
    const level =
      Number(req.params.level);

    if (
      !Number.isInteger(level) ||
      level <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Niveau invalide.",
      });
    }

    const result =
      await levelsService.getLevel(
        level
      );

    return res.status(200).json({
      success: true,
      data: {
        level: result,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Niveau introuvable.",
    });
  }
}

// =========================================================
// NIVEAU UTILISATEUR
// =========================================================

export async function getUserLevel(
  req: Request,
  res: Response
) {
  try {
    const userId =
      String(
        req.params.userId ?? ""
      );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant utilisateur obligatoire.",
      });
    }

    const level =
      await levelsService.getUserLevel(
        userId
      );

    return res.status(200).json({
      success: true,
      data: {
        level,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le niveau.",
    });
  }
}

// =========================================================
// XP
// =========================================================

export async function addXp(
  req: Request,
  res: Response
) {
  try {
    const userId =
      String(
        req.params.userId ?? ""
      );

    const amount =
      Number(req.body.amount);

    const source =
      (req.body.source ??
        "ADMIN") as LevelSource;

    const reason =
      String(
        req.body.reason ??
          "Attribution administrative"
      );

    if (!userId) {
      return res.status(400).json({
        success: false,
        message:
          "Identifiant utilisateur obligatoire.",
      });
    }

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La quantité d'XP doit être supérieure à zéro.",
      });
    }

    const level =
      await levelsService.addXp(
        userId,
        amount,
        source,
        reason
      );

    return res.status(200).json({
      success: true,
      data: {
        level,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter l'XP.",
    });
  }
}

export async function removeXp(
  req: Request,
  res: Response
) {
  try {
    const userId =
      String(
        req.params.userId ?? ""
      );

    const amount =
      Number(req.body.amount);

    const source =
      (req.body.source ??
        "ADMIN") as LevelSource;

    const reason =
      String(
        req.body.reason ??
          "Retrait administratif"
      );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La quantité d'XP doit être supérieure à zéro.",
      });
    }

    const level =
      await levelsService.removeXp(
        userId,
        amount,
        source,
        reason
      );

    return res.status(200).json({
      success: true,
      data: {
        level,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de retirer l'XP.",
    });
  }
}

export async function setXp(
  req: Request,
  res: Response
) {
  try {
    const userId =
      String(
        req.params.userId ?? ""
      );

    const xp =
      Number(req.body.xp);

    const source =
      (req.body.source ??
        "ADMIN") as LevelSource;

    const reason =
      String(
        req.body.reason ??
          "Attribution administrative"
      );

    if (
      !Number.isFinite(xp) ||
      xp < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "L'XP doit être supérieure ou égale à zéro.",
      });
    }

    const level =
      await levelsService.setXp(
        userId,
        xp,
        source,
        reason
      );

    return res.status(200).json({
      success: true,
      data: {
        level,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de définir l'XP.",
    });
  }
}

// =========================================================
// NIVEAU ADMINISTRATIF
// =========================================================

export async function setLevel(
  req: Request,
  res: Response
) {
  try {
    const userId =
      String(
        req.params.userId ?? ""
      );

    const level =
      Number(req.body.level);

    const source =
      (req.body.source ??
        "ADMIN") as LevelSource;

    const reason =
      String(
        req.body.reason ??
          "Attribution administrative"
      );

    if (
      !Number.isInteger(level) ||
      level <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le niveau doit être un entier positif.",
      });
    }

    const result =
      await levelsService.setLevel(
        userId,
        level,
        source,
        reason
      );

    return res.status(200).json({
      success: true,
      data: {
        level: result,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de définir le niveau.",
    });
  }
}

// =========================================================
// ADMINISTRATION DES PALIERS
// =========================================================

export async function createLevel(
  req: Request,
  res: Response
) {
  try {
    const {
      level,
      name,
      description,
      requiredXp,
      enabled,
    } = req.body;

    const result =
      await levelsService.createLevel({
        level: Number(level),
        name,
        description,
        requiredXp:
          Number(requiredXp),
        enabled,
      });

    return res.status(201).json({
      success: true,
      data: {
        level: result,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer le niveau.",
    });
  }
}

export async function updateLevel(
  req: Request,
  res: Response
) {
  try {
    const level =
      Number(req.params.level);

    if (
      !Number.isInteger(level) ||
      level <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Niveau invalide.",
      });
    }

    const body =
      req.body ?? {};

    const data: {
      name?: string;
      description?: string;
      requiredXp?: number;
      enabled?: boolean;
    } = {};

    if (
      body.name !== undefined
    ) {
      data.name =
        String(body.name);
    }

    if (
      body.description !==
      undefined
    ) {
      data.description =
        String(body.description);
    }

    if (
      body.requiredXp !==
      undefined
    ) {
      data.requiredXp =
        Number(
          body.requiredXp
        );
    }

    if (
      body.enabled !==
      undefined
    ) {
      data.enabled =
        Boolean(body.enabled);
    }

    const result =
      await levelsService.updateLevel(
        level,
        data
      );

    return res.status(200).json({
      success: true,
      data: {
        level: result,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier le niveau.",
    });
  }
}

export async function deleteLevel(
  req: Request,
  res: Response
) {
  try {
    const level =
      Number(req.params.level);

    if (
      !Number.isInteger(level) ||
      level <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Niveau invalide.",
      });
    }

    await levelsService.deleteLevel(
      level
    );

    return res.status(200).json({
      success: true,
      message:
        "Niveau supprimé.",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer le niveau.",
    });
  }
}