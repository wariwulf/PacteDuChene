export interface PaxDeiItemLocalizedNames {
  en?: string;
  fr?: string;
  de?: string;
  es?: string;
  [key: string]: string | undefined;
}

export interface PaxDeiItemData {
  _id?: string;
  itemId: string;
  name: string;
  names?: PaxDeiItemLocalizedNames;
  imageUrl?: string;
  externalUrl?: string;
  source: "gaming.tools";
  syncedAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaxDeiItemSearchParams {
  q?: string;
  lang?: string;
  limit?: number;
}
