import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { economyAdminService } from "./economy-admin.service";

function actorId(req: AuthenticatedRequest) {
  if (!req.user) {
    throw new Error("Authentification requise.");
  }

  return req.user.id;
}

export async function getExchangeRates(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const rates =
      await economyAdminService.getExchangeRates();

    return res.status(200).json({
      success: true,
      data: { rates },
    });
  } catch (error) {
    console.error(
      "Erreur récupération taux économiques :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les taux.",
    });
  }
}

export async function updateExchangeRates(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const rates =
      await economyAdminService.updateExchangeRates({
        argentPerSolidus: Number(
          req.body?.argentPerSolidus
        ),
        bronzePerArgent: Number(
          req.body?.bronzePerArgent
        ),
      });

    return res.status(200).json({
      success: true,
      data: { rates },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier les taux.",
    });
  }
}

export async function adjustMembers(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const result =
      await economyAdminService.adjustMembers({
        userIds: Array.isArray(req.body?.userIds)
          ? req.body.userIds
          : [],
        currencyId: String(
          req.body?.currencyId ?? ""
        ),
        amount: Number(req.body?.amount),
        operation:
          req.body?.operation === "remove"
            ? "remove"
            : "add",
        reason: String(
          req.body?.reason ?? ""
        ),
        actorId: actorId(req),
      });

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
          : "Impossible de modifier les soldes.",
    });
  }
}
