import { PaxDeiResource } from "./paxdei.resource.model";
import { PaxDeiResourceData } from "./paxdei.catalog.types";

export class PaxDeiResourceRepository {
  async upsertMany(rows: PaxDeiResourceData[]) {
    if (!rows.length) return;
    await PaxDeiResource.bulkWrite(
      rows.map((row) => ({
        updateOne: {
          filter: { resourceId: row.resourceId },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async findByDropItemId(itemId: string) {
    return PaxDeiResource.find({ "drops.itemId": itemId })
      .sort({ name: 1 })
      .lean();
  }

  async count() {
    return PaxDeiResource.countDocuments();
  }
}

export const paxDeiResourceRepository = new PaxDeiResourceRepository();
