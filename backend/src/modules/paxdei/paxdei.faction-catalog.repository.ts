import { PaxDeiFactionCatalog } from "./paxdei.faction-catalog.model";
import {
  PaxDeiFactionCatalogData,
  PaxDeiFactionId,
} from "./paxdei.catalog.types";
import { PaxDeiItem } from "./paxdei.items.model";

export class PaxDeiFactionCatalogRepository {
  async upsertMany(rows: PaxDeiFactionCatalogData[]) {
    if (!rows.length) return;

    // Les associations MANUAL et MANUAL_EXCLUSION
    // ne doivent jamais être transformées en association automatique.
    const automatic = rows.filter(
      (row) =>
        row.reason !== "MANUAL" &&
        row.reason !== "MANUAL_EXCLUSION",
    );

    if (!automatic.length) return;

    const keys = automatic.map((row) => ({
      factionId: row.factionId,
      itemId: row.itemId,
    }));

    // Les associations manuelles et les exclusions manuelles
    // sont protégées contre la synchronisation automatique.
    const manualRows = await PaxDeiFactionCatalog.find({
      reason: { $in: ["MANUAL", "MANUAL_EXCLUSION"] },
      $or: keys,
    })
      .select("factionId itemId")
      .lean();

    const manualKeys = new Set(
      manualRows.map((row) => `${row.factionId}:${row.itemId}`),
    );

    const protectedRows = automatic.filter(
      (row) => !manualKeys.has(`${row.factionId}:${row.itemId}`),
    );

    if (!protectedRows.length) return;

    await PaxDeiFactionCatalog.bulkWrite(
      protectedRows.map((row) => ({
        updateOne: {
          filter: {
            factionId: row.factionId,
            itemId: row.itemId,
          },
          update: { $set: row },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  async findItemIds(factionId: PaxDeiFactionId) {
    const rows = await PaxDeiFactionCatalog.find({
      factionId,
      enabled: true,
      reason: { $ne: "MANUAL_EXCLUSION" },
    })
      .select("itemId")
      .lean();
    return rows.map((row) => row.itemId);
  }

  async isAllowed(factionId: PaxDeiFactionId, itemId: string) {
    return Boolean(
      await PaxDeiFactionCatalog.exists({
        factionId,
        itemId,
        enabled: true,
        reason: { $ne: "MANUAL_EXCLUSION" },
      }),
    );
  }

  async count() {
    return PaxDeiFactionCatalog.countDocuments();
  }

  async resetSyncedCatalog() {
    // On ne touche jamais aux associations ajoutées manuellement.
    await PaxDeiFactionCatalog.deleteMany({
      reason: { $nin: ["MANUAL", "MANUAL_EXCLUSION"] },
    });
  }

  async listFaction(factionId: PaxDeiFactionId) {
    const rows = await PaxDeiFactionCatalog.find({ factionId })
      .sort({ reason: 1, itemId: 1 })
      .lean();

    const ids = rows.map((row) => row.itemId);
    const items = ids.length
      ? await PaxDeiItem.find({ itemId: { $in: ids } })
          .select("itemId name names imageUrl externalUrl")
          .lean()
      : [];

    const byId = new Map(items.map((item) => [item.itemId, item]));
    return rows.map((row) => ({
      ...row,
      item: byId.get(row.itemId) ?? null,
    }));
  }

  async addManual(factionId: PaxDeiFactionId, itemId: string) {
    const item = await PaxDeiItem.findOne({ itemId })
      .select("itemId name")
      .lean();

    if (!item) throw new Error("Objet Pax Dei introuvable.");

    return PaxDeiFactionCatalog.findOneAndUpdate(
      { factionId, itemId },
      {
        $set: {
          factionId,
          itemId,
          reason: "MANUAL",
          sourceId: "admin",
          enabled: true,
          syncedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
  }

  async removeManual(factionId: PaxDeiFactionId, itemId: string) {
    await PaxDeiFactionCatalog.deleteOne({
      factionId,
      itemId,
      reason: "MANUAL",
    });
  }

  async addManualExclusion(factionId: PaxDeiFactionId, itemId: string) {
    const item = await PaxDeiItem.findOne({ itemId })
      .select("itemId name")
      .lean();

    if (!item) throw new Error("Objet Pax Dei introuvable.");

    return PaxDeiFactionCatalog.findOneAndUpdate(
      { factionId, itemId },
      {
        $set: {
          factionId,
          itemId,
          reason: "MANUAL_EXCLUSION",
          sourceId: "admin",
          enabled: false,
          syncedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ).lean();
  }

  async removeManualExclusion(factionId: PaxDeiFactionId, itemId: string) {
    await PaxDeiFactionCatalog.deleteOne({
      factionId,
      itemId,
      reason: "MANUAL_EXCLUSION",
    });
  }

  async setEnabled(factionId: PaxDeiFactionId, itemId: string, enabled: boolean) {
    const row = await PaxDeiFactionCatalog.findOneAndUpdate(
      { factionId, itemId },
      { $set: { enabled } },
      { returnDocument: "after" },
    ).lean();

    if (!row) throw new Error("Association de catalogue introuvable.");
    return row;
  }
}

export const paxDeiFactionCatalogRepository =
  new PaxDeiFactionCatalogRepository();
