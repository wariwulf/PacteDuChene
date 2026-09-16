import { UserRole } from "../../common/constants/roles";
import type { AuthenticatedUser } from "../auth/auth.types";
import { User } from "../users/user.model";
import { paxDeiItemsService } from "../paxdei/paxdei.items.service";
import { factionsRepository, ordersRepository } from "./factions.repository";
import type { CreateOrderInput, FactionConfigData, FactionId, OrderStatus, OrderItemSnapshot } from "./factions.types";

const DEFAULT_FACTIONS: FactionConfigData[] = [
  { factionId: "domaine-du-chene", name: "Domaine du Chêne", shortName: "Domaine", description: "Récolte, ressources et approvisionnement du Pacte.", icon: "🌳", leaderRoleId: "1523341164558946335", memberRoleIds: ["1485572407241736314", "1484103440551379035", "1484103523476967505"], orderChannelId: "1549033248535879720", enabled: true },
  { factionId: "guilde-des-artisans", name: "Guilde des Artisans", shortName: "Artisans", description: "Fabrication, équipement et métiers d'artisanat.", icon: "⚒️", leaderRoleId: "1543357652933804062", memberRoleIds: ["1484103689432989807", "1485568618581201007", "1482371845599662150"], orderChannelId: "1549033519433515099", enabled: true },
  { factionId: "confrerie-de-lepee", name: "Confrérie de l'Épée", shortName: "Confrérie", description: "Combat, chasse et récupération sur les ennemis.", icon: "⚔️", leaderRoleId: "1543358103347531886", memberRoleIds: ["1484103360813727857", "1485569219469906021", "1484103284871528588"], orderChannelId: "1549033666041217114", enabled: true },
];

