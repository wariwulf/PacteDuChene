import { randomBytes } from "crypto";
import { loreRepository } from "./lore.repository";
import { CreateLoreData } from "./lore.types";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function generateUniqueLoreId(title: string) {
  const baseId = slugify(title) || "lore";

  // On conserve un identifiant lisible basé sur le titre.
  // Si cet identifiant existe déjà, on lui ajoute un suffixe aléatoire.
  if (!(await loreRepository.findByLoreId(baseId))) {
    return baseId;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${baseId}-${randomBytes(3).toString("hex")}`;

    if (!(await loreRepository.findByLoreId(candidate))) {
      return candidate;
    }
  }

  throw new Error(
    "Impossible de générer un identifiant unique pour cette entrée de lore."
  );
}

export class LoreService {
  async getLore(includeDisabled = false) {
    return loreRepository.findAll(includeDisabled);
  }

  async getEntry(loreId: string) {
    const entry = await loreRepository.findByLoreId(loreId);
    if (!entry) throw new Error("Entrée de lore introuvable.");
    return entry;
  }

  async createEntry(data: CreateLoreData) {
    if (!data.title || !data.category || !data.content) {
      throw new Error("Le titre, la catégorie et le contenu sont obligatoires.");
    }

    const generatedId = await generateUniqueLoreId(data.title);

    return loreRepository.create({
      ...data,
      loreId: generatedId,
      enabled: data.enabled ?? true,
      order: data.order ?? 0,
    });
  }

  async updateEntry(loreId: string, data: Partial<CreateLoreData>) {
    if (!(await loreRepository.findByLoreId(loreId))) {
      throw new Error("Entrée de lore introuvable.");
    }

    // L'identifiant est volontairement immuable après création.
    const { loreId: _ignoredLoreId, ...safeData } = data;

    return loreRepository.update(loreId, safeData);
  }

  async deleteEntry(loreId: string) {
    if (!(await loreRepository.findByLoreId(loreId))) {
      throw new Error("Entrée de lore introuvable.");
    }

    await loreRepository.delete(loreId);
    return { deleted: true, loreId };
  }
}

export const loreService = new LoreService();