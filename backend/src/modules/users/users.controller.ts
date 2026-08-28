import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { UserRole } from "../../common/constants/roles";
import { usersService } from "./users.service";

function actor(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new Error("Authentification requise.");
  }

  return {
    id: req.user.id,
    role: String(req.user.role) as "PLAYER" | "MODERATOR" | "ADMIN" | "OWNER",
  };
}

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export async function listAdminMembers(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    actor(req);

    const members = await usersService.listForAdministration();

    return res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Erreur liste membres administration :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de charger les membres.",
    });
  }
}

export async function getAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    actor(req);

    const id = getParam(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du membre manquant.",
      });
    }

    const member = await usersService.get(id);

    return res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    const status =
      error instanceof Error &&
      error.message === "Membre introuvable."
        ? 404
        : 500;

    return res.status(status).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de charger le membre.",
    });
  }
}

export async function createAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);

    const result = await usersService.create(
      {
        email: String(req.body?.email ?? ""),
        username: String(req.body?.username ?? ""),
        displayName:
          req.body?.displayName !== undefined
            ? String(req.body.displayName)
            : undefined,
        avatar:
          req.body?.avatar !== undefined
            ? String(req.body.avatar)
            : undefined,
        role:
          req.body?.role !== undefined
            ? (String(req.body.role) as UserRole)
            : UserRole.PLAYER,
      },
      current.role
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
          : "Impossible de créer le membre.",
    });
  }
}

export async function updateAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du membre manquant.",
      });
    }

    const result = await usersService.update(
      id,
      {
        email:
          req.body?.email !== undefined
            ? String(req.body.email)
            : undefined,
        username:
          req.body?.username !== undefined
            ? String(req.body.username)
            : undefined,
        displayName:
          req.body?.displayName !== undefined
            ? String(req.body.displayName)
            : undefined,
        avatar:
          req.body?.avatar !== undefined
            ? String(req.body.avatar)
            : undefined,
        role:
          req.body?.role !== undefined
            ? (String(req.body.role) as UserRole)
            : undefined,
      },
      current.id,
      current.role
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
          : "Impossible de modifier le membre.",
    });
  }
}

export async function resetAdminPassword(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    const result = await usersService.resetPassword(
      id,
      current.id,
      current.role
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
          : "Impossible de réinitialiser le mot de passe.",
    });
  }
}

export async function suspendAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    const result = await usersService.suspend(
      id,
      current.id,
      current.role
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
          : "Impossible de suspendre le membre.",
    });
  }
}

export async function reactivateAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    const result = await usersService.reactivate(
      id,
      current.id,
      current.role
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
          : "Impossible de réactiver le membre.",
    });
  }
}

export async function archiveAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    const result = await usersService.archive(
      id,
      current.id,
      current.role
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
          : "Impossible d'archiver le membre.",
    });
  }
}

export async function restoreAdminMember(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const current = actor(req);
    const id = getParam(req.params.id);

    const result = await usersService.restore(
      id,
      current.id,
      current.role
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
          : "Impossible de restaurer le membre.",
    });
  }
}

/**
 * Upload du portrait d'un membre depuis l'administration.
 *
 * Le :id correspond au membre sélectionné, pas à l'administrateur connecté.
 */
export async function uploadAvatar(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    actor(req);

    const memberId = getParam(req.params.id);

    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: "Identifiant du membre manquant.",
      });
    }

    const file = (req as any).file as
      | Express.Multer.File
      | undefined;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Aucun fichier reçu.",
      });
    }

    const baseUrl =
      process.env.PUBLIC_API_URL ||
      `${req.protocol}://${req.get("host")}`;

    const avatar = `${baseUrl}/uploads/avatars/${file.filename}`;

    const { User } = await import("./user.model");

    const user = await User.findOneAndUpdate(
      {
        _id: memberId,
        status: { $ne: "DELETED" },
      },
      {
        $set: {
          "profile.avatar": avatar,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Membre introuvable.",
      });
    }

    return res.json({
      success: true,
      data: {
        avatar,
        user,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'importer le portrait.",
    });
  }
}