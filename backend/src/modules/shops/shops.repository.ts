import { Shop } from "./shops.model";

export class ShopsRepository {
  async findAll() {
    return Shop.find().sort({ name: 1 });
  }

  async findByShopId(shopId: string) {
    return Shop.findOne({ shopId });
  }

  async create(data: {
    shopId: string;
    name: string;
    description?: string;
    currencyId: string;
    enabled?: boolean;
  }) {
    return Shop.create(data);
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
    return Shop.findOneAndUpdate(
      { shopId },
      {
        $push: {
          items: {
            ...item,
            stock: item.stock ?? -1,
            enabled: item.enabled ?? true,
          },
        },
      },
      {
        new: true,
      }
    );
  }

   async findItem(shopId: string, itemId: string) {
    return Shop.findOne({
      shopId,
      "items.itemId": itemId,
    });
  }

  async decreaseStock(shopId: string, itemId: string) {
    return Shop.findOneAndUpdate(
      {
        shopId,
        "items.itemId": itemId,
        "items.stock": { $gt: 0 },
      },
      {
        $inc: {
          "items.$.stock": -1,
        },
      },
      {
        new: true,
      }
    );
  }
}