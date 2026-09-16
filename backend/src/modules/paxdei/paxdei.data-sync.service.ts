import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { paxDeiItemsService } from "./paxdei.items.service";
import { paxDeiItemsRepository } from "./paxdei.items.repository";
import { paxDeiRecipeRepository } from "./paxdei.recipe.repository";
import { paxDeiResourceRepository } from "./paxdei.resource.repository";
import { paxDeiFactionCatalogRepository } from "./paxdei.faction-catalog.repository";
import {
  PaxDeiFactionCatalogData,
  PaxDeiRecipeData,
  PaxDeiResourceData,
  PaxDeiResourceDrop,
  PaxDeiResourceType,
  PaxDeiSyncResult,
} from "./paxdei.catalog.types";

const execFileAsync = promisify(execFile);
const BASE = "https://paxdei.gaming.tools";
const UA = "PacteDuChene/1.0";
const PAGE_TIMEOUT_MS = 30_000;
const CONCURRENCY = 2;
const MAX_HTTP_RETRIES = 2;
const DEFAULT_RATE_LIMIT_DELAY_MS = 20_000;
const MAX_RATE_LIMIT_DELAY_MS = 60_000;
const MIN_REQUEST_GAP_MS = 750;

// Gaming.Tools peut répondre 429 lorsque plusieurs pages sont demandées
// rapidement. Le cooldown est partagé par toutes les requêtes afin d'éviter
// que plusieurs workers repartent simultanément après un 429.
let rateLimitUntil = 0;
let lastRequestAt = 0;
let requestGate: Promise<void> = Promise.resolve();

async function acquireRequestSlot(): Promise<void> {
  const previous = requestGate;
  let release!: () => void;
  requestGate = new Promise<void>((resolve) => {
    release = resolve;
  });

  await previous;
  try {
    const now = Date.now();
    const cooldown = Math.max(0, rateLimitUntil - now);
    const gap = Math.max(0, MIN_REQUEST_GAP_MS - (now - lastRequestAt));
    const wait = Math.max(cooldown, gap);
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
  } finally {
    release();
  }
}

function registerRateLimit(delayMs: number) {
  rateLimitUntil = Math.max(rateLimitUntil, Date.now() + delayMs);
}

const RESOURCE_LISTS: Array<{
  path: string;
  type: PaxDeiResourceType;
}> = [
  { path: "/fr/gatherables", type: "GATHERABLE" },
  { path: "/fr/mineables", type: "MINEABLE" },
  { path: "/fr/trees", type: "TREE" },
];

// Gaming.Tools limite actuellement le rendu HTML de certaines listes.
// Les catégories ci-dessous sont des index publics complémentaires.
// On les déduplique ensuite par recipeId.
const RECIPE_INDEX_PATHS = [
  "/fr/recipes",
  "/fr/recipes/alchemy",
  "/fr/recipes/blacksmithing",
  "/fr/recipes/weapon_smithing",
  "/fr/recipes/building",
  "/fr/recipes/leatherworking",
  "/fr/recipes/tailoring",
  "/fr/recipes/jewelcrafting",
  "/fr/recipes/cooking",
  "/fr/recipes/baking",
  "/fr/recipes/winery_and_brewing",
  "/fr/recipes/tab_group_builder",
  "/fr/recipes/tab_group_storage",
  "/fr/recipes/tab_group_cooking",
  "/fr/recipes/tab_group_tailoring",
  "/fr/recipes/tab_group_winery_and_brewing",
  "/fr/recipes/tab_group_lighting_and_decorations",
];

const SEARCH_PROBE_VALUES = ["a", "z"];
const SEARCH_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, raw: string) => {
      const code = raw.toLowerCase().startsWith("x")
        ? Number.parseInt(raw.slice(1), 16)
        : Number.parseInt(raw, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    });
}

