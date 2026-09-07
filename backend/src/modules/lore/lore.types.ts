export interface LoreDocument {
  loreId: string;
  title: string;
  category: string;
  summary?: string;
  imageUrl?: string;
  content: string;
  enabled: boolean;
  order: number;
}

export interface CreateLoreData {
  loreId?: string;
  title: string;
  category: string;
  summary?: string;
  imageUrl?: string;
  content: string;
  enabled?: boolean;
  order?: number;
}
