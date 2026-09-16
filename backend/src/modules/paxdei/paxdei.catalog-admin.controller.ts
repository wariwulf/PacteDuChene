import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { paxDeiFactionCatalogService } from "./paxdei.faction-catalog.service";

function param(req: AuthenticatedRequest, name: string): string {
  const value = req.params[name];
  return typeof value === "string" ? value : "";
}

export async function list(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    return res.json({
      success: true,
      data: { items: await paxDeiFactionCatalogService.listFaction(factionId) },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Catalogue introuvable.",
    });
  }
}

export async function add(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    const itemId = typeof req.body?.itemId === "string" ? req.body.itemId.trim() : "";
    if (!itemId) return res.status(400).json({ success: false, message: "itemId obligatoire." });

    const entry = await paxDeiFactionCatalogService.addManual(factionId, itemId);
    return res.status(201).json({ success: true, data: { entry } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Ajout impossible.",
    });
  }
}

export async function remove(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    const itemId = param(req, "itemId");
    await paxDeiFactionCatalogService.removeManual(factionId, itemId);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Suppression impossible.",
    });
  }
}

export async function exclude(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    const itemId = param(req, "itemId");
    const entry = await paxDeiFactionCatalogService.addManualExclusion(factionId, itemId);
    return res.json({ success: true, data: { entry } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Exclusion impossible.",
    });
  }
}

export async function reinstate(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    const itemId = param(req, "itemId");
    await paxDeiFactionCatalogService.removeManualExclusion(factionId, itemId);
    return res.json({ success: true });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Réintégration impossible.",
    });
  }
}

export async function setEnabled(req: AuthenticatedRequest, res: Response) {
  try {
    const factionId = param(req, "factionId");
    const itemId = param(req, "itemId");
    const enabled = Boolean(req.body?.enabled);
    const entry = await paxDeiFactionCatalogService.setEnabled(factionId, itemId, enabled);
    return res.json({ success: true, data: { entry } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Modification impossible.",
    });
  }
}
