import { PaxDeiFactionId } from "./paxdei.catalog.types";
import { paxDeiFactionCatalogRepository } from "./paxdei.faction-catalog.repository";

export class PaxDeiFactionCatalogService {
  async getAllowedItemIds(factionId: string) {
    if (!this.isFactionId(factionId)) return new Set<string>();
    return new Set(
      await paxDeiFactionCatalogRepository.findItemIds(factionId),
    );
  }

  async isAllowed(factionId: string, itemId: string) {
    if (!this.isFactionId(factionId)) return false;
    return paxDeiFactionCatalogRepository.isAllowed(factionId, itemId);
  }

  async listFaction(factionId: string) {
    this.assertFactionId(factionId);
    return paxDeiFactionCatalogRepository.listFaction(factionId);
  }

  async addManual(factionId: string, itemId: string) {
    this.assertFactionId(factionId);
    return paxDeiFactionCatalogRepository.addManual(factionId, itemId);
  }

  async removeManual(factionId: string, itemId: string) {
    this.assertFactionId(factionId);
    await paxDeiFactionCatalogRepository.removeManual(factionId, itemId);
  }

  async addManualExclusion(factionId: string, itemId: string) {
    this.assertFactionId(factionId);
    return paxDeiFactionCatalogRepository.addManualExclusion(factionId, itemId);
  }

  async removeManualExclusion(factionId: string, itemId: string) {
    this.assertFactionId(factionId);
    await paxDeiFactionCatalogRepository.removeManualExclusion(factionId, itemId);
  }

  async setEnabled(factionId: string, itemId: string, enabled: boolean) {
    this.assertFactionId(factionId);
    return paxDeiFactionCatalogRepository.setEnabled(factionId, itemId, enabled);
  }

  private assertFactionId(value: string): asserts value is PaxDeiFactionId {
    if (!this.isFactionId(value)) throw new Error("Faction Pax Dei invalide.");
  }

  private isFactionId(value: string): value is PaxDeiFactionId {
    return (
      value === "domaine-du-chene" ||
      value === "guilde-des-artisans" ||
      value === "confrerie-de-lepee"
    );
  }
}

export const paxDeiFactionCatalogService =
  new PaxDeiFactionCatalogService();
