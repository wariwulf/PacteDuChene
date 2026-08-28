import {
  InventoryItem,
  InventoryItemDocument,
} from "./inventory.model";

export class InventoryRepository {
  async findByUserId(
    userId: string
  ): Promise<InventoryItemDocument[]> {
    return InventoryItem.find({ userId })
      .sort({ acquiredAt: -1 });
  }

  async findItem(
    userId: string,
    itemId: string
  ): Promise<InventoryItemDocument | null> {
    return InventoryItem.findOne({
      userId,
      itemId,
    });
  }

  async addItem(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<InventoryItemDocument> {
    return InventoryItem.findOneAndUpdate(
      {
        userId,
        itemId,
      },
      {
        $inc: {
          quantity,
        },
        $setOnInsert: {
          userId,
          itemId,
          acquiredAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
      }
    ) as Promise<InventoryItemDocument>;
  }

  async removeItem(
    userId: string,
    itemId: string,
    quantity: number
  ): Promise<InventoryItemDocument | null> {
    return InventoryItem.findOneAndUpdate(
      {
        userId,
        itemId,
        quantity: { $gte: quantity },
      },
      {
        $inc: {
          quantity: -quantity,
        },
      },
      {
        new: true,
      }
    );
  }

  async deleteItem(
    userId: string,
    itemId: string
  ) {
    return InventoryItem.deleteOne({
      userId,
      itemId,
    });
  }
}

export const inventoryRepository =
  new InventoryRepository();