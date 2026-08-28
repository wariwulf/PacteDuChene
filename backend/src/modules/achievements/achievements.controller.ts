import { Request, Response } from "express";
import { AchievementsService } from "./achievements.service";

const achievementsService = new AchievementsService();

export async function getAchievements(_req: Request, res: Response) {
  try {
    const achievements = await achievementsService.getAchievements();

    return res.status(200).json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    console.error("Erreur récupération exploits :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les exploits.",
    });
  }
}

export async function getAchievement(req: Request, res: Response) {
  try {
    const achievementId = String(req.params.achievementId ?? "");

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de l'exploit est obligatoire.",
      });
    }

    const achievement = await achievementsService.getAchievement(achievementId);

    return res.status(200).json({
      success: true,
      data: { achievement },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Exploit introuvable.",
    });
  }
}

export async function createAchievement(req: Request, res: Response) {
  try {
    const {
      achievementId,
      name,
      description,
      level,
      rewardCurrencyId,
      rewardAmount,
      enabled,
    } = req.body;

    if (!achievementId || !name) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant et le titre de l'exploit sont obligatoires.",
      });
    }

    const parsedLevel = Number(level ?? 1);

    if (![1, 2, 3].includes(parsedLevel)) {
      return res.status(400).json({
        success: false,
        message: "Le niveau de l'exploit doit être 1, 2 ou 3.",
      });
    }

    if (
      rewardAmount !== undefined &&
      typeof rewardAmount !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "La récompense doit être un nombre.",
      });
    }

    const achievement = await achievementsService.createAchievement({
      achievementId: String(achievementId).trim(),
      name: String(name).trim(),
      description: description ? String(description).trim() : undefined,
      level: parsedLevel as 1 | 2 | 3,
      rewardCurrencyId: rewardCurrencyId
        ? String(rewardCurrencyId).trim()
        : undefined,
      rewardAmount: rewardAmount ?? 0,
      enabled: enabled ?? true,
    });

    return res.status(201).json({
      success: true,
      data: { achievement },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer l'exploit.",
    });
  }
}

export async function updateAchievement(req: Request, res: Response) {
  try {
    const achievementId = String(req.params.achievementId ?? "");

    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de l'exploit est obligatoire.",
      });
    }

    const {
      name,
      description,
      level,
      rewardCurrencyId,
      rewardAmount,
      enabled,
    } = req.body;

    const parsedLevel = level === undefined ? undefined : Number(level);

    if (
      parsedLevel !== undefined &&
      ![1, 2, 3].includes(parsedLevel)
    ) {
      return res.status(400).json({
        success: false,
        message: "Le niveau de l'exploit doit être 1, 2 ou 3.",
      });
    }

    const achievement = await achievementsService.updateAchievement(
      achievementId,
      {
        name: name === undefined ? undefined : String(name).trim(),
        description:
          description === undefined
            ? undefined
            : String(description).trim(),
        level: parsedLevel as 1 | 2 | 3 | undefined,
        rewardCurrencyId:
          rewardCurrencyId === undefined
            ? undefined
            : String(rewardCurrencyId).trim(),
        rewardAmount:
          rewardAmount === undefined
            ? undefined
            : Number(rewardAmount),
        enabled:
          enabled === undefined
            ? undefined
            : Boolean(enabled),
      }
    );

    return res.status(200).json({
      success: true,
      data: { achievement },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'exploit.",
    });
  }
}

export async function getFeaturedUserAchievements(
  req: Request,
  res: Response
) {
  try {
    const userId = String(req.params.userId ?? "");

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Le membre est obligatoire.",
      });
    }

    const achievements = await achievementsService.getFeaturedUserAchievements(userId);

    return res.status(200).json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les exploits mis en avant.",
    });
  }
}

export async function setMyFeaturedAchievements(
  req: Request,
  res: Response
) {
  try {
    const userId = String((req as any).user?.id ?? "");

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const achievements = await achievementsService.setFeaturedAchievements(
      userId,
      req.body?.achievementIds
    );

    return res.status(200).json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier vos exploits mis en avant.",
    });
  }
}

export async function getUserAchievements(req: Request, res: Response) {
  try {
    const userId = String(req.params.userId ?? "");

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du membre est obligatoire.",
      });
    }

    const achievements = await achievementsService.getUserAchievements(userId);

    return res.status(200).json({
      success: true,
      data: { achievements },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les exploits du membre.",
    });
  }
}

export async function unlockAchievement(req: Request, res: Response) {
  try {
    const userId = String(req.params.userId ?? "");
    const achievementId = String(req.params.achievementId ?? "");

    if (!userId || !achievementId) {
      return res.status(400).json({
        success: false,
        message: "Le membre et l'exploit sont obligatoires.",
      });
    }

    const result = await achievementsService.unlockAchievement(
      userId,
      achievementId,
      "manual"
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de débloquer l'exploit.",
    });
  }
}

export async function submitAchievement(req: Request, res: Response) {
  try {
    const routeUserId = String(req.params.userId ?? "");
    const authenticatedUserId = String((req as any).user?.id ?? "");
    const userId = authenticatedUserId;
    const achievementId = String(req.params.achievementId ?? "");
    const message = String(req.body?.message ?? "");

    if (!userId || !achievementId || routeUserId !== userId) {
      return res.status(400).json({
        success: false,
        message: "Le membre et l'exploit sont obligatoires.",
      });
    }

    const files = Array.isArray(req.files) ? req.files : [];

    const attachments = files.map((file: any) => {
      const type: "image" | "video" | "audio" = file.mimetype.startsWith("image/")
        ? "image"
        : file.mimetype.startsWith("video/")
          ? "video"
          : "audio";

      return {
        type,
        url: `/uploads/achievement-submissions/${file.filename}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };
    });

    const submission = await achievementsService.submitAchievement(
      userId,
      achievementId,
      message,
      attachments
    );

    return res.status(201).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de soumettre la preuve de l'exploit.",
    });
  }
}

export async function getPendingAchievementSubmissions(
  _req: Request,
  res: Response
) {
  try {
    const submissions = await achievementsService.getPendingSubmissions();

    return res.status(200).json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les demandes de validation.",
    });
  }
}

export async function getMyAchievementSubmissions(
  req: Request,
  res: Response
) {
  try {
    const routeUserId = String(req.params.userId ?? "");
    const userId = String((req as any).user?.id ?? "");
    const achievementId = req.query.achievementId
      ? String(req.query.achievementId)
      : undefined;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Le membre est obligatoire.",
      });
    }

    const submissions = await achievementsService.getUserSubmissions(
      userId,
      achievementId
    );

    return res.status(200).json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer vos demandes.",
    });
  }
}

export async function reviewAchievementSubmission(
  req: Request,
  res: Response
) {
  try {
    const submissionId = String(req.params.submissionId ?? "");
    const reviewerId = String((req as any).user?.id ?? "");
    const status = req.body?.status;
    const response = req.body?.response;

    if (!submissionId || !reviewerId) {
      return res.status(400).json({
        success: false,
        message: "La demande et le valideur sont obligatoires.",
      });
    }

    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "Le statut doit être approved ou rejected.",
      });
    }

    const submission = await achievementsService.reviewSubmission(
      submissionId,
      reviewerId,
      status,
      response
    );

    return res.status(200).json({
      success: true,
      data: { submission },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de traiter la demande.",
    });
  }
}
