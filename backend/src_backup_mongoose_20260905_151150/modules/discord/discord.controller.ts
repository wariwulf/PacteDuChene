import { Response } from "express";

import {
  getDiscordLink,
  getDiscordProfile,
  getDiscordStatus,
  linkDiscord,
  unlinkDiscord,
} from "./discord.service";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

type ActorRequest = AuthenticatedRequest;

function isStaff(req: ActorRequest): boolean {
  const role = req.user?.role;

  return (
    role === "MODERATOR" ||
    role === "ADMIN" ||
    role === "OWNER"
  );
}

function canAccessMember(
  req: ActorRequest,
  memberId: string
): boolean {
  if (!req.user) {
    return false;
  }

  if (req.user.id === memberId) {
    return true;
  }

  return isStaff(req);
}

/**
 * ============================================================
 * PROFIL DISCORD DU MEMBRE CONNECTÉ
 * ============================================================
 */

export async function getMyDiscordProfile(
  req: ActorRequest,
  res: Response
) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const profile = await getDiscordProfile(req.user.id);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Erreur récupération profil Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer votre profil Discord.",
    });
  }
}

/**
 * ============================================================
 * RÉCUPÉRATION D'UNE LIAISON DISCORD
 * ============================================================
 */

export async function getMemberDiscord(
  req: ActorRequest,
  res: Response
) {
  try {
    const memberId = String(req.params.memberId);

    if (!canAccessMember(req, memberId)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'êtes pas autorisé à consulter cette liaison Discord.",
      });
    }

    const link = await getDiscordLink(memberId);

    return res.status(200).json({
      success: true,
      data: link,
    });
  } catch (error) {
    console.error(
      "Erreur récupération liaison Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer la liaison Discord.",
    });
  }
}

/**
 * ============================================================
 * PROFIL DISCORD D'UN MEMBRE
 * ============================================================
 */

export async function getMemberDiscordProfile(
  req: ActorRequest,
  res: Response
) {
  try {
    const memberId = String(req.params.memberId);

    if (!canAccessMember(req, memberId)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'êtes pas autorisé à consulter ce profil Discord.",
      });
    }

    const profile = await getDiscordProfile(memberId);

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error(
      "Erreur récupération profil Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le profil Discord.",
    });
  }
}

/**
 * ============================================================
 * STATUT DISCORD D'UN MEMBRE
 * ============================================================
 */

export async function getMemberDiscordStatus(
  req: ActorRequest,
  res: Response
) {
  try {
    const memberId = String(req.params.memberId);

    if (!canAccessMember(req, memberId)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'êtes pas autorisé à consulter ce statut Discord.",
      });
    }

    const status = await getDiscordStatus(memberId);

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error(
      "Erreur récupération statut Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer le statut Discord.",
    });
  }
}

/**
 * ============================================================
 * LIAISON MANUELLE D'UN COMPTE DISCORD
 * ============================================================
 *
 * Réservée au staff.
 */

export async function linkMemberDiscord(
  req: ActorRequest,
  res: Response
) {
  try {
    if (!isStaff(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'êtes pas autorisé à gérer les liaisons Discord.",
      });
    }

    const link = await linkDiscord({
      memberId: req.body?.memberId,
      discordId: req.body?.discordId,
      discordUsername: req.body?.discordUsername,
    });

    return res.status(200).json({
      success: true,
      message: "Compte Discord lié avec succès.",
      data: link,
    });
  } catch (error) {
    console.error(
      "Erreur liaison Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de lier le compte Discord.",
    });
  }
}

/**
 * ============================================================
 * DISSOCIATION D'UN COMPTE DISCORD
 * ============================================================
 *
 * Réservée au staff.
 */

export async function unlinkMemberDiscord(
  req: ActorRequest,
  res: Response
) {
  try {
    if (!isStaff(req)) {
      return res.status(403).json({
        success: false,
        message:
          "Vous n'êtes pas autorisé à gérer les liaisons Discord.",
      });
    }

    const memberId = String(req.params.memberId);

    const link = await unlinkDiscord(memberId);

    if (!link) {
      return res.status(404).json({
        success: false,
        message:
          "Aucune liaison Discord trouvée pour ce membre.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Compte Discord dissocié avec succès.",
      data: link,
    });
  } catch (error) {
    console.error(
      "Erreur dissociation Discord :",
      error
    );

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de dissocier le compte Discord.",
    });
  }
}