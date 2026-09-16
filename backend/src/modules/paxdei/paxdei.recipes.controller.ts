import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { getRecipeForItem } from "./paxdei.recipes.service";
export async function getRecipe(req: AuthenticatedRequest, res: Response) { try { const itemId = String(req.params.itemId ?? "").trim(); const recipe = await getRecipeForItem(itemId); if (!recipe) return res.status(404).json({ success:false, message:"Recette introuvable pour cet objet." }); return res.json({ success:true, data:{ recipe } }); } catch(e) { return res.status(502).json({ success:false, message:e instanceof Error?e.message:"Impossible de récupérer la recette Pax Dei." }); } }
