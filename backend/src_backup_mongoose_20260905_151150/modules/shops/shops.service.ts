import { economyTransactionRepository } from "../economy/economy-transaction.repository";
import { isCurrencyId } from "../economy/economy.constants";
import { User } from "../users/user.model";
import { Shop, ShopItem } from "./shops.model";
import { Inventory } from "./inventory.model";
import { ShopPurchase } from "./purchase.model";
import { AdminNotification } from "./notification.model";
import { FIXED_SHOPS } from "./shops.constants";

const tierValues = [1, 2, 3, 4, 5] as const;

function cleanUrl(value: unknown) {
  if (!value) return undefined;
  const s = String(value).trim();
  if (!s) return undefined;
  if (!/^https?:\/\//i.test(s)) {
    throw new Error("Le lien externe doit commencer par http:// ou https://.");
  }
  return s;
}

function validateItem(data: any) {
  if (!String(data.itemId ?? "").trim()) {
    throw new Error("L'identifiant de l'article est obligatoire.");
  }
  if (!String(data.name ?? "").trim()) {
    throw new Error("Le nom de l'article est obligatoire.");
  }
  if (!isCurrencyId(data.currencyId)) {
    throw new Error("Monnaie invalide.");
  }

  const tier = Number(data.tier);
  if (!tierValues.includes(tier as any)) {
    throw new Error("Le tier doit être compris entre I et V.");
  }

  const price = Number(data.price);
  const stock = Number(data.stock);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Prix invalide.");
  }
  if (!Number.isInteger(stock) || stock < -1) {
    throw new Error("Stock invalide.");
  }

  if (
    data.purchaseLimit != null &&
    (!Number.isInteger(Number(data.purchaseLimit)) ||
      Number(data.purchaseLimit) < 1)
  ) {
    throw new Error("Limite d'achat invalide.");
  }

  if (
    data.purchaseLimitWindowHours != null &&
    (!Number.isFinite(Number(data.purchaseLimitWindowHours)) ||
      Number(data.purchaseLimitWindowHours) < 1)
  ) {
    throw new Error("Durée de limite invalide.");
  }
}

export class ShopsService {
  /**
   * Les boutiques du Pacte sont fixes.
   *
   * On les crée automatiquement si elles n'existent pas encore et on
   * rétablit leurs informations officielles si elles avaient été modifiées.
   * Les articles ne sont jamais touchés ici.
   */
  private async ensureFixedShops() {
    for (const shop of FIXED_SHOPS) {
      await Shop.updateOne(
        { shopId: shop.shopId },
        {
          $set: {
            name: shop.name,
            description: shop.description,
            currencyId: shop.currencyId,
            enabled: true,
          },
          $setOnInsert: {
            shopId: shop.shopId,
          },
        },
        { upsert: true },
      );
    }
  }

  async list() {
    await this.ensureFixedShops();

    const shops = await Shop.find({
      shopId: { $in: FIXED_SHOPS.map((shop) => shop.shopId) },
    })
      .sort({ shopId: 1 })
      .lean();

    const items = await ShopItem.find({
      shopId: { $in: FIXED_SHOPS.map((shop) => shop.shopId) },
    })
      .sort({ tier: 1, name: 1 })
      .lean();

    return FIXED_SHOPS.map((fixedShop) => {
      const shop = shops.find((current) => current.shopId === fixedShop.shopId);

      return {
        ...shop,
        shopId: fixedShop.shopId,
        name: fixedShop.name,
        description: fixedShop.description,
        currencyId: fixedShop.currencyId,
        enabled: true,
        items: items.filter((item) => item.shopId === fixedShop.shopId),
      };
    });
  }

