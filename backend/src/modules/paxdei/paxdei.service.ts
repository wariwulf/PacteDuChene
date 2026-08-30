import { paxDeiRepository } from "./paxdei.repository";
import { PaxDeiCharacterInput, PaxDeiDiscipline } from "./paxdei.types";
import { isPaxDeiDisciplineName } from "./paxdei.disciplines";

function normalizeOptionalString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDisciplines(value: unknown): PaxDeiDiscipline[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const result: PaxDeiDiscipline[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const name = normalizeOptionalString((item as any).name);
    const level = Number((item as any).level);

    if (!isPaxDeiDisciplineName(name)) {
      throw new Error(`Discipline Pax Dei invalide : ${name || "nom manquant"}`);
    }
    if (!Number.isInteger(level) || level < 0 || level > 40) {
      throw new Error(`Niveau invalide pour la discipline « ${name} » (le niveau doit être compris entre 0 et 40).`);
    }
    if (seen.has(name)) {
      throw new Error(`La discipline « ${name} » est présente plusieurs fois.`);
    }

    seen.add(name);
    result.push({ name, level });
  }

  return result;
}

function normalizeLegacyDisciplines(data: any): PaxDeiDiscipline[] {
  if (Array.isArray(data?.disciplines) && data.disciplines.length) {
    return data.disciplines;
  }

  const legacy = [data?.mainProfession, ...(Array.isArray(data?.secondaryProfessions) ? data.secondaryProfessions : [])]
    .map(normalizeOptionalString)
    .filter(Boolean);

  const seen = new Set<string>();
  return legacy
    .filter((name) => isPaxDeiDisciplineName(name) && !seen.has(name) && seen.add(name))
    .map((name) => ({ name, level: 0 }));
}

function normalizeCharacterForOutput(character: any) {
  const obj = typeof character?.toObject === "function" ? character.toObject() : { ...character };
  if (!Array.isArray(obj.disciplines) || obj.disciplines.length === 0) {
    obj.disciplines = normalizeLegacyDisciplines(obj);
  }
  return obj;
}

export class PaxDeiService {
  async getCharacters(memberId: string) {
    if (!memberId) throw new Error("memberId requis");
    const characters = await paxDeiRepository.findByMemberId(memberId);
    return characters.map(normalizeCharacterForOutput);
  }

  async getCharacter(id: string) {
    const character = await paxDeiRepository.findById(id);
    if (!character) throw new Error("Personnage Pax Dei introuvable");
    return normalizeCharacterForOutput(character);
  }

  async createCharacter(data: PaxDeiCharacterInput) {
    if (!data.memberId) throw new Error("memberId requis");
    const characterName = normalizeOptionalString(data.characterName);
    if (!characterName) throw new Error("Le nom du personnage est requis");

    const payload: PaxDeiCharacterInput = {
      memberId: String(data.memberId).trim(),
      characterName,
      avatarId: normalizeOptionalString(data.avatarId),
      world: normalizeOptionalString(data.world),
      province: normalizeOptionalString(data.province),
      region: normalizeOptionalString(data.region),
      clan: normalizeOptionalString(data.clan),
      disciplines: normalizeDisciplines(data.disciplines),
      combatRole: data.combatRole,
      specialization: normalizeOptionalString(data.specialization),
      chronicleTitle: normalizeOptionalString(data.chronicleTitle),
      chronicle: normalizeOptionalString(data.chronicle),
      isMainCharacter: Boolean(data.isMainCharacter),
    };

    if (payload.isMainCharacter) await paxDeiRepository.clearMainCharacter(payload.memberId);
    return paxDeiRepository.create(payload);
  }

  async updateCharacter(id: string, data: Partial<PaxDeiCharacterInput>) {
    const existing = await paxDeiRepository.findById(id);
    if (!existing) throw new Error("Personnage Pax Dei introuvable");

    const payload: Partial<PaxDeiCharacterInput> = { ...data };
    delete payload.memberId;
    // The new system owns disciplines; old free-text profession fields are ignored.
    delete payload.mainProfession;
    delete payload.secondaryProfessions;

    if (payload.characterName !== undefined) {
      payload.characterName = normalizeOptionalString(payload.characterName);
      if (!payload.characterName) throw new Error("Le nom du personnage est requis");
    }
    for (const key of ["avatarId", "world", "province", "region", "clan", "specialization", "chronicleTitle", "chronicle"] as const) {
      if (payload[key] !== undefined) payload[key] = normalizeOptionalString(payload[key]);
    }
    if (payload.disciplines !== undefined) payload.disciplines = normalizeDisciplines(payload.disciplines);

    if (payload.isMainCharacter) await paxDeiRepository.clearMainCharacter(existing.memberId, id);
    return paxDeiRepository.update(id, payload);
  }

  async deleteCharacter(id: string) {
    const character = await paxDeiRepository.delete(id);
    if (!character) throw new Error("Personnage Pax Dei introuvable");
    return character;
  }
}

export const paxDeiService = new PaxDeiService();
