import { PaxDeiItem } from "./paxdei.items.model";
import { PaxDeiItemData } from "./paxdei.items.types";

export class PaxDeiItemsRepository {
  async findById(itemId: string) {
    return PaxDeiItem.findOne({ itemId }).lean();
  }

  async search(query: string, lang = "fr", limit = 25) {
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 50);
    const q = query.trim();

    if (!q) {
      return PaxDeiItem.find({})
        .sort({ name: 1 })
        .limit(safeLimit)
        .lean();
    }

    const escaped = q.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
    const regex = new RegExp(escaped, "i");
    const langField = `names.${lang}`;

    return PaxDeiItem.find({
      $or: [
        { name: regex },
        { [`${langField}`]: regex },
        { "names.fr": regex },
        { "names.en": regex },
        { itemId: regex },
      ],
    })
      .sort({ name: 1 })
      .limit(safeLimit)
      .lean();
  }

  async count() {
    return PaxDeiItem.countDocuments();
  }

  async latestSync() {
    const item = await PaxDeiItem.findOne({}).sort({ syncedAt: -1 }).select("syncedAt").lean();
    return item?.syncedAt ?? null;
  }

  async upsertMany(items: PaxDeiItemData[]) {
    if (!items.length) return;
    const operations = items.map((item) => ({
      updateOne: {
        filter: { itemId: item.itemId },
        update: { $set: item },
        upsert: true,
      },
    }));
    await PaxDeiItem.bulkWrite(operations, { ordered: false });
  }
}

export const paxDeiItemsRepository = new PaxDeiItemsRepository();
