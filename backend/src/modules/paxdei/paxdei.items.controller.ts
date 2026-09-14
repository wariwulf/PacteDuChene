import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { paxDeiItemsService } from "./paxdei.items.service";

function param(req: AuthenticatedRequest, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

export async function search(req: AuthenticatedRequest, res: Response) {
  try {
    const items = await paxDeiItemsService.search({
      q: typeof req.query.q === "string" ? req.query.q : "",
      lang: typeof req.query.lang === "string" ? req.query.lang : "fr",
      limit: typeof req.query.limit === "string" ? Number(req.query.limit) : 25,
    });
    return res.json({ success: true, data: { items } });
  } catch (error) {
    return res.status(502).json({
      success: false,
      message: error instanceof Error ? error.message : "Impossible de récupérer les objets Pax Dei.",
    });
  }
}

export async function get(req: AuthenticatedRequest, res: Response) {
  try {
    return res.json({ success: true, data: { item: await paxDeiItemsService.get(param(req, "itemId")) } });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error instanceof Error ? error.message : "Objet Pax Dei introuvable.",
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
      message: error instanceof Error ? error.message : "Synchronisation impossible.",
    });
  }
}
