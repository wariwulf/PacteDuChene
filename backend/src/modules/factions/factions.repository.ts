import { Faction, Order } from "./factions.model";
import type { FactionId, FactionConfigData, OrderDocumentData, OrderStatus } from "./factions.types";

export class FactionsRepository {
  async findAll() { return Faction.find({ enabled: true } as any).sort({ name: 1 }).lean(); }
  async findById(factionId: string) { return Faction.findOne({ factionId } as any).lean(); }
  async upsert(config: FactionConfigData) { return Faction.findOneAndUpdate({ factionId: config.factionId } as any, { $set: config }, { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }).lean(); }
  async update(factionId: string, data: Partial<FactionConfigData>) { return Faction.findOneAndUpdate({ factionId } as any, { $set: data }, { returnDocument: "after" }).lean(); }
}

export class OrdersRepository {
  async create(data: OrderDocumentData) { return Order.create(data); }
  async findById(orderId: string) { return Order.findOne({ orderId }).lean(); }
  async findForFaction(factionId: FactionId) { return Order.find({ factionId }).sort({ createdAt: -1 }).lean(); }
  async findVisibleForMember(factionIds: FactionId[], memberId: string) {
    return Order.find({ factionId: { $in: factionIds }, $or: [{ visibility: "PUBLIC" }, { requesterId: memberId }] }).sort({ createdAt: -1 }).lean();
  }
  async findForRequester(requesterId: string) { return Order.find({ requesterId }).sort({ createdAt: -1 }).lean(); }
  async updateStatus(orderId: string, status: OrderStatus, statusMessage?: string) {
    return Order.findOneAndUpdate(
      { orderId },
      {
        $set: {
          status,
          statusMessage,
          ...(status === "COMPLETED"
            ? { completedAt: new Date(), deliveredAt: new Date() }
            : {}),
        },
      },
      { returnDocument: "after" },
    ).lean();
  }

  async markArchived(orderId: string) {
    return Order.findOneAndUpdate(
      { orderId },
      { $set: { archivedAt: new Date() } },
      { returnDocument: "after" },
    ).lean();
  }
  async attachDiscord(orderId: string, discordThreadId: string, discordMessageId: string) {
    return Order.findOneAndUpdate({ orderId }, { $set: { discordThreadId, discordMessageId } }, { returnDocument: "after" }).lean();
  }
}

export const factionsRepository = new FactionsRepository();
export const ordersRepository = new OrdersRepository();
