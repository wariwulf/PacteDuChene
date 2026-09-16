import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BASE = "https://paxdei.gaming.tools/fr/recipes/";
const MAX_BUFFER = 12 * 1024 * 1024;

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&#(x?[0-9a-f]+);/gi, (_, raw: string) => { const code = raw.toLowerCase().startsWith("x") ? Number.parseInt(raw.slice(1),16) : Number.parseInt(raw,10); return Number.isFinite(code) ? String.fromCodePoint(code) : ""; });
}

function htmlToText(html: string): string {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, "\n").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim());
}

async function fetchHtml(url: string): Promise<string> {
  const command = process.platform === "win32" ? "curl.exe" : "curl";
  const args = ["-L", "-sS", "--compressed", "-A", "PacteDuChene/1.0", "-H", "Accept: text/html,application/xhtml+xml", "--max-time", "20", "-w", "\n__PACTE_HTTP_STATUS__:%{http_code}", url];
  const { stdout } = await execFileAsync(command, args, { maxBuffer: MAX_BUFFER, windowsHide: true });
  const marker = "__PACTE_HTTP_STATUS__:";
  const index = stdout.lastIndexOf(marker);
  const status = Number.parseInt(stdout.slice(index + marker.length).trim(), 10);
  const html = stdout.slice(0, index).trim();
  if (!Number.isFinite(status) || status < 200 || status >= 300 || !html) throw new Error(`Gaming.Tools a répondu HTTP ${status || "inconnu"}.`);
  return html;
}

export interface PaxDeiRecipeIngredient { name: string; quantity: number; }
export interface PaxDeiRecipe { recipeId: string; name: string; url: string; ingredients: PaxDeiRecipeIngredient[]; }

export async function getRecipeForItem(itemId: string): Promise<PaxDeiRecipe | null> {
  const safeId = String(itemId || "").trim();
  if (!safeId) return null;
  const recipeId = `recipe_${safeId}`;
  const url = `${BASE}${encodeURIComponent(recipeId)}`;
  let html: string;
  try { html = await fetchHtml(url); } catch { return null; }
  const text = htmlToText(html);
  const title = text.match(/(?:^|\n)#?\s*([^\n]+)\n\s*Image\b/i)?.[1]?.trim() || safeId;
  const start = text.search(/\bRequirements\b/i);
  const end = start >= 0 ? text.slice(start).search(/\bCrafted At\b/i) : -1;
  const section = start >= 0 ? text.slice(start, end >= 0 ? start + end : undefined) : "";
  const ingredients: PaxDeiRecipeIngredient[] = [];
  for (const line of section.split("\n")) {
    const clean = line.replace(/^Image:\s*/i, "").trim();
    const match = clean.match(/^(.+?)\s*\|\s*(\d+)$/);
    if (!match) continue;
    const name = match[1].replace(/^Image:\s*/i, "").trim();
    const quantity = Number(match[2]);
    if (!name || !Number.isFinite(quantity) || quantity < 1) continue;
    if (/^(Property|Required Skill|Difficulty|XP Multiplier|Unlock At Level)$/i.test(name)) continue;
    if (!ingredients.some((item) => item.name === name && item.quantity === quantity)) ingredients.push({ name, quantity });
  }
  return { recipeId, name: title, url, ingredients };
}
