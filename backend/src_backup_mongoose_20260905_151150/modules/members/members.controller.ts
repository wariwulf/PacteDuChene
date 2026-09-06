import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  getMembers,
  getMemberById,
  getMembersByRole,
  getCurrentMember as getCurrentMemberService,
} from "./members.service";

export async function getAllMembers(
  _req: Request,
  res: Response
) {
  try {
    const members = await getMembers();

    return res.status(200).json({
      success: true,
      data: {
        members,
      },
    });
  } catch (error) {
    console.error("Erreur récupération membres :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les membres.",
    });
  }
}

export async function getMember(
  req: Request<{ id: string }>,
  res: Response
) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du membre manquant.",
      });
    }

    const member = await getMemberById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        member,
      },
    });
  } catch (error) {
    console.error("Erreur récupération membre :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer ce membre.",
    });
  }
}

export async function getMembersRole(
  req: Request<{ role: string }>,
  res: Response
) {
  try {
    const { role } = req.params;

    const members = await getMembersByRole(role as any);

    return res.status(200).json({
      success: true,
      data: {
        members,
      },
    });
  } catch (error) {
    console.error("Erreur récupération membres par rôle :", error);

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les membres.",
    });
  }
}

export async function getCurrentMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentification requise.",
      });
    }

    const member = await getCurrentMemberService(userId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        member,
      },
    });
  } catch (error) {
    console.error(
      "Erreur récupération membre connecté :",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer votre profil.",
    });
  }
}