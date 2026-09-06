import { Request, Response } from "express";
import { loreService } from "./lore.service";

export async function getLore(req: Request, res: Response) {
  try {
    const lore = await loreService.getLore(req.query.includeDisabled === "true");
    return res.status(200).json({ success: true, data: { lore } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Impossible de récupérer le lore." });
  }
}
export async function getLoreEntry(req: Request, res: Response) {
  try {
    const lore = await loreService.getEntry(String(req.params.loreId ?? ""));
    return res.status(200).json({ success: true, data: { lore } });
  } catch (error) {
    return res.status(404).json({ success: false, message: error instanceof Error ? error.message : "Entrée de lore introuvable." });
  }
}
export async function createLoreEntry(req: Request, res: Response) {
  try {
    const lore = await loreService.createEntry(req.body);
    return res.status(201).json({ success: true, data: { lore } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Impossible de créer l'entrée de lore." });
  }
}
export async function updateLoreEntry(req: Request, res: Response) {
  try {
    const lore = await loreService.updateEntry(String(req.params.loreId ?? ""), req.body);
    return res.status(200).json({ success: true, data: { lore } });
  } catch (error) {
    return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Impossible de modifier l'entrée de lore." });
  }
}
export async function deleteLoreEntry(req: Request, res: Response) {
  try {
    const result = await loreService.deleteEntry(String(req.params.loreId ?? ""));
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(404).json({ success: false, message: error instanceof Error ? error.message : "Impossible de supprimer l'entrée de lore." });
  }
}