  async get(shopId: string) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Boutique introuvable.");
    }

    await this.ensureFixedShops();

    const shop = await Shop.findOne({ shopId }).lean();
    if (!shop) throw new Error("Boutique introuvable.");

    const items = await ShopItem.find({ shopId })
      .sort({ tier: 1, name: 1 })
      .lean();

    return {
      ...shop,
      shopId: fixedShop.shopId,
      name: fixedShop.name,
      description: fixedShop.description,
      currencyId: fixedShop.currencyId,
      enabled: true,
      items,
    };
  }

  async createItem(shopId: string, data: any) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Cette boutique n'existe pas.");
    }

    await this.ensureFixedShops();
    validateItem(data);

    const itemId = String(data.itemId).trim().toLowerCase();

    return ShopItem.create({
      shopId,
      itemId,
      name: String(data.name).trim(),
      imageUrl: String(data.imageUrl ?? "").trim() || undefined,
      description: String(data.description ?? "").trim() || undefined,
      externalUrl: cleanUrl(data.externalUrl),
      tier: Number(data.tier),
      price: Number(data.price),
      currencyId: fixedShop.currencyId,
      stock: Number(data.stock),
      enabled: data.enabled !== false,
      purchaseLimit:
        data.purchaseLimit == null
          ? undefined
          : Number(data.purchaseLimit),
      purchaseLimitWindowHours:
        data.purchaseLimitWindowHours == null
          ? undefined
          : Number(data.purchaseLimitWindowHours),
    });
  }

  async updateItem(shopId: string, itemId: string, data: any) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Cette boutique n'existe pas.");
    }

    validateItem({ ...data, itemId });

    const patch = {
      ...data,
      shopId,
      currencyId: fixedShop.currencyId,
      imageUrl: String(data.imageUrl ?? "").trim() || undefined,
      description: String(data.description ?? "").trim() || undefined,
      externalUrl: cleanUrl(data.externalUrl),
      tier: Number(data.tier),
      price: Number(data.price),
      stock: Number(data.stock),
      purchaseLimit:
        data.purchaseLimit == null
          ? undefined
          : Number(data.purchaseLimit),
      purchaseLimitWindowHours:
        data.purchaseLimitWindowHours == null
          ? undefined
          : Number(data.purchaseLimitWindowHours),
    };

    const item = await ShopItem.findOneAndUpdate(
      { shopId, itemId },
      patch,
      { new: true, runValidators: true },
    );

    if (!item) throw new Error("Article introuvable.");
    return item;
  }

  async deleteItem(shopId: string, itemId: string) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Cette boutique n'existe pas.");
    }

    const item = await ShopItem.findOneAndDelete({ shopId, itemId });

    if (!item) {
      throw new Error("Article introuvable.");
    }

    // Les achats et les objets déjà acquis ne sont pas supprimés :
    // ils constituent l'historique du Pacte. Seul l'article de la boutique disparaît.
    return item;
  }

  async setItemImage(shopId: string, itemId: string, imageUrl: string) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Cette boutique n'existe pas.");
    }

    const cleanImageUrl = String(imageUrl ?? "").trim();

    if (!cleanImageUrl) {
      throw new Error("L'image est obligatoire.");
    }

    const item = await ShopItem.findOneAndUpdate(
      { shopId, itemId },
      { $set: { imageUrl: cleanImageUrl } },
      { new: true, runValidators: true },
    );

    if (!item) {
      throw new Error("Article introuvable.");
    }

    return item;
  }

  async buy(
    userId: string,
    shopId: string,
    itemId: string,
    quantity: number,
  ) {
    const fixedShop = FIXED_SHOPS.find((shop) => shop.shopId === shopId);

    if (!fixedShop) {
      throw new Error("Boutique introuvable.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error("La quantité doit être un entier supérieur à 0.");
    }

    await this.ensureFixedShops();

    const item = await ShopItem.findOne({ shopId, itemId });
    if (!item || !item.enabled) {
      throw new Error("Article indisponible.");
    }

    if (item.stock >= 0 && item.stock < quantity) {
      throw new Error("Stock insuffisant.");
    }

    const now = new Date();

    if (item.purchaseLimit && item.purchaseLimitWindowHours) {
      const since = new Date(
        now.getTime() - item.purchaseLimitWindowHours * 3600000,
      );

      const prior = await ShopPurchase.aggregate([
        {
          $match: {
            userId,
            shopId,
            itemId,
            createdAt: { $gte: since },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$quantity" },
          },
        },
      ]);

      if ((prior[0]?.total ?? 0) + quantity > item.purchaseLimit) {
        throw new Error(
          `Limite d'achat atteinte : ${item.purchaseLimit} exemplaire(s) sur ${item.purchaseLimitWindowHours} heure(s).`,
        );
      }
    }

    const total = item.price * quantity;

    if (!isCurrencyId(item.currencyId)) {
      throw new Error("Monnaie de l'article invalide.");
    }

    const user = await User.findOne({
      _id: userId,
      status: { $ne: "DELETED" },
    });

    if (!user) throw new Error("Utilisateur introuvable.");

    const balance = Number(
      user.economy?.balances?.get(item.currencyId) ?? 0,
    );

    if (balance < total) {
      throw new Error("Solde insuffisant.");
    }

    const updatedItem = await ShopItem.findOneAndUpdate(
      {
        shopId,
        itemId,
        ...(item.stock >= 0 ? { stock: { $gte: quantity } } : {}),
      },
      item.stock >= 0
        ? { $inc: { stock: -quantity } }
        : { $set: { updatedAt: now } },
      { new: true },
    );

    if (!updatedItem) {
      throw new Error(
        "L'article vient d'être épuisé. Veuillez réessayer.",
      );
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        status: { $ne: "DELETED" },
        [`economy.balances.${item.currencyId}`]: { $gte: total },
      },
      {
        $inc: {
          [`economy.balances.${item.currencyId}`]: -total,
        },
      },
      { new: true },
    );

    if (!updatedUser) {
      if (item.stock >= 0) {
        await ShopItem.updateOne(
          { shopId, itemId },
          { $inc: { stock: quantity } },
        );
      }

      throw new Error("Solde insuffisant.");
    }

    try {
      const inv = await Inventory.findOneAndUpdate(
        { userId, itemId },
        {
          $setOnInsert: {
            shopId,
            name: item.name,
            imageUrl: item.imageUrl,
            description: item.description,
            acquiredAt: now,
          },
          $inc: { quantity },
        },
        { upsert: true, new: true },
      );

      const purchase = await ShopPurchase.create({
        userId,
        shopId,
        itemId,
        itemName: item.name,
        quantity,
        unitPrice: item.price,
        totalPrice: total,
        currencyId: item.currencyId,
        createdAt: now,
      });

      await economyTransactionRepository.create({
        userId,
        currencyId: item.currencyId,
        amount: -total,
        type: "purchase",
        source: "shop",
        sourceId: purchase._id.toString(),
        description: `Achat : ${quantity} × ${item.name}`,
      });

      const buyerName = String(
        user.profile?.displayName ||
          user.profile?.username ||
          user.discord?.username ||
          "Un membre",
      );

      await AdminNotification.create({
        type: "shop_purchase",
        title: "Nouvel achat",
        message: `${buyerName} a acheté ${quantity} × ${item.name} dans ${fixedShop.name} pour ${total} ${item.currencyId}.`,
        purchaseId: purchase._id.toString(),
        userId,
        readBy: [],
      });

      return {
        purchase,
        inventory: inv,
        balances: updatedUser.economy?.balances,
        remainingStock: updatedItem.stock,
      };
    } catch (e) {
      await User.updateOne(
        { _id: userId },
        {
          $inc: {
            [`economy.balances.${item.currencyId}`]: total,
          },
        },
      );

      if (item.stock >= 0) {
        await ShopItem.updateOne(
          { shopId, itemId },
          { $inc: { stock: quantity } },
        );
      }

      throw e;
    }
  }

  async inventory(userId: string) {
    return Inventory.find({
      userId,
      quantity: { $gt: 0 },
    })
      .sort({ updatedAt: -1 })
      .lean();
  }

  async adminInventory(userId: string) {
    const user = await User.findOne({
      _id: userId,
      status: { $ne: "DELETED" },
    })
      .select("profile discord")
      .lean();

    if (!user) throw new Error("Membre introuvable.");

    return {
      user,
      items: await this.inventory(userId),
    };
  }

  async adjustInventory(
    actorId: string,
    userId: string,
    itemId: string,
    quantity: number,
    reason: string,
  ) {
    if (!Number.isInteger(quantity) || quantity === 0) {
      throw new Error(
        "La quantité doit être un entier différent de 0.",
      );
    }

    if (reason.trim().length < 3) {
      throw new Error("Une justification est obligatoire.");
    }

    let inv = await Inventory.findOne({ userId, itemId });

    if (
      quantity < 0 &&
      (!inv || inv.quantity < Math.abs(quantity))
    ) {
      throw new Error(
        "Le membre ne possède pas suffisamment cet objet.",
      );
    }

    if (quantity > 0) {
      const item = await ShopItem.findOne({ itemId });

      if (!item) throw new Error("Article introuvable.");

      inv = await Inventory.findOneAndUpdate(
        { userId, itemId },
        {
          $setOnInsert: {
            shopId: item.shopId,
            name: item.name,
            imageUrl: item.imageUrl,
            description: item.description,
            acquiredAt: new Date(),
          },
          $inc: { quantity },
        },
        { upsert: true, new: true },
      );
    } else {
      inv = await Inventory.findOneAndUpdate(
        { userId, itemId },
        { $inc: { quantity } },
        { new: true },
      );

      if (inv && inv.quantity === 0) {
        await Inventory.deleteOne({ _id: inv._id });
      }
    }

    void actorId;
    return inv;
  }

  async purchases(limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    return ShopPurchase.find()
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();
  }

  async purchase(purchaseId: string) {
    const purchase = await ShopPurchase.findById(purchaseId).lean();

    if (!purchase) {
      throw new Error("Achat introuvable.");
    }

    const [user, shop, item] = await Promise.all([
      User.findOne({ _id: purchase.userId, status: { $ne: "DELETED" } })
        .select("profile discord")
        .lean(),
      Shop.findOne({ shopId: purchase.shopId }).lean(),
      ShopItem.findOne({ shopId: purchase.shopId, itemId: purchase.itemId }).lean(),
    ]);

    return {
      purchase,
      user,
      shop,
      item,
    };
  }

  async notifications(adminId: string, unreadOnly = false) {
    const q: any = unreadOnly
      ? { readBy: { $ne: adminId } }
      : {};

    return AdminNotification.find(q)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async markRead(adminId: string, id: string) {
    return AdminNotification.findByIdAndUpdate(
      id,
      { $addToSet: { readBy: adminId } },
      { new: true },
    );
  }

  async unreadCount(adminId: string) {
    return AdminNotification.countDocuments({
      readBy: { $ne: adminId },
    });
  }
}

export const shopsService = new ShopsService();
