import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { shopsService } from "./shops.service";

function actor(req: AuthenticatedRequest): string {
  if (!req.user) {
    throw new Error("Authentification requise.");
  }

  return req.user.id;
}

function param(req: AuthenticatedRequest, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string") {
    throw new Error(`Paramètre "${name}" invalide.`);
  }

  return value;
}

export async function list(req: any, res: Response) {
  try {
    return res.json({
      success: true,
      data: {
        shops: await shopsService.list(),
      },
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: e instanceof Error ? e.message : "Erreur.",
    });
  }
}

export async function get(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    return res.json({
      success: true,
      data: {
        shop: await shopsService.get(param(req, "shopId")),
      },
    });
  } catch (e) {
    return res.status(404).json({
      success: false,
      message:
        e instanceof Error ? e.message : "Boutique introuvable.",
    });
  }
}

export async function update(
  req: AuthenticatedRequest,
  res: Response,
) {
  return res.status(405).json({
    success: false,
    message: "Les boutiques du Pacte sont fixes.",
  });
}

export async function create(
  req: AuthenticatedRequest,
  res: Response,
) {
  return res.status(405).json({
    success: false,
    message: "Les boutiques du Pacte sont fixes.",
  });
}

export async function createItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    return res.status(201).json({
      success: true,
      data: {
        item: await shopsService.createItem(
          param(req, "shopId"),
          req.body,
        ),
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function updateItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    return res.json({
      success: true,
      data: {
        item: await shopsService.updateItem(
          param(req, "shopId"),
          param(req, "itemId"),
          req.body,
        ),
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function deleteItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    const item = await shopsService.deleteItem(
      param(req, "shopId"),
      param(req, "itemId"),
    );

    return res.json({
      success: true,
      data: { item },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible de supprimer l'article.",
    });
  }
}

export async function purchases(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    return res.json({
      success: true,
      data: { purchases: await shopsService.purchases(Number(req.query.limit ?? 100)) },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible de récupérer l'historique des achats.",
    });
  }
}

export async function purchase(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    return res.json({
      success: true,
      data: await shopsService.purchase(param(req, "id")),
    });
  } catch (e) {
    return res.status(404).json({
      success: false,
      message: e instanceof Error ? e.message : "Achat introuvable.",
    });
  }
}

export async function buy(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = actor(req);

    return res.status(201).json({
      success: true,
      data: await shopsService.buy(
        userId,
        param(req, "shopId"),
        param(req, "itemId"),
        Number(req.body?.quantity ?? 1),
      ),
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message:
        e instanceof Error
          ? e.message
          : "Impossible d'effectuer l'achat.",
    });
  }
}

export async function inventory(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    return res.json({
      success: true,
      data: {
        items: await shopsService.inventory(actor(req)),
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function adminInventory(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    return res.json({
      success: true,
      data: await shopsService.adminInventory(
        param(req, "userId"),
      ),
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function adjustInventory(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const result = await shopsService.adjustInventory(
      actor(req),
      param(req, "userId"),
      param(req, "itemId"),
      Number(req.body?.quantity),
      String(req.body?.reason ?? ""),
    );

    return res.json({
      success: true,
      data: {
        item: result,
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function notifications(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const id = actor(req);

    return res.json({
      success: true,
      data: {
        notifications: await shopsService.notifications(
          id,
          req.query.unreadOnly === "true",
        ),
        unreadCount: await shopsService.unreadCount(id),
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const n = await shopsService.markRead(
      actor(req),
      param(req, "id"),
    );

    return res.json({
      success: true,
      data: {
        notification: n,
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message: e instanceof Error ? e.message : "Impossible.",
    });
  }
}

export async function uploadItemImage(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    actor(req);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Aucune image n'a été fournie.",
      });
    }

    const shopId = param(req, "shopId");
    const itemId = param(req, "itemId");
    const imageUrl = `/uploads/shop-items/${req.file.filename}`;

    const item = await shopsService.setItemImage(
      shopId,
      itemId,
      imageUrl,
    );

    return res.json({
      success: true,
      data: {
        item,
        imageUrl,
      },
    });
  } catch (e) {
    return res.status(400).json({
      success: false,
      message:
        e instanceof Error
          ? e.message
          : "Impossible d'importer l'image.",
    });
  }
}
