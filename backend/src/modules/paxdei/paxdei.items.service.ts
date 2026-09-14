import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { paxDeiItemsRepository } from "./paxdei.items.repository";
import {
  PaxDeiItemData,
  PaxDeiItemLocalizedNames,
  PaxDeiItemSearchParams,
} from "./paxdei.items.types";

const GAMING_TOOLS_ITEMS_URL =
  "https://data-cdn.gaming.tools/paxdei/market/items.json";
const GAMING_TOOLS_BASE_URL = "https://paxdei.gaming.tools";
const SYNC_MAX_AGE_MS = 60 * 60 * 1000;
const DETAIL_CACHE_MAX_AGE_MS = 60 * 60 * 1000;
const execFileAsync = promisify(execFile);
const CURL_MAX_BUFFER = 12 * 1024 * 1024;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function localized(value: unknown): PaxDeiItemLocalizedNames {
  if (!value || typeof value !== "object") return {};

  const source = value as Record<string, unknown>;
  const result: PaxDeiItemLocalizedNames = {};

  for (const [key, raw] of Object.entries(source)) {
    const value = text(raw);
    if (!value) continue;

    const normalizedKey = key.trim().toLowerCase().split(/[-_]/)[0];
    if (normalizedKey) result[normalizedKey] = value;
    if (normalizedKey !== key) result[key] = value;
  }

  return result;
}

function pickNames(raw: Record<string, unknown>): PaxDeiItemLocalizedNames {
  const candidates = [
    raw.name,
    raw.names,
    raw.localized_names,
    raw.localizedNames,
    raw.name_localized,
  ];

  for (const candidate of candidates) {
    const value = localized(candidate);
    if (Object.keys(value).length) return value;
  }

  const result: PaxDeiItemLocalizedNames = {};
  for (const lang of ["en", "fr", "de", "es", "pl"]) {
    const value =
      text(raw[`name_${lang}`]) || text(raw[`name${lang.toUpperCase()}`]);
    if (value) result[lang] = value;
  }

  return result;
}

function pickName(raw: Record<string, unknown>, names: PaxDeiItemLocalizedNames): string {
  return (
    names.fr ||
    names.en ||
    text(raw.display_name) ||
    text(raw.displayName) ||
    Object.values(names).find(Boolean) ||
    "Objet Pax Dei"
  );
}

function pickImage(raw: Record<string, unknown>): string {
  const imageUrl = [
    text(raw.iconPath),
    text(raw.icon_path),
    text(raw.icon_url),
    text(raw.iconUrl),
    text(raw.image_url),
    text(raw.imageUrl),
    text(raw.icon),
  ].find(Boolean) || "";

  if (imageUrl.startsWith("https://gtcdn.info/")) {
    return imageUrl.replace(
      "https://gtcdn.info/",
      "https://cdn-hosted.gaming.tools/",
    );
  }

  return imageUrl;
}

function categoryForItemId(itemId: string): string {
  if (/^item_(raw_)?material_/i.test(itemId)) return "materials";
  if (/^item_(weapon|wieldable)_/i.test(itemId)) return "weapons";
  if (/^item_(armor|wearable)_/i.test(itemId)) return "armor";
  if (/^item_tool_/i.test(itemId)) return "tools";
  if (/^item_food_/i.test(itemId)) return "food";
  if (/^item_consumable_/i.test(itemId)) return "consumables";
  return "items";
}

function externalUrlForItem(itemId: string): string {
  return `${GAMING_TOOLS_BASE_URL}/fr/${categoryForItemId(itemId)}/${encodeURIComponent(itemId)}`;
}

function normalizeExternalItem(itemId: string, rawValue: unknown): PaxDeiItemData {
  const raw =
    rawValue && typeof rawValue === "object"
      ? (rawValue as Record<string, unknown>)
      : {};

  const normalizedItemId = String(itemId).trim();
  const names = pickNames(raw);

  return {
    itemId: normalizedItemId,
    name: pickName(raw, names),
    names,
    imageUrl: pickImage(raw),
    externalUrl: externalUrlForItem(normalizedItemId),
    source: "gaming.tools",
    syncedAt: new Date(),
    metadata: raw,
  };
}

async function fetchExternalItems(): Promise<PaxDeiItemData[]> {
  const response = await fetch(GAMING_TOOLS_ITEMS_URL, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Gaming.Tools a répondu HTTP ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Réponse items.json de Gaming.Tools invalide.");
  }

  return Object.entries(payload as Record<string, unknown>)
    .map(([itemId, raw]) => normalizeExternalItem(itemId, raw))
    .filter((item) => item.itemId && item.name);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, rawCode: string) => {
      const code = rawCode.toLowerCase().startsWith("x")
        ? Number.parseInt(rawCode.slice(1), 16)
        : Number.parseInt(rawCode, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
}

function metaContent(html: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `<meta[^>]+property=["']${escaped}["'][^>]+content=["']([\\s\\S]*?)["'][^>]*>`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([\\s\\S]*?)["'][^>]+property=["']${escaped}["'][^>]*>`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1].trim());
  }

  return "";
}

function parseDetailDescription(value: string): string {
  const normalized = value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();

  return normalized
    .split(/\n?\s*(?:Palier|Tier)\s*:\s*\d+/i)[0]
    .trim();
}

function parseTier(value: string): number | undefined {
  const match = value.match(/(?:Palier|Tier)\s*:\s*([1-5])/i);
  if (!match) return undefined;

  const tier = Number(match[1]);
  return tier >= 1 && tier <= 5 ? tier : undefined;
}

async function fetchItemHtmlWithCurl(url: string, itemId: string): Promise<string> {
  const command = process.platform === "win32" ? "curl.exe" : "curl";
  const args = [
    "-L",
    "-sS",
    "--compressed",
    "-A",
    "PacteDuChene/1.0",
    "-H",
    "Accept: text/html,application/xhtml+xml",
    "-H",
    "Accept-Language: fr-FR,fr;q=0.9,en;q=0.8",
    "--max-time",
    "20",
    "-w",
    "\n__PACTE_HTTP_STATUS__:%{http_code}",
    url,
  ];

  try {
    const { stdout } = await execFileAsync(command, args, {
      maxBuffer: CURL_MAX_BUFFER,
      windowsHide: true,
    });

    const marker = "__PACTE_HTTP_STATUS__:";
    const markerIndex = stdout.lastIndexOf(marker);
    if (markerIndex < 0) {
      throw new Error(`Réponse curl invalide pour ${itemId}.`);
    }

    const statusText = stdout.slice(markerIndex + marker.length).trim();
    const status = Number.parseInt(statusText, 10);
    const html = stdout.slice(0, markerIndex).trim();

    if (!Number.isFinite(status) || status < 200 || status >= 300) {
      throw new Error(`Gaming.Tools a répondu HTTP ${status || "inconnu"} pour ${itemId}.`);
    }

    if (!html) {
      throw new Error(`Gaming.Tools a renvoyé une page vide pour ${itemId}.`);
    }

    return html;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Impossible de récupérer Gaming.Tools via curl pour ${itemId}: ${message}`);
  }
}

