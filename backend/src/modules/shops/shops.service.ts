import { ShopsRepository } from "./shops.repository";
import { EconomyService } from "../economy/economy.service";
import { inventoryService } from "../inventory/inventory.service";
import { eventsService } from "../events/events.service";

export class ShopsService {
  constructor(
    private readonly shopsRepository = new ShopsRepository(),
    private readonly economyService = new EconomyService()
  ) {}

  async getShops() {
    return this.shopsRepository.findAll();
  }

  async getShop(shopId: string) {
    const shop =
      await this.shopsRepository.findByShopId(shopId);

    if (!shop) {
      throw new Error("Boutique introuvable.");
    }

    return shop;
  }

  async createShop(data: {
    shopId: string;
    name: string;
    description?: string;
    currencyId: string;
    enabled?: boolean;
  }) {
    const existingShop =
      await this.shopsRepository.findByShopId(
        data.shopId
      );

    if (existingShop) {
      throw new Error("Cette boutique existe déjà.");
    }

    return this.shopsRepository.create(data);
  }

  async addItem(
    shopId: string,
    item: {
      itemId: string;
      name: string;
      description?: string;
      price: number;
      stock?: number;
      enabled?: boolean;
    }
  ) {
    if (item.price < 0) {
      throw new Error(
        "Le prix ne peut pas être négatif."
      );
    }

    const shop =
      await this.shopsRepository.findByShopId(
        shopId
      );

    if (!shop) {
      throw new Error("Boutique introuvable.");
    }

    const existingItem = shop.items.find(
      (existing) =>
        existing.itemId === item.itemId
    );

    if (existingItem) {
      throw new Error(
        "Cet article existe déjà dans cette boutique."
      );
    }

    return this.shopsRepository.addItem(
      shopId,
      item
    );
  }

  async buyItem(
    userId: string,
    shopId: string,
    itemId: string
  ) {
    // ==========================================
    // 1. Vérification de la boutique
    // ==========================================

    const shop =
      await this.shopsRepository.findByShopId(
        shopId
      );

    if (!shop) {
      throw new Error("Boutique introuvable.");
    }

    if (!shop.enabled) {
      throw new Error(
        "Cette boutique est actuellement désactivée."
      );
    }

    // ==========================================
    // 2. Vérification de l'article
    // ==========================================

    const item = shop.items.find(
      (currentItem) =>
        currentItem.itemId === itemId
    );

    if (!item) {
      throw new Error("Article introuvable.");
    }

    if (!item.enabled) {
      throw new Error(
        "Cet article est actuellement indisponible."
      );
    }

    if (
      item.stock !== undefined &&
      item.stock <= 0
    ) {
      throw new Error(
        "Cet article est épuisé."
      );
    }

    // ==========================================
    // 3. Paiement
    // ==========================================

    const balances =
      await this.economyService.removeBalance(
        userId,
        shop.currencyId,
        item.price
      );

    // ==========================================
    // 4. Transaction économique
    // ==========================================

    await this.economyService.addTransaction({
      userId,
      currencyId: shop.currencyId,
      amount: -item.price,
      type: "purchase",
      source: "shop",
      sourceId: `${shopId}:${itemId}`,
      description: `Achat de ${item.name}`,
    });

    // ==========================================
    // 5. Diminution du stock
    // ==========================================

    const updatedShop =
      await this.shopsRepository.decreaseStock(
        shopId,
        itemId
      );

    if (!updatedShop) {
      throw new Error(
        "Impossible de mettre à jour le stock."
      );
    }
    await eventsService.dispatch({
      type: "item_purchased",
      userId,
      targetId: itemId,
      quantity: 1,
    });

    // ==========================================
    // 6. Ajout à l'inventaire
    // ==========================================

    const inventoryItem =
      await inventoryService.addItem(
        userId,
        item.itemId,
        1
      );

    // ==========================================
    // 7. Résultat
    // ==========================================

    return {
      shopId,
      itemId,
      itemName: item.name,
      price: item.price,
      currencyId: shop.currencyId,
      balances,
    };
  }
}

export const shopsService =
  new ShopsService();