import type { Response } from "express";
import type { AuthenticatedRequest } from "../../middleware/auth.middleware";
import { factionsService } from "./factions.service";
import type { CreateOrderInput, FactionConfigData, OrderStatus } from "./factions.types";

const param = (req: AuthenticatedRequest, name: string) => String(req.params[name] ?? "").trim();
const fail = (res: Response, error: unknown, status = 400) => res.status(status).json({ success: false, message: error instanceof Error ? error.message : "Erreur." });

export async function listFactions(_req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { factions: await factionsService.list() } }); } catch (e) { return fail(res, e, 500); } }
export async function getFaction(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { faction: await factionsService.get(param(req, "factionId")) } }); } catch (e) { return fail(res, e, 404); } }
export async function membership(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { factions: await factionsService.getMembership(req.user!.id) } }); } catch (e) { return fail(res, e, 400); } }
export async function listOrders(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { orders: await factionsService.listOrders(req.user!, param(req, "factionId") as any) } }); } catch (e) { return fail(res, e, 403); } }
export async function createOrder(req: AuthenticatedRequest, res: Response) { try { return res.status(201).json({ success: true, data: { order: await factionsService.createOrder(req.user!, param(req, "factionId"), (req.body ?? {}) as CreateOrderInput) } }); } catch (e) { return fail(res, e, 400); } }
export async function listMine(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { orders: await factionsService.listMine(req.user!) } }); } catch (e) { return fail(res, e, 400); } }
export async function getOrder(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { order: await factionsService.getOrder(req.user!, param(req, "orderId")) } }); } catch (e) { return fail(res, e, 403); } }
export async function updateStatus(req: AuthenticatedRequest, res: Response) { try { const status = String(req.body?.status ?? "") as OrderStatus; return res.json({ success: true, data: { order: await factionsService.updateStatus(req.user!, param(req, "orderId"), status, req.body?.message ? String(req.body.message) : undefined) } }); } catch (e) { return fail(res, e, 403); } }
export async function updateFaction(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { faction: await factionsService.updateFaction(req.user!, param(req, "factionId"), (req.body ?? {}) as Partial<FactionConfigData>) } }); } catch (e) { return fail(res, e, 403); } }
export async function botPendingOrders(_req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { orders: await factionsService.internalOrdersForBot() } }); } catch (e) { return fail(res, e, 500); } }
export async function botActiveOrders(_req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { orders: await factionsService.internalActiveOrdersForBot() } }); } catch (e) { return fail(res, e, 500); } }
export async function botAttachDiscord(req: AuthenticatedRequest, res: Response) { try { const orderId = param(req, "orderId"); const threadId = String(req.body?.threadId ?? ""); const messageId = String(req.body?.messageId ?? ""); if (!threadId || !messageId) return fail(res, new Error("threadId et messageId sont requis.")); return res.json({ success: true, data: { order: await factionsService.attachDiscord(orderId, threadId, messageId) } }); } catch (e) { return fail(res, e, 400); } }
export async function botArchiveOrder(req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { order: await factionsService.archiveForBot(param(req, "orderId")) } }); } catch (e) { return fail(res, e, 400); } }
export async function botFactions(_req: AuthenticatedRequest, res: Response) { try { return res.json({ success: true, data: { factions: await factionsService.list() } }); } catch (e) { return fail(res, e, 500); } }