async function fetchItemDetails(itemId: string) {
  const url = externalUrlForItem(itemId);
  let html = "";

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "PacteDuChene/1.0",
      },
      signal: AbortSignal.timeout(20_000),
    });

    if (response.ok) {
      html = await response.text();
    } else if (response.status === 403) {
      console.warn(`[PaxDei] Gaming.Tools refuse fetch() (403) pour ${itemId}; tentative via curl.`);
      html = await fetchItemHtmlWithCurl(url, itemId);
    } else {
      throw new Error(`Gaming.Tools a répondu HTTP ${response.status} pour ${itemId}.`);
    }
  } catch (error) {
    const status = error instanceof Error ? error.message : String(error);
    if (/HTTP 403/.test(status)) {
      html = await fetchItemHtmlWithCurl(url, itemId);
    } else if (!html) {
      throw error;
    }
  }

  const title = metaContent(html, "og:title");
  const ogDescription = metaContent(html, "og:description");
  const ogImage = metaContent(html, "og:image");
  const ogUrl = metaContent(html, "og:url");

  const metadata: Record<string, unknown> = {};
  const description = parseDetailDescription(ogDescription);
  const tier = parseTier(ogDescription);

  if (description) metadata.description = description;
  if (tier !== undefined) metadata.tier = tier;
  if (ogImage) metadata.detailImageUrl = ogImage;
  if (ogUrl) metadata.detailUrl = ogUrl;

  const cleanTitle = title
    .replace(/^Pax Dei Forge:\s*/i, "")
    .trim();

  return {
    name: cleanTitle,
    description,
    tier,
    imageUrl: ogImage,
    externalUrl: ogUrl || url,
    metadata,
  };
}

export class PaxDeiItemsService {
  private syncing: Promise<number> | null = null;

  private async ensureFreshCatalog() {
    const latest = await paxDeiItemsRepository.latestSync();
    if (latest && Date.now() - latest.getTime() < SYNC_MAX_AGE_MS) return;
    await this.syncCatalog();
  }

  async search(params: PaxDeiItemSearchParams = {}) {
    await this.ensureFreshCatalog();
    return paxDeiItemsRepository.search(
      params.q ?? "",
      params.lang ?? "fr",
      params.limit ?? 25,
    );
  }

  async get(itemId: string) {
    await this.ensureFreshCatalog();

    const item = await paxDeiItemsRepository.findById(itemId);
    if (!item) throw new Error("Objet Pax Dei introuvable.");

    const metadata =
      item.metadata && typeof item.metadata === "object"
        ? (item.metadata as Record<string, unknown>)
        : {};

    const cachedAt = metadata.detailSyncedAt;
    const hasFreshDetails =
      typeof cachedAt === "string" &&
      Date.now() - new Date(cachedAt).getTime() < DETAIL_CACHE_MAX_AGE_MS &&
      (typeof metadata.description === "string" || typeof metadata.tier === "number");

    if (hasFreshDetails) return item;

    try {
      const detail = await fetchItemDetails(item.itemId);
      const mergedMetadata = {
        ...metadata,
        ...detail.metadata,
        detailSyncedAt: new Date().toISOString(),
      };

      await paxDeiItemsRepository.upsertMany([
        {
          itemId: item.itemId,
          name: detail.name || item.name,
          names: item.names,
          imageUrl: detail.imageUrl || item.imageUrl,
          externalUrl: detail.externalUrl || item.externalUrl,
          source: "gaming.tools",
          syncedAt: item.syncedAt,
          metadata: mergedMetadata,
        },
      ]);

      return {
        ...item,
        name: detail.name || item.name,
        imageUrl: detail.imageUrl || item.imageUrl,
        externalUrl: detail.externalUrl || item.externalUrl,
        metadata: mergedMetadata,
      };
    } catch (error) {
      console.warn(`[PaxDei] Impossible de récupérer les détails de ${item.itemId}:`, error);
      return item;
    }
  }

  async syncCatalog() {
    if (this.syncing) return this.syncing;

    this.syncing = (async () => {
      const items = await fetchExternalItems();
      await paxDeiItemsRepository.upsertMany(items);
      return items.length;
    })().finally(() => {
      this.syncing = null;
    });

    return this.syncing;
  }

  async findExisting(itemId: string) {
    return paxDeiItemsRepository.findById(itemId);
  }
}

export const paxDeiItemsService = new PaxDeiItemsService();
