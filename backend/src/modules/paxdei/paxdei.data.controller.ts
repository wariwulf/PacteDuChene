import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { paxDeiDataSyncService } from "./paxdei.data-sync.service";
import { paxDeiRecipeRepository } from "./paxdei.recipe.repository";
import { paxDeiResourceRepository } from "./paxdei.resource.repository";
import { paxDeiFactionCatalogRepository } from "./paxdei.faction-catalog.repository";
import { paxDeiItemsRepository } from "./paxdei.items.repository";

export async function sync(_req: AuthenticatedRequest, res: Response) {
  try {
    const result = await paxDeiDataSyncService.syncFull();
    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Pax Dei full sync:", error);
    return res.status(502).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Synchronisation Pax Dei impossible.",
    });
  }
}

export async function status(_req: AuthenticatedRequest, res: Response) {
  const [items, recipes, resources, factionCatalog] = await Promise.all([
    paxDeiItemsRepository.count(),
    paxDeiRecipeRepository.count(),
    paxDeiResourceRepository.count(),
    paxDeiFactionCatalogRepository.count(),
  ]);

  return res.json({
    success: true,
    data: { items, recipes, resources, factionCatalog },
  });
}
