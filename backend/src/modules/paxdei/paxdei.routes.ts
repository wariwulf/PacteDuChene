import { Router } from "express";

import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

import * as itemController from "./paxdei.items.controller";
import * as recipeController from "./paxdei.recipes.controller";
import { paxDeiController } from "./paxdei.controller";
import paxDeiDataRoutes from "./paxdei.data.routes";

const router = Router();


router.use("/data", paxDeiDataRoutes);

router.get(
  "/recipes/item/:itemId",
  requireAuth,
  recipeController.getRecipe,
);

router.get(
  "/items/search",
  requireAuth,
  itemController.search,
);

router.post(
  "/items/sync",
  requireAuth,
  requireRole("ADMIN", "OWNER"),
  itemController.sync,
);

router.get(
  "/items/:itemId",
  requireAuth,
  itemController.get,
);

router.get(
  "/characters/member/:memberId",
  paxDeiController.getCharacters.bind(paxDeiController)
);

router.get(
  "/characters/:id",
  paxDeiController.getCharacter.bind(paxDeiController)
);

router.post(
  "/characters",
  paxDeiController.createCharacter.bind(paxDeiController)
);

router.put(
  "/characters/:id",
  paxDeiController.updateCharacter.bind(paxDeiController)
);

router.delete(
  "/characters/:id",
  paxDeiController.deleteCharacter.bind(paxDeiController)
);


export default router;