import {
  Request,
  Response,
} from "express";
import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { QuestsService } from "./quests.service";

const questsService = new QuestsService();

function getAuthenticatedUserId(
  req: AuthenticatedRequest
) {
  return req.user?.id ?? "";
}

export async function getQuests(
  _req: Request,
  res: Response
) {
  try {
    const quests = await questsService.getQuests();

    return res.status(200).json({
      success: true,
      data: { quests },
    });
  } catch (error) {
    console.error(
      "Erreur récupération quêtes :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les quêtes.",
    });
  }
}

export async function getQuest(
  req: Request,
  res: Response
) {
  try {
    const questId = String(
      req.params.questId ?? ""
    ).trim();

    if (!questId) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant de la quête est obligatoire.",
      });
    }

    const quest =
      await questsService.getQuest(questId);

    return res.status(200).json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Quête introuvable.",
    });
  }
}

export async function createQuest(
  req: Request,
  res: Response
) {
  try {
    const {
      questId,
      name,
      description,
      imageUrl,
      difficulty,
      prerequisites,
      steps,
      objectives,
      rewardXp,
      rewardCurrencyId,
      rewardAmount,
      rewardAchievementId,
      enabled,
    } = req.body;

    if (!questId || !name) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant et le nom de la quête sont obligatoires.",
      });
    }

    if (
      !Array.isArray(objectives) ||
      objectives.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La quête doit posséder au moins un objectif.",
      });
    }

    const quest =
      await questsService.createQuest({
        questId,
        name,
        description,
        imageUrl,
        difficulty,
        prerequisites,
        steps,
        objectives,
        rewardXp: rewardXp ?? 0,
        rewardCurrencyId,
        rewardAmount: rewardAmount ?? 0,
        rewardAchievementId,
        enabled: enabled ?? true,
      });

    return res.status(201).json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    console.error(
      "Erreur création quête :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer la quête.",
    });
  }
}

export async function getUserQuests(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const isAdminRequest =
      req.path.startsWith("/admin/user/");

    const requestedUserId =
      String(req.params.userId ?? "").trim();

    const userId = isAdminRequest
      ? requestedUserId
      : getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur authentifié introuvable.",
      });
    }

    const quests =
      await questsService.getUserQuests(userId);

    return res.status(200).json({
      success: true,
      data: { quests },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les quêtes.",
    });
  }
}

export async function startQuest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const questId =
      String(req.params.questId ?? "").trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const quest =
      await questsService.startQuest(
        userId,
        questId
      );

    return res.status(201).json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de commencer la quête.",
    });
  }
}

export async function updateProgress(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const questId =
      String(req.params.questId ?? "").trim();

    const {
      objectiveId,
      amount,
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    if (!objectiveId) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant de l'objectif est obligatoire.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "La progression doit être un nombre supérieur à zéro.",
      });
    }

    const quest =
      await questsService.updateProgress(
        userId,
        questId,
        objectiveId,
        amount
      );

    return res.status(200).json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour la progression.",
    });
  }
}

export async function updateQuest(
  req: Request,
  res: Response
) {
  try {
    const questId =
      String(req.params.questId ?? "").trim();

    if (!questId) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant de la quête est obligatoire.",
      });
    }

    const {
      name,
      description,
      imageUrl,
      difficulty,
      prerequisites,
      steps,
      objectives,
      rewardXp,
      rewardCurrencyId,
      rewardAmount,
      rewardAchievementId,
      enabled,
    } = req.body;

    const quest =
      await questsService.updateQuest(
        questId,
        {
          name,
          description,
          imageUrl,
          difficulty,
          prerequisites,
          steps,
          objectives,
          rewardXp,
          rewardCurrencyId,
          rewardAmount,
          rewardAchievementId,
          enabled,
        }
      );

    return res.status(200).json({
      success: true,
      data: { quest },
    });
  } catch (error) {
    console.error(
      "Erreur modification quête :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier la quête.",
    });
  }
}

