import { Request, Response } from "express";
import { currenciesService } from "./currencies.service";
import { isCurrencyId } from "./economy.constants";

export async function getCurrencies(
  _req: Request,
  res: Response
) {
  try {
    const currencies =
      await currenciesService.getAllCurrencies();

    return res.status(200).json({
      success: true,
      data: {
        currencies,
      },
    });
  } catch (error) {
    console.error("Erreur récupération monnaies :", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer les monnaies.",
    });
  }
}

export async function getCurrency(
  req: Request,
  res: Response
) {
  try {
    const currencyId = req.params.currencyId;

    if (
      typeof currencyId !== "string" ||
      !currencyId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la monnaie est obligatoire.",
      });
    }

    if (!isCurrencyId(currencyId)) {
      return res.status(404).json({
        success: false,
        message: "Monnaie introuvable.",
      });
    }

    const currency =
      await currenciesService.getCurrency(currencyId);

    return res.status(200).json({
      success: true,
      data: {
        currency,
      },
    });
  } catch (error) {
    console.error("Erreur récupération monnaie :", error);

    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de récupérer la monnaie.",
    });
  }
}

export async function createCurrency(
  req: Request,
  res: Response
) {
  try {
    const {
      currencyId,
      name,
      description,
      enabled,
      icon,
    } = req.body;

    if (
      !currencyId ||
      typeof currencyId !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la monnaie est obligatoire.",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le nom de la monnaie est obligatoire.",
      });
    }

    const normalizedCurrencyId =
      currencyId.trim().toLowerCase();

    if (!isCurrencyId(normalizedCurrencyId)) {
      return res.status(400).json({
        success: false,
        message:
          "Monnaie invalide. Utilisez uniquement Solidus, Argent ou Bronze.",
      });
    }

    const currency =
      await currenciesService.createCurrency({
        currencyId: normalizedCurrencyId,
        name,
        description,
        enabled,
        icon,
      });

    return res.status(201).json({
      success: true,
      data: {
        currency,
      },
    });
  } catch (error) {
    console.error("Erreur création monnaie :", error);

    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer la monnaie.",
    });
  }
}
