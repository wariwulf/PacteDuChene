import { paxDeiRepository } from "./paxdei.repository";
import { PaxDeiCharacterInput } from "./paxdei.types";

export class PaxDeiService {
  async getCharacters(memberId: string) {
    if (!memberId) {
      throw new Error("memberId requis");
    }

    return paxDeiRepository.findByMemberId(memberId);
  }

  async getCharacter(id: string) {
    const character = await paxDeiRepository.findById(id);

    if (!character) {
      throw new Error("Personnage Pax Dei introuvable");
    }

    return character;
  }

  async createCharacter(data: PaxDeiCharacterInput) {
    if (!data.memberId) {
      throw new Error("memberId requis");
    }

    if (!data.characterName) {
      throw new Error("Le nom du personnage est requis");
    }

    return paxDeiRepository.create(data);
  }

  async updateCharacter(
    id: string,
    data: Partial<PaxDeiCharacterInput>
  ) {
    const character = await paxDeiRepository.update(id, data);

    if (!character) {
      throw new Error("Personnage Pax Dei introuvable");
    }

    return character;
  }

  async deleteCharacter(id: string) {
    const character = await paxDeiRepository.delete(id);

    if (!character) {
      throw new Error("Personnage Pax Dei introuvable");
    }

    return character;
  }
}

export const paxDeiService = new PaxDeiService();
