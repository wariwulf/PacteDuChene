export interface LoreEntry {
  loreId: string;
  title: string;
  category: string;
  summary?: string;
  imageUrl?: string;
  content: string;
  enabled: boolean;
  order: number;
}
