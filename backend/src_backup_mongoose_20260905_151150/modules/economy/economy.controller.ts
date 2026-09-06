import { Request, Response } from "express";
import { economyService } from "./economy.service";
import { isCurrencyId } from "./economy.constants";

export async function getBalances(
  req: Request<{ userId: string }>,
  res: Response
) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant utilisateur est obligatoire.",
      });
    }

    const balances = await economyService.getBalances(userId);

    return res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    console.error("Erreur récupération soldes :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les soldes.",
    });
  }
}

export async function addBalance(
  req: Request<{ userId: string }>,
  res: Response
) {
  try {
    const { userId } = req.params;
    const { currencyId, amount } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant utilisateur est obligatoire.",
      });
    }

    if (!isCurrencyId(currencyId)) {
      return res.status(400).json({
        success: false,
        message:
          "Monnaie invalide. Utilisez uniquement Solidus, Argent ou Bronze.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être un nombre supérieur à 0.",
      });
    }

    const balances = await economyService.addBalance(
      userId,
      currencyId,
      amount
    );

    return res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    console.error("Erreur ajout monnaie :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter la monnaie.",
    });
  }
}

export async function removeBalance(
  req: Request<{ userId: string }>,
  res: Response
) {
  try {
    const { userId } = req.params;
    const { currencyId, amount } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant utilisateur est obligatoire.",
      });
    }

    if (!isCurrencyId(currencyId)) {
      return res.status(400).json({
        success: false,
        message:
          "Monnaie invalide. Utilisez uniquement Solidus, Argent ou Bronze.",
      });
    }

    if (
      typeof amount !== "number" ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Le montant doit être un nombre supérieur à 0.",
      });
    }

    const balances = await economyService.removeBalance(
      userId,
      currencyId,
      amount
    );

    return res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    console.error("Erreur retrait monnaie :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de retirer la monnaie.",
    });
  }
}

export async function getHistory(
  req: Request<{ userId: string }>,
  res: Response
) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant utilisateur est obligatoire.",
      });
    }

    const history = await economyService.getHistory(userId);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error(
      "Erreur récupération historique économique :",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer l'historique économique.",
    });
  }
}
