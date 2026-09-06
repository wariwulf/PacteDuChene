import { Router } from "express";
import { paxDeiController } from "./paxdei.controller";

const router = Router();

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
