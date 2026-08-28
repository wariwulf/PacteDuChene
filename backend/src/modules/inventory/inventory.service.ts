import {
  inventoryRepository,
} from "./inventory.repository";

export class InventoryService {
  async getInventory(userId: string) {
    if (!userId) {
      throw new Error("L'identifiant du membre est obligatoire.");
    }

    return inventoryRepository.findByUserId(userId);
  }

  async getItem(
    userId: string,
    itemId: string
  ) {
    if (!userId) {
      throw new Error("L'identifiant du membre est obligatoire.");
    }

    if (!itemId) {
      throw new Error("L'identifiant de l'objet est obligatoire.");
    }

    return inventoryRepository.findItem(
      userId,
      itemId
    );
  }

  async hasItem(
    userId: string,
    itemId: string,
    quantity = 1
  ): Promise<boolean> {
    const item =
      await this.getItem(userId, itemId);

    return !!item && item.quantity >= quantity;
  }

  async addItem(
    userId: string,
    itemId: string,
    quantity = 1
  ) {
    if (!userId) {
      throw new Error("L'identifiant du membre est obligatoire.");
    }

    if (!itemId) {
      throw new Error("L'identifiant de l'objet est obligatoire.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(
        "La quantité doit être un entier supérieur à 0."
      );
    }

    return inventoryRepository.addItem(
      userId,
      itemId,
      quantity
    );
  }

  async removeItem(
    userId: string,
    itemId: string,
    quantity = 1
  ) {
    if (!userId) {
      throw new Error("L'identifiant du membre est obligatoire.");
    }

    if (!itemId) {
      throw new Error("L'identifiant de l'objet est obligatoire.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new Error(
        "La quantité doit être un entier supérieur à 0."
      );
    }

    const item =
      await inventoryRepository.findItem(
        userId,
        itemId
      );

    if (!item) {
      throw new Error(
        "Cet objet n'existe pas dans l'inventaire."
      );
    }

    if (item.quantity < quantity) {
      throw new Error(
        "Quantité insuffisante dans l'inventaire."
      );
    }

    const updated =
      await inventoryRepository.removeItem(
        userId,
        itemId,
        quantity
      );

    if (!updated) {
      throw new Error(
        "Impossible de modifier l'inventaire."
      );
    }

    if (updated.quantity === 0) {
      await inventoryRepository.deleteItem(
        userId,
        itemId
      );

      return null;
    }

    return updated;
  }
}

export const inventoryService =
  new InventoryService();