async function discordRoleIds(discordId?: string): Promise<string[]> {
  const guildId = process.env.DISCORD_GUILD_ID?.trim();
  const token = process.env.DISCORD_BOT_TOKEN?.trim();
  if (!guildId || !token || !discordId) return [];
  try {
    const response = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`, { headers: { Authorization: `Bot ${token}` }, cache: "no-store" });
    if (!response.ok) return [];
    const body = await response.json() as { roles?: unknown };
    return Array.isArray(body.roles) ? body.roles.filter((id): id is string => typeof id === "string") : [];
  } catch { return []; }
}

function isGlobalAdmin(user: AuthenticatedUser) { return user.role === UserRole.OWNER || user.role === UserRole.ADMIN; }

export class FactionsService {
  async ensureDefaults() {
    for (const faction of DEFAULT_FACTIONS) await factionsRepository.upsert(faction);
  }

  async list() { await this.ensureDefaults(); return factionsRepository.findAll(); }
  async get(factionId: string) { await this.ensureDefaults(); const faction = await factionsRepository.findById(factionId); if (!faction) throw new Error("Faction introuvable."); return faction; }

  async getMembership(userId: string) {
    await this.ensureDefaults();
    const user = await User.findById(userId).select("discord role profile").lean();
    if (!user) throw new Error("Membre introuvable.");
    const roles = await discordRoleIds(user.discord?.discordId);
    const factions = await factionsRepository.findAll();
    return factions.map((faction) => ({
      factionId: faction.factionId,
      member: isGlobalAdmin(user as any) || faction.memberRoleIds.some((id) => roles.includes(id)) || roles.includes(faction.leaderRoleId),
      leader: isGlobalAdmin(user as any) || roles.includes(faction.leaderRoleId),
    }));
  }

  async canView(user: AuthenticatedUser, factionId: string) {
    if (isGlobalAdmin(user)) return true;
    const faction = await this.get(factionId);
    if (user.factionRoleId === faction.leaderRoleId) return true;
    const userDoc = await User.findById(user.id).select("discord").lean();
    const roles = await discordRoleIds(userDoc?.discord?.discordId);
    return faction.memberRoleIds.some((id) => roles.includes(id)) || roles.includes(faction.leaderRoleId);
  }

  async canManage(user: AuthenticatedUser, factionId: string) {
    if (isGlobalAdmin(user)) return true;
    const faction = await this.get(factionId);
    if (user.factionRoleId === faction.leaderRoleId) return true;
    const userDoc = await User.findById(user.id).select("discord").lean();
    const roles = await discordRoleIds(userDoc?.discord?.discordId);
    return roles.includes(faction.leaderRoleId);
  }

  async createOrder(user: AuthenticatedUser, factionId: string, input: CreateOrderInput) {
    const faction = await this.get(factionId);
    if (!faction.enabled) throw new Error("Cette faction est désactivée.");
    if (!Array.isArray(input.items) || input.items.length === 0) throw new Error("Ajoutez au moins un élément à la commande.");

    const items: OrderItemSnapshot[] = [];
    for (const raw of input.items.slice(0, 20)) {
      const quantity = Math.min(Math.max(Number(raw.quantity) || 0, 1), 99999);
      if (!raw.itemId || !raw.name || !Number.isFinite(quantity)) continue;
      let item = raw;
      if (raw.kind === "PAXDEI_ITEM") {
        try {
          const catalog = await paxDeiItemsService.get(raw.itemId);
          item = { ...raw, itemId: catalog.itemId, name: catalog.name, imageUrl: catalog.imageUrl, externalUrl: catalog.externalUrl, kind: "PAXDEI_ITEM" };
        } catch { /* snapshot fourni par le client conservé si le catalogue est temporairement indisponible */ }
      }
      items.push({ ...item, quantity });
    }
    if (!items.length) throw new Error("Aucun élément valide dans la commande.");

    const source = input.kind === "CLAN" ? "CLAN" : "MEMBER";
    if (source === "CLAN" && !isGlobalAdmin(user)) throw new Error("Seul le propriétaire peut créer une commande de clan.");

    const orderId = `CMD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    return ordersRepository.create({
      orderId, factionId: faction.factionId as FactionId, requesterId: user.id, source,
      kind: input.kind ?? (factionId === "domaine-du-chene" ? "RESOURCE" : factionId === "guilde-des-artisans" ? "CRAFT" : "LOOT"),
      visibility: input.visibility ?? "PUBLIC", status: "PENDING", title: (input.title?.trim() || items.map((i) => `${i.quantity} × ${i.name}`).join(", ")).slice(0, 160),
      message: input.message?.trim(), items, recipeIngredients: input.recipeIngredients ?? [],
    });
  }

  async listOrders(user: AuthenticatedUser, factionId: FactionId) {
    if (!(await this.canView(user, factionId))) throw new Error("Accès interdit.");
    const orders = await ordersRepository.findForFaction(factionId);
    if (isGlobalAdmin(user) || await this.canManage(user, factionId)) return orders;
    return orders.filter((order) => order.visibility === "PUBLIC" || order.requesterId === user.id);
  }

  async listMine(user: AuthenticatedUser) { return ordersRepository.findForRequester(user.id); }

  async getOrder(user: AuthenticatedUser, orderId: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new Error("Commande introuvable.");
    const allowed = order.requesterId === user.id || await this.canView(user, order.factionId) && (order.visibility === "PUBLIC" || await this.canManage(user, order.factionId));
    if (!allowed) throw new Error("Vous ne pouvez pas consulter cette commande.");
    return order;
  }

  async updateStatus(user: AuthenticatedUser, orderId: string, status: OrderStatus, message?: string) {
    const order = await ordersRepository.findById(orderId);
    if (!order) throw new Error("Commande introuvable.");
    if (!(await this.canManage(user, order.factionId)) && !(isGlobalAdmin(user))) throw new Error("Seul le chef de faction peut gérer cette commande.");
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ["ACCEPTED", "REFUSED", "CANCELLED"], ACCEPTED: ["IN_PROGRESS", "REFUSED", "CANCELLED"], IN_PROGRESS: ["READY", "CANCELLED"], READY: ["COMPLETED", "IN_PROGRESS"], COMPLETED: [], REFUSED: [], CANCELLED: [],
    };
    if (status !== order.status && !allowedTransitions[order.status].includes(status)) throw new Error(`Transition ${order.status} → ${status} impossible.`);
    return ordersRepository.updateStatus(orderId, status, message);
  }

  async attachDiscord(orderId: string, threadId: string, messageId: string) { return ordersRepository.attachDiscord(orderId, threadId, messageId); }
  async archiveForBot(orderId: string) { return ordersRepository.markArchived(orderId); }
  async internalActiveOrdersForBot() {
    const { Order } = await import("./factions.model");
    return Order.find({
      discordThreadId: { $exists: true, $ne: "" },
      archivedAt: { $exists: false },
      status: { $nin: ["REFUSED", "CANCELLED"] },
    }).sort({ updatedAt: -1 }).limit(100).lean();
  }

  async internalOrdersForBot() {
    const orders = (await OrderModelForBot()).filter((o) => !o.discordThreadId);
    const users = await User.find({ _id: { $in: orders.map((o) => o.requesterId) } }).select("_id profile discord").lean();
    const byId = new Map(users.map((u) => [String(u._id), u]));
    return orders.map((order) => {
      const user = byId.get(order.requesterId);
      return {
        ...order,
        requester: user ? { id: String(user._id), username: user.profile?.username, displayName: user.profile?.displayName, discordId: user.discord?.discordId, discordUsername: user.discord?.username } : undefined,
      };
    });
  }
  async updateFaction(user: AuthenticatedUser, factionId: string, data: Partial<FactionConfigData>) {
    if (user.role !== UserRole.OWNER) throw new Error("Seul le propriétaire peut modifier la configuration des factions.");
    const allowed: Partial<FactionConfigData> = {};
    for (const key of ["name", "shortName", "description", "icon", "leaderRoleId", "memberRoleIds", "orderChannelId", "enabled"] as const) if (data[key] !== undefined) (allowed as any)[key] = data[key];
    return factionsRepository.update(factionId, allowed);
  }
}

async function OrderModelForBot() {
  const { Order } = await import("./factions.model");
  return Order.find({ discordThreadId: { $exists: false }, status: { $nin: ["CANCELLED", "REFUSED"] } }).sort({ createdAt: 1 }).limit(50).lean();
}

export const factionsService = new FactionsService();
