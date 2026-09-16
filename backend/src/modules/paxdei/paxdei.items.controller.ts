import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { paxDeiItemsService } from "./paxdei.items.service";
import { paxDeiItemsRepository } from "./paxdei.items.repository";
import { paxDeiFactionCatalogService } from "./paxdei.faction-catalog.service";

function param(req: AuthenticatedRequest, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

export async function search(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId =
      typeof req.query.factionId === "string"
        ? req.query.factionId.trim()
        : "";

    const allowedItemIds = factionId
      ? await paxDeiFactionCatalogService.getAllowedItemIds(factionId)
      : undefined;

    const items = await paxDeiItemsRepository.search(
      typeof req.query.q === "string" ? req.query.q : "",
      typeof req.query.lang === "string" ? req.query.lang : "fr",
      typeof req.query.limit === "string" ? Number(req.query.limit) : 25,
      allowedItemIds ? [...allowedItemIds] : undefined,
    );

    return res.json({ success: true, data: { items } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de rechercher les objets Pax Dei.",
    });
  }
}

export async function get(req: AuthenticatedRequest, res: Response) {
  try {
    return res.json({
      success: true,
      data: { item: await paxDeiItemsService.get(param(req, "itemId")) },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Objet Pax Dei introuvable.",
    });
  }
}

export async function sync(req: AuthenticatedRequest, res: Response) {
  try {
    const count = await paxDeiItemsService.syncCatalog();
    return res.json({ success: true, data: { count } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Synchronisation impossible.",
    });
  }
}
