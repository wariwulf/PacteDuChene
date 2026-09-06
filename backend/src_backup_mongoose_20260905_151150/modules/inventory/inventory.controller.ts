import { Request, Response } from "express";
import { inventoryService } from "./inventory.service";

export async function getInventory(
  req: Request,
  res: Response
) {
  try {
    const userId = String(req.params.userId ?? "");

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "L'identifiant du membre est obligatoire.",
      });
    }

    const inventory =
      await inventoryService.getInventory(userId);

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de récupérer l'inventaire.";

    return res.status(500).json({
      success: false,
      message,
    });
  }
}

export async function getInventoryItem(
  req: Request,
  res: Response
) {
  try {
    const userId = String(req.params.userId ?? "");
    const itemId = String(req.params.itemId ?? "");

    if (!userId || !itemId) {
      return res.status(400).json({
        success: false,
        message:
          "L'identifiant du membre et celui de l'objet sont obligatoires.",
      });
    }

    const item =
      await inventoryService.getItem(
        userId,
        itemId
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Objet introuvable dans l'inventaire.",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de récupérer l'objet.";

    return res.status(500).json({
      success: false,
      message,
    });
  }
}