export async function deleteQuest(
  req: Request,
  res: Response
) {
  try {
    const questId =
      String(req.params.questId ?? "").trim();

    if (!questId) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant de la quête est obligatoire.",
      });
    }

    await questsService.deleteQuest(questId);

    return res.status(200).json({
      success: true,
      message:
        "Quête supprimée avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur suppression quête :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la quête.",
    });
  }
}

export async function completeQuest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const questId =
      String(req.params.questId ?? "").trim();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const result =
      await questsService.completeQuest(
        userId,
        questId
      );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de terminer la quête.",
    });
  }
}

export async function submitObjective(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    const questId =
      String(req.params.questId ?? "").trim();

    const objectiveId =
      String(req.params.objectiveId ?? "").trim();

    const message =
      String(req.body?.message ?? "");

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    if (!questId || !objectiveId) {
      return res.status(400).json({
        success: false,
        message:
          "La quête et l'objectif sont obligatoires.",
      });
    }

    const files = Array.isArray(req.files)
      ? req.files
      : [];

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message:
          "Vous pouvez joindre au maximum 5 fichiers.",
      });
    }

    const attachments = files.map(
      (file: Express.Multer.File) => {
        const type:
        | "image"
        | "video"
        | "audio" =
        file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.startsWith("video/")
            ? "video"
            : "audio";

        return {
          type,
          url: `/uploads/quest-submissions/${file.filename}`,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        };
      }
    );

    const result =
      await questsService.submitObjective(
        userId,
        questId,
        objectiveId,
        message,
        attachments
      );

    return res.status(201).json({
      success: true,
      data: {
        submission: result,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de soumettre la preuve.",
    });
  }
}

export async function getPendingSubmissions(
  _req: Request,
  res: Response
) {
  try {
    const submissions =
      await questsService.getPendingSubmissions();

    return res.json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les demandes.",
    });
  }
}

export async function getUserSubmissions(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const questId =
      req.query.questId
        ? String(req.query.questId)
        : undefined;

    const submissions =
      await questsService.getUserSubmissions(
        userId,
        questId
      );

    return res.json({
      success: true,
      data: { submissions },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer vos soumissions.",
    });
  }
}

export async function reviewSubmission(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const submissionId =
      String(
        req.params.submissionId ?? ""
      ).trim();

    const reviewerId =
      getAuthenticatedUserId(req);

    const status =
      req.body?.status;

    const response =
      req.body?.response;

    if (!submissionId || !reviewerId) {
      return res.status(400).json({
        success: false,
        message:
          "La demande et le valideur sont obligatoires.",
      });
    }

    if (
      status !== "approved" &&
      status !== "rejected"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Le statut doit être approved ou rejected.",
      });
    }

    const result =
      await questsService.reviewSubmission(
        submissionId,
        reviewerId,
        status,
        response
      );

    return res.json({
      success: true,
      data: {
        submission: result,
      },
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


export async function adminValidateObjective(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      String(req.params.userId ?? "").trim();

    const questId =
      String(req.params.questId ?? "").trim();

    const objectiveId =
      String(req.params.objectiveId ?? "").trim();

    if (!userId || !questId || !objectiveId) {
      return res.status(400).json({
        success: false,
        message:
          "Le membre, la quête et l'objectif sont obligatoires.",
      });
    }

    const result =
      await questsService.adminValidateObjective(
        userId,
        questId,
        objectiveId
      );

    return res.json({
      success: true,
      data: { quest: result },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de valider l'objectif.",
    });
  }
}

export async function adminCompleteQuest(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      String(req.params.userId ?? "").trim();

    const questId =
      String(req.params.questId ?? "").trim();

    if (!userId || !questId) {
      return res.status(400).json({
        success: false,
        message:
          "Le membre et la quête sont obligatoires.",
      });
    }

    const result =
      await questsService.adminCompleteQuest(
        userId,
        questId
      );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de terminer la quête.",
    });
  }
}
