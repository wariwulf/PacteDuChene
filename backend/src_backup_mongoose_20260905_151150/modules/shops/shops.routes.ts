import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";
import * as c from "./shops.controller";
import { shopItemImageUpload } from "./shops.upload";

const router = Router();

const admin = [
  requireAuth,
  requireRole("ADMIN", "OWNER"),
];

// Les boutiques sont fixes : aucune route de création ou de modification
// de boutique n'est exposée. Seuls leurs articles restent administrables.
router.get("/me/inventory", requireAuth, c.inventory);

router.get(
  "/admin/inventory/:userId",
  ...admin,
  c.adminInventory,
);

router.patch(
  "/admin/inventory/:userId/:itemId",
  ...admin,
  c.adjustInventory,
);

router.get(
  "/admin/purchases",
  ...admin,
  c.purchases,
);

router.get(
  "/admin/purchases/:id",
  ...admin,
  c.purchase,
);

router.get(
  "/admin/notifications",
  ...admin,
  c.notifications,
);

router.post(
  "/admin/notifications/:id/read",
  ...admin,
  c.markNotificationRead,
);

router.get("/", c.list);
router.get("/:shopId", c.get);

router.post(
  "/:shopId/items/:itemId/buy",
  requireAuth,
  c.buy,
);

router.post(
  "/:shopId/items",
  ...admin,
  c.createItem,
);

router.patch(
  "/:shopId/items/:itemId",
  ...admin,
  c.updateItem,
);

router.delete(
  "/:shopId/items/:itemId",
  ...admin,
  c.deleteItem,
);

router.post(
  "/:shopId/items/:itemId/image",
  ...admin,
  shopItemImageUpload.single("image"),
  c.uploadItemImage,
);

export default router;
