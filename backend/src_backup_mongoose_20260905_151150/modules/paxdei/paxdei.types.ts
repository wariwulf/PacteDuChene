export type PaxDeiCombatRole = "TANK" | "HEAL" | "DPS";

export interface PaxDeiDiscipline {
  name: string;
  level: number;
}

export interface PaxDeiCharacterInput {
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  disciplines?: PaxDeiDiscipline[];
  // Legacy fields kept for backwards compatibility with old documents.
  mainProfession?: string;
  secondaryProfessions?: string[];
  combatRole?: PaxDeiCombatRole;
  specialization?: string;
  chronicleTitle?: string;
  chronicle?: string;
  isMainCharacter?: boolean;
}

export interface PaxDeiCharacterData extends PaxDeiCharacterInput {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaxDeiMarketListing {
  id?: string;
  itemId?: string;
  itemName: string;
  world?: string;
  region?: string;
  quantity?: number;
  price?: number;
  currency?: string;
  seller?: string;
}

export interface PaxDeiWorld {
  id?: string;
  name: string;
  region?: string;
}

export interface PaxDeiProvider {
  getMarketListings?(
    params?: Record<string, string>
  ): Promise<PaxDeiMarketListing[]>;

  getWorlds?(): Promise<PaxDeiWorld[]>;
}