function absoluteUrl(href: string) {
  if (/^https?:\/\//i.test(href)) return href;

  try {
    return new URL(href, `${BASE}/`).toString();
  } catch {
    return `${BASE}${href.startsWith("/") ? href : `/${href}`}`;
  }
}

function pathFromHref(href: string) {
  try {
    return new URL(absoluteUrl(href)).pathname;
  } catch {
    return href;
  }
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(url: string): Promise<string> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_HTTP_RETRIES; attempt += 1) {
    try {
      await acquireRequestSlot();

      const response = await fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": UA,
        },
        signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      });

      const html = await response.text();

      // Cloudflare peut répondre 200 ou 403 avec une page
      // "Just a moment..." au lieu de la vraie page Gaming.Tools.
      const looksLikeCloudflareChallenge =
        /<title>\s*Just a moment/i.test(html) ||
        /cf-chl-/i.test(html) ||
        /Cloudflare/i.test(html);

      if (response.ok && !looksLikeCloudflareChallenge) {
        return html;
      }

      if (response.status === 429) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1500 * (attempt + 1)),
        );
        continue;
      }

      if (
        response.status !== 403 &&
        !looksLikeCloudflareChallenge
      ) {
        throw new Error(`HTTP ${response.status} pour ${url}`);
      }

      lastError = new Error(
        `Gaming.Tools a renvoyé une protection Cloudflare pour ${url}`,
      );
    } catch (error) {
      lastError = error;

      if (
        !(error instanceof Error) ||
        !/403|fetch failed|ECONN|Cloudflare/i.test(error.message)
      ) {
        throw error;
      }
    }

    break;
  }

  // Gaming.Tools peut bloquer fetch() de Node avec Cloudflare.
  // curl.exe permet actuellement de récupérer la vraie page.
  const command = process.platform === "win32" ? "curl.exe" : "curl";

  const args = [
    "-L",
    "-A",
    UA,
    "-sS",
    "--max-time",
    String(Math.ceil(PAGE_TIMEOUT_MS / 1000)),
    url,
  ];

  try {
    const result = await execFileAsync(command, args, {
      maxBuffer: 35 * 1024 * 1024,
    });

    const html = result.stdout;

    if (!html || html.length < 10000) {
      throw new Error(
        `Réponse Gaming.Tools invalide ou trop courte pour ${url} (${html.length} caractères)`,
      );
    }

    if (
      /<title>\s*Just a moment/i.test(html) ||
      /cf-chl-/i.test(html)
    ) {
      throw new Error(
        `curl a également reçu une protection Cloudflare pour ${url}`,
      );
    }

    return html;
  } catch (error) {
    if (lastError instanceof Error) {
      throw new Error(
        `${lastError.message}. Fallback curl échoué pour ${url}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    throw error;
  }
}
function extractLinks(html: string): string[] {
  const out: string[] = [];
  const re = /(?:href|url|sourceUrl|canonicalUrl)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(re)) {
    out.push(decodeHtml(match[1]));
  }

  const normalized = html.replace(/\\\//g, "/");
  const jsonEscaped = normalized.match(/(?:https?:\/\/|\/fr\/)[^"'\s<>]+/gi) ?? [];
  out.push(...jsonEscaped);
  return unique(out);
}

function extractItemIds(html: string): string[] {
  const ids = new Set<string>();
  const linkRe = /(?:href|url|sourceUrl)=["']([^"']+)["']/gi;

  for (const match of html.matchAll(linkRe)) {
    const path = pathFromHref(decodeHtml(match[1]));
    const itemMatch = path.match(/^\/(?:fr\/)?(?:materials|items|consumables|weapons|armor|tools|food)\/(item_[^/?#]+)$/i);
    if (itemMatch) ids.add(itemMatch[1]);
  }

  for (const match of html.matchAll(/(?:\/fr\/(?:materials|items|consumables|weapons|armor|tools|food)\/)(item_[A-Za-z0-9_.-]+)/gi)) {
    ids.add(match[1]);
  }

  return [...ids];
}

function extractRecipeIds(html: string): string[] {
  const ids = new Set<string>();
  for (const href of extractLinks(html)) {
    const path = pathFromHref(href);
    const match = path.match(/^\/(?:fr\/)?recipes\/(recipe_[^/?#]+)$/i);
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

async function safeFetchHtml(url: string): Promise<string | null> {
  try {
    return await fetchHtml(url);
  } catch (error) {
    console.warn(`[PaxDei] Index ignoré (${url}):`, error instanceof Error ? error.message : error);
    return null;
  }
}

function addRecipeIdsFromHtml(target: Set<string>, html: string | null) {
  if (!html) return;
  for (const id of extractRecipeIds(html)) target.add(id);
}

async function discoverRecipeIdsFromIndex(path: string): Promise<string[]> {
  const ids = new Set<string>();
  const baseHtml = await safeFetchHtml(`${BASE}${path}`);
  addRecipeIdsFromHtml(ids, baseHtml);
  if (!baseHtml) return [...ids];

  // Certaines pages utilisent une recherche serveur, d'autres une recherche
  // purement cliente. On teste d'abord deux valeurs pour éviter 26 requêtes
  // inutiles si le paramètre est ignoré.
  let serverSearch = false;
  for (const value of SEARCH_PROBE_VALUES) {
    const html = await safeFetchHtml(`${BASE}${path}?search=${encodeURIComponent(value)}`);
    const found = new Set(extractRecipeIds(html ?? ""));
    if (found.size && (found.size !== ids.size || [...found].some((id) => !ids.has(id)))) {
      serverSearch = true;
      addRecipeIdsFromHtml(ids, html);
    }
  }

  if (!serverSearch) return [...ids];

  for (const letter of SEARCH_LETTERS) {
    const html = await safeFetchHtml(`${BASE}${path}?search=${encodeURIComponent(letter)}`);
    addRecipeIdsFromHtml(ids, html);
  }

  return [...ids];
}

async function discoverAllRecipeIds(): Promise<string[]> {
  const ids = new Set<string>();
  for (const path of RECIPE_INDEX_PATHS) {
    for (const id of await discoverRecipeIdsFromIndex(path)) ids.add(id);
  }
  return [...ids];
}

function extractResourceLinks(html: string, type: PaxDeiResourceType): string[] {
  const ids = new Set<string>();
  const expected = type === "TREE" ? "treetype_" : "resource_static_";

  for (const href of extractLinks(html)) {
    const path = pathFromHref(href);
    const match = path.match(new RegExp(`^/(?:fr/)?${type === "GATHERABLE" ? "gatherables" : type === "MINEABLE" ? "mineables" : "trees"}/(${expected}[^/?#]+)$`, "i"));
    if (match) ids.add(match[1]);
  }
  return [...ids];
}

function parsePageTitle(html: string) {
  const match = html.match(
    /<meta[^>]+(?:property|name)=["']og:title["'][^>]+content=["']([^"']*)["']/i,
  ) || html.match(
    /<title[^>]*>([\s\S]*?)<\/title>/i,
  );
  return match ? decodeHtml(match[1]).replace(/^Pax Dei Forge:\s*/i, "").trim() : "";
}

function parseNumber(value: string | undefined, fallback = 1) {
  if (!value) return fallback;
  const match = value.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  const n = match ? Number(match[0]) : fallback;
  return Number.isFinite(n) ? n : fallback;
}

function extractRecipeItemEntries(html: string): Array<{
  itemId: string;
  name: string;
  quantity: number;
}> {
  const normalized = html.replace(/\\\//g, "/");

  const entries: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }> = [];

  // Gaming.Tools présente les ingrédients sous forme de lignes <tr>.
  // Chaque ligne contient :
  //   <td> ... lien vers l'item ... </td>
  //   <td> quantité </td>
  const rowRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;

  for (const rowMatch of normalized.matchAll(rowRe)) {
    const row = rowMatch[1];

    const cellMatches = [
      ...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi),
    ];

    if (cellMatches.length < 2) continue;

    const firstCell = cellMatches[0][1];
    const secondCell = cellMatches[1][1];

    const linkMatch = firstCell.match(
      /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i,
    );

    if (!linkMatch) continue;

    const href = decodeHtml(linkMatch[1]);
    const path = pathFromHref(href);

    const itemMatch = path.match(
      /^\/(?:fr\/)?(?:materials|items|consumables|weapons|armor|tools|food)\/(item_[^/?#]+)$/i,
    );

    if (!itemMatch) continue;

    const itemId = itemMatch[1];

    const name = decodeHtml(
      linkMatch[2]
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^Image:\s*/i, ""),
    ).trim();

    const quantityText = secondCell
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const quantityMatch = quantityText.match(
      /(\d+(?:[.,]\d+)?)/
    );

    const quantity = quantityMatch
      ? parseNumber(quantityMatch[1], 1)
      : 1;

    entries.push({
      itemId,
      name: name || itemId,
      quantity,
    });
  }

  return entries;
}

function lastMarkerIndex(html: string, markers: string[]) {
  const lower = html.toLowerCase();
  return Math.max(...markers.map((marker) => lower.lastIndexOf(marker.toLowerCase())));
}

function parseRecipe(html: string, recipeId: string): PaxDeiRecipeData {
  const name = parsePageTitle(html) || recipeId.replace(/^recipe_/, "");
  const sourceUrl = `${BASE}/fr/recipes/${recipeId}`;

  // Use the last visible occurrence. The HTML also contains serialized
  // application data where "creates"/"requirements" can occur earlier.
  const createsIndex = lastMarkerIndex(html, ["creates", "crée"]);
  const createsWindow =
    createsIndex >= 0
      ? html.slice(createsIndex, createsIndex + 5000)
      : html.slice(0, 12000);

  const resultEntries = extractRecipeItemEntries(createsWindow);
  const resultItemId = resultEntries[0]?.itemId;
  const createsMatch = createsWindow.match(
    /(?:Creates|Crée)[\s\S]{0,1500}?(?:>|\s)(\d+)\s*x/i,
  );

  const requirementsIndex = lastMarkerIndex(html, ["requirements"]);
  let requirementWindow = html;

  if (requirementsIndex >= 0) {
    const afterRequirements = html.slice(requirementsIndex);
    const endIndex = lastMarkerIndex(afterRequirements, [
      "crafted at",
      "fabriqué à",
      "unlocked by",
      "débloqué par",
      "required skill",
      "compétence requise",
    ]);

    requirementWindow =
      endIndex > 0
        ? afterRequirements.slice(0, endIndex)
        : afterRequirements.slice(0, 8000);
  }

  const ingredientEntries = extractRecipeItemEntries(requirementWindow).filter(
    (entry) => entry.itemId !== resultItemId,
  );

  const ingredients = ingredientEntries.map((entry) => ({
    itemId: entry.itemId,
    name: entry.name,
    quantity: entry.quantity,
  }));

  const skillMatch = html.match(
    /(?:Required Skill|Compétence requise)[\s\S]{0,500}?(?:>|:)\s*([^<\n]{2,80})/i,
  );

  return {
    recipeId,
    name,
    sourceUrl,
    resultItemId,
    resultQuantity: createsMatch ? parseNumber(createsMatch[1], 1) : 1,
    ingredients,
    skill: skillMatch ? decodeHtml(skillMatch[1]).trim() : undefined,
    metadata: {
      sourceParser: "gaming.tools-html",
      sourceLinks: resultEntries.map((entry) => entry.itemId),
    },
    syncedAt: new Date(),
  };
}

function parseResource(
  html: string,
  resourceId: string,
  type: PaxDeiResourceType,
): PaxDeiResourceData {
  const name = parsePageTitle(html) || resourceId;
  const itemIds = extractItemIds(html);
  const drops: PaxDeiResourceDrop[] = unique(itemIds).map((itemId) => ({
    itemId,
    name: itemId,
  }));

  return {
    resourceId,
    name,
    type,
    sourceUrl: `${BASE}/fr/${type === "GATHERABLE" ? "gatherables" : type === "MINEABLE" ? "mineables" : "trees"}/${resourceId}`,
    drops,
    metadata: {
      sourceParser: "gaming.tools-html",
    },
    syncedAt: new Date(),
  };
}

async function mapConcurrent<T, R>(
  values: T[],
  worker: (value: T) => Promise<R>,
  concurrency = CONCURRENCY,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;

  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= values.length) return;
      try {
        results[index] = await worker(values[index]);
      } catch {
        // Une page individuelle inaccessible ne doit pas faire échouer toute la synchronisation.
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => run()),
  );

  return results.filter(Boolean);
}

export class PaxDeiDataSyncService {
  private syncing: Promise<PaxDeiSyncResult> | null = null;

  async syncFull(): Promise<PaxDeiSyncResult> {
    if (this.syncing) return this.syncing;

    this.syncing = this.runFullSync().finally(() => {
      this.syncing = null;
    });

    return this.syncing;
  }

  private async runFullSync(): Promise<PaxDeiSyncResult> {
    const started = Date.now();

    const items = await paxDeiItemsService.syncCatalog();

    const recipeIds = await discoverAllRecipeIds();
    console.log(`[PaxDei] Recettes découvertes dans les index publics : ${recipeIds.length}`);
    const recipes = await mapConcurrent(recipeIds, async (recipeId) => {
      const html = await fetchHtml(`${BASE}/fr/recipes/${recipeId}`);
      return parseRecipe(html, recipeId);
    });
    await paxDeiRecipeRepository.upsertMany(recipes);

    const resources: PaxDeiResourceData[] = [];
    for (const entry of RESOURCE_LISTS) {
      const html = await safeFetchHtml(`${BASE}${entry.path}`);
      const resourceIdSet = new Set<string>();
      const addResourceIds = (pageHtml: string | null) => {
        if (!pageHtml) return;
        for (const id of extractResourceLinks(pageHtml, entry.type)) resourceIdSet.add(id);
      };
      addResourceIds(html);

      if (html) {
        let serverSearch = false;
        for (const value of SEARCH_PROBE_VALUES) {
          const probe = await safeFetchHtml(`${BASE}${entry.path}?search=${encodeURIComponent(value)}`);
          const before = resourceIdSet.size;
          addResourceIds(probe);
          if (resourceIdSet.size > before) serverSearch = true;
        }
        if (serverSearch) {
          for (const letter of SEARCH_LETTERS) {
            addResourceIds(await safeFetchHtml(`${BASE}${entry.path}?search=${encodeURIComponent(letter)}`));
          }
        }
      }

      const resourceIds = [...resourceIdSet];
      const rows = await mapConcurrent(resourceIds, async (resourceId) => {
        const pagePath =
          entry.type === "TREE"
            ? `/fr/trees/${resourceId}`
            : entry.type === "GATHERABLE"
              ? `/fr/gatherables/${resourceId}`
              : `/fr/mineables/${resourceId}`;
        const detail = await fetchHtml(`${BASE}${pagePath}`);
        return parseResource(detail, resourceId, entry.type);
      });
      resources.push(...rows);
    }
    await paxDeiResourceRepository.upsertMany(resources);

    const catalog: PaxDeiFactionCatalogData[] = [];
    const catalogSeen = new Set<string>();

    const add = (
      factionId: PaxDeiFactionCatalogData["factionId"],
      itemId: string,
      reason: PaxDeiFactionCatalogData["reason"],
      sourceId?: string,
    ) => {
      if (!itemId) return;
      const key = `${factionId}:${itemId}`;
      if (catalogSeen.has(key)) return;
      catalogSeen.add(key);
      catalog.push({
        factionId,
        itemId,
        reason,
        sourceId,
        enabled: true,
        syncedAt: new Date(),
      });
    };

    for (const recipe of recipes) {
      if (recipe.resultItemId) {
        add("guilde-des-artisans", recipe.resultItemId, "RECIPE_RESULT", recipe.recipeId);
      }
    }

    for (const resource of resources) {
      for (const drop of resource.drops) {
        add("domaine-du-chene", drop.itemId, "RESOURCE_DROP", resource.resourceId);
      }
    }

    // Les pages de matériaux de faction sont traitées comme un catalogue de reliques.
    // Cette page peut être temporairement limitée (HTTP 429). Dans ce cas, on
    // conserve le catalogue existant au lieu de l'effacer et on poursuit la
    // synchronisation des autres données.
    const relicIndex = await safeFetchHtml(`${BASE}/fr/materials/relics`);
    const relicsAvailable = Boolean(relicIndex);
    if (relicIndex) {
      const relicIds = extractItemIds(relicIndex);
      for (const itemId of relicIds) {
        add("confrerie-de-lepee", itemId, "FACTION_RELIC", "materials/relics");
      }
    } else {
      console.warn(
        "[PaxDei] Catalogue des reliques temporairement indisponible. Les associations existantes seront conservées.",
      );
    }

    if (catalog.length === 0) {
      throw new Error(
        "Synchronisation Pax Dei interrompue : aucun élément de catalogue n'a été détecté. Les associations existantes sont conservées.",
      );
    }

    // Si toutes les sources sont disponibles, on peut remplacer proprement
    // le catalogue synchronisé. Si les reliques sont temporairement limitées,
    // on ne purge surtout pas les anciennes associations de la Confrérie.
    if (relicsAvailable) {
      await paxDeiFactionCatalogRepository.resetSyncedCatalog();
    }
    await paxDeiFactionCatalogRepository.upsertMany(catalog);

    // S'assurer que le catalogue ne contient pas d'objets absents de la base locale.
    const localIds = new Set(await paxDeiItemsRepository.allItemIds());
    const missing = catalog.filter((entry) => !localIds.has(entry.itemId));
    if (missing.length) {
      console.warn(
        `[PaxDei] ${missing.length} entrées du catalogue ne sont pas présentes dans items.json.`,
      );
    }

    return {
      items,
      recipes: recipes.length,
      resources: resources.length,
      factionCatalog: catalog.length,
      durationMs: Date.now() - started,
    };
  }
}

export const paxDeiDataSyncService = new PaxDeiDataSyncService();