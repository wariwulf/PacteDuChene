import { Request, Response } from "express";
import { ShopsService } from "./shops.service";

const shopsService = new ShopsService();

/**
 * Récupérer toutes les boutiques
 */
export async function getShops(
  req: Request,
  res: Response
) {
  try {
    const shops = await shopsService.getShops();

    return res.status(200).json({
      success: true,
      data: {
        shops,
      },
    });
  } catch (error) {
    console.error("Erreur récupération boutiques :", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de récupérer les boutiques.";

    return res.status(500).json({
      success: false,
      message,
    });
  }
}

/**
 * Récupérer une boutique
 */
export async function getShop(
  req: Request,
  res: Response
) {
  try {
    const shopId = String(req.params.shopId ?? "");

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la boutique est obligatoire.",
      });
    }

    const shop = await shopsService.getShop(shopId);

    return res.status(200).json({
      success: true,
      data: {
        shop,
      },
    });
  } catch (error) {
    console.error("Erreur récupération boutique :", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de récupérer la boutique.";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

/**
 * Créer une boutique
 */
export async function createShop(
  req: Request,
  res: Response
) {
  try {
    const {
      shopId,
      name,
      description,
      currencyId,
      enabled,
    } = req.body as {
      shopId?: string;
      name?: string;
      description?: string;
      currencyId?: string;
      enabled?: boolean;
    };

    if (!shopId || typeof shopId !== "string") {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la boutique est obligatoire.",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le nom de la boutique est obligatoire.",
      });
    }

    if (!currencyId || typeof currencyId !== "string") {
      return res.status(400).json({
        success: false,
        message: "La monnaie de la boutique est obligatoire.",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La description doit être une chaîne de caractères.",
      });
    }

    if (
      enabled !== undefined &&
      typeof enabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Le champ enabled doit être un booléen.",
      });
    }

    const shop = await shopsService.createShop({
      shopId,
      name,
      description,
      currencyId,
      enabled,
    });

    return res.status(201).json({
      success: true,
      data: {
        shop,
      },
    });
  } catch (error) {
    console.error("Erreur création boutique :", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible de créer la boutique.";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/**
 * Ajouter un article à une boutique
 */
export async function addItem(
  req: Request,
  res: Response
) {
  try {
    const shopId = String(req.params.shopId ?? "");

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la boutique est obligatoire.",
      });
    }

    const {
      itemId,
      name,
      description,
      price,
      stock,
      enabled,
    } = req.body as {
      itemId?: string;
      name?: string;
      description?: string;
      price?: number;
      stock?: number;
      enabled?: boolean;
    };

    if (!itemId || typeof itemId !== "string") {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de l'article est obligatoire.",
      });
    }

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Le nom de l'article est obligatoire.",
      });
    }

    if (
      price === undefined ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Le prix doit être un nombre supérieur ou égal à 0.",
      });
    }

    if (
      stock !== undefined &&
      (
        typeof stock !== "number" ||
        !Number.isInteger(stock) ||
        stock < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Le stock doit être un entier supérieur ou égal à 0.",
      });
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "La description doit être une chaîne de caractères.",
      });
    }

    if (
      enabled !== undefined &&
      typeof enabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "Le champ enabled doit être un booléen.",
      });
    }

    const shop = await shopsService.addItem(shopId, {
      itemId,
      name,
      description,
      price,
      stock,
      enabled,
    });

    return res.status(201).json({
      success: true,
      data: {
        shop,
      },
    });
  } catch (error) {
    console.error("Erreur ajout article :", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible d'ajouter l'article.";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

/**
 * Acheter un article
 */
export async function buyItem(
  req: Request,
  res: Response
) {
  try {
    const shopId = String(req.params.shopId ?? "");
    const itemId = String(req.params.itemId ?? "");

    if (!shopId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de la boutique est obligatoire.",
      });
    }

    if (!itemId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant de l'article est obligatoire.",
      });
    }

    const { userId } = req.body as {
      userId?: string;
    };

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "L'identifiant utilisateur est obligatoire.",
      });
    }

    const result = await shopsService.buyItem(
      userId,
      shopId,
      itemId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Erreur achat article :", error);

    const message =
      error instanceof Error
        ? error.message
        : "Impossible d'effectuer l'achat.";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}