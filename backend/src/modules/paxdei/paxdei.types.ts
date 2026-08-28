export interface PaxDeiCharacterInput {
  memberId: string;
  characterName: string;
  avatarId?: string;
  world?: string;
  province?: string;
  region?: string;
  clan?: string;
  mainProfession?: string;
  secondaryProfessions?: string[];
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
